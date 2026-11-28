// Review-only actual reference regression. Local adapter transformation, no production file edited.
import {canonicalWorldJson as canonical,createAtomicMemoryStore as store,createWorldPersistenceReference as persistence} from "../../tools/world_persistence_reference.mjs";
import {createExecutionReference as executor} from "../../tools/npc_execution_reference.mjs";
import {createWorldSchedulerReference as scheduler} from "../../tools/world_scheduler_reference.mjs";
import {createPerceptionReference as perception} from "../../tools/npc_perception_reference.mjs";
import {createPlanningReference as planner} from "../../tools/npc_planning_reference.mjs";
import {generateNpcOpportunities as generate} from "../../tools/npc_opportunity_reference.mjs";
import {decideNpcReference as decide} from "../../tools/npc_cognition_reference.mjs";
import {createWorldTransactionReference as create} from "../../tools/world_transaction_reference.mjs";
import {readFileSync} from "node:fs";
import {selectPlanAwareCandidate} from "./bounded_plan_selector.mjs";

function runPlanChecks({canonical,store,persistence,executor,scheduler,perception,planner,generate,decide,create,patchedCreate}){
 const checks=[],ck=(name,pass)=>checks.push({name,pass:!!pass});
 const dims=(resources=0,growth=0)=>({safety:0,resources,growth,connection:0,duty:0,rest:0});
 const goal={id:"learn",dimension:"growth",status:"active",urgency:5};
 const spec=n=>({world_id:"W",actor_id:"A",plan_id:"planA",goal_id:"learn",steps:[{id:"learn",units:1,requires:[],options:[{opportunity_id:"study__LAST",action_id:"study"}]},...Array.from({length:Math.ceil(n/16)},(_,i)=>({id:"work"+i,units:1,requires:["learn"],options:Array.from({length:Math.min(16,n-i*16)},(_,j)=>({opportunity_id:"work__S"+String(i*16+j).padStart(4,"0"),action_id:"work"}))}))]});
 const claims=n=>[...Array.from({length:n},(_,i)=>({key:"opp:shift:S"+String(i).padStart(4,"0"),value:"open"})),{key:"opp:lesson:LAST",value:"open"}];
 const p={world_id:"W",actor_id:"A",actor_revision:0,now:0,life_status:"active",risk_aversion:0,stress:0,needs:dims(10,1),values:dims(10,0),goals:[goal]};
 const k={schema_version:"0.1-proposal",world_id:"W",actor_id:"A",as_of_tick:0,revision:1,observations:[{id:"obs",acquired_tick:0,channel:"direct",claims:claims(80)}]};
 const self={world_id:"W",actor_id:"A",actor_revision:0,as_of_tick:0,capabilities:["work","study"]};
 const plan=planner(spec(80),decide),metrics={generated:0,maxScoreBatch:0},before=canonical(plan.snapshot());
 const selected=selectPlanAwareCandidate(p,k,self,decide,metrics,plan);
 ck("all 81 candidates considered, only ready prerequisite wins",selected.length===1&&selected[0].id==="study__LAST"&&metrics.generated===81&&metrics.maxScoreBatch<=64);
 ck("plan review is read-only",canonical(plan.snapshot())===before);
 const none=selectPlanAwareCandidate({...p,goals:[{...goal,status:"deferred"}]},k,self,decide,{generated:0,maxScoreBatch:0},plan);
 ck("deferred goal does not bypass reserved plan options",none.length===0);
 ck("unplanned reduction alone would choose blocked work",selectPlanAwareCandidate(p,k,self,decide,{generated:0,maxScoreBatch:0})[0]?.action_id==="work");
 function scenario(n,patched,budget=100){
  const db=store(),m={generated:0,maxScoreBatch:0},errors=[];
  const deps={canonical,persistence,executor,scheduler,perception,planner,generate:patched?(p,k,s,plan)=>selectPlanAwareCandidate(p,k,s,decide,m,plan??null):generate,decide};
  const offer=(a,t,r,kr,act,opp,duration)=>({world_id:"W",actor_id:a,actor_revision:r,knowledge_revision:kr,action_id:act,opportunity_id:opp,kind:"action",valid_until:t,feasible:true,exclusive_target:null,credit_cap:10,phases:[{kind:"execution",duration,cost:0,interruptible:true,credit_per_tick:1}]});
  const open=()=>(patched?patchedCreate:create)(db,deps,{resolveOffer:(c,d)=>offer(c.actor_id,c.now,c.actor_revision,c.knowledge_revision,d.action_id,d.opportunity_id,1),projectOutcome:()=>null},"plan-budget-qa");
  const q=open();q.initialize({world_id:"W",now:0,actors:["P","A"].map(actor_id=>({actor_id,revision:0,knowledge_revision:0,resources:100,life_status:"active"})),npc_configs:[{actor_id:"A",capabilities:["work","study"],motivation:{risk_aversion:0,stress:0,needs:p.needs,values:p.values,goals:[goal]},plan:spec(n)}]},"P","fixture-seed");
  const commit=cmd=>{const rev=q.recover().revision;return q.commit("tx"+rev,rev,cmd)};
  commit({kind:"observe",frame:{world_id:"W",tick:0,actors:[{actor_id:"A",world_id:"W",can_acquire:true,present:true,in_range:true,detected:true,path_clear:true}],event:{id:"obs",world_id:"W",tick:0,committed:true,channel:"direct",observable_claims:claims(n)}}});
  commit({kind:"schedule",event:{id:"r",world_id:"W",tick:2,kind:"review",actor_id:"A",interval:2}});
  commit({kind:"publish",offer:offer("P",0,0,0,"work","work",6)});
  commit({kind:"submit",submission:{kind:"start",submission_id:"s",horizon:6,attempt_id:"p1",intent:{kind:"intent",world_id:"W",actor_id:"P",actor_revision:0,knowledge_revision:0,decision_tick:0,opportunity_id:"work",action_id:"work",disposition:"action"}}});
  const before=db.read();let last=null;
  for(let i=0;i<30&&q.recover().checkpoint.scheduler.view.submission_active;i++){try{last=q.recover().revision;commit({kind:"run",budget})}catch(e){errors.push(String(e));break}}
  const c=q.recover().checkpoint,stored=db.read(),reopen=canonical(open().recover().checkpoint)===canonical(c),retry=errors.length===0&&open().commit("tx"+last,last,{kind:"run",budget}).replayed&&db.read()===stored;
  return {c,errors,unchanged:before===stored,reopen,retry,m};
 }
 const a=scenario(16,false),b=scenario(16,true),c=scenario(80,false),d=scenario(80,true),e=scenario(80,true,1);
 const state=x=>x.c.scheduler.plans[0],steps=x=>state(x).history.map(h=>h.step_id);
 ck("small planned fixture exact checkpoint equivalent",!a.errors.length&&!b.errors.length&&canonical(a.c)===canonical(b.c));
 ck("original 81 candidates stall atomically",c.errors.length===1&&c.unchanged&&c.c.executor.now===0);
 ck("candidate planned world advances to tick6",!d.errors.length&&d.c.executor.now===6&&!d.c.scheduler.view.submission_active);
 ck("actual plan credits prerequisite then eligible work",steps(d)[0]==="learn"&&steps(d)[1]==="work0"&&state(d).steps[0].credited_units===1&&state(d).steps[1].credited_units===1);
 ck("planned scan budget <=64 and technical budget equivalence",d.m.maxScoreBatch<=64&&e.m.maxScoreBatch<=64&&canonical(d.c)===canonical(e.c));
 ck("planned checkpoint reopen and retry", [a,b,d,e].every(x=>x.reopen&&x.retry));
 return {checks,observed:{originalLarge:c.errors,candidateErrors:d.errors,candidateSteps:steps(d),now:d.c.executor.now,maxBatch:d.m.maxScoreBatch}};
}
const source=readFileSync(new URL("../../tools/world_transaction_reference.mjs",import.meta.url),"utf8");
const needle="const opts=deps.generate(p,k,self),planner=plans.get(a.actor_id);";
if(!source.includes(needle))throw Error("reference interface changed");
const patchedCreate=new Function(source.replace(needle,"const planner=plans.get(a.actor_id),opts=deps.generate(p,k,self,planner);").replace(/^export /gm,"")+"\nreturn createWorldTransactionReference;")();
const result=runPlanChecks({canonical,store,persistence,executor,scheduler,perception,planner,generate,decide,create,patchedCreate});
for(const c of result.checks)console.log(c.pass?"PASS":"FAIL",c.name);
console.log(JSON.stringify(result.observed));
if(result.checks.some(c=>!c.pass))process.exitCode=1;
