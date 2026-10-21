"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const WorldSim=require("../src/v3/world_sim.js");

test("frontier homesteader actually harvests, eats, and builds from finite resources",()=>{
  const a=WorldSim.create(14),b=WorldSim.create(14);
  const s=a.advance(3500);
  assert.deepEqual(s,b.advance(3500),"world and NPC decisions must be deterministic");
  assert.equal(s.world.homelandCitizens,3);
  assert.equal(s.world.frontierResidents,1);
  assert.equal(s.world.frontierHomes,1);
  const mira=s.citizens.find(c=>c.id==="world_mira");
  const house=s.structures.find(h=>h.id==="frontier_home_1");
  const camp=s.structures.find(h=>h.id==="camp_1");
  assert.ok(mira&&mira.alive&&camp&&house);
  assert.equal(mira.homeCampId,camp.id);
  assert.equal(house.builder,mira.id);
  assert.ok(house.completedAt>=mira.bornAt);
  assert.ok(s.expedition.settlerWoodGathered>=4);
  assert.ok(s.expedition.settlerFoodGathered>=3);
  assert.equal(mira.wood,s.expedition.settlerWoodGathered-4);
  assert.equal(mira.food,s.expedition.settlerFoodGathered-s.expedition.settlerFoodEaten);
  assert.equal(s.expedition.woodSpent,(s.expedition.camps.length+1)*4);
  assert.equal(s.expedition.foodGathered-s.expedition.foodEaten,
    s.expedition.explorer.food+mira.food);
  assert.deepEqual(WorldSim.restore(a.serialize()).snapshot(),s);
});

test("schema 1 world saves remain loadable without retroactive NPC creation",()=>{
  // Legacy state chosen before construction of first route camp.
  const game=WorldSim.create(26);game.advance(650);
  const original=game.snapshot();
  assert.equal(original.expedition.camps.length,0);
  const raw=JSON.parse(game.serialize());
  assert.equal(raw.schemaVersion,2);
  raw.schemaVersion=1;
  for(const key of ["settlers","houses","settlerWoodGathered",
    "settlerFoodGathered","settlerFoodEaten"])delete raw.expedition[key];
  const migrated=WorldSim.restore(JSON.stringify(raw));
  assert.deepEqual(migrated.snapshot().expedition,original.expedition);
  assert.equal(JSON.parse(migrated.serialize()).schemaVersion,2);
  assert.equal(migrated.snapshot().world.frontierResidents,0);
});

test("resident resource and identity forgery fails restore",()=>{
  const game=WorldSim.create(14);game.advance(3500);
  const raw=JSON.parse(game.serialize());
  assert.equal(raw.expedition.houses.length,1);
  for(const mutate of [
    d=>d.expedition.settlerWoodGathered++,
    d=>d.expedition.settlers[0].food++,
    d=>d.expedition.settlers[0].homeCampId="foreign",
    d=>d.expedition.houses[0].completedAt=999999,
    d=>delete d.expedition.settlerFoodGathered,
    d=>d.expedition.settlers[0].name="fake"
  ]){
    const changed=JSON.parse(JSON.stringify(raw));mutate(changed);
    assert.throws(()=>WorldSim.restore(JSON.stringify(changed)),RangeError);
  }
});

test("new world saves conserve resources across sequential time and restore",()=>{
  const g=WorldSim.create(77);
  for(let i=0;i<8;i++){
    g.advance(500);
    const snapshot=g.snapshot();
    const e=snapshot.expedition, x=e.explorer, m=e.settlers[0];
    assert.equal(e.woodGathered,e.woodSpent+(x?x.wood:0)+(m?m.wood:0));
    assert.equal(e.foodGathered,e.foodEaten+(x?x.food:0)+(m?m.food:0));
    assert.deepEqual(WorldSim.restore(g.serialize()).snapshot(),snapshot);
  }
});

test("settlers can pass beyond a depleted local grove and return home",()=>{
  // Seed 100 has no remaining tree within Mira's original 12-tile search.
  // A local search budget must not become a border for the open world.
  const game=WorldSim.create(100);
  const state=game.advance(3200);
  const resident=state.expedition.settlers[0];
  const home=state.expedition.houses[0];
  assert.ok(resident&&resident.alive,"the resident survives");
  assert.ok(home,"the resident built after travelling beyond the first grove");
  assert.equal(home.builder,resident.id);
  assert.equal(resident.wood,
    state.expedition.settlerWoodGathered-state.expedition.houses.length*4);
  assert.deepEqual(WorldSim.restore(game.serialize()).snapshot(),state);
});
