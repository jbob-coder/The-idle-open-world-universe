// Review-level bounded decision index for #106; derived from cognition blob fa6fbada18f89efa10f013dccd66f49d226ae697 and prior #93 selector.
// No persistent cache, no history pruning, no public projection. A synchronous trusted snapshot scope only.
// Development-only reference, not production NPC behavior or balanced formulas.
function prepareDecision(profile,knowledge,metrics,strictIds){
  // Trusted caller supplies only the actor's projected profile, knowledge and opportunities.
  const id=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,64}$/.test(x);
  const tick=x=>Number.isSafeInteger(x)&&x>=0;
  const bounded=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
  const exact=(o,keys)=>o!==null&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
  const ensure=(ok,reason)=>{if(!ok)throw Error(reason)};
  const dimensions=["safety","resources","growth","connection","duty","rest"];
  ensure(exact(profile,["world_id","actor_id","actor_revision","now","life_status","risk_aversion","stress","needs","values","goals"]),"invalid profile fields");
  ensure(id(profile.world_id)&&id(profile.actor_id)&&tick(profile.actor_revision)&&tick(profile.now)&&profile.now<Number.MAX_SAFE_INTEGER,"invalid profile scope");
  ensure(["active","incapacitated","deceased"].includes(profile.life_status)&&bounded(profile.risk_aversion,0,10)&&bounded(profile.stress,0,10),"invalid condition");
  for(const group of [profile.needs,profile.values])ensure(exact(group,dimensions)&&dimensions.every(k=>bounded(group[k],0,10)),"invalid motivation vector");
  ensure(Array.isArray(profile.goals)&&profile.goals.length<=64,"goal budget");
  const goals=new Map();
  for(const g of profile.goals){
    ensure(exact(g,["id","dimension","status","urgency"])&&id(g.id)&&!goals.has(g.id)&&dimensions.includes(g.dimension)&&["active","deferred","blocked","achieved","abandoned"].includes(g.status)&&bounded(g.urgency,0,10),"invalid goal");
    goals.set(g.id,g);
  }
  ensure(knowledge&&knowledge.schema_version==="0.1-proposal"&&knowledge.world_id===profile.world_id&&knowledge.actor_id===profile.actor_id&&tick(knowledge.as_of_tick)&&knowledge.as_of_tick<=profile.now&&tick(knowledge.revision)&&Array.isArray(knowledge.observations),"knowledge scope");
  ensure(knowledge.observations.length<=10000,"observation budget");
  const observed=new Map(),obsIds=new Set();metrics.indexBuilds++;
  for(const o of knowledge.observations){
    ensure(o&&typeof o.id==="string"&&(!strictIds||id(o.id))&&!obsIds.has(o.id)&&tick(o.acquired_tick)&&o.acquired_tick<=knowledge.as_of_tick&&["direct","report","record","internal"].includes(o.channel)&&Array.isArray(o.claims)&&o.claims.length<=100,"invalid observation");
    obsIds.add(o.id);metrics.observationVisits++;
    for(const c of o.claims){
      ensure(c&&typeof c.key==="string"&&c.key.length>0&&c.key.length<=128&&typeof c.value==="string"&&c.value.length>0&&c.value.length<=2000,"invalid claim");
      metrics.claimVisits++;
      let e=observed.get(c.key);
      if(!e){e={value:c.value,conflict:false,channels:new Set(),newestOpen:null};observed.set(c.key,e);}
      if(e.value!==c.value)e.conflict=true;
      e.channels.add(o.channel);
      if(c.value==="open"&&o.channel!=="internal")e.newestOpen=e.newestOpen===null?o.acquired_tick:Math.max(e.newestOpen,o.acquired_tick);
    }
  }
  metrics.maxIndexedKeys=Math.max(metrics.maxIndexedKeys,observed.size);
  // The private scope binds one immutable trusted snapshot. Copy only the small profile,
  // not the history; retain no references to individual observation records.
  profile=JSON.parse(JSON.stringify(profile));const revision=knowledge.revision;
  const decide=opportunities=>{
  metrics.scoreCalls++;
  ensure(Array.isArray(opportunities)&&opportunities.length<=64,"opportunity budget");
  const seen=new Set(),evaluated=[];
  for(const o of opportunities){
    ensure(exact(o,["id","world_id","actor_id","kind","action_id","goal_ids","effects","risk","effort","requirements","perceived_feasible","valid_until"])&&id(o.id)&&!seen.has(o.id)&&o.world_id===profile.world_id&&o.actor_id===profile.actor_id,"invalid opportunity scope");
    seen.add(o.id);
    ensure(["action","refusal"].includes(o.kind)&&id(o.action_id)&&Array.isArray(o.goal_ids)&&o.goal_ids.length<=64&&new Set(o.goal_ids).size===o.goal_ids.length&&o.goal_ids.every(g=>goals.has(g)),"invalid opportunity goals");
    ensure(exact(o.effects,dimensions)&&dimensions.every(k=>bounded(o.effects[k],-10,10))&&bounded(o.risk,0,10)&&bounded(o.effort,0,10)&&typeof o.perceived_feasible==="boolean"&&tick(o.valid_until),"invalid opportunity estimates");
    ensure(Array.isArray(o.requirements)&&o.requirements.length<=16,"requirement budget");
    for(const r of o.requirements)ensure(exact(r,["key","value","channels"])&&typeof r.key==="string"&&r.key.length>0&&r.key.length<=128&&typeof r.value==="string"&&r.value.length>0&&r.value.length<=2000&&Array.isArray(r.channels)&&r.channels.length>0&&r.channels.length<=4&&new Set(r.channels).size===r.channels.length&&r.channels.every(c=>["direct","report","record","internal"].includes(c)),"invalid requirement");
    if(profile.life_status!=="active"||!o.perceived_feasible||o.valid_until<profile.now)continue;
    // Contextual claim keys must distinguish subject, time and meaning. Conflicts remain uncertain.
    const supported=o.requirements.every(r=>{
      const e=observed.get(r.key);
      return !!e&&!e.conflict&&e.value===r.value&&r.channels.some(channel=>e.channels.has(channel));
    });
    if(!supported)continue;
    // Prototype integer weights, not gameplay constants. Active goal pressure is not a hard obligation.
    const goalPressure=new Map(dimensions.map(k=>[k,0]));
    for(const gid of o.goal_ids){const g=goals.get(gid);if(g.status==="active")goalPressure.set(g.dimension,Math.max(goalPressure.get(g.dimension),g.urgency))}
    const score=dimensions.reduce((s,k)=>s+o.effects[k]*(profile.needs[k]+profile.values[k]+goalPressure.get(k)),0)-o.risk*(profile.risk_aversion+profile.stress)-o.effort;
    evaluated.push({id:o.id,kind:o.kind,action_id:o.action_id,score});
  }
  // Deterministic tie resolution independent of supplied ordering. No shared RNG or hidden world lookup.
  evaluated.sort((a,b)=>b.score-a.score||(a.id<b.id?-1:a.id>b.id?1:0));
  const base={world_id:profile.world_id,actor_id:profile.actor_id,actor_revision:profile.actor_revision,knowledge_revision:revision,decision_tick:profile.now};
  if(profile.life_status!=="active")return {...base,kind:"inactive"};
  const best=evaluated[0];
  if(!best||best.score<=0)return {...base,kind:"wait",review_after_tick:profile.now+1};
  return {...base,kind:"intent",opportunity_id:best.id,action_id:best.action_id,disposition:best.kind};
  };
  // Only derived discovery fields leave this closure, never the actual record map.
  function* discoveries(){for(const [key,e] of observed)yield {key,newestOpen:e.newestOpen,conflict:e.conflict};}
  return {decide,discoveries};
}


