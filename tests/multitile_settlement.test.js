const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../src/sim'),L=require('../src/living');
const Pixel=require('../src/render/settlements');
function all(s){return s.living.towns.flatMap(t=>t.buildings)}
test('world structures occupy safe 2x2 terrain squares, not symbolic map icons',()=>{
 for(const seed of [1,41,99,2026]){
  const s=S.create(seed),old=s.map.slice(),homes=all(s);
  assert.ok(homes.length>=4);
  for(const b of homes){
   assert.equal(b.w,2);assert.equal(b.h,2);
   for(let y=b.y;y<b.y+2;y++)for(let x=b.x;x<b.x+2;x++){
    assert.ok([S.T.GRASS,S.T.MEADOW].includes(old[S.idx(x,y)]),'home must not replace terrain feature');
   }
  }
  for(let t=0;t<2500;t++)S.tick(s);
  const structures=all(s);
  assert.ok(structures.length>=16,'seed '+seed+' must build a real neighborhood');
  assert.ok(s.living.towns.every(t=>t.technology.level===3),'both towns should reach trade age');
  assert.ok(structures.every(b=>b.w===2&&b.h===2));
  assert.ok(s.living.heritage.every(n=>structures.every(b=>{
   const x=n%S.W,y=(n/S.W)|0;
   return x<b.x||x>=b.x+2||y<b.y||y>=b.y+2;
  })),'historic ruins remain free even after study');
  for(let i=0;i<structures.length;i++)for(let j=i+1;j<structures.length;j++){
   const a=structures[i],b=structures[j];
   const overlap=a.x<b.x+2&&a.x+2>b.x&&a.y<b.y+2&&a.y+2>b.y;
   assert.equal(overlap,false,'houses must not overlap');
  }
  for(const b of structures)for(let y=b.y;y<b.y+2;y++)for(let x=b.x;x<b.x+2;x++)
   assert.ok([S.T.GRASS,S.T.MEADOW].includes(s.map[S.idx(x,y)]),'no resource regrowth inside houses');
  assert.ok(S.validate(s));
  assert.ok(S.serialize(s).length<100000);
 }
});
test('legacy 1x1 buildings survive import while new construction upgrades to 2x2',()=>{
 const s=S.create(41),raw=JSON.parse(S.serialize(s));
 for(const t of raw.living.towns)for(const b of t.buildings){delete b.w;delete b.h;}
 delete raw.living.heritage;
 const restored=S.restore(raw);assert.ok(restored);
 assert.ok(all(restored).every(b=>b.w===1&&b.h===1),'old footprints are preserved');
 for(let i=0;i<1600;i++)S.tick(restored);
 assert.ok(all(restored).some(b=>b.w===2&&b.h===2),'new builds use larger blueprints');
 assert.ok(S.validate(restored));
});
test('all six 2x2 building drawings use integer native-pixel rectangles',()=>{
 for(const type of ['house','farm','workshop','market','well','watchtower']){
  const calls=[],ctx={fillStyle:'',fillRect(...args){calls.push(args)}};
  Pixel.draw(ctx,{roof:'stone',type},0,0);
  assert.ok(calls.length>=4,'expected visible '+type);
  for(const rect of calls){assert.equal(rect.length,4);for(const n of rect)assert.ok(Number.isInteger(n));}
 }
});
