const test=require("node:test");
const assert=require("node:assert/strict");
const Sim=require("../src/sim.js");
const Chunks=require("../src/world/chunks.js");
const W=require("../src/world/legacy_bridge.js");

const round=s=>Sim.serialize(Sim.restore(Sim.serialize(s)));
const bridge=s=>W.importLegacy(Sim.serialize(s),{maxActive:2});
const different=t=>t===Chunks.T.GRASS?Chunks.T.STONE:Chunks.T.GRASS;

test("legacy save maps every one of 3072 real tiles, including historical special tile IDs",()=>{
  const original=Sim.create(41),m=bridge(original);
  assert.deepEqual(W.WINDOW,{x:0,y:0,width:64,height:48});
  assert.equal(m.stats().legacyCells,3072);
  let special=0;
  for(let y=0;y<48;y++)for(let x=0;x<64;x++){
    assert.equal(m.tileAt(x,y),original.map[y*64+x],x+","+y);
    if(original.map[y*64+x]>Chunks.T.MEADOW)special++;
  }
  assert.ok(special>0,"historical shrines/villages/ruins/roads must survive");
  assert.equal(m.tileAt(63,47),original.map[3071]);
});

test("all legacy map cells overlay exact 32x32 buffers across chunk borders",()=>{
  const s=Sim.create(77),m=bridge(s);
  for(const cy of [0,1])for(const cx of [0,1]){
    const block=m.chunkAt(cx,cy);
    assert.equal(block.tiles.length,Chunks.CELLS);
    for(let y=0;y<32;y++)for(let x=0;x<32;x++){
      const wx=cx*32+x,wy=cy*32+y;
      const expected=wy<48?s.map[wy*64+wx]:Chunks.tileAt(s.worldSeed,wx,wy);
      assert.equal(block.tiles[y*32+x],expected,wx+","+wy);
    }
  }
  // Crossing historical boundary never replaces old terrain with procedural samples.
  assert.equal(m.tileAt(64,30),Chunks.tileAt(s.worldSeed,64,30));
  assert.equal(m.tileAt(30,48),Chunks.tileAt(s.worldSeed,30,48));
});

test("Nim, all citizens, settlements, buildings, inventory, chapters and world progress are preserved",()=>{
  const s=Sim.create(2026);
  for(let i=0;i<900;i++)Sim.tick(s);
  const canonical=round(s),m=bridge(s);
  assert.equal(Sim.serialize(m.legacyState()),canonical);
  const w=m.legacyState();
  for(const key of ["bot","living","npcs","map","seen","chapter","chapterTwo",
                    "finale","regions","shrinesVisited","camp","story","log","enemies"])
    assert.deepEqual(w[key],Sim.restore(canonical)[key],key);
  assert.equal(w.worldSeed,s.worldSeed);
  assert.equal(w.tick,s.tick);
  assert.equal(m.stats().legacySites,2+w.living.towns.reduce((n,t)=>n+t.buildings.length,0));
});

test("all permanent settlement and building IDs have discoverable historical world sites",()=>{
  const s=Sim.create(25),m=bridge(s);
  for(const t of s.living.towns){
    const town=m.site("legacy:town:"+t.id);
    assert.deepEqual({x:town.x,y:town.y,townId:town.townId},{x:t.x,y:t.y,townId:null});
    for(const b of t.buildings){
      const site=m.site("legacy:building:"+b.id);
      assert.equal(site.kind,"building");assert.equal(site.townId,t.id);
      assert.deepEqual([site.x,site.y],[b.x,b.y]);
      const at=Chunks.worldToChunk(b.x,b.y);
      assert.ok(m.sitesAt(at.chunkX,at.chunkY).some(p=>p.id===site.id));
    }
  }
});

test("history and actor positions remain fixed while far-off procedural terrain is queried",()=>{
  const s=Sim.create(41),m=bridge(s),before=Sim.serialize(m.legacyState());
  for(const [x,y] of [[-1,-1],[-33,0],[1025,-1001],[64,47],[1,48]])
    assert.equal(m.tileAt(x,y),Chunks.tileAt(s.worldSeed,x,y));
  m.chunkAt(-2,-1);m.chunkAt(1000,1000);m.evictAll();
  assert.equal(Sim.serialize(m.legacyState()),before);
  assert.ok(m.stats().activeChunks<=2);
});

test("outside terrain edits and frontier settlements persist across eviction and save roundtrip",()=>{
  const s=Sim.create(81),m=bridge(s),x=-33,y=77;
  const newer=different(m.tileAt(x,y));
  assert.equal(m.setTile(x,y,newer),true);
  m.putSite({id:"frontier_1",kind:"settlement",type:"village",x:-33,y:77,
    label:"North Frontier",townId:null});
  m.putSite({id:"frontier_home",kind:"building",type:"house",x:-34,y:77,
    label:"House",townId:"frontier_1"});
  m.evictAll();
  assert.equal(m.tileAt(x,y),newer);
  const saved=m.serialize(),restored=W.restoreExpanded(saved,{maxActive:1});
  assert.equal(restored.tileAt(x,y),newer);
  assert.equal(restored.site("frontier_1").label,"North Frontier");
  assert.equal(restored.site("frontier_home").townId,"frontier_1");
  assert.equal(Sim.serialize(restored.legacyState()),round(s));
  assert.equal(restored.serialize(),saved,"expanded snapshot should be deterministic");
});

