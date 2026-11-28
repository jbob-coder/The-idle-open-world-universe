// GODSEED synthetic QA oracle, not a production economy or approved balance.
// Run: node docs/qa/check_ledger_boundary.mjs
// Baseline f75bdd14827bd6ea8555f6ca428132e91cff97c3; #79 section 6, #77, #84.
// Integer synthetic subunits and task units only. No CR conversion or time rate.
// Trusted proof fixtures represent already verified eligible elapsed work.
// No client may create proof, prices, authority or ledger state in production.
const ok=(x,m="assertion")=>{if(!x)throw Error(m)};
const int=x=>Number.isSafeInteger(x)&&x>=0;
const id=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,40}$/.test(x);
const add=(a,b)=>{ok(int(a)&&int(b)&&int(a+b),"overflow");return a+b};
const mul=(a,b)=>{ok(int(a)&&int(b)&&int(a*b),"overflow");return a*b};
const copy=x=>JSON.parse(JSON.stringify(x));
const exact=(x,keys)=>x&&typeof x==="object"&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const canonical=x=>{
  if(x===null||typeof x==="string"||typeof x==="boolean"||Number.isSafeInteger(x))return JSON.stringify(x);
  if(Array.isArray(x)&&Object.keys(x).length===x.length&&Array.from({length:x.length},(_,i)=>Object.hasOwn(x,i)).every(Boolean))return "["+x.map(canonical).join(",")+"]";
  ok(x&&Object.getPrototypeOf(x)===Object.prototype,"invalid data");
  return "{"+Object.keys(x).sort().map(k=>{ok(!["__proto__","constructor","prototype"].includes(k),"unsafe key");return JSON.stringify(k)+":"+canonical(x[k])}).join(",")+"}";
};
const eq=(a,b)=>canonical(a)===canonical(b);
const fixture=()=>({world:"W",epoch:0,revision:0,accounts:{P:{clean:90,dirty:30},S:{clean:20,dirty:0},E:{clean:40,dirty:0},N:{clean:0,dirty:0}},stock:{P:0,S:4},payables:[],earned:[],ops:[]});
// Fixed trusted fixture records, not canonical content or owner rate choices.
const terms={seller:"S",buyer:"P",price:10,priceVersion:1,open:true,employer:"E",worker:"N",rate:10};
const proofs={partial:{units:6,eligible:true},missed:{units:0,eligible:true},denied:{units:9,eligible:false},second:{units:3,eligible:true}};
const totals=s=>({clean:Object.values(s.accounts).reduce((n,a)=>add(n,a.clean),0),dirty:Object.values(s.accounts).reduce((n,a)=>add(n,a.dirty),0),goods:Object.values(s.stock).reduce(add,0)});
function stage(root,cmd,authority=terms,evidence=proofs){
  ok(cmd&&id(cmd.id)&&cmd.world===root.world&&cmd.epoch===root.epoch&&int(cmd.expected),"invalid identity");
  const bytes=canonical(cmd),prior=root.ops.find(x=>x.id===cmd.id&&x.epoch===root.epoch);
  if(prior){ok(prior.bytes===bytes,"divergent retry");return {next:root,receipt:copy(prior.receipt),replayed:true}}
  ok(cmd.expected===root.revision,"stale revision");
  const common=["id","world","epoch","expected","kind"];
  const next=copy(root),before=totals(root);
  const transfer=(source,dest,clean,dirty)=>{
    ok(source!==dest&&Object.hasOwn(next.accounts,source)&&Object.hasOwn(next.accounts,dest)&&int(clean)&&int(dirty)&&add(clean,dirty)>0,"invalid transfer");
    const a=next.accounts[source],b=next.accounts[dest];
    ok(a.clean>=clean&&a.dirty>=dirty,"insufficient funds");
    a.clean-=clean;a.dirty-=dirty;b.clean=add(b.clean,clean);b.dirty=add(b.dirty,dirty);
  };
  let effect;
  if(cmd.kind==="purchase"){
    ok(exact(cmd,[...common,"qty","priceVersion","clean","dirty"])&&authority.open&&cmd.priceVersion===authority.priceVersion&&int(cmd.qty)&&cmd.qty>0,"unavailable or invalid purchase");
    const {seller,buyer,price}=authority,cost=mul(price,cmd.qty);
    ok(add(cmd.clean,cmd.dirty)===cost&&next.stock[seller]>=cmd.qty,"price or stock mismatch");
    transfer(buyer,seller,cmd.clean,cmd.dirty);
    next.stock[seller]-=cmd.qty;next.stock[buyer]=add(next.stock[buyer],cmd.qty);
    effect={kind:"purchase",qty:cmd.qty,cost};
  }else if(cmd.kind==="earn"){
    ok(exact(cmd,[...common,"proof"])&&id(cmd.proof)&&Object.hasOwn(evidence,cmd.proof)&&!next.earned.includes(cmd.proof),"unverified or already earned");
    const p=evidence[cmd.proof];ok(p.eligible&&int(p.units)&&p.units>0,"no eligible work");
    const amount=mul(p.units,authority.rate);
    ok(amount>0,"invalid earned amount");
    next.earned.push(cmd.proof);next.payables.push({proof:cmd.proof,employer:authority.employer,worker:authority.worker,earned:amount,remaining:amount});
    effect={kind:"earned",proof:cmd.proof,amount};
  }else if(cmd.kind==="pay"){
    ok(exact(cmd,[...common,"proof","clean","dirty"]),"invalid payment");
    const due=next.payables.find(x=>x.proof===cmd.proof);
    const amount=add(cmd.clean,cmd.dirty);
    ok(due&&amount>0&&amount<=due.remaining,"invalid outstanding amount");
    // Explicit partial settlement only in this oracle; policy is not yet approved.
    transfer(due.employer,due.worker,cmd.clean,cmd.dirty);due.remaining-=amount;
    effect={kind:"paid",proof:cmd.proof,amount,remaining:due.remaining};
  }else throw Error("unsupported command");
  ok(eq(totals(next),before),"conservation failure");
  next.revision=add(next.revision,1);
  const receipt={id:cmd.id,epoch:cmd.epoch,revision:next.revision,effect};
  next.ops.push({id:cmd.id,epoch:cmd.epoch,bytes,receipt});
  return {next,receipt:copy(receipt),replayed:false};
}
function tests(){
  const out=[],test=(name,f)=>{try{f();out.push({name,pass:true})}catch(e){out.push({name,pass:false,error:String(e)})}};
  const rejects=(s,c,a,e)=>{const before=canonical(s);let failed=false;try{stage(s,c,a,e)}catch(err){failed=true}ok(failed&&canonical(s)===before,"rejection must be atomic")};
  const cmd=(s,kind,extra={},key="op"+s.revision)=>({id:key,world:s.world,epoch:s.epoch,expected:s.revision,kind,...extra});
  const buy=(s,extra={})=>cmd(s,"purchase",{qty:2,priceVersion:1,clean:10,dirty:10,...extra});
  const earn=(s,proof="partial")=>stage(s,cmd(s,"earn",{proof})).next;
  const pay=(s,clean,dirty=0)=>cmd(s,"pay",{proof:"partial",clean,dirty});
  test("funded mixed-class purchase conserves classes and goods",()=>{const s=fixture(),n=stage(s,buy(s)).next;ok(eq(totals(s),totals(n))&&eq(n.accounts.P,{clean:80,dirty:20})&&eq(n.accounts.S,{clean:30,dirty:10})&&eq(n.stock,{P:2,S:2}))});
  test("zero quantity rejected",()=>{const s=fixture();rejects(s,buy(s,{qty:0,clean:0,dirty:0}))});
  test("insufficient stock rejects all effects",()=>{const s=fixture();rejects(s,buy(s,{qty:5,clean:50,dirty:0}))});
  test("insufficient requested currency class rejects despite total cash",()=>{const s=fixture();rejects(s,buy(s,{qty:4,clean:0,dirty:40}))});
  test("incorrect cost rejected",()=>{const s=fixture();rejects(s,buy(s,{clean:9}))});
  test("stale price rejected",()=>{const s=fixture();rejects(s,buy(s,{priceVersion:0}))});
  test("closed service rejected",()=>{const s=fixture();rejects(s,buy(s),{...terms,open:false})});
  test("negative funds rejected",()=>{const s=fixture();rejects(s,buy(s,{clean:-1,dirty:21}))});
  test("unverified work cannot earn cash or obligation",()=>{const s=fixture();rejects(s,cmd(s,"earn",{proof:"fake"}))});
  test("missed shift earns nothing",()=>{const s=fixture();rejects(s,cmd(s,"earn",{proof:"missed"}))});
  test("ineligible labor rejected",()=>{const s=fixture();rejects(s,cmd(s,"earn",{proof:"denied"}))});
  test("actual partial work earns 60 without inventing money",()=>{const s=fixture(),n=earn(s);ok(n.payables[0].remaining===60&&eq(s.accounts,n.accounts))});
  test("unfunded earned amount remains payable",()=>{const s=earn(fixture()),n=stage(s,pay(s,40)).next;ok(n.accounts.N.clean===40&&n.accounts.E.clean===0&&n.payables[0].remaining===20&&eq(totals(s),totals(n)))});
  test("full unfunded payment rejected without dropping entitlement",()=>{const s=earn(fixture());rejects(s,pay(s,60));ok(s.payables[0].remaining===60)});
  test("cannot pay more than earned",()=>{const s=earn(fixture());rejects(s,pay(s,61))});
  test("payment without obligation rejected",()=>{const s=fixture();rejects(s,pay(s,1))});
  test("duplicate earned proof under new command rejected",()=>{const s=earn(fixture());rejects(s,cmd(s,"earn",{proof:"partial"}))});
  test("exact purchase retry no duplicate assets",()=>{const s=fixture(),c=buy(s),z=stage(s,c),again=stage(z.next,c);ok(again.replayed&&eq(again.next,z.next)&&eq(again.receipt,z.receipt))});
  test("exact payment retry no duplicate debit",()=>{const s=earn(fixture()),c=pay(s,20),z=stage(s,c);ok(eq(stage(z.next,c).next,z.next))});
  test("same ID divergent retry rejected",()=>{const s=fixture(),c=buy(s),n=stage(s,c).next;rejects(n,{...c,qty:1,clean:10,dirty:0})});
  test("old epoch command rejected after synthetic rewind",()=>{const s=fixture(),c=buy(s),n={...s,epoch:1};rejects(n,c)});
  test("foreign world command rejected",()=>{const s=fixture();rejects(s,{...buy(s),world:"other"})});
  test("stale revision rejected",()=>{const s=fixture(),n=stage(s,buy(s)).next;rejects(n,{...buy(s),id:"fresh"})});
  test("discarded stage leaves source and receipt history intact",()=>{const s=fixture(),before=canonical(s);stage(s,buy(s));ok(canonical(s)===before)});
  test("serialized state preserves owed balance and exact replay",()=>{const s=earn(fixture()),c=pay(s,40),z=stage(s,c),n=copy(z.next);ok(n.payables[0].remaining===20&&eq(stage(n,c).receipt,z.receipt))});
  test("checked multiplication rejects overflow",()=>{const s=fixture();rejects(s,buy(s,{qty:Number.MAX_SAFE_INTEGER,clean:90,dirty:30}))});
  test("unexpected command fields rejected",()=>{const s=fixture();rejects(s,{...buy(s),override:true})});
  test("separate verified work receipts preserve obligations",()=>{const s=earn(earn(fixture()),"second");ok(s.payables.length===2&&s.payables[0].remaining===60&&s.payables[1].remaining===30&&eq(s.accounts,fixture().accounts))});
  return out;
}
// Limits: no lot-level provenance, authority/actor access verification, real
// elapsed-time rounding, multiple currencies/SKUs, ledger database/CAS, taxes,
// supplier fulfillment or actual gameplay. Whole-root fixture is not a schema.
// Production 01/02 must validate scope, typed proofs, price/revision/epoch,
// conservation by provenance lot and atomic persistence. 04 must expose only
// authorized projections, never private clean/dirty classes by default.
// Wages are a liability until funds transfer; no auto-mint or forced labor.
const report=tests();
console.log(JSON.stringify(report,null,2));
if(report.some(x=>!x.pass))process.exitCode=1;
