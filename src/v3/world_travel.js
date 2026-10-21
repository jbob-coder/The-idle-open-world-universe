/* Bounded local search plus connected road travel. No whole-world path arrays. */
(function(root,factory){"use strict";const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GodseedV3WorldTravel=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
  const key=p=>p.x+","+p.z;
  const same=(a,b)=>a.x===b.x&&a.z===b.z;
  const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
  const DIRS=[[1,0],[0,1],[-1,0],[0,-1]];
  function search(world,start,predicate,tick,radius){
    const queue=[{x:start.x,z:start.z,parent:-1}],seen=new Set([key(start)]);
    for(let head=0;head<queue.length&&head<768;head++){
      const p=queue[head],tile=world.sample(p.x,p.z,tick);
      if(tile&&predicate(tile)){
        const path=[];let i=head;
        while(queue[i].parent!==-1){path.push({x:queue[i].x,z:queue[i].z});i=queue[i].parent;}
        return {target:{x:p.x,z:p.z},path:path.reverse()};
      }
      if(distance(start,p)>=radius)continue;
      for(const d of DIRS){
        const next={x:p.x+d[0],z:p.z+d[1]},id=key(next);
        if(seen.has(id)||!world.walkable(next.x,next.z)||queue.length>=768)continue;
        seen.add(id);queue.push({x:next.x,z:next.z,parent:head});
      }
    }
    return null;
  }
  function resource(world,start,kind,tick){
    return search(world,start,t=>kind==="wood"?t.tree:t.bush&&t.berries>0,tick,12);
  }
  function local(world,start,target,tick){return search(world,start,t=>same(t,target),tick,24);}
  function roadStep(world,start,target){
    if(same(start,target))return null;
    const next=start.x!==target.x?{x:start.x+Math.sign(target.x-start.x),z:start.z}:
      {x:start.x,z:start.z+Math.sign(target.z-start.z)};
    return world.walkable(next.x,next.z)?next:null;
  }
  function itinerary(){
    // Adjacent region centers remain connected at the outer ring, too.
    const result=[];let x=0,z=0,dx=1,dz=0,length=1;
    while(result.length<224){
      for(let leg=0;leg<2;leg++){
        for(let i=0;i<length;i++){
          x+=dx;z+=dz;
          if(Math.abs(x)<=7&&Math.abs(z)<=7)result.push({x:x*64+24,z:z*64+24});
          if(result.length===224)return result;
        }
        const old=dx;dx=-dz;dz=old;
      }
      length++;
    }
    return result;
  }
  return Object.freeze({same,distance,resource,local,roadStep,itinerary});
});
