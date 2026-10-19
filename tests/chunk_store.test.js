const test = require("node:test");
const assert = require("node:assert/strict");
const Chunks = require("../src/world/chunks.js");
const Store = require("../src/world/chunk_store.js");
const Sim = require("../src/sim.js");

const differentTile = value => value === Chunks.T.STONE ? Chunks.T.GRASS : Chunks.T.STONE;

test("untouched chunks regenerate identically across eviction, order and save", () => {
  const store = Store.create(2026, {maxActive:2});
  const a = store.chunkAt(-2,3).tiles;
  const b = store.chunkAt(1000,-1000).tiles;
  store.chunkAt(3,4);
  assert.equal(store.stats().activeChunks,2);
  assert.deepEqual(store.chunkAt(-2,3).tiles,a);
  assert.deepEqual(store.chunkAt(1000,-1000).tiles,b);
  assert.equal(store.stats().modifiedChunks,0);
  assert.deepEqual(Store.restore(store.serialize()).chunkAt(-2,3).tiles,a);
  assert.deepEqual(a,Chunks.generateChunk(2026,-2,3).tiles);
});

test("a sparse change persists at signed boundaries after eviction and restore", () => {
  const store = Store.create(17,{maxActive:1});
  const places = [[-1,-1],[-32,32],[-33,63],[31,31],[32,32],[1025,-1001]];
  for(const [x,y] of places) {
    const original = store.tileAt(x,y);
    assert.equal(store.setTile(x,y,differentTile(original)),true);
    assert.equal(store.setTile(x,y,differentTile(original)),false);
  }
  assert.equal(store.stats().activeChunks,1);
  assert.equal(store.stats().editedTiles,places.length);
  store.evictAll();
  assert.equal(store.stats().activeChunks,0);
  for(const [x,y] of places) assert.equal(store.tileAt(x,y),
    differentTile(Chunks.tileAt(17,x,y)));
  const saved = store.serialize();
  const reloaded = Store.restore(saved,{maxActive:1});
  for(const [x,y] of places) assert.equal(reloaded.tileAt(x,y),store.tileAt(x,y));
  assert.equal(reloaded.serialize(),saved);
});

test("reverting to procedural terrain erases the delta without removing other sites", () => {
  const store=Store.create(41);
  const x=-45,y=67,base=Chunks.tileAt(41,x,y);
  store.setTile(x,y,differentTile(base));
  store.putSite({id:"emberwick",kind:"settlement",type:"village",x,y,
    label:"Emberwick",townId:null});
  store.setTile(x,y,base);
  assert.equal(store.stats().editedTiles,0);
  assert.equal(store.stats().modifiedChunks,1);
  assert.equal(store.site("emberwick").label,"Emberwick");
  assert.equal(Store.restore(store.serialize()).tileAt(x,y),base);
  assert.equal(store.removeSite("emberwick"),true);
  assert.equal(store.stats().modifiedChunks,0);
  assert.equal(store.serialize(),Store.create(41).serialize());
});

test("settlements and buildings retain stable IDs after eviction/reentry/save", () => {
  const store=Store.create(77,{maxActive:1});
  store.putSite({id:"town_a",kind:"settlement",type:"village",x:-33,y:64,
    label:"North Vale",townId:null});
  store.putSite({id:"house_a",kind:"building",type:"house",x:-34,y:66,
    label:"North Family Home",townId:"town_a"});
  store.chunkAt(220,-220);
  store.evictAll();
  assert.deepEqual(store.sitesAt(-2,2).map(x=>x.id),["house_a","town_a"]);
  const saved=store.serialize();
  const reloaded=Store.restore(saved);
  assert.deepEqual(reloaded.site("town_a"),store.site("town_a"));
  assert.deepEqual(reloaded.site("house_a"),store.site("house_a"));
  assert.throws(()=>reloaded.putSite({id:"house_a",kind:"building",type:"house",
    x:200,y:200,label:"Duplicate",townId:null}),/another chunk/);
  assert.equal(reloaded.stats().modifiedChunks,1);
  assert.equal(reloaded.stats().sites,2);
});

test("external chunk and site snapshots cannot silently mutate cache/persisted state", () => {
  const store=Store.create(11);
  const v=store.tileAt(1,1);
  const chunk=store.chunkAt(0,0);
  chunk.tiles[33]=255;
  assert.equal(store.tileAt(1,1),v);
  store.putSite({id:"well_1",kind:"building",type:"well",x:1,y:1,
    label:"Water",townId:null});
  const site=store.site("well_1");
  site.label="Hacked";
  store.sitesAt(0,0)[0].label="Hacked again";
  assert.equal(store.site("well_1").label,"Water");
  assert.equal(Store.restore(store.serialize()).site("well_1").label,"Water");
});

test("corrupt, duplicate and cross-chunk saves reject without changing live state", () => {
  const s=Store.create(41);
  s.setTile(-1,-1,differentTile(s.tileAt(-1,-1)));
  const original=s.serialize();
  for(const changed of [
    x=>{x.schemaVersion=999},
    x=>{x.patches.push({...x.patches[0]})},
    x=>{x.patches[0].tiles.push([...x.patches[0].tiles[0]])},
    x=>{x.patches[0].tiles[0][0]=1024},
    x=>{x.patches[0].tiles[0][1]=255},
    x=>{x.patches[0].sites=[{id:"bad",kind:"building",type:"house",
                             x:150,y:150,label:"No",townId:null}]}
  ]) {
    const bad=JSON.parse(original);changed(bad);
    assert.throws(()=>Store.restore(JSON.stringify(bad)));
    assert.equal(s.serialize(),original);
  }
  assert.throws(()=>Store.restore("x".repeat(Store.MAX_SAVE_BYTES+1)),RangeError);
});

test("quotas prevent unbounded resident chunks and per-chunk edits", () => {
  assert.throws(()=>Store.create(7,{maxActive:0}),RangeError);
  assert.throws(()=>Store.create(7,{maxActive:17}),RangeError);
  const store=Store.create(1,{maxActive:3});
  for(let y=0;y<16;y++)for(let x=0;x<16;x++) {
    store.setTile(x,y,differentTile(Chunks.tileAt(1,x,y)));
  }
  assert.equal(store.stats().editedTiles,Store.MAX_EDITED_TILES);
  assert.throws(()=>store.setTile(16,16,differentTile(Chunks.tileAt(1,16,16))),
    /quota/);
  for(let i=0;i<400;i++)store.chunkAt(i*32,0);
  assert.ok(store.stats().activeChunks<=3);
  assert.ok(store.stats().modifiedChunks<=1);
});

test("restored copies remain independent; old v1 simulation saves untouched", () => {
  const a=Store.create(2026);
  a.setTile(-1,31,differentTile(a.tileAt(-1,31)));
  const save=a.serialize(),b=Store.restore(save),c=Store.restore(save);
  b.setTile(-1,31,Chunks.tileAt(2026,-1,31));
  b.putSite({id:"s1",kind:"settlement",type:"village",x:32,y:32,
             label:"New Village",townId:null});
  assert.equal(c.serialize(),save);
  assert.equal(a.serialize(),save);
  const sim=Sim.create(2026),legacy=Sim.serialize(sim);
  assert.equal(Store.restore(save).serialize(),save);
  assert.equal(Sim.serialize(sim),legacy);
  assert.deepEqual(Sim.restore(legacy).map,sim.map);
});
