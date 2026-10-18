const test=require('node:test'),assert=require('node:assert/strict'),S=require('../src/sim'),R=require('../src/render/actors');
test('movement records cardinal orientation and simulation-derived animation',()=>{
 const s=S.create(5);for(let i=0;i<100;i++)S.tick(s);
 assert.ok(['north','south','east','west'].includes(s.bot.facing));assert.ok(s.bot.movedAt>0);
 for(const p of s.npcs)assert.ok(['north','south','east','west'].includes(p.facing));
 const raw=S.serialize(s);const f=R.frame(s.bot,s.tick);assert.equal(f.phase,R.frame(s.bot,s.tick).phase);assert.equal(S.serialize(s),raw);
 assert.equal(R.frame(s.bot,s.bot.movedAt+20).phase,0);
});
test('actor foot order is stable and independent of the input array',()=>{
 const a=[{x:4,y:3,id:1},{x:1,y:1,id:2},{x:2,y:3,id:3}],copy=a.slice();assert.deepEqual(R.sorted(a).map(x=>x.id),[2,3,1]);assert.deepEqual(a,copy);
});
