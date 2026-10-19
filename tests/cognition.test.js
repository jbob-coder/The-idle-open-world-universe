'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../src/sim.js');
const C=require('../src/cognition.js');
const Choice=require('../src/choices.js');
const STEPS=Object.freeze([1,2,3,4,5,7,11,19,31,41,77,99,123,2026,31415,65535]);
function citizen(seed){const s=S.create(seed);return {s,p:s.living.citizens[0]};}
function identicalPerson(a,b){return a.cognition&&b.cognition&&
 JSON.stringify(a.cognition)===JSON.stringify(b.cognition);}

test('SIM-011 four seeded citizens have distinct immutable-dimension cognition separate from needs and occupation',()=>{
 const {s}=citizen(41),profiles=s.living.citizens.map(p=>p.cognition);
 assert.equal(profiles.length,4);
 assert.equal(new Set(profiles.map(c=>c.stats.intelligence)).size>=2,true);
 assert.ok(profiles.every(c=>c.version===1&&C.STATS.every(k=>
  Number.isInteger(c.stats[k])&&c.stats[k]>=0&&c.stats[k]<=100)));
 assert.ok(profiles.every(c=>C.DOMAINS.every(k=>Number.isInteger(c.knowledge[k])&&
  Number.isInteger(c.practice[k]))));
 assert.ok(profiles.every(c=>C.STYLES.includes(c.learningStyle)));
 assert.ok(s.living.citizens.every(p=>p.skill===1&&p.needs.hunger>0));
 assert.deepEqual(S.create(41).living.citizens.map(p=>p.cognition),profiles);
});

test('higher intelligence gives longer reasoning horizon and faster knowledge but never raw free resources',()=>{
 const {s,p}=citizen(9),a=JSON.parse(JSON.stringify(p)),b=JSON.parse(JSON.stringify(p));
 a.cognition.stats.intelligence=8;a.cognition.stats.focus=8;
 b.cognition.stats.intelligence=98;b.cognition.stats.focus=98;
 assert.ok(C.horizon(b)>C.horizon(a));
 const original=JSON.stringify(s.living.towns.map(t=>t.stock));
 const low=C.observe(a,{action:'work',result:'produced',tick:12});
 const high=C.observe(b,{action:'work',result:'produced',tick:12});
 assert.ok(high.learned>low.learned);
 assert.equal(a.cognition.practice.craft,1);
 assert.equal(b.cognition.practice.craft,1);
 assert.equal(a.skill,p.skill);
 assert.equal(b.skill,p.skill);
 assert.equal(JSON.stringify(s.living.towns.map(t=>t.stock)),original);
 assert.equal(C.observe(a,{action:'work',result:'traveling',tick:24}),null);
 assert.equal(a.cognition.practice.craft,1,'uncompleted work must never mint learning');
});

test('creative versus empathetic cognitive attributes alter actual utility priority without forced actions',()=>{
 const {p}=citizen(15),actor=JSON.parse(JSON.stringify(p));
 actor.independence=.5;actor.kindness=.5;
 const c={phase:130,working:false,company:true};
 actor.cognition.stats.creativity=100;actor.cognition.stats.empathy=0;
 const creative=Choice.decide(actor,c);
 actor.cognition.stats.creativity=0;actor.cognition.stats.empathy=100;
 const empathetic=Choice.decide(actor,c);
 assert.equal(creative.intent,'explore');
 assert.equal(empathetic.intent,'help');
 assert.ok(creative.thinking.horizon>=1&&creative.thinking.horizon<=4);
 assert.equal(creative.thinking.goal,creative.intent);
 assert.ok(creative.thinking.considered.length>=2);
 assert.equal(creative.thinking.considered.some(x=>x.intent===creative.intent),false);
 assert.ok(empathetic.alternatives.every(x=>x.intent!==empathetic.intent));
});

test('critical safety, hunger and exhaustion always outrank high intelligence or strong habits',()=>{
 const {p}=citizen(19);
 for(const [action,reason] of [['seek_safety','Threat'],['eat','No food'],['sleep','Exhaustion']]){
  p.cognition.stats.intelligence=100;p.cognition.stats.creativity=100;
  const choice=Choice.decide(p,{phase:30,working:true,company:true,priority:{action,reason}});
  assert.equal(choice.intent,action);
  assert.equal(choice.why,reason);
  assert.equal(choice.score,999);
  assert.equal(choice.thinking.confidence,100);
 }
});

test('real actions produce bounded evidence-based learning; travel and intentions do not',()=>{
 const {s,p}=citizen(41);
 const init=JSON.parse(JSON.stringify(p.cognition.knowledge));
 for(let i=0;i<960;i++)S.tick(s);
 const improved=C.DOMAINS.filter(k=>p.cognition.knowledge[k]>init[k]);
 assert.ok(improved.length>=1,'resident must actually learn during sustained gameplay');
 assert.ok(p.cognition.history.length>0&&p.cognition.history.length<=C.MAX_HISTORY);
 assert.ok(p.cognition.history.every(e=>e.learned>=1&&e.learned<=5&&e.tick<=s.tick));
 assert.ok(p.cognition.lastPlan);
 assert.ok(['work','explore','help','rest','eat','sleep','wash','warm','socialize','seek_safety']
  .includes(p.cognition.lastPlan.goal));
 assert.ok(p.choice.thinking&&p.choice.thinking.considered.length<=3);
 assert.equal(p.cognition.history.some(e=>e.result==='traveling'),false);
 assert.ok(S.validate(s));
});

