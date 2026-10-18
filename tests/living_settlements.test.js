const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../src/sim.js'),L=require('../src/living.js');

test('two physical settlements spawn with house and farm blueprints, without deleting landmarks',()=>{
 const s=S.create(41);
 assert.equal(s.living.towns.length,2);
 assert.equal(s.living.citizens.length,4);
 assert.deepEqual(s.living.towns.map(t=>t.name),['Briarford','Emberwick']);
 const all=s.living.towns.flatMap(t=>t.buildings);
 assert.ok(all.length>=4,'hamlets must show buildings from the start');
 for(const b of all){
  assert.ok(b.x>1&&b.x<63&&b.y>1&&b.y<47);
  assert.ok([S.T.GRASS,S.T.MEADOW].includes(s.map[S.idx(b.x,b.y)]),'do not build on water, roads, shrines or ruins');
  assert.ok(['house','farm','market','well','watchtower','workshop'].includes(b.type));
 }
 assert.equal(s.map[S.idx(50,39)],S.T.RUIN,'Moonwell final landmark intact');
 assert.equal(s.map[S.idx(20,31)],S.T.SHRINE,'shrine intact');
 assert.ok(S.validate(s));
});

test('residents perform professions, form relationships and their towns build and age up',()=>{
 const s=S.create(41);
 for(let i=0;i<2500;i++)S.tick(s);
 for(const t of s.living.towns){
  assert.ok(t.buildings.length>=6,t.name+' did not grow real structures');
  assert.ok(['Village','Township'].includes(t.age),t.name+' failed to develop');
  assert.ok(t.buildings.some(b=>b.type==='workshop'),'shared craft building is meaningful');
 }
 assert.ok(s.living.citizens.every(c=>c.actions>=20&&c.skill>1&&c.skillXP>=0));
 assert.ok(s.living.citizens.some(c=>Object.keys(c.relationships).length>0),'relationships change');
 assert.ok(s.living.chronicle.some(e=>e.title.includes('built')),'new construction is recorded in life chronicle');
 assert.equal(S.finaleStatus(s).completed,true,'existing full story still finishes');
 const raw=S.serialize(s),loaded=S.restore(raw);
 assert.ok(loaded);assert.deepEqual(loaded.living.towns.map(t=>t.buildings.length),s.living.towns.map(t=>t.buildings.length));
 assert.equal(loaded.living.citizens[0].skill,s.living.citizens[0].skill);
 assert.ok(raw.length<100000,'bounded world save');
});

test('God messages interpret English and Spanish while unknown text is refused honestly',()=>{
 assert.equal(L.interpret('Build farms near the river').intent,'food');
 assert.equal(L.interpret('Construyan un taller').intent,'craft');
 assert.equal(L.interpret('Por favor proteger la villa contra lobos').intent,'defense');
 assert.equal(L.interpret('explore the wilds').intent,'explore');
 assert.equal(L.interpret('Renovar los techos de las casas').intent,'housing');
 assert.equal(L.interpret('remodel the rooftops').intent,'remodel');
 assert.equal(L.interpret('Create cosmic code for android').intent,'unknown');
 const s=S.create(17),before=S.serialize(s);
 assert.equal(S.whisper(s,'undecipherable cosmic protocol').ok,false);
 assert.equal(S.serialize(s),before,'unrecognized message cannot pretend an instruction was obeyed');
 assert.equal(S.whisper(s,"Don't build any houses").ok,false,'negated instructions cannot be interpreted as positive construction');
 const result=S.whisper(s,'Cultiven más comida');
 assert.equal(result.ok,true);assert.equal(result.entry.intent,'food');
 assert.equal(result.entry.decisions.length,2);
 assert.equal(S.whisper(s,'Build houses').ok,false,'cooldown bounds message spam');
 assert.ok(S.restore(S.serialize(s)).living.whispers.length===1);
});
test('messages influence preferences, not instant infrastructure, and citizens can disagree',()=>{
 const s=S.create(41),count=s.living.towns.map(t=>t.buildings.length),beforeSteps=s.bot.steps;
 const a=S.whisper(s,'Protejan el pueblo contra lobos');
 assert.ok(a.ok);
 assert.deepEqual(s.living.towns.map(t=>t.buildings.length),count,'god does not instantly construct buildings');
 assert.equal(s.bot.steps,beforeSteps,'god cannot teleport Nim');
 for(let i=0;i<240;i++)S.tick(s);
 assert.ok(s.living.towns.some(t=>t.agenda==='defense'));
 assert.ok(s.living.towns.every(t=>t.buildings.length<=12),'bounded construction');
});
test('travelers follow daily routines instead of random motion',()=>{
 const s=S.create(77);const p=s.npcs.find(x=>x.name==='Ira');let positions=new Set(),activities=new Set();
 for(let i=0;i<480;i++){S.tick(s);positions.add(p.x+','+p.y);activities.add(p.activity);}
 assert.ok(positions.size>2,'traveler must visit places');
 assert.ok(activities.has('Sleeping at home'),'daily rest phase');
 assert.ok(activities.has('Preparing remedies'),'work phase');
 assert.ok(activities.has('Discussing the day'),'social phase');
});
test('ten thousand ticks preserve bounded world population, original quests and version 1 saves',()=>{
 const s=S.create(2026);
 for(let i=0;i<10000;i++)S.tick(s);
 assert.equal(S.chapterStatus(s).completed,true);
 assert.equal(S.roadStatus(s).completed,true);
 assert.equal(S.finaleStatus(s).completed,true);
 assert.equal(s.living.citizens.length,4);
 assert.ok(s.living.towns.every(t=>t.buildings.length<=12));
 assert.ok(s.living.whispers.length<=12&&s.living.chronicle.length<=16);
 assert.equal(S.validate(s),true);
 const raw=S.serialize(s);
 assert.ok(raw.length<100000);
 assert.equal(S.restore(raw).version,1);
});
