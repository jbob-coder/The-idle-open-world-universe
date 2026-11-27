// Development-only shared scheduler; executor is the sole clock authority.
export function createWorldSchedulerReference(executor,playerId,reviewNpc){
 const ensure=(v,m)=>{if(!v)throw Error(m)},id=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,50}$/.test(x),tick=x=>Number.isSafeInteger(x)&&x>=0&&x<Number.MAX_SAFE_INTEGER,copy=x=>JSON.parse(JSON.stringify(x));
 const initial=executor.state(),world=initial.world_id,actorIds=new Set(initial.actors.map(a=>a.actor_id));
 ensure(id(playerId)&&actorIds.has(playerId)&&typeof reviewNpc==="function","invalid scheduler");
 const queue=[],used=new Set(),submissions=new Set(),journal=[],receipts=[];let seq=0,session=null,lastStop="ready",fault=null;
 const clock=()=>executor.state().now;
 const activity=a=>executor.state().active.find(x=>x.actor_id===a);
 const order=()=>queue.sort((a,b)=>a.tick-b.tick||a.sequence-b.sequence);
 function schedule(e){
  ensure(e&&id(e.id)&&!used.has(e.id)&&e.world_id===world&&tick(e.tick)&&e.tick>=clock()&&queue.length<4096&&used.size<10000,"invalid or duplicate event");
  const row={id:e.id,world_id:world,tick:e.tick,kind:e.kind,sequence:seq};
  if(e.kind==="review"){
   ensure(actorIds.has(e.actor_id)&&e.actor_id!==playerId&&tick(e.interval)&&e.interval>0,"invalid NPC review");
   row.actor_id=e.actor_id;row.interval=e.interval;
  }else if(e.kind==="world"){
   ensure(typeof e.player_observed==="boolean"&&typeof e.requires_decision==="boolean","invalid world event");
   row.player_observed=e.player_observed;row.requires_decision=e.requires_decision;
  }else if(e.kind==="interrupt"){
   ensure(actorIds.has(e.actor_id)&&id(e.attempt_id)&&["interrupted","cancelled","failed"].includes(e.outcome)&&typeof e.player_observed==="boolean"&&typeof e.requires_decision==="boolean","invalid interruption");
   row.actor_id=e.actor_id;row.attempt_id=e.attempt_id;row.outcome=e.outcome;row.player_observed=e.player_observed;row.requires_decision=e.requires_decision;
  }else throw Error("unknown event kind");
  seq++;used.add(row.id);queue.push(row);order();
 }
 function submit(cmd){
  ensure(!session&&cmd&&id(cmd.submission_id)&&!submissions.has(cmd.submission_id)&&submissions.size<10000&&tick(cmd.horizon)&&cmd.horizon>clock(),"invalid, duplicate or busy submission");
  const existing=activity(playerId);
  if(cmd.kind==="start"){
   ensure(!existing&&cmd.intent?.actor_id===playerId&&cmd.intent.world_id===world&&id(cmd.attempt_id),"invalid player intent");
   executor.admit(cmd.intent,cmd.attempt_id);
  }else if(cmd.kind==="resume"){
   ensure(existing&&existing.attempt_id===cmd.attempt_id,"no matching player activity");
  }else throw Error("unknown submission kind");
  submissions.add(cmd.submission_id);session={submission_id:cmd.submission_id,horizon:cmd.horizon,attempt_id:cmd.attempt_id,stop:null};lastStop="running";fault=null;
  return view();
 }
 function record(r){
  receipts.push(copy(r));
  if(session&&r.actor_id===playerId&&r.attempt_id===session.attempt_id)session.stop=session.stop||"player_action_ended";
 }
 function pause(e){
  if(e.player_observed&&e.requires_decision&&session)session.stop="player_decision";
 }
 function process(e){
  const log={event_id:e.id,tick:e.tick,kind:e.kind};
  if(e.kind==="review"){
   const a=executor.state().actors.find(x=>x.actor_id===e.actor_id);
   log.actor_id=e.actor_id;
   if(a.life_status!=="active"){log.result="inactive";return log}
   if(activity(e.actor_id)){log.result="busy";return log}
   // Trusted adapter must project only actor-owned knowledge and current capabilities.
   // It must be side-effect free; it returns an optional actual-feasibility dispatch proposal.
   const proposal=reviewNpc({world_id:world,actor_id:e.actor_id,now:clock(),actor_revision:a.revision,knowledge_revision:a.knowledge_revision});
   if(proposal===null){log.result="wait";return log}
   ensure(proposal&&proposal.intent?.actor_id===e.actor_id&&proposal.offer?.actor_id===e.actor_id&&proposal.intent.world_id===world&&proposal.offer.world_id===world&&id(proposal.attempt_id),"invalid NPC proposal scope");
   let published=false;
   try{
    executor.publishOffer(proposal.offer);published=true;
    executor.admit(proposal.intent,proposal.attempt_id);
    log.result="admitted";
   }catch(err){
    if(published)executor.revokeOffer(e.actor_id,proposal.offer.opportunity_id,a.revision);
    log.result="rejected";log.reason=String(err);
   }
   return log;
  }
  if(e.kind==="world"){log.result="recorded";pause(e);return log}
  const active=activity(e.actor_id);log.actor_id=e.actor_id;
  if(!active||active.attempt_id!==e.attempt_id){log.result="stale";return log}
  try{record(executor.stop(e.actor_id,e.attempt_id,e.outcome));log.result="stopped";pause(e)}
  catch(err){log.result="rejected";log.reason=String(err)}
  return log;
 }
 function run(budget=100){
  ensure(Number.isInteger(budget)&&budget>=1&&budget<=10000,"invalid work budget");
  if(!session)return view();
  fault=null;let spent=0;
  while(spent<budget){
   const now=clock(),due=queue[0];
   if(due&&due.tick===now){
    let log;
    try{log=process(due)}catch(err){fault=String(err);lastStop="fault";return view()}
    queue.shift();journal.push(log);spent++;
    if(due.kind==="review"&&log.result!=="inactive"&&tick(now+due.interval)){queue.push({...due,tick:now+due.interval,sequence:seq++});order()}
    continue;
   }
   if(session.stop||now===session.horizon){
    lastStop=session.stop||"horizon";session=null;return view();
   }
   const b=executor.nextBoundary(),target=Math.min(session.horizon,due?.tick??Infinity,b??Infinity);
   ensure(target>now&&tick(target),"invalid causal boundary");
   for(const r of executor.advanceTo(target))record(r);
   spent++;
  }
  // At a drained boundary the stop is final even if the budget is exactly exhausted.
  if((!queue.length||queue[0].tick!==clock())&&(session.stop||clock()===session.horizon)){
   lastStop=session.stop||"horizon";session=null;
  }else lastStop="budget";
  return view();
 }
 // Public view intentionally has no pending queue, private event IDs, NPC outcomes or diagnostic error.
 function view(){return {world_id:world,now:clock(),status:lastStop,submission_active:session!==null,player_activity:activity(playerId)?.attempt_id??null}}
 function diagnostics(){return {view:view(),session:session?copy(session):null,queue:queue.map(copy),journal:journal.map(copy),receipts:receipts.map(copy),fault}}
 return Object.freeze({schedule,submit,run,view,diagnostics});
}
