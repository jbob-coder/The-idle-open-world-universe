const assert=require('node:assert/strict');
const test=require('node:test');
const S=require('../src/sim.js');

test('Chapter I begins with a useful autonomous objective and no direct controls',()=>{
 const s=S.create(41),chapter=S.chapterStatus(s);
 assert.equal(chapter.id,'chapter-1');
 assert.equal(chapter.stage,0);
 assert.equal(chapter.total,3);
 assert.equal(chapter.completed,false);
 assert.match(chapter.objective,/camp.*tool/i);
 const before=S.serialize(s);
 S.chapterStatus(s);S.chapterStatus(s);
 assert.equal(S.serialize(s),before,'reading story status never mutates the simulation');
});

function prepare(s){
 s.camp={x:s.bot.x,y:s.bot.y};s.bot.tool=1;
 S.tick(s);
 assert.equal(s.chapter.stage,1);
 s.npcs[0].met=true;
 S.tick(s);
 assert.equal(s.chapter.stage,2);
}

test('Chapter I has three real milestones, one-time reward and an ending',()=>{
 const s=S.create(17);prepare(s);
 const oldHP=s.bot.maxHp,oldFaith=s.faith,oldMilestones=s.milestones;
 s.bot.ruins=1;s.shrinesVisited.push(S.idx(20,31));
 S.tick(s);
 const status=S.chapterStatus(s);
 assert.equal(status.stage,3);assert.equal(status.completed,true);
 assert.equal(s.chapter.rewarded,true);
 assert.equal(s.chapter.completedAt,s.tick);
 assert.equal(s.bot.maxHp,oldHP+2);
 assert.ok(s.faith>=oldFaith+5 || s.faith===50);
 assert.equal(s.milestones,oldMilestones+1);
 assert.ok(s.bot.memory.some(m=>m.includes('Mossbound Oath')));
 assert.equal(s.log.filter(e=>e.title==='Chapter I complete').length,1);
 assert.match(status.objective,/Completed/);
 const doneAt=s.chapter.completedAt;
 for(let i=0;i<200;i++)S.tick(s);
 assert.equal(s.chapter.completedAt,doneAt,'completion timestamp never resets');
 assert.equal(s.log.filter(e=>e.title==='Chapter I complete').length,1);
 assert.ok(S.validate(s));
});

test('Chapter I progress and earned reward survive save and restore',()=>{
 const s=S.create(99);prepare(s);
 const half=S.restore(S.serialize(s));
 assert.equal(S.chapterStatus(half).stage,2);
 half.bot.ruins=1;half.shrinesVisited.push(S.idx(42,19));
 S.tick(half);
 const restored=S.restore(S.serialize(half));
 assert.equal(S.chapterStatus(restored).stage,3);
 assert.equal(restored.chapter.rewarded,true);
 const maxHP=restored.bot.maxHp,at=restored.chapter.completedAt;
 S.tick(restored);S.tick(restored);
 assert.equal(restored.bot.maxHp,maxHP);
 assert.equal(restored.chapter.completedAt,at);
 assert.equal(restored.log.filter(e=>e.title==='Chapter I complete').length,1);
});

test('Pre-chapter saves migrate with achievements and never farm completion rewards',()=>{
 const s=S.create(12);s.camp={x:32,y:24};s.bot.tool=1;
 s.npcs[1].met=true;s.bot.ruins=2;s.shrinesVisited=[S.idx(20,31)];
 delete s.chapter;
 const beforeHp=s.bot.maxHp,beforeFaith=s.faith;
 const restored=S.restore(S.serialize(s));
 assert.equal(S.chapterStatus(restored).stage,3);
 assert.equal(restored.chapter.rewarded,true);
 assert.equal(restored.bot.maxHp,beforeHp,'legacy accomplishments do not retroactively grant stats');
 assert.equal(restored.faith,beforeFaith,'legacy migration does not mint additional Faith');
 S.tick(restored);assert.equal(restored.bot.maxHp,beforeHp);
 assert.equal(restored.log.filter(e=>e.title==='Chapter I complete').length,0);
});

test('Old saves without chapters and corrupt chapter metadata safely reconstruct',()=>{
 const s=S.create(7),raw=JSON.parse(S.serialize(s));
 delete raw.chapter;
 const old=S.restore(raw);
 assert.equal(old.chapter.stage,0);
 const variants=[
 {version:2,stage:3,completedAt:999999,rewarded:false},
 {version:1,stage:-1},
 {version:1,stage:1000000},
 {version:1,stage:'3'},
 null
 ];
 for(const damaged of variants){
  const obj=JSON.parse(S.serialize(s));obj.chapter=damaged;
  const restored=S.restore(obj);
  assert.ok(restored);
  assert.equal(restored.chapter.stage,0);
 }
});

test('A full autonomous 10k-tick world can advance its first story without commands',()=>{
 const s=S.create(41);
 for(let i=0;i<10000;i++)S.tick(s);
 assert.ok(s.bot.steps>100);
 assert.ok(s.camp&&s.bot.tool,'survival chapter prerequisites are earned independently');
 assert.ok(s.npcs.some(p=>p.met),'Nim meets a traveler independently');
 assert.ok(s.bot.ruins>0,'Nim reaches old ruins independently');
 assert.equal(S.chapterStatus(s).completed,true,'the story can be completed without directly controlling Nim');
 assert.ok(S.restore(S.serialize(s)));
});
