// Checks the prepared storage requirements and five S tasks.
// This checks *documentation/configuration*, not runtime filesystem quota enforcement.
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const b=JSON.parse(readFileSync('config/storage-budget.json','utf8'));
const s=JSON.parse(readFileSync('work-items/storage-tasks.json','utf8'));
const v=JSON.parse(readFileSync('work-items/codex-tasks.json','utf8'));
assert.equal(b.schema,'godseed.storage-budget.v1');
assert.equal(b.status,'planned-not-enforced-in-runtime');
assert.equal(b.core.targetInstalledBytes,1e9);
assert.equal(b.optional.maxAdditionalBytes,5e9);
assert.equal(b.maximumManagedBytes,6e9);
assert.equal(b.core.targetInstalledBytes+b.optional.maxAdditionalBytes,b.maximumManagedBytes);
assert.equal(b.optional.allocateOnStartup,false);
assert.equal(b.optional.enabledByDefault,false);
assert.equal(b.optional.userConsentRequired,true);
assert.equal(b.optional.offlineLocalImportPreferred,true);
assert.equal(b.safety.minimumFreeAfterWriteBytes,5e8);
assert.equal(b.safety.reserveFractionOfCurrentlyAvailableBytes,0.1);
assert.equal(b.safety.rollbackOnFailure,true);
assert.equal(s.tasks.length,5);assert.equal(v.entries.length,25);
assert.deepEqual(s.tasks.map(x=>x.id),['S01','S02','S03','S04','S05']);
assert.ok(s.tasks.every(x=>x.status==='todo'&&x.evidence.length===0));
function wouldAccept({used,optional,free,increment,peakExtra=0}){
 const reserve=Math.max(b.safety.minimumFreeAfterWriteBytes,Math.ceil(free*b.safety.reserveFractionOfCurrentlyAvailableBytes));
 return optional+increment<=b.optional.maxAdditionalBytes &&
 used+increment<=b.maximumManagedBytes &&
 free-increment-peakExtra>=reserve;
}
assert.equal(wouldAccept({used:1e9,optional:0,free:2e9,increment:1e8}),true);
assert.equal(wouldAccept({used:1e9,optional:0,free:3e8,increment:1e8}),false);
assert.equal(wouldAccept({used:5.9e9,optional:4.9e9,free:4e9,increment:2e8}),false);
assert.equal(wouldAccept({used:5.9e9,optional:4.8e9,free:4e9,increment:2e8}),false);
assert.equal(wouldAccept({used:1e9,optional:0,free:8e8,increment:2e8,peakExtra:2e8}),false);
console.log('PASS: 1 GB core target + optional 5 GB cap (6 GB nominal), consent and safety-margin specifications');
console.log('PASS: 25 existing + 5 additional storage tasks all unimplemented; illustrative quota math only');
