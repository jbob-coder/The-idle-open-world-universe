// GODSEED integration QA design fixture, not production gameplay.
// Run: node docs/qa/check_execution_ledger_boundary.mjs
// Imports actual baseline execution reference and the PR #96 ledger oracle.
// Simulates one authoritative boundary, not an independent economy clock.
// Units synthetic. No real NPC, employer, pay rate, file or game save.
import {createExecutionReference as execution} from "../../tools/npc_execution_reference.mjs";
import {stage as ledgerStage,fixture as ledgerFixture,totals} from "./check_ledger_boundary.mjs";
const copy=x=>JSON.parse(JSON.stringify(x));
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const ok=(x,m="assertion")=>{if(!x)throw Error(m)};
const initial={world_id:"W",now:0,actors:["P","N"].map(actor_id=>({actor_id,revision:0,knowledge_revision:0,resources:100,life_status:"active"}))};
const terms={seller:"S",buyer:"P",price:10,priceVersion:1,open:true,employer:"E",worker:"N",rate:10};
function rootFixture(){
  const x=execution(initial);
  x.publishOffer({world_id:"W",actor_id:"N",actor_revision:0,knowledge_revision:0,opportunity_id:"shift",action_id:"work",kind:"action",valid_until:0,feasible:true,exclusive_target:"tool",credit_cap:10,phases:[{kind:"execution",duration:10,cost:0,interruptible:true,credit_per_tick:1}]});
  x.admit({world_id:"W",actor_id:"N",actor_revision:0,knowledge_revision:0,decision_tick:0,kind:"intent",opportunity_id:"shift",action_id:"work",disposition:"action"},"shift1");
  return {world:"W",epoch:0,revision:0,execution:x.exportCheckpoint(),ledger:ledgerFixture(),ops:[]};
}
function store(initialRoot){
  let bytes=JSON.stringify(initialRoot);
  return {read:()=>bytes,cas:(expected,next)=>{if(expected!==bytes)return false;bytes=next;return true}};
}
// Privileged fixture command; NOT a player request or real authorization API.
// Worker proof derives from actual terminal receipt in the private stage,
// never a client-supplied amount. Ledger's two substeps are not separate commits.
function resolve(db,cmd,{failLate=false,failCAS=false}={}){
  const before=db.read(),root=JSON.parse(before);
  ok(cmd&&Object.keys(cmd).sort().join(",")==="epoch,expected,id,kind,world"&&cmd.kind==="interruptShift"&&typeof cmd.id==="string"&&/^[A-Za-z0-9_-]{1,20}$/.test(cmd.id)&&cmd.world===root.world&&cmd.epoch===root.epoch,"invalid command");
  const bytes=JSON.stringify([cmd.world,cmd.epoch,cmd.expected,cmd.id,cmd.kind]),old=root.ops.find(o=>o.id===cmd.id);
  if(old){ok(old.bytes===bytes,"divergent retry");return copy(old.receipt)}
  ok(cmd.expected===root.revision,"stale revision");
  const next=copy(root),x=execution(initial,root.execution);
  // Synthetic interruption at six of ten eligible ticks. Actual executor
  // determines earned units and terminal identity; no guessed completed work.
  x.advanceTo(6);
  const actual=x.stop("N","shift1","interrupted");
  ok(actual.committed&&actual.outcome==="interrupted"&&actual.actor_id==="N"&&actual.tick===6&&actual.credited_units===6,"unexpected execution result");
  const proof=actual.event_id;
  const evidence={[proof]:{eligible:true,units:actual.credited_units}};
  const ledgerCmd=(kind,extra,suffix)=>({id:cmd.id+suffix,world:root.world,epoch:root.epoch,expected:next.ledger.revision,kind,...extra});
  next.ledger=ledgerStage(next.ledger,ledgerCmd("earn",{proof},"_earn"),terms,evidence).next;
  // Explicit partial-payment example from #96. No universal wage policy.
  const due=next.ledger.payables.find(p=>p.proof===proof);
  const funded=Math.min(due.remaining,next.ledger.accounts.E.clean);
  if(funded>0)next.ledger=ledgerStage(next.ledger,ledgerCmd("pay",{proof,clean:funded,dirty:0},"_pay"),terms,evidence).next;
  next.execution=x.exportCheckpoint();
  ok(eq(totals(next.ledger),totals(root.ledger)),"conservation");
  ok(!failLate,"injected late validation failure");
  next.revision++;
  const receipt={id:cmd.id,epoch:next.epoch,revision:next.revision,actor:"N",event:proof,from:0,to:actual.tick,outcome:actual.outcome,earned:due.earned,paid:funded,remaining:due.earned-funded};
  next.ops.push({id:cmd.id,bytes,receipt});
  // Single synthetic in-memory compare-and-swap across execution, ledger,
  // and receipt history. No external publication before successful CAS.
  ok(!failCAS&&db.cas(before,JSON.stringify(next)),"commit conflict");
  return copy(receipt);
}
function project(db,actor,receiptId){
  const root=JSON.parse(db.read()),r=root.ops.find(o=>o.id===receiptId)?.receipt;
  // Only worker sees own wages in this fixture; no general witness model.
  // Do not reveal whether a foreign receipt exists.
  if(!r||r.actor!==actor||r.epoch!==root.epoch)return null;
  return {id:r.id,epoch:r.epoch,revision:r.revision,outcome:r.outcome,elapsed:r.to-r.from,earned:r.earned,paid:r.paid,remaining:r.remaining};
}
function append(history,projection){
  if(projection===null)return history;
  const key=projection.epoch+":"+projection.id;
  const prior=history.find(x=>x.key===key);
  if(prior){ok(eq(prior.projection,projection),"divergent render source");return history}
  return [...history,{key,projection:copy(projection),text:"Your work ended early. You received "+projection.paid+" units; "+projection.remaining+" remain owed."}];
}
function tests(){
  const out=[],test=(name,f)=>{try{f();out.push({name,pass:true})}catch(e){out.push({name,pass:false,error:String(e)})}};
  const throws=f=>{let rejected=false;try{f()}catch(e){rejected=true}ok(rejected,"expected failure")};
  const cmd={world:"W",epoch:0,expected:0,id:"boundary",kind:"interruptShift"};
  const make=()=>store(rootFixture());
  test("actual interrupted work yields six not ten credited units",()=>{const db=make(),r=resolve(db,cmd);ok(r.to===6&&r.outcome==="interrupted"&&r.earned===60)});
  test("same commit retains wage debt and pays only funded amount",()=>{const db=make(),r=resolve(db,cmd),s=JSON.parse(db.read());ok(r.paid===40&&r.remaining===20&&s.ledger.accounts.N.clean===40&&s.ledger.payables[0].remaining===20)});
  test("shared boundary commits one outer revision and terminal execution",()=>{const db=make();resolve(db,cmd);const s=JSON.parse(db.read());ok(s.revision===1&&s.execution.state.now===6&&s.execution.state.active.length===0&&s.execution.state.outcomes.length===1&&s.ops.length===1)});
  test("unused exclusive reservation released in actual executor",()=>{const db=make();resolve(db,cmd);const s=JSON.parse(db.read());const x=execution(initial,s.execution);ok(x.state().active.length===0&&x.state().outcomes[0].outcome==="interrupted");x.publishOffer({world_id:"W",actor_id:"P",actor_revision:0,knowledge_revision:0,opportunity_id:"use",action_id:"use",kind:"action",valid_until:6,feasible:true,exclusive_target:"tool",credit_cap:1,phases:[{kind:"execution",duration:1,cost:0,interruptible:true,credit_per_tick:1}]});x.admit({world_id:"W",actor_id:"P",actor_revision:0,knowledge_revision:0,decision_tick:6,kind:"intent",opportunity_id:"use",action_id:"use",disposition:"action"},"next1");ok(x.state().active[0].exclusive_target==="tool")});
  test("late validation failure leaves execution, pay, proof and receipt unchanged",()=>{const db=make(),before=db.read();throws(()=>resolve(db,cmd,{failLate:true}));ok(db.read()===before&&project(db,"N","boundary")===null)});
  test("failed CAS publishes no result or partial effects",()=>{const db=make(),before=db.read();throws(()=>resolve(db,cmd,{failCAS:true}));ok(db.read()===before&&project(db,"N","boundary")===null)});
  test("retry after failed stage commits actual effects once",()=>{const db=make();throws(()=>resolve(db,cmd,{failCAS:true}));resolve(db,cmd);const s=JSON.parse(db.read());ok(s.ledger.earned.length===1&&s.execution.state.outcomes.length===1&&s.revision===1)});
  test("lost acknowledgement exact retry returns original receipt",()=>{const db=make(),r=resolve(db,cmd),before=db.read();ok(eq(resolve(db,cmd),r)&&db.read()===before)});
  test("divergent retry rejected without changes",()=>{const db=make();resolve(db,cmd);const before=db.read();throws(()=>resolve(db,{...cmd,expected:1}));ok(db.read()===before)});
  test("foreign actor cannot infer existence of wage receipt",()=>{const db=make();resolve(db,cmd);ok(project(db,"P","boundary")===null&&project(db,"P","absent")===null)});
  test("worker receipt exposes actual own outcome not private employer balance",()=>{const db=make();resolve(db,cmd);const p=project(db,"N","boundary");ok(p.paid===40&&p.remaining===20&&!Object.hasOwn(p,"event")&&!Object.hasOwn(p,"accounts"))});
  test("receipt cannot render twice after acknowledgement loss",()=>{const db=make();resolve(db,cmd);const p=project(db,"N","boundary"),h=append([],p);resolve(db,cmd);ok(eq(append(h,project(db,"N","boundary")),h)&&h.length===1)});
  test("rejected stage cannot generate narrative",()=>{const db=make();throws(()=>resolve(db,cmd,{failLate:true}));ok(append([],project(db,"N","boundary")).length===0)});
  test("serialized committed envelope recovers same result and projection",()=>{const db=make(),r=resolve(db,cmd),next=store(JSON.parse(db.read()));ok(eq(resolve(next,cmd),r)&&eq(project(next,"N","boundary"),project(db,"N","boundary")))});
  test("stale epoch command and receipt denied",()=>{const db=make();resolve(db,cmd);const root=JSON.parse(db.read());root.epoch=1;const n=store(root),before=n.read();throws(()=>resolve(n,cmd));ok(n.read()===before&&project(n,"N","boundary")===null)});
  test("client supplied work units rejected",()=>{const db=make(),before=db.read();throws(()=>resolve(db,{...cmd,units:100}));ok(db.read()===before)});
  return out;
}
// Limits: synthetic memory CAS (not SQLite), manually injected failure,
// one fixed actor and interruption boundary, actual executor generic units,
// no real domain authority or simultaneous scheduler, no real wage-rate math,
// no actual UI or knowledge acquisition, no persistent rewind. Projection is
// an illustrative authorized fixture, not authenticated actor binding.
// Production needs 01/02/04 review of reserved causal ID and scoped receipt.
const report=tests();
console.log(JSON.stringify(report,null,2));
if(report.some(x=>!x.pass))process.exitCode=1;
