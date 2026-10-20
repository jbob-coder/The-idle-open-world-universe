# GODSEED — Consolidation, 3D Feasibility, and Selective Integration Plan

**Document status:** Proposed execution plan; first inspection and inventory published for review, not an authorization to merge or delete.  
**Prepared:** 2026-10-19 (America/Puerto_Rico).  
**Authoritative task state:** [docs/agents/tasks.json](tasks.json) on `docs/godseed-agent-task-governance-v1`.  
**Evidence snapshot:** [GODSEED_PR_INVENTORY_2026-10-19.json](GODSEED_PR_INVENTORY_2026-10-19.json) records all 43 PR refs and provisional triage; refresh before each actual integration.  
**Product direction:** [Owner instruction in PR #47](https://github.com/jbob-coder/The-idle-open-world-universe/pull/47), [issue #43 owner correction](https://github.com/jbob-coder/The-idle-open-world-universe/issues/43#issuecomment-6271386906); later 3D square-pixel direction overrides any older requirement that the final view must be 2D only. The specific 3D engine is *not* selected or owner-approved.

## 1. Decision and objective

Use **inspect -> preserve -> prove 3D feasibility -> selectively integrate -> test -> retire only after preservation**, rather than merging 43 open PRs wholesale or starting a destructive rewrite. The canonical product is a low-memory, offline Android, autonomous society simulator observed from a 3D god view. Inhabitants initiate survival, labor, construction, relationships and eventually political structures without obligatory player action. God influence remains optional and observable; exact powers are to be redesigned, not declared final here.

This plan is an execution proposal and review artifact, not proof of a finished 3D game. Existing working JavaScript state simulation can be retained behind a renderer-neutral adapter until evidence justifies a port.

## 2. Repository facts, frozen inspection snapshot

- Repository: [jbob-coder/The-idle-open-world-universe](https://github.com/jbob-coder/The-idle-open-world-universe). Default `main` HEAD `163fe24d2679c57ae73b23f001d8c64c7729983f` (original prototype import, October 17); **zero PRs merged** at inspection.
- **43 open PRs, 13 drafts.** The [existing integration baseline PR #21](https://github.com/jbob-coder/The-idle-open-world-universe/pull/21) has HEAD `a5919223ec9092bb8f2ec4c4a35cc2576021c817`; it contains the existing 2D/Canvas settlement vertical slice, *not* 3D.
- Authoritative task registry as of inspection: **70 total: 19 verified, 7 ready, 6 in_review, 1 in_progress, 3 blocked, 34 planned, 0 done**. Task verification and green feature CI do **not** imply merge or integrated acceptance.
- Coordination branch baseline for this proposed documentation: `docs/godseed-agent-task-governance-v1`, SHA `91bc959cea7495cc7aa462ccdee4d2517c531d3d`. Do not edit its live task registry or generated board in this planning PR.
- At inspection `WLD-004` belongs to PATH-34 and is `in_progress`; `SIM-007`, `WLD-007`, `INT-003`, `ART-007`, `CIV-001`, `QA-006` are in review. Do not claim or overwrite their branches. Tasks `INT-002` and `GOD-003` are now unclaimed/ready per live registry, but require a *new* legal claim and handoff checks before work.
- Review status and branch ancestry are recorded in the accompanying inventory. The branches are stacked, so a PR's green CI only proves that exact branch's tested state.

## 3. Preservation triage — preliminary, not deletion authority

| Class | Relevant PRs | Proposed handling |
| --- | --- | --- |
| Historical foundation / regressions | #1, #2, #6, #7, #8, #9, #10, #11, #12, #14, #15, #16 | Retain functioning mechanics, story, Android save and test evidence. Some older patches are already ancestors of #21; detect duplicates rather than cherry-picking repeatedly. |
| Canonical 2D simulation baseline | #17 and #21 | Inspect and freeze reproducible input/output behavior. Use #21 as the comparison baseline, not `main`. |
| Alternative society engine | #20 | **Do not co-merge with #17/#21**. Compare ideas, extract unique behavior only if justified, keep branch intact until integration decision. |
| Simulation and governance additions | #22, #24, #25, #26, #28, #29, #30, #33, #34, #41, #45 | Preserve APIs, tests, cognition, inspectability and consent where independent acceptance confirms. #41 and #45 are sibling branches that touch shared files: integrate with a deliberate conflict-resolution slice. |
| World and persistence | #23, #31, #38, #44, #48 | Reuse deterministic terrain and compact persistence; **fix #48 moving expedition goal** and **finish #44 API29 migration tests** before calling them complete. |
| Buildings, interiors, economy | #35, #36 | Preserve metrics/collision/save contracts for future 3D buildings; actual traversable interior and full economic construction remain future acceptance work. |
| Legacy presentation / 3D adaptation | #3, #4, #5, #32, #37, #39, #40, #46 | Preserve useful assets, camera conventions and UX evidence. 2D-only renderer/interface specifications must not dictate the new 3D viewport. Reuse selectively, not wholesale. |
| Product acceptance and QA | #42, #47 | Treat #47's owner direction as latest instruction; revise older 2D acceptance tests while preserving autonomy, causal outcomes, deterministic saves and low-end Android gates. |

No historical artifact, APK, screenshot, code branch, task claim, or PR is presently approved for deletion. A proposed retirement requires a surviving replacement, links, dependency audit, explicit owner/integrator decision and a tested rollback.

## 4. The integration dependency graph

**Historical base:** `main -> #1 -> #2 -> #3 -> #4 -> #5 -> #6 -> #7 -> #8 -> #9 -> #11 -> #12 -> #14 -> #15 -> #16 -> #17 -> #21`. This is the main ancestry *for those stages*, not a statement that PRs have been merged to `main`. #10 branches off #6 and must be reconciled against subsequent Android exit-save behavior. #20 branches off #16 and diverges from #17.

**Compatible candidate lanes (not yet a merge instruction):**

- Simulation: `#21 -> #26 (SIM-001) -> #33 (SIM-002) -> {#41 (SIM-011), #45 (SIM-007)}`; `#26 -> #34 (GOD-002)`. Test #41/#45 overlap before producing a combined branch.
- World: `#21 -> #23 (WLD-001) -> #31 (WLD-002) -> #40 (WLD-003) -> #48 (WLD-004)`; `#23 -> #38 (WLD-006)`; `#31 -> #44 (WLD-007)`. #40 is a 2D camera, so its *simulation coupling* may need decoupling before 3D adoption.
- God view: `#21 -> #28 (GOD-004) -> #46 (ART-007)`; #28's inspection data contract can survive, while #46's 2D layout requires reevaluation.
- Metric buildings: `#21 -> #35 (CIV-001)` and `#21 -> #36 (INT-003)`; ensure no save migration collisions.
- QA / planning: `#21 -> #24 -> #30`; `#21 -> #22 -> {#37, #39, #47}`; `#39 -> #42`.

**Integration invariants:** Preserve `godseed-one-small-life-v1`, outer save version 1 unless migration is specifically tested, actor identity, no duplicated resources/rewards, and offline determinism. Retain a running 2D reference build as rollback until 3D passes equivalence.

## 5. Execution sequence with measurable gates

### PR A — Reviewable consolidation inventory (this PR)

1. Capture all open PR head/base SHAs, current status and provisional triage in a machine-readable inventory. Compare against the owner decision (#47) and the governance registry. **Already performed for this snapshot.**
2. Publish this plan and the inventory on a new isolated documentation branch targeting the *coordination branch*, not `main`.
3. Obtain reviewer sign-off on integration scope, explicit treatment of #20, and evidence requirements; do not change `tasks.json` or claim someone else's task in this PR.
4. Before implementation, check exact task ID ownership and use the existing CLI `python tools/godseed_tasks.py validate`, claim -> in_progress -> in_review transitions. Propose a distinct **3D-feasibility task** via the authorized governance process if none exists; do **not** invent an unrecorded task ID or bypass the `add --after` rules.

**Exit gate A:** All 43 PRs accounted for; branch/source SHA recorded; owner direction respected; no changes to simulation, saves, PR state, or shared task board.

### PR B — Minimal 3D pixel-style Android technical spike (isolated, after legal task claim)

1. Compare a WebGL-based adapter in the existing offline Android host against a native Godot-based minimal shell, focusing on low-memory Android viability, offline asset packaging, save interoperability and ease of retaining deterministic JS sim state. **No engine selected in this document.**
2. Implement *one* small 3D scene: terrain, one pixel/voxel-styled autonomous citizen, elevated movable god-view camera, one observed gather/shelter behavior, inspection overlay. No player movement/puppeteering. Use an adapter with immutable render snapshots, never move simulation decisions into rendering callbacks.
3. Gather reproducible Android API29 emulator logs/screenshots and (when real hardware is available) physical 2/3 GB device RSS/PSS, startup, frame times, battery/thermal and 20-minute soak. Check WebView/WebGL fallback if evaluated. Compare old save import/export and offline behavior.
4. Make an explicit decision record: engine, renderer, integration contract, low-memory evidence, tradeoffs, fallback, reasons; reject the candidate when gates fail. No silent full-engine migration.

**Exit gate B:** A real, *running* 3D view with one NPC completing a causal autonomous action, no internet dependency, persistence demonstrated, and an evidence-backed renderer decision. Emulator-only success must be labeled emulator-only; physical-device gate remains separate until measured.

### PR C — Selective simulation integration (after B is reproducible)

1. Integrate from **#21 plus verified, independently reviewed candidates**, not by merging all 43 PRs. Establish stable adapter interfaces for seeded world coordinates/chunks, a bounded person snapshot, intent/outcome events and save schema.
2. Start with survival + deterministic cognitive choices (`SIM-001/002/011`), real action journals (`SIM-007`), compact persistent chunks (`WLD-001/002/007`), safe travel (`WLD-004` *after bug fix*), observation and optional divine consent (`GOD-002/004`). Only add each after its exact-HEAD QA passes.
3. Repair #48 by storing a stable expedition waypoint per actor/expedition and persisting it; add a regression that an unemployed NPC **arrives**, increments its expedition exactly once and remains correct across save/reload. Fix should be implemented by the authorized task owner/successor, not by overwriting PATH-34.
4. Complete or block #44 native API29 save-migration evaluation explicitly. Resolve #41/#45 overlaps with combined tests for cognition, journal, v1 saves and HTML safety.
5. Prove one autonomous material cycle: discover need -> choose task -> gather materials -> subtract stock -> construct shelter -> inspect persistent building -> reload -> continue. Do not fake colony construction with a time-triggered decorative prop.

**Exit gate C:** Repeatable Node seeded/no-intervention tests, offline Chromium and Android smoke on **the same integration SHA**; legacy v1 save fixtures; zero duplicated resources/people; no rendering-induced hidden simulation ticks; a compact playable milestone. Larger families, dynasties and kingdoms remain subsequent tasks.

## 6. Verification matrix and hard blockers

| Gate | How to prove it | Do not claim PASS when |
| --- | --- | --- |
| Deterministic autonomy | 10+ seeds, multiple long-run ticks, matched save/reload outcome hashes | Actions depend on clicks or graphics frame cadence |
| Stable chunk travel | Fixed destination, arrival counter, path budget, save/reload and stale-route tests | Only steps/pathfinding tests pass without final arrival |
| Causal economy | Before/after quantities for harvesting, inventory, construction and tools | Stock materializes without production or cost |
| 3D god view | Actual runtime screenshots and free spectator camera; renders autonomous events | Only concept art or mocked DOM elements exist |
| Save compatibility | Restore prior `godseed-one-small-life-v1` fixtures, preserve identity and rewards | An old save resets the world or duplicates state |
| Offline Android | No runtime remote requests; Android install/launch, recreation and persistence | Browser-only tests or packaging-only checks exist |
| Performance | Measured physical-device 2/3 GB PSS/RSS, frame time, soak and thermals | Emulator-only performance or memory estimates |

Evidence must include exact commit SHA, command, result, and artifact link. If a test has not been run, write **NOT_RUN**. The current plan *does not itself run these tests*.

## 7. Governance, safety, handoff and rollback

- Read [TASK_WORKFLOW.md](TASK_WORKFLOW.md), [tasks.json](tasks.json), [TASK_BOARD.md](TASK_BOARD.md), and [CHAT_RETIRE_AND_RESUME.md](CHAT_RETIRE_AND_RESUME.md) before claiming implementation. Follow the single-owner and independent-review rules. This proposal claims **no** registered gameplay task.
- The October 19 bot-retirement instruction in `introduccion-al-proyecto/docs/agents/BOT_RETIRO_DEFINITIVO_PROMPT.md` governs retirement. A saved handoff file is not proof a remote bot stopped. Do not steal `WLD-004`, `GOD-006`, etc., or reassign review/verified items.
- No direct `main` writes, merges, PR closures, force pushes, branch deletion, save schema breaking changes or mass automated rewrites in this effort without their separate governance/review gates.
- Rollback: each spike/integration step uses a new branch with documented base/head SHAs, reproducible tests and deterministic fixtures; preserve old runnable artifacts, branches and signing identities. An experiment may be rejected without invalidating #21.
- If new scope conflicts with a task already tracked, amend the proposed plan rather than creating a duplicate or bypassing source-task provenance checks.
- Retirement candidate criteria: unique code ported and tested, downstream references checked, no required save/QA contract lost, owner-approved deprecation note, recoverable SHA/ref and proven fallback. Until then: **KEEP**.

## 8. Present checkpoint / successor entry

**CURRENT_OBJECTIVE:** Consolidate safely, prove 3D Android feasibility, then integrate autonomous living world.  
**VERIFIED_STATE:** 43 open PRs including 13 drafts; `main` prototype; #21 baseline; 70 tasks (19 verified / 7 ready / 6 review / 1 active / 3 blocked / 34 planned); later owner 3D direction recorded in #47.  
**COMPLETED IN THIS DOCUMENTATION SLICE:** Live metadata inventory and dependencies reviewed, triage/implementation gates designed.  
**NOT COMPLETED:** No task claimed; no gameplay code modified; no PR merged; no 3D engine chosen; no tests executed on this documentation branch yet.  
**NEXT_ACTION:** Independent review of PR A, governance-compliant 3D task intake, then start isolated PR B spike.  
**RISKS:** Old 2D contracts vs latest owner direction, #20 divergent society engine, #41/#45 overlapping edits, #48 roaming target bug, #44 missing exact-head native acceptance, low-RAM hardware unavailable.  
**DECISIONS:** Preserve first; never conflate green feature CI with integrated product; choose renderer from measured evidence; no premature deletion.
