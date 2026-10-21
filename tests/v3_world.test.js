"use strict";
/* Exact-source large-world acceptance, independent of the original 20×20 V3 tests.
 * These are contracts for the WORLD mode, not evidence of physical Android FPS.
 */
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const World=require("../src/v3/world.js");
const Nav=require("../src/v3/world_travel.js");
const Expedition=require("../src/v3/expedition.js");
const Society=require("../src/v3/society.js");
const Big=require("../src/v3/world_sim.js");

test("1024-square world: signed borders, seeded identities and finite landmarks",()=>{
  assert.equal(World.SIZE,1024);
  assert.equal(World.MIN,-512);
  assert.equal(World.MAX,511);
  assert.equal(World.CHUNK,16);
  assert.equal(World.REGION,64);
  for(const [x,z] of [[-512,-512],[-1,-1],[0,0],[15,15],[16,16],[511,511]]){
    const a=World.terrain(14,x,z),b=World.terrain(14,x,z),c=World.terrain(42,x,z);
    assert.ok(a&&c);
    assert.deepEqual(a,b,"same seed and coordinates "+x+","+z);
    assert.equal(a.x,x);assert.equal(a.z,z);
    assert.equal(typeof a.walkable,"boolean");
    assert.ok(Number.isFinite(a.height));
    assert.ok(Object.hasOwn(World.BIOMES,a.biome));
  }
  for(const [x,z] of [[-513,0],[512,0],[0,-513],[0,512]])
    assert.equal(World.terrain(14,x,z),null);
  const landmarks=[];
  for(let rz=-8;rz<=7;rz++)for(let rx=-8;rx<=7;rx++){
    const item=World.landmark(14,rx,rz);
    if(item)landmarks.push(item);
  }
  assert.equal(landmarks.length,255);
  assert.equal(new Set(landmarks.map(x=>x.id)).size,255);
  assert.equal(World.landmark(14,0,0),null,"home region is not a fabricated ruin");
  assert.equal(World.landmark(14,-9,0),null);
  assert.equal(World.landmark(14,8,0),null);
});

test("LRU eviction cannot restore a cut tree or lose a depleted berry; regrowth is tick-based",()=>{
  const w=World.create(14);
  assert.equal(w.sample(25,28,0).tree,true);
  assert.equal(w.sample(28,25,0).berries,3);
  assert.equal(w.harvest(25,28),true);
  assert.equal(w.harvest(25,28),false);
  assert.equal(w.forage(28,25,0),true);
  assert.equal(w.sample(28,25,0).berries,2);
  assert.equal(w.sample(28,25,39).berries,2);
  assert.equal(w.sample(28,25,40).berries,3);
  const depleted=World.create(14);
  assert.equal(depleted.forage(28,25,0),true);
  for(let i=-32;i<32;i++)depleted.sample(i*16,i*16,0);
  assert.equal(depleted.metrics().cachedChunks,48);
  assert.equal(depleted.sample(28,25,0).berries,2,"chunk eviction is not free food");
  const saving=depleted.save(0);
  assert.equal(saving.berries.length,1);
  assert.equal(World.create(14,saving).sample(28,25,0).berries,2);
  assert.equal(World.create(14,w.save(40)).sample(25,28,40).tree,false);
  assert.deepEqual(w.save(40).berries,[],"full regrowth is compressed from sparse save");
  assert.ok(w.metrics().cachedChunks<=World.CACHE_LIMIT);
});

test("tampered sparse edits, wrong generator version and forged tree coordinates fail closed",()=>{
  const good=World.create(14);
  assert.equal(good.harvest(25,28),true);
  const payload=good.save(1);
  for(const mutate of [
    s=>s.generatorVersion=99,
    s=>s.removed[0].x=600,
    s=>s.removed[0]={x:0,z:0},
    s=>s.removed.push({...s.removed[0]}),
    s=>s.berries.push({x:28,z:25,amount:5,at:0}),
    s=>s.berries.push({x:28,z:25,amount:2,at:-1})
  ]){
    const broken=JSON.parse(JSON.stringify(payload));mutate(broken);
    assert.throws(()=>World.create(14,broken),RangeError);
  }
  assert.throws(()=>World.create(-1),RangeError);
});

test("route is 224 unique adjacent interior region landmarks, never god-camera discovery",()=>{
  const route=Nav.itinerary();
  assert.equal(route.length,224);
  assert.equal(new Set(route.map(x=>x.x+","+x.z)).size,224);
  for(let i=0;i<route.length;i++){
    const p=route[i],rx=(p.x-24)/64,rz=(p.z-24)/64;
    assert.ok(Number.isInteger(rx)&&Number.isInteger(rz));
    assert.ok(Math.abs(rx)<=7&&Math.abs(rz)<=7);
    assert.notEqual(Math.abs(rx)+Math.abs(rz),0);
    assert.ok(World.landmark(14,rx,rz));
    if(i){
      const previous=route[i-1];
      assert.equal(Nav.distance(p,previous),64,"adjacent regions index "+i);
    }
  }
  const sim=Big.create(14),snapshot=sim.snapshot(),scene=sim.scene(-495,-495,32);
  assert.ok(scene.terrain.length>0);
  assert.equal(sim.snapshot().tick,snapshot.tick);
  assert.equal(sim.snapshot().expedition.discoveries.length,0,
    "moving the observer must not advance or reveal the explorer's knowledge");
  assert.ok(sim.metrics().cachedChunks<=48);
});

