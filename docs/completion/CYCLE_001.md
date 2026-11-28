# Godseed completion cycle 001 — cross-domain baseline and acceptance
Date: 2026-11-27 (owner local date). Status: independent QA and coordination record, NOT gameplay approval, not a fifth domain owner or replacement for peer review.
Authority: PR #81 head 376044e648ad2add20664e68a099ead1f87c70aa, AUTONOMOUS_PROJECT_COMPLETION.md, supplementary to AGENT_COORDINATION.md and OWNER_DECISIONS.md.
Integration baseline: f75bdd14827bd6ea8555f6ca428132e91cff97c3. Main tree 0ee15b20554135c02b838928edefda4289f25083, recursive listing not truncated. Main has reference tools, docs, NPC knowledge schema and fixtures; no playable application or native build. Do not import older medieval/3D branches.
Ownership: this record is isolated under docs/completion; no changes to agents' branches, shared interfaces, runtime, existing tests or saves. All following cross-domain scenarios are proposals for affected peers to review.

## Verified active work
| PR | Domain | Observed head | Gate |
|---|---|---|---|
| 77 | 01 World | 97ccbce13999416c4eb757619947ef55bf31abe5 | Draft, 04 commented; scoped receipt, rewind and continuation reconciliation |
| 79 | 02 NPC | b51c461d05ee2a0b4b3886147f4120f1a8d2e270 | Draft, 01 commented; atomic settlement, reservations, integer units, profile readiness |
| 78 | 03 Abilities | a3caeaeac33691f4df6c2b67ac80129119609062 | Draft, 02 commented; awakening eligibility, physical effects, semantic/schema validation |
| 80 | 04 Narrative | 04ec522a2ee541a843234f3ea1fa0c01216c42b2 | Draft, 03 commented; safe capability projection, training/withdrawal/technique binding |
| 81 | Activation directive | 376044e648ad2add20664e68a099ead1f87c70aa | Open, not merged |
Comments are not approvals. Existing agent reports: 12 NPC reference drafts with unresolved fields, 3 inactive core ability concepts, 20 inactive interaction rows. Do not treat these as activated content.

## Fresh baseline execution
All sources fetched from the pinned main commit using the repository connector. JavaScript V8 isolate: imported functions bound from exact fetched reference modules, ES module import/export wrapper removed, console/process exit status captured locally. For knowledge/perception, JSON schema and fixture bytes supplied directly instead of Node filesystem reads; invoked existing runCases and test functions. Test logic unchanged. No mocks of domain results. Distinct suites:
| tools/<name>.mjs | Pass/total | blob |
|---|---|---|
| check_npc_knowledge | 24/24 | 9c739e32abe53ebb41536dc5494faff379b0e8af |
| check_npc_perception | 40/40 | bc5ec3bcafd3869cd42cb941d9b27ed56d92e810 |
| check_npc_cognition | 48/48 | 4925f6242159e987a7f22c8e43ef38125310a237 |
| check_npc_opportunity | 53/53 | 9c5bd421bfa7e6b7a9b112562f6da9e810695d50 |
| check_npc_planning | 51/51 | 2509ae75131c92ba6a575bec9e64699ebd284926 |
| check_npc_execution | 51/51 | 90ddd8a0168e076ef13cc1aa3d03d7b1b77142f4 |
| check_world_scheduler | 46/46 | 4413ab2ecc5dcbd1ae1996bf0116af2ff6125a27 |
| check_world_persistence | 47/47 | d7ee44f7a72d0d4451a73b32b5123a9513d64eaa |
| check_world_transaction | 36/36 | 2ff38b8247a00d94ac37fa51f60d2cf150dd0573 |
| check_execution_checkpoints | 35/35 | 25fa1ec51e8db909e2290cbb40243486a2ae898e |
| check_integrated_checkpoints | 27/27 | 76fa28295d3212476c4149f0b74a5988200ef5a1 |
Total 458/458, no failed cases in these 11 suites. Not equivalent to full suite. Node v22.16.0 available in separate environment, but git ls-remote failed DNS resolution; no local checkout. Node CLI, Node assert checkpoint suite, durable SQLite tests, Android and gameplay NOT RUN. Prior 97 Node checks are historical only. No CI triggered deliberately; no forced process termination.

## Newly reproduced knowledge boundary gap (QA-K01)
Reference validator tools/check_npc_knowledge.mjs accepts arbitrary free-text memory.summary or belief.interpretation if evidence IDs exist and structural checks pass. It also accepts changing observation confidence from medium to high without receipt changes (receipt r1 contains no confidence, so policy is unresolved rather than a proven production defect). This is a limitation of a proposal validator, not proof of an exploitable deployed game. Source fixture "direct evidence and contradiction", packet A, valid observation o1 has only payment evidence; synthetic canary is not an actual secret.

