// Development-only command journal and atomic memory-store reference, not disk persistence.
export function canonicalWorldJson(value){
 const visit=(v,depth=0)=>{
  if(depth>80)throw Error("data nesting budget");
  if(v===null||typeof v==="string"||typeof v==="boolean")return v;
  if(typeof v==="number"&&Number.isSafeInteger(v))return v;
  if(Array.isArray(v)){if(Object.keys(v).length!==v.length||!v.every((_,i)=>Object.hasOwn(v,i)))throw Error("non-JSON array");return Array.from(v,x=>visit(x,depth+1))}
  if(v&&typeof v==="object"&&(Object.getPrototypeOf(v)===Object.prototype||Object.getPrototypeOf(v)===null)){
   const out=Object.create(null);
   for(const k of Object.keys(v).sort()){
    if(["__proto__","constructor","prototype"].includes(k))throw Error("unsafe data key");
    out[k]=visit(v[k],depth+1);
   }
   return out;
  }
  throw Error("non-JSON value");
 };
 return JSON.stringify(visit(value));
}
export function createAtomicMemoryStore(){
 let data=null;
 return Object.freeze({read:()=>data,compareAndSwap:(expected,next)=>{
  if(typeof next!=="string")throw Error("invalid storage bytes");
  if(data!==expected)return false;
  data=next;return true;
 }});
}
export function createWorldPersistenceReference(store,createExecutor,createScheduler,reviewNpc,adapterVersion){
 const ensure=(v,m)=>{if(!v)throw Error(m)},id=v=>typeof v==="string"&&/^[A-Za-z0-9_-]{1,50}$/.test(v),int=v=>Number.isSafeInteger(v)&&v>=0;
 const canon=canonicalWorldJson,clone=v=>JSON.parse(canon(v)),same=(a,b)=>canon(a)===canon(b);
 const exact=(o,keys)=>o&&typeof o==="object"&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
 ensure(store&&typeof store.read==="function"&&typeof store.compareAndSwap==="function"&&typeof createExecutor==="function"&&typeof createScheduler==="function"&&typeof reviewNpc==="function"&&id(adapterVersion),"invalid persistence dependencies");
 function apply(runtime,cmd){
  ensure(cmd&&typeof cmd.kind==="string","invalid command");
  const {x,s}=runtime;
  if(cmd.kind==="publish"){ensure(exact(cmd,["kind","offer"]),"invalid publish command");x.publishOffer(cmd.offer)}
  else if(cmd.kind==="schedule"){ensure(exact(cmd,["kind","event"]),"invalid schedule command");s.schedule(cmd.event)}
  else if(cmd.kind==="submit"){ensure(exact(cmd,["kind","submission"]),"invalid submit command");s.submit(cmd.submission)}
  else if(cmd.kind==="run"){ensure(exact(cmd,["kind","budget"]),"invalid run command");const v=s.run(cmd.budget);ensure(v.status!=="fault","scheduler fault; transaction not committed")}
  else throw Error("unsupported command");
 }
 const capture=r=>({executor:r.x.state(),scheduler:r.s.diagnostics()});
 function build(root){
  ensure(exact(root,["format","adapter_version","world_id","seed","player_id","initial","revision","journal","checkpoint"])&&root.format==="world-reference-v1"&&root.adapter_version===adapterVersion&&id(root.world_id)&&typeof root.seed==="string"&&root.seed.length>0&&root.seed.length<=128&&id(root.player_id)&&root.initial?.world_id===root.world_id&&int(root.revision)&&Array.isArray(root.journal)&&root.revision===root.journal.length&&root.journal.length<=256,"invalid or incompatible world record");
  const x=createExecutor(clone(root.initial)),s=createScheduler(x,root.player_id,reviewNpc),runtime={x,s},seen=new Set();
  for(let i=0;i<root.journal.length;i++){
   const row=root.journal[i];
   ensure(exact(row,["revision","transaction_id","command"])&&row.revision===i+1&&id(row.transaction_id)&&!seen.has(row.transaction_id),"invalid journal sequence");
   seen.add(row.transaction_id);apply(runtime,clone(row.command));
  }
  ensure(same(capture(runtime),root.checkpoint),"checkpoint differs from replay");
  return runtime;
 }
 function readRoot(){
  const raw=store.read();ensure(typeof raw==="string"&&raw.length<=16000000,"missing or oversized world record");
  const root=JSON.parse(raw);ensure(canon(root)===raw,"noncanonical or corrupt world record");
  return {raw,root,runtime:build(root)};
 }
 function initialize(initial,player_id,seed){
  ensure(store.read()===null,"world already exists or storage unreadable");
  ensure(initial&&id(initial.world_id)&&id(player_id)&&typeof seed==="string"&&seed.length>0&&seed.length<=128,"invalid initial identity");
  const initialCopy=clone(initial),x=createExecutor(initialCopy),s=createScheduler(x,player_id,reviewNpc);
  const root={format:"world-reference-v1",adapter_version:adapterVersion,world_id:initial.world_id,seed,player_id,initial:initialCopy,revision:0,journal:[],checkpoint:capture({x,s})};
  const raw=canon(root);ensure(raw.length<=16000000&&store.compareAndSwap(null,raw)===true,"initialization conflict");
  return {world_id:root.world_id,revision:0};
 }
 function recover(){
  const {root}=readRoot();
  return {world_id:root.world_id,seed:root.seed,revision:root.revision,checkpoint:clone(root.checkpoint)};
 }
 function commit(transaction_id,expected_revision,command){
  ensure(id(transaction_id)&&int(expected_revision),"invalid transaction");
  const cmd=clone(command),{raw,root,runtime}=readRoot();
  const prior=root.journal.find(r=>r.transaction_id===transaction_id);
  if(prior){ensure(prior.revision===expected_revision+1&&same(prior.command,cmd),"conflicting transaction replay");return {revision:root.revision,transaction_revision:prior.revision,replayed:true}}
  ensure(root.revision===expected_revision&&root.revision<256,"stale revision or journal budget reached");
  apply(runtime,cmd);
  const revision=root.revision+1,next={...root,revision,journal:[...root.journal,{revision,transaction_id,command:cmd}],checkpoint:capture(runtime)},bytes=canon(next);
  ensure(bytes.length<=16000000,"world storage budget");
  ensure(store.compareAndSwap(raw,bytes)===true,"commit conflict");
  return {revision,transaction_revision:revision,replayed:false};
 }
 return Object.freeze({initialize,recover,commit});
}
