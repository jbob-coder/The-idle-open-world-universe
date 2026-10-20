/* GOD-004 acceptance: observable life, settlements and building footprints are read-only. */
const test=require('node:test');
const assert=require('node:assert/strict');
const S=require('../src/sim.js');
const O=require('../src/divine/observer.js');
test('catalog lists real citizens, travelers, settlements and footprint-safe buildings',()=>{
 const s=S.create(41),all=O.entries(s);
 assert.equal(all[0].key,'overview');
 assert.ok(all.some(x=>x.key==='person:nim'));
 assert.ok(all.some(x=>x.key==='person:citizen:20'));
 assert.ok(all.some(x=>x.key==='person:traveler:1'));
 assert.ok(all.some(x=>x.key==='town:briarford'));
 const first=s.living.towns[0].buildings[0];
 assert.ok(all.some(x=>x.key==='building:'+first.id));
 const detail=O.inspect(s,'building:'+first.id);
 assert.equal(detail.kind,'building');
 assert.ok(detail.rows.some(r=>r.label==='Gross area'&&r.value==='16 m² (outdoor 2 m tiles)'));
 assert.ok(detail.rows.some(r=>r.label==='Interior'&&r.value==='Not yet implemented'));
});
test('life shows jobs, skills, memory and agency without writing into the game state',()=>{
 const s=S.create(17);
 for(let i=0;i<500;i++)S.tick(s);
 const before=S.serialize(s),first=s.living.citizens[0];
 const record=O.inspect(s,'person:citizen:'+first.id);
 assert.equal(record.title,first.name);
 assert.ok(record.rows.some(x=>x.label==='Profession skill'));
 assert.ok(record.rows.some(x=>x.label==='Relationships'));
 assert.ok(O.inspect(s,'person:nim').rows.some(x=>x.label==='Intention'));
 assert.equal(O.inspect(s,'person:traveler:1').subtitle,'Traveler');
 for(const item of O.entries(s))assert.ok(O.inspect(s,item.key));
 assert.equal(S.serialize(s),before,'observation must not advance clock, spend resources or alter save');
});
test('tile picking honors discovery, people and all footprint cells',()=>{
 const s=S.create(9),t=s.living.towns[0],b=t.buildings[0];
 assert.equal(O.tileKey(s,-1,0),null);
 assert.equal(O.tileKey(s,999,999),null);
 assert.equal(O.tileKey(s,0,0),s.seen[0]?'overview':null); // empty visible tile has no target
 const far=47*64+63;s.seen[far]=0;
 assert.equal(O.tileKey(s,63,47),null,'unrevealed wilderness must not leak');
 assert.equal(O.tileKey(s,b.x+1,b.y+1),'building:'+b.id);
 const c=s.living.citizens[0];c.x=b.x+1;c.y=b.y+1;
 assert.equal(O.tileKey(s,c.x,c.y),'person:citizen:'+c.id,'person takes precedence');
});
test('observer resists malformed lookups and keeps bounded logs and save schema',()=>{
 const s=S.create(25);
 for(let i=0;i<5000;i++)S.tick(s);
 const before=S.serialize(s),town=s.living.towns[0];
 assert.equal(O.inspect(s,'person:citizen:9999'),null);
 assert.equal(O.inspect(s,'building:does-not-exist'),null);
 assert.equal(O.tileKey(s,NaN,1),null);
 assert.equal(O.inspect(s,null),null);
 const overview=O.inspect(s,'overview'),detail=O.inspect(s,'town:'+town.id);
 assert.ok(overview.memories.length<=6);
 assert.ok(overview.intentions.length<=3);
 assert.ok(detail.rows.length<=12);
 assert.equal(O.entries(s).length<=80,true);
 assert.equal(S.serialize(s),before);
 const loaded=S.restore(before);
 assert.equal(loaded.version,1);
 assert.equal(O.inspect(loaded,'town:'+town.id).kind,'town');
});
