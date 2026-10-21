"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const WorldSim=require("../src/v3/world_sim.js");
const Expedition=require("../src/v3/expedition.js");
const World=require("../src/v3/world.js");
const Discovery=require("../src/v3/discovery.js");
const Infra=require("../src/v3/infrastructure.js");
const Agency=require("../src/v3/agency.js");

test("long-running autonomous journeys retain valid saved world invariants",()=>{
  for(const seed of [14,77,100]){
    const sim=WorldSim.create(seed);
    for(let tick=500;tick<=4000;tick+=500){
      const state=sim.advance(500), raw=JSON.parse(sim.serialize()),e=raw.expedition;
      const world=World.create(seed,raw.wilderness),x=e.explorer,m=e.settlers[0];
      const valid=Expedition.validate(e,world,state.tick,raw.wilderness.removed.length);
      if(!valid){
        const report={
          seed,tick,
          explorer:x&&{x:x.x,z:x.z,anchor:x.anchor,target:x.target,
            stage:x.stage,routeMode:x.routeMode,routeIndex:x.routeIndex,
            mindValid:x.mind&&Agency.validate(x.mind,tick),
            targetValid:Discovery.validTarget(world,x.target,e.discoveries),
            walkable:world.walkable(x.x,x.z)},
          discoveries:e.discoveries.map(d=>({id:d.id,x:d.x,z:d.z,tick:d.tick})),
          discoveryValid:x&&Discovery.validateHistory(world,e.discoveries,x.bornAt,tick),
          camps:e.camps.map(c=>({id:c.id,anchorX:c.anchorX,anchorZ:c.anchorZ,
            builder:c.builder,completedAt:c.completedAt})),
          roadValid:Infra.validate(world,e.camps.filter(c=>m&&c.id===m.homeCampId).concat(e.houses),
            e.roads,tick,m&&m.id,m&&m.bornAt),
          worldRemoved:raw.wilderness.removed.length,woodGathered:e.woodGathered,
          woodSpent:e.woodSpent,explorerWood:x&&x.wood,
          miraWood:m&&m.wood,
          resident:m&&{x:m.x,z:m.z,homeId:m.homeCampId,site:m.homeSite,
            life:m.alive,health:m.health,mindValid:Agency.validate(m.mind,tick)},
          events:e.events.slice(-4)
        };
        assert.fail("autonomous state failed validation: "+JSON.stringify(report));
      }
      assert.deepEqual(WorldSim.restore(sim.serialize()).snapshot(),state);
    }
  }
});