export function createIndexedDecisionScope(){
 const metrics={indexBuilds:0,observationVisits:0,claimVisits:0,maxIndexedKeys:0,scoreCalls:0};
 let current=null;
 // Internal synchronous use only. The coordinator must keep profile/knowledge/plan
 // unchanged for this callback; do not retain the supplied discovery iterator.
 function withSnapshot(profile,knowledge,fn){
  if(current!==null)throw Error("nested decision scope");
  const prepared=prepareDecision(profile,knowledge,metrics,true);
  current={profile,knowledge,prepared};
  try{
   const result=fn(prepared.discoveries);
   if(result&&typeof result.then==="function")throw Error("asynchronous decision scope");
   return result;
  }finally{current=null}
 }
 function decide(profile,knowledge,opportunities){
  if(current!==null){
   if(current.profile!==profile||current.knowledge!==knowledge)throw Error("foreign decision snapshot");
   return current.prepared.decide(opportunities);
  }
  return prepareDecision(profile,knowledge,metrics,false).decide(opportunities);
 }
 return Object.freeze({decide,withSnapshot,metrics:()=>({...metrics})});
}

function candidateCatalog(){
 const effects=(v={})=>({safety:0,resources:0,growth:0,connection:0,duty:0,rest:0,...v});
 const local=(id,capability,e,risk,effort)=>({id,source:"self",capability,kind:"action",mode:"local",effects:effects(e),risk,effort});
 const discovered=(id,source,capability,e,risk,effort,mode="confirmed",kind="action")=>({id,source,capability,kind,mode,effects:effects(e),risk,effort});
 return [
 local("rest","rest",{rest:7,safety:1},0,0),
 local("look","observe",{growth:2,safety:1},0,1),
 local("practice","practice",{growth:4,rest:-1},1,2),
 discovered("work","shift","work",{resources:6,duty:3,rest:-2},1,2),
 discovered("apply","job","communicate",{resources:4,growth:2},1,2),
 discovered("study","lesson","study",{growth:6,rest:-1},0,2),
 discovered("talk","person","communicate",{connection:5},1,1),
 discovered("travel","route","move",{growth:2,rest:-1},2,2),
 discovered("inspect_rift","rift","observe",{growth:4,safety:3},1,2,"investigate"),
 discovered("enter_rift","rift","move",{growth:8,safety:-2,rest:-2},6,3),
 discovered("accept_offer","offer","communicate",{resources:3,connection:2,duty:1},2,1),
 discovered("decline_offer","offer","communicate",{safety:3,rest:2,connection:-1},0,1,"confirmed","refusal"),
 discovered("inspect_job","job","observe",{growth:3,safety:2},0,1,"investigate")
 ];
}
export function selectIndexedPlanCandidate(profile,knowledge,self,scope,metrics,plan=null){
 const ensure=(v,msg)=>{if(!v)throw Error(msg)};
 const id=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,64}$/.test(x);
 const tick=x=>Number.isSafeInteger(x)&&x>=0;
 const exact=(o,keys)=>o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
 const channels=["direct","report","record","internal"];
 const dimensions=["safety","resources","growth","connection","duty","rest"];
 ensure(profile&&id(profile.world_id)&&id(profile.actor_id)&&tick(profile.actor_revision)&&tick(profile.now)&&profile.now<Number.MAX_SAFE_INTEGER&&["active","incapacitated","deceased"].includes(profile.life_status),"invalid profile scope");
 ensure(Array.isArray(profile.goals)&&profile.goals.length<=64,"goal budget");
 const goalIds=new Set();
 for(const g of profile.goals){ensure(g&&id(g.id)&&!goalIds.has(g.id)&&dimensions.includes(g.dimension)&&["active","deferred","blocked","achieved","abandoned"].includes(g.status)&&Number.isInteger(g.urgency)&&g.urgency>=0&&g.urgency<=10,"invalid goal");goalIds.add(g.id)}
 ensure(exact(self,["world_id","actor_id","actor_revision","as_of_tick","capabilities"])&&self.world_id===profile.world_id&&self.actor_id===profile.actor_id&&self.actor_revision===profile.actor_revision&&self.as_of_tick===profile.now,"self projection scope");
 const catalog=candidateCatalog(), knownCaps=new Set(catalog.map(a=>a.capability));
 ensure(Array.isArray(self.capabilities)&&self.capabilities.length<=knownCaps.size&&new Set(self.capabilities).size===self.capabilities.length&&self.capabilities.every(c=>knownCaps.has(c)),"invalid capability list");
 ensure(knowledge&&knowledge.schema_version==="0.1-proposal"&&knowledge.world_id===profile.world_id&&knowledge.actor_id===profile.actor_id&&tick(knowledge.as_of_tick)&&knowledge.as_of_tick<=profile.now&&tick(knowledge.revision)&&Array.isArray(knowledge.observations)&&knowledge.observations.length<=10000,"knowledge scope");
 return scope.withSnapshot(profile,knowledge,discoveries=>{
 const discoveredBySource=new Map();
 const sourceTypes=new Set(catalog.filter(a=>a.source!=="self").map(a=>a.source));
 for(const e of discoveries()){
   const m=/^opp:([a-z]+):([A-Za-z0-9_-]{1,32})$/.exec(e.key);
   if(!m||!sourceTypes.has(m[1])||e.newestOpen===null)continue;
   const list=discoveredBySource.get(m[1])??[];
   list.push({...e,target:m[2]});discoveredBySource.set(m[1],list);
 }
 if(profile.life_status!=="active")return [];
 const output=[],caps=new Set(self.capabilities);
 let winner=null;
 const flush=()=>{
   if(!output.length)return;
   const batch=winner===null?output:[winner,...output];
   metrics.maxScoreBatch=Math.max(metrics.maxScoreBatch,batch.length);
   const d=plan===null?scope.decide(profile,knowledge,batch):plan.review(profile,knowledge,batch).decision;
   winner=d?.kind==="intent"?batch.find(x=>x.id===d.opportunity_id):null;
   output.length=0;
 };
 const make=(a,target,requirements,until)=>{
   const goal_ids=profile.goals.filter(g=>g.status==="active"&&a.effects[g.dimension]>0).map(g=>g.id).sort();
   output.push({id:target===null?a.id:`${a.id}__${target}`,world_id:profile.world_id,actor_id:profile.actor_id,kind:a.kind,action_id:a.id,goal_ids,effects:{...a.effects},risk:a.risk,effort:a.effort,requirements,perceived_feasible:true,valid_until:until});
   metrics.generated++;
   // Reserve one of the 64 scoring slots for the prior winner.
   if(output.length===63)flush();
 };
 for(const a of catalog){
   if(!caps.has(a.capability))continue;
   if(a.mode==="local"){make(a,null,[],profile.now);continue}
   for(const e of discoveredBySource.get(a.source)??[]){
     const key=e.key,permitted=["direct","report","record"];
     const until=Math.min(Number.MAX_SAFE_INTEGER,e.newestOpen+10);
     if(until<profile.now)continue;
     if(a.mode==="confirmed"&&e.conflict)continue;
     make(a,e.target,a.mode==="confirmed"?[{key,value:"open",channels:[...permitted]}]:[],until);
   }
 }
 flush();return winner===null?[]:[winner];
 });
}

