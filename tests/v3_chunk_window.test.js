"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const World=require("../src/v3/world.js");

test("signed 16x16 chunk positions have stable, exact world/local coordinates",()=>{
  const coordinates=[
    [-512,-512,-32,-32,0,0],[-497,-497,-32,-32,15,15],
    [-496,-496,-31,-31,0,0],[-17,-1,-2,-1,15,15],
    [-16,-16,-1,-1,0,0],[-1,-1,-1,-1,15,15],
    [0,0,0,0,0,0],[15,15,0,0,15,15],
    [16,16,1,1,0,0],[511,511,31,31,15,15]
  ];
  for(const [x,z,cx,cz,lx,lz] of coordinates){
    const p=World.locate(x,z);
    assert.deepEqual(p,{cx,cz,lx,lz,id:cx+","+cz});
    assert.equal(p.cx*World.CHUNK+p.lx,x);
    assert.equal(p.cz*World.CHUNK+p.lz,z);
  }
  assert.equal(World.locate(-513,0),null);
  assert.equal(World.locate(0,512),null);
  assert.equal(World.locate(0.1,1),null);
});

test("chunk-spanned terrain windows equal coordinate samples across negative seams",()=>{
  const world=World.create(241);
  for(const [x,z,half,tick] of [
    [-16,-16,12,0],[-1,0,16,199],[0,0,16,200],
    [511,511,20,20],[-512,-512,32,150],
    [24,24,32,0],[509,-511,17,80]
  ]){
    const result=world.windowAt(x,z,half,tick);
    const left=Math.max(World.MIN,Math.round(x)-half);
    const right=Math.min(World.MAX,Math.round(x)+half);
    const top=Math.max(World.MIN,Math.round(z)-half);
    const bottom=Math.min(World.MAX,Math.round(z)+half);
    assert.equal(result.length,(right-left+1)*(bottom-top+1));
    let offset=0;
    for(let row=top;row<=bottom;row++)
      for(let col=left;col<=right;col++){
        assert.deepEqual(result[offset++],world.sample(col,row,tick));
      }
  }
});

test("chunk cache stays bounded and grouped requests avoid 4000 tile-level lookups",()=>{
  const world=World.create(17);
  const view=world.windowAt(0,0,32,0);
  const a=world.metrics();
  assert.equal(view.length,65*65);
  assert.ok(a.chunkBuilds<=36,"at most 6x6 physical chunks for one view");
  assert.ok(a.chunkHits<500,"one lookup per chunk span, not each of 4225 tiles");
  assert.ok(a.cachedChunks<=World.CACHE_LIMIT);
  for(let z=-480;z<=480;z+=64)for(let x=-480;x<=480;x+=64)
    world.windowAt(x,z,32,0);
  const b=world.metrics();
  assert.ok(b.chunkBuilds>a.chunkBuilds);
  assert.ok(b.cachedChunks<=World.CACHE_LIMIT,"LRU never caches the whole million-tile map");
});

test("harvested trees and replenishing berries remain authoritative after chunk eviction",()=>{
  const seed=23,world=World.create(seed);
  let tree=null,bush=null;
  for(let z=60;z<100;z++)for(let x=60;x<100;x++){
    const tile=World.terrain(seed,x,z);
    if(tile.tree&&!tree)tree={x,z};
    if(tile.bush&&!bush)bush={x,z};
  }
  assert.ok(tree&&bush);
  assert.equal(world.harvest(tree.x,tree.z),true);
  assert.equal(world.forage(bush.x,bush.z,100),true);
  assert.equal(world.sample(tree.x,tree.z,100).tree,false);
  assert.equal(world.sample(bush.x,bush.z,100).berries,2);
  for(let z=-480;z<=480;z+=64)world.windowAt(-400,z,32,110);
  assert.equal(world.sample(tree.x,tree.z,110).tree,false);
  assert.equal(world.sample(bush.x,bush.z,140).berries,3);
  assert.equal(world.windowAt(tree.x,tree.z,12,140)
    .find(t=>t.x===tree.x&&t.z===tree.z).tree,false);
  const reloaded=World.create(seed,world.save(140));
  assert.equal(reloaded.sample(tree.x,tree.z,140).tree,false);
  assert.equal(reloaded.sample(bush.x,bush.z,140).berries,3);
});

test("camera terrain is reused between NPC ticks, and never survives resource edits",()=>{
  const WorldSim=require("../src/v3/world_sim.js");
  const game=WorldSim.create(14),focus={x:180,z:180},radius=16;
  const original=game.scene(focus.x,focus.z,radius);
  assert.equal(original.terrain.length,33*33);
  const initial=game.metrics().terrainWindowsBuilt;
  game.advance(100);
  const later=game.scene(focus.x,focus.z,radius);
  assert.ok(later.tick>original.tick);
  assert.equal(game.metrics().terrainWindowsBuilt,initial,
    "unchanged tiles must not be resampled just because characters move");
  assert.ok(game.metrics().terrainWindowsReused>=1);
  assert.deepEqual(later.terrain,original.terrain);
  assert.equal(game.scene(focus.x+32,focus.z,radius).worldCenter.x,212);
  assert.equal(game.metrics().terrainWindowsBuilt,initial+1,
    "moving across new world coordinates loads another camera chunk view");
  assert.deepEqual(WorldSim.restore(game.serialize()).snapshot(),game.snapshot());
});

test("individually timed berry regrowth invalidates a cached terrain window",()=>{
  const world=World.create(91);
  let patch=null;
  for(let z=90;z<140;z++)for(let x=90;x<140;x++){
    const t=World.terrain(91,x,z);
    if(t.bush&&!patch)patch={x,z};
  }
  assert.ok(patch);
  assert.equal(world.forage(patch.x,patch.z,137),true);
  assert.equal(world.nextVisualChange(137),177);
  assert.equal(world.nextVisualChange(176),177);
  assert.equal(world.sample(patch.x,patch.z,176).berries,2);
  assert.equal(world.sample(patch.x,patch.z,177).berries,3);
  assert.equal(world.nextVisualChange(177),Infinity);
});
