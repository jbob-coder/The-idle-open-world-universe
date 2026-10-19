const test=require('node:test');
const assert=require('node:assert/strict');
const {interpret}=require('../src/divine/intent.js');
const S=require('../src/sim.js');
test('existing Spanish and English categories remain functional',()=>{
 for(const [text,intent] of [
  ['Build farms near the river','food'],['Construyan un taller','craft'],
  ['Por favor proteger la villa contra lobos','defense'],
  ['explore the wilds','explore'],['Renovar los techos de las casas','remodel'],
  ['remodel the rooftops','remodel'],['Build houses','housing'],
  ['Cultiven más comida','food'],['Create cosmic code for android','unknown']])
  assert.equal(interpret(text).intent,intent,text);
});
test('negations never become positive commands',()=>{
 for(const text of ["Don't build houses",'Don’t build houses','no construyan casas','Nunca proteger la aldea',
  'do not farm but build houses','Eviten construir talleres','Build houses without wood']){
  const result=interpret(text);assert.equal(result.status,'negated',text);
  assert.equal(result.intent,'unknown');assert.match(result.reason,/no order issued/i);
 }
});
test('explicit town and named citizen recipients are canonical and case-insensitive',()=>{
 assert.deepEqual(interpret('Cultiven comida en Briarford').target,{kind:'town',id:'briarford',name:'Briarford'});
 assert.deepEqual(interpret('Protect EMBERWICK').target,{kind:'town',id:'emberwick',name:'Emberwick'});
 assert.deepEqual(interpret('Sera: explore the woods').target,{kind:'person',id:'sera',name:'Sera'});
 assert.deepEqual(interpret('Please rest, Nim').target,{kind:'person',id:'nim',name:'Nim'});
 assert.equal(interpret('farm near the river').target,null);
});
test('ambiguous requests cannot silently choose a first match',()=>{
 for(const text of ['Build houses and farms','Protect Briarford and Emberwick',
  'Nim and Elin should rest','Explore and trade']){
  const r=interpret(text);assert.equal(r.intent,'unknown',text);assert.equal(r.status,'ambiguous',text);
 }
});
test('unsupported, oversized and non-string inputs are bounded and safe',()=>{
 for(const x of [undefined,null,{},new Array(50),42,'']){
  const r=interpret(x);assert.equal(r.intent,'unknown');assert.equal(r.text,'');
 }
 const v=interpret('farm '+'z'.repeat(1000000));assert.ok(v.text.length<=220);assert.equal(v.intent,'food');
});
test('directed town guidance affects only its target; no forced movement or instant building',()=>{
 const s=S.create(41),before=s.living.towns.map(t=>t.buildings.length),beforeSteps=s.bot.steps;
 const result=S.whisper(s,'Protect Briarford');
 assert.equal(result.ok,true);assert.deepEqual(result.entry.target,{kind:'town',id:'briarford',name:'Briarford'});
 assert.equal(result.entry.decisions.length,1);
 assert.equal(s.living.towns[1].agenda,'food');assert.equal(s.living.nimWish,undefined);
 assert.deepEqual(s.living.towns.map(t=>t.buildings.length),before);
 assert.equal(s.bot.steps,beforeSteps);
 const restored=S.restore(S.serialize(s));
 assert.deepEqual(restored.living.whispers[0].target,result.entry.target);
});
test('individual messages are suggestions with independent consent, while ambiguity and negation never mutate',()=>{
 for(const text of ['Sera: grow food','Nim, go to sleep']){
  const s=S.create(19),beforeTick=s.tick,before=s.living.towns.map(t=>t.buildings.length),beforeStep=s.bot.steps;
  const result=S.whisper(s,text);
  assert.equal(result.ok,true,text);
  assert.equal(result.entry.people.length,1);
  assert.equal(result.entry.decisions.length,0);
  assert.equal(s.tick,beforeTick);
  assert.equal(s.bot.steps,beforeStep);
  assert.deepEqual(s.living.towns.map(t=>t.buildings.length),before);
 }
 for(const text of ['Build houses and farms','Protect Briarford and Emberwick',"Don't build houses"]){
  const s=S.create(19),before=S.serialize(s),result=S.whisper(s,text);
  assert.equal(result.ok,false,text);
  assert.equal(S.serialize(s),before);
 }
});
