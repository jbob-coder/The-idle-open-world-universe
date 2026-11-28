// Independent QA diagnostic, exact V1 reference; synthetic worlds only.
// Run: node docs/completion/check_knowledge_noninterference.mjs
// --require-noninterference is an explicit expected-failure acceptance gate on V1.
import {createWorldTransactionReference} from '../../tools/world_transaction_reference.mjs';
import {canonicalWorldJson,createAtomicMemoryStore,createWorldPersistenceReference} from '../../tools/world_persistence_reference.mjs';
import {createExecutionReference} from '../../tools/npc_execution_reference.mjs';
import {createWorldSchedulerReference} from '../../tools/world_scheduler_reference.mjs';
import {createPerceptionReference} from '../../tools/npc_perception_reference.mjs';
import {createPlanningReference} from '../../tools/npc_planning_reference.mjs';
import {generateNpcOpportunities} from '../../tools/npc_opportunity_reference.mjs';
import {decideNpcReference} from '../../tools/npc_cognition_reference.mjs';

const deps={canonical:canonicalWorldJson,persistence:createWorldPersistenceReference,
 executor:createExecutionReference,scheduler:createWorldSchedulerReference,perception:createPerceptionReference,
 planner:createPlanningReference,generate:generateNpcOpportunities,decide:decideNpcReference};
const identity={world_id:"fixture",seed:"synthetic-paired-world"};
const adapters={resolveOffer:()=>null,projectOutcome:()=>null};
const make=store=>createWorldTransactionReference(store,deps,adapters,"qa-noninterference",identity);
const actor=actor_id=>({actor_id,revision:4,knowledge_revision:0,resources:100,life_status:"active"});
const witness=(actor_id,present)=>({actor_id,world_id:"fixture",can_acquire:true,present,in_range:true,detected:true,path_clear:true});
const frame=(id,tick,actorId,value)=>({kind:"observe",frame:{world_id:"fixture",tick,
 actors:["P","A","B"].map(a=>witness(a,a===actorId)),event:{id,world_id:"fixture",tick,
 committed:true,channel:"direct",observable_claims:[{key:"seen",value}],private_claims:[{key:"secret",value:"PRIVATE_QA_491"}]}}});
const eq=(a,b)=>canonicalWorldJson(a)===canonicalWorldJson(b);
const check=(condition,label)=>{if(!condition)throw Error(label);console.log("PASS "+label);passed++};
let passed=0;
function setup(extra){
 const store=createAtomicMemoryStore(), world=make(store);
 world.initialize({world_id:"fixture",now:10,actors:["P","A","B"].map(actor),npc_configs:[]},"P",identity.seed);
 const commit=cmd=>{const n=world.recover().revision;return world.commit("tx"+(n+1),n,cmd)};
 commit(frame("common",10,"P","public-common"));
 const p=world.recover().checkpoint.executor.actors.find(a=>a.actor_id==="P");
 commit({kind:"publish",offer:{world_id:"fixture",actor_id:"P",actor_revision:p.revision,knowledge_revision:p.knowledge_revision,
 action_id:"work",opportunity_id:"work",kind:"action",valid_until:10,feasible:true,exclusive_target:null,credit_cap:10,
 phases:[{kind:"execution",duration:10,cost:1,interruptible:true,credit_per_tick:1}]}});
 commit({kind:"submit",submission:{kind:"start",submission_id:"s1",horizon:20,attempt_id:"p1",intent:{kind:"intent",world_id:"fixture",actor_id:"P",
 actor_revision:p.revision,knowledge_revision:p.knowledge_revision,decision_tick:10,opportunity_id:"work",action_id:"work",disposition:"action"}}});
 commit({kind:"run",budget:100});
 if(extra)commit(extra);
 const recovered=make(store);
 return {world:recovered,checkpoint:recovered.recover().checkpoint,p:recovered.bindActor("P").forNarrative(),
 a:recovered.bindActor("A").forNarrative(),b:recovered.bindActor("B").forNarrative()};
}
const control=setup(null),hidden=setup(frame("hidden",20,"A","private-observed-by-A")),
 invisible=setup(frame("invisible",20,null,"seen-by-no-one")),publicEvent=setup(frame("public",20,"P","public-new"));
const publicActor=x=>x.checkpoint.executor.actors.find(a=>a.actor_id==="P");
const withoutTime=({as_of_tick,...rest})=>rest;
check([control,hidden,invisible,publicEvent].every(x=>x.checkpoint.executor.now===20),"same authoritative world tick");
check(eq(control.checkpoint.scheduler.view,hidden.checkpoint.scheduler.view)&&eq(control.checkpoint.scheduler.view,invisible.checkpoint.scheduler.view),"same scheduler public view");
check(eq(publicActor(control),publicActor(hidden))&&eq(publicActor(control),publicActor(invisible)),"same player state and revisions");
check(eq(control.p.observations,hidden.p.observations)&&eq(control.p.observations,invisible.p.observations),"same player acquired evidence");
check(eq(withoutTime(control.p),withoutTime(hidden.p))&&eq(withoutTime(control.p),withoutTime(invisible.p)),"all other packet fields identical");
check(control.p.as_of_tick===10&&hidden.p.as_of_tick===20&&invisible.p.as_of_tick===20,"reproduce unseen event timestamp leak");
check(hidden.a.observations.length===1&&hidden.a.observations[0].claims[0].value==="private-observed-by-A"&&hidden.b.observations.length===0,"authorized witness retains actual observation");
check(publicEvent.p.revision===control.p.revision+1&&publicEvent.p.observations.length===2,"public observation legitimately changes evidence");
check(!JSON.stringify(hidden.p).includes("PRIVATE_QA_491")&&!JSON.stringify(hidden.p).includes("private-observed-by-A"),"private claim contents remain excluded");
check(eq(hidden.p,hidden.world.bindActor("P").forCognition()),"same timestamp exposed via cognition after reconstruction");
const normalize=(packet,publicTick)=>({...packet,as_of_tick:publicTick});
check(eq(normalize(control.p,20),normalize(hidden.p,20))&&eq(normalize(control.p,20),normalize(invisible.p,20)),"proposed public-clock projection removes measured metadata difference");
check(!eq(normalize(control.p,20),normalize(publicEvent.p,20)),"proposed projection preserves authorized new evidence");
const noninterference=eq(control.p,hidden.p)&&eq(control.p,invisible.p);
console.log(JSON.stringify({diagnostic_passed:passed,control_tick:control.p.as_of_tick,hidden_tick:hidden.p.as_of_tick,zero_witness_tick:invisible.p.as_of_tick,player_knowledge_revision:control.p.revision,world_tick:20,noninterference}));
if(process.argv.includes("--require-noninterference")&&!noninterference)process.exitCode=1;
