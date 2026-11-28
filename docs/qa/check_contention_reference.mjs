// GODSEED independent integration QA proposal, not production gameplay.
// Baseline f75bdd14827bd6ea8555f6ca428132e91cff97c3.
// Related: #84 / #87 first playable local slice; #77 world and #79 economy.
// Node 22.16+: node docs/qa/check_contention_reference.mjs
// Diagnostic default: validate the reference's actual observed behavior and controls.
// --require-nonstarvation: intentionally fails on this baseline; candidate V2
// acceptance is conceptual until its typed arbitration interface is reviewed.
// No canonical NPC, calendar unit, wage, priority, or actual game save is used.
// All actors, durations, resources and target IDs below are synthetic.
// Exclusive target is a shared tool, not a claim of a real employment system.
// Do not add this to required CI until 01/02 review its scope and intended gate.
import {createWorldSchedulerReference as S} from "../../tools/world_scheduler_reference.mjs";
import {createExecutionReference as X} from "../../tools/npc_execution_reference.mjs";

function runProbe(S,X){
  const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const check=(condition,name)=>{if(!condition)throw Error(name);return name};
  function run(order,budget,shared=true){
    const actor=actor_id=>({actor_id,revision:4,knowledge_revision:0,resources:100,life_status:"active"});
    const x=X({world_id:"fixture",now:10,actors:["P","A","B"].map(actor)});
    const offer=(actor_id,now,revision,duration,exclusive_target)=>({world_id:"fixture",actor_id,actor_revision:revision,knowledge_revision:0,opportunity_id:"work",action_id:"work",kind:"action",valid_until:now,feasible:true,exclusive_target,credit_cap:100,phases:[{kind:"execution",duration,cost:1,interruptible:true,credit_per_tick:1}]});
    const intent=(actor_id,now,revision)=>({world_id:"fixture",actor_id,actor_revision:revision,knowledge_revision:0,decision_tick:now,kind:"intent",opportunity_id:"work",action_id:"work",disposition:"action"});
    const s=S(x,"P",c=>({offer:offer(c.actor_id,c.now,c.actor_revision,2,shared?"tool":c.actor_id),intent:intent(c.actor_id,c.now,c.actor_revision),attempt_id:c.actor_id+"_"+c.now}));
    for(const a of order)s.schedule({id:"review"+a,world_id:"fixture",tick:10,kind:"review",actor_id:a,interval:2});
    x.publishOffer(offer("P",10,4,40,null));
    s.submit({kind:"start",submission_id:"p",horizon:50,attempt_id:"p1",intent:intent("P",10,4)});
    for(let i=0;i<300&&s.view().submission_active;i++)s.run(budget);
    const d=s.diagnostics(),st=x.state();
    // Reconstruct overlap from the authoritative phase-start/terminal trace.
    // All NPC actions in this fixture have one phase.
    const holders=new Set();let maxHolders=0;
    for(const e of st.events){
      if(e.actor_id==="P")continue;
      if(e.kind==="phase_started"){holders.add(e.attempt_id);maxHolders=Math.max(maxHolders,holders.size)}
      if(e.kind==="terminal")holders.delete(e.attempt_id);
    }
    return {now:st.now,done:!s.view().submission_active,
      completed:Object.fromEntries(["A","B"].map(a=>[a,st.outcomes.filter(o=>o.actor_id===a&&o.outcome==="completed").length])),
      rejected:Object.fromEntries(["A","B"].map(a=>[a,d.journal.filter(j=>j.actor_id===a&&j.result==="rejected").length])),
      active:st.active.map(a=>a.actor_id),maxHolders,st,d};
  }
  const a=run(["A","B"],100),b=run(["B","A"],100),c=run(["A","B"],100,false);
  const diagnostics=[];
  diagnostics.push(check([a,b,c].every(x=>x.done&&x.now===50),"all fixtures complete at common horizon"));
  diagnostics.push(check(eq(a.completed,{A:20,B:0})&&eq(a.rejected,{A:0,B:21}),"A-first reference starvation reproduced"));
  diagnostics.push(check(eq(b.completed,{A:0,B:20})&&eq(b.rejected,{A:21,B:0}),"reversed insertion reverses winner"));
  diagnostics.push(check(eq(c.completed,{A:20,B:20})&&eq(c.rejected,{A:0,B:0}),"independent targets control"));
  diagnostics.push(check(a.maxHolders===1&&b.maxHolders===1&&c.maxHolders===2,"exclusive target not double allocated"));
  for(const budget of [1,2,3]){
    const z=run(["A","B"],budget);
    diagnostics.push(check(z.done&&eq(z.st,a.st)&&eq(z.d,a.d),"budget "+budget+" exactly matches 100"));
  }
  const compact=({now,done,completed,rejected,active,maxHolders})=>({now,done,completed,rejected,active,maxHolders});
  return {diagnosticChecks:diagnostics,reference:{aFirst:compact(a),bFirst:compact(b),independent:compact(c)},
    proposedNonstarvationGate:[a,b].every(z=>z.completed.A>0&&z.completed.B>0)};
}

/*
Proposed V2 acceptance/architecture (not an approved allocation rule):
At a shared time boundary: finish already earned work and release reservations;
collect feasible intents from a common pre-arbitration snapshot; let the owned
domain choose the winner(s) using actual eligibility, urgency, commitments and
available capacity; atomically reserve resources and commit. Rejected contenders
retain independent choice to retry, decline or do something else. Do not force
jobs, take turns regardless of merit, override contracts, or steal held assets.
For equivalent continuously eligible willing contenders for a fair-share
resource, persist an eligibility-aware wait credit/last-service record and
stable deterministic tie-break, not insertion order. No random draw on preview
or rejected CAS. Domain rules determine when fairness applies; emergency
priority and legal/ownership constraints may override it.
Test V2: equivalent contenders each obtain some service across a sustained
finite fixture regardless of registration/scheduling order; no double
allocation; distinct targets remain concurrent; same seed, inputs, and
technical budgets give equivalent outcomes. Include a deliberately ineligible
actor, changing preferences, unequal legitimate priority, release/interruption,
stale revision, failed CAS, technical retry, normal reopen and intentional
rewind of wait history. Do not infer universal fairness from the two-actor
diagnostic. Review with 01 and 02 before implementation. No time unit selected.
*/
const result=runProbe(S,X);
console.log(JSON.stringify(result,null,2));
if(process.argv.includes("--require-nonstarvation")&&!result.proposedNonstarvationGate)process.exitCode=1;