Reproduce in Node from repository root (commands NOT RUN in Node; equivalent exact validator and fixtures executed in isolate):
```js
import { readFileSync } from 'node:fs';
import { validate } from './tools/check_npc_knowledge.mjs';
const schema = JSON.parse(readFileSync('schemas/npc_knowledge.schema.json','utf8'));
const fixture = JSON.parse(readFileSync('tests/fixtures/npc_knowledge.json','utf8'));
const base = fixture.cases.find(x => x.name === 'direct evidence and contradiction').packet;
const canary = 'NPC B has PRIVATE_FIXTURE_SECRET_927';
const probes = [
 ['control', p => {}],
 ['fabricated memory summary', p => p.memories[0].summary = canary],
 ['fabricated belief interpretation', p => p.beliefs[0].interpretation = canary],
 ['foreign observation receipt', p => p.observations[0].receipt_id = 'nonexistent'],
 ['unsupported observation claim', p => p.observations[0].claims[0].value = canary],
 ['confidence changed without receipt change', p => p.observations[0].confidence = 'high'],
];
for (const [name, mutate] of probes) {
 const p = JSON.parse(JSON.stringify(base)); mutate(p);
 console.log(name, validate(p, schema, fixture.receipts));
}
```
Measured: control accepted []; fabricated memory accepted []; fabricated belief accepted []; foreign receipt rejected [receipt-scope]; unsupported observation claim rejected [projection-mismatch]; confidence mutation accepted []. All six probes executed separately.
Recommendation to 02 and 04: authoritative structured claim/provenance records should be the only input to derived summary and narrative; generate/render from allowed templates or approved deterministic derivations, never trust arbitrary text as fact. Preserve exact attributed claims and important history. Define confidence authority and test it separately. Do not attempt semantic security by string matching a canary. Reconcile epoch and source receipt identity with 01 before changes. Do not retroactively erase memories or modify V1 before ownership review.

## Critical path to first playable slice (proposed)
Prioritize a reviewed causal loop rather than increasing draft ability count in isolation. No fixed plot. Do not select canon dates or unapproved numeric balance here.
1. Reconcile 01/02/03/04 interfaces: one command identity, world epoch/revision, atomic staged effects and scoped public receipt; exact units, rounding, RNG ownership, actor admission; review and record contracts.
2. Validate a minimal source-pinned opening cohort and legal availability, housing, funds and staffing; leave incomplete profiles inactive. Select initial age paths and actual services through reviewed data; no fabricated job, caregiver, food, or commute. 
3. After documented owner/peer gate, implement shared time/route transaction and one real service action (work or school) alongside NPC activity; add prepared choice and receipt-driven terminal rendering. Cover partial interruption and refusal. 
4. Add local needs, commerce, relationships, health/training, news and reviewed small ability subset without blocking life before cosmic event. Build three-slot entire-world rewind, external judgement, and normal recovery before declaring persistent prototype.
5. Run integrated multi-day acceptance and desktop-to-native adapter parity. Native Android proof, normal exit/reopen and owner-only force-stop evidence. Expand original catalog in reviewed batches to 10,000 mechanically distinct core abilities/trees/conditions; no duplicate variants counted. Advanced rift scope remains COMING SOON per owner decisions.

### Cross-domain acceptance proposals (NOT RUN; synthetic fixtures only)
| ID | Test invariant | Dependencies |
|---|---|---|
| CP-01 | Selecting, reading and changing pending choice leave authoritative bytes and clock unchanged; duplicate Continue commits and renders once; stale epoch rejected | 01,04 |
| CP-02 | Concurrent walk and NPC work interrupted at actual boundary; location progress, earned wages/obligation and actual elapsed time agree, no double pay on retry | 01,02,04 |
| CP-03 | CAS failure rolls back time, resource, knowledge, RNG and UI; technical continuation is not a new action | 01,02,03,04 |
| CP-04 | Private canary in another actor's unobserved fact, finances, future event or hidden ability predicate never enters public view, memories, prose, error or log; actual authorized evidence retained | 01,02,03,04 |
| CP-05 | NPC declines eligible work/conversation; independent offscreen goals and real budget changes survive multiple days without forcing player plot | 01,02,04 |
| CP-06 | Age 5/17/18 initial chronology, pre-phenomenon NPC age-18 distinction, one awakening milestone; meteorite may grant alternate core only while unawakened; hidden eligibility not disclosed | 01,03,04 |
| CP-07 | Save while activity pending; later confirmed load restores all active-domain state, narrative and RNG, rejects abandoned epoch choices, external judgement persists. Retry and normal recovery not counted as rewind | 01,02,03,04 |
| CP-08 | Exact cap-aware public relationship delta only when determined, conditional otherwise; actual consequence and NPC response reflected after commit, no dialogue farming | 01,02,04 |
| CP-09 | Two or more plausible multi-day local life paths; real services, choices, offscreen outcomes, no invented source facts; manually review original prose and independence | all |
| CP-10 | Native Android receipt and storage parity, normal close/reopen, accessible text/selection; no forced termination by agents | 01,04 |

No arbitrary completion percentage. Current readiness: reference baseline verified in isolate; reviewed design, integrated runtime, real data, persistent save policy and native acceptance not passed. No gameplay code written because current documentation/peer review gate remains. No merge or self-approval. Next executable work: affected agents reconcile CP-01–04 contracts and QA-K01; owner documentation review as required. In parallel, establish a reproducible local repository checkout and execute pinned native Node baseline without paid CI. Preserve this checkpoint.
