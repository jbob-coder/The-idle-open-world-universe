// Segmented SQLite integration and copy-migration tests; normal exits only.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDurableWorldStore } from './durable_world_store.mjs';
import { openSegmentedWorldStore } from './world_journal_segments.mjs';
import { DatabaseSync } from 'node:sqlite';
import { canonicalWorldJson, createAtomicMemoryStore, createWorldPersistenceReference } from './world_persistence_reference.mjs';
import { createWorldTransactionReference } from './world_transaction_reference.mjs';
import { createExecutionReference } from './npc_execution_reference.mjs';
import { createWorldSchedulerReference } from './world_scheduler_reference.mjs';
import { createPerceptionReference } from './npc_perception_reference.mjs';
import { createPlanningReference } from './npc_planning_reference.mjs';
import { generateNpcOpportunities } from './npc_opportunity_reference.mjs';
import { decideNpcReference } from './npc_cognition_reference.mjs';

const identity = {world_id:'fixture',seed:'fixed-fixture-seed'};
const deps = {canonical:canonicalWorldJson,persistence:createWorldPersistenceReference,executor:createExecutionReference,scheduler:createWorldSchedulerReference,perception:createPerceptionReference,planner:createPlanningReference,generate:generateNpcOpportunities,decide:decideNpcReference};
const dims = v => ({safety:v,resources:v,growth:v,connection:v,duty:v,rest:v});
const actor = actor_id => ({actor_id,revision:4,knowledge_revision:0,resources:100,life_status:'active'});
const initial = {world_id:'fixture',now:10,actors:['P','A','B'].map(actor),npc_configs:['A','B'].map(actor_id=>({actor_id,capabilities:['study'],motivation:{risk_aversion:0,stress:0,needs:dims(0),values:dims(1),goals:[{id:'learn',dimension:'growth',status:'active',urgency:5}]},plan:{world_id:'fixture',actor_id,plan_id:'plan_'+actor_id,goal_id:'learn',steps:[{id:'lesson',units:3,requires:[],options:[{opportunity_id:'study__lesson',action_id:'study'}]}]}}))};
const offer = (a,t,r,kr,action,opp,duration) => ({world_id:'fixture',actor_id:a,actor_revision:r,knowledge_revision:kr,action_id:action,opportunity_id:opp,kind:'action',valid_until:t,feasible:true,exclusive_target:null,credit_cap:10,phases:[{kind:'execution',duration,cost:1,interruptible:true,credit_per_tick:1}]});
const context = (actor_id,present=true)=>({actor_id,world_id:'fixture',can_acquire:true,present,in_range:true,detected:true,path_clear:true});
const frame = (id,tick,actors,claims)=>({world_id:'fixture',tick,actors,event:{id,world_id:'fixture',tick,committed:true,channel:'direct',observable_claims:claims,private_claims:[{key:'hidden',value:'PRIVATE_FIXTURE_CANARY'}]}});
const adapters = {resolveOffer:(c,d)=>offer(c.actor_id,c.now,c.actor_revision,c.knowledge_revision,d.action_id,d.opportunity_id,2),projectOutcome:r=>r.actor_id==='A'?frame(r.event_id,r.tick,[context('A',false),context('B')],[{key:'study_outcome',value:r.outcome}]):null};
const world = (store,ad=adapters)=>createWorldTransactionReference(store,deps,ad,'disk-fixture-v1',identity);
const schedule = event=>({kind:'schedule',event:{world_id:'fixture',...event}});
const commands = [
 {kind:'observe',frame:frame('lesson_event',10,[context('A'),context('B',false)],[{key:'opp:lesson:lesson',value:'open'}])},
 schedule({id:'review_A',tick:10,kind:'review',actor_id:'A',interval:2}),
 schedule({id:'review_B',tick:10,kind:'review',actor_id:'B',interval:2}),
 schedule({id:'interrupt_A',tick:11,kind:'interrupt',actor_id:'A',attempt_id:'npc_1_5_10',outcome:'interrupted',player_observed:false,requires_decision:false}),
 schedule({id:'player_pause',tick:11,kind:'world',player_observed:true,requires_decision:true}),
 {kind:'publish',offer:offer('P',10,4,0,'work','work',10)},
 {kind:'submit',submission:{kind:'start',submission_id:'s1',horizon:20,attempt_id:'p1',intent:{world_id:'fixture',actor_id:'P',actor_revision:4,knowledge_revision:0,decision_tick:10,kind:'intent',opportunity_id:'work',action_id:'work',disposition:'action'}}},
 {kind:'run',budget:1},
 {kind:'run',budget:100},
 {kind:'submit',submission:{kind:'resume',submission_id:'s2',horizon:20,attempt_id:'p1'}},
 {kind:'run',budget:100}
];
const apply = (w,i)=>w.commit('tx'+(i+1),i,commands[i]);
const plan = (r,a='A')=>r.checkpoint.scheduler.plans.find(p=>p.actor_id===a);
const state = (r,a)=>r.checkpoint.executor.actors.find(p=>p.actor_id===a);
const knowledge = (r,a)=>r.checkpoint.scheduler.knowledge.find(k=>k.actor_id===a);
const activity = (r,a)=>r.checkpoint.executor.active.find(x=>x.actor_id===a);
if(process.argv[2]==='child') {
 const [, , ,mode,path,index,actorId] = process.argv;
 const legacy=mode.startsWith('legacy-');
 const disk = legacy?openDurableWorldStore(path,{identity,mode:mode==='legacy-init'?'create':'open'}):openSegmentedWorldStore(path,{identity,segmentSize:3,mode:['init','migrate'].includes(mode)?'create':'open'});
 try {
  const store = mode==='before'||mode==='after'?{read:disk.read,compareAndSwap:(a,b)=>{if(mode==='after')assert.equal(disk.compareAndSwap(a,b),true);throw Error('controlled acknowledgment failure');}}:disk;
  const w = world(store);
  if(mode==='init'||mode==='legacy-init')w.initialize(initial,'P',identity.seed);
  else if(mode==='commit'||mode==='legacy-commit')apply(w,Number(index));
  else if(mode==='migrate'){const source=openDurableWorldStore(actorId,{identity});try{disk.importVerified(source,world)}finally{source.close()}}
  else if(mode==='describe')console.log(JSON.stringify(disk.describe()));
  else if(mode==='bytes'||mode==='legacy-bytes')console.log(JSON.stringify(disk.read()));
  else if(mode==='before'||mode==='after')assert.throws(()=>apply(w,Number(index)),/^Error: controlled acknowledgment failure$/);
  else if(mode==='projection-error') {
   const invalid = world(disk,{...adapters,projectOutcome:r=>r.actor_id==='A'?frame('wrong_event',r.tick,[context('B')],[{key:'study_outcome',value:r.outcome}]):null});
   assert.throws(()=>apply(invalid,Number(index)),/outcome integration failed/);
  } else if(mode==='view') {
   const bound=w.bindActor(actorId);console.log(JSON.stringify({cognition:bound.forCognition('P'),narrative:bound.forNarrative('P')}));
  } else assert.equal(mode,'read');
  if(!['view','describe','bytes','legacy-bytes'].includes(mode))console.log(JSON.stringify(w.recover()));
 } finally {disk.close();}
} else {
 const dir=mkdtempSync(join(tmpdir(),'godseed-segments-'));
 const script=fileURLToPath(import.meta.url);let n=0,fail=0;
 const test=(name,f)=>{n++;try{f();console.log('PASS',name)}catch(e){fail++;console.error('FAIL',name,e)}};
 // No process-termination signals or child timeouts. Each fixture has finite commands and scheduler work budgets.
 const child=(mode,path,index=0,actorId='A')=>{
  const r=spawnSync(process.execPath,[script,'child',mode,path,String(index),actorId],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout);
 };
 const setup=(count=0)=>{const path=join(dir,`world-${n}.db`);child('init',path);for(let i=0;i<count;i++)child('commit',path,i);return path};
 try {
  test('normal reopen preserves actor-owned evidence and matching revisions',()=>{const p=setup(1),r=child('read',p);assert.equal(r.seed,identity.seed);assert.equal(knowledge(r,'A').revision,1);assert.equal(state(r,'A').knowledge_revision,1);assert.equal(state(r,'A').revision,5);assert.equal(knowledge(r,'B').revision,0)});
  test('pending plan and active attempt recover together',()=>{const p=setup(8),r=child('read',p);assert.equal(r.checkpoint.executor.now,10);assert.equal(plan(r).pending.attempt_id,activity(r,'A').attempt_id);assert.equal(plan(r).steps[0].credited_units,0);assert.equal(state(r,'A').resources,99)});
  test('interrupted partial progress and observer evidence persist at pause',()=>{const p=setup(9),r=child('read',p);assert.equal(r.checkpoint.executor.now,11);assert.equal(r.checkpoint.scheduler.view.status,'player_decision');assert.equal(plan(r).pending,null);assert.equal(plan(r).steps[0].credited_units,1);assert.equal(plan(r).history[0].receipt.outcome,'interrupted');assert.equal(knowledge(r,'B').revision,1);assert.equal(state(r,'B').knowledge_revision,1)});
  test('resume completes remaining work with no duplicate charge or settlement',()=>{const p=setup(11),r=child('read',p);assert.equal(r.checkpoint.executor.now,20);assert.equal(plan(r).status,'complete');assert.deepEqual(plan(r).history.map(x=>x.receipt.credited_units),[1,2]);assert.equal(state(r,'A').resources,98);assert.equal(plan(r,'B').steps[0].credited_units,0);assert.equal(knowledge(r,'B').revision,2);assert.equal(state(r,'B').knowledge_revision,2)});
  test('bound actor views remain private after separate process reopening',()=>{const p=setup(11),a=child('view',p,0,'A'),b=child('view',p,0,'B');for(const v of [a,b]){assert.deepEqual(v.cognition,v.narrative);assert.ok(!JSON.stringify(v).includes('PRIVATE_FIXTURE_CANARY'))}assert.equal(a.cognition.actor_id,'A');assert.equal(b.cognition.actor_id,'B');assert.equal(a.cognition.observations.length,1);assert.equal(b.cognition.observations.length,2);assert.ok(b.cognition.observations.every(o=>o.claims.every(c=>c.key!=='opp:lesson:lesson')))});
  test('controlled precommit error preserves all prior subsystem states',()=>{const p=setup(8),before=child('read',p);assert.deepEqual(child('before',p,8),before);assert.deepEqual(child('read',p),before);assert.equal(plan(child('commit',p,8)).steps[0].credited_units,1)});
  test('controlled postcommit error retries without duplicate credit or observations',()=>{const p=setup(10),r=child('after',p,10);assert.equal(r.revision,11);assert.deepEqual(child('read',p),r);assert.deepEqual(child('commit',p,10),r);assert.equal(plan(r).history.length,2);assert.equal(knowledge(r,'B').revision,2)});
  test('invalid outcome projection aborts integrated transaction on disk',()=>{const p=setup(8),before=child('read',p);assert.deepEqual(child('projection-error',p,8),before);assert.deepEqual(child('read',p),before);assert.equal(plan(child('commit',p,8)).steps[0].credited_units,1)});
  test('all committed disk state equals uninterrupted in-memory reference',()=>{const p=setup(11),mem=world(createAtomicMemoryStore());mem.initialize(initial,'P',identity.seed);commands.forEach((_,i)=>apply(mem,i));assert.deepEqual(child('read',p),mem.recover())});
  test('bounded active segment and exact archived transaction retry',()=>{const p=setup(11),d=child('describe',p);assert.deepEqual(d,{revision:11,segment_size:3,segments:[{index:0,first_revision:1,last_revision:3,sealed:true},{index:1,first_revision:4,last_revision:6,sealed:true},{index:2,first_revision:7,last_revision:9,sealed:true},{index:3,first_revision:10,last_revision:11,sealed:false}],active_commands:2});const before=child('bytes',p);assert.equal(child('commit',p,0).revision,11);assert.equal(child('bytes',p),before)});
  const legacySetup=count=>{const p=join(dir,`legacy-${n}.db`);child('legacy-init',p);for(let i=0;i<count;i++)child('legacy-commit',p,i);return p};
  test('verified point-in-time migration preserves exact bytes and continues',()=>{const src=legacySetup(9),p=join(dir,`migrated-${n}.db`),raw=child('legacy-bytes',src);child('migrate',p,0,src);assert.equal(child('bytes',p),raw);assert.equal(child('legacy-bytes',src),raw);for(let i=9;i<commands.length;i++)child('commit',p,i);const mem=world(createAtomicMemoryStore());mem.initialize(initial,'P',identity.seed);commands.forEach((_,i)=>apply(mem,i));assert.deepEqual(child('read',p),mem.recover());assert.equal(child('legacy-bytes',src),raw)});
  test('migration rejects initialized target without modifying either record',()=>{const p=setup(1),src=legacySetup(3),a=openSegmentedWorldStore(p,{identity,segmentSize:3}),b=openDurableWorldStore(src,{identity});try{const before=a.read(),source=b.read();assert.throws(()=>a.importVerified(b,world),/already initialized/);assert.equal(a.read(),before);assert.equal(b.read(),source)}finally{a.close();b.close()}});
  test('invalid source fails verification and leaves destination empty',()=>{const src=legacySetup(3),b=openDurableWorldStore(src,{identity}),p=join(dir,`invalid-${n}.db`),a=openSegmentedWorldStore(p,{identity,segmentSize:3,mode:'create'});try{const raw=b.read(),r=JSON.parse(raw);r.checkpoint.executor.now++;const bad={read:()=>canonicalWorldJson(r)};assert.throws(()=>a.importVerified(bad,world));assert.equal(a.read(),null);assert.equal(b.read(),raw)}finally{a.close();b.close()}});
  test('controlled SQL error rolls back all imported rows',()=>{const src=legacySetup(4),b=openDurableWorldStore(src,{identity}),p=join(dir,`rollback-${n}.db`),a=openSegmentedWorldStore(p,{identity,segmentSize:3,mode:'create'}),db=new DatabaseSync(p);try{db.exec("CREATE TRIGGER fixture_abort BEFORE INSERT ON commands WHEN NEW.revision=2 BEGIN SELECT RAISE(ABORT,'fixture error'); END;");const raw=b.read();assert.throws(()=>a.importVerified(b,world),/fixture error/);assert.equal(a.read(),null);assert.equal(db.prepare('SELECT count(*) AS n FROM commands').get().n,0);assert.equal(b.read(),raw)}finally{db.close();a.close();b.close()}});
  test('normal commit cannot rewrite archived command or initial identity',()=>{const p=setup(4),a=openSegmentedWorldStore(p,{identity,segmentSize:3});try{const raw=a.read(),r=JSON.parse(raw);r.revision++;r.journal.push({revision:r.revision,transaction_id:'new',command:{kind:'run',budget:1}});r.journal[0].command.frame.event.observable_claims[0].value='changed';assert.throws(()=>a.compareAndSwap(raw,canonicalWorldJson(r)),/rewrite/);assert.equal(a.read(),raw)}finally{a.close()}});
  test('SQL append-only triggers protect prior rows from ordinary updates and deletes',()=>{const p=setup(4),db=new DatabaseSync(p);try{assert.throws(()=>db.exec("UPDATE commands SET bytes='changed' WHERE revision=1"),/append-only/);assert.throws(()=>db.exec('DELETE FROM commands WHERE revision=1'),/append-only/);assert.equal(db.prepare('SELECT count(*) AS n FROM commands').get().n,4)}finally{db.close()}assert.equal(child('read',p).revision,4)});
  test('damaged head fails closed and wrong segment size cannot open',()=>{const p=setup(4);assert.throws(()=>openSegmentedWorldStore(p,{identity,segmentSize:4}));const db=new DatabaseSync(p);try{db.exec("UPDATE head SET digest='bad'")}finally{db.close()}assert.throws(()=>openSegmentedWorldStore(p,{identity,segmentSize:3}),/digest mismatch/)});
  test('sealed rows remain byte-for-byte unchanged after new segment appends',()=>{const p=setup(3),rows=()=>{const db=new DatabaseSync(p);try{return db.prepare('SELECT * FROM commands WHERE revision<=3 ORDER BY revision').all()}finally{db.close()}};const before=rows();for(let i=3;i<commands.length;i++)child('commit',p,i);assert.deepEqual(rows(),before)});
  test('stale writer and conflicting historical retry cannot change committed state',()=>{const p=setup(3),a=openSegmentedWorldStore(p,{identity,segmentSize:3});try{const old=a.read();child('commit',p,3);const current=a.read();assert.equal(a.compareAndSwap(old,current),false);assert.throws(()=>world(a).commit('tx1',0,{kind:'run',budget:1}),/conflicting transaction replay/);assert.equal(a.read(),current)}finally{a.close()}});
  test('source changes during verification reject migration',()=>{const src=legacySetup(2),b=openDurableWorldStore(src,{identity}),p=join(dir,`changed-${n}.db`),a=openSegmentedWorldStore(p,{identity,segmentSize:3,mode:'create'});try{const raw=b.read();let calls=0;assert.throws(()=>a.importVerified({read:()=>++calls===1?raw:null},world),/source changed/);assert.equal(a.read(),null);assert.equal(b.read(),raw)}finally{a.close();b.close()}});
  test('foreign identity and existing create path rejected without overwrite',()=>{const p=setup(3),before=child('bytes',p);assert.throws(()=>openSegmentedWorldStore(p,{identity:{...identity,seed:'wrong'},segmentSize:3}));assert.throws(()=>openSegmentedWorldStore(p,{identity,segmentSize:3,mode:'create'}));assert.equal(child('bytes',p),before)});
 } finally {rmSync(dir,{recursive:true,force:true})}
 console.log(`${n-fail}/${n} passed`);if(fail)process.exitCode=1;
}
