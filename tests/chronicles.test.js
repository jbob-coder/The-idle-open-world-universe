'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../src/sim.js'),C=require('../src/chronicles.js');
const Choices=require('../src/choices.js');

const SEEDS=[1,2,3,4,5,7,11,19,31,41,77,99,123,2026,31415,65535];
function newWorld(seed=41){return S.create(seed);}
const choose=(intent='work')=>({intent,why:'Deliberate personal choice',
  alternatives:[{intent:'rest',score:35}],consequence:'Trying to help the town'});
function capture(s,p,partner){
 const town=s.living.towns.find(t=>t.id===p.townId);
 return C.snapshot(p,town,partner||s.living.citizens.find(q=>q!==p&&q.townId===p.townId));
}

test('SIM-007 each actual villager has independent seeded long goal and ethical identity',()=>{
 const s=newWorld(41),people=s.living.citizens;
 assert.equal(people.length,4);
 assert.deepEqual(people.map(p=>p.journal.goal),
  ['master_craft','map_surroundings','master_craft','help_neighbors']);
 assert.ok(people.every(p=>p.journal.version===1&&p.journal.entries.length===0));
 assert.ok(people.every(p=>p.journal.goalTarget===5&&p.journal.progress===0));
 assert.deepEqual(S.create(41).living.citizens.map(p=>p.journal),
  people.map(p=>p.journal));
 const p=people[0],q=people[1];
 const ev=C.record(p,choose('work'),capture(s,p),capture(s,p),12);
 assert.equal(ev.observed,false);
 assert.deepEqual(q.journal.entries,[]);
 assert.equal(p.journal.progress,0);
});

test('ethical values and long goals influence utility scores without overriding emergencies',()=>{
 const s=newWorld(41),[elin,rowan]=s.living.citizens;
 const options=[{intent:'work',score:50},{intent:'help',score:50},
   {intent:'explore',score:50},{intent:'rest',score:50}];
 const a=C.bias(elin,options),b=C.bias(rowan,options);
 assert.ok(a.find(x=>x.intent==='work').score>a.find(x=>x.intent==='help').score);
 assert.ok(b.find(x=>x.intent==='explore').score>b.find(x=>x.intent==='work').score);
 assert.deepEqual(options.map(x=>x.score),[50,50,50,50],
  'evaluating journal must not mutate base options');
 const urgent=Choices.decide(elin,{phase:10,working:true,company:true,
   priority:{action:'seek_safety',reason:'Immediate danger'}});
 assert.equal(urgent.intent,'seek_safety');
 assert.equal(urgent.why,'Immediate danger');
 assert.equal(urgent.score,999);
});

test('worksite travel and attempted action earn no invented progress or resource output',()=>{
 const s=newWorld(7),p=s.living.citizens[0],before=capture(s,p);
 const result=C.record(p,choose('work'),before,before,48);
 assert.equal(result.observed,false);
 assert.equal(C.describeImpact(result.impact),'No verified change');
 assert.equal(p.journal.progress,0);
 assert.equal(p.journal.entries.length,1);
 assert.match(result.consequence,/Trying/);
 assert.equal(result.impact.wood,0);
 assert.equal(result.impact.skill,0);
 assert.equal(s.living.towns[0].stock.wood>=0,true);
});

test('real production advances only relevant long goal and yields factual stock impact',()=>{
 const s=newWorld(9),p=s.living.citizens[0],old=capture(s,p);
 const changed={...old,wood:old.wood+3,skill:old.skill+1};
 const e=C.record(p,choose('work'),old,changed,12);
 assert.equal(e.impact.wood,3);
 assert.equal(e.impact.skill,1);
 assert.equal(e.observed,true);
 assert.equal(p.journal.progress,1);
 for(let i=0;i<10;i++)C.record(p,choose('work'),old,changed,24+i*12);
 assert.equal(p.journal.progress,5);
 assert.equal(p.journal.entries.length,12);
 assert.equal(s.living.towns[0].stock.wood,old.wood,
  'journal records observation, it does not create materials');
});

test('a real relationship change counts as help; exploration needs actual displacement',()=>{
 const s=newWorld(41),rowan=s.living.citizens[1],bram=s.living.citizens[3];
 let start=capture(s,rowan);
 assert.equal(rowan.journal.goal,'map_surroundings');
 C.record(rowan,choose('explore'),start,start,12);
 assert.equal(rowan.journal.progress,0);
 const moved=C.record(rowan,choose('explore'),start,{...start,x:start.x+1},24);
 assert.equal(moved.impact.movement,1);
 assert.equal(rowan.journal.progress,1);
 assert.equal(bram.journal.goal,'help_neighbors');
 start=capture(s,bram);
 const supported=C.record(bram,choose('help'),start,{...start,relationship:start.relationship+2},48);
 assert.equal(supported.impact.relationship,2);
 assert.equal(supported.moral,'care');
 assert.equal(bram.journal.progress,1);
 C.record(bram,choose('help'),start,start,60);
 assert.equal(bram.journal.progress,1);
});

