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
  // A character can *offer* labor to another resident's active project.
  // Neither project ownership nor the simulation tick issues commands.
  // The caller must still walk to the site and pay through contribute().
  function chooseVoluntaryWork(s,actor,social,tick,types=["home","road","camp"],allowGather=false){
    if(!s||!Array.isArray(s.entries)||!actor||!actor.alive||
       !actor.mind||!actor.mind.preferences||
       !social||!Array.isArray(social.ties)||!integer(tick)||
       !integer(actor.wood)||(!allowGather&&actor.wood<1)||
       !integer(actor.energy)||actor.energy<10||
       !integer(actor.food)||actor.food<2||
       !integer(actor.hunger)||actor.hunger<68||
       !Array.isArray(types))return null;
    const craft=actor.mind.preferences.craftsmanship;
    const security=actor.mind.preferences.security;
    if(!integer(craft)||!integer(security))return null;
    let best=null,bestScore=-Infinity;
    for(const p of s.entries){
      if(p.status!=="active"||!types.includes(p.type)||
         p.initiator===actor.id||p.startedAt>tick||
         p.progress>=p.required)continue;
      const distance=Math.abs(actor.x-p.x)+Math.abs(actor.z-p.z);
      if(distance>(allowGather?24:12))continue; // Locally reachable opportunities only.
      const tie=social.ties.find(t=>
        (t.a===actor.id&&t.b===p.initiator)||
        (t.b===actor.id&&t.a===p.initiator));
      if(!tie||!integer(tie.trust)||tie.trust<23)continue;
      // Individual craftsmanship, trust, safety and real travel cost compete.
      // There is no fixed date or required construction goal.
      const score=craft+tie.trust-Math.floor(security/3)-
        distance*3+(p.progress>0?12:0)-(actor.wood===0?5:0);
      if(score<67)continue;
      if(score>bestScore||(score===bestScore&&p.id<best.id)){
        best=p;bestScore=score;
      }
    }
    return best?{id:best.id,type:best.type,x:best.x,z:best.z,
      score:bestScore,needsWood:actor.wood===0,
      reason:"voluntary_community_work"}:null;
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
  return Object.freeze({COST,MAX_ACTIVE_PROJECTS,create,find,propose,contribute,chooseVoluntaryWork,validate});
});