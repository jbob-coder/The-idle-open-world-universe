const test=require("node:test");
const assert=require("node:assert/strict");
const Sim=require("../src/sim.js");
const Spaces=require("../src/world/interiors.js");

const building=(s,town=0,index=0)=>s.living.towns[town].buildings[index];
function doorway(b,orientation="south") {
  const W=b.w*2,H=b.h*2;
  if(orientation==="south")return {orientation,
    thresholdWorld:{x:b.x,y:b.y+b.h-1},approachWorld:{x:b.x,y:b.y+b.h},
    thresholdInside:{x:1,y:H-1},safeArrivalInside:{x:1,y:H-2}};
  if(orientation==="north")return {orientation,
    thresholdWorld:{x:b.x,y:b.y},approachWorld:{x:b.x,y:b.y-1},
    thresholdInside:{x:1,y:0},safeArrivalInside:{x:1,y:1}};
  if(orientation==="east")return {orientation,
    thresholdWorld:{x:b.x+b.w-1,y:b.y},approachWorld:{x:b.x+b.w,y:b.y},
    thresholdInside:{x:W-1,y:1},safeArrivalInside:{x:W-2,y:1}};
  return {orientation:"west",
    thresholdWorld:{x:b.x,y:b.y},approachWorld:{x:b.x-1,y:b.y},
    thresholdInside:{x:0,y:1},safeArrivalInside:{x:1,y:1}};
}
function room(s,b,items=[],orientation="south") {
  return Spaces.register(s.spaces,s.living,b.id,{
    template:"medieval/family/v1",entrance:doorway(b,orientation),
    furniture:items,revision:1
  });
}
const bed={id:"bed_1",kind:"bed",x:2,y:1,w:1,h:1};

test("legacy v1 saves without spaces restore exterior progress exactly",()=>{
  const s=Sim.create(41);
  for(let i=0;i<312;i++)Sim.tick(s);
  const old=JSON.parse(Sim.serialize(s));
  delete old.spaces;
  const before=JSON.parse(JSON.stringify({
    tick:old.tick,day:old.day,bot:old.bot,worldSeed:old.worldSeed,
    map:old.map,faith:old.faith,chapter:old.chapter,chapterTwo:old.chapterTwo,
    finale:old.finale
  }));
  const restored=Sim.restore(JSON.stringify(old));
  assert.ok(restored);
  assert.equal(restored.version,1);
  assert.deepEqual(restored.spaces,Spaces.empty());
  assert.deepEqual({
    tick:restored.tick,day:restored.day,bot:restored.bot,worldSeed:restored.worldSeed,
    map:restored.map,faith:restored.faith,chapter:restored.chapter,
    chapterTwo:restored.chapterTwo,finale:restored.finale
  },before);
});

test("two real existing buildings persist distinct interior IDs, items and correct return anchors",()=>{
  const s=Sim.create(2026);
  const house=building(s,0,0),second=building(s,1,0);
  assert.notEqual(house.id,second.id);
  assert.equal(s.spaces.version,1);
  const before=[s.bot.x,s.bot.y,s.tick,s.faith];
  room(s,house,[bed]);room(s,second,[]);
  assert.deepEqual([s.bot.x,s.bot.y,s.tick,s.faith],before,
    "registering room data must not teleport/control Nim or advance the world");
  assert.deepEqual(Object.keys(s.spaces.interiors).sort(),
    ["interior:"+house.id,"interior:"+second.id].sort());
  const save=Sim.serialize(s),reloaded=Sim.restore(save);
  assert.ok(reloaded);
  assert.equal(reloaded.version,1);
  assert.deepEqual(reloaded.spaces,s.spaces);
  assert.equal(Spaces.find(reloaded.spaces,"interior:"+house.id).furniture[0].kind,"bed");
  assert.deepEqual(Spaces.find(reloaded.spaces,"interior:"+second.id).entrance.approachWorld,
    {x:second.x,y:second.y+second.h});
  assert.equal(Sim.serialize(reloaded),save);
});

test("4x4 external family home is 8x8 metres/64m2 and each furnishing uses 1m grid",()=>{
  const b={id:"future_family",x:10,y:10,w:4,h:4};
  const living={towns:[{buildings:[b]}]};
  const spaces=Spaces.empty(),entry=Spaces.register(spaces,living,b.id,{
    template:"medieval/family/v1",entrance:doorway(b),
    furniture:[{id:"table_1",kind:"table",x:4,y:3,w:2,h:2}]
  });
  assert.deepEqual(entry.grid,{width:8,height:8,metersPerCell:1});
  assert.equal(entry.grid.width*entry.grid.height,b.w*b.h*4);
  assert.equal(entry.furniture[0].w*entry.furniture[0].h,4);
  assert.equal(entry.safeZone,true);
  assert.equal(Spaces.restore(spaces,living).interiors[entry.id].grid.width,8);
});

test("four cardinal entrances preserve correct paired outside/inside anchors",()=>{
  const b={id:"stone_tavern",x:10,y:12,w:6,h:5};
  const l={towns:[{buildings:[b]}]};
  for(const side of ["north","south","east","west"]){
    const spaces=Spaces.empty();
    const entry=Spaces.register(spaces,l,b.id,{entrance:doorway(b,side)});
    assert.equal(entry.entrance.orientation,side);
    assert.deepEqual(Spaces.restore(spaces,l).interiors[entry.id],entry);
  }
});

