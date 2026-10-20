'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const Sim=require('../src/sim.js'),Living=require('../src/living.js');
const W=64,H=48;
function world(seed=31){
 const s=Sim.create(seed);
 s.map.fill(0);
 for(const y of [21,27])for(let x=2;x<W-2;x++)s.map[y*W+x]=8;
 s.living.heritage=[];
 for(const t of s.living.towns){
  t.buildings=[];t.stock={food:100,wood:100,stone:100};t.nextBuild=12;
 }
 return s;
}
function rect(b){return {x:b.x,y:b.y,w:b.w||1,h:b.h||1};}
function overlap(a,b){return a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;}
test('INT-002: varied genuine metric footprints are 3x3 to 6x6; legacy well stays compact',()=>{
 for(const kind of ['house','farm','workshop','market','watchtower']){
  const bp=Living.BLUEPRINTS[kind];
  assert.ok(bp.w>=3&&bp.h>=3&&bp.w<=6&&bp.h<=6,kind);
 }
 assert.deepEqual([Living.BLUEPRINTS.market.w,Living.BLUEPRINTS.market.h],[6,6]);
});
test('INT-002: autonomous construction consumes finite stock and creates walkable road approach',()=>{
 const s=world(31),t=s.living.towns[0],before={...t.stock};
 s.tick=12;Living.tick(s);
 const b=t.buildings[0];
 assert.ok(b,'town builds rather than creating only a visual effect');
 assert.deepEqual([b.w,b.h],[4,4]);
 assert.ok(b.entrance && b.entrance.approachWorld,'large structure has real approach');
 const a=b.entrance.approachWorld;
 assert.equal(Living.occupied(s,a.x,a.y),false,'approach remains outside all buildings');
 assert.ok([0,1,3,4,5,6,7,8,9,10].includes(s.map[a.y*W+a.x]),'approach passable');
 assert.ok(t.stock.wood<before.wood && t.stock.stone<before.stone,'materials paid');
 assert.equal(Sim.walkable(s,b.x,b.y),false,'Nim cannot step through built walls');
});
test('INT-002: candidate placement protects full footprints, roads, ruins, old buildings and sites',()=>{
 const s=world(72),t=s.living.towns[0];
 t.buildings.push({id:'old',type:'house',x:22,y:23,w:2,h:2});
 s.living.heritage.push(22*W+25);
 s.map[19*W+24]=5;
 for(const kind of ['house','farm','workshop','market','watchtower']){
  const pos=Living.site(s,t,kind);
  if(!pos)continue;
  const bp=Living.BLUEPRINTS[kind];
  const candidate={x:pos.x,y:pos.y,w:bp.w,h:bp.h};
  assert.ok(!overlap(candidate,rect(t.buildings[0])),kind+' overlaps legacy building');
  for(let dy=0;dy<bp.h;dy++)for(let dx=0;dx<bp.w;dx++){
   const n=(pos.y+dy)*W+pos.x+dx;
   assert.ok([0,6].includes(s.map[n]),kind+' covers a road, ruin or blocked tile');
   assert.ok(!s.living.heritage.includes(n),kind+' covers a protected heritage cell');
  }
 }
});
test('INT-002: v1 restore preserves original 1x1,2x2 and new 4x4 footprints',()=>{
 const s=world(31),t=s.living.towns[0];
 s.tick=12;Living.tick(s);
 assert.equal(t.buildings[0].w,4);
 const newBuilding=structuredClone(t.buildings[0]);
 t.buildings.push({id:'legacy-unit',type:'farm',x:5,y:5,w:1,h:1});
 t.buildings.push({id:'legacy-cottage',type:'house',x:10,y:10,w:2,h:2});
 const saved=Sim.serialize(s),restored=Sim.restore(saved);
 assert.ok(restored,'v1 save remains valid');
 const actual=restored.living.towns[0].buildings;
 for(const b of [newBuilding,{id:'legacy-unit',w:1,h:1},{id:'legacy-cottage',w:2,h:2}]){
  const match=actual.find(q=>q.id===b.id);
  assert.ok(match,b.id+' survived');
  assert.deepEqual([match.w,match.h],[b.w,b.h],b.id);
 }
 assert.equal(restored.version,1);
});
