"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const Chunks = require("../src/world/chunks.js");
const Store = require("../src/world/chunk_store.js");
const Travel = require("../src/world/chunk_travel.js");

function clearLane(store, fromX, toX, y) {
  for (let x=fromX;x<=toX;x++) store.setTile(x,y,Chunks.T.GRASS);
}
function actor(id, x, y, workX, workY, traits={}) {
  return {id,x,y,home:{x,y},work:{x:workX,y:workY},traits};
}

test("autonomous traveler crosses five signed chunk columns step-by-step without teleports", () => {
  const world = Store.create(41,{maxActive:4});
  clearLane(world,-1,131,1);
  const sim = Travel.create(world);
  sim.add(actor("nim",-1,1,131,1,{intelligence:90,caution:70,curiosity:80}));
  const chunks = new Set();
  let moves=0,arrived=false;
  for(let tick=0;tick<150;tick++) {
    for (const event of sim.tick()) {
      if(event.type!=="step")continue;
      moves++;
      assert.equal(Math.abs(event.from.x-event.to.x)+Math.abs(event.from.y-event.to.y),1);
      const p=Chunks.worldToChunk(event.to.x,event.to.y);
      assert.deepEqual([p.chunkX,p.chunkY],[event.chunk.chunkX,event.chunk.chunkY]);
      chunks.add(p.chunkX);
    }
    if(sim.inspect("nim").x===131){arrived=true;break;}
  }
  assert.equal(arrived,true);
  assert.equal(moves,132);
  assert.deepEqual([...chunks].sort((a,b)=>a-b),[0,1,2,3,4]);
  assert.ok(world.stats().activeChunks<=4);
  assert.equal(world.stats().modifiedChunks,6);
});

test("A-star bypasses water, stone and environmental hazards without cheating", () => {
  const world=Store.create(33);
  for(let y=-1;y<=1;y++)clearLane(world,0,8,y);
  world.setTile(2,0,Chunks.T.WATER);
  world.setTile(4,0,Chunks.T.STONE);
  const hazards=new Set(["6,0"]);
  const sim=Travel.create(world,{isHazard:(x,y)=>hazards.has(x+","+y)});
  sim.add(actor("mara",0,0,8,0,{caution:75,intelligence:90}));
  const visited=[];
  for(let i=0;i<30;i++){
    const events=sim.tick();
    for(const event of events)if(event.type==="step")visited.push(event.to.x+","+event.to.y);
    if(sim.inspect("mara").x===8&&sim.inspect("mara").y===0)break;
  }
  assert.deepEqual([sim.inspect("mara").x,sim.inspect("mara").y],[8,0]);
  for(const position of ["2,0","4,0","6,0"])assert.equal(visited.includes(position),false,position);
});

test("a newly discovered blocker invalidates the cached route on the next tick", () => {
  const world=Store.create(51);
  for(let y=-1;y<=1;y++)clearLane(world,0,11,y);
  const hazards=new Set();
  const sim=Travel.create(world,{isHazard:(x,y)=>hazards.has(x+","+y)});
  sim.add(actor("scout",0,0,11,0,{caution:70}));
  for(let i=0;i<3;i++)sim.tick();
  hazards.add("4,0");
  const positions=[];
  for(let i=0;i<25;i++){
    for(const e of sim.tick())if(e.type==="step")positions.push(e.to.x+","+e.to.y);
    if(sim.inspect("scout").x===11&&sim.inspect("scout").y===0)break;
  }
  assert.equal(positions.includes("4,0"),false);
  assert.deepEqual([sim.inspect("scout").x,sim.inspect("scout").y],[11,0]);
});

test("a completely blocked destination never moves the actor into solid terrain", () => {
  const world=Store.create(82);
  clearLane(world,0,5,0);
  world.setTile(5,0,Chunks.T.WATER);
  assert.equal(Travel.findRoute(world,{x:0,y:0},{x:5,y:0}).status,"blocked_destination");
  const sim=Travel.create(world);
  sim.add(actor("artisan",0,0,5,0));
  for(let i=0;i<20;i++) {
    const events=sim.tick();
    assert.ok(events.every(e=>e.type!=="step"||e.to.x!==5||e.to.y!==0));
  }
  assert.notDeepEqual([sim.inspect("artisan").x,sim.inspect("artisan").y],[5,0]);
});

