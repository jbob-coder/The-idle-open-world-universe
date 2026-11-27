// Development-only reference, not production NPC behavior or balanced formulas.
export function decideNpcReference(profile,knowledge,opportunities){
  // Trusted caller supplies only the actor's projected profile, knowledge and opportunities.
  const id=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,64}$/.test(x);
  const tick=x=>Number.isSafeInteger(x)&&x>=0;
  const bounded=(x,min,max)=>Number.isInteger(x)&&x>=min&&x<=max;
  const exact=(o,keys)=>o!==null&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
  const ensure=(ok,reason)=>{if(!ok)throw Error(reason)};
  const dimensions=["safety","resources","growth","connection","duty","rest"];
  ensure(exact(profile,["world_id","actor_id","actor_revision","now","life_status","risk_aversion","stress","needs","values","goals"]),"invalid profile fields");
  ensure(id(profile.world_id)&&id(profile.actor_id)&&tick(profile.actor_revision)&&tick(profile.now)&&profile.now<Number.MAX_SAFE_INTEGER,"invalid profile scope");
  ensure(["active","incapacitated","deceased"].includes(profile.life_status)&&bounded(profile.risk_aversion,0,10)&&bounded(profile.stress,0,10),"invalid condition");
  for(const group of [profile.needs,profile.values])ensure(exact(group,dimensions)&&dimensions.every(k=>bounded(group[k],0,10)),"invalid motivation vector");
  ensure(Array.isArray(profile.goals)&&profile.goals.length<=64,"goal budget");
  const goals=new Map();
  for(const g of profile.goals){
    ensure(exact(g,["id","dimension","status","urgency"])&&id(g.id)&&!goals.has(g.id)&&dimensions.includes(g.dimension)&&["active","deferred","blocked","achieved","abandoned"].includes(g.status)&&bounded(g.urgency,0,10),"invalid goal");
    goals.set(g.id,g);
  }
  ensure(knowledge&&knowledge.schema_version==="0.1-proposal"&&knowledge.world_id===profile.world_id&&knowledge.actor_id===profile.actor_id&&tick(knowledge.as_of_tick)&&knowledge.as_of_tick<=profile.now&&tick(knowledge.revision)&&Array.isArray(knowledge.observations),"knowledge scope");
  ensure(knowledge.observations.length<=10000,"observation budget");
  const observed=new Map(),obsIds=new Set();
  for(const o of knowledge.observations){
    ensure(o&&typeof o.id==="string"&&!obsIds.has(o.id)&&tick(o.acquired_tick)&&o.acquired_tick<=knowledge.as_of_tick&&["direct","report","record","internal"].includes(o.channel)&&Array.isArray(o.claims)&&o.claims.length<=100,"invalid observation");
    obsIds.add(o.id);
    for(const c of o.claims){
      ensure(c&&typeof c.key==="string"&&c.key.length>0&&c.key.length<=128&&typeof c.value==="string"&&c.value.length>0&&c.value.length<=2000,"invalid claim");
      const rows=observed.get(c.key)||[];rows.push({value:c.value,channel:o.channel});observed.set(c.key,rows);
    }
  }
  ensure(Array.isArray(opportunities)&&opportunities.length<=64,"opportunity budget");
  const seen=new Set(),evaluated=[];
  for(const o of opportunities){
    ensure(exact(o,["id","world_id","actor_id","kind","action_id","goal_ids","effects","risk","effort","requirements","perceived_feasible","valid_until"])&&id(o.id)&&!seen.has(o.id)&&o.world_id===profile.world_id&&o.actor_id===profile.actor_id,"invalid opportunity scope");
    seen.add(o.id);
    ensure(["action","refusal"].includes(o.kind)&&id(o.action_id)&&Array.isArray(o.goal_ids)&&o.goal_ids.length<=64&&new Set(o.goal_ids).size===o.goal_ids.length&&o.goal_ids.every(g=>goals.has(g)),"invalid opportunity goals");
    ensure(exact(o.effects,dimensions)&&dimensions.every(k=>bounded(o.effects[k],-10,10))&&bounded(o.risk,0,10)&&bounded(o.effort,0,10)&&typeof o.perceived_feasible==="boolean"&&tick(o.valid_until),"invalid opportunity estimates");
    ensure(Array.isArray(o.requirements)&&o.requirements.length<=16,"requirement budget");
    for(const r of o.requirements)ensure(exact(r,["key","value","channels"])&&typeof r.key==="string"&&r.key.length>0&&r.key.length<=128&&typeof r.value==="string"&&r.value.length>0&&r.value.length<=2000&&Array.isArray(r.channels)&&r.channels.length>0&&r.channels.length<=4&&new Set(r.channels).size===r.channels.length&&r.channels.every(c=>["direct","report","record","internal"].includes(c)),"invalid requirement");
    if(profile.life_status!=="active"||!o.perceived_feasible||o.valid_until<profile.now)continue;
    // Contextual claim keys must distinguish subject, time and meaning. Conflicts remain uncertain.
    const supported=o.requirements.every(r=>{
      const rows=observed.get(r.key)||[];
      return rows.some(x=>x.value===r.value&&r.channels.includes(x.channel))&&!rows.some(x=>x.value!==r.value);
    });
    if(!supported)continue;
    // Prototype integer weights, not gameplay constants. Active goal pressure is not a hard obligation.
    const goalPressure=new Map(dimensions.map(k=>[k,0]));
    for(const gid of o.goal_ids){const g=goals.get(gid);if(g.status==="active")goalPressure.set(g.dimension,Math.max(goalPressure.get(g.dimension),g.urgency))}
    const score=dimensions.reduce((s,k)=>s+o.effects[k]*(profile.needs[k]+profile.values[k]+goalPressure.get(k)),0)-o.risk*(profile.risk_aversion+profile.stress)-o.effort;
    evaluated.push({id:o.id,kind:o.kind,action_id:o.action_id,score});
  }
  // Deterministic tie resolution independent of supplied ordering. No shared RNG or hidden world lookup.
  evaluated.sort((a,b)=>b.score-a.score||(a.id<b.id?-1:a.id>b.id?1:0));
  const base={world_id:profile.world_id,actor_id:profile.actor_id,actor_revision:profile.actor_revision,knowledge_revision:knowledge.revision,decision_tick:profile.now};
  if(profile.life_status!=="active")return {...base,kind:"inactive"};
  const best=evaluated[0];
  if(!best||best.score<=0)return {...base,kind:"wait",review_after_tick:profile.now+1};
  return {...base,kind:"intent",opportunity_id:best.id,action_id:best.action_id,disposition:best.kind};
}
