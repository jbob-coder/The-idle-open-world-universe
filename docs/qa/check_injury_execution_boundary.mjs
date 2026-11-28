// Synthetic cross-domain QA, NOT a combat or medical model.
// Run: node docs/qa/check_injury_execution_boundary.mjs
// V1 executor phases are actual reference code; all health values and contact proofs are fixtures.
import {createExecutionReference as executor} from '../../tools/npc_execution_reference.mjs';
const ok=(v,m="assertion")=>{if(!v)throw Error(m)},copy=x=>JSON.parse(JSON.stringify(x)),eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const initial={world_id:"W",now:0,actors:["A","B"].map(actor_id=>({actor_id,revision:0,knowledge_revision:0,resources:100,life_status:"active"}))};
const fixture=()=>({world:"W",epoch:1,revision:0,clock:executor(initial).exportCheckpoint(),health:{B:{hp:10,life:"active",optionalNeeds:false,injuries:[],function:{arm:10,leg:10}}},contact:true,attempt:null,damageIds:[],treatmentIds:[],ops:[]});
const proofs={contact:{target:"B",region:"arm",hpLoss:10,severity:4,fatal:false},heal:{target:"B",region:"arm",units:2,elapsed:2,authorized:true},noTime:{target:"B",region:"arm",units:2,elapsed:0,authorized:true},unauthorized:{target:"B",region:"arm",units:2,elapsed:2,authorized:false}};
function stage(root,c,fault=false){
 ok(c.world===root.world&&c.epoch===root.epoch,"scope");
 const prior=root.ops.find(v=>v.id===c.id);if(prior){ok(eq(prior.cmd,c),"divergent retry");return {next:root,receipt:copy(prior.receipt),replayed:true}}
 ok(c.expected===root.revision,"stale revision");
 const n=copy(root),x=executor(initial,n.clock),before=x.state(),h=n.health.B;
 let effect=null;
 if(c.kind==="start"){
  ok(n.attempt===null,"busy");
  const a=before.actors[0],offer={world_id:"W",actor_id:"A",actor_revision:a.revision,knowledge_revision:a.knowledge_revision,opportunity_id:"attack",action_id:"attack",kind:"action",valid_until:before.now,feasible:true,exclusive_target:"B",credit_cap:10,phases:[{kind:"preparation",duration:2,cost:0,interruptible:true,credit_per_tick:0},{kind:"execution",duration:3,cost:0,interruptible:true,credit_per_tick:1},{kind:"recovery",duration:2,cost:0,interruptible:true,credit_per_tick:0}]};
  x.publishOffer(offer);x.admit({kind:"intent",world_id:"W",actor_id:"A",actor_revision:a.revision,knowledge_revision:a.knowledge_revision,decision_tick:before.now,opportunity_id:"attack",action_id:"attack",disposition:"action"},c.id);n.attempt=c.id;
 }else if(c.kind==="moveTarget"){n.contact=false}
 else if(c.kind==="advance"){
  const outcomes=x.advanceTo(c.to),after=x.state();
  for(const event of after.events.slice(before.events.length)){
   if(event.kind!=="execution_boundary"||!n.contact)continue;
   // Fixture assumes actual contact already verified; no geometry or damage formula.
   const id=event.attempt_id+":contact";ok(!n.damageIds.includes(id),"duplicate damage");
   const p=proofs.contact;ok(p.target==="B"&&p.region==="arm","invalid proof");
   h.hp=Math.max(0,h.hp-p.hpLoss);h.injuries.push({id,region:p.region,severity:p.severity,cause:event.attempt_id,onset:event.tick});
   h.function.arm=Math.max(0,h.function.arm-p.severity);n.damageIds.push(id);
   if(p.fatal)h.life="deceased"; // false in this fixture; HP alone is not fatal proof
   effect={kind:"contact",id,target:"B",hp:h.hp,region:p.region};
  }
  if(outcomes.length)n.attempt=null;
 }else if(c.kind==="interrupt"){ok(n.attempt!==null,"not active");x.stop("A",n.attempt,"interrupted");n.attempt=null}
 else if(c.kind==="heal"){
  // Test-only privileged authorization, elapsed interval already resolved by same clock.
  const p=proofs[c.proof];ok(p&&p.authorized&&p.target==="B"&&p.elapsed>0&&p.units<=p.elapsed&&before.now>=p.elapsed&&h.life==="active"&&!n.treatmentIds.includes(c.proof),"invalid treatment");
  const injury=h.injuries.find(v=>v.region===p.region&&v.severity>0);ok(injury&&before.now-injury.onset>=p.elapsed,"no eligible recovery interval");
  const amount=Math.min(injury.severity,p.units);injury.severity-=amount;h.function.arm+=amount;h.hp=Math.min(10,h.hp+amount);n.treatmentIds.push(c.proof);
  effect={kind:"recovery",amount,target:"B"};
 }else throw Error("unsupported");
 if(fault)throw Error("late fault");
 n.clock=x.exportCheckpoint();n.revision++;
 const receipt={id:c.id,revision:n.revision,effect};
 n.ops.push({id:c.id,cmd:copy(c),receipt:copy(receipt)});return {next:n,receipt,replayed:false};
}
const cmd=(s,kind,extra={})=>({world:s.world,epoch:s.epoch,expected:s.revision,id:"op"+s.revision,kind,...extra});
const apply=(s,k,e={})=>stage(s,cmd(s,k,e)).next;
const start=(s=fixture())=>apply(s,"start");
const adv=(s,to)=>apply(s,"advance",{to});
const hit=()=>adv(adv(start(),2),5);
const reject=(s,c,fault=false)=>{const before=JSON.stringify(s);let threw=false;try{stage(s,c,fault)}catch{threw=true}ok(threw&&JSON.stringify(s)===before,"atomic rejection")};
let count=0;const test=(name,fn)=>{fn();count++;console.log("PASS "+name)};
test("preparation grants no damage",()=>{const s=adv(start(),2);ok(s.health.B.hp===10&&s.damageIds.length===0)});
test("early interruption grants no damage",()=>{const s=apply(adv(start(),2),"interrupt");ok(s.health.B.hp===10&&s.damageIds.length===0)});
test("partial execution before contact grants no damage",()=>{const s=apply(adv(adv(start(),2),4),"interrupt");ok(s.health.B.hp===10&&s.damageIds.length===0)});
test("contact revalidation permits miss",()=>{const s=adv(apply(adv(start(),2),"moveTarget"),5);ok(s.health.B.hp===10&&s.damageIds.length===0)});
test("actual release boundary applies one localized injury",()=>{const s=hit();ok(s.health.B.hp===0&&s.damageIds.length===1&&s.health.B.injuries[0].region==="arm")});
test("zero HP does not alone kill",()=>{const s=hit();ok(s.health.B.life==="active")});
test("optional need disabled does not remove injury",()=>{const s=hit();ok(s.health.B.optionalNeeds===false&&s.health.B.injuries.length===1)});
test("local function impaired without unrelated limb damage",()=>{const s=hit();ok(s.health.B.function.arm===6&&s.health.B.function.leg===10)});
test("recovery interruption cannot undo released injury",()=>{const s=apply(hit(),"interrupt");ok(s.damageIds.length===1&&s.health.B.hp===0)});
test("completed recovery adds no repeated damage",()=>{const s=adv(hit(),7);ok(s.damageIds.length===1&&s.health.B.injuries.length===1)});
test("failed stage rolls back actual executor and injury",()=>{const s=adv(start(),2);reject(s,cmd(s,"advance",{to:5}),true);ok(s.clock.state.now===2&&s.health.B.hp===10)});
test("exact contact retry no double damage",()=>{const s=adv(start(),2),c=cmd(s,"advance",{to:5}),z=stage(s,c),v=stage(copy(z.next),c);ok(v.replayed&&eq(z.receipt,v.receipt)&&v.next.damageIds.length===1)});
test("divergent contact retry rejected",()=>{const s=adv(start(),2),c=cmd(s,"advance",{to:5}),z=stage(s,c);reject(z.next,{...c,to:4})});
test("stale epoch rejected",()=>{const s=adv(start(),2),c=cmd(s,"advance",{to:5});reject({...s,epoch:2},c)});
test("stale revision rejected",()=>{const s=adv(start(),2);reject(s,{...cmd(s,"advance",{to:5}),expected:0})});
test("checkpoint roundtrip preserves active injury boundary",()=>{const s=adv(start(),2);ok(eq(adv(s,5),adv(copy(s),5)))});
test("treatment cannot heal without elapsed time",()=>{const s=hit();reject(s,cmd(s,"heal",{proof:"heal"}));reject(s,cmd(s,"heal",{proof:"noTime"}))});
test("unauthorized treatment rejected",()=>{const s=adv(hit(),7);reject(s,cmd(s,"heal",{proof:"unauthorized"}))});
test("eligible partial healing preserves injury provenance",()=>{const s=apply(adv(hit(),7),"heal",{proof:"heal"});ok(s.health.B.hp===2&&s.health.B.function.arm===8&&s.health.B.injuries[0].severity===2&&s.health.B.injuries[0].onset===5)});
test("treatment proof cannot be reused",()=>{const s=apply(adv(hit(),7),"heal",{proof:"heal"});reject(s,cmd(s,"heal",{proof:"heal"}))});
console.log(count+"/"+count+" PASS");
// No actual geometry, actor reaction, medical rates, fatal condition, real target
// lifecycle synchronization, authoritative proof generation, scheduler, or database.
// Separate staged fixture health is not a proposed second authoritative store.

