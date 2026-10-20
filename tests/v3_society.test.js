"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Sim=require("../src/v3/society.js");

test("the settlement has its own immutable game/save identity",()=>{
  assert.equal(Sim.STORAGE_KEY,"godseed-v3-society-v1");
  assert.notEqual(Sim.STORAGE_KEY,"godseed-v3-prototype-v1");
  assert.notEqual(Sim.STORAGE_KEY,"godseed-one-small-life-v1");
  const initial=Sim.create(14).snapshot();
  assert.equal(initial.citizens.length,1,"Aria is initially alone");
  assert.equal(initial.citizens[0].name,"Aria");
  assert.equal(initial.structures.length,0);
  assert.equal(initial.axe,0);
  assert.equal(initial.settlement.leaderId,null);
  assert.equal(Sim.validate(initial),true);
});

test("100 seeded villages craft, build, socialize and elect without input",()=>{
  for(let seed=1;seed<=100;seed++){
    const a=Sim.create(seed),b=Sim.create(seed),initial=a.snapshot();
    const s=a.advance(2000);
    assert.deepEqual(s,b.advance(2000),"determinism seed "+seed);
    assert.equal(s.citizens.length,3,"citizen arrivals "+seed);
    assert.deepEqual(s.structures.map(x=>x.id),["home","workshop","storehouse"],"buildings "+seed);
    assert.equal(s.axe,1);
    assert.equal(s.axeCrafted,1);
    assert.equal(s.kitsCrafted,2);
    assert.equal(s.kitsUsed,2);
    assert.equal(s.craftedWood,6);
    assert.equal(s.spentWood,14);
    assert.equal(s.wood,s.harvested-20);
    assert.equal(s.harvested+s.forest.length,initial.forest.length);
    assert.equal(s.food,s.foodGathered-s.foodEaten);
    assert.equal(s.foodGathered+s.bushes.reduce((n,x)=>n+x.berries,0),12+s.foodGrown);
    assert.equal(new Set(s.structures.map(x=>x.x+","+x.z)).size,3);
    assert.ok(s.forest.every(t=>s.structures.every(b=>
      t.x<b.x-1||t.x>b.x+2||t.z<b.z-1||t.z>b.z+2)),
      "no trees remain within a constructed footprint seed "+seed);
    assert.ok(s.citizens.every(x=>x.alive),"living villagers "+seed);
    assert.ok(s.citizens.some(x=>x.conversations>=3),"social contact "+seed);
    assert.ok(s.settlement.leaderId,"leader "+seed);
    assert.equal(s.settlement.ballots.length,3);
    assert.equal(Sim.validate(s),true);
    assert.deepEqual(Sim.restore(a.serialize()).snapshot(),s,"save seed "+seed);
  }
});

test("a shelter is built only after an axe exists and finite wood was paid",()=>{
  const g=Sim.create(14);
  let last=0,first={};
  for(let i=0;i<600;i++){
    const s=g.advance(1);
    for(const e of s.events.filter(e=>e.tick>last)){
      if(e.action==="craft"&&e.details.recipe==="axe")first.axe??=e.tick;
      if(e.action==="build"&&e.details.site==="home")first.home??=e.tick;
      if(e.action==="arrive")first.arrival??=e.tick;
      if(e.action==="elect")first.election??=e.tick;
    }
    last=s.tick;
  }
  const s=g.snapshot();
  assert.ok(first.axe>0&&first.home>first.axe);
  assert.ok(first.arrival>first.home);
  assert.ok(first.election>first.arrival);
  assert.ok(s.structures[2].completedAt>first.election,"public storehouse needs elected leadership");
  assert.ok(s.citizens.reduce((sum,c)=>sum+c.built,0)===3);
  assert.equal(Sim.validate(s),true);
});

test("bounded snapshots, incremental clock and save recovery stay deterministic",()=>{
  const once=Sim.create(2026),each=Sim.create(2026);
  once.advance(1200);
  for(let i=0;i<1200;i++)each.advance(1);
  assert.deepEqual(once.snapshot(),each.snapshot());
  const detached=once.snapshot();
  detached.wood=12345;detached.citizens[0].health=0;
  assert.deepEqual(once.snapshot(),each.snapshot());
  assert.deepEqual(Sim.restore(once.serialize()).snapshot(),once.snapshot());
});

test("invalid identities, invented resources and leadership are rejected",()=>{
  const game=Sim.create(43);game.advance(1200);
  for(const mutate of [
    s=>s.wood++,
    s=>s.craftedWood++,
    s=>s.food++,
    s=>s.foodGrown++,
    s=>s.settlement.leaderId="unknown",
    s=>s.settlement.leaderId=s.settlement.leaderId==="sim_aria"?"sim_bran":"sim_aria",
    s=>s.settlement.ballots[0].voter=s.settlement.ballots[1].voter,
    s=>s.citizens[0].relations.sim_bran=9999,
    s=>s.structures[1].x=1,
    s=>s.citizens.push(JSON.parse(JSON.stringify(s.citizens[0])))
  ]){
    const corrupt=game.snapshot();mutate(corrupt);
    assert.equal(Sim.validate(corrupt),false);
    assert.throws(()=>Sim.restore(JSON.stringify(corrupt)),RangeError);
  }
  assert.throws(()=>Sim.restore("not json"));
  assert.throws(()=>Sim.restore("x".repeat(64001)),RangeError);
  assert.throws(()=>Sim.create(-1),RangeError);
  assert.throws(()=>game.advance(-1),RangeError);
  assert.throws(()=>game.advance(20001),RangeError);
});

test("extended 10k-tick society keeps finite resources and persistent roles",()=>{
  const game=Sim.create(14);
  const s=game.advance(10000);
  assert.equal(s.citizens.length,3);
  assert.equal(s.structures.length,3);
  assert.ok(s.citizens.every(c=>c.alive));
  assert.ok(s.settlement.elections>=1);
  assert.ok(s.events.length<=96);
  assert.ok(game.serialize().length<64000);
  assert.equal(Sim.validate(s),true);
  assert.deepEqual(Sim.restore(game.serialize()).snapshot(),s);
});
