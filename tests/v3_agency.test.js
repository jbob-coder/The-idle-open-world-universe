"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const Agency=require("../src/v3/agency.js");
const Infra=require("../src/v3/infrastructure.js");
const World=require("../src/v3/world.js");

test("different personalities choose different legal actions in the same circumstances",()=>{
  const a=Agency.create("a",24,24),b=Agency.create("b",24,24);
  assert.deepEqual(Agency.create("a",24,24),a);
  assert.notDeepEqual(a.preferences,b.preferences);
  const context={hunger:90,energy:20,food:4,wood:4,hasHome:false,roadPending:false};
  const home=Agency.create("builder",24,24);
  home.preferences={curiosity:25,craftsmanship:89,security:89};
  home.curiosityUrge=0;
  assert.equal(Agency.decide(home,context).action,"build_home");
  assert.equal(Agency.decide(home,{...context,hasHome:true,roadPending:true}).action,"build_road");
  assert.equal(Agency.decide(home,{...context,hasHome:true,wood:0,roadPending:true}).action,"gather_wood");
  assert.equal(Agency.decide(home,{...context,hunger:55,food:0}).action,"forage");
  assert.equal(Agency.decide(home,{...context,hunger:55,food:2}).action,"eat");
  assert.equal(Agency.decide(home,{...context,energy:2}).action,"rest");
  const curious=Agency.create("wanderer",24,24);
  curious.preferences={curiosity:89,craftsmanship:25,security:25};
  curious.curiosityUrge=100;
  assert.equal(Agency.decide(curious,context).action,"explore");
  assert.ok(Agency.decide(curious,context).alternatives.some(o=>o.action==="build_home"));
  for(let n=0;n<5;n++)Agency.commitChoice(curious,"explore");
  assert.equal(Agency.decide(curious,context).action,"build_home",
    "satiated curiosity makes the same NPC reconsider construction");
  assert.ok(Agency.validate(curious,100));
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

test("NPCs retain home founding milestones while mundane work memories are bounded",()=>{
  const mind=Agency.create("resident",64,24);
  mind.choices=200;
  Agency.remember(mind,1,"settler_arrive",{});
  Agency.remember(mind,20,"settler_build",{});
  for(let tick=40;tick<=190;tick+=10){
    Agency.remember(mind,tick,tick%20?"settler_harvest":"settler_forage",{});
  }
  assert.ok(mind.memories.length<=Agency.MAX_MEMORIES);
  assert.ok(mind.memories.some(m=>m.action==="settler_arrive"));
  assert.ok(mind.memories.some(m=>m.action==="settler_build"));
  assert.ok(Agency.validate(mind,200));
});


test("NPC resource frustration expands their world search and success is remembered",()=>{
  const mind=Agency.create("wanderer",200,200);
  assert.equal(Agency.searchRadius(mind,"forage"),12);
  assert.equal(Agency.observe(mind,"forage",false),-3);
  assert.equal(Agency.searchRadius(mind,"forage"),24);
  Agency.observe(mind,"forage",false);
  assert.equal(Agency.searchRadius(mind,"forage"),36);
  Agency.observe(mind,"forage",false);
  assert.equal(Agency.searchRadius(mind,"forage"),64);
  Agency.observe(mind,"forage",true);
  assert.equal(mind.adaptation.forage,-7);
  assert.equal(Agency.searchRadius(mind,"forage"),36);
  const copy=JSON.parse(JSON.stringify(mind));
  assert.deepEqual(copy,mind);
  assert.equal(Agency.validate(copy,100),true);
  assert.throws(()=>Agency.observe(mind,"talk",true),RangeError);
  assert.throws(()=>Agency.searchRadius(mind,"build_home"),RangeError);
});

test("experience changes feasible priorities but never suppresses urgent survival",()=>{
  const mind=Agency.create("individual",44,44);
  mind.preferences={curiosity:25,craftsmanship:65,security:58};
  const ctx={hunger:90,energy:20,food:3,wood:4,hasHome:false,roadPending:false};
  assert.equal(Agency.decide(mind,ctx).action,"build_home");
  for(let i=0;i<4;i++)Agency.observe(mind,"build_home",false);
  const result=Agency.decide(mind,ctx);
  assert.ok(result.alternatives.some(o=>o.action==="build_home")||
    result.action==="build_home","failure never removes legal options");
  const hungry={...ctx,hunger:20,food:0};
  assert.equal(Agency.decide(mind,hungry).action,"forage");
  const tired={...ctx,energy:2};
  assert.equal(Agency.decide(mind,tired).action,"rest");
  const corrupted=JSON.parse(JSON.stringify(mind));
  corrupted.adaptation.forage=13;
  assert.equal(Agency.validate(corrupted,100),false);
});
