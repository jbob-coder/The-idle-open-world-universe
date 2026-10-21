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
  assert.equal(s.structures.length,4);
  assert.equal(s.outpost.status,"established");
  assert.ok(s.citizens.every(c=>c.alive));
  assert.ok(s.settlement.elections>=1);
  assert.ok(s.events.length<=96);
  assert.ok(game.serialize().length<64000);
  assert.equal(Sim.validate(s),true);
  assert.deepEqual(Sim.restore(game.serialize()).snapshot(),s);
});


test("the elected leader delegates three different jobs with observable results in 100 worlds",()=>{
  for(let seed=1;seed<=100;seed++){
    const game=Sim.create(seed),s=game.advance(2000);
    const roles=Object.fromEntries(s.citizens.map(c=>[c.role,c]));
    assert.equal(s.schemaVersion,3);
    assert.equal(s.settlement.orders.length,3);
    assert.deepEqual(Object.keys(roles).sort(),["builder","forager","steward"]);
    assert.equal(roles.steward.id,s.settlement.leaderId);
    assert.ok(roles.builder.settled&&roles.forager.settled);
    assert.ok(roles.builder.ordersCompleted>0,"builder actually harvested seed "+seed);
    assert.ok(roles.forager.ordersCompleted>0,"forager actually gathered seed "+seed);
    assert.ok(roles.steward.ordersCompleted>0,"steward actually talked seed "+seed);
    assert.ok(roles.forager.foraged>0);
    assert.ok(s.settlement.policy!=="none"&&s.settlement.policiesSet>=1);
    assert.ok(s.settlement.policyReason.includes("food="));
    assert.ok(s.settlement.orders.every(o=>o.leaderId===s.settlement.leaderId));
    assert.ok(s.citizens.every(c=>c.memories.length>0&&c.memories.length<=12));
    assert.equal(Sim.validate(s),true,"new schema seed "+seed);
    assert.deepEqual(Sim.restore(game.serialize()).snapshot(),s);
  }
});

test("authentic schema-1 society save migrates without changing historical people or world",()=>{
  const fs=require("node:fs"),path=require("node:path");
  const raw=fs.readFileSync(path.join(__dirname,"fixtures/v3_society_schema1_seed14.json"),"utf8");
  const previous=JSON.parse(raw);
  assert.equal(previous.schemaVersion,1);
  assert.equal(previous.citizens.length,3);
  assert.ok(previous.settlement.leaderId);
  const game=Sim.restore(raw),s=game.snapshot();
  assert.equal(s.schemaVersion,3);
  for(const name of ["tick","wood","food","harvested","spentWood","foodGathered","foodEaten"])
    assert.equal(s[name],previous[name],"retain "+name);
  assert.deepEqual(s.forest,previous.forest);
  assert.deepEqual(s.structures,previous.structures);
  assert.equal(s.settlement.leaderId,previous.settlement.leaderId);
  assert.deepEqual(s.settlement.ballots,previous.settlement.ballots);
  assert.deepEqual(s.events,previous.events);
  assert.equal(s.settlement.orders.length,0,"orders cannot be retroactively invented");
  assert.ok(s.citizens.every(c=>c.role==="unassigned"&&c.memories.length===0));
  assert.equal(Sim.validate(s),true);
  assert.deepEqual(Sim.restore(game.serialize()).snapshot(),s);
  const next=game.advance(1);
  assert.equal(next.settlement.orders.length,3,"historical leader appoints on next tick");
  assert.ok(next.settlement.policy!=="none");
  assert.ok(next.citizens.every(c=>c.role!=="unassigned"));
  assert.equal(Sim.validate(next),true);
  const bad=JSON.parse(raw);bad.wood+=3;
  assert.throws(()=>Sim.restore(JSON.stringify(bad)),RangeError);
});

