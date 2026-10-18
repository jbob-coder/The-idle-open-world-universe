const test=require('node:test'),assert=require('node:assert/strict'),S=require('../src/sim'),FX=require('../src/render/fx');
test('target preview is pure and agrees with authoritative charge',()=>{
 const s=S.create(8),p=s.npcs[0];s.seen[S.idx(p.x,p.y)]=1;
 for(const kind of Object.keys(S.COST)){s.faith=50;const before=S.serialize(s);const preview=S.previewPower(s,kind,p.x,p.y);assert.equal(S.serialize(s),before);const result=S.power(s,kind,p.x,p.y);assert.equal(result.ok,preview.ok);if(result.ok)assert.equal(s.faith,50-S.COST[kind]);}
});
test('revealed adjacent ground does not expose a hidden traveler',()=>{
 const s=S.create(5),p=s.npcs[0];s.seen.fill(0);s.seen[S.idx(p.x+1,p.y)]=1;const before=S.serialize(s);assert.equal(S.power(s,'inspire',p.x+1,p.y).ok,false);assert.equal(S.serialize(s),before);
});
test('effects deduplicate, expire while paused and stay bounded without state mutation',()=>{
 const s=S.create(5);S.power(s,'gift',32,24);const q=FX.create(),raw=S.serialize(s);
 for(let i=0;i<100;i++)q.sync(s,0);assert.equal(q.list(0).length,1);assert.equal(S.serialize(s),raw);
 assert.equal(q.list(2000).length,0);q.sync(s,2000);assert.equal(q.list(2000).length,0);
 for(let i=0;i<100;i++){s.faith=50;S.power(s,'bless',32,24);q.sync(s,2100);}assert.ok(q.list(2100).length<=12);
 q.sync(S.create(6),2200);assert.equal(q.list(2200).length,0);
});
