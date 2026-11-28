// Independent QA oracle for #87/#97, #77 travel example and #82 time proposal.
// Synthetic units: milliseconds, millimeters, eligible work seconds. No canonical rates.
// Not a runtime, durable save, wage calculator or approved clock contract.
// Run: node docs/qa/check_travel_progress.mjs (Node 22+).
import assert from 'node:assert/strict';
const clone = x => JSON.parse(JSON.stringify(x));
const requireThat = (v, message) => { if (!v) throw Error(message); };
const nonnegative = n => Number.isSafeInteger(n) && n >= 0;
const safe = n => { requireThat(n >= 0n && n <= BigInt(Number.MAX_SAFE_INTEGER), 'overflow'); return Number(n); };
function integrate(rate, elapsed, carry, divisor) {
  requireThat([rate, elapsed, carry, divisor].every(nonnegative) && divisor > 0 && carry < divisor, 'invalid rate');
  const n = BigInt(rate) * BigInt(elapsed) + BigInt(carry);
  return [safe(n / BigInt(divisor)), safe(n % BigInt(divisor))];
}
function fixture(rate = 1000, length = 100000) {
  return {epoch:'E1', revision:0, now:0, actor:{location:'A', transit:null},
    work:{units:0, carry:0}, route:{id:'R', from:'A', to:'B', length, rate}, receipts:[]};
}
function boundary(s) {
  const t = s.actor.transit;
  if (!t || t.paused || s.route.rate === 0) return null;
  const numerator = BigInt(s.route.length - t.progress) * 1000n - BigInt(t.carry);
  return safe((numerator + BigInt(s.route.rate) - 1n) / BigInt(s.route.rate));
}
function authority(initial) {
  let head = clone(initial);
  const snapshot = () => clone(head);
  function commit(command, actual = {closed:false}, fail = false) {
    const c = clone(command), bytes = JSON.stringify(c);
    requireThat(c.epoch === head.epoch, 'stale epoch');
    const prior = head.receipts.find(r => r.id === c.id);
    if (prior) { requireThat(prior.bytes === bytes, 'conflicting retry'); return clone(prior.result); }
    requireThat(c.revision === head.revision && typeof c.id === 'string' && c.id.length > 0 && nonnegative(c.elapsed), 'stale or invalid command');
    const next = clone(head), a = next.actor, r = next.route;
    let arrival = false;
    if (c.kind === 'depart') {
      requireThat(c.elapsed === 0 && !actual.closed && a.location === r.from && a.transit === null && r.rate > 0, 'departure unavailable');
      a.location = null; a.transit = {route:r.id, from:r.from, to:r.to, progress:0, carry:0, paused:false};
    } else if (c.kind === 'resume') {
      requireThat(c.elapsed === 0 && !actual.closed && a.transit?.paused && r.rate > 0, 'resume unavailable');
      a.transit.paused = false;
    } else if (c.kind === 'advance') {
      const t = a.transit, limit = boundary(next);
      requireThat(t && !t.paused && !actual.closed && limit !== null && c.elapsed > 0 && c.elapsed <= limit && typeof c.interrupt === 'boolean', 'invalid interval');
      const [distance, carry] = integrate(r.rate, c.elapsed, t.carry, 1000);
      const [work, workCarry] = integrate(1, c.elapsed, next.work.carry, 1000);
      next.now = safe(BigInt(next.now) + BigInt(c.elapsed));
      next.work = {units:safe(BigInt(next.work.units) + BigInt(work)), carry:workCarry};
      if (distance >= r.length - t.progress) {
        a.location = t.to; a.transit = null; arrival = true;
      } else { t.progress += distance; t.carry = carry; t.paused = c.interrupt; }
    } else throw Error('unknown command');
    requireThat((a.location === null) !== (a.transit === null), 'location invariant');
    next.revision = safe(BigInt(head.revision) + 1n);
    const result = {id:c.id, revision:next.revision, now:next.now, arrival};
    next.receipts.push({id:c.id, bytes, result});
    if (fail) throw Error('injected precommit failure');
    head = next; return clone(result);
  }
  return {snapshot, commit};
}
const command = (a, id, kind, elapsed = 0, interrupt = false) => ({id,kind,elapsed,interrupt,epoch:a.snapshot().epoch,revision:a.snapshot().revision});
const send = (a,id,kind,elapsed=0,interrupt=false) => a.commit(command(a,id,kind,elapsed,interrupt));
let passed=0;
const test=(name, fn)=>{fn();passed++;console.log('PASS',name);};
const started=(rate=1000,length=100000)=>{const a=authority(fixture(rate,length));send(a,'d','depart');return a;};
const unchanged=(a, fn, pattern)=>{const before=a.snapshot();assert.throws(fn,pattern);assert.deepEqual(a.snapshot(),before);};
test('departure is exclusive transit, no elapsed time',()=>{const a=started(),s=a.snapshot();assert.equal(s.actor.location,null);assert.equal(s.actor.transit.progress,0);assert.equal(s.now,0);assert.equal(boundary(s),100000);});
test('interruption at 40 seconds commits 40 meters and 40 work seconds',()=>{const a=started();send(a,'i','advance',40000,true);const s=a.snapshot();assert.equal(s.now,40000);assert.equal(s.actor.transit.progress,40000);assert.equal(s.actor.transit.paused,true);assert.deepEqual(s.work,{units:40,carry:0});});
test('paused travel rejects advance and blocked resume without mutation',()=>{const a=started();send(a,'i','advance',40000,true);unchanged(a,()=>send(a,'bad','advance',1),/interval/);unchanged(a,()=>a.commit(command(a,'r','resume'),{closed:true}),/resume/);});
test('resume arrives once at 100 seconds and work totals 100',()=>{const a=started();send(a,'i','advance',40000,true);send(a,'r','resume');const x=send(a,'end','advance',60000);assert.equal(x.arrival,true);const s=a.snapshot();assert.deepEqual(s.actor,{location:'B',transit:null});assert.equal(s.now,100000);assert.deepEqual(s.work,{units:100,carry:0});assert.equal(s.receipts.filter(r=>r.result.arrival).length,1);});
test('overrun cannot consume fictional time after arrival',()=>{const a=started();unchanged(a,()=>send(a,'bad','advance',100001),/interval/);});
test('arrival at simultaneous interruption retains completed leg',()=>{const a=started();assert.equal(send(a,'end','advance',100000,true).arrival,true);assert.equal(a.snapshot().actor.location,'B');});
test('closure and unsupported departure do not move actor',()=>{const a=authority(fixture());unchanged(a,()=>a.commit(command(a,'d','depart'),{closed:true}),/departure/);const b=authority(fixture(0));unchanged(b,()=>send(b,'d','depart'),/departure/);});
test('fractional movement and work carry independent of partition',()=>{const a=started(1234),b=started(1234);send(a,'whole','advance',7654);for(const [i,n] of [1,17,999,4000,2637].entries())send(b,'p'+i,'advance',n);const x=a.snapshot(),y=b.snapshot();assert.deepEqual(x.actor,y.actor);assert.deepEqual(x.work,y.work);assert.equal(x.now,y.now);assert.equal(boundary(x),boundary(y));});
test('fractional arrival clamps to endpoint at first sufficient tick',()=>{const a=started(1234,100001);const t=boundary(a.snapshot());send(a,'near','advance',t-1);assert.equal(a.snapshot().actor.location,null);assert.equal(boundary(a.snapshot()),1);assert.equal(send(a,'end','advance',1).arrival,true);assert.equal(a.snapshot().now,t);});
test('precommit failure discards movement and concurrent work',()=>{const a=started(),c=command(a,'i','advance',40000,true);unchanged(a,()=>a.commit(c,{closed:false},true),/injected/);a.commit(c);assert.equal(a.snapshot().work.units,40);});
test('exact retry after subsequent commit is idempotent',()=>{const a=started(),c=command(a,'i','advance',40000,true),receipt=a.commit(c);send(a,'r','resume');const before=a.snapshot();assert.deepEqual(a.commit(c),receipt);assert.deepEqual(a.snapshot(),before);unchanged(a,()=>a.commit({...c,elapsed:1}),/conflicting/);});
test('stale revision and epoch rejected',()=>{const a=started(),c=command(a,'i','advance',1);unchanged(a,()=>a.commit({...c,revision:0}),/stale/);unchanged(a,()=>a.commit({...c,epoch:'E0'}),/stale epoch/);});
test('synthetic serialized interruption reconstructs same continuation',()=>{const a=started();send(a,'i','advance',40000,true);const b=authority(clone(a.snapshot()));for(const x of [a,b]){send(x,'r','resume');send(x,'end','advance',60000);}assert.deepEqual(a.snapshot(),b.snapshot());});
test('unsafe intermediate uses exact arithmetic; unsafe output rejects',()=>{assert.deepEqual(integrate(Number.MAX_SAFE_INTEGER,1000,0,1000),[Number.MAX_SAFE_INTEGER,0]);assert.throws(()=>integrate(Number.MAX_SAFE_INTEGER,1001,0,1000),/overflow/);});
test('no independent work advancement during departure/resume',()=>{const a=started();send(a,'i','advance',1234,true);const before=a.snapshot();send(a,'r','resume');assert.deepEqual(a.snapshot().work,before.work);assert.equal(a.snapshot().now,before.now);});
console.log(passed+'/15 PASS (synthetic acceptance oracle)');
