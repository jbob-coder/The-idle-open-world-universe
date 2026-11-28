// Node CLI for exact pinned reference source; candidate is isolated in memory, no runtime edits.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const pins={
  "tools/npc_cognition_reference.mjs": "fa6fbada18f89efa10f013dccd66f49d226ae697",
  "tools/npc_execution_reference.mjs": "835fcafba4fb566001b743e1c028c5cb689bcecb",
  "tools/npc_opportunity_reference.mjs": "2bb3402fe3f589d53604fd5d99c5c8657ef11ddf",
  "tools/npc_perception_reference.mjs": "4c88ddae030ef307f0a63c186756c13770762595",
  "tools/npc_planning_reference.mjs": "5cf56f164f6482a5929d4dc1bb8fd10a0bcba3b0",
  "tools/world_persistence_reference.mjs": "351280acb8b1ff6bae5deec4133ce3bb658d3894",
  "tools/world_scheduler_reference.mjs": "87827592c148078ccf8bed50f32b8d6ce4f2a909",
  "tools/world_transaction_reference.mjs": "d7e8c93fe9c98bb5550ba784a3c4962dde93c0d4",
  "tools/check_npc_execution.mjs": "90ddd8a0168e076ef13cc1aa3d03d7b1b77142f4",
  "tools/check_world_scheduler.mjs": "4413ab2ecc5dcbd1ae1996bf0116af2ff6125a27",
  "tools/check_execution_checkpoints.mjs": "25fa1ec51e8db909e2290cbb40243486a2ae898e",
  "tools/check_world_persistence.mjs": "d7ee44f7a72d0d4451a73b32b5123a9513d64eaa",
  "tools/check_world_transaction.mjs": "2ff38b8247a00d94ac37fa51f60d2cf150dd0573",
  "tools/check_integrated_checkpoints.mjs": "76fa28295d3212476c4149f0b74a5988200ef5a1",
  "docs/completion/check_scheduler_scale.mjs": "628ce74c222671bf4dfd78302dcad15e7bc946de"
};
// Review-only executable candidate. Does not write domain source, saves or build files.
const moduleNames = ["npc_cognition_reference","npc_execution_reference","npc_opportunity_reference","npc_perception_reference","npc_planning_reference","world_persistence_reference","world_scheduler_reference","world_transaction_reference"];
const suiteNames = ["check_npc_execution","check_world_scheduler","check_execution_checkpoints","check_world_persistence","check_world_transaction","check_integrated_checkpoints"];
const expected = [51,46,35,47,36,27];
const pathFor = name => "tools/"+name+".mjs";
function ensure(v,m){if(!v)throw Error(m)}
function replaceExactly(s,old,next){
  ensure(s.split(old).length===2,"candidate anchor changed: "+old);
  return s.replace(old,()=>next);
}
function candidateSources(sources){
  const out={...sources},ex=pathFor("npc_execution_reference"),sc=pathFor("world_scheduler_reference");
  out[ex]=replaceExactly(out[ex],
    "return Object.freeze({publishOffer,revokeOffer,syncKnowledge,admit,advanceTo,stop,nextBoundary,state,exportCheckpoint});",
    "return Object.freeze({publishOffer,revokeOffer,syncKnowledge,admit,advanceTo,stop,nextBoundary,state,exportCheckpoint,readClock:()=>now,readActor:id=>actors.has(id)?copy(actors.get(id)):null,readActivity:id=>active.has(id)?copy(active.get(id)):null});");
  for(const [old,next] of [
    ["const clock=()=>executor.state().now;","const clock=()=>executor.readClock?executor.readClock():executor.state().now;"],
    ["const activity=a=>executor.state().active.find(x=>x.actor_id===a);","const activity=a=>executor.readActivity?executor.readActivity(a):executor.state().active.find(x=>x.actor_id===a);"],
    ["const a=executor.state().actors.find(x=>x.actor_id===e.actor_id);","const a=executor.readActor?executor.readActor(e.actor_id):executor.state().actors.find(x=>x.actor_id===e.actor_id);"]
  ])out[sc]=replaceExactly(out[sc],old,next);
  return out;
}
function load(sources){
  const bindings={};
  for(const name of moduleNames){
    const names=[];
    const body=sources[pathFor(name)].replace(/^export\s+(?=(?:function|const|class)\s+(\w+))/gm,(_,n)=>{names.push(n);return ""});
    ensure(!/^\s*(?:import|export)\s/m.test(body),"unexpected module form "+name);
    Object.assign(bindings,new Function(body+"\nreturn {"+names.join(",")+"};")());
  }
  return bindings;
}
function runSuites(sources,bindings,trace){
  const b={...bindings};
  const storeFactory=b.createAtomicMemoryStore;
  b.createAtomicMemoryStore=()=>{
    const s=storeFactory();
    return Object.freeze({read:s.read,compareAndSwap(expected,next){
      const ok=s.compareAndSwap(expected,next);if(ok)trace.push(next);return ok;
    }});
  };
  return suiteNames.map((name,i)=>{
    let body=sources[pathFor(name)].replace(/^import \{([^}]+)\} from '\.\/[^']+\.mjs';$/gm,(_,names)=>{
      for(const n of names.split(",").map(x=>x.trim()))ensure(typeof b[n]==="function","missing import "+n);
      return "";
    });
    ensure(!/^\s*(?:import|export)\s/m.test(body),"unexpected test import "+name);
    const logs=[],proc={exitCode:0};
    new Function(...Object.keys(b),"console","process",body)(...Object.values(b),{log:x=>logs.push(x)},proc);
    const rows=JSON.parse(logs[0]),failed=rows.filter(x=>!x.pass);
    ensure(rows.length===expected[i]&&failed.length===0&&proc.exitCode===0,"regression "+name+": "+JSON.stringify(failed));
    return {name,passed:rows.length};
  });
}
function deps(b){return {canonical:b.canonicalWorldJson,persistence:b.createWorldPersistenceReference,executor:b.createExecutionReference,scheduler:b.createWorldSchedulerReference,perception:b.createPerceptionReference,planner:b.createPlanningReference,generate:b.generateNpcOpportunities,decide:b.decideNpcReference}}
function crossReplay(sources,old,next){
  // Reuse the exact transaction suite's fixture construction and helpers.
  const src=sources[pathFor("check_world_transaction")];
  const first=src.indexOf("function runTransactionTests("),last=src.indexOf(' test("initial plans and knowledge share the same world"');
  ensure(first>=0&&last>first,"transaction fixture anchor");
  const get=new Function(src.slice(first,last)+"\nreturn {fresh,make,commit,obs,schedule,start,run,adapters};\n}\nreturn runTransactionTests;")();
  const f=get(old.createAtomicMemoryStore,old.createWorldTransactionReference,deps(old));
  const {p,store}=f.fresh();
  f.commit(p,f.obs());f.commit(p,f.schedule());f.start(p);f.commit(p,f.run(1));
  const oldBytes=store.read(),initial=p.recover();
  const candidateStore=next.createAtomicMemoryStore();
  ensure(candidateStore.compareAndSwap(null,oldBytes),"copy journal");
  const q=f.make(candidateStore,f.adapters,deps(next));
  ensure(old.canonicalWorldJson(q.recover())===old.canonicalWorldJson(initial),"old journal not recoverable");
  ensure(candidateStore.read()===oldBytes,"recovery mutated old journal");
  f.commit(p,f.run());f.commit(q,f.run());
  ensure(store.read()===candidateStore.read(),"candidate continuation changed journal");
  ensure(old.canonicalWorldJson(p.recover())===old.canonicalWorldJson(q.recover()),"candidate recovery diverged");
  return {oldJournalBytes:oldBytes.length,finalJournalBytes:store.read().length,checks:4};
}
function getterChecks(b){
  const a={actor_id:"P",revision:4,knowledge_revision:0,resources:100,life_status:"active"};
  const x=b.createExecutionReference({world_id:"fixture",now:10,actors:[a]});
  ensure(x.readClock()===10,"clock");ensure(x.readActor("missing")===null&&x.readActivity("P")===null,"absent");
  x.readActor("P").resources=1;
  ensure(x.readActor("P").resources===100,"actor mutation");
  x.publishOffer({world_id:"fixture",actor_id:"P",actor_revision:4,knowledge_revision:0,opportunity_id:"work",action_id:"work",kind:"action",valid_until:10,feasible:true,exclusive_target:null,credit_cap:10,phases:[{kind:"execution",duration:2,cost:1,interruptible:true,credit_per_tick:1}]});
  x.admit({world_id:"fixture",actor_id:"P",actor_revision:4,knowledge_revision:0,decision_tick:10,kind:"intent",opportunity_id:"work",action_id:"work",disposition:"action"},"p1");
  const prior=x.readActivity("P");prior.phases[0].duration=99;prior.credited_units=99;
  ensure(x.readActivity("P").phases[0].duration===2&&x.readActivity("P").credited_units===0,"activity nested mutation");
  x.advanceTo(12);ensure(x.readClock()===12&&x.readActivity("P")===null,"terminal");
  const c=x.exportCheckpoint();ensure(c.format==="execution-checkpoint-v1"&&JSON.stringify(c)===JSON.stringify(b.createExecutionReference({world_id:"fixture",now:10,actors:[a]},c).exportCheckpoint()),"checkpoint");
  return 6;
}
function scale(sources,b,assert){
  // Reuse cycle 013's exact scenario. Only adapt digest to raw bytes, and omit timings.
  const source=sources["docs/completion/check_scheduler_scale.mjs"];
  const first=source.indexOf("function scenario("),last=source.indexOf("const rows=[scenario(");
  ensure(first>=0&&last>first,"scale fixture anchor");
  let body=source.slice(first,last);
  body=replaceExactly(body,"const digest=createHash('sha256').update(bytes).digest('hex');","const digest=bytes;");
  body=replaceExactly(body,"Buffer.byteLength(bytes)","bytes.length");
  const scenario=new Function("createExecutionReference","createWorldSchedulerReference","assert","performance",body+"\nreturn scenario;")(b.createExecutionReference,b.createWorldSchedulerReference,assert,{now:()=>0});
  return [scenario(12,4,10000),scenario(128,4,10000),scenario(128,4,32)];
}
function verify(sources,assert){
  const original=load(sources),candidate=load(candidateSources(sources));
  const oldWrites=[],newWrites=[];
  const oldSuites=runSuites(sources,original,oldWrites);
  const newSuites=runSuites(sources,candidate,newWrites);
  ensure(oldWrites.length===newWrites.length&&oldWrites.every((x,i)=>x===newWrites[i]),"successful CAS bytes diverged");
  // New scheduler against legacy executor also retains supported adapter behavior.
  const legacyWrites=[],legacySuites=runSuites(sources,{...candidate,createExecutionReference:original.createExecutionReference},legacyWrites);
  ensure(legacyWrites.length===oldWrites.length&&legacyWrites.every((x,i)=>x===oldWrites[i]),"legacy fallback bytes diverged");
  const a=scale(sources,original,assert),b=scale(sources,candidate,assert);
  ensure(a.every((x,i)=>x.digest===b[i].digest),"scale private checkpoint differs");
  ensure(b[1].digest===b[2].digest,"candidate partition changed state");
  const summarize=rows=>rows.map(({npcCount,waves,budget,slices,reads,eventRows,outcomeRows,actorRows,terminalEvents,terminalOutcomes})=>({npcCount,waves,budget,slices,reads,eventRows,outcomeRows,actorRows,terminalEvents,terminalOutcomes}));
  return {oldSuites,newSuites,legacySuites,identicalSuccessfulCASWrites:oldWrites.length,crossReplay:crossReplay(sources,original,candidate),getterChecks:getterChecks(candidate),baselineScale:summarize(a),candidateScale:summarize(b),checkpointParity:true,partitionParity:true};
}

const sources={};
for(const [path,sha] of Object.entries(pins)){
  const bytes=readFileSync(root+path);
  const actual=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  ensure(actual===sha,'source pin mismatch '+path);
  sources[path]=bytes.toString('utf8');
}
console.log(JSON.stringify({node:process.version,verification:verify(sources,assert),note:'Pinned source bodies executed in-process with ESM wrappers adapted; not a native Android or SQLite test'},null,2));
