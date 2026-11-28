# Godseed completion cycle 002 — native persistence evidence

Status: independent QA checkpoint, not gameplay approval. Continuation of CYCLE_001.md and PR #86. Main inspected at f75bdd14827bd6ea8555f6ca428132e91cff97c3; PR #81 still open, four active agent PRs #77–80 unchanged at cycle-001 heads when inspected. No ownership transfer, merge, or activation.

## Execution recovery
Direct git ls-remote failed with DNS resolution error for github.com. Retrieved four exact source files from the pinned main commit via GitHub connector and reconstructed them in an isolated local directory. Verified git hash-object before execution:
- tools/durable_world_store.mjs: 057a415a153438e5860500787ae682baa6bc21f4
- tools/check_durable_world_store.mjs: 49dee6273c15579f80c4039915664e9c37087760
- tools/world_persistence_reference.mjs: 351280acb8b1ff6bae5deec4133ce3bb658d3894
- tools/world_journal_segments.mjs: 3e0f9c75d3a605d17312f65d62c636f070c90a22
One transcription mismatch in persistence source was found and corrected before tests; all four final blob hashes matched.

Environment: Linux x64, Node v22.16.0, SQLite 3.49.1. Native SQLite experimental-feature warning observed, not a test failure. Temporary synthetic database files only. Normal process exits; no forced termination, paid CI, migration of real saves, or remote data deletion.

## Measured results
1. node tools/check_durable_world_store.mjs: 20/20 PASS, exit success. Existing suite includes concurrent separate processes, SQL rollback, normal reopen, identity, corruption, stale CAS.
2. node docs/completion/check_storage_boundary.mjs: 8/8 PASS, exit success. New independent test file committed at 20203e84b5602fc3c0bb5aa63ab2e5fb59c702d0; locally tested and committed blob both b5039dd10105e26ba67b2f2f2219fa41ec79229f; exact readback matched.
   - Segment boundary and exact normal reopen.
   - Stale second handle cannot replace committed record.
   - Historical command rewrite rejected.
   - Duplicate transaction ID rejected.
   - Noncanonical bytes rejected.
   - Append-only SQL update/delete triggers.
   - Corrupt head digest rejected on read/reopen.
   - 256-command ceiling, 257 rejected and prior bytes preserved through reopen.

28/28 native tests in this cycle. Prior 458/458 JavaScript-isolate checks remain separate evidence, not native execution. Full repository checkout, original integrated segmented-journal suite, actual world replay/rewind, Android tests and gameplay NOT RUN. New test uses structurally valid synthetic adapter records with fixture command kind, not executable simulation commands.

## Release blocker: QA-P01
Existing known V1 cap of 256 journal commands is independently reproduced in actual SQLite. At revision 256, eight 32-command segments are sealed; the next append throws invalid world record. Exact state before rejection survives normal reopen. This is a confirmed design limit, not a new regression or a failure of the safety test. It limits commands, not necessarily player turns.

Proposed action for Agent 01: versioned persistence design supporting continuing commits beyond 256; retain exact historical command identity and idempotency, append-only integrity, bounded recovery work and atomic current head. Do not just increase MAX_COMMANDS or prune history. Reconcile active epoch versus external judgement and slot metadata, reviewed checkpoint/retention and restore semantics. Keep V1 read-only compatibility and synthetic migration/copy proof; no live cutover or destructive operations. Acceptance for replacement: >256 commands with deterministic recovered state, exactly-once retry across segment boundary, stale writes rejected, uninterrupted versus recovered results equal, old history intact, normal close/reopen, full-world rewind and external ledger isolation when those contracts are approved. No claim this design is approved or implemented.

Next: communicate QA-P01 to 01, continue cross-domain first-playable acceptance work; do not delay local gameplay design on unrelated storage optimization. QA-K01 from cycle 001 remains unresolved. No gameplay code edited; only independent QA code and checkpoint under docs/completion. Required reviews remain open.
