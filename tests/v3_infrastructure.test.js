"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const Infra=require("../src/v3/infrastructure.js");

function terrain(){
  return {
    sample(x,z){
      if(!Number.isInteger(x)||!Number.isInteger(z)||Math.abs(x)>100||Math.abs(z)>100)return null;
      const blocked=x===42&&z!==15;
      return {x,z,walkable:!blocked,tree:false,kind:"ground"};
    },
    walkable(x,z){return !!this.sample(x,z)?.walkable;}
  };
}
test("NPC road plan derives from actual buildings, not fixed capital coordinates",()=>{
  const world=terrain(),structures=[
    {id:"house_a",type:"home",x:8,z:15},
    {id:"wayside_x",type:"camp",x:12,z:15}
  ];
  assert.deepEqual(Infra.plan(world,structures,100),[
    {x:9,z:15},{x:10,z:15},{x:11,z:15}
  ]);
  structures[0].x=53;structures[0].z=-20;
  structures[1].x=57;structures[1].z=-20;
  assert.deepEqual(Infra.plan(world,structures,100),[
    {x:54,z:-20},{x:55,z:-20},{x:56,z:-20}
  ]);
});
test("road work demands existing endpoints, real positions and successive work",()=>{
  const world=terrain(),structures=[
    {id:"other_camp",type:"camp",x:20,z:12},
    {id:"other_home",type:"home",x:16,z:12}
  ];
  assert.deepEqual(Infra.plan(world,[],30),[]);
  const plan=Infra.plan(world,structures,30);
  assert.ok(plan.length>0);
  assert.deepEqual(Infra.next(world,structures,[],30),plan[0]);
  const road=plan.map((p,i)=>({...p,type:"road",material:"timber",
    builder:"npc_123",completedAt:40+i}));
  assert.deepEqual(Infra.next(world,structures,road,50),null);
  assert.ok(Infra.validate(world,structures,road,50,"npc_123",25));
  const forged=road.map(r=>({...r}));forged[0].x+=1;
  assert.equal(Infra.validate(world,structures,forged,50,"npc_123",25),false);
  const premature=road.map(r=>({...r}));premature[0].completedAt=20;
  assert.equal(Infra.validate(world,structures,premature,50,"npc_123",25),false);
  assert.equal(Infra.validate(world,structures,road,50,"npc_999",25),false);
});
