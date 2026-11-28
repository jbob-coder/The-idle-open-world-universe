// Host-only reference diagnostic for the Galaxy A54 target. Not an Android benchmark.
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { createHash } from 'node:crypto';
import { createExecutionReference } from '../../tools/npc_execution_reference.mjs';
import { createWorldSchedulerReference } from '../../tools/world_scheduler_reference.mjs';

function scenario(npcCount,waves,budget){
 const world='scale_fixture',horizon=waves*3-1;
 const actors=['P',...Array.from({length:npcCount},(_,i)=>'N'+String(i).padStart(3,'0'))].map(actor_id=>({actor_id,revision:0,knowledge_revision:0,resources:100,life_status:'active'}));
 const spec={world_id:world,now:0,actors};
 const x=createExecutionReference(spec);
 // Observe copy volume, not bytes allocated. Each state() actually copies history.
 let reads=0,eventRows=0,outcomeRows=0,actorRows=0;
 const measured={...x,state(){const s=x.state();reads++;eventRows+=s.events.length;outcomeRows+=s.outcomes.length;actorRows+=s.actors.length;return s}};
 const proposal=(c,duration)=>({offer:{...c,world_id:world,opportunity_id:'work',action_id:'work',kind:'action',valid_until:c.now,feasible:true,exclusive_target:null,credit_cap:100,phases:[{kind:'execution',duration,cost:1,interruptible:true,credit_per_tick:1}]},intent:{kind:'intent',world_id:world,actor_id:c.actor_id,actor_revision:c.actor_revision,knowledge_revision:c.knowledge_revision,decision_tick:c.now,opportunity_id:'work',action_id:'work',disposition:'action'},attempt_id:c.actor_id+'_'+c.now});
 const s=createWorldSchedulerReference(measured,'P',c=>proposal(c,1));
 for(const a of actors.slice(1))s.schedule({id:'review_'+a.actor_id,world_id:world,tick:0,kind:'review',actor_id:a.actor_id,interval:3});
 const before=s.view();s.run();assert.deepEqual(s.view(),before);
 const p=proposal({actor_id:'P',actor_revision:0,knowledge_revision:0,now:0},horizon);
 x.publishOffer(p.offer);s.submit({kind:'start',submission_id:'s1',horizon,attempt_id:p.attempt_id,intent:p.intent});
 const start=performance.now();let slices=0,maxSliceMs=0;
 while(s.view().submission_active){assert.ok(slices<2000,'fixture work limit');const t=performance.now();const v=s.run(budget);maxSliceMs=Math.max(maxSliceMs,performance.now()-t);slices++;assert.notEqual(v.status,'fault')}
 const runMs=performance.now()-start;
 const observed={reads,eventRows,outcomeRows,actorRows};
 const terminal=x.state();assert.equal(s.view().now,horizon);assert.equal(s.view().status,'player_action_ended');assert.equal(terminal.active.length,0);assert.equal(terminal.outcomes.length,npcCount*waves+1);
 for(const a of actors.slice(1)){const receipts=terminal.outcomes.filter(r=>r.actor_id===a.actor_id);assert.equal(receipts.length,waves);assert.ok(receipts.every(r=>r.credited_units===1&&r.outcome==='completed'));assert.equal(terminal.actors.find(v=>v.actor_id===a.actor_id).resources,100-waves)}
 const checkpoint=[x.exportCheckpoint(),s.exportCheckpoint()];const bytes=JSON.stringify(checkpoint);const digest=createHash('sha256').update(bytes).digest('hex');
 return {npcCount,waves,budget,runMs,maxSliceMs,slices,...observed,terminalEvents:terminal.events.length,terminalOutcomes:terminal.outcomes.length,checkpointBytes:Buffer.byteLength(bytes),digest};
}
const rows=[scenario(12,1,10000),scenario(12,4,10000),scenario(128,1,10000),scenario(128,4,10000),scenario(128,4,32)];
assert.equal(rows[3].digest,rows[4].digest,'work partition must preserve exact private state');
console.log(JSON.stringify({node:process.version,platform:process.platform,arch:process.arch,rows,partitionEquivalent:true,physicalDeviceTested:false},null,2));
