"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const Discovery=require("../src/v3/discovery.js");
const World=require("../src/v3/world.js");
const Agency=require("../src/v3/agency.js");
const Nav=require("../src/v3/world_travel.js");

test("an explorer chooses real unknown landmarks without fixed waypoints",()=>{
  const world=World.create(14),actor={id:"world_taren",anchor:{x:24,z:24},
    mind:Agency.create("world_taren",24,24)};
  const first=Discovery.select(world,actor,[]);
  assert.ok(first&&first.id.startsWith("landmark_"));
  assert.deepEqual(Discovery.select(world,actor,[]),first);
  assert.ok(Nav.distance(first,actor.anchor)>=64);
  const land=world.landmark(Math.floor(first.x/64),Math.floor(first.z/64));
  assert.equal(first.id,land.id);
  assert.equal(Discovery.validTarget(world,first,[]),true);
  const visited=[{...land,tick:650}];
  assert.equal(Discovery.validTarget(world,first,visited),false);
  const next=Discovery.select(world,{...actor,anchor:first},visited);
  assert.ok(next&&next.id!==first.id);
  assert.equal(Discovery.validateHistory(world,visited,600,680),true);
});

test("explorers with different interests evaluate real landmark types",()=>{
  const world=World.create(18);
  const base={anchor:{x:24,z:24},mind:Agency.create("traveler",24,24)};
  const cautious={...base,mind:{...base.mind,
    preferences:{curiosity:25,security:89,craftsmanship:50}}};
  const curious={...base,mind:{...base.mind,
    preferences:{curiosity:89,security:25,craftsmanship:50}}};
  const a=Discovery.select(world,cautious,[]),b=Discovery.select(world,curious,[]);
  for(const target of [a,b]){
    assert.ok(target&&Discovery.validTarget(world,target,[]));
    assert.ok(world.walkable(target.x,target.z));
  }
  assert.equal(Discovery.validTarget(world,{x:24,z:24,id:"fake"},[]),false);
  assert.equal(Discovery.validateHistory(world,[
    {...world.landmark(Math.floor(a.x/64),Math.floor(a.z/64)),tick:700},
    {...world.landmark(Math.floor(a.x/64),Math.floor(a.z/64)),tick:701}
  ],600,720),false,"known landmarks cannot be rediscovered");
});

test("all explored landmarks end optional exploration without resetting history",()=>{
  const world=World.create(26);
  const traveler={anchor:{x:24,z:24},mind:Agency.create("cartographer",24,24)};
  const visited=[];for(let z=-8;z<=7;z++)for(let x=-8;x<=7;x++){
    const place=world.landmark(x,z);if(place)visited.push({...place,tick:800});
  }
  assert.equal(visited.length,Discovery.MAX_DISCOVERIES);
  assert.equal(Discovery.select(world,traveler,visited),null);
  assert.equal(Discovery.validateHistory(world,visited,600,900),true);
});
