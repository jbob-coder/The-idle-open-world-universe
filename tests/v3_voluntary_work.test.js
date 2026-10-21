"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const Projects=require("../src/v3/projects.js");
const Agency=require("../src/v3/agency.js");

function person(id,options={}){
  const x=options.x??9,z=options.z??9;
  const mind=Agency.create(id,x,z);
  mind.preferences.craftsmanship=options.craftsmanship??83;
  mind.preferences.security=options.security??32;
  return {id,x,z,alive:true,bornAt:1,wood:options.wood??5,
    food:options.food??5,energy:options.energy??20,
    hunger:options.hunger??90,mind};
}

test("two willing NPCs choose the same real work site and individually pay for labor",()=>{
  const jobs=Projects.create();
  const mira=person("world_mira",{wood:1});
  const taren=person("world_taren",{wood:3});
  const plot={x:9,z:9};
  const home=Projects.propose(jobs,"home",plot,mira.id,10);
  const tie={ties:[{a:taren.id,b:mira.id,trust:42}]};
  assert.equal(Projects.contribute(jobs,home,mira,11).worked,true);
  const serialized=JSON.stringify(jobs);
  const opportunity=Projects.chooseVoluntaryWork(jobs,taren,tie,12,["home"]);
  assert.deepEqual({id:opportunity.id,type:opportunity.type,x:opportunity.x,z:opportunity.z},
    {id:home.id,type:"home",x:9,z:9});
  assert.equal(JSON.stringify(jobs),serialized,"scoring may not mutate world state");
  assert.equal(Projects.contribute(jobs,home,taren,12).completed,false);
  assert.equal(Projects.contribute(jobs,home,taren,13).completed,false);
  assert.equal(Projects.contribute(jobs,home,taren,14).completed,true);
  assert.equal(taren.wood,0);
  assert.equal(mira.wood,0);
  assert.equal(home.contributors.find(c=>c.id===taren.id).units,3);
  assert.equal(home.contributors.find(c=>c.id===mira.id).units,1);
  assert.equal(Projects.validate(JSON.parse(JSON.stringify(jobs)),14,
    [{x:9,z:9,completedAt:14}],[],[mira,taren]),4);
  assert.equal(Projects.chooseVoluntaryWork(jobs,taren,tie,15,["home"]),null);
});

test("voluntary construction requires actual relationship, safety and physical resources",()=>{
  const jobs=Projects.create();
  const owner=person("builder",{wood:1});
  const helper=person("visitor",{wood:2});
  const work=Projects.propose(jobs,"home",{x:9,z:9},owner.id,10);
  const friends={ties:[{a:owner.id,b:helper.id,trust:44}]};
  const select=()=>Projects.chooseVoluntaryWork(jobs,helper,friends,11,["home"]);
  assert.ok(select());
  assert.equal(Projects.chooseVoluntaryWork(jobs,helper,{ties:[]},11,["home"]),null);
  friends.ties[0].trust=20;
  assert.equal(select(),null);
  friends.ties[0].trust=44;
  helper.x=50;
  assert.equal(select(),null,"no magically assigned distant labor");
  helper.x=9;
  helper.hunger=50;
  assert.equal(select(),null,"hungry NPC is free to prioritize survival");
  helper.hunger=90;helper.energy=2;
  assert.equal(select(),null,"exhaustion blocks volunteering");
  helper.energy=20;helper.wood=0;
  assert.equal(select(),null,"unfunded work must not be promised");
  helper.wood=2;helper.food=1;
  assert.equal(select(),null,"food security takes priority over outside work");
  helper.food=5;helper.alive=false;
  assert.equal(select(),null);
  helper.alive=true;
  assert.equal(select()?.id,work.id);
});

test("workers choose work from competing actual projects, not a fixed NPC itinerary",()=>{
  const jobs=Projects.create();
  const worker=person("worker",{x:0,z:0,wood:2});
  const a=person("alice"),b=person("bob");
  Projects.propose(jobs,"road",{x:1,z:0},a.id,5);
  Projects.propose(jobs,"home",{x:6,z:0},b.id,6);
  const ties={ties:[{a:worker.id,b:a.id,trust:30},
    {a:worker.id,b:b.id,trust:85}]};
  const choice=Projects.chooseVoluntaryWork(jobs,worker,ties,12);
  assert.equal(choice.type,"home","trust may outweigh travel distance");
  ties.ties[1].trust=23;
  const changed=Projects.chooseVoluntaryWork(jobs,worker,ties,12);
  assert.equal(changed.type,"road","a weaker personal tie changes the decision");
  assert.equal(jobs.entries.every(p=>p.progress===0),true,
    "decisions do not automatically spend resources or construct a road");
});

test("trusted helper can opt to gather wood for a nearby unfinished project without creating resources",()=>{
  const jobs=Projects.create();
  const owner=person("homeowner",{x:9,z:9});
  const helper=person("local_traveler",{x:11,z:9,wood:0,craftsmanship:88,security:25});
  const order=Projects.propose(jobs,"home",{x:9,z:9},owner.id,30);
  const social={ties:[{a:helper.id,b:owner.id,trust:65}]};
  assert.equal(Projects.chooseVoluntaryWork(jobs,helper,social,31,["home"]),null,
    "without a gathering plan zero timber must prevent labor");
  const offer=Projects.chooseVoluntaryWork(jobs,helper,social,31,["home"],true);
  assert.ok(offer,"the worker can choose to search for supplies");
  assert.equal(offer.needsWood,true);
  assert.equal(offer.id,order.id);
  assert.equal(order.progress,0,"a plan is not a completed work shift");
  assert.equal(Projects.contribute(jobs,order,helper,32).worked,false,
    "resource scarcity must remain enforceable by the construction engine");
  helper.wood=1;helper.x=9;
  const funded=Projects.chooseVoluntaryWork(jobs,helper,social,33,["home"],true);
  assert.equal(funded.needsWood,false);
  assert.equal(Projects.contribute(jobs,order,helper,33).worked,true);
  assert.equal(helper.wood,0);
  assert.equal(Projects.validate(jobs,33,[],[],[owner,helper]),1);
  helper.hunger=30;
  assert.equal(Projects.chooseVoluntaryWork(jobs,helper,social,34,["home"],true),null,
    "survival always permits the volunteer to reconsider");
});

test("homeowners remember receiving an assisted home without claiming they performed every shift",()=>{
  const owner=person("owner");
  Agency.remember(owner.mind,10,"settler_home_completed",
    {id:"frontier_home_1",helpedBy:"traveler"});
  for(let i=0;i<22;i++)
    Agency.remember(owner.mind,20+i*21,"settler_forage",{amount:1});
  assert.ok(owner.mind.memories.some(m=>
    m.action==="settler_home_completed"&&m.tick===10),
    "routine survival activity must not erase the assisted home-founding event");
  assert.ok(owner.mind.memories.length<=Agency.MAX_MEMORIES);
  assert.equal(Agency.validate(owner.mind,500),true);
});
