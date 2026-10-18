// GODSEED world blueprint preflight: metadata and EXISTING simulator sanity.
// A PASS here means the blueprint is coherent and the v0.4 world starts;
// it does NOT mean eight regions or a new geography system are implemented.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sim=require('../src/sim.js');
const m=JSON.parse(readFileSync('data/world-regions.v1.json','utf8'));
const task=JSON.parse(readFileSync('work-items/world-foundation-tasks.json','utf8'));
const visual=JSON.parse(readFileSync('work-items/codex-tasks.json','utf8'));
const storage=JSON.parse(readFileSync('work-items/storage-tasks.json','utf8'));
assert.equal(m.schema,'godseed.world-regions.v1');
assert.equal(m.status,'integrated-runtime');
assert.equal(m.world.width,sim.W);assert.equal(m.world.height,sim.H);
assert.equal(m.world.logicalTiles,sim.N);
assert.deepEqual(m.world.currentMapTileIDs,sim.T,'Existing numeric IDs must never be silently repurposed');
assert.deepEqual(m.seededGenerationRules.start,[32,24]);
assert.equal(m.regions.length,8);
assert.equal(new Set(m.regions.map(r=>r.id)).size,8);
assert.equal(new Set(m.regions.map(r=>r.key)).size,8);
const allowed=new Set(m.regions.map(r=>r.id));
assert.ok(m.regions.every(r=>r.status==='integrated-runtime'));
assert.ok(m.regions.every(r=>Array.isArray(r.anchor)&&r.anchor.length===2&&sim.inside(...r.anchor)));
assert.ok(m.regions.every(r=>r.minimumGameplay&&r.features.length>0&&r.godHooks.length>0));
assert.ok(m.traversalLinks.every(l=>allowed.has(l.from)&&allowed.has(l.to)&&l.from!==l.to));
assert.equal(new Set(m.traversalLinks.map(l=>l.from+'>'+l.to)).size,m.traversalLinks.length);
assert.equal(m.regions.filter(x=>x.type==='settlement').length,2);
assert.ok(m.regions.some(x=>x.type==='starting_sanctuary'));
const tasks=task.tasks;
assert.equal(task.count,15);assert.equal(tasks.length,15);
assert.equal(visual.entries.length,25);assert.equal(storage.tasks.length,5);
assert.equal(tasks.length+visual.entries.length+storage.tasks.length,45);
assert.deepEqual(tasks.map(x=>x.id),[
 'F01','F02','F03','F04','F05',
 'W01','W02','W03','W04','W05','W06','W07','W08','W09','W10'
]);
assert.equal(new Set(tasks.map(x=>x.id)).size,15);
const ids=new Set(tasks.map(x=>x.id));
assert.ok(tasks.every(x=>['todo','done','blocked','implemented_pending_visual_qa'].includes(x.status)&&x.acceptance));
assert.ok(tasks.filter(x=>x.status==='done').every(x=>x.evidence.length>0));
assert.ok(tasks.every(x=>x.dependencies.every(d=>ids.has(d))));
const seeds=[1,2,3,7,42,99,256,1024,9090,20261017];
for(const seed of seeds){
 const a=sim.create(seed),b=sim.create(seed);
 assert.ok(sim.validate(a),'current sim validity seed='+seed);
 assert.deepEqual(a.map,b.map,'current map seed must be deterministic seed='+seed);
 assert.equal(a.npcs.length,3,'three baseline travelers');
 assert.equal(a.map[sim.idx(25,21)],sim.T.VILLAGE);
 assert.equal(a.map[sim.idx(37,27)],sim.T.VILLAGE);
 assert.equal(a.map[sim.idx(20,31)],sim.T.SHRINE);
 assert.equal(a.map[sim.idx(42,19)],sim.T.SHRINE);
 assert.equal(a.bot.x,32);assert.equal(a.bot.y,24);
 assert.ok(sim.walkable(a,32,24));
}
console.log('PASS: eight integrated region anchors and 45 distinct implementation tasks');
console.log('PASS: 10 seeded maps retain both villages, both shrines and three travelers');
console.log('Runtime 100-seed coverage/connectivity and 10k runs: node --test tests/regions.test.js tests/foundation.test.js');
