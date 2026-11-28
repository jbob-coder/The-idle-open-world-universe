// GODSEED QA-only executable design oracle. Not a runtime module or approved policy.
// Run: node docs/qa/check_arbitration_candidate.mjs
// Related PR #89; baseline main f75bdd14827bd6ea8555f6ca428132e91cff97c3.
// All identifiers, priorities and opportunity rounds are synthetic. No real saves.
// This models one common boundary with one requested target per actor.
// Domain authority determines eligibility, priority and when fair sharing applies.
// Strict priority is intentional for this oracle; low-priority service is not guaranteed.
function candidate(state, request) {
  const ok=(v,m)=>{if(!v)throw Error(m)};
  const integer=x=>Number.isSafeInteger(x)&&x>=0;
  const id=x=>typeof x==="string"&&/^[A-Za-z0-9_-]{1,40}$/.test(x);
  const exact=(x,k)=>x&&typeof x==="object"&&!Array.isArray(x)&&Object.keys(x).length===k.length&&k.every(v=>Object.hasOwn(x,v));
  const dense=x=>Array.isArray(x)&&Object.keys(x).length===x.length&&Array.from({length:x.length},(_,i)=>Object.hasOwn(x,i)).every(Boolean);
  const lex=(a,b)=>a<b?-1:a>b?1:0;
  ok(exact(state,["revision","waiting"])&&integer(state.revision)&&state.revision<Number.MAX_SAFE_INTEGER&&dense(state.waiting),"bad state");
  ok(exact(request,["expectedRevision","targets","intents"])&&request.expectedRevision===state.revision&&dense(request.targets)&&dense(request.intents),"stale or malformed request");
  const targets=new Map(),seen=new Set(),old=new Map(),groups=new Map();
  for(const t of request.targets){
    ok(exact(t,["id","available","fair"])&&id(t.id)&&typeof t.available==="boolean"&&typeof t.fair==="boolean"&&!targets.has(t.id),"invalid target");
    targets.set(t.id,t);
  }
  for(const w of state.waiting){
    ok(exact(w,["actor","target","priority","misses"])&&id(w.actor)&&id(w.target)&&integer(w.priority)&&integer(w.misses)&&w.misses>0&&!old.has(w.actor),"invalid wait history");
    old.set(w.actor,w);
  }
  for(const i of request.intents){
    ok(exact(i,["actor","target","eligible","willing","priority"])&&id(i.actor)&&targets.has(i.target)&&!seen.has(i.actor)&&typeof i.eligible==="boolean"&&typeof i.willing==="boolean"&&integer(i.priority),"invalid intent");
    seen.add(i.actor);
    if(!i.eligible||!i.willing)continue;
    const w=old.get(i.actor);
    const misses=w&&w.target===i.target&&w.priority===i.priority?w.misses:0;
    const g=groups.get(i.target)||[];
    g.push({...i,misses});groups.set(i.target,g);
  }
  const waiting=[],grants=[];
  for(const t of [...targets.values()].sort((a,b)=>lex(a.id,b.id))){
    const rows=groups.get(t.id)||[];
    // No artificial waiting credit if the target is unavailable. Preserve
    // existing credit only for still willing, eligible, same-priority intents.
    if(!t.available){
      if(t.fair)for(const i of rows)if(i.misses)waiting.push({actor:i.actor,target:t.id,priority:i.priority,misses:i.misses});
      continue;
    }
    if(!rows.length)continue;
    // Non-fair targets have no generic fallback: require a domain resolver.
    ok(t.fair,"domain allocation required");
    rows.sort((a,b)=>b.priority-a.priority||b.misses-a.misses||lex(a.actor,b.actor));
    const winner=rows[0];grants.push({actor:winner.actor,target:t.id});
    for(const i of rows.slice(1)){
      // Strict priority: lower tiers earn no additional fair-share credit
      // when a higher tier claims the resource. Preserve any prior credit
      // in their unchanged tier. Credit resets after grant, absent intent,
      // loss of eligibility/willingness, or change of target/priority.
      const misses=i.misses+(i.priority===winner.priority?1:0);
      ok(integer(misses),"wait overflow");
      if(misses)waiting.push({actor:i.actor,target:t.id,priority:i.priority,misses});
    }
  }
  waiting.sort((a,b)=>lex(a.actor,b.actor));
  return {state:{revision:state.revision+1,waiting},grants};
}

