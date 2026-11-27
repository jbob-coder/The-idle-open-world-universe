// Development-only authoritative execution reference; not a game engine.
export function createExecutionReference(spec){
 const ensure=(v,m)=>{if(!v)throw Error(m)}, id=v=>typeof v==="string"&&/^[A-Za-z0-9_-]{1,50}$/.test(v), int=v=>Number.isSafeInteger(v)&&v>=0, copy=v=>JSON.parse(JSON.stringify(v));
 ensure(spec&&id(spec.world_id)&&int(spec.now)&&spec.now<Number.MAX_SAFE_INTEGER&&Array.isArray(spec.actors)&&spec.actors.length<=256,"invalid execution world");
 const world=spec.world_id,actors=new Map(),offers=new Map(),active=new Map(),targets=new Map(),attempts=new Set(),outcomes=new Map(),events=[];
 let now=spec.now;
 for(const a of spec.actors){
  ensure(a&&id(a.actor_id)&&!actors.has(a.actor_id)&&int(a.revision)&&a.revision<=Number.MAX_SAFE_INTEGER-1024&&int(a.knowledge_revision)&&int(a.resources)&&["active","incapacitated","deceased"].includes(a.life_status),"invalid actor");
  actors.set(a.actor_id,{actor_id:a.actor_id,revision:a.revision,knowledge_revision:a.knowledge_revision,resources:a.resources,life_status:a.life_status});
 }
 function publishOffer(o){
  // Privileged resolver supplies event-time real feasibility and prepared phases; never cognition.
  ensure(o&&o.world_id===world&&id(o.actor_id)&&actors.has(o.actor_id)&&id(o.opportunity_id)&&id(o.action_id)&&int(o.actor_revision)&&int(o.knowledge_revision)&&int(o.valid_until)&&typeof o.feasible==="boolean"&&(o.exclusive_target===null||id(o.exclusive_target))&&int(o.credit_cap)&&o.credit_cap<=10000&&Array.isArray(o.phases)&&o.phases.length>=1&&o.phases.length<=4,"invalid offer");
  const a=actors.get(o.actor_id);ensure(o.actor_revision===a.revision&&o.knowledge_revision===a.knowledge_revision&&o.valid_until>=now,"stale offer");
  const order=["preparation","movement","execution","recovery"];let prev=-1,total=0,duration=0,exec=false;
  const phases=o.phases.map(p=>{
   ensure(p&&order.includes(p.kind)&&order.indexOf(p.kind)>prev&&int(p.duration)&&p.duration>0&&p.duration<=1000000&&int(p.cost)&&p.cost<=1000000&&typeof p.interruptible==="boolean"&&int(p.credit_per_tick)&&p.credit_per_tick<=10000&&(p.kind==="execution"||p.credit_per_tick===0),"invalid phase");
   prev=order.indexOf(p.kind);if(p.kind==="execution")exec=true;total+=p.cost;duration+=p.duration;
   return {kind:p.kind,duration:p.duration,cost:p.cost,interruptible:p.interruptible,credit_per_tick:p.credit_per_tick};
  });
  ensure(exec&&now+duration<Number.MAX_SAFE_INTEGER,"invalid execution duration");
  const key=o.actor_id+":"+o.opportunity_id;ensure(!offers.has(key)||offers.get(key).actor_revision!==a.revision,"duplicate current offer");
  offers.set(key,{world_id:world,actor_id:o.actor_id,opportunity_id:o.opportunity_id,action_id:o.action_id,actor_revision:o.actor_revision,knowledge_revision:o.knowledge_revision,valid_until:o.valid_until,feasible:o.feasible,exclusive_target:o.exclusive_target,credit_cap:o.credit_cap,phases,total,duration});
 }
 const state=()=>({world_id:world,now,actors:[...actors.values()].map(copy),active:[...active.values()].map(copy),outcomes:[...outcomes.values()].map(copy),events:events.map(copy)});
 function startPhase(x){
  const p=x.phases[x.phase_index],a=actors.get(x.actor_id);
  a.resources-=p.cost;x.reserved_remaining-=p.cost;x.spent+=p.cost;
  x.phase_started_tick=now;x.phase_end_tick=now+p.duration;
  events.push({kind:"phase_started",attempt_id:x.attempt_id,actor_id:x.actor_id,phase:p.kind,tick:now,cost:p.cost});
 }
 function admit(d,attempt_id,plan=null){
  ensure(d&&d.kind==="intent"&&d.world_id===world&&id(d.actor_id)&&id(d.opportunity_id)&&id(d.action_id)&&["action","refusal"].includes(d.disposition)&&id(attempt_id)&&!attempts.has(attempt_id),"invalid or duplicate intent");
  const a=actors.get(d.actor_id),o=offers.get(d.actor_id+":"+d.opportunity_id);
  ensure(a&&a.life_status==="active"&&!active.has(a.actor_id)&&d.decision_tick===now&&d.actor_revision===a.revision&&d.knowledge_revision===a.knowledge_revision,"actor busy, inactive or stale intent");
  ensure(o&&o.action_id===d.action_id&&o.actor_revision===a.revision&&o.knowledge_revision===a.knowledge_revision&&o.valid_until>=now&&o.feasible,"unavailable offer");
  ensure(a.resources>=o.total&&now+o.duration<Number.MAX_SAFE_INTEGER&&a.revision<Number.MAX_SAFE_INTEGER-1,"insufficient resource or tick range");
  ensure(o.exclusive_target===null||!targets.has(o.exclusive_target),"target reserved");
  ensure(plan===null||(id(plan.plan_id)&&int(plan.plan_revision)),"invalid plan binding");
  const x={attempt_id,actor_id:a.actor_id,action_id:o.action_id,opportunity_id:o.opportunity_id,plan_id:plan?.plan_id??null,plan_revision:plan?.plan_revision??null,started_tick:now,phase_index:0,phases:copy(o.phases),phase_started_tick:now,phase_end_tick:now,reserved_remaining:o.total,spent:0,credited_units:0,credit_cap:o.credit_cap,exclusive_target:o.exclusive_target,released:false};
  attempts.add(attempt_id);active.set(a.actor_id,x);if(x.exclusive_target!==null)targets.set(x.exclusive_target,attempt_id);a.revision++;startPhase(x);
  return {accepted:true,attempt_id,world_id:world,actor_id:a.actor_id,actor_revision:d.actor_revision,knowledge_revision:d.knowledge_revision,decision_tick:now,opportunity_id:o.opportunity_id,action_id:o.action_id,plan_id:x.plan_id,plan_revision:x.plan_revision};
 }
 function finish(x,outcome){
  const a=actors.get(x.actor_id);active.delete(x.actor_id);if(x.exclusive_target!==null)targets.delete(x.exclusive_target);a.revision++;
  const r={committed:true,event_id:"out_"+x.attempt_id,attempt_id:x.attempt_id,world_id:world,actor_id:x.actor_id,plan_id:x.plan_id,tick:now,outcome,credited_units:x.credited_units};
  outcomes.set(x.attempt_id,r);events.push({kind:"terminal",attempt_id:x.attempt_id,actor_id:x.actor_id,tick:now,outcome,spent:x.spent,released_reservation:x.reserved_remaining,released_effect:x.released});
  return copy(r);
 }
 function nextBoundary(){return active.size?Math.min(...[...active.values()].map(x=>x.phase_end_tick)):null}
 function advanceTo(t){
  // Called only by future world scheduler for a committed fictional-time interval.
  ensure(int(t)&&t>now&&t<Number.MAX_SAFE_INTEGER,"nonpositive or invalid time");
  const boundary=nextBoundary();ensure(boundary===null||t<=boundary,"cannot skip action boundary");
  const elapsed=t-now;now=t;
  for(const x of active.values()){
   const p=x.phases[x.phase_index];x.credited_units+=Math.min(x.credit_cap-x.credited_units,elapsed*p.credit_per_tick);
  }
  const due=[...active.values()].filter(x=>x.phase_end_tick===now).sort((a,b)=>a.attempt_id<b.attempt_id?-1:a.attempt_id>b.attempt_id?1:0);
  const receipts=[];
  for(const x of due){
   const p=x.phases[x.phase_index];
   events.push({kind:"phase_completed",attempt_id:x.attempt_id,actor_id:x.actor_id,phase:p.kind,tick:now});
   if(p.kind==="execution"){x.released=true;events.push({kind:"execution_boundary",attempt_id:x.attempt_id,actor_id:x.actor_id,tick:now})}
   if(x.phase_index===x.phases.length-1)receipts.push(finish(x,"completed"));
   else{x.phase_index++;startPhase(x)}
  }
  return receipts;
 }
 function stop(actor_id,attempt_id,outcome){
  // Privileged interruption request after external threat/reaction or feasibility resolution.
  ensure(["interrupted","cancelled","failed"].includes(outcome),"invalid interruption");
  const x=active.get(actor_id);ensure(x&&x.attempt_id===attempt_id,"no matching active attempt");
  ensure(outcome==="failed"||x.phases[x.phase_index].interruptible,"phase is committed");
  return finish(x,outcome);
 }
 return Object.freeze({publishOffer,admit,advanceTo,stop,nextBoundary,state});
}
