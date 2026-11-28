// QA candidate: privileged dispatch of existing V1 journals only. No automatic migration.
export function createVersionedReferenceRecovery(store,canonical,adapters,identity){
 const ensure=(v,m)=>{if(!v)throw Error(m)};
 const id=v=>typeof v==="string"&&/^[A-Za-z0-9_-]{1,50}$/.test(v);
 ensure(store&&typeof store.read==="function"&&typeof store.compareAndSwap==="function"&&typeof canonical==="function","invalid dependencies");
 ensure(identity&&id(identity.world_id)&&typeof identity.seed==="string"&&identity.seed.length>0&&identity.seed.length<=128,"trusted identity required");
 const bound=Object.freeze({world_id:identity.world_id,seed:identity.seed});
 ensure(Array.isArray(adapters)&&adapters.length>0&&adapters.length<=32,"adapter registry");
 const registry=new Map();
 for(const a of adapters){
  ensure(a&&id(a.version)&&typeof a.open==="function"&&!registry.has(a.version),"invalid or duplicate adapter");
  registry.set(a.version,a.open);
 }
 function envelope(raw){
  ensure(typeof raw==="string"&&raw.length<=16000000,"missing or oversized record");
  const root=JSON.parse(raw);
  ensure(root&&root.format==="world-reference-v1"&&canonical(root)===raw,"invalid journal envelope");
  ensure(root.world_id===bound.world_id&&root.seed===bound.seed,"world identity mismatch");
  ensure(id(root.adapter_version)&&registry.has(root.adapter_version),"unsupported adapter version");
  return root;
 }
 function invoke(method,args){
  const raw=store.read(),version=envelope(raw).adapter_version;
  let snapshot=raw,wrote=false;
  // Select and replay the same bytes. Actual writes still CAS the underlying store.
  const scoped=Object.freeze({read:()=>snapshot,compareAndSwap(expected,next){
    ensure(method==="commit"&&!wrote&&expected===snapshot,"invalid adapter write");
    ensure(envelope(next).adapter_version===version,"adapter version change forbidden");
    if(store.compareAndSwap(expected,next)!==true)return false;
    snapshot=next;wrote=true;return true;
  }});
  const adapter=registry.get(version)(scoped,bound);
  ensure(adapter&&typeof adapter[method]==="function","unsupported adapter operation");
  return adapter[method](...args);
 }
 return Object.freeze({recover:()=>invoke("recover",[]),commit:(...args)=>invoke("commit",args),
  exportPrivateCheckpoint:()=>invoke("exportPrivateCheckpoint",[]),
  verifyCheckpointContinuation:(...args)=>invoke("verifyCheckpointContinuation",args)});
}
