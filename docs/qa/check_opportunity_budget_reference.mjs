// Independent QA for #106; pinned main f75bdd14827bd6ea8555f6ca428132e91cff97c3.
// Baseline reproduces a defect, not a gameplay fix. Run: node docs/qa/check_opportunity_budget_reference.mjs
import {canonicalWorldJson as canonical,createAtomicMemoryStore as store,createWorldPersistenceReference as persistence} from "../../tools/world_persistence_reference.mjs";
import {createExecutionReference as executor} from "../../tools/npc_execution_reference.mjs";
import {createWorldSchedulerReference as scheduler} from "../../tools/world_scheduler_reference.mjs";
import {createPerceptionReference as perception} from "../../tools/npc_perception_reference.mjs";
import {createPlanningReference as planner} from "../../tools/npc_planning_reference.mjs";
import {generateNpcOpportunities as generate} from "../../tools/npc_opportunity_reference.mjs";
import {decideNpcReference as decide} from "../../tools/npc_cognition_reference.mjs";
import {createWorldTransactionReference as create} from "../../tools/world_transaction_reference.mjs";

function runDiagnostic({canonical,store,persistence,executor,scheduler,perception,planner,generate,decide,create}) {
 const checks=[], check=(name,pass)=>checks.push({name,pass:!!pass});
 const dims=(resources=0)=>({safety:0,resources,growth:0,connection:0,duty:0,rest:0});
 function run(n,caps=["work"]){
  const db=store(),faults=[];
  const dependencies={canonical,persistence,executor,scheduler,perception,planner,generate:(...args)=>{try{return generate(...args)}catch(e){faults.push(String(e));throw e}},decide};
  const offer=(a,t,r,k,act,opp,duration)=>({world_id:"W",actor_id:a,actor_revision:r,knowledge_revision:k,action_id:act,opportunity_id:opp,kind:"action",valid_until:t,feasible:true,exclusive_target:null,credit_cap:10,phases:[{kind:"execution",duration,cost:0,interruptible:true,credit_per_tick:1}]});
  const adapters={resolveOffer:(c,d)=>offer(c.actor_id,c.now,c.actor_revision,c.knowledge_revision,d.action_id,d.opportunity_id,1),projectOutcome:()=>null};
  const open=()=>create(db,dependencies,adapters,"opp-budget-qa");const p=open();
  p.initialize({world_id:"W",now:0,actors:["P","A"].map(actor_id=>({actor_id,revision:0,knowledge_revision:0,resources:100,life_status:"active"})),npc_configs:[{actor_id:"A",capabilities:caps,motivation:{risk_aversion:0,stress:0,needs:dims(10),values:dims(),goals:[]},plan:null}]},"P","fixture-seed");
  const commit=cmd=>{const r=p.recover().revision;return p.commit("t"+r,r,cmd)};
  commit({kind:"observe",frame:{world_id:"W",tick:0,actors:[{actor_id:"A",world_id:"W",can_acquire:true,present:true,in_range:true,detected:true,path_clear:true}],event:{id:"obs",world_id:"W",tick:0,committed:true,channel:"direct",observable_claims:Array.from({length:n},(_,i)=>({key:"opp:shift:S"+String(i).padStart(3,"0"),value:"open"}))}}});
  commit({kind:"schedule",event:{id:"r",world_id:"W",tick:2,kind:"review",actor_id:"A",interval:10}});
  commit({kind:"publish",offer:offer("P",0,0,0,"work","work",4)});
  commit({kind:"submit",submission:{kind:"start",submission_id:"s",horizon:4,attempt_id:"p1",intent:{kind:"intent",world_id:"W",actor_id:"P",actor_revision:0,knowledge_revision:0,decision_tick:0,opportunity_id:"work",action_id:"work",disposition:"action"}}});
  const before=db.read(),rev=p.recover().revision,errors=[];
  for(let i=0;i<2&&p.recover().checkpoint.scheduler.view.submission_active;i++){try{commit({kind:"run",budget:100})}catch(e){errors.push(String(e))}}
  const c=p.recover().checkpoint;
  return {n,caps,errors,faults,unchanged:before===db.read(),revision:p.recover().revision,beforeRevision:rev,now:c.executor.now,active:c.scheduler.view.submission_active,outcomes:c.executor.outcomes.map(x=>({actor:x.actor_id,outcome:x.outcome})),reopen:canonical(open().recover().checkpoint)===canonical(c)};
 }
 const a=run(64),b=run(65),c=run(63,["work","rest"]),d=run(64,["work","rest"]);
 const complete=x=>x.now===4&&!x.active&&x.outcomes.length===2&&x.outcomes.every(y=>y.outcome==="completed")&&!x.errors.length&&x.revision===x.beforeRevision+1;
 const blocked=x=>x.now===0&&x.active&&x.outcomes.length===0&&x.errors.length===2&&x.errors.every(e=>e.includes("scheduler fault"))&&x.faults.length===2&&x.faults.every(e=>e.includes("opportunity budget exceeded"))&&x.unchanged&&x.revision===x.beforeRevision;
 check("64 jobs complete normally",complete(a));check("63 jobs plus rest complete normally",complete(c));
 check("65 jobs reproduce world stall on retry",blocked(b));check("64 jobs plus rest reproduce world stall",blocked(d));
 check("all four exact checkpoints reopen", [a,b,c,d].every(x=>x.reopen));
 // Reference control only: fixed V1 independent scoring makes the best of batch winners
 // equal to the global best. This does not fix generation, plan filtering, or actual admission.
 const p={world_id:"W",actor_id:"A",actor_revision:0,now:0,life_status:"active",risk_aversion:0,stress:0,needs:dims(10),values:dims(),goals:[]};
 const k={schema_version:"0.1-proposal",world_id:"W",actor_id:"A",as_of_tick:0,revision:0,observations:[]};
 const o=(id,benefit)=>({id,world_id:"W",actor_id:"A",kind:"action",action_id:"work",goal_ids:[],effects:dims(benefit),risk:0,effort:1,requirements:[],perceived_feasible:true,valid_until:0});
 function reduce(rows,size){let winners=[];for(let i=0;i<rows.length;i+=size){const batch=rows.slice(i,i+size),d=decide(p,k,batch);if(d.kind==="intent")winners.push(batch.find(x=>x.id===d.opportunity_id))}return winners.length>64?reduce(winners,64):decide(p,k,winners)}
 const rows=Array.from({length:130},(_,i)=>o("A"+String(i).padStart(3,"0"),1));rows[129]=o("Z-last-best",10);
 check("batch reduction preserves best candidate beyond 64",reduce(rows,64).opportunity_id==="Z-last-best");
 check("batch sizes and reversed order preserve winner",[1,2,7,32,64].every(n=>reduce(rows,n).opportunity_id==="Z-last-best"&&reduce([...rows].reverse(),n).opportunity_id==="Z-last-best"));
 const ties=rows.map(x=>o(x.id,1));
 check("global lexical tie unchanged across batches",reduce(ties,64).opportunity_id==="A000"&&reduce([...ties].reverse(),7).opportunity_id==="A000");
 check("nonpositive candidate stream permits wait",reduce(rows.map(x=>o(x.id,0)),64).kind==="wait");
 return {checks,observed:[a,b,c,d]};
}
const result=runDiagnostic({canonical,store,persistence,executor,scheduler,perception,planner,generate,decide,create});
for(const c of result.checks)console.log(c.pass?"PASS":"FAIL",c.name);
console.log(JSON.stringify(result.observed));
if(result.checks.some(c=>!c.pass))process.exitCode=1;
