# M1-A financial authority — cross-packet review proposal

Status: inactive QA review, not a production API, acceptance, approval or game state. Decision register #103 D2/D3/D4. Main f75bdd14827bd6ea8555f6ca428132e91cff97c3. Preserve all existing peer packets and full-roster blockers.

## Exact reviewed inputs

| Source | Commit | Blob |
|---|---|---|
| #101 initialization | 7235112a2675844f62d840a1ab09a8ec1129bb52 | 93ed13367d5ddf219ce3bb65e004315a13ee3e44 |
| #96 M1-A finance | 2e163c2cb569fb1b08e4fdcd8ee3e4aaf4547c52 | 6e80b3ef0bb1f711ff50b4ecdae181ade0eecc95 |
| #99 M1-A narrative | ad99898b8fbac36188f30ff8f926bac02d7d19f8 | 0267437201cac7ef4a68d273de7bc85d803da1c7 |
| Main WORLD.md | f75bdd14827bd6ea8555f6ca428132e91cff97c3 | 31df1d9d01f2dba2acf9fa3d344f368c22bf6070 |

22/22 cross-packet source consistency checks passed in V8: three inactive markers; two dependency blob pins; worker account and agreement links; employer account existence; no player employment; separate worker/account IDs; common rate and denominator; source route; walk/rest duration and wage/carry parity; explicit inquiry actor/reference distinction; rest/work permission proposals; no initial work; no automatic payment; prephenomenon chronology; unchanged full-roster blockers. This is not acceptance of proposed legal care, permission or biological records.

## Resolve actor/account/organization authority before implementation

- Actor FIX-W is the independent worker and scheduler subject. FIX-WORKER is a proposed financial account, not an actor or scheduler identity.
- FIX-EMPLOYER is a proposed employer account, not a verified organization or person. Its controlling entity and authorized representative are unresolved. 02 must bind both account ownership and employer authority in the reviewed initialization. Do not infer ownership from caretaker role.
- FIX-AGREEMENT version 1 must bind worker actor, beneficiary account, employer entity and funding account, allowed compensation policy, rate/denominator, effective interval, accepted terms and authority. The existing finance packet names accounts; initialization supplies the actor link. Keep the fields distinct. No changes to those source packets here.
- The coordinator supplies private actual eligible work evidence with world/epoch, actor/activity/session, causal fact identity, elapsed [start,end), agreement ID/version, location, authorized activity, relevant condition and admission evidence. Bind the fact to one verified compensable allocation. Caller cannot supply a trusted eligible flag, rate, earned amount or recipient.
- Record actual actor-time occupancy across all agreements and activities; no overlapping exclusive labor intervals for one actor merely because the economic account or agreement differs. An approved compatible activity policy would need an explicit exception with causal accounting. Same interval for two distinct actors remains possible. Preserve activity identity and causal interval, not just arbitrary command IDs.
- Derive wages from the validated agreement rate and eligible elapsed interval, preserving fractional carry owned by the same agreement/currency/beneficiary. Carry and payable are not cash. Never pay the cumulative earned amount again at each boundary. Reserve causal identity, check all pre-stage revisions, atomically commit actual worker activity, obligation and private event/receipt; publish only authorized actor views after CAS. No unrelated worker financial facts in player narration.
- Technical retry returns original receipt without new earnings. Old epoch cannot execute or publish abandoned future receipts. Rejected stage changes neither time nor carry nor obligations. Normal reopen restores current state; does not repost opening endowment.

## Native evidence: per-agreement helper is insufficient as global authority

Environment: Node v22.16.0. Actual local Git blob a585e230f04e8fed4cae92a02d7978e2d2cd18fd equals current committed docs/qa/check_wage_rate_boundary.mjs. Ran existing standalone test on import, 20/20 PASS. Then ran the following native probe against its exact exported make/stage functions:

```js
import assert from 'node:assert/strict';
import {make,stage} from './docs/qa/check_wage_rate_boundary.mjs';
const a=make(), b={...make(),agreement:'B',employer:'E2'};
const proof=s=>({id:'same-physical-work',agreement:s.agreement,
  employer:s.employer,worker:s.worker,currency:s.currency,
  start:0,end:9000,version:1,eligible:true});
const terms=s=>({agreement:s.agreement,employer:s.employer,
  worker:s.worker,currency:s.currency,version:1,from:0,until:60000,rate:1800});
const x=stage(a,proof(a),terms(a)), y=stage(b,proof(b),terms(b));
assert.equal(x.earned,4); assert.equal(y.earned,4);
assert.equal(x.carry+y.carry,3600000);
assert.equal(x.lastEnd,y.lastEnd);
```

Normal exit 0. Both isolated agreements accept the same synthetic proof ID and 9-second interval for the same worker. Combined exact entitlement is 9 minor units rather than 4.5 for one eligible interval. This reproduces the documented scope limitation of the QA helper, NOT a production defect or evidence of a live double payment. The helper correctly rejects overlap within one agreement but lacks worker-wide authorization. Do not promote it directly to the production transaction handler. Distinct proof IDs would not by themselves solve overlapping physical work.

## Required integration checks (NOT RUN)

1. Same physical exclusive worker interval presented under two agreements: reject second allocation or reject entire conflicting stage according to reviewed admission policy, without minting duplicate obligation.
2. Same interval for different actors with valid agreements: accept independent work; do not impose a global work lock.
3. Change worker bank account without authorized agreement update: reject, no carry transfer or payment.
4. Legal nonoverlapping work across two agreements: preserve separately attributed obligations and carry, not one shared ledger.
5. Interrupt worker at actual invalidating condition/time, settle only eligible preceding interval, release reservation, commit with world movement and other effects. No forced work on player movement.
6. Retry/failed CAS/reopen preserve worker-time evidence, obligation, carry and scoped receipt together. Verify on actual coordinator and SQLite, not independently staged local account helpers.

No new production code, runtime schema, live account, legal rule, or balance decision. No Android, full-world replay or actual coordinator tests this cycle. 01/02 must accept or counterpropose the binding and worker-wide authority; 04 reviews scoped disclosure. Owner documentation gate D8 remains. This review does not claim peer acceptance or close D2/D3/D4. Next: adopt reviewed bindings in domain-owned specifications and implement actual M1-A transaction after applicable gates.
