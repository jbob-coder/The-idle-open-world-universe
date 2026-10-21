/* Emergent infrastructure: actors propose roads from real community structures.
 * No authored road coordinates, capital positions, or instant construction. */
(function(root,factory){"use strict";const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GodseedV3Infrastructure=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
  const Node=typeof module!=="undefined"&&module.exports;
  const Nav=Node?require("./world_travel.js"):globalThis.GodseedV3WorldTravel;
  const MAX_LOCAL_ROAD=32;
  const equal=(a,b)=>a.x===b.x&&a.z===b.z;
  const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
  const key=p=>p.x+","+p.z;

  // Candidate demand comes from actual structures, never a hidden map blueprint.
  // This first worker links a functioning frontier home with a route camp.
  function plan(world,structures,tick){
    if(!Array.isArray(structures))return [];
    const homes=structures.filter(x=>x.type==="home"||x.type==="house");
    const camps=structures.filter(x=>x.type==="camp");
    const pairs=[];
    for(const home of homes)for(const camp of camps)
      if(distance(home,camp)>1&&distance(home,camp)<=MAX_LOCAL_ROAD)
        pairs.push({home,camp,score:distance(home,camp)});
    pairs.sort((a,b)=>a.score-b.score||
      String(a.home.id).localeCompare(String(b.home.id))||
      String(a.camp.id).localeCompare(String(b.camp.id)));
    for(const pair of pairs){
      const route=Nav.local(world,pair.home,pair.camp,tick,MAX_LOCAL_ROAD,4096);
      if(!route)return [];
      const tiles=route.path.filter(p=>!equal(p,pair.camp)&&!equal(p,pair.home))
        .filter(p=>{const t=world.sample(p.x,p.z,tick);
          return t&&t.walkable&&!t.tree&&t.kind!=="road"&&t.kind!=="bridge";});
      return tiles.map(p=>({x:p.x,z:p.z}));
    }
    return [];
  }

  // A resident weighs terrain, personal preferences and reachable free ground.
  // This is a candidate search, not a named settlement or preauthored building.
  function chooseHomeSite(world,camp,preferences,tick){
    const choices=[];
    for(let dz=-6;dz<=6;dz++)for(let dx=-6;dx<=6;dx++){
      const x=camp.x+dx,z=camp.z+dz,d=Math.abs(dx)+Math.abs(dz);
      if(d<4||d>8)continue;
      const t=world.sample(x,z,tick);
      if(!t||!t.walkable||t.tree||t.bush||
         t.kind!=="ground")continue;
      // Favor level, reachable land with modest spatial variation. A cautious
      // NPC tends toward a sheltered home; a curious one accepts remoteness.
      const elevation=Math.abs(t.height-(world.sample(camp.x,camp.z,tick)?.height||0));
      const preference=((preferences.curiosity*17+preferences.security*11+
        Math.imul(x,1327)+Math.imul(z,1999))>>>0)%37;
      const score=elevation*35+Math.abs(d-(preferences.curiosity>55?6:4))*7+
        preference/5;
      choices.push({x,z,score});
    }
    choices.sort((a,b)=>a.score-b.score||a.z-b.z||a.x-b.x);
    for(const p of choices.slice(0,18)){
      if(Nav.local(world,camp,p,tick,24,1024))return {x:p.x,z:p.z};
    }
    return null;
  }
  function next(world,structures,roads,tick){
    const route=plan(world,structures,tick),done=new Set(roads.map(key));
    return route.find(tile=>!done.has(key(tile)))||null;
  }

  function validate(world,structures,roads,tick,actorId,actorBirth){
    if(!Array.isArray(roads)||roads.length>MAX_LOCAL_ROAD)return false;
    const expected=plan(world,structures,tick);
    if(roads.length>expected.length)return false;
    for(let i=0;i<roads.length;i++){
      const r=roads[i],p=expected[i];
      if(!r||!p||r.x!==p.x||r.z!==p.z||r.type!=="road"||
         r.material!=="timber"||r.builder!==actorId||
         !Number.isSafeInteger(r.completedAt)||r.completedAt<actorBirth||
         r.completedAt>tick||(i>0&&r.completedAt<roads[i-1].completedAt))return false;
    }
    return true;
  }
  return Object.freeze({plan,next,validate,chooseHomeSite,MAX_LOCAL_ROAD});
});