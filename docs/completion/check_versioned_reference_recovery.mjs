// Exact source pins; isolated expiry candidate; no runtime file modifications.
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createVersionedReferenceRecovery} from './versioned_reference_recovery.mjs';
const root=new URL('../../',import.meta.url);
const pins={
  "tools/npc_execution_reference.mjs": "835fcafba4fb566001b743e1c028c5cb689bcecb",
  "tools/world_scheduler_reference.mjs": "87827592c148078ccf8bed50f32b8d6ce4f2a909",
  "tools/world_persistence_reference.mjs": "351280acb8b1ff6bae5deec4133ce3bb658d3894"
};
const src={};for(const [p,sha] of Object.entries(pins)){const bytes=readFileSync(new URL(p,root));if(createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex')!==sha)throw Error('source changed '+p);src[p]=bytes.toString('utf8')}
const old="  ensure(!offers.has(key)||offers.get(key).actor_revision!==actors.get(o.actor_id).revision,\"duplicate current offer\");",next="  ensure(!offers.has(key)||offers.get(key).actor_revision!==actors.get(o.actor_id).revision||offers.get(key).valid_until<now,\"duplicate current offer\");";
if(src['tools/npc_execution_reference.mjs'].split(old).length!==2)throw Error('patch anchor');
const load=source=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const legacy=(await load(src['tools/npc_execution_reference.mjs'])).createExecutionReference;
const candidate=(await load(src['tools/npc_execution_reference.mjs'].replace(old,()=>next))).createExecutionReference;
const scheduler=(await load(src['tools/world_scheduler_reference.mjs'])).createWorldSchedulerReference;
const p=await load(src['tools/world_persistence_reference.mjs']);

function runVersionedTests(legacy,candidate,scheduler,persistence,memory,canonical,dispatch){
 const ok=(v,m)=>{if(!v)throw Error(m||"assertion")},rejects=(fn,reason)=>{let err;try{fn()}catch(e){err=e}ok(err&&(!reason||String(err).includes(reason)),"expected rejection "+reason)};
 const identity={world_id:"W",seed:"seed"};
 const spec={world_id:"W",now:0,actors:["P","A"].map(actor_id=>({actor_id,revision:0,knowledge_revision:0,resources:100,life_status:"active"}))};
 const offer=(actor_id,until,duration=2)=>({world_id:"W",actor_id,actor_revision:0,knowledge_revision:0,action_id:"work",opportunity_id:"work",kind:"action",valid_until:until,feasible:true,exclusive_target:null,credit_cap:10,phases:[{kind:"execution",duration,cost:1,interruptible:true,credit_per_tick:1}]});
 const intent=(actor_id,t)=>({kind:"intent",world_id:"W",actor_id,actor_revision:0,knowledge_revision:0,decision_tick:t,opportunity_id:"work",action_id:"work",disposition:"action"});
 const review=c=>({intent:intent(c.actor_id,c.now),offer:offer(c.actor_id,c.now),attempt_id:"a1"});
 const tags=["offer-legacy","offer-expiry-review"];
 const factories=[legacy,candidate].map((E,i)=>({version:tags[i],open:(store,id)=>persistence(store,E,scheduler,review,tags[i],id)}));
 const commands=[{kind:"publish",offer:offer("A",0)},{kind:"publish",offer:offer("P",0,4)},{kind:"schedule",event:{id:"r",world_id:"W",tick:2,kind:"review",actor_id:"A",interval:10}},{kind:"submit",submission:{kind:"start",submission_id:"s",horizon:4,attempt_id:"p1",intent:intent("P",0)}},{kind:"run",budget:100}];
 function make(i,n=commands.length){const store=memory(),p=factories[i].open(store,identity);p.initialize(spec,"P","seed");commands.slice(0,n).forEach((c,j)=>p.commit("t"+j,j,c));return {store,p}}
 const route=store=>dispatch(store,canonical,factories,identity);
 const hasWork=p=>p.recover().checkpoint.executor.outcomes.some(o=>o.actor_id==="A"&&o.credited_units===2);
 const alter=(store,f)=>{const before=store.read(),root=JSON.parse(before);f(root);ok(store.compareAndSwap(before,canonical(root)))};
 let count=0;const test=(name,fn)=>{fn();count++;console.log("PASS "+name)};
 for(let i=0;i<2;i++)test("version-specific read and exact continuation "+i,()=>{
  const a=make(i,4),b=make(i,4),q=route(b.store),prior=b.store.read();
  ok(canonical(q.recover())===canonical(b.p.recover())&&b.store.read()===prior);
  a.p.commit("t4",4,commands[4]);q.commit("t4",4,commands[4]);ok(a.store.read()===b.store.read()&&hasWork(q)===(i===1));
  const raw=b.store.read();ok(q.commit("t4",4,commands[4]).replayed&&b.store.read()===raw);rejects(()=>q.commit("t4",4,{kind:"run",budget:99}));ok(b.store.read()===raw);
 });
 test("unknown version fails before factory selection",()=>{const {store}=make(0);alter(store,r=>r.adapter_version="future");const raw=store.read();rejects(()=>route(store).recover(),"unsupported adapter version");ok(store.read()===raw)});
 test("wrong trusted seed rejected",()=>{const {store}=make(0);rejects(()=>dispatch(store,canonical,factories,{...identity,seed:"other"}).recover(),"identity mismatch")});
 test("wrong trusted world rejected",()=>{const {store}=make(0);rejects(()=>dispatch(store,canonical,factories,{...identity,world_id:"other"}).recover(),"identity mismatch")});
 test("duplicate registry version rejected",()=>rejects(()=>dispatch(memory(),canonical,[factories[0],factories[0]],identity),"duplicate"));
 test("missing record does not initialize",()=>{const store=memory();rejects(()=>route(store).recover(),"missing");ok(store.read()===null)});
 test("corrupt checkpoint rejected by actual replay",()=>{const {store}=make(1);alter(store,r=>r.checkpoint.executor.now++);const raw=store.read();rejects(()=>route(store).recover(),"checkpoint differs");ok(store.read()===raw)});
 test("changing known tag on incompatible history fails replay",()=>{const {store}=make(0);alter(store,r=>r.adapter_version=tags[1]);rejects(()=>route(store).recover(),"checkpoint differs")});
 test("noncanonical bytes rejected",()=>{const {store}=make(0),raw=store.read();ok(store.compareAndSwap(raw," "+raw));rejects(()=>route(store).recover(),"invalid journal envelope")});
 test("version selection uses original-byte CAS even on concurrent change",()=>{const a=make(0,4),b=make(1,4),newBytes=b.store.read();let reads=0;const racing={read(){reads++;const raw=a.store.read();if(reads===1)ok(a.store.compareAndSwap(raw,newBytes));return raw},compareAndSwap:a.store.compareAndSwap};rejects(()=>route(racing).commit("t4",4,commands[4]),"commit conflict");ok(a.store.read()===newBytes&&reads===1)});
 test("read-only adapter cannot write through scoped store",()=>{const {store}=make(0),raw=store.read();const rogue={version:tags[0],open:s=>({recover:()=>s.compareAndSwap(raw,raw)})};rejects(()=>dispatch(store,canonical,[rogue],identity).recover(),"invalid adapter write");ok(store.read()===raw)});
 test("adapter cannot rewrite version through commit",()=>{const {store}=make(0),raw=store.read();const rogue={version:tags[0],open:s=>({commit:()=>{const r=JSON.parse(raw);r.adapter_version=tags[1];return s.compareAndSwap(raw,canonical(r))}})};rejects(()=>dispatch(store,canonical,[rogue,factories[1]],identity).commit("t5",5,commands[4]),"version change forbidden");ok(store.read()===raw)});
 test("private checkpoint read exact; existing standalone continuation mismatch remains",()=>{const {store,p}=make(1,4),q=route(store),raw=store.read(),cp=q.exportPrivateCheckpoint();ok(canonical(cp)===canonical(p.exportPrivateCheckpoint()));rejects(()=>p.verifyCheckpointContinuation(cp,[commands[4]]),"invalid execution checkpoint identity");rejects(()=>q.verifyCheckpointContinuation(cp,[commands[4]]),"invalid execution checkpoint identity");ok(store.read()===raw)});
 test("registry and identity captured at construction",()=>{const {store}=make(0),entries=factories.map(a=>({...a})),id={...identity},q=dispatch(store,canonical,entries,id);entries[0].open=()=>{throw Error("mutated")};entries.length=0;id.seed="changed";ok(q.recover().world_id==="W")});
 console.log(count+"/"+count+" passed");return count;
}

runVersionedTests(legacy,candidate,scheduler,p.createWorldPersistenceReference,p.createAtomicMemoryStore,p.canonicalWorldJson,createVersionedReferenceRecovery);