function testCandidate(){
  const results=[],eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
  const check=(v,m="assertion")=>{if(!v)throw Error(m)};
  const test=(name,f)=>{try{f();results.push({name,pass:true})}catch(e){results.push({name,pass:false,error:String(e)})}};
  const throws=f=>{let rejected=false;try{f()}catch{rejected=true}check(rejected,"expected rejection")};
  const empty=()=>({revision:0,waiting:[]});
  const target=(id="T",available=true,fair=true)=>({id,available,fair});
  const intent=(actor,priority=1,extra={})=>({actor,target:"T",eligible:true,willing:true,priority,...extra});
  const request=(s,intents,targets=[target()])=>({expectedRevision:s.revision,targets,intents});
  const step=(s,intents,targets)=>candidate(s,request(s,intents,targets));
  function run(actors,rounds,reverse=false,start=empty()){
    let s=start;const counts=Object.fromEntries(actors.map(a=>[a,0])),trace=[];
    for(let n=0;n<rounds;n++){
      const order=reverse?[...actors].reverse():actors;
      const z=step(s,order.map(a=>intent(a)));s=z.state;
      check(z.grants.length===1);counts[z.grants[0].actor]++;trace.push(z.grants[0].actor);
    }
    return {s,counts,trace};
  }
  const a=run(["A","B"],20),b=run(["A","B"],20,true),c=run(["A","B","C","D","E"],100);
  test("two equivalent contenders each receive ten grants",()=>check(eq(a.counts,{A:10,B:10})));
  test("input reversal preserves complete trace and state",()=>check(eq(a,b)));
  test("five equivalent contenders each receive twenty grants",()=>check(Object.values(c.counts).every(n=>n===20)));
  test("continuous equal eligibility serves all within N rounds",()=>{for(let i=0;i<c.trace.length;i+=5)check(new Set(c.trace.slice(i,i+5)).size===5)});
  test("strict higher priority takes precedence",()=>{let s=empty();for(let i=0;i<20;i++){const z=step(s,[intent("A",1),intent("B",2)]);check(z.grants[0].actor==="B");s=z.state}});
  test("ineligible high-priority actor never granted",()=>check(step(empty(),[intent("A",99,{eligible:false}),intent("B")]).grants[0].actor==="B"));
  test("unwilling actor never forced",()=>check(step(empty(),[intent("A",99,{willing:false})]).grants.length===0));
  test("independent targets grant concurrently",()=>check(step(empty(),[intent("A"),intent("B",1,{target:"U"})],[target(),target("U")]).grants.length===2));
  test("held target not allocated and waiting credit preserved",()=>{const s=step(empty(),[intent("A"),intent("B")]).state;const z=step(s,[intent("A"),intent("B")],[target("T",false)]);check(z.grants.length===0&&eq(z.state.waiting,s.waiting))});
  test("absence clears old waiting credit",()=>{const s=step(empty(),[intent("A"),intent("B")]).state;check(step(s,[intent("A")]).state.waiting.length===0)});
  test("eligibility loss clears credit",()=>{const s=step(empty(),[intent("A"),intent("B")]).state;check(step(s,[intent("A"),intent("B",1,{eligible:false})]).state.waiting.length===0)});
  test("changed target cannot reuse old credit",()=>{const s=step(empty(),[intent("A"),intent("B")]).state;const z=step(s,[intent("B",1,{target:"U"}),intent("A",1,{target:"U"})],[target(),target("U")]);check(z.grants[0].actor==="A")});
  test("changed priority cannot reuse old credit",()=>{const s=step(empty(),[intent("A"),intent("B")]).state;check(step(s,[intent("A",2),intent("B",2)]).grants[0].actor==="A")});
  test("non-fair domain requires explicit resolver",()=>throws(()=>step(empty(),[intent("A")],[target("T",true,false)])));
  test("duplicate actor intents rejected rather than double allocated",()=>throws(()=>step(empty(),[intent("A"),intent("A")])));
  test("unknown target rejected",()=>throws(()=>step(empty(),[intent("A",1,{target:"U"})])));
  test("duplicate targets rejected",()=>throws(()=>step(empty(),[intent("A")],[target(),target()])));
  test("stale revision rejected",()=>throws(()=>candidate(empty(),{...request(empty(),[intent("A")]),expectedRevision:1})));
  test("pure stage leaves original state and request unchanged",()=>{const s=step(empty(),[intent("A"),intent("B")]).state,q=request(s,[intent("A"),intent("B")]),before=JSON.stringify([s,q]);candidate(s,q);check(JSON.stringify([s,q])===before)});
  test("discarded stage does not earn waiting credit",()=>{const s=empty(),q=request(s,[intent("A"),intent("B")]);const discarded=candidate(s,q);check(eq(discarded,candidate(s,q))&&s.waiting.length===0&&s.revision===0)});
  test("serialized snapshot continuation reproduces next grants",()=>{const p=run(["A","B"],7);check(eq(run(["A","B"],13,false,JSON.parse(JSON.stringify(p.s))).trace,a.trace.slice(7)))});
  test("rewind fixture restores waiting history, not abandoned future",()=>{const p=run(["A","B"],3);run(["A","B"],8,false,p.s);check(eq(run(["A","B"],5,false,p.s).trace,a.trace.slice(3,8)))});
  test("credit overflow rejects without mutation",()=>{const s={revision:1,waiting:[{actor:"B",target:"T",priority:1,misses:Number.MAX_SAFE_INTEGER},{actor:"A",target:"T",priority:1,misses:Number.MAX_SAFE_INTEGER}]};const before=JSON.stringify(s);throws(()=>step(s,[intent("A"),intent("B")]));check(JSON.stringify(s)===before)});
  test("malformed sparse intent list rejected",()=>throws(()=>step(empty(),Array(1))));
  return {results,counts:{two:a.counts,five:c.counts},trace:a.trace};
}
// Scope limits: grant is a proposal, not labor or an economic effect; world
// coordinator must validate and atomically reserve before commit. One boundary
// includes complete contenders; NEVER split by technical review budget.
// Lexical actor-ID tie only in fixture, not a production policy or combat rule.
// Revision is fixture-local, not world/epoch identity. Actual CAS, command
// deduplication, persistence/rewind, release, cross-resource dependencies,
// admissions, offscreen simulation and gameplay require separate integration.
// Equal-grant counts do not imply equal time, pay, or outcomes for differing tasks.
const report=testCandidate();
console.log(JSON.stringify(report,null,2));
if(report.results.some(x=>!x.pass))process.exitCode=1;
