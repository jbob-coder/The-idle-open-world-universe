// D1/D4 review candidate, not production wage policy or game data.
// Run: node docs/qa/check_wage_rate_boundary.mjs
// Proposes integer milliseconds and 100 subunits/CR; both require review.
// Source reference rates: #79 b51c461d05ee2a0b4b3886147f4120f1a8d2e270,
// data/npcs/b2_draft_profiles.json blob 602b7e31e8a0e40b7234c4dcdfeb36c6536401cd.
// These 11 vectors are reference arithmetic, not actual contracts/payments.
const roster=[[18,40,720],[25,40,1000],[12,30,360],[45,35,1575],[20,40,800],[25,40,1000],[18,40,720],[24,40,960],[25,40,1000],[20,40,800],[18,40,720]];
const HOUR_MS=3600000,MAX=Number.MAX_SAFE_INTEGER;
const ok=(x,m="assertion")=>{if(!x)throw Error(m)};
const nat=x=>Number.isSafeInteger(x)&&x>=0;
const id=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,40}$/.test(x);
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function accrue(rate,elapsed,carry){
  ok(nat(rate)&&nat(elapsed)&&nat(carry)&&carry<HOUR_MS,"invalid arithmetic input");
  const numerator=BigInt(rate)*BigInt(elapsed)+BigInt(carry);
  const whole=numerator/BigInt(HOUR_MS);
  ok(whole<=BigInt(MAX),"wage overflow");
  return {whole:Number(whole),carry:Number(numerator%BigInt(HOUR_MS))};
}
// Carry belongs to the same employer/worker/agreement/currency obligation.
// Preserve exact numerator remainder at rate version changes; do not move
// carry between different contracts. No terminal rounding policy chosen.
// Authority inputs below are synthetic trusted inputs, not public commands.
const make=()=>({agreement:"A",employer:"E",worker:"N",currency:"CR",earned:0,carry:0,lastEnd:0,proofs:[]});
function stage(s,p,terms){
  ok(p&&id(p.id)&&p.agreement===s.agreement&&p.employer===s.employer&&p.worker===s.worker&&p.currency===s.currency&&nat(p.start)&&nat(p.end)&&p.end>p.start&&nat(p.version),"invalid proof");
  const keys=["id","agreement","employer","worker","currency","start","end","version","eligible"];
  ok(Object.keys(p).length===keys.length&&keys.every(k=>Object.hasOwn(p,k))&&p.eligible===true,"unverified interval");
  const prior=s.proofs.find(x=>x.id===p.id);
  const bytes=JSON.stringify(keys.map(k=>p[k]));
  if(prior){ok(prior.bytes===bytes,"divergent proof");return s}
  ok(p.start>=s.lastEnd,"overlap or out-of-order evidence");
  ok(terms&&terms.agreement===s.agreement&&terms.version===p.version&&nat(terms.rate)&&terms.currency===s.currency&&terms.employer===s.employer&&terms.worker===s.worker&&nat(terms.from)&&nat(terms.until)&&terms.from<=p.start&&p.end<=terms.until,"rate or scope mismatch");
  const q=accrue(terms.rate,p.end-p.start,s.carry);
  ok(nat(s.earned+q.whole),"balance overflow");
  return {...s,earned:s.earned+q.whole,carry:q.carry,lastEnd:p.end,proofs:[...s.proofs,{id:p.id,bytes}]};
}
function tests(){
  const out=[],test=(name,f)=>{try{f();out.push({name,pass:true})}catch(e){out.push({name,pass:false,error:String(e)})}};
  const throws=f=>{let rejected=false;try{f()}catch(e){rejected=true}ok(rejected,"expected rejection")};
  const p=(id,start,end,extra={})=>({id,agreement:"A",employer:"E",worker:"N",currency:"CR",start,end,version:1,eligible:true,...extra});
  const t=(rate=1800,extra={})=>({agreement:"A",employer:"E",worker:"N",currency:"CR",version:1,from:0,until:MAX,rate,...extra});
  test("all 11 reference weekly totals and aggregate",()=>{let sum=0;for(const [rate,hours,gross] of roster){const x=accrue(rate*100,hours*HOUR_MS,0);ok(x.whole===gross*100&&x.carry===0);sum+=x.whole}ok(sum===965500)});
  test("all reference paid hours partition invariant",()=>{for(const [rate,hours] of roster){const duration=hours*HOUR_MS;let whole=0,carry=0;for(const elapsed of [1,999,123456,duration-124456]){const q=accrue(rate*100,elapsed,carry);whole+=q.whole;carry=q.carry}ok(eq({whole,carry},accrue(rate*100,duration,0)))}});
  test("1000 one-millisecond intervals match one second",()=>{let whole=0,carry=0;for(let i=0;i<1000;i++){const x=accrue(1800,1,carry);whole+=x.whole;carry=x.carry}ok(eq({whole,carry},accrue(1800,1000,0)))});
  test("flooring every second loses all 18 CR hourly wage",()=>{ok(Math.floor(1800/3600)*3600===0&&accrue(1800,HOUR_MS,0).whole===1800)});
  test("one hour at 18 CR earns 1800 subunits",()=>ok(eq(accrue(1800,HOUR_MS,0),{whole:1800,carry:0})));
  test("unpaid break is excluded by disjoint evidence",()=>{let s=stage(make(),p("morning",0,4*HOUR_MS),t());s=stage(s,p("afternoon",5*HOUR_MS,9*HOUR_MS),t());ok(s.earned===14400&&s.carry===0)});
  test("partial millisecond carry survives serialize and next interval",()=>{const s=stage(make(),p("a",0,1234),t()),restored=JSON.parse(JSON.stringify(s)),n=stage(restored,p("b",1234,2000),t());ok(n.earned===1&&n.carry===0)});
  test("rate version change preserves same agreement fractional entitlement",()=>{const s=stage(make(),p("a",0,1000),t(1800,{until:1000}));const n=stage(s,p("b",1000,2000,{version:2}),t(1800,{version:2,from:1000}));ok(n.earned===1&&n.carry===0)});
  test("actual rate change uses both rates without rounding each",()=>{const s=stage(make(),p("a",0,1000),t(1800,{until:1000}));const n=stage(s,p("b",1000,2000,{version:2}),t(3600,{version:2,from:1000}));ok(n.earned===1&&n.carry===1800000)});
  test("different agreement cannot borrow remainder",()=>{const s=stage(make(),p("a",0,1000),t());throws(()=>stage(s,p("b",1000,2000,{agreement:"B"}),t()));ok(s.carry===1800000)});
  test("foreign employer worker or currency rejected",()=>{for(const extra of [{employer:"X"},{worker:"X"},{currency:"X"}])throws(()=>stage(make(),p("a",0,1000,extra),t()))});
  test("stale rate version and crossed rate boundary rejected",()=>{throws(()=>stage(make(),p("a",0,1000,{version:2}),t()));throws(()=>stage(make(),p("a",0,1001),t(1800,{until:1000})))});
  test("overlapping work proofs rejected",()=>{const s=stage(make(),p("a",0,2000),t());throws(()=>stage(s,p("b",1999,3000),t()))});
  test("unverified proof and extra amount rejected",()=>{throws(()=>stage(make(),p("a",0,1000,{eligible:false}),t()));throws(()=>stage(make(),p("a",0,1000,{amount:999}),t()))});
  test("exact proof retry does not earn twice",()=>{const a=p("a",0,2000),s=stage(make(),a,t());ok(eq(stage(s,a,t()),s))});
  test("divergent proof ID rejected",()=>{const s=stage(make(),p("a",0,2000),t());throws(()=>stage(s,p("a",0,3000),t()))});
  test("discarded stage leaves earned and carry unchanged",()=>{const s=make(),before=JSON.stringify(s);stage(s,p("a",0,1234),t());ok(JSON.stringify(s)===before)});
  test("safe output despite unsafe intermediate product",()=>{const q=accrue(MAX,HOUR_MS,0);ok(q.whole===MAX&&q.carry===0)});
  test("overflow rejected before commit",()=>{throws(()=>accrue(MAX,HOUR_MS+1,0));const s={...make(),earned:MAX};throws(()=>stage(s,p("a",0,2000),t()));ok(s.earned===MAX)});
  test("invalid negative fractional and out-of-range carry rejected",()=>{for(const a of [[-1,0,0],[1,0.1,0],[1,0,HOUR_MS],[1,1,-1],[Infinity,1,0]])throws(()=>accrue(...a))});
  return out;
}
// Remaining review: exact currency denomination, payroll due windows,
// end-of-agreement residual settlement, rate authorization and proof generation,
// multi-agreement overlapping labor, epoch fencing and actual CAS with #96.
// No fractional entitlement disappears; carry is not spendable cash.
// This deliberately rejects backdated proof; production must define causal
// settlement order. No actual payroll or owner balance change.
const report=tests();
console.log(JSON.stringify(report,null,2));
if(report.some(x=>!x.pass))process.exitCode=1;

// QA-only helpers for native storage composition.
export {accrue,make,stage};