test("political forgery, fake jobs and fabricated memories are rejected before save load",()=>{
  const game=Sim.create(14);game.advance(900);
  const actions=[
    s=>s.citizens[0].role="builder",
    s=>s.citizens[0].settled=false,
    s=>s.citizens[1].ordersCompleted=s.tick+1,
    s=>s.citizens[1].foraged=s.foodGathered+1,
    s=>s.citizens[1].memories.push({tick:s.tick+1,kind:"eat",subject:null}),
    s=>s.citizens[1].memories[0].kind="invented",
    s=>s.settlement.orders[0].citizenId=s.settlement.orders[1].citizenId,
    s=>s.settlement.orders[0].issuedAt=s.tick+1,
    s=>s.settlement.orders[0].role="ruler",
    s=>s.settlement.policy="magic",
    s=>s.settlement.policyTick=s.tick+1,
    s=>s.settlement.policyReason="x".repeat(101),
    s=>s.events.push({tick:s.tick,actor:"sim_aria",action:"miracle",details:{}})
  ];
  for(const mutate of actions){
    const tampered=game.snapshot();
    mutate(tampered);
    assert.equal(Sim.validate(tampered),false,mutate.toString());
    assert.throws(()=>Sim.restore(JSON.stringify(tampered)),RangeError);
  }
});

test("twenty thousand ticks preserve deterministic work, memory bounds and finite ecology",()=>{
  const once=Sim.create(42),chunks=Sim.create(42);
  const a=once.advance(20000);
  for(let i=0;i<100;i++)chunks.advance(200);
  assert.deepEqual(a,chunks.snapshot());
  assert.equal(a.wood+a.outpost.wood+a.outpost.cargoWood,
    a.harvested-a.craftedWood-a.spentWood);
  assert.equal(a.harvested+a.forest.length,Sim.create(42).snapshot().forest.length);
  assert.ok(a.settlement.elections>0&&a.settlement.ordersIssued>0);
  assert.ok(a.citizens.every(c=>c.alive&&c.memories.length<=12));
  assert.ok(once.serialize().length<64000);
  assert.equal(Sim.validate(a),true);
});


test("100 worlds found an actual second community after council approval and a travelled building",()=>{
  for(let seed=1;seed<=100;seed++){
    const sim=Sim.create(seed),before=sim.snapshot();
    const s=sim.advance(3600);
    const out=s.outpost,house=s.structures[3],founder=s.citizens.find(c=>c.id===out.founderId);
    assert.equal(s.schemaVersion,3);
    assert.equal(out.status,"established","outpost seed "+seed);
    assert.equal(s.structures.length,4);
    assert.equal(s.citizens.length,3,"the settlement must not create people");
    assert.equal(out.approvedBy,s.settlement.leaderId);
    assert.ok(out.approvedAt>=2400&&out.foundedAt>out.approvedAt);
    assert.deepEqual([house.id,house.x,house.z],["east_outpost",15,13]);
    assert.equal(house.builder,founder.id);
    assert.equal(founder.homeId,"village_02");
    assert.equal(s.citizens.filter(c=>c.homeId==="village_01").length,2);
    assert.ok(s.forest.every(t=>
      t.x<14||t.x>17||t.z<12||t.z>15),"no trees cross outpost structure "+seed);
    assert.ok(out.deliveries>=1,"physical courier delivery "+seed);
    assert.ok(s.events.length<=96);
    assert.equal(s.wood+out.wood+out.cargoWood,s.harvested-s.craftedWood-s.spentWood);
    assert.equal(s.food+out.food+(out.delivery?out.delivery.food:0),
      s.foodGathered-s.foodEaten);
    assert.equal(s.harvested+s.forest.length,before.forest.length);
    assert.ok(s.citizens.every(c=>c.alive),"all three survive seed "+seed);
    assert.equal(Sim.validate(s),true,"frontier conservation "+seed);
    assert.deepEqual(Sim.restore(sim.serialize()).snapshot(),s);
  }
});

test("schema-2 saves migrate exactly before new expedition and subsequently grow another community",()=>{
  const fs=require("node:fs"),path=require("node:path");
  const raw=fs.readFileSync(path.join(__dirname,"fixtures/v3_society_schema2_seed14.json"),"utf8");
  const before=JSON.parse(raw);
  assert.equal(before.schemaVersion,2);
  const sim=Sim.restore(raw),initial=sim.snapshot();
  assert.equal(initial.schemaVersion,3);
  assert.equal(initial.outpost.status,"unfounded");
  for(const key of ["tick","wood","food","harvested","spentWood","foodGathered","foodEaten"])
    assert.equal(initial[key],before[key],"migrated "+key);
  assert.deepEqual(initial.forest,before.forest);
  assert.deepEqual(initial.structures,before.structures);
  assert.deepEqual(initial.settlement,before.settlement);
  assert.deepEqual(initial.events,before.events);
  assert.ok(initial.citizens.every(c=>c.homeId==="village_01"));
  assert.equal(Sim.validate(initial),true);
  const later=sim.advance(350);
  assert.equal(later.outpost.status,"established");
  assert.equal(later.structures.length,4);
  assert.equal(Sim.validate(later),true);
  assert.deepEqual(Sim.restore(sim.serialize()).snapshot(),later);
  const stolen=JSON.parse(raw);stolen.wood++;
  assert.throws(()=>Sim.restore(JSON.stringify(stolen)),RangeError);
});

