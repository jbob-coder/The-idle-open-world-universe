"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const V3=require("../src/v3/sim.js");

test("new V3 storage is isolated from all original V1 saves",()=>{
  assert.equal(V3.STORAGE_KEY,"godseed-v3-prototype-v1");
  assert.notEqual(V3.STORAGE_KEY,"godseed-one-small-life-v1");
  assert.throws(()=>V3.create(-1),RangeError);
  assert.throws(()=>V3.create(4294967296),RangeError);
});
test("100 independent seed worlds gather finite wood and build once, with no player input",()=>{
  for(let seed=1;seed<=100;seed++){
    const game=V3.create(seed),other=V3.create(seed);
    const before=game.snapshot(),state=game.advance(240);
    assert.deepEqual(state,other.advance(240),"determinism seed "+seed);
    assert.equal(state.tick,240);
    assert.equal(state.structures.length,1,"autonomous settlement seed "+seed);
    assert.equal(state.spent,4,"shelter consumes exactly four units");
    assert.equal(state.wood,state.harvested-4,"wood ledger seed "+seed);
    assert.equal(state.harvested+state.forest.length,before.forest.length,"no resources created");
    assert.equal(state.harvested,state.citizens.reduce((n,c)=>n+c.harvested,0));
    assert.equal(V3.validate(state),true);
    assert.deepEqual(V3.restore(game.serialize()).snapshot(),state);
  }
});
test("world construction is one-time and never needs direct God commands",()=>{
  const game=V3.create(14);
  const state=game.advance(1500);
  assert.equal(state.structures.length,1);
  assert.equal(state.spent,4);
  assert.equal(state.wood,state.harvested-state.spent);
  assert.ok(state.citizens[0].harvested+state.citizens[1].harvested>=4);
});
test("snapshot cannot be used to mutate engine state; invalid saves fail closed",()=>{
  const game=V3.create(33);
  const expected=game.advance(120);
  const borrowed=game.snapshot();
  borrowed.wood=9999;
  borrowed.citizens[0].x=999;
  assert.deepEqual(game.snapshot(),expected);
  const saved=game.serialize();
  const corrupted=JSON.parse(saved);
  corrupted.wood+=9;
  assert.throws(()=>V3.restore(JSON.stringify(corrupted)),RangeError);
  assert.throws(()=>V3.restore("not json"));
  assert.throws(()=>V3.restore("x".repeat(64001)),RangeError);
  assert.throws(()=>game.advance(-1),RangeError);
  assert.throws(()=>game.advance(20001),RangeError);
});
test("different update cadences yield the same authoritative state",()=>{
  const once=V3.create(2026),many=V3.create(2026);
  once.advance(240);
  for(let i=0;i<240;i++)many.advance(1);
  assert.deepEqual(once.snapshot(),many.snapshot());
});
