# Godseed completion cycle 007 — native reference verification runner

Independent development tooling, not gameplay or a production release. Main verified f75bdd14827bd6ea8555f6ca428132e91cff97c3. Four domain drafts #77–80 unchanged, #81 open. New readiness register #103 confirms documentation and current-head peer review remain pending; #102/#104 cover thermal and injury QA. No duplicate gameplay oracles authored this cycle.

## Implementation
Added docs/completion/run_reference_checks.mjs at e200fc5aa61ed16adea39b6766486d046e79ca84, blob 809f677e38f6d35901b5791a16e6aff2d788a75d. Local native-tested Git blob equals committed readback blob; full source matched. Three explicit modes:
- --self-test: eight subprocess output/exit classification cases.
- --storage: existing native storage suite and cycle-002 boundary suite.
- --baseline: explicit 17 existing main reference test entry points (all tools/check_*.mjs in inspected tree), 10 referenced modules, knowledge schema and fixture. Preflight all inputs; refuse partial baseline run.
Runner resolves root from module path, requires Node >=22.16 for suite runs, records Git blob hashes for required source inputs, executes sequential native Node subprocesses, streams stdout/stderr and requires exactly one recognized positive all-pass summary and normal exit code zero. Rejects zero/unsafe counts, missing/duplicate summary or nonzero exit. Rechecks source hashes at end, returns code 1 on suite failure/source change, 2 on missing prerequisites/invalid invocation. No process termination, watchdog, forced timeout, CI or real-save access introduced.

## Actual execution
Local directory retained from cycle 002, not a git checkout. git ls-remote again failed DNS: Could not resolve host: github.com. Node v22.16.0, SQLite experimental warning, no test failure.
- node docs/completion/run_reference_checks.mjs --self-test: 8/8 native runner checks PASS.
- node docs/completion/run_reference_checks.mjs --storage: 2/2 suites PASS, 28/28 cases (20 original durable storage + 8 segmented adapter boundary); exit 0. Exact source hashes matched cycle 002 / pinned main and QA commit. No changes reported by post-run hash checks.
- --baseline: exit 2; 25 required files missing from local partial source set, all 17 suites NOT_RUN in this invocation. No full baseline pass claimed.
- --invalid: exit 2 with explicit mode error.
The 28 storage cases repeat earlier coverage; not 28 new gameplay tests. 8 runner tests are new tooling verification, not gameplay. No Node full integrated replay, production gameplay, Android or native UI verified. No real saves modified.

## Limits
Explicit list is scoped to current reference tree, update after reviewed additions. Hash records identify local bytes, not proof of a clean checkout or trusted code; compare with pinned Git blobs and inspect before running. Before/after hashes do not prevent transient concurrent modification. Summary classification does not independently prove each test assertion was meaningful or expected count unchanged. Existing reference test scripts own their synthetic fixture lifecycle. Runner has no hang timeout by charter; report hang and use owner-authorized recovery only. Node minimum version check is a prerequisite, not support proof for every future Node version. No automatic CI or merge. No peer-owned files changed.

## Next executable task
Use runner on a complete verified checkout when accessible; do not substitute partial sources for full baseline. Main implementation remains blocked by #103 D1–D8 and cycle 006 D01–D09. Prioritize reviewed initialization and exact shared interfaces; avoid more disconnected oracles or repetitive comments. Owner documentation review and affected peer agreement still necessary. Once approved, implement the minimum real local gameplay loop and validate actual state changes with the same runner discipline. No claim of owner approval or release.
