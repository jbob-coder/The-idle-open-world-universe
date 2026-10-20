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

test("after founding a shelter, residents keep four timber in reserve instead of clearing the entire forest",()=>{
  for(let seed=1;seed<=100;seed++){
    const game=V3.create(seed),initial=game.snapshot(),state=game.advance(1500);
    assert.equal(state.structures.length,1,"shelter seed "+seed);
    assert.equal(state.spent,4);
    assert.equal(state.wood,4,"finite reserve seed "+seed);
    assert.equal(state.harvested,8,"no unnecessary timber harvesting seed "+seed);
    assert.equal(state.forest.length,initial.forest.length-8);
    assert.ok(state.forest.length>0,"forest must survive seed "+seed);
    assert.ok(state.citizens.every(c=>c.hunger>=0&&c.hunger<=20),
      "residents may leave the home autonomously to forage");
    assert.equal(V3.validate(state),true);
    assert.deepEqual(V3.restore(game.serialize()).snapshot(),state);
    game.advance(500);
    const later=game.snapshot();
    assert.equal(later.harvested,state.harvested,"do not deforest after reserve is full");
    assert.equal(later.structures.length,1);
  }
});

test("100 seeds autonomously forage, eat and regenerate only accountable food",()=>{
  for(let seed=1;seed<=100;seed++){
    const game=V3.create(seed),other=V3.create(seed),initial=game.snapshot();
    const state=game.advance(1600);
    assert.deepEqual(state,other.advance(1600),"food deterministic seed "+seed);
    assert.equal(V3.validate(state),true);
    assert.equal(state.berries.length,8);
    assert.ok(state.foraged>0&&state.eaten>0,"autonomous survival "+seed);
    assert.equal(state.food,state.foraged-state.eaten);
    assert.equal(state.berries.reduce((n,p)=>n+p.stock,0)+state.foraged,
      initial.berries.length*2+state.grown,"no fictitious berries "+seed);
    assert.equal(state.wood,4);
    assert.equal(state.harvested,8);
    assert.deepEqual(V3.restore(game.serialize()).snapshot(),state);
  }
});
test("old V3 schema1 save preserves original tree, wood, positions, shelter and events",()=>{
  const game=V3.create(14);game.advance(151);
  const previous=game.snapshot();previous.schemaVersion=1;
  for(const f of ["berries","food","foraged","eaten","grown"])delete previous[f];
  previous.citizens.forEach(c=>delete c.hunger);
  const migrated=V3.restore(JSON.stringify(previous)).snapshot();
  assert.equal(migrated.schemaVersion,2);
  for(const f of ["seed","tick","wood","harvested","spent","forest","structures","events"])
    assert.deepEqual(migrated[f],previous[f],f);
  assert.equal(migrated.food,0);
  assert.equal(migrated.berries.length,8);
  assert.ok(migrated.citizens.every(c=>c.hunger===0));
  assert.deepEqual(V3.restore(JSON.stringify(migrated)).snapshot(),migrated);
});
test("invented food and plant production or invalid hunger fail closed",()=>{
  const g=V3.create(33);g.advance(240);
  const old=g.snapshot();
  for(const change of [s=>s.food++,s=>s.foraged+=10,s=>s.eaten++,
    s=>s.berries[0].stock++,s=>s.citizens[0].hunger=21,s=>s.grown+=100000]){
    const q=JSON.parse(JSON.stringify(old));change(q);
    assert.throws(()=>V3.restore(JSON.stringify(q)),RangeError);
  }
});
