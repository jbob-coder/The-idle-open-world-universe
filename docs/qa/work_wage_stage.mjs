// Review candidate: pure private economic stage, not a public command or save API.
// Caller supplies already-authorized actual work facts and trusted versioned terms.
// No payment, time advancement, activity admission, or publication here.
import {stageWorkAllocations} from './work_allocation_guard.mjs';
const DEN=3600000n, MAX=BigInt(Number.MAX_SAFE_INTEGER);
const nat=x=>Number.isSafeInteger(x)&&x>=0;
const id=x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,40}$/.test(x);
const need=(ok,msg)=>{if(!ok)throw Error(msg)};
const shape=(x,keys)=>x&&Object.getPrototypeOf(x)===Object.prototype&&Object.keys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k));
const binding=['agreement_id','actor_id','beneficiary_account_id','employer_account_id','currency'];
const termKeys=[...binding,'agreement_version','from_tick','until_tick','rate_minor_per_hour'];
const balanceKeys=[...binding,'earned_minor','paid_minor','carry'];
const same=(a,b)=>binding.every(k=>a[k]===b[k]);
const order=(a,b)=>a<b?-1:a>b?1:0;
// Explicitly initialized obligation records required; missing is not zero.
// Time unit is candidate integer milliseconds, money in reviewed minor units.
export function stageWorkWages({world_id,epoch_id,start_tick,end_tick,history,facts,terms,obligations}){
  const allocation=stageWorkAllocations({world_id,epoch_id,start_tick,end_tick,history,facts});
  need(Array.isArray(terms)&&Array.isArray(obligations),'invalid terms or obligations');
  const balances=new Map(),versions=new Map(),byAgreement=new Map();
  for(const raw of obligations){
    need(shape(raw,balanceKeys)&&binding.every(k=>id(raw[k]))&&nat(raw.earned_minor)&&nat(raw.paid_minor)&&raw.paid_minor<=raw.earned_minor&&nat(raw.carry)&&BigInt(raw.carry)<DEN,'invalid obligation');
    need(!balances.has(raw.agreement_id),'duplicate obligation');balances.set(raw.agreement_id,{...raw});
  }
  for(const t of terms){
    need(shape(t,termKeys)&&binding.every(k=>id(t[k]))&&nat(t.agreement_version)&&nat(t.from_tick)&&nat(t.until_tick)&&t.from_tick<t.until_tick&&nat(t.rate_minor_per_hour),'invalid agreement terms');
    const b=balances.get(t.agreement_id);need(b&&same(b,t),'uninitialized or mismatched agreement binding');
    const key=JSON.stringify([t.agreement_id,t.agreement_version]);need(!versions.has(key),'duplicate agreement version');versions.set(key,t);
    if(!byAgreement.has(t.agreement_id))byAgreement.set(t.agreement_id,[]);byAgreement.get(t.agreement_id).push(t);
  }
  for(const rows of byAgreement.values()){
    rows.sort((a,b)=>a.from_tick-b.from_tick);
    for(let i=1;i<rows.length;i++)need(rows[i-1].until_tick<=rows[i].from_tick,'overlapping agreement versions');
  }
  const changed=new Set(),deltas=[];
  for(const f of allocation.newFacts){
    const t=versions.get(JSON.stringify([f.agreement_id,f.agreement_version]));
    need(t&&t.actor_id===f.actor_id&&t.beneficiary_account_id===f.beneficiary_account_id&&t.from_tick<=f.start_tick&&f.end_tick<=t.until_tick,'work fact agreement mismatch');
    const b=balances.get(t.agreement_id),prior=b.carry;
    const n=BigInt(t.rate_minor_per_hour)*BigInt(f.end_tick-f.start_tick)+BigInt(prior);
    const earned=n/DEN,next=BigInt(b.earned_minor)+earned;
    need(next<=MAX,'wage overflow');
    b.earned_minor=Number(next);b.carry=Number(n%DEN);changed.add(t.agreement_id);
    deltas.push({fact_id:f.fact_id,agreement_id:t.agreement_id,actor_id:f.actor_id,beneficiary_account_id:t.beneficiary_account_id,employer_account_id:t.employer_account_id,currency:t.currency,earned_minor:Number(earned),prior_carry:prior,carry:b.carry,payable_minor:b.earned_minor-b.paid_minor});
  }
  // Detached output; caller must commit allocations + updates + other world effects together.
  return {...allocation,obligationUpdates:[...changed].sort(order).map(k=>balances.get(k)),deltas};
}