test("historical window refuses map and site writes; frontier edits never alter legacy save",()=>{
  const s=Sim.create(41),m=bridge(s),before=Sim.serialize(m.legacyState());
  for(const [x,y] of [[0,0],[31,31],[63,47]]){
    assert.throws(()=>m.setTile(x,y,Chunks.T.GRASS),/read-only/);
    assert.throws(()=>m.putSite({id:"frontier_inside",kind:"settlement",
      type:"village",x,y,label:"Invalid",townId:null}),/outside/);
  }
  assert.throws(()=>m.putSite({id:"legacy:town:spoof",kind:"settlement",
    type:"village",x:-1,y:4,label:"Spoof",townId:null}),/outside/);
  m.setTile(64,30,different(m.tileAt(64,30)));
  assert.equal(Sim.serialize(m.legacyState()),before);
});

test("legacyState and returned chunk/site snapshots are independent defensive copies",()=>{
  const s=Sim.create(77),m=bridge(s),before=Sim.serialize(m.legacyState());
  const copy=m.legacyState();copy.map[0]=255;copy.bot.x=999;
  const site=m.site("legacy:town:briarford");site.x=999;
  const chunk=m.chunkAt(0,0);chunk.tiles[0]=255;chunk.sites[0].x=999;
  assert.equal(Sim.serialize(m.legacyState()),before);
  assert.equal(m.tileAt(0,0),s.map[0]);
  assert.equal(m.site("legacy:town:briarford").x,s.living.towns[0].x);
});

test("invalid or oversized v1 core map, fog and location reject without partial import",()=>{
  const s=Sim.create(8),j=JSON.parse(Sim.serialize(s));
  for(const change of [
    w=>{w.map.pop()},
    w=>{w.seen[4]=42},
    w=>{w.map[0]=255},
    w=>{w.bot.x=10000},
    w=>{w.version=42}
  ]){
    const bad=JSON.parse(JSON.stringify(j));change(bad);
    assert.throws(()=>W.importLegacy(JSON.stringify(bad)),/invalid/);
  }
  assert.throws(()=>W.importLegacy("x".repeat(W.MAX_LEGACY_BYTES+1)),/bounded/);
  assert.throws(()=>W.importLegacy("not JSON"));
});

test("expanded snapshot rejects tampered seed and duplicate historical overlay writes",()=>{
  const s=Sim.create(41),m=bridge(s),saved=m.serialize();
  const seed=JSON.parse(saved);seed.sparse.seed++;
  assert.throws(()=>W.restoreExpanded(JSON.stringify(seed)),/seed/);
  const changed=JSON.parse(saved);const x=0,y=0;
  changed.sparse.patches=[{chunkX:0,chunkY:0,
    tiles:[[0,different(Chunks.tileAt(s.worldSeed,x,y))]],sites:[]}];
  assert.throws(()=>W.restoreExpanded(JSON.stringify(changed)),/overlapping legacy tile patch/);
  const site=JSON.parse(saved);site.sparse.patches=[{chunkX:0,chunkY:0,
    tiles:[],sites:[{id:"spoof",kind:"settlement",type:"village",
      x:0,y:0,label:"Spoof",townId:null}]}];
  assert.throws(()=>W.restoreExpanded(JSON.stringify(site)),/overlapping legacy site/);
  assert.equal(m.serialize(),saved,"a rejected expanded save must not mutate active state");
});

test("invalid sparse schema, non-world coordinates and huge envelopes fail closed",()=>{
  const s=Sim.create(31),m=bridge(s);
  for(const [x,y] of [[NaN,3],[1.2,2],[Number.MAX_SAFE_INTEGER+1,9]]){
    assert.throws(()=>m.tileAt(x,y),/safe integers/);
  }
  assert.throws(()=>m.setTile(0.5,2,0),/safe integers/);
  const bad=JSON.parse(m.serialize());bad.sparse.schemaVersion=9;
  assert.throws(()=>W.restoreExpanded(JSON.stringify(bad)),/schema/);
  assert.throws(()=>W.restoreExpanded("x".repeat(W.MAX_ENVELOPE_BYTES+1)),/bounded/);
});

test("different seeds and mixed older v1 saves do not alias expanded worlds",()=>{
  const a=bridge(Sim.create(11)),b=bridge(Sim.create(12));
  assert.notEqual(a.legacyState().worldSeed,b.legacyState().worldSeed);
  assert.equal(a.tileAt(0,0),a.legacyState().map[0]);
  assert.equal(b.tileAt(0,0),b.legacyState().map[0]);
  a.putSite({id:"outer_a",kind:"landmark",type:"ruin",x:-1,y:-1,label:"A",townId:null});
  assert.equal(b.site("outer_a"),null);
  const restored=W.restoreExpanded(a.serialize());
  assert.deepEqual(restored.legacyState().chapter,a.legacyState().chapter);
  assert.deepEqual(restored.legacyState().chapterTwo,a.legacyState().chapterTwo);
  assert.deepEqual(restored.legacyState().finale,a.legacyState().finale);
});

test("offline chunk-store source avoids numeric separators unsupported by older API29 WebViews",()=>{
  const fs=require("node:fs"),path=require("node:path");
  const source=fs.readFileSync(path.join(__dirname,"../src/world/chunk_store.js"),"utf8");
  assert.doesNotMatch(source,/\b\d[\d_]*_\d+\b/,
    "embedded chunk store must parse on Chrome/WebView 74, not only desktop Chromium");
});
