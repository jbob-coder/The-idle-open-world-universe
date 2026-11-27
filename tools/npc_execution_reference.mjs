// Development-only authoritative execution reference; not a game engine.
export function createExecutionReference(spec,checkpoint=null){
 const ensure=(v,m)=>{if(!v)throw Error(m)}, id=v=>typeof v==="string"&&/^[A-Za-z0-9_-]{1,50}$/.test(v), int=v=>Number.isSafeInteger(v)&&v>=0, copy=v=>JSON.parse(JSON.stringify(v));
 ensure(spec&&id(spec.world_id)&&int(spec.now)&&spec.now<Number.MAX_SAFE_INTEGER&&Array.isArray(spec.actors)&&spec.actors.length<=256,"invalid execution world");
 const world=spec.world_id,actors=new Map(),offers=new Map(),active=new Map(),targets=new Map(),attempts=new Set(),outcomes=new Map(),events=[];
 let now=spec.now;
 for(const a of spec.actors){
  ensure(a&&id(a.actor_id)&&!actors.has(a.actor_id)&&int(a.revision)&&a.revision<=Number.MAX_SAFE_INTEGER-1024&&int(a.knowledge_revision)&&int(a.resources)&&["active","incapacitated","deceased"].includes(a.life_status),"invalid actor");
  actors.set(a.actor_id,{actor_id:a.actor_id,revision:a.revision,knowledge_revision:a.knowledge_revision,resources:a.resources,life_status:a.life_status});
 }
 const baseline={world_id:world,now,actors:[...actors.values()].map(copy)};
 function normalizeOffer(o,current=true){
  // Privileged resolver supplies event-time real feasibility and prepared phases; never cognition.
  ensure(o&&o.world_id===world&&id(o.actor_id)&&actors.has(o.actor_id)&&id(o.opportunity_id)&&id(o.action_id)&&["action","refusal"].includes(o.kind)&&int(o.actor_revision)&&int(o.knowledge_revision)&&int(o.valid_until)&&typeof o.feasible==="boolean"&&(o.exclusive_target===null||id(o.exclusive_target))&&int(o.credit_cap)&&o.credit_cap<=10000&&Array.isArray(o.phases)&&o.phases.length>=1&&o.phases.length<=4,"invalid offer");
  const a=actors.get(o.actor_id);ensure(current?o.actor_revision===a.revision&&o.knowledge_revision===a.knowledge_revision&&o.valid_until>=now:o.actor_revision<=a.revision&&o.knowledge_revision<=a.knowledge_revision&&o.valid_until>=baseline.now,"stale or invalid offer");
  const order=["preparation","movement","execution","recovery"];let prev=-1,total=0,duration=0,exec=false;
  const phases=o.phases.map(p=>{
   ensure(p&&order.includes(p.kind)&&order.indexOf(p.kind)>prev&&int(p.duration)&&p.duration>0&&p.duration<=1000000&&int(p.cost)&&p.cost<=1000000&&typeof p.interruptible==="boolean"&&int(p.credit_per_tick)&&p.credit_per_tick<=10000&&(p.kind==="execution"||p.credit_per_tick===0),"invalid phase");
   prev=order.indexOf(p.kind);if(p.kind==="execution")exec=true;total+=p.cost;duration+=p.duration;
   return {kind:p.kind,duration:p.duration,cost:p.cost,interruptible:p.interruptible,credit_per_tick:p.credit_per_tick};
  });
  ensure(exec&&(current?now:baseline.now)+duration<Number.MAX_SAFE_INTEGER&&Object.keys(o.phases).length===o.phases.length&&phases.every(p=>p),"invalid execution duration");
  return {world_id:world,actor_id:o.actor_id,opportunity_id:o.opportunity_id,action_id:o.action_id,kind:o.kind,actor_revision:o.actor_revision,knowledge_revision:o.knowledge_revision,valid_until:o.valid_until,feasible:o.feasible,exclusive_target:o.exclusive_target,credit_cap:o.credit_cap,phases,total,duration};
 }
 function publishOffer(o){
  const normalized=normalizeOffer(o),key=o.actor_id+":"+o.opportunity_id;
  ensure(!offers.has(key)||offers.get(key).actor_revision!==actors.get(o.actor_id).revision,"duplicate current offer");
  offers.set(key,normalized);
 }
 function revokeOffer(actor_id,opportunity_id,actor_revision){
  // Privileged invalidation when real access, target or conditions change before admission.
  ensure(id(actor_id)&&id(opportunity_id)&&int(actor_revision),"invalid revocation");
  const a=actors.get(actor_id),key=actor_id+":"+opportunity_id,o=offers.get(key);
  ensure(a&&a.revision===actor_revision&&o&&o.actor_revision===actor_revision,"stale or missing offer");
  offers.delete(key);
 }
 function syncKnowledge(actor_id,expected,next){
  const a=actors.get(actor_id);
  ensure(a&&int(expected)&&int(next)&&a.knowledge_revision===expected&&next>=expected,"invalid knowledge revision update");
  if(next===expected)return;
  ensure(a.revision<Number.MAX_SAFE_INTEGER-2,"actor revision exhausted");
  a.knowledge_revision=next;a.revision++;
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
  ensure(o&&o.action_id===d.action_id&&o.kind===d.disposition&&o.actor_revision===a.revision&&o.knowledge_revision===a.knowledge_revision&&o.valid_until>=now&&o.feasible,"unavailable offer");
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
 const exact=(o,keys)=>o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
 const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length&&Array.from({length:a.length},(_,i)=>Object.hasOwn(a,i)).every(Boolean);
 const same=(a,b)=>{if(a===b)return true;if(!a||!b||typeof a!=="object"||typeof b!=="object"||Array.isArray(a)!==Array.isArray(b))return false;if(Array.isArray(a)&&(!dense(a)||!dense(b)||a.length!==b.length))return false;const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&same(a[k],b[k]))};
 // Trusted private checkpoint. Historical terminal phase definitions may no longer be in offers.
 function exportCheckpoint(){return {format:"execution-checkpoint-v1",initial:copy(baseline),state:state(),offers:[...offers.values()].map(copy),attempt_ids:[...attempts]}}
 if(checkpoint!==null){
  ensure(exact(checkpoint,["format","initial","state","offers","attempt_ids"])&&checkpoint.format==="execution-checkpoint-v1"&&same(checkpoint.initial,baseline),"invalid execution checkpoint identity");
  const s=checkpoint.state;
  ensure(exact(s,["world_id","now","actors","active","outcomes","events"])&&s.world_id===world&&int(s.now)&&s.now>=baseline.now&&s.now<Number.MAX_SAFE_INTEGER&&dense(s.actors)&&s.actors.length===actors.size&&dense(s.active)&&dense(s.outcomes)&&dense(s.events)&&dense(checkpoint.offers)&&dense(checkpoint.attempt_ids),"invalid execution checkpoint state");
  now=s.now;
  const trace=new Map(),spentByActor=new Map(),starts=new Map(),finishes=new Map(),inFlight=new Map();
  const order=["preparation","movement","execution","recovery"];
  let last=baseline.now;
  for(const e of s.events){
   ensure(e&&id(e.attempt_id)&&actors.has(e.actor_id)&&int(e.tick)&&e.tick>=last&&e.tick<=now,"invalid event chronology");
   last=e.tick;let t=trace.get(e.attempt_id);
   if(e.kind==="phase_started"){
    ensure(exact(e,["kind","attempt_id","actor_id","phase","tick","cost"])&&order.includes(e.phase)&&int(e.cost)&&e.cost<=1000000,"invalid phase-start event");
    if(!t){ensure(!inFlight.has(e.actor_id),"overlapping historical attempts");t={actor:e.actor_id,phases:[],spent:0,open:null,released:false,terminal:null};trace.set(e.attempt_id,t);inFlight.set(e.actor_id,e.attempt_id);starts.set(e.actor_id,(starts.get(e.actor_id)||0)+1)}
    ensure(t.actor===e.actor_id&&!t.terminal&&!t.open&&(!t.phases.length||order.indexOf(e.phase)>order.indexOf(t.phases.at(-1).phase))&&(!t.phases.length||t.phases.at(-1).end===e.tick)&&(!t.phases.some(p=>p.phase==="execution")||t.released),"invalid phase sequence");
    const row={phase:e.phase,start:e.tick,cost:e.cost,end:null};t.phases.push(row);t.open=row;t.spent+=e.cost;spentByActor.set(e.actor_id,(spentByActor.get(e.actor_id)||0)+e.cost);
   }else{
    ensure(t&&t.actor===e.actor_id&&!t.terminal,"orphan or repeated execution event");
    if(e.kind==="phase_completed"){
     ensure(exact(e,["kind","attempt_id","actor_id","phase","tick"])&&t.open&&t.open.phase===e.phase&&e.tick>t.open.start&&e.tick-t.open.start<=1000000,"invalid phase completion");t.open.end=e.tick;t.open=null;
    }else if(e.kind==="execution_boundary"){
     ensure(exact(e,["kind","attempt_id","actor_id","tick"])&&!t.open&&!t.released&&t.phases.at(-1).phase==="execution"&&t.phases.at(-1).end===e.tick,"invalid execution boundary");t.released=true;
    }else if(e.kind==="terminal"){
     ensure(exact(e,["kind","attempt_id","actor_id","tick","outcome","spent","released_reservation","released_effect"])&&["completed","interrupted","cancelled","failed"].includes(e.outcome)&&e.spent===t.spent&&int(e.released_reservation)&&e.released_reservation<=4000000&&e.released_effect===t.released&&((e.outcome==="completed"&&!t.open&&t.released&&t.phases.at(-1).end===e.tick&&e.released_reservation===0)||(e.outcome!=="completed"&&t.open)),"invalid terminal event");
     t.terminal=e;inFlight.delete(e.actor_id);finishes.set(e.actor_id,(finishes.get(e.actor_id)||0)+1);
    }else throw Error("unknown execution event");
   }
  }
  ensure(same(checkpoint.attempt_ids,[...trace.keys()]),"attempt history mismatch");
  for(const key of checkpoint.attempt_ids)attempts.add(key);
  for(let i=0;i<s.actors.length;i++){
   const a=s.actors[i],b=baseline.actors[i];
   ensure(exact(a,["actor_id","revision","knowledge_revision","resources","life_status"])&&a.actor_id===b.actor_id&&a.life_status===b.life_status&&int(a.revision)&&int(a.knowledge_revision)&&a.knowledge_revision>=b.knowledge_revision&&int(a.resources)&&a.resources===b.resources-(spentByActor.get(a.actor_id)||0),"invalid actor accounting");
   const k=a.knowledge_revision-b.knowledge_revision,changes=a.revision-b.revision-(starts.get(a.actor_id)||0)-(finishes.get(a.actor_id)||0);
   ensure(changes>=(k>0?1:0)&&changes<=k,"invalid actor revision");actors.set(a.actor_id,copy(a));
  }
  for(const o of checkpoint.offers){
   const normalized=normalizeOffer(o,false),key=o.actor_id+":"+o.opportunity_id;
   ensure(!offers.has(key)&&same(o,normalized),"invalid restored offer");offers.set(key,normalized);
  }
  const terminalOrder=s.events.filter(e=>e.kind==="terminal").map(e=>e.attempt_id);
  ensure(same(s.outcomes.map(r=>r?.attempt_id),terminalOrder),"terminal outcome order mismatch");
  for(const r of s.outcomes){
   const t=trace.get(r.attempt_id),e=t?.terminal;
   ensure(exact(r,["committed","event_id","attempt_id","world_id","actor_id","plan_id","tick","outcome","credited_units"])&&r.committed===true&&r.world_id===world&&e&&r.actor_id===e.actor_id&&r.event_id==="out_"+r.attempt_id&&r.tick===e.tick&&r.outcome===e.outcome&&(r.plan_id===null||id(r.plan_id))&&int(r.credited_units)&&r.credited_units<=10000&&(t.phases.some(p=>p.phase==="execution")||r.credited_units===0),"invalid terminal receipt");outcomes.set(r.attempt_id,copy(r));
  }
  for(const a of s.active){
   const t=trace.get(a?.attempt_id),actor=actors.get(a?.actor_id);
   ensure(exact(a,["attempt_id","actor_id","action_id","opportunity_id","plan_id","plan_revision","started_tick","phase_index","phases","phase_started_tick","phase_end_tick","reserved_remaining","spent","credited_units","credit_cap","exclusive_target","released"])&&t&&!t.terminal&&t.actor===a.actor_id&&actor?.life_status==="active"&&!active.has(a.actor_id)&&id(a.action_id)&&id(a.opportunity_id)&&((a.plan_id===null&&a.plan_revision===null)||(id(a.plan_id)&&int(a.plan_revision)))&&dense(a.phases)&&int(a.phase_index)&&a.phase_index<a.phases.length&&a.phase_index===t.phases.length-1,"invalid active attempt");
   const o=normalizeOffer({world_id:world,actor_id:a.actor_id,opportunity_id:a.opportunity_id,action_id:a.action_id,kind:"action",actor_revision:actor.revision,knowledge_revision:actor.knowledge_revision,valid_until:now,feasible:true,exclusive_target:a.exclusive_target,credit_cap:a.credit_cap,phases:a.phases},false);
   ensure(same(a.phases,o.phases)&&int(a.started_tick)&&a.started_tick===t.phases[0].start&&a.started_tick+o.duration<Number.MAX_SAFE_INTEGER,"invalid active phases");
   let at=a.started_tick,credit=0;
   for(let i=0;i<=a.phase_index;i++){
    const p=o.phases[i],h=t.phases[i];ensure(h.phase===p.kind&&h.start===at&&h.cost===p.cost,"active phase history mismatch");
    const end=at+p.duration;
    if(i<a.phase_index)ensure(h.end===end,"phase duration mismatch");
    else ensure(h.end===null&&a.phase_started_tick===at&&a.phase_end_tick===end&&at<=now&&now<end,"invalid active phase time");
    credit+=Math.min(end,now)-at>0?(Math.min(end,now)-at)*p.credit_per_tick:0;at=end;
   }
   ensure(a.spent===t.spent&&a.reserved_remaining===o.total-a.spent&&actor.resources>=a.reserved_remaining&&a.credited_units===Math.min(a.credit_cap,credit)&&a.released===t.released&&a.released===o.phases.slice(0,a.phase_index).some(p=>p.kind==="execution"),"active resource or progress mismatch");
   if(a.exclusive_target!==null){ensure(!targets.has(a.exclusive_target),"duplicate target reservation");targets.set(a.exclusive_target,a.attempt_id)}
   active.set(a.actor_id,copy(a));
  }
  ensure(active.size===inFlight.size&&[...inFlight].every(([a,v])=>active.get(a)?.attempt_id===v),"missing active attempt");
  events.push(...s.events.map(copy));
  ensure(same(exportCheckpoint(),checkpoint),"execution checkpoint reconstruction mismatch");
 }
 return Object.freeze({publishOffer,revokeOffer,syncKnowledge,admit,advanceTo,stop,nextBoundary,state,exportCheckpoint});
}
