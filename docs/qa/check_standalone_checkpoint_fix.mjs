// Native command: node docs/qa/check_standalone_checkpoint_fix.mjs
// Exercises an isolated source substitution; does not edit the world runtime.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createExecutionReference} from '../../tools/npc_execution_reference.mjs';
import {createWorldSchedulerReference} from '../../tools/world_scheduler_reference.mjs';
import {createAtomicMemoryStore,canonicalWorldJson,createWorldPersistenceReference as legacy} from '../../tools/world_persistence_reference.mjs';

const path=new URL('../../tools/world_persistence_reference.mjs',import.meta.url);
const original=readFileSync(path,'utf8');
const hash=createHash('sha1').update('blob '+Buffer.byteLength(original)+'\0').update(original).digest('hex');
assert.equal(hash,'351280acb8b1ff6bae5deec4133ce3bb658d3894','reference changed; rebase and review patch');
const changes=[
  ['  return {format:"world-private-checkpoint-v1",adapter_version:root.adapter_version,world_id:root.world_id,seed:root.seed,player_id:root.player_id,revision:root.revision,initial:clone(root.initial),runtime:runtime.s.exportCheckpoint()};','  const paired=typeof runtime.x.exportCheckpoint==="function";\n  return {format:paired?"world-private-checkpoint-v2":"world-private-checkpoint-v1",adapter_version:root.adapter_version,world_id:root.world_id,seed:root.seed,player_id:root.player_id,revision:root.revision,initial:clone(root.initial),runtime:paired?{executor:runtime.x.exportCheckpoint(),scheduler:runtime.s.exportCheckpoint()}:runtime.s.exportCheckpoint()};'],
  ['  const x=createExecutor(clone(root.initial),clone(saved.runtime)),s=createScheduler(x,root.player_id,reviewNpc,clone(saved.runtime)),direct={x,s};','  const paired=saved.format==="world-private-checkpoint-v2";\n  const x=createExecutor(clone(root.initial),clone(paired?saved.runtime.executor:saved.runtime)),s=createScheduler(x,root.player_id,reviewNpc,clone(paired?saved.runtime.scheduler:saved.runtime)),direct={x,s};'],
  ['private_state:clone(direct.s.exportCheckpoint())','private_state:clone(privateEnvelope(root,direct).runtime)'],
];
let patched=original;
for(const [before,after] of changes){assert.equal(patched.split(before).length,2,'unexpected patch count');patched=patched.replace(before,after)}
const candidate=(await import('data:text/javascript;base64,'+Buffer.from(patched).toString('base64'))).createWorldPersistenceReference;

const initial={world_id:'W',now:0,actors:[{actor_id:'P',revision:0,knowledge_revision:0,resources:10,life_status:'active'}]};
const offer={world_id:'W',actor_id:'P',actor_revision:0,knowledge_revision:0,opportunity_id:'work',action_id:'work',kind:'action',valid_until:0,feasible:true,exclusive_target:null,credit_cap:10,phases:[{kind:'execution',duration:2,cost:1,interruptible:true,credit_per_tick:1}]};
const intent={kind:'intent',world_id:'W',actor_id:'P',actor_revision:0,knowledge_revision:0,decision_tick:0,opportunity_id:'work',action_id:'work',disposition:'action'};
const commands=[{kind:'publish',offer},{kind:'submit',submission:{kind:'start',submission_id:'s1',horizon:2,attempt_id:'a1',intent}},{kind:'run',budget:100}];
const make=(store,factory)=>factory(store,createExecutionReference,createWorldSchedulerReference,()=>null,'test-adapter-v1',{world_id:'W',seed:'seed'});
function fresh(factory){const store=createAtomicMemoryStore(),world=make(store,factory);world.initialize(initial,'P','seed');return {store,world}}
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name)}
const old=fresh(legacy);
test('original paired restore bug reproduces',()=>assert.throws(()=>old.world.verifyCheckpointContinuation(old.world.exportPrivateCheckpoint()),/invalid execution checkpoint identity/));
const fixed=fresh(candidate);
test('v2 exports executor and scheduler together',()=>{const c=fixed.world.exportPrivateCheckpoint();assert.equal(c.format,'world-private-checkpoint-v2');assert.equal(c.runtime.executor.format,'execution-checkpoint-v1');assert.equal(c.runtime.scheduler.format,'scheduler-checkpoint-v1')});
test('initial checkpoint restores without writing',()=>{const bytes=fixed.store.read(),c=fixed.world.exportPrivateCheckpoint(),r=fixed.world.verifyCheckpointContinuation(c);assert.equal(r.base_revision,0);assert.deepEqual(r.private_state,c.runtime);assert.equal(fixed.store.read(),bytes)});
test('each committed boundary restores and follows same next command',()=>{for(let i=0;i<commands.length;i++){const c=fixed.world.exportPrivateCheckpoint(),before=fixed.store.read(),r=fixed.world.verifyCheckpointContinuation(c,[commands[i]]);assert.equal(fixed.store.read(),before);fixed.world.commit('tx'+i,i,commands[i]);assert.deepEqual(r.checkpoint,fixed.world.recover().checkpoint);assert.deepEqual(r.private_state,fixed.world.exportPrivateCheckpoint().runtime)}});
test('full continuation from initial private state matches commits',()=>{const w=fresh(candidate),before=w.store.read(),r=w.world.verifyCheckpointContinuation(w.world.exportPrivateCheckpoint(),commands);assert.equal(w.store.read(),before);commands.forEach((c,i)=>w.world.commit('tx'+i,i,c));assert.deepEqual(r.checkpoint,w.world.recover().checkpoint);assert.deepEqual(r.private_state,w.world.exportPrivateCheckpoint().runtime)});
test('normal reopen verifies completed private state',()=>{const reopened=make(fixed.store,candidate),before=fixed.store.read(),r=reopened.verifyCheckpointContinuation(reopened.exportPrivateCheckpoint());assert.equal(r.checkpoint.executor.outcomes[0].credited_units,2);assert.equal(fixed.store.read(),before)});
test('old envelope cannot masquerade as v2',()=>{const c=old.world.exportPrivateCheckpoint(),before=fixed.store.read();assert.throws(()=>fixed.world.verifyCheckpointContinuation(c),/checkpoint does not match/);assert.equal(fixed.store.read(),before)});
test('foreign or modified nested private state is rejected',()=>{for(const mutate of [c=>c.world_id='other',c=>c.runtime.executor.state.now=7,c=>c.runtime.scheduler.state.view.now=7]){const c=fixed.world.exportPrivateCheckpoint(),before=fixed.store.read();mutate(c);assert.throws(()=>fixed.world.verifyCheckpointContinuation(c));assert.equal(fixed.store.read(),before)}});
test('old v1 journal bytes remain valid and unchanged under candidate',()=>{const store=createAtomicMemoryStore(),p=make(store,legacy);p.initialize(initial,'P','seed');commands.forEach((c,i)=>p.commit('tx'+i,i,c));const before=store.read(),q=make(store,candidate);assert.equal(canonicalWorldJson(q.recover().checkpoint),canonicalWorldJson(p.recover().checkpoint));assert.equal(q.verifyCheckpointContinuation(q.exportPrivateCheckpoint()).checkpoint.executor.now,2);assert.equal(store.read(),before)});
console.log(`${count}/${count} PASS`);
