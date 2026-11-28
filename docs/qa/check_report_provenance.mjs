// Independent QA diagnostic for V1, not a gameplay or authorization implementation.
// Run: node docs/qa/check_report_provenance.mjs
// Baseline f75bdd14827bd6ea8555f6ca428132e91cff97c3.
// Scope: actor-facing reports and standalone perception checkpoint; the integrated
// coordinator separately retains privileged source frames. Do not expose those frames.
// The baseline test expects the known limitation and is not a release gate.
import {createPerceptionReference} from '../../tools/npc_perception_reference.mjs';
const world="qa_world", observer="listener", outsider="absent";
const secret="PRIVATE_CANARY_QA";
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const report=(id,sender,value="open",tick=10,completed=true)=>({
 world_id:world,tick,actors:[{actor_id:observer,world_id:world,can_acquire:true},{actor_id:outsider,world_id:world,can_acquire:true}],
 event:{id,world_id:world,tick,committed:true,channel:"report",sender_id:sender,completed:true,
 deliveries:[{recipient_id:observer,completed,delivered_claims:[{key:"opp:job:fixture",value}]}],
 private_claims:[{key:"secret",value:secret}]}
});
const run=(frames)=>{const p=createPerceptionReference(world);for(const f of frames)p.ingest(f);return p;};
const view=p=>p.bindActor(observer).forNarrative();
const cognitive=p=>p.bindActor(observer).forCognition();
const one=run([report("event1","sourceA")]);
const other=run([report("event1","sourceB")]);
const twoSame=run([report("event1","sourceA"),report("event2","sourceA")]);
const twoDistinct=run([report("event1","sourceA"),report("event2","sourceB")]);
const contradiction=run([report("event1","sourceA"),report("event2","sourceB","closed")]);
const restored=createPerceptionReference(world,twoDistinct.exportCheckpoint());
const distinctOccurrence=run([report("event9","sourceA")]);
const interrupted=run([report("event1","sourceA","open",10,false)]);
const results=[];
function test(name,ok){results.push({name,pass:ok===true});}
test("one completed report yields one observation",view(one).observations.length===1);
test("report channel remains report, not direct",view(one).observations[0].channel==="report");
test("undelivered actor sees no observation",one.bindActor(outsider).forNarrative().observations.length===0);
test("interrupted delivery does not acquire content",view(interrupted).observations.length===0);
test("private claims remain excluded",[view(one),cognitive(one),view(twoDistinct),cognitive(twoDistinct)].every(x=>!JSON.stringify(x).includes(secret)));
test("two completed reports produce two observations",view(twoSame).observations.length===2&&view(twoDistinct).observations.length===2);
test("contradictory report contents retained",eq(view(contradiction).observations.map(x=>x.claims[0].value),["open","closed"]));
test("checkpoint reconstitutes observed claims",eq(view(restored),view(twoDistinct)));
test("exact same event replay not duplicated",twoDistinct.ingest(report("event2","sourceB"))===0&&view(twoDistinct).observations.length===2);
test("baseline limitation: distinct speakers indistinguishable",eq(view(one),view(other))&&eq(cognitive(one),cognitive(other)));
test("baseline limitation: repeated and independent reports indistinguishable",eq(view(twoSame),view(twoDistinct))&&eq(cognitive(twoSame),cognitive(twoDistinct)));
test("baseline limitation: standalone checkpoints discard sender distinctions",eq(twoSame.exportCheckpoint(),twoDistinct.exportCheckpoint()));
test("baseline limitation: differing event identities absent from actor projection",eq(view(one),view(distinctOccurrence))&&!eq(one.exportCheckpoint().processed_event_ids,distinctOccurrence.exportCheckpoint().processed_event_ids));
const attributionGateMet=!eq(view(one),view(other))&&!eq(view(twoSame),view(twoDistinct));
console.log(JSON.stringify({scope:"V1 report provenance diagnostic, not gameplay",passed:results.filter(x=>x.pass).length,total:results.length,attributionGateMet,results},null,2));
if(results.some(x=>!x.pass))throw Error("report provenance diagnostic failed");
