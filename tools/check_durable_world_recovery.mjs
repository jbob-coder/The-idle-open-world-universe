// Real subprocess recovery of the existing scheduler/executor command journal.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDurableWorldStore } from './durable_world_store.mjs';
import { createAtomicMemoryStore, createWorldPersistenceReference } from './world_persistence_reference.mjs';
import { createExecutionReference } from './npc_execution_reference.mjs';
import { createWorldSchedulerReference } from './world_scheduler_reference.mjs';

const identity = { world_id:'fixture', seed:'fixed-fixture-seed' };
const actor = actor_id => ({actor_id,revision:4,knowledge_revision:0,resources:100,life_status:'active'});
const initial = {world_id:'fixture',now:10,actors:[actor('P'),actor('A')]};
const offer = (a,t,r,duration) => ({world_id:'fixture',actor_id:a,actor_revision:r,knowledge_revision:0,opportunity_id:'work',action_id:'work',kind:'action',valid_until:t,feasible:true,exclusive_target:null,credit_cap:100,phases:[{kind:'execution',duration,cost:1,interruptible:true,credit_per_tick:1}]});
const intent = (a,t,r) => ({kind:'intent',world_id:'fixture',actor_id:a,actor_revision:r,knowledge_revision:0,decision_tick:t,opportunity_id:'work',action_id:'work',disposition:'action'});
const review = c => ({offer:offer(c.actor_id,c.now,c.actor_revision,2),intent:intent(c.actor_id,c.now,c.actor_revision),attempt_id:`npc_${c.now}`});
const journal = store => createWorldPersistenceReference(store,createExecutionReference,createWorldSchedulerReference,review,'durable-fixture-v1',identity);
const commands = [
 {kind:'schedule',event:{id:'review',world_id:'fixture',tick:10,kind:'review',actor_id:'A',interval:2}},
 {kind:'schedule',event:{id:'pause',world_id:'fixture',tick:14,kind:'world',player_observed:true,requires_decision:true}},
 {kind:'publish',offer:offer('P',10,4,10)},
 {kind:'submit',submission:{kind:'start',submission_id:'s1',horizon:20,attempt_id:'p1',intent:intent('P',10,4)}},
 {kind:'run',budget:1},
 {kind:'run',budget:100},
 {kind:'submit',submission:{kind:'resume',submission_id:'s2',horizon:20,attempt_id:'p1'}},
 {kind:'run',budget:100}
];
const apply = (p,i) => p.commit(`tx${i+1}`,i,commands[i]);
if(process.argv[2]==='child') {
 const [, , , mode,path,index] = process.argv;
 const disk=openDurableWorldStore(path,{identity,mode:mode==='init'?'create':'open'});
 try {
  const store=mode==='before'||mode==='after'?{read:disk.read,compareAndSwap:(a,b)=>{if(mode==='after')assert.equal(disk.compareAndSwap(a,b),true);process.kill(process.pid,'SIGKILL');}}:disk;
  const p=journal(store);
  if(mode==='init')p.initialize(initial,'P',identity.seed);
  else if(mode!=='read')apply(p,Number(index));
  console.log(JSON.stringify(p.recover()));
 } finally {disk.close();}
} else {
 const dir=mkdtempSync(join(tmpdir(),'godseed-recovery-'));
 const script=fileURLToPath(import.meta.url);let n=0,fail=0;
 const test=(name,f)=>{n++;try{f();console.log('PASS',name)}catch(e){fail++;console.error('FAIL',name,e)}};
 const child=(mode,path,index=0)=>spawnSync(process.execPath,[script,'child',mode,path,String(index)],{encoding:'utf8',timeout:15000});
 const readChild=(mode,path,index=0)=>{const r=child(mode,path,index);assert.equal(r.status,0,r.stderr);return JSON.parse(r.stdout)};
 const path=()=>join(dir,`world-${n}.db`);
 const setup=(count=0)=>{const p=path();readChild('init',p);for(let i=0;i<count;i++)readChild('commit',p,i);return p};
 try {
  test('real restarts preserve seed, queue and admitted session',()=>{const p=setup(5),r=readChild('read',p);assert.equal(r.seed,identity.seed);assert.equal(r.revision,5);assert.equal(r.checkpoint.executor.now,10);assert.equal(r.checkpoint.scheduler.session.attempt_id,'p1');assert.equal(r.checkpoint.executor.active.length,2)});
  test('process restart preserves pause and partial player progress',()=>{const p=setup(6),r=readChild('read',p);assert.equal(r.checkpoint.executor.now,14);assert.equal(r.checkpoint.scheduler.view.status,'player_decision');assert.equal(r.checkpoint.executor.active.find(a=>a.actor_id==='P').credited_units,4)});
  test('resume and final outcome survive separate processes',()=>{const p=setup(8),r=readChild('read',p);assert.equal(r.checkpoint.executor.now,20);assert.equal(r.checkpoint.executor.outcomes.find(a=>a.actor_id==='P').credited_units,10);assert.equal(r.checkpoint.executor.outcomes.filter(a=>a.actor_id==='A').length,5);assert.equal(r.checkpoint.executor.actors.find(a=>a.actor_id==='P').resources,99)});
  test('terminated before database commit leaves complete previous checkpoint',()=>{const p=setup(5),before=readChild('read',p);assert.equal(child('before',p,5).signal,'SIGKILL');assert.deepEqual(readChild('read',p),before);assert.equal(readChild('commit',p,5).checkpoint.executor.now,14)});
  test('terminated after commit retries idempotently without duplicate work',()=>{const p=setup(7);assert.equal(child('after',p,7).signal,'SIGKILL');const committed=readChild('read',p);assert.equal(committed.revision,8);assert.deepEqual(readChild('commit',p,7),committed);assert.equal(committed.checkpoint.executor.outcomes.filter(a=>a.actor_id==='P').length,1)});
  test('disk restarts equivalent to uninterrupted memory reference',()=>{const p=setup(8),mem=journal(createAtomicMemoryStore());mem.initialize(initial,'P',identity.seed);commands.forEach((_,i)=>apply(mem,i));assert.deepEqual(readChild('read',p),mem.recover())});
 } finally {rmSync(dir,{recursive:true,force:true})}
 console.log(`${n-fail}/${n} passed`);if(fail)process.exitCode=1;
}
