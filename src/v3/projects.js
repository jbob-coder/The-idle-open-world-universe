/* Persistent, actor-neutral construction work orders for a living world.
 * Construction costs labor and physically carried timber, one unit at a time.
 * Open orders survive hunger, rest, path interruptions and save/reload. */
(function(root,factory){"use strict";const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GodseedV3Projects=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
  const COST=Object.freeze({home:4,road:1,camp:4}),MAX_ACTIVE_PROJECTS=3,MAX_CONTRIBUTORS=8;
  const integer=n=>Number.isSafeInteger(n)&&n>=0;
  const key=(type,site)=>type+":"+site.x+","+site.z;
  const create=(cutoverTick=0)=>({cutoverTick,entries:[]});
  function find(s,type,site){
    return s.entries.find(p=>p.id===key(type,site))||null;
  }
  function propose(s,type,site,initiator,tick){
    if(!Object.prototype.hasOwnProperty.call(COST,type)||!site||
      !Number.isSafeInteger(site.x)||!Number.isSafeInteger(site.z)||
      typeof initiator!=="string"||!initiator||!integer(tick)||
      tick<s.cutoverTick)throw RangeError("invalid construction proposal");
    const existing=find(s,type,site);
    if(existing)return existing;
    if(s.entries.filter(p=>p.status==="active").length>=MAX_ACTIVE_PROJECTS)
      return null; // Bounded concurrent construction, not an NPC command.
    const order={id:key(type,site),type,x:site.x,z:site.z,
      required:COST[type],progress:0,status:"active",initiator,
      startedAt:tick,lastAt:tick,completedAt:null,contributors:[]};
    s.entries.push(order);return order;
  }
  function contribute(s,project,actor,tick){
    if(!project||!s||!Array.isArray(s.entries)||!s.entries.includes(project)||
       project.status!=="active"||project.progress>=project.required||
       !actor||actor.alive!==true||typeof actor.id!=="string"||!actor.id||
       actor.x!==project.x||actor.z!==project.z||
       !integer(actor.wood)||actor.wood<1||!integer(actor.energy)||actor.energy<4||
       !integer(tick)||tick<project.lastAt)return {worked:false,completed:false};
    let member=project.contributors.find(c=>c.id===actor.id);
    if(!member&&project.contributors.length>=MAX_CONTRIBUTORS)
      return {worked:false,completed:false};
    if(!member){member={id:actor.id,units:0};project.contributors.push(member);}
    actor.wood--;actor.energy=Math.max(0,actor.energy-2);member.units++;
    project.progress++;project.lastAt=tick;
    const completed=project.progress===project.required;
    if(completed){project.status="complete";project.completedAt=tick;}
    return {worked:true,completed,woodSpent:1,projectId:project.id};
  }
  function validate(s,tick,homes,roads,workers,camps=[]){
    if(!s||!integer(s.cutoverTick)||s.cutoverTick>tick||
       !Array.isArray(s.entries)||
       !Array.isArray(homes)||!Array.isArray(roads)||!Array.isArray(workers)||
       !Array.isArray(camps))
      return false;
    // Completed orders are bounded by actual structures, not an arbitrary
    // lifetime counter. Only live worksite concurrency has a fixed limit.
    if(s.entries.length>homes.length+roads.length+camps.length+MAX_ACTIVE_PROJECTS)
      return false;
    const identities=new Map(workers.map(w=>[w.id,w]));
    const built=new Set(),occupied=new Set(),completedOrders=new Set();
    const structureLists=[["home",homes],["road",roads],["camp",camps]];
    for(const [type,structures] of structureLists)for(const b of structures){
      const site=b.x+","+b.z;
      occupied.add(site);
      built.add(type+":"+site+"@"+b.completedAt);
    }
    const seen=new Set();let previous=-1,active=0,units=0;
    for(const p of s.entries){
      if(!p||!Object.prototype.hasOwnProperty.call(COST,p.type)||
         !Number.isSafeInteger(p.x)||!Number.isSafeInteger(p.z)||
         p.id!==key(p.type,p)||seen.has(p.id)||
         p.required!==COST[p.type]||!integer(p.progress)||
         p.progress>p.required||
         !integer(p.startedAt)||!integer(p.lastAt)||
         p.startedAt<s.cutoverTick||p.lastAt<p.startedAt||
         p.lastAt>tick||p.startedAt<previous||
         !identities.has(p.initiator)||!Array.isArray(p.contributors)||
         p.contributors.length>MAX_CONTRIBUTORS)return false;
      seen.add(p.id);previous=p.startedAt;
      let amount=0;const members=new Set();
      for(const c of p.contributors){
        const actor=identities.get(c.id);
        if(!actor||members.has(c.id)||!integer(c.units)||c.units<1||
           actor.bornAt>p.lastAt)return false;
        amount+=c.units;members.add(c.id);
      }
      if(amount!==p.progress)return false;
      units+=amount;
      const complete=p.progress===p.required;
      if(p.status!==(complete?"complete":"active")||
         (complete?(!integer(p.completedAt)||p.completedAt!==p.lastAt):
          (p.completedAt!==null)))return false;
      if(!complete)active++;
      if(complete){
        const receipt=p.id+"@"+p.completedAt;
        if(!built.has(receipt))return false;
        completedOrders.add(receipt);
      }else if(occupied.has(p.x+","+p.z))return false;
    }
    if(active>MAX_ACTIVE_PROJECTS)return false;
    // Post-cutover structures must have a matching paid work order. Lookups
    // remain linear in world size rather than quadratic as settlements grow.
    for(const [type,structures] of structureLists)
      for(const b of structures)if(b.completedAt>s.cutoverTick&&
        !completedOrders.has(type+":"+b.x+","+b.z+"@"+b.completedAt))
        return false;
    return units;
  }
  return Object.freeze({COST,MAX_ACTIVE_PROJECTS,create,find,propose,contribute,validate});
});