// Independent QA proposal for #77 section 5, #84 and OWNER_DECISIONS.
// Synthetic fixtures, not approved gameplay or biological rules. No real saves.
// Run: node docs/qa/check_population_admission.mjs
// Provisional owner-delegated caps: 128 living NPCs, 32 regional admissions.
// Reservation model deliberately excludes actual gestation, generation and role switching.
function runChecks(){
 const clone=x=>JSON.parse(JSON.stringify(x));
 const ensure=(v,m)=>{if(!v)throw Error(m)};
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const positive=n=>Number.isSafeInteger(n)&&n>0;
 const validId=s=>typeof s==="string"&&/^[A-Za-z0-9_-]{1,40}$/.test(s)&&!Object.hasOwn(Object.prototype,s)&&s!=="prototype";
 function fixture(global=128,regional=32){
  return {epoch:"E1",revision:0,enabled:true,global,regional,actors:{P:{role:"player",status:"active",region:"R",origin:"R"}},reservations:{},spent:{},receipts:{}};
 }
 const living=s=>Object.values(s.actors).filter(a=>a.role==="npc"&&a.status!=="deceased").length;
 const held=(s,region)=>Object.values(s.reservations).filter(r=>r.status==="held"&&(!region||r.origin===region)).reduce((n,r)=>n+r.count,0);
 const consumed=(s,region)=>s.spent[region]??0;
 const methods=["birth","immigration","discovery"];
 function open(initial){
  let head=clone(initial);
  function commit(c,fail=false){
   c=clone(c);const bytes=JSON.stringify(c);
   ensure(c.epoch===head.epoch&&validId(c.id),"stale epoch or identity");
   const old=Object.hasOwn(head.receipts,c.id)?head.receipts[c.id]:null;
   if(old){ensure(old.bytes===bytes,"conflicting retry");return clone(old.result)}
   ensure(c.revision===head.revision,"stale revision");
   const s=clone(head);
   if(c.kind==="reserve"){
    ensure(s.enabled&&validId(c.reservation)&&!Object.hasOwn(s.reservations,c.reservation)&&validId(c.origin)&&methods.includes(c.method)&&positive(c.count),"reservation unavailable");
    ensure(c.count<=s.global-living(s)-held(s)&&c.count<=s.regional-consumed(s,c.origin)-held(s,c.origin),"capacity unavailable");
    s.reservations[c.reservation]={origin:c.origin,method:c.method,count:c.count,status:"held"};
   }else if(c.kind==="admit"){
    const r=validId(c.reservation)&&Object.hasOwn(s.reservations,c.reservation)?s.reservations[c.reservation]:null;
    ensure(r?.status==="held"&&Array.isArray(c.actors)&&c.actors.length===r.count&&new Set(c.actors.map(a=>a.id)).size===r.count,"reservation mismatch");
    // In production, validated complete profile and admission eligibility are mandatory.
    // This boolean is a synthetic assertion by the trusted fixture, NOT a public input.
    for(const a of c.actors){
     ensure(validId(a.id)&&!Object.hasOwn(s.actors,a.id)&&a.ready===true&&validId(a.region),"identity or incomplete actor");
     s.actors[a.id]={role:"npc",status:"active",region:a.region,origin:r.origin,profile:"synthetic",registry:true,knowledge:true,schedule:true};
    }
    r.status="consumed";s.spent[r.origin]=consumed(s,r.origin)+r.count;
   }else if(c.kind==="cancel"){
    const r=validId(c.reservation)&&Object.hasOwn(s.reservations,c.reservation)?s.reservations[c.reservation]:null;
    ensure(r?.status==="held"&&c.authorized===true,"cancellation unavailable");
    r.status="cancelled";
   }else if(c.kind==="settings"){
    ensure(typeof c.enabled==="boolean"&&positive(c.global)&&positive(c.regional),"invalid settings");
    s.enabled=c.enabled;s.global=c.global;s.regional=c.regional;
   }else if(c.kind==="travel"){
    const a=validId(c.actor)&&Object.hasOwn(s.actors,c.actor)?s.actors[c.actor]:null;ensure(a?.status==="active"&&validId(c.region),"travel unavailable");a.region=c.region;
   }else if(c.kind==="death"){
    const a=validId(c.actor)&&Object.hasOwn(s.actors,c.actor)?s.actors[c.actor]:null;ensure(a?.role==="npc"&&a.status!=="deceased"&&c.fatal===true,"death unavailable");
    a.status="deceased";a.schedule=false; // history retained, not deleted
   }else throw Error("unsupported");
   ensure(Number.isSafeInteger(s.revision+1),"overflow");s.revision++;
   const result={revision:s.revision,living:living(s),held:held(s)};
   s.receipts[c.id]={bytes,result};
   if(fail)throw Error("injected precommit failure");
   head=s;return clone(result);
  }
  return {commit,snapshot:()=>clone(head)};
 }
 const send=(a,id,kind,fields={})=>a.commit({id,kind,epoch:a.snapshot().epoch,revision:a.snapshot().revision,...fields});
 const res=(a,id,origin="R",count=1,method="birth")=>send(a,"r_"+id,"reserve",{reservation:id,origin,count,method});
 const actor=(id,region="R",ready=true)=>({id,region,ready});
 const admit=(a,id,actors)=>send(a,"a_"+id,"admit",{reservation:id,actors});
 const settings=(a,id,enabled,global,regional)=>send(a,id,"settings",{enabled,global,regional});
 const rejected=(a,fn)=>{const before=a.snapshot();try{fn();return false}catch{return same(before,a.snapshot())}};
 const checks=[];const test=(name,f)=>{try{checks.push({name,pass:!!f()})}catch(e){checks.push({name,pass:false,error:String(e)})}};
 test("player excluded from living NPC count",()=>living(fixture())===0);
 test("provisional defaults explicit",()=>fixture().global===128&&fixture().regional===32);
 test("reservation counts before admission",()=>{const a=open(fixture(2,2));res(a,"B","R",2);return living(a.snapshot())===0&&held(a.snapshot())===2&&rejected(a,()=>res(a,"C","S"))});
 test("regional cap independent of global capacity",()=>{const a=open(fixture(4,2));res(a,"B","R",2);return rejected(a,()=>res(a,"C","R"))&&!!res(a,"D","S")});
 test("competing stale reservation cannot overbook",()=>{const a=open(fixture(1,1)),c={id:"x",kind:"reserve",epoch:"E1",revision:0,reservation:"X",origin:"R",count:1,method:"birth"};res(a,"B");return rejected(a,()=>a.commit(c))});
 test("complete registration converts reservation once",()=>{const a=open(fixture(2,2));res(a,"B");admit(a,"B",[actor("A")]);const s=a.snapshot();return living(s)===1&&held(s)===0&&consumed(s,"R")===1&&s.actors.A.registry&&s.actors.A.knowledge&&s.actors.A.schedule});
 test("incomplete multi-actor admission rolls back whole batch",()=>{const a=open(fixture(2,2));res(a,"B","R",2);return rejected(a,()=>admit(a,"B",[actor("A"),actor("B","R",false)]))&&held(a.snapshot())===2&&!a.snapshot().actors.A});
 test("injected late fault leaves reservation and all registry state unchanged",()=>{const a=open(fixture());res(a,"B");const c={id:"a_B",kind:"admit",epoch:"E1",revision:1,reservation:"B",actors:[actor("A")]};return rejected(a,()=>a.commit(c,true))&&a.commit(c).living===1});
 test("exact retry retains original receipt after later commit",()=>{const a=open(fixture());res(a,"B");const c={id:"a_B",kind:"admit",epoch:"E1",revision:1,reservation:"B",actors:[actor("A")]},r=a.commit(c);settings(a,"s",false,128,32);const before=a.snapshot();return same(a.commit(c),r)&&same(a.snapshot(),before)&&rejected(a,()=>a.commit({...c,actors:[actor("Z")]}))});
 test("consumed reservation cannot be reused by fresh command",()=>{const a=open(fixture());res(a,"B");admit(a,"B",[actor("A")]);return rejected(a,()=>send(a,"other","admit",{reservation:"B",actors:[actor("Z")]}))});
 test("disable blocks new reservation without deleting existing actors",()=>{const a=open(fixture());res(a,"B");admit(a,"B",[actor("A")]);settings(a,"s",false,128,32);return rejected(a,()=>res(a,"C"))&&living(a.snapshot())===1});
 test("accepted birth honored after disable and cap reduction",()=>{const a=open(fixture(3,3));res(a,"B","R",2);settings(a,"s",false,1,1);admit(a,"B",[actor("A"),actor("B")]);return living(a.snapshot())===2&&consumed(a.snapshot(),"R")===2&&rejected(a,()=>res(a,"C"))});
 test("reenabling does not erase over-cap commitments",()=>{const a=open(fixture(3,3));res(a,"B","R",2);settings(a,"s",true,1,1);return rejected(a,()=>res(a,"C","S"))&&held(a.snapshot())===2});
 test("authorized cancellation releases only unconsumed reservation",()=>{const a=open(fixture(1,1));res(a,"B");send(a,"c","cancel",{reservation:"B",authorized:true});return held(a.snapshot())===0&&consumed(a.snapshot(),"R")===0&&!!res(a,"C")&&rejected(a,()=>admit(a,"B",[actor("A")]))});
 test("unapproved cancellation does not release commitment",()=>{const a=open(fixture());res(a,"B");return rejected(a,()=>send(a,"c","cancel",{reservation:"B",authorized:false}))});
 test("travel changes residency not originating regional budget",()=>{const a=open(fixture());res(a,"B");admit(a,"B",[actor("A")]);send(a,"t","travel",{actor:"A",region:"S"});const s=a.snapshot();return s.actors.A.region==="S"&&s.actors.A.origin==="R"&&consumed(s,"R")===1&&consumed(s,"S")===0});
 test("death frees living capacity but preserves identity and regional spent",()=>{const a=open(fixture(1,2));res(a,"B");admit(a,"B",[actor("A")]);send(a,"d","death",{actor:"A",fatal:true});const s=a.snapshot();return living(s)===0&&s.actors.A.status==="deceased"&&!s.actors.A.schedule&&consumed(s,"R")===1&&!!res(a,"C")&&rejected(a,()=>admit(a,"C",[actor("A")]))});
 test("nonfatal claim cannot free a population slot",()=>{const a=open(fixture());res(a,"B");admit(a,"B",[actor("A")]);return rejected(a,()=>send(a,"d","death",{actor:"A",fatal:false}))});
 test("regional spent not refunded by death",()=>{const a=open(fixture(1,1));res(a,"B");admit(a,"B",[actor("A")]);send(a,"d","death",{actor:"A",fatal:true});return rejected(a,()=>res(a,"C"))&&!!res(a,"D","S")});
 test("stale epoch rejected before receipt lookup",()=>{const a=open(fixture());return rejected(a,()=>a.commit({id:"x",kind:"reserve",epoch:"E0",revision:0,reservation:"X",origin:"R",count:1,method:"birth"}))});
 test("synthetic serialized reservation preserves continuation",()=>{const a=open(fixture());res(a,"B");const b=open(clone(a.snapshot()));for(const x of [a,b])admit(x,"B",[actor("A")]);return same(a.snapshot(),b.snapshot())});
 test("full 128 global slots across four regions, no 129th",()=>{const a=open(fixture());for(let j=0;j<4;j++){const id="B"+j,region="R"+j;res(a,id,region,32,"discovery");admit(a,id,Array.from({length:32},(_,i)=>actor("A"+j+"_"+i,region)))}return living(a.snapshot())===128&&held(a.snapshot())===0&&rejected(a,()=>res(a,"extra","R5"))});
 test("unsafe dictionary keys rejected without state change",()=>{const a=open(fixture());return rejected(a,()=>res(a,"__proto__"))&&rejected(a,()=>res(a,"B","constructor"))&&rejected(a,()=>send(a,"toString","settings",{enabled:false,global:1,regional:1}))&&!!res(a,"C")&&rejected(a,()=>admit(a,"C",[actor("__proto__")]))});
 test("duplicate actor IDs cannot consume batch",()=>{const a=open(fixture());res(a,"B","R",2);return rejected(a,()=>admit(a,"B",[actor("A"),actor("A")]))&&held(a.snapshot())===2});
 return {checks,passed:checks.filter(x=>x.pass).length};
}
const result=runChecks();
for(const c of result.checks)console.log(c.pass?"PASS":"FAIL",c.name,c.error??"");
console.log(result.passed+"/"+result.checks.length+" PASS (synthetic population oracle)");
if(result.passed!==result.checks.length)process.exitCode=1;
