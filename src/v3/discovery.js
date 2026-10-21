/* GODSEED: NPC-selected discovery destinations, no authored itinerary.
 * Pure deterministic planner: depends on actual landmark geography, the
 * traveler's preferences and knowledge. Calling it never advances the world. */
(function(root,factory){"use strict";const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.GodseedV3Discovery=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
 const MAX_DISCOVERIES=255;
 const legal=n=>Number.isSafeInteger(n)&&n>=-8&&n<=7;
 const key=p=>p.x+","+p.z;
 function select(world,explorer,discoveries){
   if(!explorer||!explorer.anchor||!explorer.mind||!Array.isArray(discoveries))return null;
   const known=new Set(discoveries.map(d=>d.id));
   const rx=Math.floor(explorer.anchor.x/64),rz=Math.floor(explorer.anchor.z/64);
   const p=explorer.mind.preferences;
   let chosen=null,best=Infinity;
   for(let z=-8;z<=7;z++)for(let x=-8;x<=7;x++){
     if(!legal(x)||!legal(z)||(x===0&&z===0))continue;
     const site=world.landmark(x,z);
     if(!site||known.has(site.id))continue;
     const distance=Math.abs(x-rx)+Math.abs(z-rz);
     if(distance===0)continue;
     const interest=site.type==="spring"?p.security:
       site.type==="ruin"?p.curiosity:
       site.type==="watchtower"?p.craftsmanship:
       Math.round((p.curiosity+p.security)/2);
     // Distance is a cost, while a person's interests matter between similarly
     // distant sites. Tie-breaking uses coordinates rather than array order.
     const score=distance*100-interest+((Math.imul(x+8,17)+Math.imul(z+8,31)+
       p.curiosity*7+p.security*3)%13);
     if(score<best||(score===best&&
        (!chosen||site.z<chosen.z||site.z===chosen.z&&site.x<chosen.x))){
       best=score;chosen=site;
     }
   }
   return chosen?{x:chosen.x,z:chosen.z,id:chosen.id}:null;
 }
 function validTarget(world,target,discovered){
   if(!target)return true;
   if(!Number.isInteger(target.x)||!Number.isInteger(target.z)||
      !Array.isArray(discovered))return false;
   const site=world.landmark(Math.floor(target.x/64),Math.floor(target.z/64));
   return !!site&&target.x===site.x&&target.z===site.z&&
     target.id===site.id&&!discovered.some(d=>d.id===site.id);
 }
 function validateHistory(world,discoveries,birth,tick){
   if(!Array.isArray(discoveries)||discoveries.length>MAX_DISCOVERIES)return false;
   const seen=new Set();let previous=-1;
   for(const d of discoveries){
     if(!d||!Number.isSafeInteger(d.tick)||d.tick<birth||d.tick>tick||
        d.tick<previous||seen.has(d.id))return false;
     const site=world.landmark(Math.floor(d.x/64),Math.floor(d.z/64));
     if(!site||d.id!==site.id||d.name!==site.name||d.type!==site.type||
        d.x!==site.x||d.z!==site.z)return false;
     previous=d.tick;seen.add(d.id);
   }
   return true;
 }
 return Object.freeze({select,validTarget,validateHistory,MAX_DISCOVERIES});
});