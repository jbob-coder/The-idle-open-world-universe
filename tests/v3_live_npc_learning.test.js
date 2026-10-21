"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const World=require("../src/v3/world.js");
const Nav=require("../src/v3/world_travel.js");
const Agency=require("../src/v3/agency.js");
const Expedition=require("../src/v3/expedition.js");
const WorldSim=require("../src/v3/world_sim.js");

test("live frontier settler preserves actual learned construction outcomes on reload",()=>{
  const game=WorldSim.create(14),state=game.advance(3500);
  const resident=state.expedition.settlers[0];
  assert.ok(resident&&state.expedition.houses.length===1);
  assert.ok(resident.mind.adaptation.build_home>0,
    "physically paid construction must influence the real NPC's future choices");
  assert.ok(Agency.validate(resident.mind,state.tick));
  assert.deepEqual(WorldSim.restore(game.serialize()).snapshot(),state,
    "outcome learning survives save and load without new storage keys");
});

test("exploration targets are personal, terrain-valid and beyond the tiny patrol",()=>{
  const world=World.create(14),mind=Agency.create("scout",24,24);
  const home={x:24,z:24},actor={id:"scout",x:24,z:24,worldSettler:true,mind};
  let successes=0,distinct=new Set();
  for(let tick=600;tick<1200;tick+=36){
    const choice=Expedition.wanderStep(world,actor,home,tick);
    if(!choice)continue;
    successes++;
    const {step,destination}=choice,tile=world.sample(destination.x,destination.z,tick);
    assert.ok(tile&&tile.walkable&&!tile.tree);
    const distance=Nav.distance(home,destination);
    assert.ok(distance>=4&&distance<=32,
      "destinations must escape the old two-tile scripted orbit");
    assert.equal(Nav.distance(actor,step),1,"move one physical tile, never teleport");
    assert.deepEqual(Expedition.wanderStep(world,actor,home,tick),choice);
    distinct.add(destination.x+","+destination.z);
  }
  assert.ok(successes>=1&&distinct.size>=2,"different reachable destinations exist");
});

test("NPC route crosses negative chunk seams without walking through trees",()=>{
  const mock={sample(x,z){
    if(x<-20||x>20||z<-10||z>10)return null;
    return {x,z,walkable:true,tree:x===-16&&z===0};
  }};
  const route=Nav.local(mock,{x:-17,z:0},{x:-14,z:0},100,12,300);
  assert.ok(route);
  assert.ok(route.path.some(p=>p.x===-16&&p.z!==0),
    "movement crosses signed chunk coordinates at a free adjacent tile");
  assert.ok(!route.path.some(p=>p.x===-16&&p.z===0),
    "a tree remains physically impassable");
  assert.deepEqual(route.path[route.path.length-1],{x:-14,z:0});
});
