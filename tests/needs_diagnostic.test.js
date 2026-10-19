const test=require('node:test');
const S=require('../src/sim.js');
test('SIM-001 diagnosis: settlement production under needs pressure',()=>{
 for(const seed of [1,41,99,2026]){
  const s=S.create(seed);
  for(let i=0;i<2500;i++)S.tick(s);
  const towns=s.living.towns.map(t=>({
   town:t.name,buildings:t.buildings.length,stock:t.stock,age:t.age,
   technology:t.technology,people:s.living.citizens.filter(c=>c.townId===t.id)
   .map(c=>({name:c.name,role:c.role,actions:c.actions,activity:c.activity,
    needs:c.needs,x:c.x,y:c.y,homeX:c.homeX,homeY:c.homeY}))
  }));
  console.log('SIM_NEEDS_DIAGNOSTIC '+JSON.stringify({seed,towns}));
 }
});
