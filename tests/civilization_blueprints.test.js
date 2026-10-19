'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const B = require('../src/civilization/blueprints');

function world(w=50,h=50,terrain=B.T.GRASS) {
  return {width:w,height:h,tiles:new Uint8Array(w*h).fill(terrain),existingBuildings:[]};
}
function tile(w,x,y,t){w.tiles[y*w.width+x]=t;}
function withRoad(w,p){tile(w,p.entrance.approachWorld.x,p.entrance.approachWorld.y,B.T.ROAD);return w;}
function within(r,x,y){return x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;}

test('CIV-001 eight medieval blueprints have contract dimensions, metrics and materials',()=>{
  const sizes={cottage:[3,3],family_home:[4,4],large_home:[5,4],smithy:[5,5],
    tavern:[6,5],granary:[5,5],chapel:[6,6],communal_hall:[6,6]};
  assert.deepEqual(Object.keys(B.CATALOG).sort(),Object.keys(sizes).sort());
  for(const [id,[w,h]] of Object.entries(sizes)) {
    const p=B.planAt(id,10,10);
    assert.deepEqual([p.footprint.w,p.footprint.h],[w,h]);
    assert.equal(p.metrics.grossAreaM2,4*w*h);
    assert.equal(p.metrics.interiorWidthCells,w*2);
    assert.equal(p.metrics.interiorHeightCells,h*2);
    assert.equal(p.metrics.interiorUsefulAreaM2,(2*w-2)*(2*h-2));
    assert.equal(p.entrance.widthMeters,2);
    assert.equal(p.entrance.thresholdInside.length,2);
    assert.equal(p.entrance.safeArrivalInside.length,2);
    assert.ok(p.materials.wood>=0&&p.materials.stone>=0);
    assert.ok(B.CATALOG[id].styles.includes(p.style));
  }
  assert.equal(B.planAt('cottage',0,0).metrics.grossAreaM2,36);
  assert.equal(B.planAt('family_home',0,0).metrics.grossAreaM2,64);
});

test('CIV-001 all four doorway orientations have two safe 1m cells and valid approach',()=>{
  for(const orientation of ['north','south','east','west']) {
    const p=B.planAt('smithy',10,10,{orientation,style:'stone'});
    const e=p.entrance, a=e.edgeWorld, b=e.approachWorld;
    assert.equal(Math.abs(a.x-b.x)+Math.abs(a.y-b.y),1);
    assert.ok(within(p.footprint,a.x,a.y));
    assert.ok(!within(p.footprint,b.x,b.y));
    assert.equal(Math.abs(e.thresholdInside[0].x-e.thresholdInside[1].x)+
      Math.abs(e.thresholdInside[0].y-e.thresholdInside[1].y),1);
    for(let i=0;i<2;i++) {
      const inside=e.thresholdInside[i],safe=e.safeArrivalInside[i];
      assert.ok([inside,safe].every(q=>q.x>=0&&q.x<10&&q.y>=0&&q.y<10));
      assert.equal(Math.abs(inside.x-safe.x)+Math.abs(inside.y-safe.y),1);
    }
  }
});

test('CIV-001 refuses footprint overlap and duplicate IDs; proposal is immutable to source',()=>{
  const a=B.planAt('family_home',10,10,{buildingId:'home.1'});
  const w=withRoad(world(),a);
  assert.equal(B.validateSite(a,w).ok,true);
  const reserve=B.reserveSite(a,w);
  assert.equal(reserve.ok,true);
  assert.equal(w.existingBuildings.length,0);
  assert.equal(reserve.existingBuildings.length,1);
  const overlap=B.planAt('smithy',12,11,{buildingId:'forge.1'});
  assert.equal(B.validateSite(overlap,{...w,existingBuildings:reserve.existingBuildings}).reason,'building_overlap');
  const dupe=B.planAt('cottage',25,25,{buildingId:'home.1'});
  assert.equal(B.validateSite(dupe,{...withRoad(w,dupe),existingBuildings:reserve.existingBuildings}).reason,'duplicate_building_id');
  const clean=B.planAt('cottage',22,22,{orientation:'east',buildingId:'home.2'});
  assert.equal(B.validateSite(clean,{...withRoad(w,clean),existingBuildings:reserve.existingBuildings}).ok,true);
});

