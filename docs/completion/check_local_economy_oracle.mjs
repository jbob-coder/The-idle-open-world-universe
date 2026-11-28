// GS-SLICE-01 synthetic economy acceptance oracle, NOT gameplay runtime.
// Run: node docs/completion/check_local_economy_oracle.mjs
// Review conventions: milliseconds, 100 subunits/CR, floor plus carry.
// All accounts, stock, prices, receipts and authorization are synthetic.
const clone=x=>JSON.parse(JSON.stringify(x));
const canonical=x=>JSON.stringify(x,(_,v)=>v&&typeof v==="object"&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const equal=(a,b)=>canonical(a)===canonical(b);
const must=(ok,msg)=>{if(!ok)throw Error(msg)};
const whole=n=>Number.isSafeInteger(n)&&n>=0;
const add=(a,b)=>{const n=a+b;must(whole(a)&&whole(b)&&whole(n),"unsafe amount");return n};
const DEN=3600000n,RATE=1200n; // Reference 12 CR/h, not a live contract.
const initial=()=>({revision:0,now:0,accounts:{worker:{},employer:{pay:100},buyer:{own:500,found:200},shop:{}},lots:{pay:"clean",own:"clean",found:"dirty"},stock:{buyer:0,shop:2},price:150,priceRevision:1,wage:{earned:0,paid:0,remainder:0,lastEnd:0},receipts:[],commands:[]});
function total(s){
 const t={};
 for(const a of Object.values(s.accounts))for(const [lot,n] of Object.entries(a)){
  must(Object.hasOwn(s.lots,lot)&&whole(n),"invalid lot");t[lot]=add(t[lot]??0,n);
 }
 return t;
}
function transfer(s,source,dest,split,amount){
 must(source!==dest&&Object.hasOwn(s.accounts,source)&&Object.hasOwn(s.accounts,dest),"invalid accounts");
 must(Array.isArray(split)&&split.length>0&&new Set(split.map(x=>x.lot)).size===split.length,"duplicate lot");
 let sum=0;
 for(const {lot,amount:n} of split){
  must(Object.hasOwn(s.lots,lot)&&whole(n)&&n>0&&(s.accounts[source][lot]??0)>=n,"unfunded lot");sum=add(sum,n);
 }
 must(sum===amount,"wrong transfer total");
 for(const {lot,amount:n} of split){s.accounts[source][lot]-=n;s.accounts[dest][lot]=add(s.accounts[dest][lot]??0,n)}
}
const tx=(s,id,to,effects)=>({id,expectedRevision:s.revision,from:s.now,to,effects});
const work=(id,from,to,extra={})=>({kind:"work",receipt:id,actor:"worker",agreement:"fixture-agreement",from,to,authorized:true,...extra});
const pay=(id,amount,policy="partial")=>({kind:"pay",receipt:id,amount,policy,split:[{lot:"pay",amount}]});
const buy=(id,extra={})=>({kind:"buy",receipt:id,quantity:1,priceRevision:1,authorized:true,split:[{lot:"own",amount:150}],...extra});
function stage(previous,c){
 const prior=previous.commands.find(x=>x.id===c.id);
 if(prior){must(prior.bytes===canonical(c),"divergent retry");return {state:previous,replayed:true}}
 must(typeof c.id==="string"&&c.id.length>0&&c.expectedRevision===previous.revision&&c.from===previous.now&&whole(c.to)&&c.to>=c.from,"stale clock or revision");
 must(Array.isArray(c.effects)&&c.effects.length>0,"empty effects");
 const s=clone(previous),before=total(s),stockBefore=s.stock.buyer+s.stock.shop;
 for(const e of c.effects){
  must(typeof e.receipt==="string"&&e.receipt.length>0&&!s.receipts.includes(e.receipt),"duplicate receipt");
  if(e.kind==="work"){
   must(e.actor==="worker"&&e.agreement==="fixture-agreement"&&e.authorized===true&&whole(e.from)&&whole(e.to)&&e.from>=c.from&&e.to<=c.to&&e.to>e.from&&e.from>=s.wage.lastEnd,"invalid compensable interval");
   const n=RATE*BigInt(e.to-e.from)+BigInt(s.wage.remainder),units=n/DEN;
   must(units<=BigInt(Number.MAX_SAFE_INTEGER),"wage overflow");
   s.wage.earned=add(s.wage.earned,Number(units));s.wage.remainder=Number(n%DEN);s.wage.lastEnd=e.to;
  }else if(e.kind==="pay"){
   const due=s.wage.earned-s.wage.paid;
   must(whole(e.amount)&&e.amount>0&&e.amount<=due&&["partial","full"].includes(e.policy),"invalid settlement");
   must(e.policy!=="full"||e.amount===due,"full payment required");
   transfer(s,"employer","worker",e.split,e.amount);s.wage.paid=add(s.wage.paid,e.amount);
  }else if(e.kind==="buy"){
   must(e.authorized===true&&e.priceRevision===s.priceRevision&&whole(e.quantity)&&e.quantity>0&&e.quantity<=s.stock.shop,"unavailable purchase");
   const amount=s.price*e.quantity;must(whole(amount),"price overflow");
   transfer(s,"buyer","shop",e.split,amount);s.stock.shop-=e.quantity;s.stock.buyer=add(s.stock.buyer,e.quantity);
  }else throw Error("unknown effect");
  s.receipts.push(e.receipt);
 }
 must(equal(before,total(s))&&s.stock.buyer+s.stock.shop===stockBefore&&s.wage.paid<=s.wage.earned,"conservation failed");
 s.now=c.to;s.revision=add(s.revision,1);s.commands.push({id:c.id,bytes:canonical(c)});
 return {state:s,replayed:false};
}
let passed=0;
function test(name,f){f();passed++;console.log("PASS "+name)}
function reject(s,c,reason){
 const bytes=canonical(s);let error="";
 try{stage(s,c)}catch(e){error=String(e)}
 must(error.includes(reason),"expected rejection: "+reason+" got "+error);
 must(canonical(s)===bytes,"rejected transaction mutated input");
}
const apply=(s,id,to,effects)=>stage(s,tx(s,id,to,effects)).state;
test("partition-invariant wage accrual and carry",()=>{
 const a=apply(initial(),"a",10001,[work("w",0,10001)]);
 let b=initial();for(const t of [1,333,1000,2999,3000,7777,10001])b=apply(b,"t"+t,t,[work("r"+t,b.now,t)]);
 must(a.wage.earned===3&&a.wage.remainder===1201200&&equal(a.wage,b.wage),"rate carry differs");
});
test("partial work and break count only actual labor",()=>{
 let s=apply(initial(),"a",1500,[work("r1",0,1500)]);
 s=apply(s,"b",9000,[work("r2",7500,9000)]);
 must(s.now===9000&&s.wage.earned===1&&s.wage.remainder===0,"break counted or carry lost");
});
test("unauthorized work and out-of-transaction time reject",()=>{
 const s=initial();reject(s,tx(s,"a",1000,[work("r",0,1000,{authorized:false})]),"invalid compensable");
 reject(s,tx(s,"b",1000,[work("r",0,1001)]),"invalid compensable");
});
test("overlapping compensable intervals reject entire stage",()=>{
 const s=initial();reject(s,tx(s,"a",4000,[work("r1",0,3000),work("r2",2000,4000)]),"invalid compensable");
});
test("actual work creates obligation not money",()=>{
 const s=initial(),a=apply(s,"a",600000,[work("r",0,600000)]);
 must(a.wage.earned===200&&a.wage.paid===0&&equal(total(s),total(a))&&equal(s.accounts,a.accounts),"unfunded wage minted cash");
});
test("partial settlement retains unpaid obligation and provenance",()=>{
 const s=apply(initial(),"a",600000,[work("r",0,600000)]),a=apply(s,"b",s.now,[pay("p",100)]);
 must(a.wage.earned-a.wage.paid===100&&a.accounts.worker.pay===100&&a.accounts.employer.pay===0&&equal(total(s),total(a)),"partial settlement invalid");
 reject(a,tx(a,"c",a.now,[pay("p2",100)]),"unfunded lot");
});
test("full-only policy cannot silently pay part",()=>{
 const s=apply(initial(),"a",600000,[work("r",0,600000)]);
 reject(s,tx(s,"b",s.now,[pay("p",100,"full")]),"full payment required");
 reject(s,tx(s,"c",s.now,[pay("p",200,"full")]),"unfunded lot");
});
test("funded full settlement clears obligation",()=>{
 const s=apply(initial(),"a",300000,[work("r",0,300000)]),a=apply(s,"b",s.now,[pay("p",100,"full")]);
 must(a.wage.earned===a.wage.paid&&a.accounts.worker.pay===100&&equal(total(s),total(a)),"full payment failed");
});
test("shop exchange preserves stock and mixed-origin money",()=>{
 const s=initial(),a=apply(s,"a",1000,[buy("r",{split:[{lot:"own",amount:50},{lot:"found",amount:100}]})]);
 must(a.stock.buyer===1&&a.stock.shop===1&&a.accounts.shop.own===50&&a.accounts.shop.found===100&&a.lots.found==="dirty"&&equal(total(s),total(a)),"purchase not conserved");
});
test("unavailable stock, stale price and missing authorization reject",()=>{
 const s=initial();reject(s,tx(s,"a",1000,[buy("r",{quantity:3})]),"unavailable purchase");
 reject(s,tx(s,"b",1000,[buy("r",{priceRevision:0})]),"unavailable purchase");
 reject(s,tx(s,"c",1000,[buy("r",{authorized:false})]),"unavailable purchase");
});
test("unfunded and duplicate-lot purchase reject",()=>{
 const s=initial();reject(s,tx(s,"a",1000,[buy("r",{split:[{lot:"pay",amount:150}]})]),"unfunded lot");
 reject(s,tx(s,"b",1000,[buy("r",{split:[{lot:"own",amount:75},{lot:"own",amount:75}]})]),"duplicate lot");
});
test("concurrent work and purchase commit with one clock and revision",()=>{
 const s=initial(),a=apply(s,"a",300000,[work("w",0,300000),buy("b"),pay("p",100,"full")]);
 must(a.now===300000&&a.revision===1&&a.stock.buyer===1&&a.wage.earned===100&&a.wage.paid===100&&equal(total(s),total(a)),"combined transaction failed");
});
test("late stock failure rolls back work, payment and clock",()=>{
 const s=initial();reject(s,tx(s,"a",300000,[work("w",0,300000),pay("p",100),buy("b",{quantity:3})]),"unavailable purchase");
 must(s.wage.earned===0&&s.now===0&&s.receipts.length===0,"late rollback failed");
});
test("same command retry after later commit cannot duplicate effects",()=>{
 const s=initial(),c=tx(s,"a",300000,[work("w",0,300000),buy("b")]),a=stage(s,c).state,b=apply(a,"b",a.now,[pay("p",100)]);
 const again=stage(b,c);must(again.replayed&&again.state===b&&b.stock.buyer===1,"duplicate effects");
 reject(b,{...c,to:300001},"divergent retry");
});
test("duplicate receipt in new command rejected",()=>{
 const s=apply(initial(),"a",300000,[work("w",0,300000),buy("b")]);
 reject(s,tx(s,"b",s.now,[buy("b")]),"duplicate receipt");
});
test("stale revision and time reject",()=>{
 const s=apply(initial(),"a",300000,[work("w",0,300000)]);
 reject(s,{...tx(s,"b",s.now,[pay("p",100)]),expectedRevision:0},"stale clock or revision");
 reject(s,{...tx(s,"c",s.now,[pay("p",100)]),from:0},"stale clock or revision");
});
console.log(JSON.stringify({passed,total:16,scope:"synthetic oracle only",runtime_verified:false}));
