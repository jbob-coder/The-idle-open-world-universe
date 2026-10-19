'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const E=require('../src/world/ecology');const Chunks=require('../src/world/chunks');

test('WLD-006 climate and biome variation are stable across signed world coordinates',()=>{
  const values=new Set();
  for(const s of [1,41,2026,0xffffffff])for(const [x,y] of [[0,0],[32,32],[-31,70],[1025,-1001],[7000,8000]]) {
    const a=E.climateAt(s,x,y);
    assert.deepEqual(a,E.climateAt(s,x,y));
    assert.ok(a.temperature>=0&&a.temperature<=1&&a.moisture>=0&&a.moisture<=1);
    const biome=E.biomeAt(s,x,y);assert.ok(Object.values(E.BIOMES).includes(biome));values.add(biome);
  }
  assert.ok(values.size>=4);
});

test('WLD-006 seeded chunk sampling independent of generation order and seam',()=>{
  for(const [cx,cy] of [[-2,3],[0,0],[1,-1],[100,-45]]) {
    const a=E.generateEcologyChunk(41,cx,cy,{tick:100});
    E.generateEcologyChunk(41,99,99);
    const b=E.generateEcologyChunk(41,cx,cy,{tick:100});
    assert.deepEqual(a,b);
    assert.equal(a.tiles.length,1024);assert.equal(a.biomes.length,1024);
    for(let y=0;y<32;y++)for(let x=0;x<32;x++) {
      const p=Chunks.chunkToWorld(cx,cy,x,y);
      assert.equal(a.biomes[y*32+x],E.biomeAt(41,p.x,p.y));
    }
  }
});

test('WLD-006 route markings cross all chunk borders and saved edits remain authoritative',()=>{
  const routes=(x,y)=>x===31||x===32||y===-1||y===0;
  for(const [cx,cy] of [[0,0],[1,0],[0,-1],[1,-1]]) {
    const a=E.generateEcologyChunk(9,cx,cy,{routeAt:routes});
    for(let y=0;y<32;y++)for(let x=0;x<32;x++) {
      const p=Chunks.chunkToWorld(cx,cy,x,y),tile=a.tiles[y*32+x];
      if(routes(p.x,p.y))assert.equal(tile,E.T.ROAD);
    }
  }
  const override=E.generateEcologyChunk(9,0,0,{routeAt:routes,
    savedTileAt:(x,y)=>x===31&&y===0?E.T.SHRINE:null});
  assert.equal(override.tiles[31],E.T.SHRINE);
  const protectedCell=E.generateEcologyChunk(9,0,0,{routeAt:routes,
    protectedAt:(x,y)=>x===31&&y===0});
  assert.equal(protectedCell.tiles[31],Chunks.tileAt(9,31,0));
});

test('WLD-006 heritage ruins and sacred site IDs persist across re-generation',()=>{
  let seenRuin=null,seenShrine=null;
  for(let gx=-9;gx<=9;gx++)for(let gy=-9;gy<=9;gy++) {
    const s=12345,x=gx*64+12+Math.floor(hash(s,gx,gy,0x4251)*40);
    const y=gy*64+12+Math.floor(hash(s,gx,gy,0x7a53)*40);
    const landmark=E.landmarkAt(s,x,y);
    if(landmark) {
      assert.deepEqual(E.landmarkAt(s,x,y),landmark);
      assert.equal(E.landmarkAt(s,x+1,y),null);
      if(landmark.type==='ruin')seenRuin=landmark;
      if(landmark.type==='chapel_site')seenShrine=landmark;
      const p=Chunks.worldToChunk(x,y);
      const chunk=E.generateEcologyChunk(s,p.chunkX,p.chunkY);
      assert.equal(chunk.tiles[p.index],landmark.tile);
      assert.ok(chunk.landmarks.some(l=>l.id===landmark.id));
      const blocked=E.generateEcologyChunk(s,p.chunkX,p.chunkY,{routeAt:(px,py)=>px===x&&py===y});
      assert.equal(blocked.tiles[p.index],E.T.ROAD);
      assert.ok(!blocked.landmarks.some(l=>l.id===landmark.id));
    }
  }
  assert.ok(seenRuin&&seenShrine,'both ruin and chapel sites must appear in seed sample');
});
function hash(seed,x,y,salt) {
  let h=(seed^Math.imul(x|0,0x1f123bb5)^Math.imul(y|0,0x5f356495)^salt)>>>0;
  h=Math.imul(h^(h>>>16),0x7feb352d);h=Math.imul(h^(h>>>15),0x846ca68b);
  return ((h^(h>>>16))>>>0)/4294967296;
}

test('WLD-006 harvested berries regrow after fixed time, without action side effects',()=>{
  let chosen=null;
  for(let y=-20;y<30&&!chosen;y++)for(let x=-20;x<30;x++) {
    const r=E.resourceAt(88,x,y,100);
    if(r){chosen=r;break;}
  }
  assert.ok(chosen);
  const {x,y}=chosen;
  assert.equal(E.resourceAt(88,x,y,100,100).available,false);
  assert.equal(E.resourceAt(88,x,y,195,100).available,false);
  assert.equal(E.resourceAt(88,x,y,196,100).available,true);
  assert.equal(E.resourceAt(88,x,y,196,100).nextReadyTick,196);
  assert.equal(E.resourceAt(88,x,y,196,100).id,chosen.id);
});

test('WLD-006 small deterministic working set, zero tile sharing, no global mutation',()=>{
  const a=E.generateEcologyChunk(71,-100,100,{tick:100});
  const b=E.generateEcologyChunk(71,-100,100,{tick:100});
  assert.equal(a.tiles.byteLength,1024);assert.equal(a.biomes.byteLength,1024);
  assert.notEqual(a.tiles.buffer,b.tiles.buffer);assert.notEqual(a.biomes.buffer,b.biomes.buffer);
  const original=b.tiles[0];a.tiles[0]=255;
  assert.equal(b.tiles[0],original);
  assert.equal(Chunks.generateChunk(71,-100,100).tiles.length,1024);
});

test('WLD-006 invalid coordinates and forged deltas fail closed',()=>{
  assert.throws(()=>E.climateAt(-1,0,0),RangeError);
  assert.throws(()=>E.biomeAt(0,NaN,0),RangeError);
  assert.throws(()=>E.generateEcologyChunk(1,Number.MAX_SAFE_INTEGER,0),RangeError);
  assert.throws(()=>E.resourceAt(1,0,0,-2),RangeError);
  assert.throws(()=>E.resourceAt(1,0,0,10,11),RangeError);
  assert.throws(()=>E.generateEcologyChunk(1,0,0,{savedTileAt:()=>999}),RangeError);
  assert.throws(()=>E.generateEcologyChunk(1,0,0,{routeAt:true}),TypeError);
});