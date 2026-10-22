const test=require('node:test'),assert=require('node:assert/strict'),R=require('../src/render/terrain'),S=require('../src/sim');
test('road masks distinguish all cardinal connections and ignore hidden neighbors',()=>{
 const s=S.create(4);s.map.fill(S.T.GRASS);s.seen.fill(1);s.map[S.idx(32,24)]=S.T.ROAD;
 const dirs=[[0,-1],[1,0],[0,1],[-1,0]];
 for(let mask=0;mask<16;mask++){dirs.forEach(([dx,dy],i)=>s.map[S.idx(32+dx,24+dy)]=(mask&(1<<i))?S.T.ROAD:S.T.GRASS);assert.equal(R.mask(s,32,24,S.T.ROAD),mask);}
 s.seen.fill(0);assert.equal(R.mask(s,32,24,S.T.ROAD),0);
});
test('visual variants and decorations do not consume RNG or mutate world',()=>{
 const s=S.create(5),before=S.serialize(s);for(let i=0;i<3072;i++){assert.ok(R.variant(s,i%64,i/64|0)<3);R.prop(s,i%64,i/64|0);}
 assert.equal(S.serialize(s),before);const saved=S.restore(before);assert.equal(R.variant(s,10,13),R.variant(saved,10,13));
});
