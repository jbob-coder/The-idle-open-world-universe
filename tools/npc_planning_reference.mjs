// Development-only in-memory plan progress reference. Trusted admission and outcome inputs.
export function createPlanningReference(spec,decide){
 const ensure=(v,m)=>{if(!v)throw Error(m)}, id=v=>typeof v==="string"&&/^[A-Za-z0-9_-]{1,64}$/.test(v), tick=v=>Number.isSafeInteger(v)&&v>=0, copy=v=>JSON.parse(JSON.stringify(v));
 ensure(spec&&id(spec.world_id)&&id(spec.actor_id)&&id(spec.plan_id)&&id(spec.goal_id)&&typeof decide==="function"&&Array.isArray(spec.steps)&&spec.steps.length>0&&spec.steps.length<=32,"invalid plan");
 const definition=copy(spec),steps=new Map(),options=new Map();
 for(const s of definition.steps){
  ensure(s&&id(s.id)&&!steps.has(s.id)&&Number.isInteger(s.units)&&s.units>0&&s.units<=10000&&Array.isArray(s.requires)&&s.requires.length<=32&&new Set(s.requires).size===s.requires.length&&Array.isArray(s.options)&&s.options.length>0&&s.options.length<=16,"invalid step");
  steps.set(s.id,s);
  for(const o of s.options){ensure(o&&id(o.opportunity_id)&&id(o.action_id)&&!options.has(o.opportunity_id),"invalid or shared plan option");options.set(o.opportunity_id,{step:s.id,action:o.action_id})}
 }
 const visited=new Set(),visiting=new Set();
 function visit(s){ensure(!visiting.has(s.id),"cyclic dependency");if(visited.has(s.id))return;visiting.add(s.id);for(const r of s.requires){ensure(steps.has(r),"unknown dependency");visit(steps.get(r))}visiting.delete(s.id);visited.add(s.id)}
 for(const s of steps.values())visit(s);
 let revision=0,pending=null,lastTick=0,nextReview=0;
 const progress=new Map([...steps.keys()].map(k=>[k,0])),history=new Map(),attemptIds=new Set();
 const done=s=>progress.get(s.id)===s.units;
 const snapshot=()=>({world_id:definition.world_id,actor_id:definition.actor_id,plan_id:definition.plan_id,goal_id:definition.goal_id,revision,status:[...steps.values()].every(done)?"complete":pending?"in_progress":"open",last_tick:lastTick,next_review_tick:nextReview,pending:pending?copy(pending):null,steps:[...steps.values()].map(s=>({id:s.id,credited_units:progress.get(s.id),required_units:s.units})),history:[...history.values()].map(copy)});
 function review(profile,knowledge,opportunities){
  ensure(profile&&profile.world_id===definition.world_id&&profile.actor_id===definition.actor_id&&tick(profile.now)&&profile.now>=lastTick&&profile.now<Number.MAX_SAFE_INTEGER&&Array.isArray(profile.goals),"plan review scope or time");
  ensure(knowledge&&knowledge.world_id===definition.world_id&&knowledge.actor_id===definition.actor_id&&tick(knowledge.revision)&&tick(knowledge.as_of_tick)&&knowledge.as_of_tick<=profile.now,"knowledge scope");
  ensure(Array.isArray(opportunities)&&opportunities.length<=64&&new Set(opportunities.map(o=>o?.id)).size===opportunities.length,"invalid opportunity batch");
  for(const o of opportunities)ensure(o&&o.world_id===definition.world_id&&o.actor_id===definition.actor_id&&id(o.id)&&id(o.action_id),"opportunity scope");
  const base={plan_id:definition.plan_id,plan_revision:revision};
  if(pending)return {...base,kind:"busy",attempt_id:pending.attempt_id};
  if(profile.life_status!=="active")return {...base,kind:"inactive"};
  if(profile.now<nextReview)return {...base,kind:"wait",review_after_tick:nextReview};
  const goal=profile.goals.find(g=>g.id===definition.goal_id),active=goal?.status==="active";
  const complete=[...steps.values()].every(done),ready=new Set([...steps.values()].filter(s=>!done(s)&&s.requires.every(r=>done(steps.get(r)))).map(s=>s.id));
  const candidates=opportunities.filter(o=>{
   const link=options.get(o.id);if(!link)return true;
   ensure(link.action===o.action_id,"plan option action mismatch");
   // Step-specific occurrence IDs are reserved for this plan. Unrelated activities remain selectable.
   return active&&!complete&&ready.has(link.step)&&o.kind==="action";
  });
  const decision=decide(profile,knowledge,candidates);
  if(decision.kind!=="intent")return {...base,kind:decision.kind,decision};
  const link=options.get(decision.opportunity_id);
  return {...base,kind:"intent",decision,step_id:link?.step??null};
 }
 function admit(profile,knowledge,opportunities,accepted){
  // Privileged caller supplies actual dispatch admission, not merely a planner proposal.
  const r=review(profile,knowledge,opportunities);
  ensure(r.kind==="intent"&&r.step_id!==null,"no ready plan intent");
  const d=r.decision;
  ensure(accepted&&accepted.accepted===true&&id(accepted.attempt_id)&&!attemptIds.has(accepted.attempt_id)&&accepted.world_id===definition.world_id&&accepted.actor_id===definition.actor_id&&accepted.plan_id===definition.plan_id&&accepted.plan_revision===revision&&accepted.actor_revision===d.actor_revision&&accepted.knowledge_revision===d.knowledge_revision&&accepted.decision_tick===d.decision_tick&&accepted.opportunity_id===d.opportunity_id&&accepted.action_id===d.action_id,"invalid or stale admission");
  ensure(history.size<256,"history budget reached; persist and migrate");
  pending={attempt_id:accepted.attempt_id,step_id:r.step_id,opportunity_id:d.opportunity_id,action_id:d.action_id,started_tick:d.decision_tick};
  attemptIds.add(pending.attempt_id);lastTick=d.decision_tick;revision++;
  return snapshot();
 }
 function settle(receipt){
  // Trusted committed execution receipt; credited work must come from actual resolution.
  ensure(receipt&&receipt.committed===true&&id(receipt.event_id)&&id(receipt.attempt_id)&&receipt.world_id===definition.world_id&&receipt.actor_id===definition.actor_id&&receipt.plan_id===definition.plan_id&&tick(receipt.tick)&&receipt.tick<Number.MAX_SAFE_INTEGER&&["completed","interrupted","failed","cancelled"].includes(receipt.outcome)&&Number.isInteger(receipt.credited_units)&&receipt.credited_units>=0,"invalid outcome receipt");
  const row={event_id:receipt.event_id,attempt_id:receipt.attempt_id,tick:receipt.tick,outcome:receipt.outcome,credited_units:receipt.credited_units};
  if(history.has(row.event_id)){ensure(JSON.stringify(history.get(row.event_id).receipt)===JSON.stringify(row),"conflicting outcome replay");return snapshot()}
  ensure(pending&&pending.attempt_id===row.attempt_id&&row.tick>=pending.started_tick&&row.tick>=lastTick,"outcome does not match active attempt");
  const s=steps.get(pending.step_id),remaining=s.units-progress.get(s.id);
  ensure(row.credited_units<=remaining,"credit exceeds remaining work");
  progress.set(s.id,progress.get(s.id)+row.credited_units);
  history.set(row.event_id,{receipt:row,step_id:pending.step_id,action_id:pending.action_id,opportunity_id:pending.opportunity_id,started_tick:pending.started_tick});pending=null;lastTick=row.tick;nextReview=row.tick+1;revision++;
  return snapshot();
 }
 return Object.freeze({review,admit,settle,snapshot});
}
