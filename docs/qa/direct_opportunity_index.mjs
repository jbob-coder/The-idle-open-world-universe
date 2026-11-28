// Portable, derived review component for #83. Not an authoritative archive,
// access service, mixed-source belief resolver or complete opportunity selector.
// V1 actor-local observation ordinal and acquired tick must come from trusted
// committed, actor-authorized evidence. Rebuild after rewind/new epoch.
export function createDirectOpportunityIndex(scope){
 const ok=(v,m)=>{if(!v)throw Error(m)};
 const token=v=>typeof v==="string"&&/^[A-Za-z0-9_-]{1,64}$/.test(v);
 const tick=v=>Number.isSafeInteger(v)&&v>=0;
 const exact=(o,keys)=>o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
 const dense=a=>Array.isArray(a)&&Object.keys(a).length===a.length&&Array.from({length:a.length},(_,i)=>Object.hasOwn(a,i)).every(Boolean);
 const keyPattern=/^opp:(shift|job|lesson|person|route|rift|offer):[A-Za-z0-9_-]{1,32}$/;
 ok(exact(scope,["world_id","epoch_id","actor_id"])&&Object.values(scope).every(token),"invalid index scope");
 const identity={...scope},index=new Map();let revision=0,lastTick=0;
 // Keep at most two distinct witnesses for latest direct state. Prefer an
 // open witness, then lexical value, so conflicting same-tick claims never
 // become a confirmed opening merely because of ingestion order.
 function rank(a,b){
  if((a.value==="open")!==(b.value==="open"))return a.value==="open"?-1:1;
  return a.value<b.value?-1:a.value>b.value?1:0;
 }
 function append(input){
  ok(exact(input,["world_id","epoch_id","actor_id","revision","observation"])&&Object.keys(identity).every(k=>input[k]===identity[k]),"foreign evidence scope");
  ok(revision<Number.MAX_SAFE_INTEGER&&input.revision===revision+1,"noncontiguous evidence cursor");
  const o=input.observation;
  ok(exact(o,["id","acquired_tick","channel","claims"])&&o.id==="o"+input.revision&&tick(o.acquired_tick)&&o.acquired_tick>=lastTick&&["direct","report","record","internal"].includes(o.channel)&&dense(o.claims)&&o.claims.length>0&&o.claims.length<=100,"invalid observation");
  const seen=new Set();
  for(const c of o.claims){
   ok(exact(c,["key","value"])&&typeof c.key==="string"&&c.key.length>0&&c.key.length<=128&&typeof c.value==="string"&&c.value.length>0&&c.value.length<=2000&&!seen.has(c.key),"invalid claim");
   seen.add(c.key);
  }
  // All inputs validated before any index mutation. This cursor is a derived
  // projection checkpoint, not a command-deduplication or commit authority.
  for(const c of o.claims){
   if(!keyPattern.test(c.key))continue;
   const prior=index.get(c.key);
   if(o.channel!=="direct"){
    index.set(c.key,{mixed:true,tick:prior?.tick??null,witnesses:prior?.witnesses??[]});
    continue;
   }
   const witness={id:o.id,ordinal:input.revision,tick:o.acquired_tick,value:c.value};
   let witnesses=prior?.tick===o.acquired_tick?[...prior.witnesses]:[];
   witnesses=witnesses.filter(w=>w.value!==c.value);
   witnesses.push(witness);witnesses.sort(rank);
   index.set(c.key,{mixed:prior?.mixed??false,tick:o.acquired_tick,witnesses:witnesses.slice(0,2)});
  }
  revision=input.revision;lastTick=o.acquired_tick;return revision;
 }
 function project(keys){
  ok(dense(keys)&&keys.length<=64&&new Set(keys).size===keys.length&&keys.every(k=>typeof k==="string"&&keyPattern.test(k)),"invalid relevant key batch");
  // A mixed-source key must use a reviewed resolver. Do not silently remove
  // its conflicting evidence, nor present a report as direct truth.
  ok(keys.every(k=>!index.get(k)?.mixed),"mixed-source evidence requires resolver");
  const byObservation=new Map();
  for(const key of [...keys].sort()){
   for(const w of index.get(key)?.witnesses??[]){
    let row=byObservation.get(w.id);
    if(!row){row={ordinal:w.ordinal,record:{id:w.id,acquired_tick:w.tick,channel:"direct",claims:[]}};byObservation.set(w.id,row)}
    row.record.claims.push({key,value:w.value});
   }
  }
  const observations=[...byObservation.values()].sort((a,b)=>a.ordinal-b.ordinal).map(v=>v.record);
  return {schema_version:"0.1-proposal",world_id:identity.world_id,actor_id:identity.actor_id,as_of_tick:lastTick,revision,observations};
 }
 const stats=()=>({cursor:revision,mutable_keys:index.size,retained_witnesses:[...index.values()].reduce((n,v)=>n+v.witnesses.length,0)});
 return Object.freeze({append,project,stats});
}
