const test=require('node:test'), assert=require('node:assert/strict');
const S=require('../src/sim.js'), Choices=require('../src/choices.js');
const Needs=require('../src/needs.js');

const full=()=>Needs.normalize({hunger:100,energy:100,comfort:100,safety:100,social:100,hygiene:100});

test('individual utilities select distinct meaningful work, exploring, help and rest',()=>{
 const s=S.create(41),[elin,rowan]=s.living.citizens;
 const context={phase:124,working:false,company:true};
 const scout=Choices.decide(elin,context),helper=Choices.decide(rowan,context);
 assert.equal(scout.intent,'explore');
 assert.equal(helper.intent,'help');
 assert.equal(Choices.decide(elin,{phase:50,working:true,company:true}).intent,'work');
 assert.equal(Choices.decide(rowan,{phase:210,working:false,company:true}).intent,'rest');
 for(const choice of [scout,helper]){
  assert.equal(typeof choice.why,'string');
  assert.ok(choice.why.length>12);
  assert.equal(choice.alternatives.length,2);
  assert.ok(choice.alternatives.every(o=>o.intent!==choice.intent&&Number.isInteger(o.score)));
 }
 assert.deepEqual(Choices.decide(elin,context),Choices.decide(elin,context),'no random utility scoring');
});

test('safety, hunger and sleep outrank any tempting personality preference',()=>{
 const s=S.create(41),p=s.living.citizens[0],baseline={phase:24,working:true,company:true};
 for(const [action,reason] of [['seek_safety','A targeted threat'],['eat','Food crisis'],['sleep','Exhaustion']]){
  const choice=Choices.decide(p,{...baseline,priority:{action,reason}});
  assert.equal(choice.intent,action);
  assert.equal(choice.score,999);
  assert.equal(choice.why,reason);
  assert.ok(choice.alternatives.some(o=>o.intent==='work'));
 }
});

test('real simulation produces bounded visible choice, alternative and actual consequence',()=>{
 const s=S.create(41);
 for(let i=0;i<500;i++)S.tick(s);
 for(const c of s.living.citizens){
  assert.ok(c.choice);
  assert.ok(Choices.INTENTS.includes(c.choice.intent));
  assert.equal(c.choice.tick,Math.floor(s.tick/12)*12);
  assert.ok(c.choice.why.length>5);
  assert.equal(c.choice.alternatives.length,2);
  assert.ok(c.choice.consequence.length>5);
  assert.ok(c.choiceHistory.length>=1&&c.choiceHistory.length<=4);
  assert.ok(c.choiceHistory.every(q=>Choices.INTENTS.includes(q.intent)&&q.consequence.length));
 }
 const restored=S.restore(S.serialize(s));
 assert.equal(restored.version,1);
 assert.deepEqual(restored.living.citizens.map(c=>c.choice),s.living.citizens.map(c=>c.choice));
 assert.deepEqual(restored.living.citizens.map(c=>c.choiceHistory),s.living.citizens.map(c=>c.choiceHistory));
});

test('neighbors earn real relationship changes from chosen support; scouts move in the world',()=>{
 const s=S.create(41),[elin,rowan]=s.living.citizens;
 for(const c of [elin,rowan]){c.needs=full();c.x=c.homeX;c.y=c.homeY;}
 const initial=[elin.x,elin.y],trust=rowan.relationships.Elin||25;
 s.tick=143;S.tick(s);
 assert.equal(elin.choice.intent,'explore');
 assert.equal(rowan.choice.intent,'help');
 assert.match(elin.choice.consequence,/Walked to survey|Observing/);
 assert.ok(elin.x!==initial[0]||elin.y!==initial[1]||elin.activity==='Surveying nearby paths');
 assert.match(rowan.choice.consequence,/Supported Elin/);
 assert.ok(rowan.relationships.Elin>trust);
 assert.ok(elin.relationships.Rowan>=27);
});

test('v1 migration ignores forged or oversized decision histories while preserving world progress',()=>{
 const s=S.create(99);
 for(let i=0;i<240;i++)S.tick(s);
 const legacy=JSON.parse(S.serialize(s));
 legacy.living.citizens[0].choice=null;delete legacy.living.citizens[0].choiceHistory;
 legacy.living.citizens[1].choice={
  intent:'explore',why:'X'.repeat(900),consequence:'Y'.repeat(900),
  score:Infinity,alternatives:Array.from({length:40},()=>({intent:'help',score:Infinity})),tick:-100
 };
 legacy.living.citizens[1].choiceHistory=Array.from({length:30},(_,i)=>({
  tick:i,intent:'work',score:20,why:'Routine',consequence:'Worked',alternatives:[]
 }));
 legacy.living.citizens[2].choice={intent:'untrusted-code',consequence:'danger'};
 const loaded=S.restore(legacy);
 assert.ok(loaded);assert.equal(loaded.version,1);
 assert.equal(loaded.living.citizens[0].choice,null);
 assert.deepEqual(loaded.living.citizens[0].choiceHistory,[]);
 assert.equal(loaded.living.citizens[1].choice.why.length,120);
 assert.equal(loaded.living.citizens[1].choice.consequence.length,140);
 assert.equal(loaded.living.citizens[1].choice.alternatives.length,2);
 assert.equal(loaded.living.citizens[1].choice.score,0);
 assert.equal(loaded.living.citizens[1].choiceHistory.length,4);
 assert.equal(loaded.living.citizens[2].choice,null);
 assert.equal(loaded.bot.level,legacy.bot.level);
 assert.equal(loaded.chapter.stage,legacy.chapter.stage);
});

test('four seeded villages remain self-supporting with utility choices and finite save size',()=>{
 for(const seed of [1,41,99,2026]){
  const s=S.create(seed);
  for(let i=0;i<2500;i++)S.tick(s);
  assert.ok(s.living.towns.reduce((n,t)=>n+t.buildings.length,0)>=16,'seed '+seed+' builds neighborhoods');
  assert.ok(s.living.towns.every(t=>t.technology.level===3),'seed '+seed+' reaches trade age');
  assert.ok(s.living.citizens.every(c=>c.choice&&c.choiceHistory.length<=4));
  assert.ok(S.validate(s));
  assert.ok(S.serialize(s).length<100000,'bounded persistent decision traces');
 }
});
