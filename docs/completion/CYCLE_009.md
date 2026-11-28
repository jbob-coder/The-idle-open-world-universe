# Godseed completion cycle 009 — native planning and checkpoint verification

Inspected main f75bdd14827bd6ea8555f6ca428132e91cff97c3; #77–80 unchanged drafts; #81 open. PR #86 previous head 66da5d739fdd9cc37b0e59c38f5e6fa2cb9c00be. #103 review comments show ongoing peer-owned proposal work (initialization, finance, injury/condition, choice metadata); no implementation approval established. Preserve all peer work and owner gate.

## Native baseline evidence
Retained partial local source directory /mnt/data/godseed-qa-cycle002, Node v22.16.0. Fetched exact pinned main files via GitHub connector, transcribed and verified Git blob hashes before running:
- tools/npc_planning_reference.mjs 5cf56f164f6482a5929d4dc1bb8fd10a0bcba3b0
- tools/check_npc_planning.mjs 2509ae75131c92ba6a575bec9e64699ebd284926
- tools/check_world_checkpoints.mjs f8050a49f6654c9162225cacaf200cea38b4414a
- Existing dependencies rechecked: cognition fa6fbada18f89efa10f013dccd66f49d226ae697, opportunity 2bb3402fe3f589d53604fd5d99c5c8657ef11ddf, perception 4c88ddae030ef307f0a63c186756c13770762595.

Actual commands: node tools/check_npc_planning.mjs (51/51 PASS, normal exit 0); node tools/check_world_checkpoints.mjs (33/33 PASS, normal exit 0). Total 84 existing reference assertions natively verified. Planning suite checks prerequisite order, partial progress, alternative action, independent competing needs, refusal, stale admission and receipt identity. Checkpoint suite checks restoration, history, pending attempt, detached snapshots and corrupted-state rejection. In-memory reference checkpoint, not full-world durable save/load.

## Native QA-K02 candidate compatibility
In separate local candidate directory copied exact perception/planning/cognition/checkpoint test files. Replaced only as_of_tick:lastTick,revision:list.length with as_of_tick:list.at(-1)?.tick??0,revision:list.length. Candidate blob 23a528bb6efae6b111700b5394279e1684764bd8 (same as cycle 008). Ran original, unmodified check_world_checkpoints.mjs: 32/33 PASS, exit 1. One actual failure: "perception round trip retains private actor view and high-water tick", line 27: expected unwitnessing actor B's as_of_tick 11, actual 0. This is an intentional semantic conflict, not evidence of corrupted checkpoint bytes; the baseline test explicitly expects global watermark. Do not weaken baseline tests or deploy candidate silently. Distinct actor-local evidence watermark and trusted public time, versioned projection/replay and compatibility tests required; cycle 003 integrated old-journal incompatibility remains. Candidate not applied.

## Additional reference execution verification
Fetched exact main tools/npc_execution_reference.mjs (835fcafba4fb566001b743e1c028c5cb689bcecb) and tools/check_npc_execution.mjs (90ddd8a0168e076ef13cc1aa3d03d7b1b77142f4) plus exact pinned planning, cognition, opportunity modules. Executed existing test body in V8 isolate with ESM wrappers adapted and imports bound to actual fetched exports. 51/51 PASS, simulated exitCode 0. Native Node execution of this suite NOT_RUN; do not combine with native count. This repeats cycle 001 isolate coverage, not new gameplay evidence.

## Remaining gate
Runner --baseline preflight returns NOT_RUN/exit 2: 17 required paths still missing, down from 20. All 17 suites marked NOT_RUN in that invocation; no complete native baseline, integrated durable replay or Android verification. The local directory remains partial, not a clean checkout. No production code, peer branch, saves or CI modified; no forced process termination. Next: acquire exact executor and test dependencies for native execution, then scheduler and integrated transaction; prioritize approved minimum slice over repeated independent prototypes. Existing documentation-first and affected peer review required before gameplay implementation.
