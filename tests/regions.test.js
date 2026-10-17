const test=require('node:test'),assert=require('node:assert/strict'),S=require('../src/sim');
const data=require('../data/world-regions.v1.json');
test('100 seeds have deterministic full region coverage and connected destinations',()=>{
 for(let seed=1;seed<=100;seed++){
  const a=S.create(seed),b=S.create(seed);assert.deepEqual(a.map,b.map);
  const ids=new Set();for(let y=0;y<S.H;y++)for(let x=0;x<S.W;x++){const r=S.regionAt(a,x,y);ids.add(r.id);assert.equal(r.id,S.regionAt(b,x,y).id);if(Math.abs(x-32)+Math.abs(y-24)<=5)assert.equal(r.id,'R00');}
  assert.equal(ids.size,8);
  for(const [x,y] of [...data.regions.map(r=>r.anchor),[20,31],[42,19]])assert.ok(S.findPath(a,(xx,yy)=>xx===x&&yy===y),'seed '+seed+' destination '+x+','+y);
  for(const t of [S.T.BERRY,S.T.FOREST,S.T.STONE])assert.ok(S.findPath(a,(x,y,v)=>v===t));
  for(const [x,y] of [[25,21],[37,27]])assert.equal(a.map[S.idx(x,y)],S.T.VILLAGE);
 }
});
test('regional ecology supplies distinct forest, quarry and fen while keeping NPC homes',()=>{
 const s=S.create(42),counts=Array.from({length:8},()=>Array(11).fill(0));
 for(let y=0;y<S.H;y++)for(let x=0;x<S.W;x++)counts[Number(S.regionAt(s,x,y).id.slice(1))][s.map[S.idx(x,y)]]++;
 assert.ok(counts[3][S.T.FOREST]>80);assert.ok(counts[4][S.T.STONE]>80);assert.ok(counts[7][S.T.WATER]>80);
 assert.deepEqual(s.npcs.map(p=>[p.homeX,p.homeY]),[[37,27],[25,21],[42,19]]);
 for(let i=0;i<2000;i++){S.tick(s);assert.ok(s.enemies.length<=5);assert.ok(s.enemies.every(e=>Math.abs(e.x-32)+Math.abs(e.y-24)>5));}
});
