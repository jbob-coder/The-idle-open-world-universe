// Synthetic GS-SLICE-01 player/receipt acceptance oracle. NOT gameplay or UI runtime.
// Run: node docs/completion/check_player_receipt_protocol.mjs
// No imports, I/O, real saves, canonical NPCs or production clock policy.
const clone=x=>JSON.parse(JSON.stringify(x));
const canon=x=>JSON.stringify(x,(_,v)=>v&&typeof v==="object"&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v);
const equal=(a,b)=>canon(a)===canon(b);
const must=(v,m)=>{if(!v)throw Error(m)};
const exact=(x,keys)=>x&&typeof x==="object"&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const initial=(epoch="E1")=>({world:"W",epoch,revision:0,now:10,active:null,commands:[],privateMemo:"PRIVATE_QA_618"});
const prepared=s=>s.active?[]:["ask","walk"].map(kind=>({id:s.epoch+"-"+s.revision+"-"+kind,kind,epoch:s.epoch,revision:s.revision,tick:s.now}));
const publicView=s=>({world:s.world,epoch:s.epoch,revision:s.revision,now:s.now,active:!!s.active,choices:prepared(s)});
const ui=()=>({selection:null,pending:null,segments:[]});
function select(s,u,id){
 must(!u.pending&&prepared(s).some(x=>x.id===id),"unavailable selection");
 return {...u,selection:id};
}
function confirm(s,u,id){
 if(u.pending)return u; // one immutable command per admitted user intent
 must(prepared(s).some(c=>c.id===u.selection),"stale selection");
 const pending={version:"fixture-v1",world:s.world,epoch:s.epoch,expectedRevision:s.revision,commandId:id,actor:"P",kind:"choice",issuedTick:s.now,payload:{choiceId:u.selection}};
 return {...u,pending};
}
function scoped(s,row){
 must(row.epoch===s.epoch,"foreign receipt epoch");
 return {epoch:row.epoch,commandId:row.id,status:row.status,start:row.start,end:row.end,contentVersion:"fixture-text-v1",
  facts:row.status==="processing"?[]:[{kind:row.outcome,elapsed:row.end-row.start}]};
}
function begin(previous,c){
 must(exact(c,["version","world","epoch","expectedRevision","commandId","actor","kind","issuedTick","payload"])&&c.version==="fixture-v1"&&c.world===previous.world&&c.epoch===previous.epoch&&c.actor==="P"&&c.kind==="choice"&&typeof c.commandId==="string"&&c.commandId.length>0&&exact(c.payload,["choiceId"]),"invalid command");
 const old=previous.commands.find(x=>x.id===c.commandId);
 if(old){must(old.bytes===canon(c),"id conflict");return {state:previous,receipt:scoped(previous,old),replayed:true}}
 must(!previous.active&&c.expectedRevision===previous.revision&&c.issuedTick===previous.now&&prepared(previous).some(x=>x.id===c.payload.choiceId),"stale choice");
 const s=clone(previous),row={id:c.commandId,epoch:s.epoch,bytes:canon(c),status:"processing",start:s.now,end:s.now,outcome:null,steps:[]};
 s.commands.push(row);s.active=row.id;s.revision++;
 return {state:s,receipt:scoped(s,row),replayed:false};
}
// Simulated trusted resolver boundary; caller is test fixture, NOT client.
function step(previous,id,ordinal,elapsed,outcome=null){
 const old=previous.commands.find(x=>x.id===id);
 must(old&&old.epoch===previous.epoch&&Number.isSafeInteger(ordinal)&&ordinal>=1&&Number.isSafeInteger(elapsed)&&elapsed>=0&&[null,"completed","interrupted","refused"].includes(outcome),"invalid resolver step");
 const key=canon({ordinal,elapsed,outcome}),prior=old.steps[ordinal-1];
 if(prior!==undefined){must(prior===key,"step conflict");return {state:previous,receipt:scoped(previous,old),replayed:true}}
 must(previous.active===id&&ordinal===old.steps.length+1&&old.status==="processing"&&Number.isSafeInteger(previous.now+elapsed),"inactive or out-of-order step");
 const s=clone(previous),row=s.commands.find(x=>x.id===id);
 s.now+=elapsed;s.revision++;row.end=s.now;row.steps.push(key);
 if(outcome!==null){row.outcome=outcome;row.status="terminal";s.active=null}
 return {state:s,receipt:scoped(s,row),replayed:false};
}
function recover(s,c){
 must(c.world===s.world&&c.epoch===s.epoch,"stale epoch");
 const row=s.commands.find(x=>x.id===c.commandId);
 if(!row)return null;
 must(row.bytes===canon(c),"id conflict");
 return scoped(s,row);
}
function render(receipt){
 must(receipt.contentVersion==="fixture-text-v1"&&receipt.status==="terminal"&&receipt.facts.length===1,"not a renderable receipt");
 const f=receipt.facts[0];
 const text={completed:"You complete the activity.",interrupted:"You stop before the activity is complete.",refused:"Your request is declined."}[f.kind];
 must(typeof text==="string"&&f.elapsed===receipt.end-receipt.start,"unknown outcome");
 return {id:receipt.epoch+"/"+receipt.commandId+"/1",contentVersion:receipt.contentVersion,text,elapsed:f.elapsed};
}
// Only current-epoch receipts issued by the trusted fixture can be appended.
function ingest(s,u,r){
 const row=s.commands.find(x=>x.id===r.commandId);
 must(row&&r.epoch===s.epoch&&equal(scoped(s,row),r),"foreign or unverified receipt");
 if(r.status==="processing")return u;
 const segment=render(r),prior=u.segments.find(x=>x.id===segment.id);
 if(prior)must(equal(prior,segment),"segment conflict");
 const segments=prior?u.segments:[...u.segments,segment];
 const matches=u.pending?.commandId===r.commandId;
 return {...u,segments,selection:matches?null:u.selection,pending:matches?null:u.pending};
}
function rebuild(s){
 return s.commands.filter(x=>x.status==="terminal").reduce((u,row)=>ingest(s,u,scoped(s,row)),ui());
}
const ready=(s,id="c1")=>confirm(s,select(s,ui(),prepared(s)[0].id),id);
let passed=0;
function test(name,f){f();passed++;console.log("PASS "+name)}
function rejects(s,f,reason){const before=canon(s);let msg="";try{f()}catch(e){msg=String(e)}must(msg.includes(reason),"expected "+reason+" got "+msg);must(canon(s)===before,"rejection mutated authority")}
test("reading status selection change and Back do not mutate world",()=>{
 const s=initial(),before=canon(s);publicView(s);let u=select(s,ui(),prepared(s)[0].id);u=select(s,u,prepared(s)[1].id);u={...u,selection:null};must(canon(s)===before&&u.pending===null,"navigation mutated world");
});
test("duplicate Continue keeps original command bytes",()=>{
 const s=initial(),u=ready(s);must(confirm(s,u,"other")===u&&u.pending.commandId==="c1","duplicate command allocation");
});
test("confirmation cannot submit arbitrary effects",()=>{
 const s=initial(),u=ready(s);rejects(s,()=>begin(s,{...u.pending,payload:{...u.pending.payload,credits:999}}),"invalid command");
});
test("stale prepared choice rejects without clock movement",()=>{
 const s=initial(),u=ready(s),changed={...s,revision:1};rejects(changed,()=>begin(changed,u.pending),"stale choice");
});
test("unconfirmed selection cannot start activity",()=>{
 const s=initial();rejects(s,()=>confirm(s,ui(),"c1"),"stale selection");must(s.active===null,"admitted selection");
});
test("lost acknowledgement before commit retries same bytes",()=>{
 const s=initial(),u=ready(s);must(recover(s,u.pending)===null,"false recovery");const a=begin(s,u.pending);must(a.state.active==="c1"&&a.state.now===10,"bad admission");
});
test("lost acknowledgement after admission does not admit twice",()=>{
 const s=initial(),u=ready(s),a=begin(s,u.pending),retry=begin(a.state,u.pending);
 must(retry.replayed&&retry.state===a.state&&equal(recover(a.state,u.pending),a.receipt),"double admission");
});
test("changed payload under original command ID rejects",()=>{
 const s=initial(),u=ready(s),a=begin(s,u.pending);rejects(a.state,()=>begin(a.state,{...u.pending,issuedTick:11}),"id conflict");
});
test("budget boundary retains pending session and creates no prose",()=>{
 const s=initial(),u=ready(s),a=begin(s,u.pending),b=step(a.state,"c1",1,2);
 must(b.state.now===12&&b.state.active==="c1"&&ingest(b.state,u,b.receipt)===u&&b.receipt.status==="processing","budget misclassified");
});
test("technical step retry cannot advance time again",()=>{
 const s=initial(),u=ready(s),a=begin(s,u.pending),b=step(a.state,"c1",1,2),retry=step(b.state,"c1",1,2);
 must(retry.replayed&&retry.state===b.state&&b.state.now===12,"double technical step");
 rejects(b.state,()=>step(b.state,"c1",1,3),"step conflict");
});
test("out-of-order step cannot advance time",()=>{
 const s=initial(),a=begin(s,ready(s).pending);rejects(a.state,()=>step(a.state,"c1",2,4),"out-of-order");
});
test("observed interruption renders only actual elapsed work",()=>{
 const s=initial(),u=ready(s),a=begin(s,u.pending),b=step(a.state,"c1",1,2),c=step(b.state,"c1",2,1,"interrupted"),v=ingest(c.state,u,c.receipt);
 must(c.state.now===13&&c.state.active===null&&v.pending===null&&v.segments.length===1&&v.segments[0].elapsed===3&&!v.segments[0].text.includes("You complete"),"fake completion");
});
test("committed refusal is not technical rejection",()=>{
 const s=initial(),u=ready(s),a=begin(s,u.pending),b=step(a.state,"c1",1,1,"refused"),v=ingest(b.state,u,b.receipt);
 must(b.state.now===11&&v.segments[0].text.includes("declined"),"refusal lost");
});
test("unknown terminal acknowledgement recovers exact receipt once",()=>{
 const s=initial(),u=ready(s),a=begin(s,u.pending),b=step(a.state,"c1",1,5,"completed"),r=recover(b.state,u.pending),v=ingest(b.state,u,r),again=ingest(b.state,v,r);
 must(equal(r,b.receipt)&&again.segments.length===1&&equal(v,again),"duplicate prose");
});
test("later committed action plus retry preserves chronology and prefix",()=>{
 const s=initial(),u=ready(s),a=begin(s,u.pending),b=step(a.state,"c1",1,5,"completed"),v=ingest(b.state,u,b.receipt);
 const w=confirm(b.state,select(b.state,v,prepared(b.state)[1].id),"c2"),c=begin(b.state,w.pending),d=step(c.state,"c2",1,2,"refused");
 const rendered=ingest(d.state,w,d.receipt),retry=begin(d.state,u.pending);
 must(retry.state===d.state&&equal(ingest(d.state,rendered,retry.receipt),rendered)&&equal(rebuild(d.state).segments,rendered.segments),"history duplicated or reordered");
});
test("presentation cache reconstruction uses committed content version",()=>{
 const s=initial(),u=ready(s),a=begin(s,u.pending),b=step(a.state,"c1",1,5,"completed");
 must(equal(rebuild(b.state).segments,ingest(b.state,u,b.receipt).segments),"render recovery differs");
});
test("forged receipt and private metadata fail scoped boundary",()=>{
 const s=initial(),u=ready(s),a=begin(s,u.pending),b=step(a.state,"c1",1,5,"completed");
 rejects(b.state,()=>ingest(b.state,u,{...b.receipt,privateMemo:s.privateMemo}),"unverified receipt");
 rejects(b.state,()=>ingest(b.state,u,{...b.receipt,end:99}),"unverified receipt");
 must(!canon([publicView(b.state),b.receipt,rebuild(b.state)]).includes(s.privateMemo),"private canary leaked");
});
test("old epoch command or receipt cannot affect current timeline",()=>{
 const s=initial(),u=ready(s),a=begin(s,u.pending),b=step(a.state,"c1",1,5,"completed"),newEpoch=initial("E2");
 rejects(newEpoch,()=>begin(newEpoch,u.pending),"invalid command");
 rejects(newEpoch,()=>recover(newEpoch,u.pending),"stale epoch");
 rejects(newEpoch,()=>ingest(newEpoch,u,b.receipt),"unverified receipt");
});
console.log(JSON.stringify({passed,total:18,scope:"synthetic protocol oracle",runtime_verified:false}));
