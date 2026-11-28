// Review-only validation of the existing three-boundary contract example.
// Run: node docs/qa/check_choice_receipt_contract.mjs
// This is NOT a general schema, transaction authority, auth or privacy proof.
// The fixture's simple worker obligation aggregate and units require peer review.
// No gameplay is activated. No runtime effects, file writes or RNG.
import {readFileSync} from 'node:fs';
import {canonicalWorldJson as canon} from '../../tools/world_persistence_reference.mjs';
const doc=JSON.parse(readFileSync(new URL('./choice_receipt_contract_candidate.json',import.meta.url),'utf8'));
const copy=x=>JSON.parse(canon(x));
const eq=(a,b)=>canon(a)===canon(b);
const int=x=>Number.isSafeInteger(x)&&x>=0;
const id=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,40}$/.test(x);
function requireThat(ok,reason){if(!ok)throw Error(reason);}
function shape(x,keys){requireThat(x!==null&&typeof x==="object"&&!Array.isArray(x)&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k)),"unexpected fields: "+keys.join(","));}
function validate(d){
  requireThat(d.version==="0.1-proposal"&&d.status==="review_only_inactive","inactive review envelope");
  const f=d.fixture,initial=f.initial;
  requireThat(f.clock_version==="gregorian-ms-v1-candidate"&&f.currency_unit==="synthetic_minor_unit","candidate units");
  requireThat([f.world_id,f.epoch_id,initial.actor_id,initial.worker_id,initial.work_agreement_id].every(id)&&initial.actor_id!==initial.worker_id,"identity scope");
  requireThat(initial.location_id==="LOC-0002"&&initial.route_id==="RTE-0002"&&initial.route_length_mm===9000&&initial.progress_mm===0&&initial.payable_minor===0,"pinned route and opening fixture");
  requireThat([initial.world_revision,initial.now_tick,initial.actor_revision,initial.knowledge_revision,initial.worker_revision].every(int)&&initial.now_tick<=315537897599999,"safe initial state");
  const rate=f.synthetic_rate;
  requireThat(int(rate.movement_mm_per_second)&&rate.movement_mm_per_second>0&&int(rate.wage_minor_per_second)&&rate.wage_minor_per_second>0,"positive fixture rates");
  requireThat(Array.isArray(f.boundaries)&&f.boundaries.length===3,"three sample boundaries");
  const P=initial.actor_id,N=initial.worker_id,ids=new Set(),sessions=new Set(),choices=new Set();
  const unique=(x)=>{requireThat(id(x)&&!ids.has(x),"duplicate or invalid identity");ids.add(x);};
  let tick=initial.now_tick,rev=initial.world_revision,ar=initial.actor_revision,kr=initial.knowledge_revision,nr=initial.worker_revision,progress=0,payable=0,lastSession=null,lastReceipt=null,activity=null;
  const terminal=[];
  for(let i=0;i<f.boundaries.length;i++){
    const b=f.boundaries[i],s=b.private_stage,c=b.command,pr=b.public_result,p=pr.scoped_receipt;
    shape(c,["version","world_id","epoch_id","expected_revision","command_id","actor_id","kind","issued_tick","payload"]);
    requireThat(c.version==="2-candidate"&&c.world_id===f.world_id&&c.epoch_id===f.epoch_id&&c.actor_id===P&&c.expected_revision===rev&&c.issued_tick===tick,"command scope/revision");
    unique(c.command_id);unique(s.boundary_receipt_id);
    requireThat(id(s.session_id)&&id(s.activity_id)&&s.expected_world_revision===rev&&s.start_tick===tick&&int(s.end_tick)&&s.end_tick>tick&&s.end_tick<=315537897599999,"stage clock/revision");
    const elapsed=s.end_tick-tick;
    if(i===0)activity=s.activity_id;
    requireThat(s.activity_id===activity,"activity continuity");
    if(i===1){
      requireThat(c.kind==="continue_session"&&b.prepared_choice===null&&s.session_id===lastSession,"technical continuation scope");
      shape(c.payload,["session_id","prior_boundary_receipt_id"]);
      requireThat(c.payload.session_id===lastSession&&c.payload.prior_boundary_receipt_id===lastReceipt,"technical continuation binding");
    }else{
      requireThat(c.kind==="submit_choice"&&!sessions.has(s.session_id),"new confirmed session");sessions.add(s.session_id);
      shape(c.payload,["choice_id"]);
      const q=b.prepared_choice;
      shape(q,["choice_id","actor_id","world_id","epoch_id","world_revision","actor_revision","knowledge_revision","prepared_tick","valid_until_tick","public_preview"]);
      requireThat(id(q.choice_id)&&!choices.has(q.choice_id)&&q.choice_id===c.payload.choice_id&&q.actor_id===P&&q.world_id===f.world_id&&q.epoch_id===f.epoch_id&&q.world_revision===rev&&q.actor_revision===ar&&q.knowledge_revision===kr&&q.prepared_tick===tick&&q.valid_until_tick===tick,"prepared choice binding");
      choices.add(q.choice_id);
      requireThat(eq(q.public_preview,{kind:"conditional",label:i===0?"Walk to the lobby":"Resume toward the lobby"}),"preview allowlist");
    }
    lastSession=s.session_id;lastReceipt=s.boundary_receipt_id;
    requireThat(Array.isArray(s.effects)&&s.effects.length===2&&Array.isArray(s.events)&&s.events.length===2,"fixture effect and event counts");
    const [m,w]=s.effects,[me,we]=s.events,fact=s.staged_work_fact;
    const outcome=["pending","interrupted","completed"][i],arrival=i===2?"LOC-0003":null;
    for(const [e,v,subject,subjectRev,domain,kind,eventKind,eventOutcome] of [[m,me,P,ar,"world","travel_progress","travel_boundary",outcome],[w,we,N,nr,"life","earned_obligation","work_accrual","accrued"]]){
      shape(e,["effect_id","domain","schema_version","subject_id","expected_subject_revision","kind","payload","causal_event_id"]);unique(e.effect_id);unique(v.event_id);
      requireThat(e.domain===domain&&e.schema_version==="1-candidate"&&e.subject_id===subject&&e.expected_subject_revision===subjectRev&&e.kind===kind&&e.causal_event_id===v.event_id,"effect subject/version/causal link");
      requireThat(eq(v,{event_id:v.event_id,world_id:f.world_id,epoch_id:f.epoch_id,world_revision:rev+1,tick:s.end_tick,causal_ids:[c.command_id],kind:eventKind,effect_ids:[e.effect_id],outcome:eventOutcome,source_actor_id:subject}),"event envelope");
    }
    unique(fact.fact_id);
    requireThat(eq(fact,{fact_id:fact.fact_id,reserved_event_id:we.event_id,actor_id:N,agreement_id:initial.work_agreement_id,eligible_elapsed_ms:elapsed,authority:"coordinator_stage"}),"staged proof binding");
    const delta=BigInt(rate.movement_mm_per_second)*BigInt(elapsed),earn=BigInt(rate.wage_minor_per_second)*BigInt(elapsed);
    requireThat(delta%1000n===0n&&earn%1000n===0n&&delta/1000n<=BigInt(Number.MAX_SAFE_INTEGER)&&earn/1000n<=BigInt(Number.MAX_SAFE_INTEGER),"exact fixture rates; no invented carry");
    const nextProgress=progress+Number(delta/1000n),nextPayable=payable+Number(earn/1000n);
    requireThat(int(nextProgress)&&int(nextPayable)&&nextProgress<=initial.route_length_mm&&(i===2?nextProgress===initial.route_length_mm:nextProgress<initial.route_length_mm),"actual progress/obligation bounds");
    requireThat(eq(m.payload,{activity_id:activity,route_id:initial.route_id,from_progress_mm:progress,to_progress_mm:nextProgress,elapsed_ms:elapsed,arrival_location_id:arrival}),"movement continuity");
    requireThat(eq(w.payload,{agreement_id:initial.work_agreement_id,staged_fact_id:fact.fact_id,eligible_elapsed_ms:elapsed,earned_minor:Number(earn/1000n),before_payable_minor:payable,after_payable_minor:nextPayable}),"earned obligation continuity");
    requireThat(eq(s.new_subject_revisions,{[P]:ar+1,[N]:nr+1}),"one revision bump per fixture subject");
    const observations=i===1?[{evidence_id:"OBS2",kind:"interruption_observed",source_visible_event_id:me.event_id}]:[];
    const expectedHead={world_id:f.world_id,epoch_id:f.epoch_id,world_revision:rev+1,now_tick:s.end_tick,actor_id:P,actor_revision:ar+1,knowledge_revision:kr+observations.length};
    const expectedReceipt={receipt_id:s.boundary_receipt_id,command_id:c.command_id,session_id:s.session_id,world_id:f.world_id,epoch_id:f.epoch_id,actor_id:P,outcome,start_tick:tick,end_tick:s.end_tick,visible_event_ids:[me.event_id],own_effects:[{kind:"travel_progress",route_id:initial.route_id,progress_mm:nextProgress,arrival_location_id:arrival}],observed_facts:observations,remaining_activity:i===2?null:{activity_id:activity,remaining_mm:initial.route_length_mm-nextProgress},content_version:"fixture-v1",render_policy:i===0?"no_terminal_segment":"eligible_committed_segment"};
    requireThat(eq(pr,{command_id:c.command_id,status:"committed",public_head:expectedHead,scoped_receipt:expectedReceipt,choice_availability:i===0?"blocked_pending_session":"refresh_required"}),"public result allowlist/semantic projection");
    if(i!==0)terminal.push(p.receipt_id);
    tick=s.end_tick;rev++;ar++;nr++;kr+=observations.length;progress=nextProgress;payable=nextPayable;
  }
  requireThat(eq(f.expected_final,{world_revision:rev,elapsed_ms:tick-initial.now_tick,progress_mm:progress,location_id:"LOC-0003",worker_earned_minor:payable,worker_cash_payment_minor:0,worker_payable_minor:payable,terminal_render_receipt_ids:terminal}),"final totals");
  return true;
}
const mutations=[
 ["activation",d=>d.status="active"],
 ["wrong clock unit",d=>d.fixture.clock_version="seconds"],
 ["same worker and player",d=>d.fixture.initial.worker_id=d.fixture.initial.actor_id],
 ["wrong route",d=>d.fixture.initial.route_length_mm=8000],
 ["foreign world",d=>d.fixture.boundaries[0].command.world_id="X"],
 ["stale epoch",d=>d.fixture.boundaries[0].command.epoch_id="E0"],
 ["stale command revision",d=>d.fixture.boundaries[1].command.expected_revision--],
 ["duplicate operation",d=>d.fixture.boundaries[1].command.command_id=d.fixture.boundaries[0].command.command_id],
 ["client effect injection",d=>d.fixture.boundaries[0].command.payload.earned_minor=100],
 ["unbound continuation",d=>d.fixture.boundaries[1].command.payload.session_id="S9"],
 ["wrong continuation cursor",d=>d.fixture.boundaries[1].command.payload.prior_boundary_receipt_id="B9"],
 ["duplicate resume session",d=>d.fixture.boundaries[2].private_stage.session_id="S1"],
 ["stale knowledge",d=>d.fixture.boundaries[2].prepared_choice.knowledge_revision--],
 ["expired choice",d=>d.fixture.boundaries[2].prepared_choice.valid_until_tick--],
 ["private preview",d=>d.fixture.boundaries[0].prepared_choice.public_preview.privateReason="secret"],
 ["time gap",d=>d.fixture.boundaries[1].private_stage.start_tick++],
 ["zero elapsed",d=>d.fixture.boundaries[0].private_stage.end_tick=d.fixture.boundaries[0].private_stage.start_tick],
 ["wrong activity",d=>d.fixture.boundaries[2].private_stage.activity_id="A9"],
 ["wrong subject revision",d=>d.fixture.boundaries[1].private_stage.effects[1].expected_subject_revision--],
 ["unknown effect",d=>d.fixture.boundaries[1].private_stage.effects[1].kind="grant_cash"],
 ["wrong effect event",d=>d.fixture.boundaries[0].private_stage.effects[1].causal_event_id="EVP1"],
 ["wrong event causal command",d=>d.fixture.boundaries[0].private_stage.events[1].causal_ids=["C9"]],
 ["wrong proof actor",d=>d.fixture.boundaries[1].private_stage.staged_work_fact.actor_id="P"],
 ["duplicate work proof",d=>d.fixture.boundaries[1].private_stage.staged_work_fact.fact_id="F1"],
 ["unearned duration",d=>d.fixture.boundaries[1].private_stage.staged_work_fact.eligible_elapsed_ms++],
 ["fake arrival",d=>d.fixture.boundaries[0].private_stage.effects[0].payload.arrival_location_id="LOC-0003"],
 ["extra progress",d=>d.fixture.boundaries[1].private_stage.effects[0].payload.to_progress_mm++],
 ["unfunded invented wage",d=>d.fixture.boundaries[1].private_stage.effects[1].payload.earned_minor++],
 ["double payable",d=>d.fixture.boundaries[2].private_stage.effects[1].payload.after_payable_minor*=2],
 ["multiple revision bumps",d=>d.fixture.boundaries[0].private_stage.new_subject_revisions.N++],
 ["hidden event ID",d=>d.fixture.boundaries[1].public_result.scoped_receipt.visible_event_ids.push("EVN2")],
 ["private wage in own effects",d=>d.fixture.boundaries[0].public_result.scoped_receipt.own_effects[0].earned_minor=20],
 ["private head digest",d=>d.fixture.boundaries[0].public_result.public_head.state_digest="secret"],
 ["foreign receipt actor",d=>d.fixture.boundaries[0].public_result.scoped_receipt.actor_id="N"],
 ["fake terminal prose",d=>d.fixture.boundaries[0].public_result.scoped_receipt.render_policy="eligible_committed_segment"],
 ["early choice",d=>d.fixture.boundaries[0].public_result.choice_availability="refresh_required"],
 ["reordered terminal segments",d=>d.fixture.expected_final.terminal_render_receipt_ids.reverse()],
 ["invented cash payment",d=>d.fixture.expected_final.worker_cash_payment_minor=90]
];
const results=[{name:"committed candidate valid",pass:validate(doc)}];
for(const [name,mutate] of mutations){const q=copy(doc);mutate(q);let rejected=false;try{validate(q);}catch{rejected=true;}results.push({name,pass:rejected});}
console.log(JSON.stringify({scope:"candidate fixture validation only",passed:results.filter(r=>r.pass).length,total:results.length,results},null,2));
if(results.some(r=>!r.pass))throw Error("choice receipt contract fixture validation failed");