test("a single conserved traveler appears only after workshop and tick 600",()=>{
  const sim=Big.create(14);
  assert.equal(Big.STORAGE_KEY,"godseed-v3-large-world-v1");
  assert.notEqual(Big.STORAGE_KEY,Society.STORAGE_KEY);
  assert.equal(sim.advance(599).expedition.explorer,null);
  const emerged=sim.advance(1);
  assert.equal(emerged.expedition.explorer.id,"world_taren");
  assert.equal(emerged.expedition.explorer.bornAt,600);
  assert.equal(emerged.world.tileCount,1048576);
  assert.equal(emerged.world.homelandCitizens,3);
  assert.equal(emerged.citizens.length,4);
  assert.equal(emerged.expedition.discoveries.length,0);
  const saved=JSON.parse(sim.serialize());
  assert.equal(saved.schemaVersion,1);
  assert.deepEqual(Object.keys(saved).sort(),
    ["expedition","homeland","schemaVersion","seed","wilderness"]);
  assert.equal(saved.homeland.schemaVersion,3);
  assert.deepEqual(Big.restore(sim.serialize()).snapshot(),emerged);
});

test("several thousand autonomous ticks cause real discoveries and paid shelters",()=>{
  for(const seed of [14,42]){
    const sim=Big.create(seed),s=sim.advance(6000),x=s.expedition;
    assert.equal(s.tick,6000);
    assert.ok(x.explorer.alive,"traveler survives seed "+seed);
    assert.ok(x.discoveries.length>=55,"must reach distant wilderness seed "+seed);
    assert.ok(x.camps.length>=10,"must really construct camps seed "+seed);
    assert.equal(x.woodGathered-x.woodSpent,x.explorer.wood);
    assert.equal(x.foodGathered-x.foodEaten,x.explorer.food);
    assert.equal(x.woodSpent,x.camps.length*4);
    assert.ok(x.events.length<=64);
    assert.equal(s.world.discoveredRegions,x.discoveries.length);
    assert.equal(s.world.camps,x.camps.length);
    assert.ok(x.knownChunks.length>10);
    assert.equal(s.outpost.status,"established","homeland continues while traveling");
    assert.deepEqual(Big.restore(sim.serialize()).snapshot(),s);
  }
});

test("large-world saves preserve the original society slot; older schema-1/2 copies migrate",()=>{
  for(const filename of ["v3_society_schema1_seed14.json","v3_society_schema2_seed14.json"]){
    const raw=fs.readFileSync(path.join(__dirname,"fixtures",filename),"utf8");
    const prior=JSON.parse(raw);
    const big=Big.fromSociety(raw),s=big.snapshot();
    assert.equal(s.schemaVersion,3,"homeland upgraded");
    assert.equal(s.tick,prior.tick);
    assert.equal(s.seed,prior.seed);
    assert.equal(s.wood,prior.wood);
    assert.equal(s.food,prior.food);
    assert.equal(s.expedition.explorer,null);
    assert.equal(s.expedition.discoveries.length,0);
    assert.equal(JSON.parse(raw).schemaVersion,prior.schemaVersion,"source untouched");
    const copy=Big.restore(big.serialize()).snapshot();
    assert.deepEqual(copy,s);
    const next=big.advance(120);
    assert.equal(next.tick,prior.tick+120);
    assert.deepEqual(Big.restore(big.serialize()).snapshot(),next);
  }
});

test("large-world restore rejects invented goods, seed conflict and corrupt expedition",()=>{
  const sim=Big.create(14);sim.advance(1800);
  const raw=sim.serialize();
  assert.ok(raw.length<1500000);
  for(const mutate of [
    s=>s.schemaVersion=2,
    s=>s.seed=42,
    s=>s.homeland.wood++,
    s=>s.wilderness.generatorVersion=5,
    s=>s.expedition.woodGathered++,
    s=>s.expedition.foodEaten++,
    s=>s.expedition.explorer.routeIndex++,
    s=>s.expedition.camps.push({id:"magic",type:"camp",x:100,z:100})
  ]){
    const bad=JSON.parse(raw);mutate(bad);
    assert.throws(()=>Big.restore(JSON.stringify(bad)),{name:"RangeError"});
  }
  assert.throws(()=>Big.restore("{"),SyntaxError);
  assert.throws(()=>Big.restore("x".repeat(1500001)),RangeError);
});

test("advancing 3000 ticks in chunks is identical to a single 3000-tick step",()=>{
  const a=Big.create(14),b=Big.create(14);
  const expected=a.advance(3000);
  for(let i=0;i<15;i++)b.advance(200);
  assert.deepEqual(b.snapshot(),expected);
  assert.deepEqual(Big.restore(a.serialize()).snapshot(),expected);
  assert.ok(a.metrics().cachedChunks<=48&&b.metrics().cachedChunks<=48);
});


test("full 20k tick itinerary reaches 224 unique landmarks, pays 56 camps and stays recoverable",()=>{
  const game=Big.create(14),s=game.advance(20000),exp=s.expedition;
  assert.equal(exp.explorer.alive,true);
  assert.equal(exp.explorer.health,100);
  assert.equal(exp.explorer.routeIndex,224);
  assert.equal(exp.discoveries.length,224);
  assert.equal(exp.camps.length,56);
  assert.equal(exp.woodSpent,224);
  assert.equal(exp.woodGathered-exp.woodSpent,exp.explorer.wood);
  assert.equal(exp.foodGathered-exp.foodEaten,exp.explorer.food);
  for(let i=0;i<exp.camps.length;i++){
    const camp=exp.camps[i],d=exp.discoveries[4*i];
    assert.equal(camp.id,"camp_"+(4*i+1));
    assert.equal(camp.x,d.x+2);
    assert.equal(camp.z,d.z+2);
    assert.ok(camp.completedAt>=d.tick);
  }
  assert.ok(game.serialize().length<1500000);
  assert.ok(game.metrics().cachedChunks<=48);
  assert.deepEqual(Big.restore(game.serialize()).snapshot(),s);
});
