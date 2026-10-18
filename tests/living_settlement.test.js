const test=require('node:test'),assert=require('node:assert/strict'),S=require('../src/sim'),Life=require('../src/life');
test('two real square-pixel settlements start with safe blueprint footprints',()=>{
 const s=S.create(41);
 assert.equal(s.life.buildings.length,2);
 for(const b of s.life.buildings){
  assert.equal(b.w,2);assert.equal(b.h,2);
  assert.ok(['Briarford','Emberwick'].includes(b.town));
  for(let y=b.y;y<b.y+2;y++)for(let x=b.x;x<b.x+2;x++)
   assert.ok([S.T.GRASS,S.T.MEADOW].includes(s.map[S.idx(x,y)]),'foundation must not delete landmarks, roads or water');
 }
 assert.equal(s.map[S.idx(50,39)],S.T.RUIN);
 assert.equal(s.map[S.idx(20,31)],S.T.SHRINE);
});
test('divine letters parse Spanish verbs and English without claiming full natural language understanding',()=>{
 const cases=[
  ['Construye una casa','build'],['Cultiva alimentos','farm'],['Explora las ruinas','explore'],
  ['Descansa','rest'],['Ayuda a los vecinos','help'],['Estudia el pasado','study'],
  ['Recoge madera','gather'],['Build a house','build'],['Explore new ground','explore']
 ];
 for(const [msg,intent] of cases){
  const s=S.create(41),q=S.issueGuidance(s,'Ira',msg);
  assert.ok(q.ok,msg+' '+q.reason);assert.equal(q.intent,intent,msg);
 }
 const s=S.create(41);
 const before=S.serialize(s),unknown=S.issueGuidance(s,'Nim','Color of silence beyond time');
 assert.equal(unknown.ok,false);assert.equal(S.serialize(s),before,'unrecognized guidance should be pure');
 assert.equal(S.issueGuidance(s,'Unknown','Build a home').ok,false);
});
test('citizens can decline guidance and accepted guidance is observed, not a forced command',()=>{
 const s=S.create(41);
 let refused=S.issueGuidance(s,'Nim','Build a new house');
 assert.equal(refused.ok,true);assert.equal(refused.accepted,false);
 assert.equal(s.life.letters[0].status,'declined');
 for(let i=0;i<6;i++)S.tick(s);
 const req=S.issueGuidance(s,'Ira','Grow food for the settlement');
 assert.equal(req.ok,true);assert.equal(req.accepted,true);
 assert.equal(s.life.letters[0].status,'considering');
 for(let i=0;i<26;i++)S.tick(s);
 assert.equal(s.life.letters[0].status,'acted');
 assert.ok(s.life.decisions.some(d=>d.person==='Ira'&&d.action.includes('Acted on')));
 const loaded=S.restore(S.serialize(s));assert.ok(loaded);
 assert.equal(loaded.life.letters[0].status,'acted');
});
test('resident town development uses resource budgets and distinct legal blueprints',()=>{
 for(const seed of [1,41,99,2026]){
  const s=S.create(seed),tiles=s.map.slice();
  for(let t=0;t<1800;t++)S.tick(s);
  const l=s.life;
  assert.ok(l.buildings.length>=6,'seed '+seed+' stayed an empty camp');
  assert.ok(l.buildings.length<=16);
  assert.ok(l.age>=1,'town never advanced beyond founding');
  assert.ok(l.buildings.some(b=>b.type==='farm'));
  assert.ok(l.buildings.some(b=>b.type==='workshop'));
  assert.ok(new Set(l.buildings.map(b=>b.x+','+b.y)).size===l.buildings.length);
  for(const b of l.buildings)for(let y=b.y;y<b.y+2;y++)for(let x=b.x;x<b.x+2;x++){
   const earlier=tiles[S.idx(x,y)],now=s.map[S.idx(x,y)];
   assert.ok(![S.T.WATER,S.T.SHRINE,S.T.RUIN,S.T.ROAD,S.T.VILLAGE].includes(earlier),
     'buildings cannot overwrite terrain landmarks');
   assert.ok([S.T.GRASS,S.T.MEADOW].includes(now),
     'food and timber cannot respawn inside completed structures');
  }
  assert.equal(s.map[S.idx(50,39)],S.T.MEADOW,'Moonwell ruin is studied, never replaced by buildings');
  for(const k of ['wood','stone','food'])assert.ok(l.stock[k]>=0&&l.stock[k]<=99);
  assert.ok(s.npcs.some(p=>/Gathering|Harvesting|Quarrying|Sleeping|Visiting/.test(p.activity)));
  assert.ok(S.serialize(s).length<100000,'resident state must stay bounded on low-RAM Android');
  assert.ok(S.validate(s));
  const copy=S.restore(S.serialize(s));assert.ok(copy);assert.equal(copy.life.buildings.length,l.buildings.length);
 }
});
test('long autonomous life and fixed story chapters remain compatible',()=>{
 const s=S.create(41);
 for(let i=0;i<3000;i++)S.tick(s);
 assert.equal(S.chapterStatus(s).completed,true);
 assert.equal(S.roadStatus(s).completed,true);
 assert.equal(S.finaleStatus(s).completed,true);
 assert.ok(s.life.decisions.length<=20);
 assert.ok(s.life.letters.length<=12);
 const restored=S.restore(S.serialize(s));assert.ok(restored);
 assert.ok(restored.bot.steps>50);
});
