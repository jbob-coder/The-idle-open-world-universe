// Native SQLite composition QA, not a production save schema or gameplay API.
// Run: node docs/qa/check_wage_durable_boundary.mjs (Node 22.16+).
// Uses actual V1 adapter only as byte-level CAS; never open a real game save.
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDurableWorldStore} from '../../tools/durable_world_store.mjs';
import {make,stage} from './check_wage_rate_boundary.mjs';
const identity={world_id:'qa_wage',seed:'fixture-only'};
const terms={agreement:'A',employer:'E',worker:'N',currency:'CR',version:1,from:0,until:60000,rate:1800};
const proof=(id,start,end,extra={})=>({id,agreement:'A',employer:'E',worker:'N',currency:'CR',start,end,version:1,eligible:true,...extra});
const root=()=>({format:'world-reference-v1',...identity,revision:0,fixture_kind:'qa-wage-only-not-world-state',wage:make(),cash:{employer:100,worker:0}});
const encode=JSON.stringify;
const candidate=(bytes,p)=>{
  const before=JSON.parse(bytes),wage=stage(before.wage,p,terms);
  if(wage===before.wage)return {bytes,replayed:true};
  return {bytes:encode({...before,revision:before.revision+1,wage}),replayed:false};
};
const dir=mkdtempSync(join(tmpdir(),'godseed-wage-qa-'));
let passed=0,total=0;
const test=(name,f)=>{total++;const path=join(dir,`fixture-${total}.db`),handles=[];
  const open=(mode='open')=>{const s=openDurableWorldStore(path,{mode,identity});handles.push(s);return s};
  try{const db=open('create');assert.equal(db.compareAndSwap(null,encode(root())),true);f(db,open);passed++;console.log('PASS',name)}
  catch(e){console.error('FAIL',name,e);process.exitCode=1}
  finally{for(const h of handles)h.close()}
};
try{
  test('fractional carry survives normal database reopen', (db,open)=>{
    const before=db.read(),a=candidate(before,proof('a',0,3000));
    assert.equal(db.compareAndSwap(before,a.bytes),true);db.close();
    const next=open(),s=JSON.parse(next.read());assert.equal(s.wage.earned,1);assert.equal(s.wage.carry,1800000);assert.deepEqual(s.cash,root().cash);
    const b=candidate(next.read(),proof('b',3000,9000));assert.equal(next.compareAndSwap(next.read(),b.bytes),true);
    const end=JSON.parse(next.read());assert.equal(end.wage.earned,4);assert.equal(end.wage.carry,1800000);assert.equal(end.revision,2);
  });
  test('two connections reject stale writer without duplicate wage', (db,open)=>{
    const other=open(),before=db.read();assert.equal(other.read(),before);
    const a=candidate(before,proof('a',0,3000)),b=candidate(before,proof('b',0,9000));
    assert.equal(db.compareAndSwap(before,a.bytes),true);assert.equal(other.compareAndSwap(before,b.bytes),false);
    assert.equal(other.read(),a.bytes);assert.equal(JSON.parse(other.read()).wage.proofs.length,1);
  });
  test('exact proof retry after reopen is no new revision', (db,open)=>{
    const p=proof('a',0,9000),before=db.read(),a=candidate(before,p);assert.equal(db.compareAndSwap(before,a.bytes),true);db.close();
    const other=open(),again=candidate(other.read(),p);assert.equal(again.replayed,true);assert.equal(again.bytes,a.bytes);assert.equal(other.read(),a.bytes);
  });
  test('divergent retry and overlapping work preserve durable bytes',db=>{
    const before=db.read(),a=candidate(before,proof('a',0,3000));assert.equal(db.compareAndSwap(before,a.bytes),true);
    assert.throws(()=>candidate(db.read(),proof('a',0,9000)));assert.throws(()=>candidate(db.read(),proof('b',2000,9000)));assert.equal(db.read(),a.bytes);
  });
  test('discarded candidate and invalid proof have no durable effect', (db,open)=>{
    const before=db.read();candidate(before,proof('a',0,9000));assert.throws(()=>candidate(before,proof('b',0,9000,{eligible:false})));db.close();assert.equal(open().read(),before);
  });
  test('partitioned 2/1/6 second boundaries match single 9 second wage',db=>{
    const direct=JSON.parse(candidate(db.read(),proof('direct',0,9000)).bytes).wage;
    for(const [id,start,end] of [['b1',0,2000],['b2',2000,3000],['b3',3000,9000]]){const before=db.read(),a=candidate(before,proof(id,start,end));assert.equal(db.compareAndSwap(before,a.bytes),true)}
    const s=JSON.parse(db.read());assert.equal(s.wage.earned,direct.earned);assert.equal(s.wage.carry,direct.carry);assert.equal(s.wage.proofs.length,3);assert.deepEqual(s.cash,root().cash);
  });
  test('stale writer refreshes actual head, then valid next proof commits', (db,open)=>{
    const other=open(),before=db.read(),first=candidate(before,proof('a',0,3000));assert.equal(db.compareAndSwap(before,first.bytes),true);
    const stale=candidate(before,proof('b',3000,9000));assert.equal(other.compareAndSwap(before,stale.bytes),false);
    const current=other.read(),next=candidate(current,proof('b',3000,9000));assert.equal(other.compareAndSwap(current,next.bytes),true);assert.equal(JSON.parse(db.read()).wage.earned,4);
  });
  test('reopening existing fixture does not repost opening endowment', (db,open)=>{
    const before=db.read(),a=candidate(before,proof('a',0,60000));assert.equal(db.compareAndSwap(before,a.bytes),true);db.close();const s=open();assert.equal(s.compareAndSwap(null,encode(root())),false);assert.equal(s.read(),a.bytes);assert.equal(JSON.parse(s.read()).wage.earned,30);assert.deepEqual(JSON.parse(s.read()).cash,root().cash);
  });
}finally{rmSync(dir,{recursive:true,force:true})}
console.log(`SQLite wage composition: ${passed}/${total} passed`);
// Limitations: no world replay/checkpoint validation, actual work proof authority,
// payment handler, epoch/rewind, process-crash or Android testing. The V1 adapter
// validates identity/revision/digest, not domain completeness; this synthetic
// wrapper is deliberately NOT a valid full simulation save. Imported wage
// diagnostic also runs its standalone 20 checks. Do not promote this to runtime.
