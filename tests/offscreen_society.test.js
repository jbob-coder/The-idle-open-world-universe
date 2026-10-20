const test=require("node:test");
const assert=require("node:assert/strict");
const Society=require("../src/world/offscreen_society.js");
test("unattended citizens consume finite forest, earn wood and build a persistent hamlet",()=>{
 const s=Society.create(2026,{maxActive:3});
 const first=s.snapshot();
 assert.equal(first.built,false);
 assert.equal(first.cache.sites,0);
 const end=s.advance(2000,{x:3000,y:3000});
 assert.equal(end.built,true);
 assert.ok(end.offscreenActions>0);
 assert.ok(end.ledger.harvested>=4);
 assert.equal(end.ledger.spent,4);
 assert.equal(end.stock.wood,end.ledger.harvested-end.ledger.spent);
 assert.equal(end.settlement.kind,"settlement");
 assert.equal(end.shelter.kind,"building");
 assert.ok(end.events.some(e=>e.type==="construction"&&e.details.woodSpent===4));
 assert.ok(end.cache.activeChunks<=3);
 assert.ok(end.cache.editedTiles>=4);
});
test("five seeds repeat exactly without input across near and distant camera schedules",()=>{
 for(const seed of [1,7,77,2026,99119]){
  const a=Society.create(seed),b=Society.create(seed);
  for(const view of [{x:1000,y:1000},{x:0,y:0},{x:-1000,y:-1000}]){
   a.advance(480,view);b.advance(480,view);
  }
  assert.equal(a.serialize(),b.serialize(),"seed "+seed);
 }
});
test("save reload preserves persistent buildings, resource accounting and future state",()=>{
 const a=Society.create(88,{maxActive:2});
 a.advance(1500,{x:2000,y:2000});
 const raw=a.serialize(),b=Society.restore(raw,{maxActive:2});
 assert.equal(b.serialize(),raw);
 a.advance(720,{x:10,y:10});b.advance(720,{x:10,y:10});
 assert.equal(b.serialize(),a.serialize());
 assert.ok(b.snapshot().cache.activeChunks<=2);
 assert.equal(b.snapshot().citizens.length,2);
});
test("offscreen observation from sixty distant positions cannot grow the active chunk cache",()=>{
 const a=Society.create(77,{maxActive:1});
 for(let i=0;i<60;i++){
  a.advance(120,{x:i*10000,y:-i*10000});
  const snap=a.snapshot();
  assert.ok(snap.cache.activeChunks<=1);
  assert.ok(snap.events.length<=48);
  assert.ok(a.serialize().length<Society.MAX_SAVE_BYTES);
 }
});
test("inconsistent resource ledgers and missing sites fail closed",()=>{
 const a=Society.create(7),raw=a.serialize();
 const bad=JSON.parse(raw);bad.state.stock.wood=999;
 assert.throws(()=>Society.restore(JSON.stringify(bad)),/invalid/);
 const bad2=JSON.parse(raw);bad2.state.built=true;
 assert.throws(()=>Society.restore(JSON.stringify(bad2)),/inconsistent/);
 assert.throws(()=>Society.restore("x".repeat(Society.MAX_SAVE_BYTES+1)),RangeError);
 assert.equal(a.serialize(),raw);
});

test("100-seed reachable founding sweep catches isolated starting islands",()=>{
 for(let seed=1;seed<=100;seed++){
  const s=Society.create(seed,{maxActive:1});
  const state=s.advance(2000,{x:10000,y:10000});
  assert.equal(state.built,true,"seed "+seed+" must reach four real trees");
  assert.equal(state.ledger.harvested,4);
  assert.equal(state.ledger.spent,4);
  assert.equal(state.stock.wood,0);
  assert.ok(state.cache.activeChunks<=1);
  assert.equal(Society.restore(s.serialize(),{maxActive:1}).serialize(),s.serialize());
 }
});