test("return points, furniture, exterior ID and collision geometry reject invalid inputs atomically",()=>{
  const s=Sim.create(17),b=building(s);
  const good=room(s,b,[bed]);
  const saved=JSON.stringify(s.spaces);
  const badDoor=doorway(b);badDoor.approachWorld.x+=1;
  for(const spec of [
    {entrance:badDoor},
    {entrance:{...doorway(b),safeArrivalInside:{x:0,y:0}}},
    {entrance:doorway(b),furniture:[{id:"bed",kind:"bed",x:1,y:2,w:1,h:1}]},
    {entrance:doorway(b),furniture:[bed,bed]},
    {entrance:doorway(b),furniture:[{...bed,x:500}]},
    {entrance:doorway(b),revision:-1}
  ]) {
    assert.throws(()=>Spaces.register(s.spaces,s.living,b.id,spec));
    assert.equal(JSON.stringify(s.spaces),saved);
  }
  assert.throws(()=>Spaces.register(s.spaces,s.living,"unknown_home",
    {entrance:doorway(b)}),/missing/);
  assert.deepEqual(Spaces.find(s.spaces,good.id),good);
});

test("damaged optional room drops only its own record; Nim and another room survive",()=>{
  const s=Sim.create(91);
  Sim.tick(s);Sim.tick(s);
  const one=building(s,0),two=building(s,1);
  room(s,one,[bed]);room(s,two);
  const original=JSON.parse(Sim.serialize(s));
  const damaged=JSON.parse(JSON.stringify(original));
  damaged.spaces.interiors["interior:"+one.id].furniture[0].x=999;
  const r=Sim.restore(JSON.stringify(damaged));
  assert.ok(r);
  assert.equal(r.tick,original.tick);
  assert.equal(r.bot.level,original.bot.level);
  assert.deepEqual(r.map,original.map);
  assert.equal(Spaces.find(r.spaces,"interior:"+one.id),null);
  assert.ok(Spaces.find(r.spaces,"interior:"+two.id));
  // A malformed optional spaces root must never invalidate the whole v1 save.
  damaged.spaces={version:555,interiors:[]};
  const fallback=Sim.restore(JSON.stringify(damaged));
  assert.ok(fallback);
  assert.deepEqual(fallback.spaces,Spaces.empty());
  assert.equal(fallback.worldSeed,s.worldSeed);
});

test("stale and duplicate building identities do not reattach furniture to another house",()=>{
  const s=Sim.create(4),b=building(s);
  const entry=room(s,b,[bed]);
  const save=JSON.parse(Sim.serialize(s));
  save.spaces.interiors[entry.id].buildingId="ghost_home";
  assert.equal(Spaces.find(Sim.restore(JSON.stringify(save)).spaces,entry.id),null);
  const dupe=Sim.create(4);
  const existing=building(dupe,0),other=building(dupe,1);
  other.id=existing.id;
  assert.throws(()=>room(dupe,existing),/ambiguous/);
  assert.deepEqual(dupe.spaces,Spaces.empty());
});

test("read-only retrieved rooms cannot mutate saves; bounded room count and furniture",()=>{
  const s=Sim.create(41),b=building(s);
  const entry=room(s,b,[bed]);
  const pulled=Spaces.find(s.spaces,entry.id);
  pulled.furniture[0].kind="poison";pulled.entrance.approachWorld.x=99999;
  assert.deepEqual(Spaces.find(s.spaces,entry.id),entry);
  assert.equal(Spaces.find(s.spaces,"interior:__proto__"),null);

  const buildings=Array.from({length:Spaces.MAX_INTERIORS+1},(_,i)=>({
    id:"home_"+i,x:i*10,y:10,w:2,h:2
  }));
  const living={towns:[{buildings:buildings.slice(0,20)},
                       {buildings:buildings.slice(20)}]};
  // The catalog is intentionally bounded to 32 buildings per town.
  const spaces=Spaces.empty();
  for(let i=0;i<Spaces.MAX_INTERIORS;i++)
    Spaces.register(spaces,living,buildings[i].id,{entrance:doorway(buildings[i])});
  assert.equal(Object.keys(spaces.interiors).length,Spaces.MAX_INTERIORS);
  assert.throws(()=>Spaces.register(spaces,living,buildings[Spaces.MAX_INTERIORS].id,
    {entrance:doorway(buildings[Spaces.MAX_INTERIORS])}),/quota/);
  const b0=buildings[0];
  assert.throws(()=>Spaces.register(spaces,living,b0.id,{
    entrance:doorway(b0),furniture:Array.from({length:Spaces.MAX_FURNITURE+1},
    (_,i)=>({id:"bed_"+i,kind:"bed",x:1,y:1,w:1,h:1}))
  }),/count/);
});

test("after long autonomous play the v1 world and optional multi-room save remain bounded",()=>{
  const s=Sim.create(3026);
  const b=building(s);
  room(s,b,[bed]);
  for(let i=0;i<1200;i++)Sim.tick(s);
  const raw=Sim.serialize(s);
  assert.ok(raw.length<1000000);
  const restored=Sim.restore(raw);
  assert.ok(restored);
  assert.ok(Spaces.find(restored.spaces,"interior:"+b.id));
  assert.equal(restored.version,1);
  assert.equal(restored.tick,s.tick);
  assert.ok(Sim.validate(restored));
});
