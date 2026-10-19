const test=require("node:test");
const assert=require("node:assert/strict");
const Chunks=require("../src/world/chunks.js");
const Store=require("../src/world/chunk_store.js");
const View=require("../src/world/chunk_view.js");
const Surface=require("../src/render/chunk_surface.js");
const Sim=require("../src/sim.js");

test("chunk camera crosses many positive and negative 32x32 borders with true neighboring terrain",()=>{
 const view=View.create(41,{centerX:31,centerY:31});
 for(const center of [[31,31],[32,32],[63,63],[64,64],[95,95],
   [96,96],[127,127],[128,128],[-1,-1],[-32,-32],[-33,-33]]){
  view.setCenter(...center);
  const c=view.camera(),f=view.renderFrame();
  assert.equal(f.tiles.length,640);
  assert.equal(f.dirty.length,640,"camera move requires full viewport reproject");
  assert.equal(c.x,center[0]-16);
  assert.equal(c.y,center[1]-10);
  assert.equal(view.known(center[0],center[1]),true);
  const i=(center[1]-c.y)*c.width+(center[0]-c.x);
  assert.equal(f.tiles[i],Chunks.tileAt(41,center[0],center[1]));
  for(let step=-3;step<=3;step++){
   const x=center[0]+step,y=center[1];
   const pos=Chunks.worldToChunk(x,y);
   assert.equal(f.tiles[(y-c.y)*c.width+(x-c.x)],
    Chunks.generateChunk(41,pos.chunkX,pos.chunkY).tiles[pos.index]);
  }
 }
 assert.ok(view.stats().store.activeChunks<=9);
});

test("three native pixel zooms preserve signed world center and fully invalidate old pixels",()=>{
 const view=View.create(2026,{centerX:-32,centerY:64});
 const dims=[[32,20],[24,15],[16,10]];
 for(let zoom=0;zoom<3;zoom++){
  view.setZoom(zoom);
  const cam=view.camera(),f=view.renderFrame();
  assert.deepEqual([cam.width,cam.height],dims[zoom]);
  assert.deepEqual([cam.centerX,cam.centerY],[-32,64]);
  assert.equal(f.dirty.length,dims[zoom][0]*dims[zoom][1]);
  assert.equal(view.renderFrame().dirty.length,0,"unchanged cells cannot redraw");
 }
 assert.throws(()=>view.setZoom(3),RangeError);
 assert.throws(()=>view.setZoom(-1),RangeError);
});

test("dirty cells refresh only real terrain changes without regenerating the whole viewport",()=>{
 const view=View.create(22,{centerX:31,centerY:31});
 const first=view.renderFrame();
 assert.equal(first.dirty.length,640);
 assert.equal(view.renderFrame().dirty.length,0);
 const x=32,y=31,old=view.store.tileAt(x,y),other=old===Chunks.T.GRASS?Chunks.T.MEADOW:Chunks.T.GRASS;
 assert.equal(view.setTile(x,y,other),true);
 const changed=view.renderFrame();
 assert.equal(changed.dirty.length,1);
 assert.deepEqual([changed.dirty[0].x,changed.dirty[0].y,changed.dirty[0].tile],
  [x,y,other]);
 assert.equal(view.renderFrame().dirty.length,0);
 view.store.evictAll();view.setCenter(96,64);view.renderFrame();
 view.setCenter(31,31);
 assert.equal(view.renderFrame().tiles[(y-view.camera().y)*32+x-view.camera().x],other,
  "persistent sparse edit reappears after leaving and evicting the chunk");
 assert.equal(view.stats().store.editedTiles,1);
});

test("fog is bounded under repeated distant visits and zero-work idle frames remain cheap",()=>{
 const view=View.create(123,{maxFogChunks:9,centerX:0,centerY:0});
 for(let i=0;i<160;i++){
  view.setCenter(i*32,(i%7)*32);
  const f=view.renderFrame();
  assert.equal(f.dirty.length,640);
  assert.ok(view.stats().fogChunks<=9);
  assert.ok(view.stats().store.activeChunks<=9);
  assert.equal(view.stats().store.modifiedChunks,0);
 }
 const stat=view.stats();
 assert.ok(stat.fogChunks<=stat.maxFogChunks);
 assert.equal(stat.maxFogChunks,9);
 assert.equal(view.renderFrame().dirty.length,0);
 assert.equal(view.renderFrame().tiles.length,640);
 assert.throws(()=>View.create(12,{maxFogChunks:500}),RangeError);
 assert.throws(()=>view.setCenter(Infinity,0),RangeError);
 assert.throws(()=>view.setCenter(1000001,0),RangeError);
 assert.throws(()=>view.pan(.3,0),RangeError);
});

test("native 16px renderer keeps all cells integer, caches idle frames and repaints exact edits",()=>{
 const calls=[],canvas={width:1,height:1,getContext(){return {
  imageSmoothingEnabled:true,set fillStyle(v){this.color=v;},
  fillRect(...args){calls.push(args);}
 };}};
 const view=View.create(42,{centerX:32,centerY:32});
 const surface=Surface.create(canvas,null);
 let frame=surface.draw(view);
 assert.equal(frame.dirty,640);
 assert.deepEqual([canvas.width,canvas.height],[512,320]);
 assert.ok(calls.length>=640);
 assert.ok(calls.every(rect=>rect.length===4&&rect.every(Number.isInteger)));
 const before=calls.length;
 frame=surface.draw(view);
 assert.equal(frame.dirty,0);assert.equal(calls.length,before);
 const x=32,y=32,old=view.store.tileAt(x,y);
 view.setTile(x,y,old===0?6:0);
 frame=surface.draw(view);
 assert.equal(frame.dirty,1);
 view.setZoom(2);frame=surface.draw(view);
 assert.equal(frame.dirty,160);
 assert.deepEqual([canvas.width,canvas.height],[256,160]);
 const stats=surface.stats();
 assert.ok(stats.skipped>=1);
 assert.equal(stats.last.dirty,160);
});

test("atlas never changes the original version-1 simulation or Nim's position",()=>{
 const s=Sim.create(41),before=Sim.serialize(s);
 const atlas=View.create(s.worldSeed,{centerX:s.bot.x,centerY:s.bot.y});
 atlas.setCenter(-97,129);atlas.renderFrame();atlas.setZoom(2);
 atlas.store.setTile(-97,129,Chunks.T.MEADOW);
 assert.equal(Sim.serialize(s),before);
 assert.equal(s.version,1);
 assert.deepEqual([s.bot.x,s.bot.y],JSON.parse(before).bot&&
  [JSON.parse(before).bot.x,JSON.parse(before).bot.y]);
 assert.deepEqual(Sim.restore(before).map,s.map);
});

test("cross-border sparse edits survive serialize and reload independently of camera",()=>{
 const store=Store.create(137,{maxActive:5});
 const atlas=View.create(137,{store,centerX:-1,centerY:-1});
 atlas.renderFrame();
 const x=-1,y=-1,initial=store.tileAt(x,y);
 store.setTile(x,y,initial===0?6:0);
 assert.equal(atlas.renderFrame().dirty.length,1);
 const copy=Store.restore(store.serialize(),{maxActive:5});
 const reloaded=View.create(137,{store:copy,centerX:-1,centerY:-1});
 const frame=reloaded.renderFrame(),cam=reloaded.camera();
 const idx=(y-cam.y)*cam.width+(x-cam.x);
 assert.equal(frame.tiles[idx],copy.tileAt(x,y));
 assert.notEqual(frame.tiles[idx],initial);
});
