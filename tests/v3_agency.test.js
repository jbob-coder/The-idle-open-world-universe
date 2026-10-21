"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const Agency=require("../src/v3/agency.js");
const Infra=require("../src/v3/infrastructure.js");
const World=require("../src/v3/world.js");

test("NPCs with different needs and opportunities prefer different actions",()=>{
  const a=Agency.create("a",24,24),b=Agency.create("b",24,24);
  assert.deepEqual(Agency.create("a",24,24),a);
  assert.notDeepEqual(a.preferences,b.preferences);
  const context={hunger:90,energy:20,food:4,wood:4,hasHome:false,roadPending:false};
  assert.equal(Agency.decide(a,context).action,"build_home");
  assert.equal(Agency.decide(a,{...context,hasHome:true,roadPending:true}).action,"build_road");
  assert.equal(Agency.decide(a,{...context,hasHome:true,wood:0,roadPending:true}).action,"gather_wood");
  assert.equal(Agency.decide(a,{...context,hasHome:true,roadPending:false}).action,"explore");
  assert.equal(Agency.decide(a,{...context,hunger:55,food:0}).action,"forage");
  assert.equal(Agency.decide(a,{...context,hunger:55,food:2}).action,"eat");
  assert.equal(Agency.decide(a,{...context,energy:2}).action,"rest");
  assert.ok(Agency.decide(a,{...context}).alternatives.length<=3);
});

test("bounded NPC memories and decisions reject forged cognition",()=>{
  const a=Agency.create("npc",12,17);
  a.lastChoice="explore";a.choices=30;
  for(let i=1;i<120;i+=21)Agency.remember(a,i,"settler_explore",{});
  assert.ok(Agency.validate(a,200));
  a.memories.push({tick:201,action:"settler_build"});
  assert.equal(Agency.validate(a,200),false);
  a.memories.pop();
  a.lastChoice="scripted_king";
  assert.equal(Agency.validate(a,200),false);
});

test("house plot is selected from real terrain and NPC differences",()=>{
  const world=World.create(14),camp={id:"dynamic_camp",type:"camp",x:90,z:90};
  const p=Infra.chooseHomeSite(world,camp,Agency.create("test",90,90).preferences,250);
  assert.ok(p,"real, reachable build plot exists");
  assert.ok(world.walkable(p.x,p.z));
  const tile=world.sample(p.x,p.z,250);
  assert.ok(!tile.tree&&!tile.bush&&tile.kind==="ground");
  const d=Math.abs(p.x-camp.x)+Math.abs(p.z-camp.z);
  assert.ok(d>=4&&d<=8);
  assert.deepEqual(Infra.chooseHomeSite(world,camp,Agency.create("test",90,90).preferences,250),p);
});
