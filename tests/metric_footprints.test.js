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

test('INT-002: compact fallback never builds over the player, active NPCs or residents',()=>{
 const s=world(31),t=s.living.towns[0],x=t.x+5,y=t.y+4;
 s.map.fill(2);s.enemies=[];
 for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)s.map[(y+dy)*W+x+dx]=0;
 s.map[(y-1)*W+x]=8; // only accessible road-connected 2x2 parcel
 s.bot.x=1;s.bot.y=1;
 const actorChecks=[
  s.bot,
  s.living.citizens[0],
  s.npcs[0]
 ];
 for(const actor of actorChecks){
  const prior={x:actor.x,y:actor.y};
  actor.x=x;actor.y=y;
  assert.equal(Living.site(s,t,'market'),null,'must not construct over an existing actor');
  actor.x=prior.x;actor.y=prior.y;
 }
 s.enemies.push({id:999,x,y});
 assert.equal(Living.site(s,t,'market'),null,'must not place building on an active enemy');
 s.enemies.pop();
 const chosen=Living.site(s,t,'market');
 assert.ok(chosen,'preserve emergency compact town growth when parcel is clear');
 assert.deepEqual([chosen.x,chosen.y,chosen.w,chosen.h],[x,y,2,2]);
});

test('INT-002: minimap reveals only observed building footprint cells',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const ui=fs.readFileSync(path.join(__dirname,'../src/ui.js'),'utf8');
 const start=ui.indexOf('function drawMini(){'),end=ui.indexOf('\nfunction bar(',start);
 assert.ok(start>=0&&end>start,'read actual minimap code, not a duplicated implementation');
 const fn=ui.slice(start,end);
 const calls=[],mctx={
  fillStyle:'',strokeStyle:'',lineWidth:1,
  createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)};},
  putImageData(){},fillRect(...p){calls.push(p);},strokeRect(){}
 };
 const unseen={map:new Array(W*H).fill(0),seen:new Array(W*H).fill(0),
  bot:{x:1,y:1},living:{towns:[{buildings:[{x:10,y:10,w:4,h:4}]}]}};
 const A={W,H,N:W*H,idx:(x,y)=>y*W+x};
 const draw=new Function('mctx','s','A','colors','camX','camY','VW','VH','godSeesTown',
  fn+';return drawMini;')(mctx,unseen,A,['#888888'],0,0,20,10,()=>false);
 draw();
 assert.equal(calls.filter(c=>c[0]>=10&&c[0]<14&&c[1]>=10&&c[1]<14).length,0,
  'unseen buildings must not reveal location or total footprint');
 calls.length=0;
 unseen.seen[10*W+10]=1;unseen.seen[13*W+13]=1;
 draw();
 const tiles=calls.filter(c=>c[0]>=10&&c[0]<14&&c[1]>=10&&c[1]<14);
 assert.deepEqual(tiles,[[10,10,1,1],[13,13,1,1]],'show exactly the discovered tiles');
});

test('INT-002: later construction cannot occupy a saved building entrance',()=>{
 const s=world(31),t=s.living.towns[0],x=t.x+5,y=t.y+4;
 s.map.fill(2);s.bot.x=1;s.bot.y=1;s.enemies=[];
 for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)s.map[(y+dy)*W+x+dx]=0;
 s.map[(y-1)*W+x]=8;
 t.buildings.push({id:'existing-home',type:'house',x:x-2,y,w:2,h:2,
  entrance:{orientation:'east',thresholdWorld:{x:x-1,y},
   approachWorld:{x,y},roadDistance:1}});
 assert.equal(Living.site(s,t,'market'),null,
  'even an emergency compact building cannot consume the prior doorstep');
});

test('INT-002: later construction cannot cut the last short road route to a doorway',()=>{
 const s=world(31),t=s.living.towns[0],x=t.x+5,y=t.y+4;
 s.map.fill(2);s.bot.x=1;s.bot.y=1;s.enemies=[];
 for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)s.map[(y+dy)*W+x+dx]=0;
 s.map[y*W+x-1]=0; // existing entrance approach immediately left of parcel
 s.map[(y-1)*W+x]=8; // only route: approach -> x,y -> road
 t.buildings.push({id:'existing-home',type:'house',x:x-3,y,w:2,h:2,
  entrance:{orientation:'east',thresholdWorld:{x:x-2,y},
   approachWorld:{x:x-1,y},roadDistance:2}});
 assert.equal(Living.site(s,t,'market'),null,
  'do not construct a new wall across the only road-connected access');
});

test('INT-002: sparse v1 building IDs cannot be reused by later autonomous construction',()=>{
 const s=world(31),t=s.living.towns[0];
 t.buildings.push({id:t.id+'-7',type:'house',x:5,y:5,w:2,h:2});
 s.tick=12;Living.tick(s);
 assert.equal(t.buildings.length,2,'residents built a new structure');
 assert.equal(t.buildings[1].id,t.id+'-8','ID advances beyond highest existing suffix');
 assert.equal(new Set(t.buildings.map(b=>b.id)).size,t.buildings.length);
 assert.equal(t.nextBuildingId,9,'next ID stored as monotonic durable state');
 const restored=Sim.restore(Sim.serialize(s));
 assert.ok(restored,'existing version-1 save still restores');
 const rt=restored.living.towns[0];
 assert.equal(rt.nextBuildingId,9,'building sequence is saved and restored');
 rt.nextBuild=24;restored.tick=24;
 Living.tick(restored);
 assert.ok(rt.buildings.some(b=>b.id===t.id+'-9'),'new building gets a fresh ID after reload');
 assert.equal(new Set(rt.buildings.map(b=>b.id)).size,rt.buildings.length);
});

test('INT-002: deleted building IDs and stale sequence imports never collide',()=>{
 const s=world(31),t=s.living.towns[0];
 // A former settlement once constructed ID 41 and later demolished it.
 t.nextBuildingId=42;
 s.tick=12;Living.tick(s);
 assert.equal(t.buildings[0].id,t.id+'-42','do not recycle removed building identifiers');
 let copy=JSON.parse(Sim.serialize(s));
 copy.living.towns[0].nextBuildingId=1; // malformed/stale older save
 const restored=Sim.restore(copy);
 assert.ok(restored);
 const rt=restored.living.towns[0];
 assert.equal(rt.nextBuildingId,43,'restore reconciles stale counter against building IDs');
 rt.nextBuild=24;restored.tick=24;
 Living.tick(restored);
 assert.ok(rt.buildings.some(b=>b.id===t.id+'-43'));
 assert.equal(new Set(rt.buildings.map(b=>b.id)).size,rt.buildings.length);
});
