"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const Social=require("../src/v3/social.js");
const Agency=require("../src/v3/agency.js");
const WorldSim=require("../src/v3/world_sim.js");

function actors(){
  const explorer={id:"world_taren",x:10,z:10,hunger:90,energy:20,alive:true,
    bornAt:1,mind:Agency.create("world_taren",10,10)};
  const settler={id:"world_mira",x:11,z:10,hunger:90,energy:20,alive:true,
    bornAt:5,mind:Agency.create("world_mira",11,10)};
  explorer.mind.preferences.curiosity=70;
  settler.mind.preferences.curiosity=70;
  return {explorer,settlers:[settler],social:Social.create()};
}

test("NPCs make durable relationships only after a physical willing meeting",()=>{
  const s=actors(),events=[],record=(state,tick,action,details,actor)=>
    events.push({tick,action,details,actor});
  assert.equal(Social.advance(s,10,record),true);
  assert.equal(s.social.ties.length,1);
  assert.equal(s.social.ties[0].meetings,1);
  assert.equal(events.length,2);
  assert.equal(Social.advance(s,11,record),false,"encounter cooldown");
  assert.equal(Social.advance(s,70,record),true);
  assert.equal(s.social.ties[0].meetings,2);
  assert.equal(Social.validate(s.social,s.explorer,s.settlers,70),true);
  s.explorer.x=100;
  assert.equal(Social.advance(s,140,record),false,"distant actors do not magically meet");
  assert.equal(s.social.ties[0].meetings,2);
});

test("social consent and actor identity are conserved",()=>{
  const s=actors(),events=[],r=(...e)=>events.push(e);
  s.settlers[0].hunger=10;
  assert.equal(Social.advance(s,50,r),false);
  s.settlers[0].hunger=90;
  s.settlers[0].mind.preferences.curiosity=25;
  s.explorer.mind.preferences.curiosity=25;
  s.settlers[0].mind.preferences.security=89;
  s.explorer.mind.preferences.security=89;
  assert.equal(Social.advance(s,51,r),false,"low willingness does not mandate dialogue");
  assert.equal(s.social.ties.length,0);
  assert.ok(Social.validate(s.social,s.explorer,s.settlers,60));
  s.social.ties.push({a:"king_unknown",b:"world_mira",meetings:1,
    trust:23,firstAt:55,lastAt:55});
  assert.equal(Social.validate(s.social,s.explorer,s.settlers,60),false);
});

test("world proximity events and bonds survive save/load; forged ties fail closed",()=>{
  const game=WorldSim.create(14),state=game.advance(3500);
  const ties=state.expedition.social.ties;
  assert.ok(ties.length>0,"Taren and Mira must be able to meet at an actual camp");
  assert.equal(ties[0].a,"world_taren");
  assert.equal(ties[0].b,"world_mira");
  assert.equal(state.world.socialConnections,ties.length);
  assert.deepEqual(WorldSim.restore(game.serialize()).snapshot(),state);
  const payload=JSON.parse(game.serialize());
  payload.expedition.social.ties[0].trust=999;
  assert.throws(()=>WorldSim.restore(JSON.stringify(payload)),RangeError);
});
