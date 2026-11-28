// GODSEED QA-only rewind acceptance oracle. No production API, canon or real saves.
// Run: node docs/qa/check_rewind_boundary.mjs
// Baseline f75bdd14827bd6ea8555f6ca428132e91cff97c3; #77 / #84 / #87.
// Models ONE world, character and stable checkpoint identity. Rotation between
// encounters, terminal death, stuck-reset exemption, actual SQLite and RNG
// are deliberately outside this oracle. No real-world time or force-stop.
const copy=x=>JSON.parse(JSON.stringify(x));
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const ok=(v,m="assertion")=>{if(!v)throw Error(m)};
const int=x=>Number.isSafeInteger(x)&&x>=0;
const id=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,40}$/.test(x);
const domains=["clock","actors","relationships","economy","objects","knowledge","plans","activities","reservations","scheduler","rng","milestones","narrative","decision"];
const canonical=x=>{
  if(x===null||typeof x==="string"||typeof x==="boolean"||Number.isSafeInteger(x))return JSON.stringify(x);
  if(Array.isArray(x)&&Object.keys(x).length===x.length&&Array.from({length:x.length},(_,i)=>Object.hasOwn(x,i)).every(Boolean))return "["+x.map(canonical).join(",")+"]";
  ok(x&&typeof x==="object"&&!Array.isArray(x)&&Object.getPrototypeOf(x)===Object.prototype,"invalid fixture bytes");
  return "{"+Object.keys(x).sort().map(k=>{ok(!["__proto__","prototype","constructor"].includes(k));return JSON.stringify(k)+":"+canonical(x[k])}).join(",")+"}";
};
function snapshotValid(s,root){
  ok(s&&s.world===root.world&&s.seed===root.seed&&s.character===root.character&&s.key==="checkpointA","foreign or unsupported checkpoint");
  ok(s.state&&Object.keys(s.state).length===domains.length&&domains.every(k=>Object.hasOwn(s.state,k)),"incomplete snapshot");
  // Full canonical bytes act as a synthetic integrity comparator, not a secure digest.
  ok(canonical(s.state)===s.integrity,"snapshot integrity mismatch");
}
function make(){
  const active={clock:100,actors:[{id:"P",hp:90},{id:"N",hp:80}],relationships:{trust:3},
    economy:{player:200,shop:500},objects:{food:2},knowledge:["known-before"],
    plans:{npc:"work"},activities:{npc:{phase:"work",remaining:4}},reservations:["tool"],
    scheduler:[{at:104,kind:"finish"}],rng:{counter:7},milestones:{cosmic:"pending"},
    narrative:["before"],decision:{choice:"old-choice",epoch:0}};
  return {world:"W",seed:"one-seed",character:"P",epoch:0,seq:0,active,
    external:{slots:[null,null,null],generations:[0,0,0],archive:null,ops:[],judgement:{count:0,streak:0,warned:false,pending:false}}};
}
function save(root,slot){
  ok(int(slot)&&slot<3&&!root.external.slots[slot],"slot occupied or invalid");
  const r=copy(root),e=r.external;
  const s={world:r.world,seed:r.seed,character:r.character,key:"checkpointA",state:copy(r.active),integrity:canonical(r.active)};
  snapshotValid(s,r);
  // Same stable checkpoint only: reject a different snapshot rather than invent
  // multi-checkpoint abuse classification. Archive survives explicit slot erase.
  ok(e.archive===null||e.archive.integrity===s.integrity,"different checkpoint unsupported");
  e.archive=s;e.slots[slot]=copy(s);e.generations[slot]++;r.seq++;return r;
}
function erase(root,slot){
  ok(int(slot)&&slot<3&&root.external.slots[slot],"missing slot");
  const r=copy(root);r.external.slots[slot]=null;r.external.generations[slot]++;r.seq++;return r;
}
function prepare(root,slot){
  ok(int(slot)&&slot<3,"invalid slot");
  const s=root.external.slots[slot];snapshotValid(s,root);
  return {slot,generation:root.external.generations[slot],seq:root.seq,epoch:root.epoch,key:s.key,integrity:s.integrity};
}
function confirm(root,token,operation){
  ok(id(operation),"invalid operation ID");
  const payload=canonical(token),prior=root.external.ops.find(x=>x.id===operation);
  if(prior){ok(prior.payload===payload,"divergent operation retry");return {root,receipt:copy(prior.receipt),replayed:true}}
  ok(token&&int(token.slot)&&token.slot<3&&eq(token,prepare(root,token.slot)),"stale confirmation");
  const s=root.external.slots[token.slot];snapshotValid(s,root);
  // Same-checkpoint reload only. Qualification uses verified checkpoint identity;
  // forward or different-character loads, and genuine stuck exemptions, require
  // a reviewed production classifier. No client-supplied exemption flag.
  ok(root.active.clock>=s.state.clock,"forward load unsupported");
  const next=copy(root),e=next.external,j=e.judgement;
  next.active=copy(s.state);next.epoch++;next.seq++;
  // The old choice is invalid in the new epoch, even if the underlying decision
  // context is restored. A production controller must regenerate safe choices.
  next.active.decision={choice:null,epoch:next.epoch};
  j.count++;j.streak=0;
  const warning=j.count===8&&!j.warned;
  if(warning)j.warned=true;
  if(j.count>=28)j.pending=true;
  const receipt={operation,epoch:next.epoch,seq:next.seq,warning,pending:j.pending};
  e.ops.push({id:operation,payload,receipt});
  return {root:next,receipt,replayed:false};
}
function forward(root,action,qualifies){
  // Synthetic trusted receipt classifier, not player input or production policy.
  // Actions are unique committed forward results here. Real receipt dedupe and
  // validation must be authoritative. Terminal marker cannot be reset.
  ok(id(action)&&!root.external.ops.some(x=>x.id===action),"duplicate action");
  const r=copy(root),j=r.external.judgement;
  r.seq++;
  if(qualifies){r.active.clock++;j.streak++;if(j.streak>=15&&!j.pending){j.count=0;j.warned=false;j.streak=0}}
  r.external.ops.push({id:action,payload:"synthetic-forward",receipt:{seq:r.seq}});
  return r;
}
function tests(){
  const out=[],test=(name,f)=>{try{f();out.push({name,pass:true})}catch(e){out.push({name,pass:false,error:String(e)})}};
  const throws=f=>{let thrown=false;try{f()}catch(e){thrown=true}ok(thrown,"expected rejection")};
  const load=(r,i=0,op="load"+r.seq)=>confirm(r,prepare(r,i),op);
  const saved=()=>save(make(),0);
  const changed=r=>{const n=copy(r);n.seq++;n.active={clock:120,actors:[{id:"P",hp:40},{id:"N",hp:1}],relationships:{trust:-1},economy:{player:1,shop:699},objects:{food:0},knowledge:["abandoned-future"],plans:{npc:"sleep"},activities:{},reservations:[],scheduler:[],rng:{counter:99},milestones:{cosmic:"resolved"},narrative:["future"],decision:{choice:"future-choice",epoch:0}};return n};
  test("three slots only, fourth invalid",()=>{let r=saved();r=save(r,1);r=save(r,2);throws(()=>save(r,3));throws(()=>save(r,0));ok(r.external.slots.every(Boolean))});
  test("erase explicit before replacement; immutable archive retained",()=>{let r=saved();const before=canonical(r.external.archive);r=erase(r,0);ok(r.external.slots[0]===null&&canonical(r.external.archive)===before);r=save(r,0);ok(r.external.generations[0]===3)});
  test("prepare and cancel leave bytes unchanged",()=>{const r=saved(),before=canonical(r);prepare(r,0);ok(canonical(r)===before)});
  test("all rewindable domains restored; stale choice invalidated",()=>{const r=saved(),future=changed(r),z=load(future).root;for(const k of domains.filter(x=>x!=="decision"))ok(eq(z.active[k],r.active[k]),k);ok(z.active.decision.choice===null&&z.active.decision.epoch===1)});
  test("world identity fixed; new epoch and monotonic seq",()=>{const r=changed(saved()),z=load(r).root;ok(z.world===r.world&&z.seed===r.seed&&z.epoch===r.epoch+1&&z.seq===r.seq+1)});
  test("stale confirm after committed action rejected",()=>{const r=saved(),t=prepare(r,0),n=forward(r,"action",true),before=canonical(n);throws(()=>confirm(n,t,"load"));ok(canonical(n)===before)});
  test("erase and recreate invalidates old token",()=>{const r=saved(),t=prepare(r,0),n=save(erase(r,0),0);throws(()=>confirm(n,t,"load"))});
  test("corrupt snapshot rejected without partial external changes",()=>{const r=saved(),t=prepare(r,0);r.external.slots[0].state.economy.player++;const before=canonical(r);throws(()=>confirm(r,t,"load"));ok(canonical(r)===before)});
  test("foreign seed rejected",()=>{const r=saved();r.external.slots[0].seed="foreign";throws(()=>prepare(r,0))});
  test("missing domain rejected even with recomputed comparator",()=>{const r=saved(),s=r.external.slots[0];delete s.state.knowledge;s.integrity=canonical(s.state);throws(()=>prepare(r,0))});
  test("lost acknowledgement exact retry does not count twice",()=>{const r=saved(),t=prepare(r,0),z=confirm(r,t,"load"),again=confirm(z.root,t,"load");ok(again.replayed&&eq(again.receipt,z.receipt)&&eq(again.root,z.root)&&again.root.external.judgement.count===1)});
  test("divergent operation retry rejected",()=>{const r=saved(),t=prepare(r,0),z=confirm(r,t,"load");throws(()=>confirm(z.root,prepare(z.root,0),"load"))});
  test("technical restore of current bytes is not load",()=>{const r=load(saved()).root,z=JSON.parse(JSON.stringify(r));ok(eq(r,z)&&z.external.judgement.count===1&&z.epoch===1)});
  test("warning at eight only; pending at twenty-eight",()=>{let r=saved(),warnings=[];for(let i=1;i<=28;i++){const z=load(r);r=z.root;if(z.receipt.warning)warnings.push(i);ok(z.receipt.pending===(i>=28));ok(r.external.judgement.count===i)}ok(eq(warnings,[8]))});
  test("slot alias cannot reset same-checkpoint count",()=>{let r=save(saved(),1);for(let i=0;i<8;i++)r=load(r,i%2).root;ok(r.external.judgement.count===8&&r.external.judgement.warned)});
  test("fourteen qualifying actions do not reset; fifteenth resets",()=>{let r=load(saved()).root;for(let i=1;i<=15;i++){r=forward(r,"a"+i,true);ok(r.external.judgement.count===(i<15?1:0))}});
  test("nonqualifying receipt not credited; duplicate rejected",()=>{let r=load(saved()).root;r=forward(r,"nonmeaningful",false);ok(r.external.judgement.streak===0);throws(()=>forward(r,"nonmeaningful",false))});
  test("regression interrupts meaningful streak",()=>{let r=load(saved()).root;for(let i=0;i<14;i++)r=forward(r,"a"+i,true);r=load(r).root;r=forward(r,"newaction",true);ok(r.external.judgement.count===2&&r.external.judgement.streak===1)});
  test("pending marker survives rewind and forward streak; no death activated",()=>{let r=saved();for(let i=0;i<28;i++)r=load(r).root;for(let i=0;i<15;i++)r=forward(r,"a"+i,true);r=load(r).root;ok(r.external.judgement.pending&&r.active.actors[0].hp===90)});
  test("discarded staged rewind leaves both envelopes untouched",()=>{const r=changed(saved()),before=canonical(r);load(r);ok(canonical(r)===before)});
  return out;
}
// Production requirements still open: authenticated snapshot storage, full
// domain schema validation, stable checkpoint/encounter classification across
// different snapshots and characters, explicit epoch-bound tokens and receipt
// IDs, checked counters, atomic SQLite CAS, normal reopen, actual RNG restore,
// scoped narrative receipt, verified stuck detection/exemption and terminal
// penalty enforcement. The oracle must not be used as a save system.
// Same-checkpoint counts, reset and pending marker are only acceptance examples.
const report=tests();
console.log(JSON.stringify(report,null,2));
if(report.some(x=>!x.pass))process.exitCode=1;