test("save and restore preserve position, personality, autonomy and deterministic next steps", () => {
  const world=Store.create(41);
  clearLane(world,0,16,1);
  const sim=Travel.create(world);
  sim.add(actor("learner",0,1,16,1,{intelligence:100,caution:30,curiosity:80}));
  for(let i=0;i<6;i++)sim.tick();
  const saved=sim.serialize();
  const after=Travel.restore(world,saved);
  assert.equal(after.serialize(),saved);
  assert.equal(after.stats().time,6);
  for(let i=0;i<22;i++) {
    assert.deepEqual(after.tick(),sim.tick());
    assert.deepEqual(after.snapshot(),sim.snapshot());
  }
  assert.deepEqual(after.inspect("learner").traits,{curiosity:80,caution:30,intelligence:100});
});

test("multiple autonomous citizens decide destinations and advance without player input", () => {
  const world=Store.create(133);
  for(let y=0;y<=3;y++)clearLane(world,0,75,y);
  const sim=Travel.create(world);
  sim.add(actor("farmer",0,0,65,0,{intelligence:90}));
  sim.add(actor("artisan",1,3,70,3,{intelligence:60}));
  const original=[sim.inspect("farmer"),sim.inspect("artisan")];
  for(let i=0;i<80;i++)sim.tick();
  assert.notDeepEqual([sim.inspect("farmer").x,sim.inspect("farmer").y],[original[0].x,original[0].y]);
  assert.notDeepEqual([sim.inspect("artisan").x,sim.inspect("artisan").y],[original[1].x,original[1].y]);
  assert.equal(sim.stats().actors,2);
});

test("route search and active-chunk cache are bounded even for distant targets", () => {
  const world=Store.create(44,{maxActive:2});
  const plan=Travel.findRoute(world,{x:0,y:0},{x:9999,y:9999},{maxExpansions:60});
  assert.ok(plan.expanded<=60);
  assert.ok(plan.path.length<=Travel.MAX_ROUTE);
  assert.ok(world.stats().activeChunks<=2);
  assert.throws(()=>Travel.findRoute(world,{x:0,y:0},{x:1,y:1},{maxExpansions:100000}),RangeError);
  assert.throws(()=>Travel.create(world,{maxActors:100000}),RangeError);
  assert.throws(()=>Travel.create(world).add({id:"invalid",x:1000001,y:0}),RangeError);
});

test("travel is opt-in and cannot corrupt existing 64x48 version-1 save", () => {
  const Sim=require("../src/sim.js");
  const state=Sim.create(41),unchanged=Sim.serialize(state);
  const world=Store.create(state.worldSeed);
  // Keep all travel state separate from the live legacy simulation.
  let location={x:state.bot.x,y:state.bot.y};
  if([Chunks.T.WATER,Chunks.T.STONE].includes(world.tileAt(location.x,location.y))){
    for(let y=0;y<8;y++)for(let x=0;x<8;x++){
      if(![Chunks.T.WATER,Chunks.T.STONE].includes(world.tileAt(x,y))){location={x,y};break;}
    }
  }
  const traveler=Travel.create(world);
  traveler.add({id:"nim_bridge",...location,traits:{curiosity:70}});
  for(let i=0;i<20;i++)traveler.tick();
  assert.equal(Sim.serialize(state),unchanged);
  assert.deepEqual(Sim.restore(unchanged).map,state.map);
  assert.equal(state.version,1);
});


test("blocked actors back off instead of spending the full search budget each tick", () => {
  let sampled=0;
  const world={tileAt(x,y){sampled++;return x===5&&y===0?Chunks.T.WATER:Chunks.T.GRASS;},
    stats(){return {activeChunks:0};}};
  const sim=Travel.create(world);
  sim.add(actor("stuck",0,0,5,0));
  for(let i=0;i<48;i++)sim.tick();
  assert.equal(sim.inspect("stuck").x,0);
  assert.ok(sampled<40,"blocked citizen should not replan on every tick");
});

test("corrupt snapshots and excessive payloads are rejected without mutation", () => {
  const world=Store.create(13);
  clearLane(world,0,4,1);
  const sim=Travel.create(world);
  sim.add(actor("safe",0,1,4,1));
  const original=sim.serialize();
  assert.throws(()=>Travel.restore(world,"x".repeat(Travel.MAX_TRAVEL_SAVE_BYTES+1)),RangeError);
  const tampered=JSON.parse(original);
  tampered.citizens[0].id="bad id";
  assert.throws(()=>Travel.restore(world,tampered),RangeError);
  assert.equal(sim.serialize(),original);
});
