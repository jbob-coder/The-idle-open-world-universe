// Synthetic acceptance composition using actual V1 execution; NOT gameplay.
// Run: node docs/qa/check_thermal_execution_boundary.mjs
// Fixture interprets abstract ticks as milliseconds, not an approved clock.
// AB-00003 draft N01/N02/N03 parameters pinned to pilot blob 260b15f06c9794dda6dcace1408e88dcda7e1d9e.
import {createExecutionReference as executor} from '../../tools/npc_execution_reference.mjs';
const ok=(v,m="assertion")=>{if(!v)throw Error(m)};
const copy=v=>JSON.parse(JSON.stringify(v));
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const initial={world_id:"W",now:0,actors:[{actor_id:"A",revision:0,knowledge_revision:0,resources:100,life_status:"active"}]};
const rootParams={rate:1000,cap:5000,delta:10000,stop:null};
const metered={...rootParams,stop:295000};
const fixture=(params=rootParams)=>({clock:executor(initial).exportCheckpoint(),hot:{energy:600000,capacity:2,solid:true,contact:true},cold:{energy:882000,capacity:3,solid:true,contact:true},params:copy(params),core:"AB-00003",learned:["N01","N02"],used:0,carry:0,attempt:null,evidence:[],revision:0,epoch:1,ops:[]});
const min=(...a)=>a.reduce((x,y)=>x<y?x:y);
function transfer(s,elapsed){
 const h=s.hot,c=s.cold,p=s.params;
 ok([h.energy,c.energy,h.capacity,c.capacity,p.rate,p.cap,p.delta,elapsed,s.used,s.carry].every(Number.isSafeInteger)&&h.energy>=0&&c.energy>=0&&h.capacity>0&&c.capacity>0&&p.rate>0&&p.cap>0&&p.delta>0&&elapsed>=0&&s.used>=0&&s.used<=p.cap&&s.carry>=0&&s.carry<1000,"invalid physical fixture");
 if(!h.contact||!c.contact||!h.solid||!c.solid)return;
 // Exact rational temperature difference; no float rounding or equilibrium overshoot.
 const H=BigInt(h.energy),C=BigInt(c.energy),a=BigInt(h.capacity),b=BigInt(c.capacity),d=H*b-C*a;
 if(d<=0n||d>BigInt(p.delta)*a*b)return;
 const raw=BigInt(p.rate)*BigInt(elapsed)+BigInt(s.carry),budget=raw/1000n;
 const bounds=[budget,BigInt(p.cap-s.used),d/(a+b),H];
 if(p.stop!==null){ok(Number.isSafeInteger(p.stop)&&p.stop>=0,"invalid stop");const gap=BigInt(p.stop)*b-C;bounds.push(gap>0n?gap:0n)}
 const q=min(...bounds);ok(q>=0n,"negative transfer");
 const cold=C+q;ok(cold<=BigInt(Number.MAX_SAFE_INTEGER),"energy overflow");
 h.energy=Number(H-q);c.energy=Number(cold);s.used+=Number(q);
 // Discard unused rate credit when a physical or action limit binds.
 s.carry=q===budget?Number(raw%1000n):0;
}
function stage(root,cmd,fail=false){
 ok(cmd.epoch===root.epoch&&cmd.expected>=0,"stale epoch");
 const prior=root.ops.find(v=>v.id===cmd.id);
 if(prior){ok(eq(prior.cmd,cmd),"divergent retry");return {next:root,replayed:true,receipt:copy(prior.receipt)}}
 ok(root.revision===cmd.expected,"stale revision");
 const s=copy(root),x=executor(initial,s.clock),before=x.state(),a=before.actors[0];
 const total=BigInt(s.hot.energy)+BigInt(s.cold.energy);let result=null;
 if(cmd.kind==="start"){
  ok(s.core==="AB-00003"&&s.learned.includes(cmd.node)&&["N01","N02"].includes(cmd.node)&&s.hot.contact&&s.cold.contact&&s.hot.solid&&s.cold.solid&&s.attempt===null,"ineligible technique");
  ok(eq(s.params,cmd.node==="N01"?rootParams:metered)||cmd.node==="N01"&&s.params.rate===333,"fixture definition mismatch");
  const offer={world_id:"W",actor_id:"A",actor_revision:a.revision,knowledge_revision:a.knowledge_revision,opportunity_id:"relay",action_id:"relay",kind:"action",valid_until:before.now,feasible:true,exclusive_target:"pair",credit_cap:10000,phases:[{kind:"preparation",duration:1000,cost:0,interruptible:true,credit_per_tick:0},{kind:"execution",duration:6000,cost:0,interruptible:true,credit_per_tick:1},{kind:"recovery",duration:1000,cost:0,interruptible:true,credit_per_tick:0}]};
  x.publishOffer(offer);
  x.admit({kind:"intent",world_id:"W",actor_id:"A",actor_revision:a.revision,knowledge_revision:a.knowledge_revision,decision_tick:before.now,opportunity_id:"relay",action_id:"relay",disposition:"action"},cmd.id);
  s.attempt=cmd.id;s.used=0;s.carry=0;
 }else if(cmd.kind==="advance"){
  ok(before.active.length===1&&s.attempt!==null,"no active relay");
  const act=before.active[0],elapsed=cmd.to-before.now;
  const receipts=x.advanceTo(cmd.to); // rejects skipping phase boundaries
  if(act.phases[act.phase_index].kind==="execution")transfer(s,elapsed);
  result=receipts[0]??null;
 }else if(cmd.kind==="interrupt"){
  ok(s.attempt!==null,"no active relay");
  if(cmd.separate)s.hot.contact=false;
  result=x.stop("A",s.attempt,"interrupted");
 }else throw Error("unsupported command");
 if(result){ok(result.attempt_id===s.attempt,"unexpected outcome");if(s.used>0){ok(!s.evidence.includes(result.attempt_id),"duplicate practice");s.evidence.push(result.attempt_id)}s.attempt=null;s.carry=0}
 ok(BigInt(s.hot.energy)+BigInt(s.cold.energy)===total,"heat conservation");
 if(fail)throw Error("late fault");
 s.clock=x.exportCheckpoint();s.revision++;
 const receipt={id:cmd.id,revision:s.revision,actual:s.used,outcome:result?.outcome??null};
 s.ops.push({id:cmd.id,cmd:copy(cmd),receipt:copy(receipt)});
 return {next:s,replayed:false,receipt};
}
const command=(s,kind,extra={})=>({id:"op"+s.revision,epoch:s.epoch,expected:s.revision,kind,...extra});
const apply=(s,k,e={})=>stage(s,command(s,k,e)).next;
const start=(s=fixture(),node="N01")=>apply(s,"start",{node});
const advance=(s,to)=>apply(s,"advance",{to});
const end=(s)=>advance(advance(advance(s,s.clock.state.now+1000),s.clock.state.now+7000),s.clock.state.now+8000);
const reject=(s,c,fail=false)=>{const before=JSON.stringify(s);let failed=false;try{stage(s,c,fail)}catch{failed=true}ok(failed&&JSON.stringify(s)===before,"atomic rejection")};
const tests=[];const test=(name,f)=>{f();tests.push(name);console.log("PASS "+name)};
test("unacquired core rejected",()=>{const s=fixture();s.core=null;reject(s,command(s,"start",{node:"N01"}))});
test("unlearned technique rejected",()=>{const s=fixture(metered);s.learned=["N01"];reject(s,command(s,"start",{node:"N02"}))});
test("living tissue rejected",()=>{const s=fixture();s.cold.solid=false;reject(s,command(s,"start",{node:"N01"}))});
test("missing contact rejected",()=>{const s=fixture();s.hot.contact=false;reject(s,command(s,"start",{node:"N01"}))});
test("preparation transfers no heat",()=>{const s=advance(start(),1000);ok(s.used===0&&s.hot.energy===600000)});
test("interruption during preparation earns no evidence",()=>{const s=apply(start(),"interrupt",{separate:true});ok(s.used===0&&s.evidence.length===0)});
test("actual partial phase transfers only elapsed heat",()=>{let s=advance(start(),1000);s=advance(s,2500);s=apply(s,"interrupt",{separate:true});ok(s.used===1500&&s.hot.energy===598500&&s.cold.energy===883500&&s.evidence.length===1)});
test("separation stops further transfer",()=>{let s=advance(start(),1000);s=advance(s,2500);s=apply(s,"interrupt",{separate:true});reject(s,command(s,"advance",{to:3000}));reject(s,command(s,"start",{node:"N01"}))});
test("total action cap bounds transfer",()=>{const s=end(start());ok(s.used===5000&&s.hot.energy===595000&&s.cold.energy===887000&&s.evidence.length===1)});
test("recovery does not erase or add heat",()=>{let s=advance(advance(start(),1000),7000);ok(s.used===5000);s=apply(s,"interrupt",{separate:false});ok(s.used===5000&&s.evidence.length===1)});
test("metered stop respects temperature bound",()=>{const s=end(start(fixture(metered),"N02"));ok(s.used===3000&&s.cold.energy===885000)});
test("already above metered stop transfers zero",()=>{const s=fixture(metered);s.cold.energy=885003;const n=end(start(s,"N02"));ok(n.used===0&&n.evidence.length===0)});
test("unequal heat capacities reach equilibrium without overshoot",()=>{const s=fixture();s.hot.energy=590000;s.cold.energy=884997;const n=end(start(s));ok(n.used===1&&BigInt(n.hot.energy)*3n>=BigInt(n.cold.energy)*2n)});
test("cold-to-hot reversed gradient rejected as zero effect",()=>{const s=fixture();s.hot.energy=580000;const n=end(start(s));ok(n.used===0&&n.evidence.length===0)});
test("temperature differential cap denies out-of-range effect",()=>{const s=fixture();s.hot.energy=640000;const n=end(start(s));ok(n.used===0&&n.evidence.length===0)});
test("partition-invariant fractional rate",()=>{const s=fixture({...rootParams,rate:333}),a=advance(start(s),1000),one=advance(a,2000),many=advance(advance(advance(a,1001),1333),2000);ok(one.used===333&&many.used===333&&one.carry===many.carry&&eq(one.hot,many.hot)&&eq(one.cold,many.cold))});
test("checkpoint restored across partial execution",()=>{const a=advance(advance(start(),1000),2500),b=copy(a);ok(eq(advance(a,4000),advance(b,4000)))});
test("late staged fault retains executor and physical state",()=>{const s=advance(start(),1000);reject(s,command(s,"advance",{to:2000}),true);ok(s.used===0&&s.clock.state.now===1000)});
test("exact retry does not apply extra heat",()=>{const s=advance(start(),1000),c=command(s,"advance",{to:2000}),z=stage(s,c),again=stage(z.next,c);ok(again.replayed&&eq(again.next,z.next)&&again.next.used===1000)});
test("divergent retry rejected",()=>{const s=advance(start(),1000),c=command(s,"advance",{to:2000}),z=stage(s,c);reject(z.next,{...c,to:3000})});
test("stale epoch rejected",()=>{const s=start(),c=command(s,"advance",{to:1000});reject({...s,epoch:2},c)});
test("three distinct positive practices supply evidence without automatic unlock",()=>{let s=fixture();for(let i=0;i<3;i++){const t=s.clock.state.now;s=start(s);s=advance(s,t+1000);s=advance(s,t+1100);s=apply(s,"interrupt",{separate:false})}ok(s.evidence.length===3&&new Set(s.evidence).size===3&&s.learned.length===2)});
console.log(tests.length+"/"+tests.length+" PASS");
// No real contact geometry, environment exchange, actual thermal material model,
// simultaneous competing pairs, injury, secret-condition unlock, native store or scheduler.
// Zero effect is not a mastery reward. Trusted inputs are fixture assumptions, not proofs.
