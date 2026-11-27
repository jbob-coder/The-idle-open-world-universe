// Integrated private checkpoint gate; no real saves or process termination.
import {createWorldTransactionReference} from './world_transaction_reference.mjs';
import {canonicalWorldJson,createAtomicMemoryStore,createWorldPersistenceReference} from './world_persistence_reference.mjs';
import {createExecutionReference} from './npc_execution_reference.mjs';
import {createWorldSchedulerReference} from './world_scheduler_reference.mjs';
import {createPerceptionReference} from './npc_perception_reference.mjs';
import {createPlanningReference} from './npc_planning_reference.mjs';
import {generateNpcOpportunities} from './npc_opportunity_reference.mjs';
import {decideNpcReference} from './npc_cognition_reference.mjs';
function runIntegratedCheckpointTests(makeStore,create,deps){
 const identity={world_id:"fixture",seed:"fixture-seed"};
 const dims=v=>({safety:v,resources:v,growth:v,connection:v,duty:v,rest:v});
 const actor=actor_id=>({actor_id,revision:4,knowledge_revision:0,resources:100,life_status:"active"});
 const initial=()=>({world_id:"fixture",now:10,actors:["P","A","B"].map(actor),npc_configs:["A","B"].map(actor_id=>({actor_id,capabilities:["study"],motivation:{risk_aversion:0,stress:0,needs:dims(0),values:dims(1),goals:[{id:"learn",dimension:"growth",status:"active",urgency:5}]},plan:{world_id:"fixture",actor_id,plan_id:"plan_"+actor_id,goal_id:"learn",steps:[{id:"lesson",units:3,requires:[],options:[{opportunity_id:"study__lesson",action_id:"study"}]}]}}))});
 const context=(actor_id,present=true)=>({actor_id,world_id:"fixture",can_acquire:true,present,in_range:true,detected:true,path_clear:true});
 const frame=(id,tick,actors,claims)=>({world_id:"fixture",tick,actors,event:{id,world_id:"fixture",tick,committed:true,channel:"direct",observable_claims:claims,private_claims:[{key:"private",value:"CANARY"}]}});
 const lesson=frame("lesson",10,[context("A"),context("B",false)],[{key:"opp:lesson:lesson",value:"open"}]);
 const offer=(a,t,r,k,action,opp,duration)=>({world_id:"fixture",actor_id:a,actor_revision:r,knowledge_revision:k,action_id:action,opportunity_id:opp,kind:"action",valid_until:t,feasible:true,exclusive_target:null,credit_cap:10,phases:[{kind:"execution",duration,cost:1,interruptible:true,credit_per_tick:1}]});
 const adapters={resolveOffer:(c,d)=>offer(c.actor_id,c.now,c.actor_revision,c.knowledge_revision,d.action_id,d.opportunity_id,2),projectOutcome:r=>r.actor_id==="A"?frame(r.event_id,r.tick,[context("A",false),context("B")],[{key:"study_outcome",value:r.outcome}]):null};
 const event=(id,tick,extra)=>({kind:"schedule",event:{id,tick,world_id:"fixture",...extra}});
 const commands=[{kind:"observe",frame:lesson},{kind:"observe",frame:frame("hidden",10,[context("A",false),context("B",false)],[{key:"secret",value:"hidden"}])},event("review_A",10,{kind:"review",actor_id:"A",interval:2}),event("review_B",10,{kind:"review",actor_id:"B",interval:2}),event("interrupt",11,{kind:"interrupt",actor_id:"A",attempt_id:"npc_1_5_10",outcome:"interrupted",player_observed:false,requires_decision:false}),event("pause",11,{kind:"world",player_observed:true,requires_decision:true}),{kind:"publish",offer:offer("P",10,4,0,"work","work",10)},{kind:"submit",submission:{kind:"start",submission_id:"s1",horizon:20,attempt_id:"p1",intent:{kind:"intent",world_id:"fixture",actor_id:"P",actor_revision:4,knowledge_revision:0,decision_tick:10,opportunity_id:"work",action_id:"work",disposition:"action"}}},{kind:"run",budget:1},{kind:"run",budget:100},{kind:"submit",submission:{kind:"resume",submission_id:"s2",horizon:20,attempt_id:"p1"}},{kind:"run",budget:100}];
 const fresh=(count=0,d=deps,ad=adapters)=>{const store=makeStore(),w=create(store,d,ad,"checkpoint-v1",identity);w.initialize(initial(),"P",identity.seed);for(let i=0;i<count;i++)w.commit("tx"+(i+1),i,commands[i]);return {store,w}};
 const clone=x=>JSON.parse(deps.canonical(x)),eq=(a,b)=>deps.canonical(a)===deps.canonical(b),assert=v=>{if(!v)throw Error("assertion failed")},throws=f=>{let yes=false;try{f()}catch{yes=true}assert(yes)};
 const tests=[],test=(name,f)=>{try{f();tests.push({name,pass:true})}catch(e){tests.push({name,pass:false,error:String(e)})}};
 const plan=(r,a="A")=>r.checkpoint.scheduler.plans.find(p=>p.actor_id===a),knowledge=(r,a)=>r.checkpoint.scheduler.knowledge.find(k=>k.actor_id===a);
 const verify=(w,cmds=[])=>w.verifyCheckpointContinuation(w.exportPrivateCheckpoint(),cmds);
 test("initial combined checkpoint directly restores",()=>{const {w}=fresh();const r=verify(w);assert(r.base_revision===0&&eq(r.checkpoint,w.recover().checkpoint))});
 test("all committed boundaries restore and continue next command",()=>{const {w}=fresh();for(let i=0;i<commands.length;i++){const r=verify(w,[commands[i]]);w.commit("tx"+(i+1),i,commands[i]);assert(eq(r.checkpoint,w.recover().checkpoint)&&eq(r.private_state,w.exportPrivateCheckpoint().runtime))}});
 test("entire continuation from initial checkpoint matches committed run",()=>{const {w,store}=fresh(),raw=store.read(),r=verify(w,commands);assert(store.read()===raw);commands.forEach((c,i)=>w.commit("tx"+(i+1),i,c));assert(eq(r.checkpoint,w.recover().checkpoint)&&eq(r.private_state,w.exportPrivateCheckpoint().runtime))});
 test("pending plan and active reservation survive direct restore",()=>{const {w}=fresh(9),r=verify(w);assert(plan(r).pending.attempt_id===r.checkpoint.executor.active.find(a=>a.actor_id==="A").attempt_id&&plan(r).steps[0].credited_units===0)});
 test("partial interruption and pause survive restore",()=>{const {w}=fresh(10),r=verify(w);assert(r.checkpoint.executor.now===11&&plan(r).steps[0].credited_units===1&&r.checkpoint.scheduler.view.status==="player_decision"&&knowledge(r,"B").revision===1)});
 test("remaining work after direct restore reaches same completion",()=>{const {w}=fresh(10),r=verify(w,commands.slice(10));assert(plan(r).status==="complete"&&eq(plan(r).history.map(h=>h.receipt.credited_units),[1,2])&&plan(r,"B").steps[0].credited_units===0&&knowledge(r,"B").revision===2)});
 test("hidden event identities and full private frame provenance retained",()=>{const {w}=fresh(2),c=w.exportPrivateCheckpoint();assert(c.runtime.frames.length===2&&c.runtime.perception.processed_event_ids.includes("hidden")&&knowledge(verify(w),"B").revision===0&&!JSON.stringify(w.bindActor("A").forNarrative()).includes("CANARY"))});
 test("matching frame replay after direct restore remains idempotent",()=>{const {w}=fresh(2),r=verify(w,[commands[0]]);assert(knowledge(r,"A").revision===1&&r.private_state.frames.length===2)});
 test("conflicting frame replay rejected without changing storage",()=>{const {w,store}=fresh(2),raw=store.read(),f=clone(lesson);f.event.observable_claims[0].value="closed";throws(()=>verify(w,[{kind:"observe",frame:f}]));assert(store.read()===raw)});
 test("duplicate submitted action denied after restore",()=>{const {w,store}=fresh(10),raw=store.read();throws(()=>verify(w,[{...commands[10],submission:{...commands[10].submission,submission_id:"s1"}}]));assert(store.read()===raw)});
 test("old private checkpoint cannot replace latest world revision",()=>{const {w}=fresh(),c=w.exportPrivateCheckpoint();w.commit("tx1",0,commands[0]);throws(()=>w.verifyCheckpointContinuation(c))});
 for(const [name,mutate] of [
 ["foreign seed",c=>c.seed="other"],["changed adapter",c=>c.adapter_version="other"],["changed revision",c=>c.revision++],["missing frame",c=>c.runtime.frames.pop()],["plan credit",c=>c.runtime.plans[0].checkpoint.state.steps[0].credited_units++],["knowledge revision",c=>c.runtime.executor.state.actors[1].knowledge_revision++],["queue",c=>c.runtime.scheduler.state.queue.pop()],["pending plan identity",c=>c.runtime.plans[0].checkpoint.state.pending.attempt_id="other"],["private event content",c=>c.runtime.frames[0].event.private_claims[0].value="changed"]
 ])test("rejects "+name+" mismatch against committed authority",()=>{const {w,store}=fresh(9),c=w.exportPrivateCheckpoint(),raw=store.read();mutate(c);throws(()=>w.verifyCheckpointContinuation(c));assert(raw===store.read())});
 test("export and verification result are detached",()=>{const {w,store}=fresh(9),raw=store.read(),c=w.exportPrivateCheckpoint(),r=verify(w);c.runtime.frames.length=0;r.private_state.plans.length=0;assert(store.read()===raw&&w.exportPrivateCheckpoint().runtime.plans.length===2)});
 test("unsupported verification command rejects without writes",()=>{const {w,store}=fresh(),raw=store.read();throws(()=>verify(w,[{kind:"reseed"}]));assert(raw===store.read())});
 test("direct restoration detects executor mismatch from injected component",()=>{const d={...deps,executor:(spec,cp)=>{const x=deps.executor(spec,cp);return cp?{...x,state:()=>({...x.state(),now:x.state().now+1})}:x}};const {w}=fresh(9,d);throws(()=>verify(w))});
 test("direct restoration detects plan checkpoint mismatch",()=>{const d={...deps,planner:(spec,decide,cp)=>{const p=deps.planner(spec,decide,cp);return cp?{...p,snapshot:()=>({...p.snapshot(),pending:null})}:p}};const {w}=fresh(9,d);throws(()=>verify(w))});
 test("direct restoration detects perception mismatch",()=>{const d={...deps,perception:(id,cp)=>cp?deps.perception(id):deps.perception(id,cp)};const {w}=fresh(2,d);throws(()=>verify(w))});
 test("direct restoration detects scheduler output mismatch",()=>{const d={...deps,scheduler:(x,p,r,cp)=>{const s=deps.scheduler(x,p,r,cp);return cp?{...s,diagnostics:()=>({...s.diagnostics(),receipts:[]})}:s}};const {w}=fresh(10,d);throws(()=>verify(w))});
 test("bounded verification batch rejects oversized request",()=>{const {w}=fresh();throws(()=>verify(w,Array.from({length:257},()=>({kind:"run",budget:1}))))});
 return tests;
}
const results=runIntegratedCheckpointTests(createAtomicMemoryStore,createWorldTransactionReference,{canonical:canonicalWorldJson,persistence:createWorldPersistenceReference,executor:createExecutionReference,scheduler:createWorldSchedulerReference,perception:createPerceptionReference,planner:createPlanningReference,generate:generateNpcOpportunities,decide:decideNpcReference});
console.log(JSON.stringify(results,null,2));
console.log(results.filter(x=>x.pass).length+'/'+results.length+' passed');
if(results.some(x=>!x.pass))process.exitCode=1;
