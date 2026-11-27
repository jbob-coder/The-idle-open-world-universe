// Development-only cross-store transaction coordinator; injected reference dependencies.
export function createWorldTransactionReference(store,deps,adapters,version,identity=null){
 const ensure=(v,m)=>{if(!v)throw Error(m)},id=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,40}$/.test(x),copy=x=>JSON.parse(deps.canonical(x)),same=(a,b)=>deps.canonical(a)===deps.canonical(b);
 ensure(deps&&["canonical","persistence","executor","scheduler","perception","planner","generate","decide"].every(k=>typeof deps[k]==="function")&&adapters&&typeof adapters.resolveOffer==="function"&&typeof adapters.projectOutcome==="function","invalid transaction dependencies");
 const exact=(o,keys)=>o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
 const contexts=new WeakMap();
 function makeExecutor(initial){
  ensure(initial&&id(initial.world_id)&&Array.isArray(initial.actors)&&Array.isArray(initial.npc_configs),"invalid integrated initial state");
  const x=deps.executor(initial),world=initial.world_id,perception=deps.perception(world),configs=new Map(),plans=new Map(),prepared=new Map(),seenFrames=new Map();
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
  contexts.set(facade,{configs,plans,review,observe,actorIds,knowledge,perception,seenFrames,check:()=>ensure(poison===null,poison)});
  return facade;
 }
 function makeScheduler(x,player){
  const c=contexts.get(x);ensure(c&&!c.configs.has(player),"player cannot be autonomous NPC");
  const s=deps.scheduler(x,player,c.review);
  return Object.freeze({schedule:s.schedule,submit:s.submit,run:b=>{const v=s.run(b);c.check();return v},observe:c.observe,diagnostics:()=>({...s.diagnostics(),plans:[...c.plans.values()].map(p=>p.snapshot()),knowledge:[...c.actorIds].map(c.knowledge),acquisition_receipts:c.perception.exportReceipts(),observation_event_ids:[...c.seenFrames.keys()]})});
 }
 const journal=deps.persistence(store,makeExecutor,makeScheduler,()=>null,"integrated-"+version,identity);
 // Privileged recovery includes the private checkpoint. Actor callers receive only a bound view.
 function bindActor(actorId){
  ensure(id(actorId)&&journal.recover().checkpoint.scheduler.knowledge.some(k=>k.actor_id===actorId),"unknown actor");
  const view=()=>copy(journal.recover().checkpoint.scheduler.knowledge.find(k=>k.actor_id===actorId));
  return Object.freeze({forCognition:view,forNarrative:view});
 }
 return Object.freeze({initialize:journal.initialize,commit:journal.commit,recover:journal.recover,bindActor});
}
