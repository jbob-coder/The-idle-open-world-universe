const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/sim.js');
const Needs = require('../src/needs.js');

test('all four working residents have persistent, bounded, individually owned needs', () => {
 const s = S.create(41);
 const citizens = s.living.citizens;
 assert.equal(citizens.length,4);
 for(const c of citizens) assert.deepEqual(c.needs,Needs.normalize());
 assert.notEqual(citizens[0].needs,citizens[1].needs);
 for(let i=0;i<100;i++) S.tick(s);
 assert.ok(citizens[0].needs.hunger < Needs.DEFAULTS.hunger);
 assert.deepEqual(S.restore(S.serialize(s)).living.citizens[0].needs,citizens[0].needs);
});

test('hungry resident eats from actual town food stock; unavailable food never restores hunger', () => {
 const s=S.create(41),p=s.living.citizens[0],t=s.living.towns.find(x=>x.id===p.townId);
 p.needs=Needs.normalize({hunger:0,energy:100,comfort:100,safety:100,social:100,hygiene:100});
 p.x=t.x;p.y=t.y;t.stock.food=9;
 for(let i=0;i<12;i++)S.tick(s);
 assert.equal(t.stock.food,8,'eating must debit one real food ration');
 assert.ok(p.needs.hunger>=40,'hunger must recover after real eating');
 p.needs.hunger=0;t.stock.food=0;
 for(let i=0;i<12;i++)S.tick(s);
 assert.equal(p.needs.hunger,0,'a pantry with zero stock cannot feed a resident');
});

test('safety overrides a tempting work schedule and correct shelter improves safety', () => {
 const s=S.create(41),p=s.living.citizens[0];
 p.needs=Needs.normalize({hunger:90,energy:90,comfort:90,safety:0,social:90,hygiene:90});
 p.x=p.homeX;p.y=p.homeY;
 for(let i=0;i<12;i++)S.tick(s);
 assert.ok(p.needs.safety>30);
 assert.match(p.activity,/shelter|safety|safe/i);
});

test('v1 saves without needs migrate without resetting original progress or adding fields to the schema', () => {
 const s=S.create(2026);
 for(let i=0;i<400;i++)S.tick(s);
 const legacy=JSON.parse(S.serialize(s));
 legacy.living.citizens.forEach(c=>delete c.needs);
 legacy.living.citizens[1].needs={hunger:-99,energy:'untrusted',safety:Infinity};
 const restored=S.restore(JSON.stringify(legacy));
 assert.ok(restored);
 assert.equal(restored.version,1);
 assert.deepEqual(restored.living.citizens[0].needs,Needs.normalize());
 assert.equal(restored.living.citizens[1].needs.hunger,0);
 assert.equal(restored.living.citizens[1].needs.energy,Needs.DEFAULTS.energy);
 assert.equal(restored.bot.level,legacy.bot.level);
 assert.equal(restored.chapter.stage,legacy.chapter.stage);
 assert.equal(restored.chapterTwo.stage,legacy.chapterTwo.stage);
 assert.equal(restored.finale.stage,legacy.finale.stage);
});
