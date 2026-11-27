// Development-only cross-store transaction coordinator; injected reference dependencies.
export function createWorldTransactionReference(store,deps,adapters,version,identity=null){
 const ensure=(v,m)=>{if(!v)throw Error(m)},id=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,40}$/.test(x),copy=x=>JSON.parse(deps.canonical(x)),same=(a,b)=>deps.canonical(a)===deps.canonical(b);
 ensure(deps&&["canonical","persistence","executor","scheduler","perception","planner","generate","decide"].every(k=>typeof deps[k]==="function")&&adapters&&typeof adapters.resolveOffer==="function"&&typeof adapters.projectOutcome==="function","invalid transaction dependencies");
 const exact=(o,keys)=>o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
 const contexts=new WeakMap();
 function makeExecutor(initial,checkpoint=null){
  ensure(initial&&id(initial.world_id)&&Array.isArray(initial.actors)&&Array.isArray(initial.npc_configs),"invalid integrated initial state");
  let x=deps.executor(initial),perception=deps.perception(initial.world_id);
  const world=initial.world_id,configs=new Map(),plans=new Map(),prepared=new Map(),seenFrames=new Map();
  const actorIds=new Set(initial.actors.map(a=>a.actor_id));
  ensure(initial.actors.every(a=>id(a.actor_id)&&a.knowledge_revision===0),"initial knowledge must be empty");
  const index=new Map(initial.actors.map((a,i)=>[a.actor_id,i]));
  let poison=null;
  for(const cfg of initial.npc_configs){
   ensure(exact(cfg,["actor_id","capabilities","motivation","plan"])&&actorIds.has(cfg.actor_id)&&!configs.has(cfg.actor_id)&&Array.isArray(cfg.capabilities)&&exact(cfg.motivation,["risk_aversion","stress","needs","values","goals"]),"invalid NPC config");
   const c=copy(cfg),a=x.state().actors.find(v=>v.actor_id===c.actor_id),k=perception.bindActor(c.actor_id).forCognition();
   const p={...c.motivation,world_id:world,actor_id:c.actor_id,actor_revision:a.revision,now:initial.now,life_status:a.life_status};
   const self={world_id:world,actor_id:c.actor_id,actor_revision:a.revision,as_of_tick:initial.now,capabilities:c.capabilities};
   deps.decide(p,k,deps.generate(p,k,self));
   configs.set(c.actor_id,c);
   if(c.plan!==null){
    ensure(c.plan&&c.plan.world_id===world&&c.plan.actor_id===c.actor_id&&c.motivation.goals.some(g=>g.id===c.plan.goal_id),"foreign plan or unknown goal");
    plans.set(c.actor_id,deps.planner(c.plan,deps.decide));
   }
  }
  if(checkpoint!==null){
   ensure(exact(checkpoint,["format","executor","scheduler","perception","plans","frames"])&&checkpoint.format==="integrated-checkpoint-v1"&&Array.isArray(checkpoint.plans)&&Array.isArray(checkpoint.frames),"invalid integrated checkpoint");
   x=deps.executor(initial,checkpoint.executor);
   const savedPlans=checkpoint.plans;
   ensure(savedPlans.length===plans.size,"plan checkpoint count mismatch");
   let n=0;
   for(const [a] of plans){
    const row=savedPlans[n++];
    ensure(exact(row,["actor_id","checkpoint"])&&row.actor_id===a,"plan checkpoint scope");
    plans.set(a,deps.planner(configs.get(a).plan,deps.decide,row.checkpoint));
   }
   // Reconstruct acquisition evidence from original trusted frames, including invisible events.
   for(const frame of checkpoint.frames){
    ensure(frame&&frame.world_id===world&&Number.isSafeInteger(frame.tick)&&frame.tick>=initial.now&&frame.tick<=x.state().now&&Array.isArray(frame.actors)&&frame.actors.every(a=>a&&actorIds.has(a.actor_id)&&a.world_id===world)&&frame.event?.world_id===world&&id(frame.event.id)&&!seenFrames.has(frame.event.id),"invalid historical observation frame");
    perception.ingest(frame);seenFrames.set(frame.event.id,deps.canonical(frame));
   }
   ensure(same(perception.exportCheckpoint(),checkpoint.perception),"observation provenance mismatch");
   // Independently exercise direct perception restore and compare it to the replayed frames.
   perception=deps.perception(world,checkpoint.perception);
   const state=x.state(),outcomes=new Map(state.outcomes.map(r=>[r.attempt_id,r])),active=new Map(state.active.map(r=>[r.actor_id,r])),settled=new Set();
   for(const a of state.actors)ensure(a.knowledge_revision===perception.bindActor(a.actor_id).forCognition().revision,"actor knowledge revision mismatch");
   for(const [a,plan] of plans){
    const s=plan.snapshot(),activity=active.get(a);
    if(s.pending){
     const p=s.pending,step=s.steps.find(v=>v.id===p.step_id);
     ensure(activity&&activity.plan_id===s.plan_id&&activity.plan_revision===s.revision-1&&activity.attempt_id===p.attempt_id&&activity.action_id===p.action_id&&activity.opportunity_id===p.opportunity_id&&activity.started_tick===p.started_tick&&activity.credit_cap<=step.required_units-step.credited_units,"pending plan execution mismatch");
    }else ensure(!activity||activity.plan_id===null,"orphan active plan binding");
    for(const h of s.history){
     const r=outcomes.get(h.receipt.attempt_id);
     ensure(r&&r.actor_id===a&&r.plan_id===s.plan_id&&!settled.has(r.attempt_id)&&same(h.receipt,{event_id:r.event_id,attempt_id:r.attempt_id,tick:r.tick,outcome:r.outcome,credited_units:r.credited_units}),"plan outcome mismatch");
     settled.add(r.attempt_id);
    }
   }
   for(const r of state.active)ensure(r.plan_id===null||plans.get(r.actor_id)?.snapshot().pending?.attempt_id===r.attempt_id,"unmatched active plan");
   for(const r of state.outcomes)ensure(r.plan_id===null||settled.has(r.attempt_id),"unmatched settled plan");
  }
  const actor=a=>x.state().actors.find(v=>v.actor_id===a);
  const knowledge=a=>perception.bindActor(a).forCognition();
  function observe(frame){
   ensure(frame&&frame.world_id===world&&frame.tick===x.state().now&&Array.isArray(frame.actors)&&frame.actors.every(a=>a&&actorIds.has(a.actor_id)&&a.world_id===world)&&frame.event?.world_id===world&&id(frame.event.id),"invalid event-time observation scope");
   const key=frame.event.id,bytes=deps.canonical(frame);
   if(seenFrames.has(key)){ensure(seenFrames.get(key)===bytes,"conflicting observation replay");return}
   perception.ingest(frame);
   for(const a of actorIds){const before=actor(a).knowledge_revision,after=knowledge(a).revision;if(after!==before)x.syncKnowledge(a,before,after)}
   seenFrames.set(key,bytes);
  }
  function review(ctx){
   prepared.delete(ctx.actor_id);
   const cfg=configs.get(ctx.actor_id);
   if(!cfg)return null;
   const a=actor(ctx.actor_id),k=knowledge(ctx.actor_id);
   ensure(a&&a.revision===ctx.actor_revision&&a.knowledge_revision===k.revision&&ctx.knowledge_revision===k.revision,"inconsistent actor knowledge");
   const p={...copy(cfg.motivation),world_id:world,actor_id:a.actor_id,actor_revision:a.revision,now:ctx.now,life_status:a.life_status};
   const self={world_id:world,actor_id:a.actor_id,actor_revision:a.revision,as_of_tick:ctx.now,capabilities:copy(cfg.capabilities)};
   const opts=deps.generate(p,k,self),planner=plans.get(a.actor_id);
   const r=planner?planner.review(p,k,opts):null,d=planner?r.decision:deps.decide(p,k,opts);
   if(!d||d.kind!=="intent")return null;
   const bound=!!(r&&r.step_id!==null&&r.step_id!==undefined);
   const step=bound?planner.snapshot().steps.find(s=>s.id===r.step_id):null;
   const cap=step?step.required_units-step.credited_units:null;
   const offer=adapters.resolveOffer(copy(ctx),copy(d),cap);
   if(offer===null)return null;
   ensure(offer&&offer.world_id===world&&offer.actor_id===a.actor_id&&offer.opportunity_id===d.opportunity_id&&offer.action_id===d.action_id&&offer.kind===d.disposition&&Number.isSafeInteger(offer.credit_cap)&&offer.credit_cap>=0,"invalid actual offer projection");
   const actual=copy(offer);if(cap!==null)actual.credit_cap=Math.min(actual.credit_cap,cap);
   const attempt_id="npc_"+index.get(a.actor_id)+"_"+a.revision+"_"+ctx.now;
   ensure(attempt_id.length<=36,"reference attempt identity budget");
   prepared.set(a.actor_id,{p,k,opts,d,attempt_id,binding:bound?{plan_id:r.plan_id,plan_revision:r.plan_revision}:null});
   return {intent:copy(d),offer:actual,attempt_id};
  }
  function admit(d,attemptId){
   const prep=prepared.get(d.actor_id);
   if(configs.has(d.actor_id))ensure(prep&&prep.attempt_id===attemptId&&same(prep.d,d),"unbound NPC dispatch");
   const receipt=x.admit(d,attemptId,prep?.binding??null);
   try{if(prep?.binding)plans.get(d.actor_id).admit(prep.p,prep.k,prep.opts,receipt)}
   catch(e){poison="plan admission failed: "+String(e);throw Error(poison)}
   prepared.delete(d.actor_id);return receipt;
  }
  function settle(r){
   try{
    if(r.plan_id!==null){const plan=plans.get(r.actor_id);ensure(plan&&plan.snapshot().plan_id===r.plan_id,"missing matching plan");plan.settle(r)}
    const frame=adapters.projectOutcome(copy(r));
    if(frame!==null){ensure(frame?.event?.id===r.event_id&&frame.tick===r.tick,"outcome projection identity mismatch");observe(frame)}
   }catch(e){poison="outcome integration failed: "+String(e);throw Error(poison)}
  }
  const facade=Object.freeze({state:x.state,publishOffer:x.publishOffer,revokeOffer:x.revokeOffer,nextBoundary:x.nextBoundary,admit,advanceTo:t=>{const rs=x.advanceTo(t);for(const r of rs)settle(r);return rs},stop:(a,b,c)=>{const r=x.stop(a,b,c);settle(r);return r}});
  contexts.set(facade,{configs,plans,review,observe,actorIds,knowledge,perception,seenFrames,executor:x,prepared,check:()=>ensure(poison===null,poison)});
  return facade;
 }
 function makeScheduler(x,player,checkpoint=null){
  const c=contexts.get(x);ensure(c&&!c.configs.has(player),"player cannot be autonomous NPC");
  const s=deps.scheduler(x,player,c.review,checkpoint?.scheduler??null);
  const exportCheckpoint=()=>{
   c.check();
   ensure(same(s.diagnostics().receipts,c.executor.state().outcomes),"scheduler/executor outcome mismatch");
   return {format:"integrated-checkpoint-v1",executor:c.executor.exportCheckpoint(),scheduler:s.exportCheckpoint(),perception:c.perception.exportCheckpoint(),plans:[...c.plans].map(([actor_id,p])=>({actor_id,checkpoint:p.exportCheckpoint()})),frames:[...c.seenFrames.values()].map(v=>JSON.parse(v))};
  };
  if(checkpoint!==null)ensure(same(exportCheckpoint(),checkpoint),"integrated checkpoint reconstruction mismatch");
  return Object.freeze({schedule:s.schedule,submit:s.submit,run:b=>{const v=s.run(b);c.check();c.prepared.clear();return v},observe:c.observe,exportCheckpoint,diagnostics:()=>({...s.diagnostics(),plans:[...c.plans.values()].map(p=>p.snapshot()),knowledge:[...c.actorIds].map(c.knowledge),acquisition_receipts:c.perception.exportReceipts(),observation_event_ids:[...c.seenFrames.keys()]})});
 }
 const journal=deps.persistence(store,makeExecutor,(x,player,_review,checkpoint=null)=>makeScheduler(x,player,checkpoint),()=>null,"integrated-"+version,identity);
 // Privileged recovery includes the private checkpoint. Actor callers receive only a bound view.
 function bindActor(actorId){
  ensure(id(actorId)&&journal.recover().checkpoint.scheduler.knowledge.some(k=>k.actor_id===actorId),"unknown actor");
  const view=()=>copy(journal.recover().checkpoint.scheduler.knowledge.find(k=>k.actor_id===actorId));
  return Object.freeze({forCognition:view,forNarrative:view});
 }
 return Object.freeze({initialize:journal.initialize,commit:journal.commit,recover:journal.recover,bindActor,exportPrivateCheckpoint:journal.exportPrivateCheckpoint,verifyCheckpointContinuation:journal.verifyCheckpointContinuation});
}