test('resident personal memories reflect verified real life consequences in autonomous play',()=>{
 const s=newWorld(41);
 for(let i=0;i<1600;i++)S.tick(s);
 const people=s.living.citizens;
 assert.ok(people.every(p=>p.journal.entries.length>=1&&p.journal.entries.length<=12));
 for(const p of people){
  assert.ok(p.journal.entries.every(e=>e.tick<=s.tick&&
   ['duty','care','curiosity','wellbeing'].includes(e.moral)&&
   typeof e.reason==='string'&&typeof e.consequence==='string'));
  for(const e of p.journal.entries){
   assert.equal(e.observed,C.IMPACT_KEYS.some(k=>e.impact[k]!==0));
   assert.ok(e.alternative===null||C.INTENTS.includes(e.alternative));
  }
  assert.ok(p.journal.progress>=0&&p.journal.progress<=5);
 }
 assert.ok(people.some(p=>p.journal.entries.some(e=>e.observed)),
  'actual actions must create at least one factual consequence');
});

test('pre-journal version-1 save restores personal histories without wiping Nim or towns',()=>{
 const s=newWorld(99);
 for(let i=0;i<360;i++)S.tick(s);
 const legacy=JSON.parse(S.serialize(s));
 const snapshot={worldSeed:legacy.worldSeed,tick:legacy.tick,faith:legacy.faith,
  hp:legacy.bot.hp,level:legacy.bot.level,map:legacy.map,
  towns:legacy.living.towns.map(t=>({...t.stock})),chapter:legacy.chapter.stage};
 for(const p of legacy.living.citizens)delete p.journal;
 const restored=S.restore(JSON.stringify(legacy));
 assert.ok(restored&&restored.version===1);
 assert.deepEqual({worldSeed:restored.worldSeed,tick:restored.tick,faith:restored.faith,
  hp:restored.bot.hp,level:restored.bot.level,map:restored.map,
  towns:restored.living.towns.map(t=>({...t.stock})),chapter:restored.chapter.stage},snapshot);
 assert.ok(restored.living.citizens.every(p=>p.journal.version===1&&p.journal.entries.length===0));
 assert.equal(restored.living.citizens[0].journal.goal,'master_craft');
});

test('malformed/oversized optional memories sanitize, never fabricate a positive impact',()=>{
 const s=newWorld(2026),save=JSON.parse(S.serialize(s)),p=save.living.citizens[0];
 p.journal={version:1,goal:'master_craft',progress:999999,
   goalTarget:999,ethics:{care:999999,duty:-300,curiosity:'code'},
   entries:Array.from({length:85},(_,i)=>({tick:i,choice:'work',
    reason:'Z'.repeat(700),alternative:'execute_code',
    consequence:'C'.repeat(700),moral:'duty',
    observed:true,impact:{wood:9999999,skill:Infinity}}))};
 p.journal.entries[84].choice='execute_code';
 const loaded=S.restore(JSON.stringify(save));
 assert.ok(loaded);
 const j=loaded.living.citizens[0].journal;
 assert.equal(j.goal,'master_craft');
 assert.equal(j.progress,5);
 assert.equal(j.goalTarget,5);
 assert.deepEqual(j.ethics,C.newJournal(loaded.living.citizens[0]).ethics);
 assert.ok(j.entries.length<=11&&j.entries.length>=1);
 assert.ok(j.entries.every(e=>e.reason.length<=120&&e.consequence.length<=140));
 assert.ok(j.entries.every(e=>e.impact.wood===999));
 assert.ok(j.entries.every(e=>e.alternative===null));
 assert.ok(j.entries.every(e=>e.observed===true));
 assert.equal(loaded.worldSeed,s.worldSeed);
 p.journal={version:99,entries:'malicious'};
 const invalid=S.restore(JSON.stringify(save));
 assert.ok(invalid&&invalid.living.citizens[0].journal.entries.length===0);
});

test('16 world seeds are deterministic; saved personal journals persist after reload',()=>{
 const signatures=new Set();
 for(const seed of SEEDS){
  const a=newWorld(seed),b=newWorld(seed);
  for(let i=0;i<720;i++){S.tick(a);S.tick(b);}
  const encoded=S.serialize(a);
  assert.equal(encoded,S.serialize(b),'seed '+seed);
  assert.ok(encoded.length<100000,'bounded v1 save '+seed);
  const restored=S.restore(encoded);
  assert.ok(restored&&restored.version===1);
  assert.deepEqual(restored.living.citizens.map(p=>p.journal),
    a.living.citizens.map(p=>p.journal),'journal roundtrip seed '+seed);
  assert.ok(S.validate(restored));
  signatures.add(a.living.citizens.map(p=>
    p.journal.entries.map(e=>[e.tick,e.choice,e.impact.movement,e.impact.wood].join(':')).join('|')).join(';'));
 }
 assert.ok(signatures.size>=3,'different seeds should create different verified life histories');
});

test('long autonomous simulation bounds memory, and God whisper does not direct journal outcomes',()=>{
 const s=newWorld(41);
 for(let i=0;i<2500;i++)S.tick(s);
 const before=s.living.citizens.map(p=>JSON.stringify(p.journal));
 const oldTick=s.tick,oldBot=[s.bot.x,s.bot.y];
 const r=S.whisper(s,'Please grow more food');
 assert.ok(r.ok);
 assert.equal(s.tick,oldTick,'God whisper must not advance time');
 assert.deepEqual([s.bot.x,s.bot.y],oldBot);
 assert.deepEqual(s.living.citizens.map(p=>JSON.stringify(p.journal)),before,
  'human instruction may not forge personal success journal entries');
 assert.ok(s.living.citizens.every(p=>p.journal.entries.length<=12));
 assert.ok(S.serialize(s).length<100000);
});
