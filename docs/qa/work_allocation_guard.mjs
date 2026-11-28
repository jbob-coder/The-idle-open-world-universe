// Pure review candidate: allocate already-authorized exclusive work intervals.
// Coordinator owns time, identity, eligibility, revisions, CAS and publication.
// No currency mutation, storage, public API, or authority inferred here.
const keys=['world_id','epoch_id','fact_id','actor_id','activity_id','agreement_id','agreement_version','beneficiary_account_id','start_tick','end_tick'];
const id=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,40}$/.test(x);
const nat=x=>Number.isSafeInteger(x)&&x>=0;
const need=(ok,msg)=>{if(!ok)throw Error(msg)};
const dense=a=>Array.isArray(a)&&Array.from({length:a.length},(_,i)=>Object.hasOwn(a,i)).every(Boolean);
function normalize(f,world,epoch){
  need(f&&Object.getPrototypeOf(f)===Object.prototype&&Object.keys(f).length===keys.length&&keys.every(k=>Object.hasOwn(f,k)),'invalid fact shape');
  need(keys.slice(0,6).every(k=>id(f[k]))&&id(f.beneficiary_account_id)&&nat(f.agreement_version),'invalid fact identity');
  need(f.world_id===world&&f.epoch_id===epoch,'foreign fact scope');
  need(nat(f.start_tick)&&nat(f.end_tick)&&f.start_tick<f.end_tick,'invalid interval');
  return Object.fromEntries(keys.map(k=>[k,f[k]]));
}
// Half-open intervals [start_tick,end_tick). Exact repeats are not new work.
// History is the current epoch's already allocated facts; rewind migration and
// proof of real activity/permission belong to the authoritative coordinator.
export function stageWorkAllocations({world_id,epoch_id,start_tick,end_tick,history,facts}){
  need(id(world_id)&&id(epoch_id)&&nat(start_tick)&&nat(end_tick)&&start_tick<=end_tick,'invalid boundary');
  need(dense(history)&&dense(facts),'invalid fact collection');
  const seen=new Map(),byActor=new Map(),newFacts=[],replayedFactIds=[];
  function insert(f){
    seen.set(f.fact_id,f);
    if(!byActor.has(f.actor_id))byActor.set(f.actor_id,[]);
    byActor.get(f.actor_id).push(f);
  }
  for(const raw of history){
    const f=normalize(raw,world_id,epoch_id);
    need(!seen.has(f.fact_id),'duplicate history fact');
    need(f.end_tick<=start_tick,'history beyond boundary');
    insert(f);
  }
  for(const raw of facts){
    const f=normalize(raw,world_id,epoch_id),old=seen.get(f.fact_id);
    if(old){need(JSON.stringify(old)===JSON.stringify(f),'divergent fact identity');replayedFactIds.push(f.fact_id);continue}
    need(f.start_tick>=start_tick&&f.end_tick<=end_tick,'fact outside boundary');
    insert(f);newFacts.push(f);
  }
  for(const rows of byActor.values()){
    rows.sort((a,b)=>a.start_tick-b.start_tick||a.end_tick-b.end_tick);
    for(let i=1;i<rows.length;i++)need(rows[i-1].end_tick<=rows[i].start_tick,'overlapping exclusive worker intervals');
  }
  // All validation completed. No change to input even on a late conflict.
  // Only newFacts may drive new obligations, in the SAME outer atomic stage.
  const cmp=(a,b)=>a<b?-1:a>b?1:0;
  newFacts.sort((a,b)=>a.start_tick-b.start_tick||a.end_tick-b.end_tick||cmp(a.actor_id,b.actor_id)||cmp(a.fact_id,b.fact_id));
  replayedFactIds.sort(cmp);
  return {newFacts,replayedFactIds};
}