// Cycle continuation: connect the actual injury fixture to existing cognition and
// expose the V1 physical-condition revision boundary. All thresholds are synthetic.
import {decideNpcReference as decide} from '../../tools/npc_cognition_reference.mjs';
const dims=(o={})=>({safety:0,resources:0,growth:0,connection:0,duty:0,rest:0,...o});
const rules={heavy_work:{arm:8,leg:8},light_work:{arm:3,leg:3},walk:{leg:5},practice:{arm:8},rest:{}};
function capable(h,action){
 return h.life==="active"&&Object.hasOwn(rules,action)&&Object.entries(rules[action]).every(([part,minimum])=>h.function[part]>=minimum);
}
function chooseLife(s,needs,known=["heavy_work","light_work","walk","practice","rest"]){
 const h=s.health.B,rev=s.clock.state.actors.find(a=>a.actor_id==="B").revision,now=s.clock.state.now;
 const profile={world_id:"W",actor_id:"B",actor_revision:rev,now,life_status:h.life,risk_aversion:0,stress:0,needs:dims(needs),values:dims(),goals:[]};
 const knowledge={schema_version:"0.1-proposal",world_id:"W",actor_id:"B",as_of_tick:now,revision:0,observations:known.map((key,i)=>({id:"o"+i,acquired_tick:now,channel:"direct",claims:[{key,value:"available"}]}))};
 const effects={heavy_work:{resources:8},light_work:{resources:4},walk:{connection:5},practice:{growth:7},rest:{rest:6}};
 const offers=Object.keys(rules).map(id=>({id,world_id:"W",actor_id:"B",kind:"action",action_id:id,goal_ids:[],effects:dims(effects[id]),risk:0,effort:1,requirements:[{key:id,value:"available",channels:["direct"]}],perceived_feasible:capable(h,id),valid_until:now}));
 return decide(profile,knowledge,offers);
}
// Revalidate own actor condition against the prepared proof at actual admission.
// Full fixture health fingerprint is a test oracle, NOT a proposed persisted schema.
const preparePhysical=(s,action)=>({action,actor:"B",epoch:s.epoch,health:JSON.stringify(s.health.B)});
function guardedAdmission(s,p){
 ok(p.epoch===s.epoch&&p.actor==="B"&&p.health===JSON.stringify(s.health.B)&&capable(s.health.B,p.action),"stale or infeasible condition");
 return true;
}
let n2=0;const test2=(name,fn)=>{fn();n2++;console.log("PASS "+name)};
test2("healthy income-oriented actor selects heavy work",()=>ok(chooseLife(fixture(),{resources:8}).action_id==="heavy_work"));
test2("actual injury redirects actor to light work",()=>ok(chooseLife(hit(),{resources:8}).action_id==="light_work"));
test2("arm injury preserves walking",()=>ok(chooseLife(hit(),{connection:8}).action_id==="walk"));
test2("arm-dependent practice unavailable while injured",()=>ok(chooseLife(hit(),{growth:8}).kind==="wait"));
test2("injured actor can choose rest over work",()=>ok(chooseLife(hit(),{resources:1,rest:8}).action_id==="rest"));
test2("injured actor need not rest when no positive motivation",()=>ok(chooseLife(hit(),{}).kind==="wait"));
test2("unobserved light work cannot be chosen",()=>ok(chooseLife(hit(),{resources:8},["heavy_work","walk","rest"]).kind==="wait"));
test2("actual partial recovery restores heavy work eligibility",()=>{const s=apply(adv(hit(),7),"heal",{proof:"heal"});ok(s.health.B.function.arm===8&&chooseLife(s,{resources:8}).action_id==="heavy_work")});
test2("uncommitted healing cannot restore eligibility",()=>{const s=adv(hit(),7),before=JSON.stringify(s);reject(s,cmd(s,"heal",{proof:"heal"}),true);ok(JSON.stringify(s)===before&&chooseLife(s,{resources:8}).action_id==="light_work")});
test2("serialized injury preserves decision",()=>{const s=hit();ok(eq(chooseLife(s,{resources:8}),chooseLife(copy(s),{resources:8})))});
test2("condition-aware admission rejects pre-injury offer",()=>{const s=adv(start(),2),p=preparePhysical(s,"heavy_work");ok(guardedAdmission(s,p));let threw=false;try{guardedAdmission(adv(s,5),p)}catch{threw=true}ok(threw)});
test2("newly prepared feasible light work admitted by test guard",()=>{const s=hit();ok(guardedAdmission(s,preparePhysical(s,"light_work")))});
test2("V1 physical condition not bound to actor revision: reproduce stale offer admission",()=>{
 let s=adv(start(),2);const x=executor(initial,s.clock),b=x.state().actors[1];
 x.publishOffer({world_id:"W",actor_id:"B",actor_revision:b.revision,knowledge_revision:b.knowledge_revision,opportunity_id:"heavy",action_id:"heavy_work",kind:"action",valid_until:10,feasible:true,exclusive_target:null,credit_cap:10,phases:[{kind:"execution",duration:2,cost:0,interruptible:true,credit_per_tick:1}]});
 s={...s,clock:x.exportCheckpoint()};const injured=adv(s,5),y=executor(initial,injured.clock),bb=y.state().actors[1];
 ok(bb.revision===b.revision&&!capable(injured.health.B,"heavy_work"));
 const result=y.admit({kind:"intent",world_id:"W",actor_id:"B",actor_revision:bb.revision,knowledge_revision:bb.knowledge_revision,decision_tick:5,opportunity_id:"heavy",action_id:"heavy_work",disposition:"action"},"heavy_attempt");
 ok(result.accepted===true,"baseline limitation no longer reproduced; revise diagnostic");
});
test2("foreign epoch invalidates condition proof",()=>{const s=fixture(),p=preparePhysical(s,"heavy_work");let threw=false;try{guardedAdmission({...s,epoch:2},p)}catch{threw=true}ok(threw)});
console.log(n2+"/"+n2+" condition feedback checks PASS; baseline stale physical admission reproduced");

