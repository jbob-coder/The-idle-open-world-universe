// Medieval fantasy gameplay acceptance tests: deterministic, offline and low-resource.
const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('../src/sim.js');
const count=(s,t)=>s.map.filter(x=>x===t).length;

test('medieval world landmarks are deterministic, mapped, and walkable',()=>{
 for(const seed of [1,2345,1234567]){
  const a=S.create(seed),b=S.create(seed);
  assert.deepEqual(a.map,b.map);
  assert.ok(count(a,S.T.ROAD)>=2,'at least two road segments');
  assert.equal(count(a,S.T.VILLAGE),2,'two village centers');
  assert.equal(count(a,S.T.SHRINE),2,'two discoverable rune shrines');
  for(let i=0;i<S.N;i++){
   if([S.T.ROAD,S.T.VILLAGE,S.T.SHRINE].includes(a.map[i])){
    assert.equal(S.walkable(a,i%S.W,Math.floor(i/S.W)),true);
   }
  }
  assert.equal(S.validate(a),true);
 }
});

test('three medieval guild travelers have capped independent state',()=>{
 const s=S.create(710);
 assert.equal(s.npcs.length,3);
 assert.deepEqual(s.npcs.map(p=>p.role),['Apothecary','Squire','Rune Scholar']);
 assert.equal(new Set(s.npcs.map(p=>p.id)).size,3);
 for(const p of s.npcs){
  assert.ok(S.walkable(s,p.x,p.y));
  assert.ok(p.homeX>=0&&p.homeX<S.W&&p.homeY>=0&&p.homeY<S.H);
 }
 const start=s.npcs.map(p=>[p.x,p.y]);
 for(let i=0;i<240;i++)S.tick(s);
 assert.ok(s.npcs.some((p,i)=>p.x!==start[i][0]||p.y!==start[i][1]),
   'at least one traveler should move without user direction');
 assert.ok(s.npcs.every(p=>Math.abs(p.x-p.homeX)+Math.abs(p.y-p.homeY)<=9));
});

test('inspiration needs a revealed traveler and applies a single autonomous response',()=>{
 for(const role of ['Apothecary','Squire','Rune Scholar']){
  const s=S.create(56);
  const p=s.npcs.find(q=>q.role===role);
  const nx=p.x,ny=p.y;
  s.faith=30;
  // A hidden traveler cannot be targeted through the fog of exploration.
  s.seen[S.idx(nx,ny)]=0;
  const before=s.faith;
  assert.equal(S.power(s,'inspire',nx,ny).ok,false);
  assert.equal(s.faith,before);
  s.seen[S.idx(nx,ny)]=1;
  assert.equal(S.power(s,'inspire',nx,ny).ok,true);
  assert.equal(s.faith,before-S.COST.inspire);
  assert.equal(p.mood,'hopeful');
  assert.ok(p.favorUntil>s.tick);
  for(let i=0;i<12;i++)S.tick(s);
  assert.equal(p.favorSpent,true);
  assert.equal(s.log.filter(e=>e.title.includes('answered')).length,1);
  for(let i=0;i<36;i++)S.tick(s);
  assert.equal(s.log.filter(e=>e.title.includes('answered')).length,1,
    'a divine favor must not repeat free benefits each tick');
  assert.equal(S.validate(s),true);
 }
});

test('shrines reward exploration once and do not enable infinite Faith',()=>{
 const s=S.create(9090);
 const index=s.map.indexOf(S.T.SHRINE);
 assert.ok(index>=0);
 const x=index%S.W,y=Math.floor(index/S.W);
 s.bot.x=x;s.bot.y=y;
 s.camp={x,y};
 s.bot.tool=1;s.bot.energy=100;s.bot.hunger=100;s.bot.food=10;
 // Prevent the planner from selecting a different shrine.
 for(let i=0;i<S.N;i++)if(s.map[i]===S.T.SHRINE&&i!==index)s.shrinesVisited.push(i);
 const before=s.faith;
 for(let i=0;i<2;i++)S.tick(s);
 assert.ok(s.shrinesVisited.includes(index),'discovered shrine recorded');
 assert.ok(s.faith>before);
 const n=s.shrinesVisited.length;
 const faith=s.faith;
 for(let i=0;i<2;i++)S.tick(s);
 assert.equal(s.shrinesVisited.length,n);
 assert.ok(s.faith<=faith+3,'no duplicate shrine bounty');
});

test('previous save versions migrate without losing Nim or changing the schema',()=>{
 const s=S.create(9753);
 const old=JSON.parse(S.serialize(s));
 delete old.npcs;delete old.shrinesVisited;
 old.map=old.map.map(t=>t>=S.T.ROAD?S.T.GRASS:t);
 const restored=S.restore(old);
 assert.ok(restored);
 assert.equal(restored.version,1);
 assert.equal(restored.npcs.length,3);
 assert.deepEqual(restored.shrinesVisited,[]);
 assert.equal(restored.bot.level,s.bot.level);
 assert.equal(S.validate(restored),true);
});
