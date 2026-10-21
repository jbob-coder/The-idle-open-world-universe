"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const Projects=require("../src/v3/projects.js");
const WorldSim=require("../src/v3/world_sim.js");

const worker=(id,wood,x=9,z=9)=>({id,wood,x,z,energy:20,alive:true,bornAt:1});

test("two workers independently contribute real timber and labor to one shared home",()=>{
  const jobs=Projects.create(),a=worker("npc_one",3),b=worker("npc_two",2);
  const home={x:9,z:9};
  const order=Projects.propose(jobs,"home",home,a.id,10);
  assert.equal(order.required,4);
  assert.equal(Projects.propose(jobs,"home",home,b.id,11),order);
  assert.equal(Projects.contribute(jobs,order,a,12).completed,false);
  assert.equal(Projects.contribute(jobs,order,b,13).completed,false);
  const checkpoint=JSON.parse(JSON.stringify(jobs));
  assert.equal(checkpoint.entries[0].progress,2);
  assert.equal(Projects.validate(checkpoint,13,[],[],[a,b]),2);
  assert.equal(Projects.contribute(jobs,order,a,14).completed,false);
  assert.equal(Projects.contribute(jobs,order,b,15).completed,true);
  assert.equal(a.wood,1);assert.equal(b.wood,0);
  assert.equal(order.completedAt,15);
  assert.equal(order.contributors.length,2);
  assert.deepEqual(order.contributors.map(c=>c.units),[2,2]);
  assert.equal(Projects.validate(jobs,15,[{x:9,z:9,completedAt:15}],[],[a,b]),4);
  assert.equal(Projects.contribute(jobs,order,a,16).worked,false,"completed orders cannot duplicate spending");
});

test("an unfinished project survives exhaustion, interruptions and future worker resumption",()=>{
  const jobs=Projects.create(),one=worker("builder_a",2),two=worker("builder_b",2);
  const order=Projects.propose(jobs,"home",{x:9,z:9},one.id,10);
  Projects.contribute(jobs,order,one,10);
  one.energy=2;
  assert.equal(Projects.contribute(jobs,order,one,11).worked,false);
  two.x=100;
  assert.equal(Projects.contribute(jobs,order,two,12).worked,false);
  two.x=9;
  const restored=JSON.parse(JSON.stringify(jobs));
  const current=restored.entries[0];
  assert.equal(Projects.contribute(restored,current,two,15).worked,true);
  assert.equal(Projects.validate(restored,15,[],[],[one,two]),2);
  assert.equal(Projects.contribute(restored,current,one,16).worked,false);
});

test("work orders reject tampering and illegal free material",()=>{
  const jobs=Projects.create(),a=worker("test",2);
  const p=Projects.propose(jobs,"road",{x:9,z:9},a.id,10);
  assert.equal(Projects.contribute(jobs,{...p},a,11).worked,false);
  assert.equal(a.wood,2);
  const result=Projects.contribute(jobs,p,a,11);
  assert.equal(result.completed,true);assert.equal(a.wood,1);
  const records=[{x:9,z:9,completedAt:11}];
  for(const edit of [
    x=>x.entries[0].progress=0,
    x=>x.entries[0].contributors[0].units=5,
    x=>x.entries[0].completedAt=10,
    x=>x.entries[0].initiator="ghost",
    x=>x.entries[0].status="active",
    x=>x.entries[0].x+=1
  ]){
    const tamper=JSON.parse(JSON.stringify(jobs));edit(tamper);
    assert.equal(Projects.validate(tamper,12,[],records,[a]),false);
  }
});

test("world keeps an open construction job and paid timber on restart",()=>{
  let found=false;
  for(const seed of [14,77,100]){
    const game=WorldSim.create(seed);
    for(let n=0;n<4000;n++){
      const state=game.advance(1);
      const open=state.expedition.projects.entries.find(p=>p.type==="home"&&p.status==="active"&&p.progress>0);
      if(!open)continue;
      found=true;
      assert.equal(open.type,"home");
      assert.ok(open.progress>=1&&open.progress<4);
      assert.equal(state.expedition.woodSpent,
        (state.expedition.camps.length+state.expedition.houses.length)*4+
        state.expedition.roads.length+open.progress);
      assert.deepEqual(WorldSim.restore(game.serialize()).snapshot(),state);
      game.advance(250);
      assert.ok(game.snapshot().expedition.houses.length>0);
      assert.ok(game.snapshot().expedition.projects.entries.some(p=>p.status==="complete"&&p.type==="home"));
      assert.deepEqual(WorldSim.restore(game.serialize()).snapshot(),game.snapshot());
      break;
    }
    if(found)break;
  }
  assert.ok(found,"at least one NPC must physically perform multiple construction shifts");
});

test("schema 5 saves migrate without inventing historical construction shifts",()=>{
  const game=WorldSim.create(14);game.advance(2500);
  const raw=JSON.parse(game.serialize());
  assert.equal(raw.schemaVersion,6);
  const count=raw.expedition.houses.length;
  raw.schemaVersion=5;
  delete raw.expedition.projects;
  const restored=WorldSim.restore(JSON.stringify(raw));
  const s=restored.snapshot();
  assert.equal(s.expedition.houses.length,count);
  assert.equal(s.expedition.projects.entries.length,0);
  assert.equal(s.expedition.projects.cutoverTick,s.tick);
});

test("live explorer finances a camp through shifts, independent of Mira's housing job",()=>{
  const game=WorldSim.create(14);
  game.advance(600);
  let checkpoint=null;
  for(let n=0;n<3200;n++){
    const state=game.advance(1);
    const job=state.expedition.projects.entries.find(p=>
      p.type==="camp"&&p.status==="active"&&p.progress>0);
    if(job){checkpoint=state;break;}
  }
  assert.ok(checkpoint,"the explorer must autonomously begin constructing a real camp");
  const p=checkpoint.expedition.projects.entries.find(p=>p.type==="camp");
  assert.equal(p.initiator,"world_taren");
  assert.equal(p.required,4);
  assert.ok(p.progress>=1&&p.progress<4);
  assert.equal(checkpoint.expedition.camps.length,0,
    "partial labor never produces a fully formed building");
  assert.equal(checkpoint.expedition.woodSpent,p.progress);
  assert.deepEqual(WorldSim.restore(game.serialize()).snapshot(),checkpoint);
  const later=game.advance(100);
  assert.ok(later.expedition.camps.length>0);
  assert.ok(later.expedition.projects.entries.some(p=>
    p.type==="camp"&&p.status==="complete"));
  assert.ok(later.expedition.settlers.length>0,
    "Mira should enter only after a physical shelter is actually built");
  assert.deepEqual(WorldSim.restore(game.serialize()).snapshot(),later);
});
