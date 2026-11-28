// Review-level reference implementation for #106. Not production; same immutable actor/knowledge/plan snapshot throughout selection.
// Retain outer actual planner admission recheck. Scoring batches <=64; discovery index and repeated knowledge scans remain separate costs.
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
export function selectPlanAwareCandidate(profile,knowledge,self,decideCandidate,metrics,plan=null){
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
 const discovered=new Map(),obsIds=new Set();
 const sourceTypes=new Set(catalog.filter(a=>a.source!=="self").map(a=>a.source));
 for(const o of knowledge.observations){
   ensure(o&&id(o.id)&&!obsIds.has(o.id)&&tick(o.acquired_tick)&&o.acquired_tick<=knowledge.as_of_tick&&channels.includes(o.channel)&&Array.isArray(o.claims)&&o.claims.length<=100,"invalid observation");
   obsIds.add(o.id);
   for(const c of o.claims){
     ensure(c&&typeof c.key==="string"&&c.key.length>0&&c.key.length<=128&&typeof c.value==="string"&&c.value.length>0&&c.value.length<=2000,"invalid claim");
     const m=/^opp:([a-z]+):([A-Za-z0-9_-]{1,32})$/.exec(c.key);
     if(!m||!sourceTypes.has(m[1]))continue;
     const entry=discovered.get(c.key)||{source:m[1],target:m[2],rows:[]};
     entry.rows.push({value:c.value,channel:o.channel,tick:o.acquired_tick});
     discovered.set(c.key,entry);
   }
 }
 if(profile.life_status!=="active")return [];
 const output=[],caps=new Set(self.capabilities);
 let winner=null;
 const flush=()=>{
   if(!output.length)return;
   const batch=winner===null?output:[winner,...output];
   metrics.maxScoreBatch=Math.max(metrics.maxScoreBatch,batch.length);
   const d=plan===null?decideCandidate(profile,knowledge,batch):plan.review(profile,knowledge,batch).decision;
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
   for(const [key,e] of discovered){
     if(e.source!==a.source)continue;
     const permitted=["direct","report","record"];
     const open=e.rows.filter(r=>r.value==="open"&&permitted.includes(r.channel));
     if(!open.length)continue;
     // Prototype evidence freshness, not actual duration or an objective expiry guarantee.
     const newest=open.reduce((t,r)=>Math.max(t,r.tick),0);
     const until=Math.min(Number.MAX_SAFE_INTEGER,newest+10);
     if(until<profile.now)continue;
     const conflict=e.rows.some(r=>r.value!=="open");
     if(a.mode==="confirmed"&&conflict)continue;
     make(a,e.target,a.mode==="confirmed"?[{key,value:"open",channels:[...permitted]}]:[],until);
   }
 }
 flush();return winner===null?[]:[winner];
}