test('CIV-001 protects terrain, heritage and door approaches; requires road adjacency',()=>{
  const s=B.planAt('cottage',10,10);
  for(const bad of [B.T.WATER,B.T.RUIN,B.T.ROAD,B.T.SHRINE,B.T.CAMP,B.T.VILLAGE]) {
    const w=withRoad(world(),s);tile(w,11,11,bad);
    assert.equal(B.validateSite(s,w).reason,'unsafe_terrain');
  }
  const w=withRoad(world(),s);
  assert.equal(B.validateSite(s,{...w,isProtected:(x,y)=>x===10&&y===11}).reason,'protected_or_occupied');
  assert.equal(B.validateSite(s,{...w,isOccupied:(x,y)=>x===11&&y===13}).reason,'door_approach_blocked');
  assert.equal(B.validateSite(s,world()).reason,'road_access_required');
  assert.equal(B.validateSite(B.planAt('cottage',13,13),world(15,15)).reason,'out_of_bounds');
  const later=B.planAt('cottage',10,13,{orientation:'south'});
  assert.equal(B.validateSite(later,{...withRoad(world(),later),existingBuildings:[s]}).reason,'blocks_existing_door');
  assert.equal(B.validateSite(s,{...withRoad(world(),s),existingBuildings:[later]}).reason,'door_approach_blocked');
});

test('CIV-001 negative coordinates and finite offset windows use the same rules',()=>{
  const site=B.planAt('tavern',-36,-20,{orientation:'west'});
  const entry=site.entrance.approachWorld;
  assert.equal(B.validateSite(site,{tileAt:(x,y)=>x===entry.x&&y===entry.y?B.T.ROAD:B.T.MEADOW}).ok,true);
  const a=B.planAt('cottage',-16,-8,{orientation:'east'});
  const w={width:32,height:24,originX:-20,originY:-12,
    tiles:new Uint8Array(32*24).fill(B.T.MEADOW)};
  const bx=a.entrance.approachWorld.x+1,by=a.entrance.approachWorld.y;
  w.tiles[(by+12)*32+bx+20]=B.T.ROAD;
  assert.equal(B.validateSite(a,w).ok,true);
  w.tiles[(by+12)*32+bx+20]=B.T.GRASS;
  assert.equal(B.validateSite(a,w).reason,'road_access_required');
  assert.equal(B.validateSite(B.planAt('cottage',-20,-12,{orientation:'north'}),w).reason,'approach_out_of_bounds');
});

test('CIV-001 rejects malicious geometry and callback failures without editing world',()=>{
  const a=B.planAt('family_home',10,10),w=withRoad(world(),a);
  assert.equal(B.validateSite({...a,footprint:{...a.footprint,w:1}},w).reason,'invalid_site');
  assert.equal(B.validateSite({...a,kind:'unknown'},w).reason,'invalid_site');
  assert.equal(B.validateSite({...a,entrance:{...a.entrance,widthMeters:64}},w).reason,'invalid_site');
  assert.equal(B.validateSite({...a,entrance:{...a.entrance,approachWorld:{x:1,y:1}}},w).reason,'invalid_site');
  assert.equal(B.validateSite(a,{...w,existingBuildings:[{x:0,y:0,w:-1,h:3}]}).reason,'invalid_existing_footprint');
  assert.equal(B.validateSite(a,{...w,existingBuildings:[{x:0,y:0,w:3,h:3,entrance:{approachWorld:{x:'x',y:2}}}]}).reason,'invalid_existing_entrance');
  assert.equal(B.validateSite(a,{...w,isProtected:()=>{throw Error('unsafe');}}).reason,'invalid_world_callback');
  assert.throws(()=>B.planAt('family_home',0,0,{style:'ice'}),RangeError);
  assert.throws(()=>B.planAt('family_home',0,0,{orientation:'up'}),RangeError);
  assert.throws(()=>B.planAt('cottage',0,0,{buildingId:'../unsafe'}),RangeError);
  assert.throws(()=>B.planAt('cottage',1.25,0),RangeError);
  assert.throws(()=>B.planAt('cottage',Number.MAX_SAFE_INTEGER,0),RangeError);
  assert.equal(w.existingBuildings.length,0);
});

test('CIV-001 deterministic 40-site reservation loop has no collision or side effects',()=>{
  const w=world(240,160);
  let reserved=[];
  for(let n=0;n<40;n++) {
    const id=Object.keys(B.CATALOG)[n%8];
    const site=B.planAt(id,8+(n%10)*20,8+Math.floor(n/10)*35,
      {orientation:n%2?'east':'south',buildingId:'building:'+n});
    withRoad(w,site);
    const response=B.reserveSite(site,{...w,existingBuildings:reserved});
    assert.equal(response.ok,true,'Failed '+id+' at '+site.footprint.x+','+site.footprint.y+': '+response.reason);
    assert.equal(response.existingBuildings.length,n+1);
    reserved=response.existingBuildings;
  }
  assert.equal(w.existingBuildings.length,0);
  assert.equal(w.tiles.reduce((n,t)=>n+(t===B.T.ROAD),0),40);
  assert.equal(reserved[0].buildingId,'building:0');
});