test('v1 saves created before SIM-011 receive stable profiles without wiping player/world/story',()=>{
 const s=S.create(99);
 for(let i=0;i<244;i++)S.tick(s);
 const old=JSON.parse(S.serialize(s));
 for(const p of old.living.citizens)delete p.cognition;
 const original={seed:old.worldSeed,tick:old.tick,faith:old.faith,
  level:old.bot.level,chapter:old.chapter.stage,
  townStock:old.living.towns.map(t=>({...t.stock})),map:old.map};
 const restored=S.restore(JSON.stringify(old));
 assert.ok(restored&&restored.version===1);
 assert.deepEqual({seed:restored.worldSeed,tick:restored.tick,faith:restored.faith,
  level:restored.bot.level,chapter:restored.chapter.stage,
  townStock:restored.living.towns.map(t=>({...t.stock})),map:restored.map},original);
 assert.deepEqual(restored.living.citizens.map(p=>p.cognition),
  S.create(99).living.citizens.map(p=>p.cognition));
});

test('malformed optional cognition and oversized forged records sanitize without progress loss',()=>{
 const {s}=citizen(2026),save=JSON.parse(S.serialize(s));
 const bad=save.living.citizens[0];
 bad.cognition={version:1,stats:{intelligence:10000000,focus:-400,creativity:'oops',
   empathy:Infinity,patience:NaN},learningStyle:'execute_code',
  knowledge:{craft:-1,land:10000000,community:'bad',survival:null},
  practice:{craft:999999,land:-1,community:Infinity,survival:0},
  goal:'unknown_action',lastPlan:{goal:'execute',horizon:Infinity},
  history:Array.from({length:99},(_,i)=>({tick:i,action:'work',domain:'craft',
   result:'produced',learned:900}))};
 const loaded=S.restore(JSON.stringify(save));
 assert.ok(loaded&&loaded.version===1);
 const clean=loaded.living.citizens[0].cognition;
 assert.equal(clean.stats.intelligence,100);
 assert.equal(clean.stats.focus,0);
 assert.equal(clean.learningStyle.includes('execute'),false);
 assert.equal(clean.knowledge.craft,0);
 assert.equal(clean.knowledge.land,100);
 assert.equal(clean.practice.craft,100);
 assert.equal(clean.practice.land,0);
 assert.equal(clean.history.length,4);
 assert.equal(clean.history.every(e=>e.learned===8),true);
 assert.equal(clean.lastPlan,null);
 assert.equal(clean.goal,'');
 assert.equal(loaded.worldSeed,s.worldSeed);
 assert.deepEqual(loaded.living.towns.map(t=>t.stock),s.living.towns.map(t=>t.stock));
});

test('16 independent seed trajectories have distinct cognitive plans and deterministic full migration',()=>{
 const signatures=new Set(),intelligence=new Set(),styles=new Set();
 for(const seed of STEPS){
  const s=S.create(seed),duplicate=S.create(seed);
  for(let i=0;i<600;i++){S.tick(s);S.tick(duplicate);}
  assert.equal(S.validate(s),true,'seed '+seed);
  assert.equal(S.serialize(s),S.serialize(duplicate),'deterministic world seed '+seed);
  const restored=S.restore(S.serialize(s));
  assert.ok(restored,'restore seed '+seed);
  assert.ok(restored.living.citizens.every((p,i)=>
   identicalPerson(p,s.living.citizens[i])),'cognition migration seed '+seed);
  assert.ok(restored.living.citizens.every(p=>p.cognition.history.length<=4));
  assert.ok(S.serialize(s).length<100000,'bounded serialization seed '+seed);
  for(const p of s.living.citizens){
   intelligence.add(p.cognition.stats.intelligence);
   styles.add(p.cognition.learningStyle);
  }
  signatures.add(s.living.citizens.map(p=>[p.cognition.stats.intelligence,
   p.cognition.learningStyle,p.choice&&p.choice.intent,p.cognition.knowledge.land].join(':')).join('|'));
 }
 assert.ok(signatures.size>=12,'individual worlds cannot collapse into one scripted state');
 assert.ok(intelligence.size>=16);
 assert.equal(styles.size,3);
});

test('long run maintains bounded decision and cognition traces without leaking memory per tick',()=>{
 const s=S.create(3033);
 for(let i=0;i<2400;i++)S.tick(s);
 assert.ok(S.validate(s));
 for(const p of s.living.citizens){
  assert.ok(p.cognition.history.length<=4);
  assert.ok(p.choiceHistory.length<=4);
  assert.ok(p.cognition.lastPlan&&p.cognition.lastPlan.considered.length<=3);
  assert.ok(C.DOMAINS.every(k=>p.cognition.knowledge[k]>=0&&p.cognition.knowledge[k]<=100));
 }
 assert.ok(S.serialize(s).length<100000);
});
