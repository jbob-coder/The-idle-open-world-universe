# Godseed completion cycle 003 — actor knowledge noninterference

Status: independent cross-domain QA, not gameplay approval or peer review. Continuation of CYCLE_001.md and CYCLE_002.md; work reserved on PR #86 comment 7231053687. Main baseline f75bdd14827bd6ea8555f6ca428132e91cff97c3; PR #81 remains open. Domain PR heads inspected unchanged: #77 97ccbce13999416c4eb757619947ef55bf31abe5; #79 b51c461d05ee2a0b4b3886147f4120f1a8d2e270; #78 a3caeaeac33691f4df6c2b67ac80129119609062; #80 04ec522a2ee541a843234f3ea1fa0c01216c42b2. All remain draft, no approval inferred. Reviewed #83, #84, #85, #87, #88, #89, #90, #91 and #92 summaries/comments to avoid duplicate work. QA-K01 and QA-P01 from previous cycles remain open.

## QA-K02: private ingestion watermark leaks into actor-bound view

Source: tools/npc_perception_reference.mjs sets global lastTick on every valid ingest, even zero-recipient events, and emits it as as_of_tick from every actor-bound packet. The integrated coordinator includes that packet in its cognition and narrative projection. This is distinct from #83 attribution and stale contradiction, and #85 relationship preview. It is an observed metadata difference, not disclosure of private claim content or proof of a production exploit.

New standalone executable diagnostic: docs/completion/check_knowledge_noninterference.mjs.
Commit c8965a92812c0195b43800fab43b69810b278648; blob 19714716879d96c41904fa44683c57fb52356d2c. Exact connector readback verified and rerun.

Source blobs at pinned main:
- npc_cognition_reference.mjs fa6fbada18f89efa10f013dccd66f49d226ae697
- npc_execution_reference.mjs 835fcafba4fb566001b743e1c028c5cb689bcecb
- npc_opportunity_reference.mjs 2bb3402fe3f589d53604fd5d99c5c8657ef11ddf
- npc_perception_reference.mjs 4c88ddae030ef307f0a63c186756c13770762595
- npc_planning_reference.mjs 5cf56f164f6482a5929d4dc1bb8fd10a0bcba3b0
- world_persistence_reference.mjs 351280acb8b1ff6bae5deec4133ce3bb658d3894
- world_scheduler_reference.mjs 87827592c148078ccf8bed50f32b8d6ce4f2a909
- world_transaction_reference.mjs d7e8c93fe9c98bb5550ba784a3c4962dde93c0d4

Synthetic paired worlds have a common player observation at tick 10 and identical real reference action execution until tick 20. Compare actor-bound packet after reconstruction through the integrated transaction coordinator:
| World | World tick | Player evidence revision | Player knowledge as_of_tick |
|---|---:|---:|---:|
| Control | 20 | 1 | 10 |
| Additional private observation by A only | 20 | 1 | 20 |
| Additional event with zero witnesses | 20 | 1 | 20 |
All other player packet fields, acquired evidence, player state and public scheduler view equal. A correctly acquires its own observation; B and P do not. Private claim content excluded; public observation control changes P evidence legitimately. Therefore full packet noninterference is FALSE on V1. This discloses timing metadata about the latest ingestion, not event identity or contents.

Executed via V8 isolate on exact fetched functions (remove import/export wrappers; no domain-result mocks). Twelve diagnostic assertions pass, including reproduction of the defect; rerun committed readback also 12/12. With explicit --require-noninterference flag, simulated process.exitCode set to 1, as expected on this baseline. Native Node CLI NOT RUN this cycle. Expected local commands:
- node docs/completion/check_knowledge_noninterference.mjs
- node docs/completion/check_knowledge_noninterference.mjs --require-noninterference (expected nonzero on V1)

## Candidate experiment (NOT applied to peer source)
In an isolated in-memory copy of the exact perception reference, changed only:
  as_of_tick:lastTick,revision:list.length
to:
  as_of_tick:list.at(-1)?.tick??0,revision:list.length
Private global lastTick still used for ingestion chronology and checkpoint metadata. This changes the public watermark semantics to latest actor-acquired evidence (zero for no evidence). Alternative: publish separately the uniformly provided authoritative public clock and actor-specific evidence timestamp. Both options must be reviewed with 01/02/04; do not change canonical API or existing journal semantics blindly.

Candidate paired-world test changed only the assertion expecting the original leak to instead expect actor timestamp 10 in all three worlds. Result 12/12, noninterference TRUE, explicit acceptance flag simulated exitCode 0. Existing suites executed against candidate in same isolate: check_npc_cognition 48/48, check_npc_opportunity 53/53, check_world_transaction 36/36, check_integrated_checkpoints 27/27, check_npc_perception 40/40 = 204/204. For perception tests, exact fetched JSON schema supplied instead of Node filesystem read and existing validator loaded; other imports resolved from exact source bodies. Native Node, SQLite, full suite and Android NOT RUN. Not a production patch.

## Compatibility defect prevented
Existing check_world_checkpoints.mjs explicitly expects an unwitnessing actor's as_of_tick to equal the global high-water tick (11). That expectation conflicts with actor noninterference; test inspected, not executed this cycle. Tested recovery of actual V1 paired-world journal under candidate with same adapter version: throws "checkpoint differs from replay". This is evidence that a one-line in-place change could invalidate existing reference journals. Do not alter V1 or weaken verification. Version the projection/checkpoint semantics, preserve old read/replay adapter, and require reviewed migration and compatibility fixture before deployment. No real save touched. No code changed in peer-owned paths.

## Next action
01/02/04 reconcile private event high-water mark, public clock and actor-local evidence revision/watermark, including receipt/epoch behavior. Require paired-world equality for entire public projection at same public time; authorized new observations still appear exactly once. Test candidate plus other metadata/choice modes and versioned recovery after agreement. Related acceptance CP-04/GS-SLICE-01 A05. Current gate remains open; no gameplay activated, no peer branch edits, no paid CI or merge. Continue with smallest reviewed real gameplay loop when documentation and peer gates permit.
