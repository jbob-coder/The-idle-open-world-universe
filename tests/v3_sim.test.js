"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const V3=require("../src/v3/sim.js");
test("isolated V3 identity and exactly one living autonomous citizen",()=>{
  assert.equal(V3.STORAGE_KEY,"godseed-v3-prototype-v1");
  assert.notEqual(V3.STORAGE_KEY,"godseed-one-small-life-v1");
  assert.equal(V3.VERSION,2);
  const s=V3.create(14).snapshot();
  assert.equal(s.citizens.length,1);
  assert.equal(s.citizens[0].name,"Aria");
  assert.equal(s.citizens[0].alive,true);
  assert.equal(s.citizens[0].health,100);
  assert.equal(s.citizens[0].hunger,85);
  assert.throws(()=>V3.create(-1),RangeError);
});
test("100 seed worlds: Aria autonomously eats, rests, collects and builds",()=>{
  for(let seed=1;seed<=100;seed++){
    const game=V3.create(seed),other=V3.create(seed),before=game.snapshot();
    const state=game.advance(1500);
    assert.deepEqual(state,other.advance(1500),"determinism "+seed);
    assert.equal(state.citizens.length,1);
    assert.equal(state.citizens[0].alive,true,"living "+seed);
    assert.equal(state.structures.length,1,"shelter "+seed);
    assert.equal(state.spent,4);
    assert.equal(state.wood,4,"wood reserve "+seed);
    assert.equal(state.harvested,8);
    assert.equal(state.harvested+state.forest.length,before.forest.length);
    assert.equal(state.harvested,state.citizens[0].harvested);
    assert.equal(state.food,state.foodGathered-state.foodEaten);
    assert.ok(state.foodEaten>0&&state.foodGathered>0,"feeding "+seed);
    assert.ok(state.forest.length>0,"avoid deforestation "+seed);
    assert.equal(V3.validate(state),true,"valid "+seed);
    assert.deepEqual(V3.restore(game.serialize()).snapshot(),state,"save "+seed);
  }
});
test("long running 10000 tick survival remains renewable and deterministic",()=>{
  const a=V3.create(14),b=V3.create(14);
  a.advance(10000);
  for(let i=0;i<50;i++)b.advance(200);
  const s=a.snapshot();
  assert.deepEqual(s,b.snapshot());
  assert.equal(s.citizens[0].alive,true);
  assert.ok(s.citizens[0].health>0);
  assert.ok(s.foodEaten>100);
  assert.ok(s.foodGrown>0);
  assert.equal(s.foodGathered+s.bushes.reduce((n,x)=>n+x.berries,0),12+s.foodGrown);
  assert.equal(s.structures.length,1);
  assert.equal(V3.validate(s),true);
});
test("restore V3 schema 1, retaining exact resources and Bran's archived contribution",()=>{
  const now=V3.create(23).advance(500);
  const a=JSON.parse(JSON.stringify(now));
  const legacy={schemaVersion:1,seed:a.seed,tick:a.tick,
    citizens:[
      {id:"sim_aria",name:"Aria",trait:"explorer",x:a.citizens[0].x,z:a.citizens[0].z,energy:a.citizens[0].energy,harvested:a.harvested-2,goal:"cuidar refugio"},
      {id:"sim_bran",name:"Bran",trait:"builder",x:6,z:4,energy:20,harvested:2,goal:"fundar"}],
    forest:a.forest,wood:a.wood,harvested:a.harvested,spent:a.spent,
    structures:a.structures,events:[{tick:100,actor:"sim_bran",action:"harvest",details:{woodProduced:1}}]};
  const restored=V3.restore(JSON.stringify(legacy)).snapshot();
  assert.equal(restored.schemaVersion,2);
  assert.equal(restored.citizens.length,1);
  assert.equal(restored.legacyHarvested,2);
  assert.equal(restored.citizens[0].harvested,a.harvested-2);
  assert.equal(restored.wood,a.wood);
  assert.deepEqual(restored.forest,a.forest);
  assert.deepEqual(restored.structures,a.structures);
  assert.equal(restored.tick,a.tick);
  assert.equal(restored.events[0].actor,"sim_bran");
  assert.equal(V3.validate(restored),true);
  assert.equal(V3.validate(V3.restore(JSON.stringify(legacy)).advance(100)),true);
});
test("invalid food ledgers and contaminated saves fail closed",()=>{
  const game=V3.create(33);game.advance(300);
  const expected=game.snapshot();
  const stolen=game.snapshot();stolen.citizens[0].health=0;stolen.food=999;
  assert.deepEqual(game.snapshot(),expected);
  for(const field of ["food","foodGathered","foodGrown","legacyHarvested"]){
    const state=game.snapshot();state[field]+=1;
    assert.throws(()=>V3.restore(JSON.stringify(state)),RangeError,field);
  }
  const dead=game.snapshot();dead.citizens[0].alive=false;
  assert.throws(()=>V3.restore(JSON.stringify(dead)),RangeError);
  assert.throws(()=>V3.restore("not json"));
  assert.throws(()=>V3.restore("x".repeat(64001)),RangeError);
  assert.throws(()=>game.advance(-1),RangeError);
  assert.throws(()=>game.advance(20001),RangeError);
});
test("different update cadence never changes authoritative state",()=>{
  const once=V3.create(2026),many=V3.create(2026);
  once.advance(240);
  for(let i=0;i<240;i++)many.advance(1);
  assert.deepEqual(once.snapshot(),many.snapshot());
});