// Cycle continuation: active activity invalidation, aligned with proposed #103 D2/D4.
// Existing V1 executor determines abstract elapsed credit; stage derives fixture
// eligibility and publishes actual partial result. No approved wage or injury rates.
function admitWork(x,actor,action,attempt,duration,interruptible=true,target="bench"){
 const s=x.state(),a=s.actors.find(v=>v.actor_id===actor);
 x.publishOffer({world_id:"W",actor_id:actor,actor_revision:a.revision,knowledge_revision:a.knowledge_revision,opportunity_id:attempt,action_id:action,kind:"action",valid_until:s.now,feasible:true,exclusive_target:target,credit_cap:100,phases:[{kind:"execution",duration,cost:0,interruptible,credit_per_tick:1}]});
 return x.admit({kind:"intent",world_id:"W",actor_id:actor,actor_revision:a.revision,knowledge_revision:a.knowledge_revision,decision_tick:s.now,opportunity_id:attempt,action_id:action,disposition:"action"},attempt);
}
function concurrentFixture(action="heavy_work",duration=10,interruptible=true){
 const s=start(),x=executor(initial,s.clock);admitWork(x,"B",action,"work1",duration,interruptible);
 return {...s,clock:x.exportCheckpoint(),work:{action,attempt:"work1",eligible:0,settled:[],status:"active"},conditionRevision:0};
}
function stageConcurrent(root,c,guard=true,fault=false){
 ok(c.world===root.world&&c.epoch===root.epoch,"scope");
 const prior=root.ops.find(v=>v.id===c.id);
 if(prior){ok(eq(prior.cmd,c),"divergent retry");return {next:root,receipt:copy(prior.receipt),replayed:true}}
 ok(root.revision===c.expected&&c.kind==="concurrent_advance","stale revision or command");
 const n=copy(root),x=executor(initial,n.clock),before=x.state();
 const active=before.active.find(a=>a.attempt_id===n.work.attempt),eligible=active&&capable(n.health.B,n.work.action);
 // Fixture models all work as execution, with one unit per abstract tick.
 const terminal=x.advanceTo(c.to),after=x.state();
 if(eligible)n.work.eligible+=c.to-before.now;
 const contact=after.events.slice(before.events.length).find(v=>v.kind==="execution_boundary"&&v.attempt_id===n.attempt&&v.actor_id==="A");
 if(contact&&n.contact){
  const h=n.health.B,p=proofs.contact,id=contact.attempt_id+":contact";
  ok(!n.damageIds.includes(id),"duplicate contact");
  h.hp=Math.max(0,h.hp-p.hpLoss);h.function.arm=Math.max(0,h.function.arm-p.severity);
  h.injuries.push({id,region:p.region,severity:p.severity,cause:contact.attempt_id,onset:contact.tick});
  n.damageIds.push(id);n.conditionRevision++;
 }
 // Candidate boundary policy: work valid in [start,end) earns its elapsed credit.
 // A completion exactly at end remains completed; no subsequent infeasible work.
 // A committed/noninterruptible phase may fail for actual impossibility, not be
 // retroactively cancelled. This policy is proposed, not established canon.
 const remaining=x.state().active.find(a=>a.attempt_id===n.work.attempt);
 if(guard&&remaining&&!capable(n.health.B,n.work.action)){
  terminal.push(x.stop("B",remaining.attempt_id,remaining.phases[remaining.phase_index].interruptible?"interrupted":"failed"));
 }
 const workResult=terminal.find(v=>v.attempt_id===n.work.attempt&&v.actor_id==="B");
 if(workResult){
  ok(!n.work.settled.some(v=>v.event===workResult.event_id),"duplicate settlement");
  if(guard)ok(workResult.credited_units===n.work.eligible,"credit exceeds eligible interval");
  n.work.settled.push({event:workResult.event_id,credited:workResult.credited_units,eligible:n.work.eligible,tick:workResult.tick,outcome:workResult.outcome});
  n.work.status=workResult.outcome;
 }
 if(terminal.some(v=>v.attempt_id===n.attempt&&v.actor_id==="A"))n.attempt=null;
 if(fault)throw Error("late fault");
 n.clock=x.exportCheckpoint();n.revision++;
 const receipt={id:c.id,revision:n.revision,tick:c.to,conditionRevision:n.conditionRevision,workResult:workResult?copy(n.work.settled.at(-1)):null};
 n.ops.push({id:c.id,cmd:copy(c),receipt:copy(receipt)});return {next:n,receipt,replayed:false};
}
const advanceBoth=(s,to,guard=true)=>stageConcurrent(s,cmd(s,"concurrent_advance",{to}),guard).next;
const injuryBoundary=(s=concurrentFixture(),guard=true)=>advanceBoth(advanceBoth(s,2,guard),5,guard);
const rejectsConcurrent=(s,c,fault=false)=>{const before=JSON.stringify(s);let threw=false;try{stageConcurrent(s,c,true,fault)}catch{threw=true}ok(threw&&JSON.stringify(s)===before,"atomic rejection")};
let n3=0;const test3=(name,fn)=>{fn();n3++;console.log("PASS "+name)};
test3("actual V1 without condition guard overcredits work after injury",()=>{let s=injuryBoundary(concurrentFixture(),false);ok(s.work.status==="active"&&s.work.eligible===5);s=advanceBoth(advanceBoth(s,7,false),10,false);ok(s.work.settled[0].credited===10&&s.work.settled[0].eligible===5)});
test3("candidate stops at injury boundary with exactly five eligible units",()=>{const s=injuryBoundary();ok(s.clock.state.now===5&&s.conditionRevision===1&&s.work.status==="interrupted"&&eq(s.work.settled[0],{event:"out_work1",credited:5,eligible:5,tick:5,outcome:"interrupted"}))});
test3("unrelated recovery phase continues independently",()=>{const s=injuryBoundary(),n=advanceBoth(s,7);ok(s.clock.state.active.some(a=>a.actor_id==="A"&&a.phases[a.phase_index].kind==="recovery")&&n.clock.state.now===7&&n.work.settled.length===1&&n.clock.state.active.length===0)});
test3("unaffected walking does not interrupt",()=>{let s=injuryBoundary(concurrentFixture("walk"));ok(s.work.status==="active");s=advanceBoth(advanceBoth(s,7),10);ok(s.work.status==="completed"&&s.work.settled[0].credited===10&&s.work.eligible===10)});
test3("candidate same-boundary completion retains legitimately earned work",()=>{const s=injuryBoundary(concurrentFixture("heavy_work",5));ok(s.work.status==="completed"&&s.work.settled.length===1&&s.work.settled[0].credited===5)});
test3("actual impossibility ends noninterruptible phase as failed not cancelled",()=>{const s=injuryBoundary(concurrentFixture("heavy_work",10,false));ok(s.work.status==="failed"&&s.work.settled[0].credited===5)});
test3("interruption frees exclusive resource",()=>{const s=advanceBoth(injuryBoundary(),7),x=executor(initial,s.clock);ok(admitWork(x,"A","light_work","replacement",2).accepted===true)});
test3("failed combined stage leaves time injury and earned units unchanged",()=>{const s=advanceBoth(concurrentFixture(),2),c=cmd(s,"concurrent_advance",{to:5});rejectsConcurrent(s,c,true);ok(s.clock.state.now===2&&s.damageIds.length===0&&s.work.eligible===2&&s.work.settled.length===0)});
test3("exact retry does not double settle or injure",()=>{const s=advanceBoth(concurrentFixture(),2),c=cmd(s,"concurrent_advance",{to:5}),z=stageConcurrent(s,c),v=stageConcurrent(copy(z.next),c);ok(v.replayed&&eq(v.next,z.next)&&eq(v.receipt,z.receipt)&&v.next.damageIds.length===1&&v.next.work.settled.length===1)});
test3("divergent retry and old epoch rejected",()=>{const s=advanceBoth(concurrentFixture(),2),c=cmd(s,"concurrent_advance",{to:5}),z=stageConcurrent(s,c);rejectsConcurrent(z.next,{...c,to:4});rejectsConcurrent({...z.next,epoch:2},c)});
test3("split elapsed interval preserves total work and condition",()=>{const s=advanceBoth(concurrentFixture(),2),a=advanceBoth(s,5),b=advanceBoth(advanceBoth(s,4),5);ok(eq(a.health,b.health)&&eq(a.work,b.work)&&eq(a.clock.state,b.clock.state))});
test3("normal serialization preserves interruption evidence and reevaluation",()=>{const s=injuryBoundary(),t=copy(s);ok(eq(advanceBoth(s,7),advanceBoth(t,7))&&chooseLife(t,{resources:8}).action_id==="light_work"&&chooseLife(t,{rest:8}).action_id==="rest")});
console.log(n3+"/"+n3+" active condition checks PASS; V1 over-credit reproduced");
// No real scheduler/domain effects, authenticated proofs, DB CAS or wage settlement.
// Preexisting work credit is not itself evidence of actual eligible labor in V2.
