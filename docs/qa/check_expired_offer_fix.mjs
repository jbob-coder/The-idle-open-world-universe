// Apply-ready reference fix regression; no production adapter or live saves.
// Native command: node docs/qa/check_expired_offer_fix.mjs
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createExecutionReference as legacy} from '../../tools/npc_execution_reference.mjs';
import {createWorldSchedulerReference as scheduler} from '../../tools/world_scheduler_reference.mjs';
import {createWorldPersistenceReference as persistence,createAtomicMemoryStore as memory,canonicalWorldJson as canonical} from '../../tools/world_persistence_reference.mjs';
const original=readFileSync(new URL('../../tools/npc_execution_reference.mjs',import.meta.url),'utf8');
const hash=createHash('sha1').update('blob '+Buffer.byteLength(original)+'\0').update(original).digest('hex');
if(hash!=='835fcafba4fb566001b743e1c028c5cb689bcecb')throw Error('reference changed; rebase patch and review');
const old="  ensure(!offers.has(key)||offers.get(key).actor_revision!==actors.get(o.actor_id).revision,\"duplicate current offer\");",replacement="  ensure(!offers.has(key)||offers.get(key).actor_revision!==actors.get(o.actor_id).revision||offers.get(key).valid_until<now,\"duplicate current offer\");";
if(original.split(old).length!==2)throw Error('unexpected patch count');
const candidate=(await import('data:text/javascript;base64,'+Buffer.from(original.replace(old,replacement)).toString('base64'))).createExecutionReference;
const ok=(v,m='assertion')=>{if(!v)throw Error(m)}, rejects=f=>{try{f();return false}catch{return true}};
const spec={world_id:"W",now:0,actors:["P","A"].map(actor_id=>({actor_id,revision:0,knowledge_revision:0,resources:100,life_status:"active"}))};
const offer=(actor_id,rev,until,duration=2)=>({world_id:"W",actor_id,actor_revision:rev,knowledge_revision:0,action_id:"work",opportunity_id:"work",kind:"action",valid_until:until,feasible:true,exclusive_target:null,credit_cap:10,phases:[{kind:"execution",duration,cost:1,interruptible:true,credit_per_tick:1}]});
const intent=(actor_id,rev,t)=>({kind:"intent",world_id:"W",actor_id,actor_revision:rev,knowledge_revision:0,decision_tick:t,opportunity_id:"work",action_id:"work",disposition:"action"});
const review=c=>({intent:intent(c.actor_id,c.actor_revision,c.now),offer:offer(c.actor_id,c.actor_revision,c.now),attempt_id:"a1"});
const versionOld="offer-legacy",versionNew="offer-expiry-review";
const open=(store,E,version)=>persistence(store,E,scheduler,review,version);
const commands=[{kind:"publish",offer:offer("A",0,0)},{kind:"publish",offer:offer("P",0,0,4)},{kind:"schedule",event:{id:"r",world_id:"W",tick:2,kind:"review",actor_id:"A",interval:10}},{kind:"submit",submission:{kind:"start",submission_id:"s",horizon:4,attempt_id:"p1",intent:intent("P",0,0)}},{kind:"run",budget:100}];
function scenario(E,version){const store=memory(),p=open(store,E,version);p.initialize(spec,"P","seed");commands.forEach((c,i)=>p.commit("t"+i,i,c));return {store,p,view:p.recover().checkpoint}}
const L=scenario(legacy,versionOld),N=scenario(candidate,versionNew);
const outcome=x=>x.view.executor.outcomes.find(o=>o.actor_id==="A");
const fresh=()=>{const x=candidate(spec);x.publishOffer(offer("A",0,0));return x};
let count=0;function test(n,f){f();count++;console.log("PASS "+n)}
test("legacy journal reproduces blocked renewal",()=>ok(!outcome(L)&&L.view.executor.now===4));
test("candidate renews and completes independent work",()=>ok(outcome(N)?.credited_units===2&&N.view.executor.now===4));
test("same endpoint duplicate remains rejected",()=>{const x=fresh();ok(rejects(()=>x.publishOffer(offer("A",0,1)))&&x.admit(intent("A",0,0),"at0").accepted)});
test("old expired offer does not admit",()=>{const x=fresh();x.advanceTo(1);ok(rejects(()=>x.admit(intent("A",0,1),"late")))});
test("renewal changes neither clock nor actor state",()=>{const x=fresh();x.advanceTo(1);const before=canonical(x.state());x.publishOffer(offer("A",0,1));ok(canonical(x.state())===before&&x.admit(intent("A",0,1),"new").accepted)});
test("expired replacement and stale revision rejected",()=>{const x=fresh();x.advanceTo(1);ok(rejects(()=>x.publishOffer(offer("A",0,0)))&&rejects(()=>x.publishOffer(offer("A",1,1))))});
test("replacement survives private checkpoint reconstruction",()=>{const x=fresh();x.advanceTo(1);x.publishOffer(offer("A",0,1));const restored=candidate(spec,JSON.parse(JSON.stringify(x.exportCheckpoint())));ok(restored.admit(intent("A",0,1),"restored").accepted)});
test("old adapter exact recovery preserves original bytes",()=>{const bytes=L.store.read();ok(canonical(open(L.store,legacy,versionOld).recover().checkpoint)===canonical(L.view)&&L.store.read()===bytes)});
test("new adapter cannot read old journal by version",()=>{const bytes=L.store.read();ok(rejects(()=>open(L.store,candidate,versionNew).recover())&&L.store.read()===bytes)});
test("old adapter cannot read new journal by version",()=>{const bytes=N.store.read();ok(rejects(()=>open(N.store,legacy,versionOld).recover())&&N.store.read()===bytes)});
test("same-version semantic substitution fails replay validation",()=>{const bytes=L.store.read();ok(rejects(()=>open(L.store,candidate,versionOld).recover())&&L.store.read()===bytes)});
test("new journal exact recovery and retry do not change bytes",()=>{const bytes=N.store.read(),p=open(N.store,candidate,versionNew);ok(canonical(p.recover().checkpoint)===canonical(N.view)&&p.commit("t4",4,commands[4]).replayed&&N.store.read()===bytes)});
test("conflicting retry rejected without mutation",()=>{const bytes=N.store.read();ok(rejects(()=>N.p.commit("t4",4,{kind:"run",budget:99}))&&N.store.read()===bytes)});
console.log(count+"/"+count+" PASS");
// Fixture adapter version names are not the accepted production names.
// No actual migration, V2 integration, durable disk, Android or full-suite claim.