test("reserve accounts, forged couriers and historical founder IDs fail closed",()=>{
  const game=Sim.create(14);game.advance(3600);
  const corruptions=[
    s=>s.outpost.wood++,
    s=>s.outpost.food++,
    s=>s.outpost.deliveries=-1,
    s=>s.outpost.deliveries++,
    s=>s.outpost.shipmentsDispatched++,
    s=>s.outpost.foodConsumed++,
    s=>s.outpost.shipmentsDispatched=-1,
    s=>s.outpost.founderId="sim_unknown",
    s=>s.outpost.approvedAt=s.tick+1,
    s=>s.outpost.foundedAt=s.outpost.approvedAt-1,
    s=>s.outpost.site.x=0,
    s=>s.structures[3].x=0,
    s=>s.citizens.find(c=>c.id===s.outpost.founderId).homeId="village_01",
    s=>s.outpost.cargoWood=4,
    s=>s.outpost.delivery={courierId:s.outpost.founderId,food:2,startedAt:s.tick},
    s=>s.outpost.delivery={courierId:"sim_elen",food:200,startedAt:s.tick}
  ];
  for(const corrupt of corruptions){
    const s=game.snapshot();corrupt(s);
    assert.equal(Sim.validate(s),false,corrupt.toString());
    assert.throws(()=>Sim.restore(JSON.stringify(s)),RangeError);
  }
});


test("expedition and subsequent courier deliveries require map travel, not instantaneous stock movement",()=>{
  const sim=Sim.create(14);
  let approved=null,founded=null,firstDispatch=null,firstDelivery=null;
  let pathSteps=0,preTravel=null;
  for(let i=0;i<2800;i++){
    const s=sim.advance(1),out=s.outpost;
    if(out.status==="travelling"&&!approved){
      approved={tick:out.approvedAt,wood:out.cargoWood,food:out.food};
      assert.equal(s.structures.length,3);
      preTravel=s.citizens.find(c=>c.id===out.founderId);
    }
    if(out.status==="travelling"&&preTravel){
      const c=s.citizens.find(c=>c.id===out.founderId);
      if(c.x!==preTravel.x||c.z!==preTravel.z)pathSteps++;
      preTravel=c;
    }
    if(out.status==="established"&&!founded){
      const c=s.citizens.find(c=>c.id===out.founderId);
      founded={tick:out.foundedAt,x:c.x,z:c.z};
      assert.equal(s.structures.length,4);
      assert.ok(Math.abs(c.x-15)+Math.abs(c.z-13)<=1);
    }
    if(out.delivery&&!firstDispatch)firstDispatch={tick:out.delivery.startedAt,food:s.food};
    if(out.deliveries>0&&!firstDelivery)firstDelivery={
      tick:s.tick,deliveries:out.deliveries,food:out.food,
      courier:s.citizens.find(c=>c.role==="forager")
    };
    if(firstDelivery)break;
  }
  assert.ok(approved&&founded&&firstDispatch&&firstDelivery);
  assert.ok(pathSteps>=8,"founder must travel between different map areas");
  assert.ok(founded.tick>approved.tick+8);
  assert.ok(firstDelivery.tick>firstDispatch.tick+8);
  assert.ok(Math.abs(firstDelivery.courier.x-15)+Math.abs(firstDelivery.courier.z-13)<=2,
    "courier has to be at the outpost when delivery is completed");
  const s=sim.snapshot(),o=s.outpost;
  assert.equal(o.shipmentsDispatched,o.deliveries+(o.delivery?1:0));
  assert.equal(o.food+(o.delivery?o.delivery.food:0)+o.foodConsumed,
    2+o.shipmentsDispatched*2);
  assert.equal(Sim.validate(s),true);
});
