"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const V3=require("../src/v3/sim.js");
test("isolated V3 identity and exactly one living autonomous citizen",()=>{
  assert.equal(V3.STORAGE_KEY,"godseed-v3-prototype-v1");
  assert.notEqual(V3.STORAGE_KEY,"godseed-one-small-life-v1");
  assert.equal(V3.VERSION,3);
  const s=V3.create(14).snapshot();
  assert.equal(s.citizens.length,1);
  assert.equal(s.citizens[0].name,"Aria");
  assert.equal(s.citizens[0].alive,true);
  assert.equal(s.citizens[0].health,100);
  assert.equal(s.citizens[0].hunger,85);
  assert.throws(()=>V3.create(-1),RangeError);
});
test("100 seed worlds: Aria autonomously eats, rests, collects and builds",()=>{
  for(let seed=1;seed<=100;seed++){
    const game=V3.create(seed),other=V3.create(seed),before=game.snapshot();
    const state=game.advance(1500);
    assert.deepEqual(state,other.advance(1500),"determinism "+seed);
    assert.equal(state.citizens.length,1);
    assert.equal(state.citizens[0].alive,true,"living "+seed);
    assert.equal(state.structures.length,1,"shelter "+seed);
    assert.equal(state.spent,4);
    assert.equal(state.wood,4,"wood reserve "+seed);
    assert.equal(state.harvested,8);
    assert.equal(state.harvested+state.forest.length,before.forest.length);
    assert.equal(state.harvested,state.citizens[0].harvested);
    assert.equal(state.food,state.foodGathered-state.foodEaten);
    assert.ok(state.foodEaten>0&&state.foodGathered>0,"feeding "+seed);
    assert.ok(state.forest.length>0,"avoid deforestation "+seed);
    assert.equal(V3.validate(state),true,"valid "+seed);
    assert.deepEqual(V3.restore(game.serialize()).snapshot(),state,"save "+seed);
  }
});
test("long running 10000 tick survival remains renewable and deterministic",()=>{
  const a=V3.create(14),b=V3.create(14);
  a.advance(10000);
  for(let i=0;i<50;i++)b.advance(200);
  const s=a.snapshot();
  assert.deepEqual(s,b.snapshot());
  assert.equal(s.citizens[0].alive,true);
  assert.ok(s.citizens[0].health>0);
  assert.ok(s.foodEaten>100);
  assert.ok(s.foodGrown>0);
  assert.equal(s.foodGathered+s.bushes.reduce((n,x)=>n+x.berries,0),12+s.foodGrown);
  assert.equal(s.structures.length,1);
  assert.equal(V3.validate(s),true);
});
test("restore V3 schema 1, retaining exact resources and Bran's archived contribution",()=>{
  const now=V3.create(23).advance(500);
  const a=JSON.parse(JSON.stringify(now));
  const legacy={schemaVersion:1,seed:a.seed,tick:a.tick,
    citizens:[
      {id:"sim_aria",name:"Aria",trait:"explorer",x:a.citizens[0].x,z:a.citizens[0].z,energy:a.citizens[0].energy,harvested:a.harvested-2,goal:"cuidar refugio"},
      {id:"sim_bran",name:"Bran",trait:"builder",x:6,z:4,energy:20,harvested:2,goal:"fundar"}],
    forest:a.forest,wood:a.wood,harvested:a.harvested,spent:a.spent,
    structures:a.structures,events:[{tick:100,actor:"sim_bran",action:"harvest",details:{woodProduced:1}}]};
  const restored=V3.restore(JSON.stringify(legacy)).snapshot();
  assert.equal(restored.schemaVersion,3);
  assert.equal(restored.citizens.length,1);
  assert.equal(restored.legacyHarvested,2);
  assert.equal(restored.citizens[0].harvested,a.harvested-2);
  assert.equal(restored.wood,a.wood);
  assert.deepEqual(restored.forest,a.forest);
  assert.deepEqual(restored.structures,a.structures);
  assert.equal(restored.tick,a.tick);
  assert.equal(restored.events[0].actor,"sim_bran");
  assert.equal(V3.validate(restored),true);
  assert.equal(V3.validate(V3.restore(JSON.stringify(legacy)).advance(100)),true);
});
test("invalid food ledgers and contaminated saves fail closed",()=>{
  const game=V3.create(33);game.advance(300);
  const expected=game.snapshot();
  const stolen=game.snapshot();stolen.citizens[0].health=0;stolen.food=999;
  assert.deepEqual(game.snapshot(),expected);
  for(const field of ["food","foodGathered","foodGrown","legacyHarvested"]){
    const state=game.snapshot();state[field]+=1;
    assert.throws(()=>V3.restore(JSON.stringify(state)),RangeError,field);
  }
  const dead=game.snapshot();dead.citizens[0].alive=false;
  assert.throws(()=>V3.restore(JSON.stringify(dead)),RangeError);
  assert.throws(()=>V3.restore("not json"));
  assert.throws(()=>V3.restore("x".repeat(64001)),RangeError);
  assert.throws(()=>game.advance(-1),RangeError);
  assert.throws(()=>game.advance(20001),RangeError);
});
test("different update cadence never changes authoritative state",()=>{
  const once=V3.create(2026),many=V3.create(2026);
  once.advance(240);
  for(let i=0;i<240;i++)many.advance(1);
  assert.deepEqual(once.snapshot(),many.snapshot());
});


