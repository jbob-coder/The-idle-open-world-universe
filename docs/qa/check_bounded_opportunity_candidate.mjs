// Review-only unplanned NPC integration candidate for #106, A54 target.
// Derived from exact V1 generator blob 2bb3402fe3f589d53604fd5d99c5c8657ef11ddf.
// Not a production patch; only valid for independent fixed-score decisions, NEVER planner inputs.
// Keeps at most 63 fresh opportunities + one prior winner at scoring boundary.
// Discovery map and repeated knowledge scans remain unbounded by this scoring limit.
// Host QA only; no Android timing, memory, or battery claim. No gameplay gate override.
// Run from repo root: node docs/qa/check_bounded_opportunity_candidate.mjs
import {canonicalWorldJson as canonical,createAtomicMemoryStore as store,createWorldPersistenceReference as persistence} from "../../tools/world_persistence_reference.mjs";
import {createExecutionReference as executor} from "../../tools/npc_execution_reference.mjs";
import {createWorldSchedulerReference as scheduler} from "../../tools/world_scheduler_reference.mjs";
import {createPerceptionReference as perception} from "../../tools/npc_perception_reference.mjs";
import {createPlanningReference as planner} from "../../tools/npc_planning_reference.mjs";
import {generateNpcOpportunities as generate} from "../../tools/npc_opportunity_reference.mjs";
import {decideNpcReference as decide} from "../../tools/npc_cognition_reference.mjs";
import {createWorldTransactionReference as create} from "../../tools/world_transaction_reference.mjs";
// Development reference only; catalog estimates and freshness are provisional.
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
function selectUnplannedCandidate(profile,knowledge,self,decideCandidate,metrics){
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
   const d=decideCandidate(profile,knowledge,batch);
   winner=d.kind==="intent"?batch.find(x=>x.id===d.opportunity_id):null;
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

function runDiagnostic({canonical,store,persistence,executor,scheduler,perception,planner,generate,decide,create}) {
 const checks=[], check=(name,pass)=>checks.push({name,pass:!!pass});
 const dims=(resources=0)=>({safety:0,resources,growth:0,connection:0,duty:0,rest:0});
 function run(n,caps=["work"],useCandidate=false,budget=100,reverse=false){
  const db=store(),faults=[],metrics={generated:0,maxScoreBatch:0};
  const dependencies={canonical,persistence,executor,scheduler,perception,planner,generate:(...args)=>{try{return useCandidate?selectUnplannedCandidate(...args,decide,metrics):generate(...args)}catch(e){faults.push(String(e));throw e}},decide};
  const offer=(a,t,r,k,act,opp,duration)=>({world_id:"W",actor_id:a,actor_revision:r,knowledge_revision:k,action_id:act,opportunity_id:opp,kind:"action",valid_until:t,feasible:true,exclusive_target:null,credit_cap:10,phases:[{kind:"execution",duration,cost:0,interruptible:true,credit_per_tick:1}]});
  const adapters={resolveOffer:(c,d)=>offer(c.actor_id,c.now,c.actor_revision,c.knowledge_revision,d.action_id,d.opportunity_id,1),projectOutcome:()=>null};
  const open=()=>create(db,dependencies,adapters,"opp-budget-qa");const p=open();
  p.initialize({world_id:"W",now:0,actors:["P","A"].map(actor_id=>({actor_id,revision:0,knowledge_revision:0,resources:100,life_status:"active"})),npc_configs:[{actor_id:"A",capabilities:caps,motivation:{risk_aversion:0,stress:0,needs:dims(10),values:dims(),goals:[]},plan:null}]},"P","fixture-seed");
  const commit=cmd=>{const r=p.recover().revision;return p.commit("t"+r,r,cmd)};
  const claims=Array.from({length:n},(_,i)=>({key:"opp:shift:S"+String(i).padStart(4,"0"),value:"open"}));if(reverse)claims.reverse();
  for(let offset=0;offset<n;offset+=100)commit({kind:"observe",frame:{world_id:"W",tick:0,actors:[{actor_id:"A",world_id:"W",can_acquire:true,present:true,in_range:true,detected:true,path_clear:true}],event:{id:"obs"+offset,world_id:"W",tick:0,committed:true,channel:"direct",observable_claims:claims.slice(offset,offset+100)}}});
  commit({kind:"schedule",event:{id:"r",world_id:"W",tick:2,kind:"review",actor_id:"A",interval:10}});
  commit({kind:"publish",offer:offer("P",0,0,0,"work","work",4)});
  commit({kind:"submit",submission:{kind:"start",submission_id:"s",horizon:4,attempt_id:"p1",intent:{kind:"intent",world_id:"W",actor_id:"P",actor_revision:0,knowledge_revision:0,decision_tick:0,opportunity_id:"work",action_id:"work",disposition:"action"}}});
  const before=db.read(),rev=p.recover().revision,errors=[];
  let last=null;
  for(let i=0;i<(useCandidate?100:2)&&p.recover().checkpoint.scheduler.view.submission_active;i++){try{last=p.recover().revision;commit({kind:"run",budget})}catch(e){errors.push(String(e))}}
  const priorRetry=db.read(),retry=errors.length===0&&last!==null&&open().commit("t"+last,last,{kind:"run",budget}).replayed&&db.read()===priorRetry;
  const c=p.recover().checkpoint;
  return {n,caps,errors,faults,metrics,retry,checkpoint:c,unchanged:before===db.read(),revision:p.recover().revision,beforeRevision:rev,now:c.executor.now,active:c.scheduler.view.submission_active,outcomes:c.executor.outcomes.map(x=>({actor:x.actor_id,outcome:x.outcome})),reopen:canonical(open().recover().checkpoint)===canonical(c)};
 }

 const a=run(64),b=run(65),c=run(64,["work"],true),d=run(65,["work"],true),e=run(128,["work","rest"],true),f=run(1000,["work","rest"],true),g=run(128,["work","rest"],true,1),h=run(128,["work","rest"],true,100,true);
 const complete=x=>x.now===4&&!x.active&&x.outcomes.length===2&&x.outcomes.every(y=>y.outcome==="completed")&&!x.errors.length;
 check("original 64 candidate boundary succeeds",complete(a));
 check("original 65 candidate boundary still faults atomically",b.errors.length===2&&b.unchanged&&b.now===0&&b.active&&b.outcomes.length===0);
 check("candidate matches exact original 64 checkpoint",complete(c)&&canonical(a.checkpoint)===canonical(c.checkpoint));
 check("candidate restores 65 opportunity world progress",complete(d));
 check("128 discovered jobs plus rest complete",complete(e)&&e.metrics.generated>=129);
 check("1000 discovered jobs plus rest complete",complete(f)&&f.metrics.generated>=1001);
 check("scoring input stays at or below 64 for every candidate run",[c,d,e,f,g,h].every(x=>x.metrics.maxScoreBatch>0&&x.metrics.maxScoreBatch<=64));
 check("technical budget 1 preserves candidate checkpoint",complete(g)&&canonical(e.checkpoint)===canonical(g.checkpoint));
 check("reversed observations preserve selected outcome",complete(h)&&canonical(e.outcomes)===canonical(h.outcomes));
 check("all candidate checkpoints reopen and exact retry is idempotent",[c,d,e,f,g,h].every(x=>x.reopen&&x.retry));
 // Actual generator enumeration puts local rest first, then all shifts, then study.
 // A later distinct action can outrank earlier jobs; no lexical truncation.
 const p={world_id:"W",actor_id:"A",actor_revision:0,now:0,life_status:"active",risk_aversion:0,stress:0,needs:{...dims(),growth:10},values:dims(),goals:[]};
 const k={schema_version:"0.1-proposal",world_id:"W",actor_id:"A",as_of_tick:0,revision:2,observations:[{id:"o1",acquired_tick:0,channel:"direct",claims:Array.from({length:100},(_,i)=>({key:"opp:shift:S"+i,value:"open"}))},{id:"o2",acquired_tick:0,channel:"direct",claims:[{key:"opp:lesson:LAST",value:"open"}]}]};
 const self={world_id:"W",actor_id:"A",actor_revision:0,as_of_tick:0,capabilities:["work","study"]};
 const metric={generated:0,maxScoreBatch:0};const selected=selectUnplannedCandidate(p,k,self,decide,metric);
 check("later stronger study candidate wins over all 100 earlier jobs",selected.length===1&&selected[0].id==="study__LAST"&&metric.generated===101&&metric.maxScoreBatch<=64);
 const conflict={...k,observations:[...k.observations,{id:"o3",acquired_tick:0,channel:"direct",claims:[{key:"opp:lesson:LAST",value:"closed"}]}]};
 check("conflicting evidence excludes late candidate",!selectUnplannedCandidate(p,conflict,self,decide,{generated:0,maxScoreBatch:0}).some(x=>x.id==="study__LAST"));
 check("all expired discoveries yield wait",selectUnplannedCandidate({...p,now:11},k,{...self,as_of_tick:11},decide,{generated:0,maxScoreBatch:0}).length===0);
 return {checks,observed:[a,b,c,d,e,f,g,h].map(({checkpoint,...rest})=>rest)};
}

const result=runDiagnostic({canonical,store,persistence,executor,scheduler,perception,planner,generate,decide,create});
for(const c of result.checks)console.log(c.pass?"PASS":"FAIL",c.name);
console.log(JSON.stringify(result.observed));
if(result.checks.some(c=>!c.pass))process.exitCode=1;
