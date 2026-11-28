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
