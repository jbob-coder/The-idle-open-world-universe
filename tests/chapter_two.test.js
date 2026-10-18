const assert=require('node:assert/strict');
const test=require('node:test');
const S=require('../src/sim.js');

const completedFirst=s=>{
 s.chapter={version:1,stage:3,completedAt:s.tick,rewarded:true};
 s.camp={x:s.bot.x,y:s.bot.y};s.bot.tool=1;
};
const advanceToSecondFinal=s=>{
 completedFirst(s);
 s.regions.discovered=['R00','R01','R02'];
 S.tick(s);assert.equal(S.roadStatus(s).stage,1);
 s.regions.discovered.push('R05');s.bot.ruins=2;
 S.tick(s);assert.equal(S.roadStatus(s).stage,2);
};

test('Chapter II is locked until Chapter I and status inspection is pure',()=>{
 const s=S.create(41),before=S.serialize(s);
 const status=S.roadStatus(s);
 assert.equal(status.id,'chapter-2');assert.equal(status.unlocked,false);
 assert.equal(status.stage,0);assert.match(status.objective,/complete chapter i/i);
 S.roadStatus(s);S.roadStatus(s);
 assert.equal(S.serialize(s),before);
});

test('Chapter II completes exactly once after hamlets, Crownfall, Mera and two shrines',()=>{
 const s=S.create(123);advanceToSecondFinal(s);
 const beforeFood=s.bot.food,beforeFaith=s.faith;
 const beforeMilestones=s.milestones;
 s.npcs.find(p=>p.name==='Mera').met=true;
 s.shrinesVisited=[S.idx(20,31),S.idx(42,19)];
 S.tick(s);
 const chapter=S.roadStatus(s);
 assert.equal(chapter.stage,3);assert.equal(chapter.total,3);
 assert.equal(chapter.completed,true);
 assert.match(chapter.objective,/completed/i);
 assert.equal(s.chapterTwo.rewarded,true);
 assert.equal(s.chapterTwo.completedAt,s.tick);
 assert.equal(s.bot.food,beforeFood+2);
 assert.ok(s.faith>=beforeFaith+4||s.faith===50);
 assert.equal(s.milestones,beforeMilestones+1);
 assert.equal(s.log.filter(e=>e.title==='Chapter II complete').length,1);
 assert.ok(s.bot.memory.some(m=>m.includes('Last Cartographer')));
 const finishedAt=s.chapterTwo.completedAt,earnedFood=s.bot.food;
 for(let i=0;i<20;i++)S.tick(s);
 assert.equal(s.chapterTwo.completedAt,finishedAt);
 assert.ok(s.bot.food<=earnedFood+10);
 assert.equal(s.log.filter(e=>e.title==='Chapter II complete').length,1);
 assert.ok(S.validate(s));
});

test('Chapter II cannot be completed by merely reaching Crownfall before learning both villages',()=>{
 const s=S.create(99);completedFirst(s);
 s.regions.discovered=['R00','R05'];s.bot.ruins=2;
 s.npcs.find(p=>p.name==='Mera').met=true;
 s.shrinesVisited=[S.idx(20,31),S.idx(42,19)];
 S.tick(s);
 assert.equal(S.roadStatus(s).stage,0);
 assert.equal(s.log.filter(e=>e.title==='Chapter II complete').length,0);
});

test('Chapter II persists across save/restore and cannot repay reward on reload',()=>{
 const s=S.create(8);advanceToSecondFinal(s);
 s.npcs.find(p=>p.name==='Mera').met=true;
 s.shrinesVisited=[S.idx(20,31),S.idx(42,19)];
 S.tick(s);
 const save=S.serialize(s),loaded=S.restore(save);
 assert.ok(loaded);assert.equal(S.roadStatus(loaded).completed,true);
 assert.equal(loaded.chapterTwo.rewarded,true);
 const stamp=loaded.chapterTwo.completedAt,faith=loaded.faith;
 S.tick(loaded);S.tick(loaded);
 assert.equal(loaded.chapterTwo.completedAt,stamp);
 assert.ok(loaded.faith<=faith+3);
 assert.equal(loaded.log.filter(e=>e.title==='Chapter II complete').length,1);
});

test('Legacy pre-Chapter II world gets credit without retroactive resources or Faith',()=>{
 const s=S.create(21);completedFirst(s);
 s.regions.discovered=['R00','R01','R02','R05'];
 s.bot.ruins=3;s.shrinesVisited=[S.idx(20,31),S.idx(42,19)];
 s.npcs.find(p=>p.name==='Mera').met=true;
 delete s.chapterTwo;
 const beforeFood=s.bot.food,beforeFaith=s.faith,beforeXP=s.bot.xp;
 const loaded=S.restore(S.serialize(s));
 assert.ok(loaded);assert.equal(S.roadStatus(loaded).completed,true);
 assert.equal(loaded.chapterTwo.rewarded,true);
 assert.equal(loaded.bot.food,beforeFood);
 assert.equal(loaded.faith,beforeFaith);
 assert.equal(loaded.bot.xp,beforeXP);
 S.tick(loaded);
 assert.equal(loaded.log.filter(e=>e.title==='Chapter II complete').length,0);
});

test('Corrupted Chapter II save is reconstructed safely from actual region progress',()=>{
 const s=S.create(77);completedFirst(s);
 const variants=[{version:2,stage:3},{version:1,stage:-1},{version:1,stage:999},
  {version:1,stage:'3'},null];
 for(const broken of variants){
  const state=JSON.parse(S.serialize(s));state.chapterTwo=broken;
  const loaded=S.restore(state);assert.ok(loaded);
  assert.equal(S.roadStatus(loaded).stage,0);
  assert.equal(loaded.chapterTwo.rewarded,false);
 }
});

test('Autonomous map quest chooses walkable region route without direct god control',()=>{
 const s=S.create(41);completedFirst(s);
 const b=s.bot;b.hunger=99;b.energy=100;b.hp=b.maxHp;b.food=8;
 s.enemies=[];s.guide=null;
 S.plan(s);
 assert.equal(b.goal,'Trace lost road',b.goal+' / '+b.thought);
 assert.ok(b.path.length>0);
 const [x,y]=b.path[0];assert.equal(S.walkable(s,x,y),true);
 const baseline=S.serialize(s);
 S.roadStatus(s);
 assert.equal(S.serialize(s),baseline,'rendering status cannot mutate world');
});

test('Chapter II can conclude in a long fully autonomous seeded playthrough',()=>{
 const s=S.create(41);
 for(let i=0;i<10000;i++)S.tick(s);
 const first=S.chapterStatus(s),second=S.roadStatus(s);
 assert.equal(first.completed,true,'Chapter I remains autonomously completable');
 assert.equal(second.completed,true,'Nim must restore the road with no player controls; stage='+second.stage+
  ' discovered='+s.regions.discovered.join(',')+' ruins='+s.bot.ruins+
  ' shrines='+s.shrinesVisited.length+' mera='+s.npcs.find(p=>p.name==='Mera').met);
 assert.ok(S.restore(S.serialize(s)));
});
