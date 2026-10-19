const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('../src/sim.js');
const C=require('../src/divine/consent.js');
const Intent=require('../src/divine/intent.js');

test('each named person has distinct, bounded and serializable personal belief',()=>{
 const s=S.create(41),members=[s.bot,...s.npcs,...s.living.citizens];
 assert.equal(members.length,8);
 for(const p of members){
  assert.ok(p.divineBelief,'belief is initialized for '+p.name);
  assert.ok(p.divineBelief.openness>=0&&p.divineBelief.openness<=100);
  assert.ok(p.divineBelief.agency>=0&&p.divineBelief.agency<=100);
  assert.deepEqual(p.divineBelief.history,[]);
 }
 assert.notEqual(members[0].divineBelief,members[1].divineBelief);
 const restored=S.restore(S.serialize(s));assert.ok(restored);
 assert.deepEqual(restored.living.citizens[0].divineBelief,s.living.citizens[0].divineBelief);
 assert.deepEqual(restored.npcs[0].divineBelief,s.npcs[0].divineBelief);
 assert.equal(restored.version,1);
});
test('individual guidance gets named consent, no town puppeting or quest completion',()=>{
 const s=S.create(19),c=s.living.citizens.find(x=>x.name==='Sera');
 const before={tick:s.tick,buildings:s.living.towns.map(t=>t.buildings.length),
  era:s.living.towns.map(t=>t.technology.level),levels:s.bot.level,
  steps:s.bot.steps,completed:s.story.completed,faith:s.faith,stock:s.living.towns.map(t=>({...t.stock}))};
 const result=S.whisper(s,'Sera: explore the woods');
 assert.equal(result.ok,true);
 assert.equal(result.entry.people.length,1);
 assert.equal(result.entry.people[0].name,'Sera');
 assert.equal(result.entry.people[0].state,result.entry.people[0].agree?'considering':'declined');
 assert.match(result.entry.people[0].reason,/\w/);
 assert.deepEqual(result.entry.decisions,[],'individual request must not set village policy');
 assert.equal(c.divineBelief.history.length,1);
 assert.equal(c.divineBelief.history[0].state,result.entry.people[0].state);
 assert.equal(s.tick,before.tick);assert.equal(s.bot.steps,before.steps);
 assert.equal(s.bot.level,before.levels);assert.equal(s.story.completed,before.completed);
 assert.equal(s.faith,before.faith);
 assert.deepEqual(s.living.towns.map(t=>t.buildings.length),before.buildings);
 assert.deepEqual(s.living.towns.map(t=>t.technology.level),before.era);
 assert.deepEqual(s.living.towns.map(t=>t.stock),before.stock);
});
test('each person may independently refuse for safety, food, energy and autonomy',()=>{
 const s=S.create(41),p=s.living.citizens[0],town=s.living.towns[0];
 const m=Intent.interpret('build houses');
 p.needs={hunger:99,energy:99,comfort:99,safety:0,social:99,hygiene:99};
 let d=C.evaluate(s,p,m,town);assert.equal(d.agree,false);assert.match(d.reason,/Safety/);
 p.needs.safety=90;p.needs.hunger=0;
 d=C.evaluate(s,p,m,town);assert.equal(d.agree,false);assert.match(d.reason,/food/);
 p.needs.hunger=90;p.needs.energy=0;
 d=C.evaluate(s,p,m,town);assert.equal(d.agree,false);assert.match(d.reason,/sleep/);
 p.needs.energy=90;p.divineBelief.openness=0;p.divineBelief.agency=100;
 d=C.evaluate(s,p,m,town);assert.equal(d.agree,false);assert.match(d.reason,/independence/);
 assert.equal(s.living.whispers.length,0,'pure evaluator does not issue whispers');
});
test('town targeted intent involves only that settlement and respects survival',()=>{
 const s=S.create(41),c=s.living.citizens.find(x=>x.name==='Elin');
 const other=s.living.citizens.find(x=>x.name==='Sera');
 c.needs={hunger:90,energy:90,safety:0,comfort:90,social:90,hygiene:90};
 const before=JSON.stringify(other);
 const result=S.whisper(s,'Build homes in Briarford');
 assert.equal(result.ok,true);
 assert.equal(result.entry.decisions.length,1);
 assert.equal(result.entry.decisions[0].name,'Briarford');
 assert.deepEqual(result.entry.people.map(x=>x.name).sort(),['Elin','Rowan']);
 assert.equal(result.entry.people.find(x=>x.name==='Elin').agree,false);
 assert.equal(JSON.stringify(other),before,'untargeted citizen must remain unchanged');
 assert.equal(s.living.towns[1].agenda,'food');
});
test('unsupported, ambiguous, negated, spammed instructions never modify saves',()=>{
 for(const message of ["Don't build homes",'Build homes and farms',
  'Nim and Sera should sleep','Make a spaceship']){
  const s=S.create(77),save=S.serialize(s),res=S.whisper(s,message);
  assert.equal(res.ok,false,message);assert.equal(S.serialize(s),save,message);
 }
 const s=S.create(43);assert.equal(S.whisper(s,'Protect Elin').ok,true);
 const save=S.serialize(s);
 const rejected=S.whisper(s,'Protect Sera');
 assert.equal(rejected.ok,false);assert.equal(S.serialize(s),save);
});
test('accepted whispers remain suggestions; memories bounded and deterministic',()=>{
 function trace(seed){
  const s=S.create(seed);
  for(let i=0;i<12;i++){if(i)for(let j=0;j<12;j++)S.tick(s);
   const result=S.whisper(s,'Protect Briarford');
   assert.equal(result.ok,true);
  }
  const people=[s.bot,...s.npcs,...s.living.citizens];
  assert.ok(people.every(p=>p.divineBelief.history.length<=4));
  const last=s.living.whispers[s.living.whispers.length-1];
  assert.equal(last.people.length,2);
  assert.ok(last.people.every(p=>['declined','considering'].includes(p.state)));
  assert.ok(last.people.every(p=>p.reason&&p.reason.length<=150));
  assert.equal(s.living.whispers.length,12);
  const data=S.serialize(s);assert.ok(data.length<100000);
  assert.ok(S.restore(data));
  return data;
 }
 assert.equal(trace(99),trace(99));
});
test('legacy version-1 saves without belief migrate safely and malicious values clamp',()=>{
 const s=S.create(41),old=JSON.parse(S.serialize(s));
 delete old.bot.divineBelief;
 for(const p of old.npcs)delete p.divineBelief;
 for(const p of old.living.citizens)delete p.divineBelief;
 old.living.citizens[0].divineBelief={
  openness:999999,agency:-22,history:Array(50).fill({tick:1,intent:'rest',state:'considering',reason:'a'})};
 let restored=S.restore(JSON.stringify(old));
 assert.ok(restored);assert.equal(restored.version,1);
 assert.equal(restored.living.citizens[0].divineBelief.openness,100);
 assert.equal(restored.living.citizens[0].divineBelief.agency,0);
 assert.equal(restored.living.citizens[0].divineBelief.history.length,4);
 assert.ok(restored.bot.divineBelief);
 assert.ok(restored.npcs.every(p=>p.divineBelief));
});
