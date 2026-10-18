const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../src/sim.js');
const moonwell=S.idx(50,39);

function unlock(s){
 s.chapter={version:1,stage:3,rewarded:true,completedAt:s.tick};
 s.chapterTwo={version:1,stage:3,rewarded:true,completedAt:s.tick};
 s.camp={x:32,y:24};s.bot.tool=1;s.bot.hunger=100;s.bot.energy=100;s.bot.food=9;s.bot.hp=s.bot.maxHp;
 s.enemies=[];
}
function ancientEvidence(s){
 s.regions.discovered=['R00','R01','R02','R03','R04','R05','R06','R07'];
 s.seen[moonwell]=1;assert.equal(s.map[moonwell],S.T.RUIN);
 s.map[moonwell]=S.T.MEADOW;
}
test('Chapter III is initially locked and its HUD status is pure',()=>{
 const s=S.create(41),before=S.serialize(s);
 const f=S.finaleStatus(s);assert.equal(f.stage,0);assert.equal(f.unlocked,false);
 assert.equal(f.id,'chapter-3');assert.match(f.objective,/Chapter II/i);
 S.finaleStatus(s);assert.equal(S.serialize(s),before);
});
test('Moonwell requires a real studied ruin, not only the region label',()=>{
 const s=S.create(4);unlock(s);
 s.regions.discovered=['R00','R07'];S.tick(s);
 assert.equal(s.finale.stage,0,'unexplored Moonwell cannot progress');
 s.seen[moonwell]=1;S.tick(s);assert.equal(s.finale.stage,0,'ruin must be studied');
 s.map[moonwell]=S.T.MEADOW;S.tick(s);assert.equal(s.finale.stage,1);
 assert.equal(S.finaleStatus(s).completed,false);
});
test('final ritual requires three region echoes and a real autonomous return',()=>{
 const s=S.create(41);unlock(s);ancientEvidence(s);
 S.tick(s);assert.equal(s.finale.stage,1);
 S.tick(s);assert.equal(s.finale.stage,2);
 const beforeFaith=s.faith,oldHp=s.bot.maxHp,oldLevel=s.bot.level,oldMilestones=s.milestones;
 assert.equal(s.finale.ritualDone,false);
 s.bot.x=49;s.bot.y=39;
 // The action is at the actual Moonwell, never unlocked by a remote UI command.
 S.plan(s);assert.equal(s.bot.goal,'Return to Moonwell');
 for(let i=0;i<6&&s.finale.stage!==3;i++)S.tick(s);
 assert.equal(s.finale.stage,3,'Nim must reach Moonwell herself');
 assert.equal(s.finale.rewarded,true);assert.equal(s.finale.ritualDone,true);
 assert.equal(s.bot.maxHp-oldHp-4*(s.bot.level-oldLevel),3,'finale rewards +3 max HP in addition to normal level-ups');
 assert.ok(s.faith>=beforeFaith+5||s.faith===50);
 assert.ok(s.milestones>=oldMilestones+1);
 assert.ok(s.log.some(e=>e.title==='THE END · The Moonwell Dawn'));
 const loaded=S.restore(S.serialize(s));assert.ok(loaded);
 assert.equal(S.finaleStatus(loaded).completed,true);
 const stamp=loaded.finale.completedAt,earnedHP=loaded.bot.maxHp;
 for(let i=0;i<250;i++)S.tick(loaded);
 assert.equal(loaded.finale.completedAt,stamp);
 assert.ok(loaded.bot.maxHp>=earnedHP);
 assert.equal(loaded.log.filter(e=>e.title==='THE END · The Moonwell Dawn').length,1);
});
test('old saves credit genuine Moonwell discoveries without minting a free ending',()=>{
 const s=S.create(99);unlock(s);ancientEvidence(s);
 delete s.finale;
 const faith=s.faith,health=s.bot.maxHp,xp=s.bot.xp;
 const restored=S.restore(S.serialize(s));assert.ok(restored);
 assert.equal(restored.finale.stage,2);assert.equal(restored.finale.rewarded,false);
 assert.equal(restored.finale.ritualDone,false);
 assert.equal(restored.faith,faith);assert.equal(restored.bot.maxHp,health);assert.equal(restored.bot.xp,xp);
 assert.equal(restored.log.filter(e=>e.title==='THE END · The Moonwell Dawn').length,0);
});
test('tampered/malformed finale metadata cannot counterfeit the conclusion',()=>{
 const s=S.create(21);unlock(s);s.regions.discovered=['R00','R07'];
 const raw=JSON.parse(S.serialize(s));
 for(const finale of [null,{version:2,stage:3,ritualDone:true},{version:1,stage:3,ritualDone:false},
  {version:1,stage:900,ritualDone:true},{version:1,stage:'3',ritualDone:true}]){
  raw.finale=finale;const restored=S.restore(raw);assert.ok(restored);
  assert.equal(restored.finale.stage,0);
  assert.equal(restored.finale.rewarded,false);
 }
});
test('eight autonomous seeds earn the real three-chapter ending and retain free play',()=>{
 for(const seed of [1,7,17,41,77,99,123,2026]){
  const s=S.create(seed);
  for(let i=0;i<2000;i++)S.tick(s);
  assert.equal(S.chapterStatus(s).completed,true,'Chapter I seed '+seed);
  assert.equal(S.roadStatus(s).completed,true,'Chapter II seed '+seed);
  assert.equal(S.finaleStatus(s).completed,true,'Chapter III seed '+seed+' at stage '+s.finale.stage);
  assert.equal(s.finale.ritualDone,true);
  assert.equal(S.validate(s),true);
  const before=s.bot.steps;
  for(let i=0;i<150;i++)S.tick(s);
  assert.ok(s.bot.steps>before,'Nim keeps living after the ending: '+seed);
  const roundtrip=S.restore(S.serialize(s));assert.ok(roundtrip);
  assert.equal(roundtrip.finale.completedAt,s.finale.completedAt);
  assert.equal(roundtrip.finale.rewarded,true);
 }
});
