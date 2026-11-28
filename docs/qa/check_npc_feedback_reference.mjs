// Independent QA diagnostic for issue #90, pinned baseline f75bdd14827bd6ea8555f6ca428132e91cff97c3.
// No production gameplay, real saves, or new canon. Review by 01/02 required.
// Run from repository root: node docs/qa/check_npc_feedback_reference.mjs
// --require-feedback deliberately fails on V1. Do not enable in CI before review.
// Fixture ticks and generic resources are synthetic, not biological rates or Credits.
import {canonicalWorldJson as canonical,createAtomicMemoryStore as store,createWorldPersistenceReference as persistence} from "../../tools/world_persistence_reference.mjs";
import {createExecutionReference as executor} from "../../tools/npc_execution_reference.mjs";
import {createWorldSchedulerReference as scheduler} from "../../tools/world_scheduler_reference.mjs";
import {createPerceptionReference as perception} from "../../tools/npc_perception_reference.mjs";
import {createPlanningReference as planner} from "../../tools/npc_planning_reference.mjs";
import {generateNpcOpportunities as generate} from "../../tools/npc_opportunity_reference.mjs";
import {decideNpcReference as decide} from "../../tools/npc_cognition_reference.mjs";

function runDiagnostic({canonical,store,persistence,executor,scheduler,perception,planner,generate,decide,create}){
 const dims=(rest=0,growth=0)=>({safety:0,resources:0,growth,connection:0,duty:0,rest});
 const same=(a,b)=>canonical(a)===canonical(b);
 const checks=[];
 const check=(name,pass)=>{checks.push({name,pass:!!pass})};
 function scenario(needs,feasible=true,budget=100){
  const db=store(),samples=new Map();
  const offer=(a,t,r,k,act,opp,duration,cost)=>({world_id:"W",actor_id:a,actor_revision:r,knowledge_revision:k,action_id:act,opportunity_id:opp,kind:"action",valid_until:t,feasible:a==="P"||feasible,exclusive_target:null,credit_cap:10,phases:[{kind:"execution",duration,cost,interruptible:true,credit_per_tick:1}]});
  const dependencies={canonical,persistence,executor,scheduler,perception,planner,generate,decide:(p,k,o)=>{
   const d=decide(p,k,o);
   if(p.actor_id==="A")samples.set(p.now+":"+p.actor_revision,{tick:p.now,revision:p.actor_revision,rest:p.needs.rest,growth:p.needs.growth,action:d.action_id??null});
   return d;
  }};
  const adapters={resolveOffer:(c,d)=>offer(c.actor_id,c.now,c.actor_revision,c.knowledge_revision,d.action_id,d.opportunity_id,1,1),projectOutcome:()=>null};
  const open=()=>create(db,dependencies,adapters,"feedback-qa");
  const p=open();
  p.initialize({world_id:"W",now:0,actors:["P","A"].map(actor_id=>({actor_id,revision:0,knowledge_revision:0,resources:100,life_status:"active"})),npc_configs:[{actor_id:"A",capabilities:["rest","practice"],motivation:{risk_aversion:0,stress:0,needs,values:dims(),goals:[]},plan:null}]},"P","synthetic-seed");
  const commit=cmd=>{const n=p.recover().revision;return p.commit("t"+n,n,cmd)};
  commit({kind:"schedule",event:{id:"r",world_id:"W",tick:0,kind:"review",actor_id:"A",interval:2}});
  commit({kind:"publish",offer:offer("P",0,0,0,"work","work",11,0)});
  commit({kind:"submit",submission:{kind:"start",submission_id:"s",horizon:11,attempt_id:"p1",intent:{kind:"intent",world_id:"W",actor_id:"P",actor_revision:0,knowledge_revision:0,decision_tick:0,opportunity_id:"work",action_id:"work",disposition:"action"}}});
  let lastRevision=null;
  for(let i=0;i<100&&p.recover().checkpoint.scheduler.view.submission_active;i++){
   lastRevision=p.recover().revision;commit({kind:"run",budget});
  }
  // Reconstruct decision inputs from one complete replay, rather than counting wrapper calls.
  samples.clear();
  const c=p.recover().checkpoint, trace=[...samples.values()].filter(s=>s.tick>0||s.action!==null);
  const before=db.read(),q=open();
  const recovered=same(q.recover().checkpoint,c);
  const retry=lastRevision!==null&&q.commit("t"+lastRevision,lastRevision,{kind:"run",budget}).replayed&&db.read()===before;
  const outcomes=c.executor.outcomes.filter(e=>e.actor_id==="A");
  return {now:c.executor.now,done:!c.scheduler.view.submission_active,actor:c.executor.actors.find(a=>a.actor_id==="A"),completed:outcomes.filter(e=>e.outcome==="completed").length,rejected:c.scheduler.journal.filter(e=>e.actor_id==="A"&&e.result==="rejected").length,trace,c,recovered,retry};
 }
 const a=scenario(dims(10,1)),b=scenario(dims(0,10)),c=scenario(dims(10,1),false),d=scenario(dims(10,1),true,1);
 check("all four bounded fixtures reach the same horizon",[a,b,c,d].every(x=>x.done&&x.now===11));
 check("rest fixture completes six activities",a.completed===6&&a.actor.resources===94&&a.actor.revision===12);
 check("rest pressure remains unchanged in reference",a.trace.filter(x=>x.revision>0).length===5&&a.trace.every(x=>x.rest===10&&x.action==="rest"));
 check("growth fixture selects practice",b.completed===6&&b.trace.every(x=>x.action==="practice"));
 check("infeasible offers do not fabricate completed activities",c.completed===0&&c.rejected===6&&c.actor.resources===100&&c.actor.revision===0);
 check("technical work budget does not change final reference checkpoint",same(a.c,d.c));
 check("normal reconstruction retains final checkpoint",[a,b,c,d].every(x=>x.recovered));
 check("exact transaction retry changes no stored bytes",[a,b,c,d].every(x=>x.retry));
 // Independent control: exact existing cognition with changed actor-scoped input.
 // This is NOT a life-domain reducer, nor evidence that rest changes authoritative state.
 const choice=rest=>{
  const p={world_id:"W",actor_id:"A",actor_revision:0,now:0,life_status:"active",risk_aversion:0,stress:0,needs:dims(rest,1),values:dims(),goals:[]};
  const k={schema_version:"0.1-proposal",world_id:"W",actor_id:"A",as_of_tick:0,revision:0,observations:[]};
  return decide(p,k,generate(p,k,{world_id:"W",actor_id:"A",actor_revision:0,as_of_tick:0,capabilities:["rest","practice"]})).action_id;
 };
 check("cognition changes choice when actual input changes",choice(10)==="rest"&&choice(0)==="practice");
 const feedbackGate=a.trace.some(x=>x.revision>0&&x.rest<10);
 return {checks,feedbackGate,observed:{rest:a.trace,practice:b.trace,rejected:c.rejected,completed:a.completed}};
}
import {createWorldTransactionReference as create} from "../../tools/world_transaction_reference.mjs";
const result=runDiagnostic({canonical,store,persistence,executor,scheduler,perception,planner,generate,decide,create});
for(const c of result.checks)console.log(c.pass?"PASS":"FAIL",c.name);
console.log("Authoritative feedback gate:",result.feedbackGate?"PASS":"NOT MET");
console.log(JSON.stringify(result.observed));
if(result.checks.some(c=>!c.pass)||(process.argv.includes("--require-feedback")&&!result.feedbackGate))process.exitCode=1;
