// Independent native adapter QA; synthetic bytes only, not a gameplay resolver.
// Run: node docs/qa/check_receipt_storage_rollback.mjs (Node 22.16+).
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openDurableWorldStore } from '../../tools/durable_world_store.mjs';
const identity={world_id:'receipt-qa',seed:'fixture-seed'};
const bytes=(revision,progress,earned,receipts)=>JSON.stringify({format:'world-reference-v1',...identity,revision,progress,earned,receipts});
const initial=bytes(0,0,0,[]), committed=bytes(1,3000,1,[{id:'B2',outcome:'interrupted'}]);
const dir=mkdtempSync(join(tmpdir(),'godseed-receipt-qa-'));
const open=(p,mode='open')=>openDurableWorldStore(p,{mode,identity});
const sql=(p,statement)=>{const db=new DatabaseSync(p);try{db.exec(statement);}finally{db.close();}};
const failLate=p=>sql(p,`CREATE TRIGGER qa_late_failure BEFORE UPDATE ON world_identity BEGIN SELECT RAISE(ABORT,'qa injected late failure'); END;`);
const repair=p=>sql(p,'DROP TRIGGER qa_late_failure');
const inspect=p=>{const db=new DatabaseSync(p);try{return {identity:db.prepare('SELECT initialized FROM world_identity').get().initialized,record:db.prepare('SELECT revision,bytes,digest FROM world_record').get()};}finally{db.close();}};
let passed=0,total=0;
function test(name,fn){total++;try{fn();passed++;console.log('PASS',name);}catch(e){console.error('FAIL',name,e);}}
try{
  const p=join(dir,'first.db'),s=open(p,'create');
  try{
    failLate(p);
    test('late failure of first record leaves store uninitialized',()=>{assert.throws(()=>s.compareAndSwap(null,initial),/qa injected late failure/);assert.equal(s.read(),null);assert.deepEqual(inspect(p),{identity:0,record:undefined});});
    test('normal reopen after failed initialization',()=>{s.close();const t=open(p);try{assert.equal(t.read(),null);}finally{t.close();}});
    repair(p);
    test('explicit retry initializes exactly once',()=>{const t=open(p);try{assert.equal(t.compareAndSwap(null,initial),true);assert.equal(t.compareAndSwap(null,initial),false);assert.equal(t.read(),initial);}finally{t.close();}});
  }finally{s.close();}
  const q=join(dir,'later.db'),a=open(q,'create');
  try{
    assert.equal(a.compareAndSwap(null,initial),true);
    const before=inspect(q);failLate(q);
    test('late transaction failure rolls back state and receipt bytes',()=>{assert.throws(()=>a.compareAndSwap(initial,committed),/qa injected late failure/);assert.equal(a.read(),initial);assert.deepEqual(inspect(q),before);});
    test('normal reopen preserves original state and empty receipts',()=>{a.close();const b=open(q);try{assert.equal(b.read(),initial);assert.deepEqual(JSON.parse(b.read()).receipts,[]);}finally{b.close();}});
    repair(q);
    test('retry commits full synthetic state and receipt together',()=>{const b=open(q);try{assert.equal(b.compareAndSwap(initial,committed),true);assert.equal(b.read(),committed);}finally{b.close();}});
    test('lost acknowledgement style reopen recovers exact committed bytes',()=>{const b=open(q);try{const value=JSON.parse(b.read());assert.equal(value.progress,3000);assert.equal(value.earned,1);assert.deepEqual(value.receipts,[{id:'B2',outcome:'interrupted'}]);assert.equal(b.read(),committed);}finally{b.close();}});
    test('stale retry cannot double-write the committed record',()=>{const b=open(q);try{assert.equal(b.compareAndSwap(initial,committed),false);assert.equal(b.read(),committed);assert.equal(inspect(q).record.revision,1);}finally{b.close();}});
  }finally{a.close();}
}finally{rmSync(dir,{recursive:true,force:true});}
console.log(`${passed}/${total} passed (native V1 adapter only; not gameplay or receipt authentication)`);
if(passed!==total)process.exitCode=1;
