// Native adapter composition only. Never open a real save.
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openDurableWorldStore} from '../../tools/durable_world_store.mjs';
import {stageWorkWages} from './work_wage_stage.mjs';
const identity={world_id:'W',seed:'fixture-only'},epoch_id='E1';
const binding=(agreement_id='A')=>({agreement_id,actor_id:'N',beneficiary_account_id:'AC',employer_account_id:'EM',currency:'CR'});
const terms=['A','B'].map(a=>({...binding(a),agreement_version:1,from_tick:0,until_tick:60000,rate_minor_per_hour:1800}));
const root=()=>({format:'world-reference-v1',...identity,epoch_id,revision:0,fixture:'work-wage-only',now:0,history:[],obligations:terms.map(t=>({...binding(t.agreement_id),earned_minor:0,paid_minor:0,carry:0}))});
const fact=(fact_id,start_tick,end_tick,agreement_id='A')=>({world_id:'W',epoch_id,fact_id,actor_id:'N',activity_id:'act-'+fact_id,agreement_id,agreement_version:1,beneficiary_account_id:'AC',start_tick,end_tick});
const stage=(bytes,facts,end_tick)=>{const s=JSON.parse(bytes),r=stageWorkWages({world_id:s.world_id,epoch_id:s.epoch_id,start_tick:s.now,end_tick,history:s.history,facts,terms,obligations:s.obligations});const updates=new Map(r.obligationUpdates.map(x=>[x.agreement_id,x]));return {result:r,bytes:JSON.stringify({...s,revision:s.revision+1,now:end_tick,history:[...s.history,...r.newFacts],obligations:s.obligations.map(x=>updates.get(x.agreement_id)??x)})}};
const dir=mkdtempSync(join(tmpdir(),'godseed-work-wage-'));
let passed=0;
try{
  const path=join(dir,'fixture.db'),db=openDurableWorldStore(path,{mode:'create',identity});
  try{
    const initial=JSON.stringify(root());assert.equal(db.compareAndSwap(null,initial),true);
    const a=fact('a',0,3000),b=fact('b',3000,9000);
    const first=stage(initial,[a],3000);assert.equal(db.compareAndSwap(initial,first.bytes),true);passed++;
    assert.throws(()=>stage(first.bytes,[b,fact('duplicate',3000,9000,'B')],9000),/overlapping/);assert.equal(db.read(),first.bytes);passed++;
    const second=stage(first.bytes,[b],9000),other=openDurableWorldStore(path,{identity});
    try{assert.equal(other.compareAndSwap(first.bytes,second.bytes),true);assert.equal(db.compareAndSwap(first.bytes,second.bytes),false);assert.equal(db.read(),second.bytes);passed++}finally{other.close()}
    db.close();const reopened=openDurableWorldStore(path,{identity});
    try{
      const restored=JSON.parse(reopened.read());assert.equal(restored.history.length,2);assert.equal(restored.obligations[0].earned_minor,4);assert.equal(restored.obligations[0].carry,1800000);assert.equal(restored.obligations[1].earned_minor,0);passed++;
      const retry=stage(reopened.read(),[a,b],9000).result;assert.equal(retry.newFacts.length,0);assert.equal(retry.obligationUpdates.length,0);assert.equal(reopened.read(),second.bytes);passed++;
      const uncommitted=stage(reopened.read(),[fact('c',9000,10000,'B')],10000);assert.equal(uncommitted.result.obligationUpdates[0].carry,1800000);assert.equal(reopened.read(),second.bytes);passed++;
    }finally{reopened.close()}
  }finally{db.close()}
}finally{rmSync(dir,{recursive:true,force:true})}
console.log(`${passed}/6 passed`);
// No full-world save/replay, real work authority, payment, rewind or mobile test.