test("personality affects exploration and prudence without player commands",()=>{
  const careful=V3.create(14).snapshot(),adventurous=V3.create(14).snapshot();
  const cautiousMind=careful.citizens[0].mind;
  const activeMind=adventurous.citizens[0].mind;
  assert.equal(typeof activeMind.personality.curiosity,"number");
  assert.notEqual(V3.create(14).snapshot().citizens[0].mind.personality.curiosity,
    V3.create(15).snapshot().citizens[0].mind.personality.curiosity);
  const n=V3.create(14).advance(1400);
  const m=n.citizens[0].mind;
  assert.ok(m.memories.length>=3,"must retain autobiographical events");
  assert.ok(m.memories.some(x=>x.kind==="build"),"foundation remembered");
  assert.ok(m.memories.some(x=>x.kind==="eat"),"first meal remembered");
  assert.ok(m.skills.foraging>0,"learned from gathering");
  assert.ok(m.visited.length>=3,"real places remembered");
  assert.equal(V3.validate(n),true);
});
test("stress causes deliberate reflection, with persisted emotional consequence",()=>{
  const game=V3.create(14);
  const mature=game.advance(750);
  const state=JSON.parse(JSON.stringify(mature));
  const c=state.citizens[0];
  c.x=5;c.z=5;c.energy=20;c.hunger=95;
  c.mind.emotions.stress=90;
  c.mind.visited.push(5+5*V3.SIZE);
  c.mind.visited=[...new Set(c.mind.visited)];
  state.food=Math.max(state.food,5);
  state.foodGathered=state.food+state.foodEaten;
  state.foodGrown=state.foodGathered+state.bushes.reduce((n,b)=>n+b.berries,0)-12;
  assert.equal(V3.validate(state),true);
  const restored=V3.restore(JSON.stringify(state)),next=restored.advance(1);
  assert.equal(next.citizens[0].goal,"reflexionar en refugio");
  assert.ok(next.citizens[0].mind.emotions.stress<90);
  assert.equal(next.citizens[0].mind.reflections,state.citizens[0].mind.reflections+1);
  assert.deepEqual(V3.restore(restored.serialize()).snapshot(),next);
});
test("V3 v2 save migrates without changing survival counters or world resources",()=>{
  const current=V3.create(42).advance(300);
  const legacy=JSON.parse(JSON.stringify(current));
  legacy.schemaVersion=2;
  // A historical v2 save cannot contain the sleep event added in this version.
  legacy.events=legacy.events.filter(e=>e.action!=="sleep");
  delete legacy.citizens[0].mind;
  const loaded=V3.restore(JSON.stringify(legacy)).snapshot();
  assert.equal(loaded.schemaVersion,3);
  assert.equal(loaded.tick,legacy.tick);
  assert.equal(loaded.wood,legacy.wood);
  assert.equal(loaded.food,legacy.food);
  assert.equal(loaded.citizens[0].health,legacy.citizens[0].health);
  assert.equal(loaded.citizens[0].hunger,legacy.citizens[0].hunger);
  assert.equal(loaded.citizens[0].harvested,legacy.citizens[0].harvested);
  assert.deepEqual(loaded.forest,legacy.forest);
  assert.ok(loaded.citizens[0].mind.skills.foraging>0);
  assert.equal(V3.validate(loaded),true);
});
test("memory stays bounded and tampering is rejected across 20k ticks",()=>{
  for(const seed of [1,14,42,100,65535]){
    const game=V3.create(seed);game.advance(20000);
    const s=game.snapshot();
    assert.equal(s.citizens[0].alive,true);
    assert.ok(s.citizens[0].mind.memories.length<=20);
    assert.ok(s.citizens[0].mind.visited.length<=400);
    assert.ok(game.serialize().length<64000);
    assert.deepEqual(V3.restore(game.serialize()).snapshot(),s);
    const corrupt=game.snapshot();
    corrupt.citizens[0].mind.memories[0].tick=s.tick+1;
    assert.equal(V3.validate(corrupt),false);
    assert.throws(()=>V3.restore(JSON.stringify(corrupt)),RangeError);
  }
});

test("derived world clock never changes saves and rolls through all four periods",()=>{
  assert.equal(V3.DAY_LENGTH,160);
  assert.deepEqual(V3.dayInfo(0),{day:1,phase:"amanecer",hour:0});
  assert.equal(V3.dayInfo(24).phase,"día");
  assert.equal(V3.dayInfo(104).phase,"atardecer");
  assert.equal(V3.dayInfo(120).phase,"noche");
  assert.deepEqual(V3.dayInfo(160),{day:2,phase:"amanecer",hour:0});
  assert.throws(()=>V3.dayInfo(-1),RangeError);
});
test("Aria chooses to return home and sleep at night while preserving survival",()=>{
  for(const seed of [1,14,42,100,2026]){
    const g=V3.create(seed),full=V3.create(seed);
    let slept=0, walkedHome=0;
    for(let i=0;i<1800;i++){
      const state=g.advance(1),c=state.citizens[0];
      if(c.goal==="dormir"){
        slept++;
        assert.equal(V3.dayInfo(state.tick).phase,"noche");
        assert.equal(state.structures.length,1);
        assert.ok(Math.abs(c.x-5)+Math.abs(c.z-5)<=1);
      }
      if(c.goal==="regresar a dormir")walkedHome++;
    }
    const final=g.snapshot();
    assert.ok(slept>0,"Aria must sleep autonomously in seed "+seed);
    assert.ok(final.citizens[0].alive,"Aria survives seed "+seed);
    assert.equal(final.citizens.length,1);
    assert.equal(V3.validate(final),true);
    assert.deepEqual(final,full.advance(1800),"deterministic day/night state "+seed);
    assert.deepEqual(V3.restore(g.serialize()).snapshot(),final);
  }
});
