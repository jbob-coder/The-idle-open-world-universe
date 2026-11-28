// Host-only reference benchmark. NOT an Android test or a production save.
// Run: node docs/qa/bench_a54_storage_host.mjs (Node 22.16+).
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {openDurableWorldStore} from '../../tools/durable_world_store.mjs';
const identity={world_id:'qa_a54_host',seed:'fixture-only'};
const dir=mkdtempSync(join(tmpdir(),'godseed-a54-host-'));
const summary=a=>{const s=[...a].sort((x,y)=>x-y);return {p50_ms:+s[Math.ceil(s.length*.5)-1].toFixed(3),p95_ms:+s[Math.ceil(s.length*.95)-1].toFixed(3),max_ms:+s.at(-1).toFixed(3)}};
const measure=fn=>{const t=performance.now(),value=fn();return [value,performance.now()-t]};
const results=[];
try{
  for(const payloadBytes of [10000,100000,1000000]){
    const path=join(dir,`fixture-${payloadBytes}.db`);
    const root={format:'world-reference-v1',...identity,revision:0,payload:'x'.repeat(payloadBytes)};
    let bytes=JSON.stringify(root);
    const db=openDurableWorldStore(path,{mode:'create',identity});
    const read=[],write=[],encode=[];let submitted=0;
    try{
      assert.equal(db.compareAndSwap(null,bytes),true);
      for(let i=1;i<=24;i++){
        const [prior,r]=measure(()=>db.read());assert.equal(prior,bytes);
        const [next,e]=measure(()=>JSON.stringify({...root,revision:i}));
        const [ok,w]=measure(()=>db.compareAndSwap(prior,next));assert.equal(ok,true);
        bytes=next;read.push(r);encode.push(e);write.push(w);submitted+=Buffer.byteLength(next);
      }
      assert.equal(db.read(),bytes);
    }finally{db.close()}
    const reopened=openDurableWorldStore(path,{identity});
    try{assert.equal(reopened.read(),bytes)}finally{reopened.close()}
    results.push({payloadBytes,commits:24,submittedRecordBytes:submitted,dbFileBytes:statSync(path).size,read:summary(read),encode:summary(encode),cas:summary(write),verifiedReopen:true});
  }
}finally{rmSync(dir,{recursive:true,force:true})}
console.log(JSON.stringify({scope:'host only; not Galaxy A54',node:process.version,arch:process.arch,platform:process.platform,results},null,2));
// Timing includes adapter validation/hash/SQLite transaction, not gameplay.
// submittedRecordBytes is logical bytes, NOT physical flash writes or wear.
// Synthetic repetitive ASCII payload, no full-world checkpoint/replay.
