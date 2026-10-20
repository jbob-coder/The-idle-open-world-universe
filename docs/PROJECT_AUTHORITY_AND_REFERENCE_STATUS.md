# GODSEED — Project authority and reference corrections
**Owner-directed documentation reconciliation: 2026-10-20.** This page governs **how to interpret conflicting references**, not gameplay code or task ownership. Before using it to change code, inspect current branches and live task statuses.

## Precedence (in order)
1. **Latest direct owner intent:** [October 19 owner direction, PR #47](https://github.com/jbob-coder/The-idle-open-world-universe/blob/docs/owner-direction-3d-autonomy-handoff-20261019/docs/owner/GODSEED_OWNER_DIRECTION_AND_SESSION_HANDOFF_2026-10-19.md), [owner clarification, issue #43](https://github.com/jbob-coder/The-idle-open-world-universe/issues/43#issuecomment-6271386906), and later explicit owner requests. Neither a bot proposal nor a former "binding" document overrides them.
2. **Live task governance:** [tasks.json](agents/tasks.json), generated [TASK_BOARD.md](agents/TASK_BOARD.md) and [TASK_WORKFLOW.md](agents/TASK_WORKFLOW.md) on `docs/godseed-agent-task-governance-v1`. Check HEAD/owner/dependencies; do not copy dated counts as live status.
3. **Implemented reality:** actual files at an exact commit SHA, runnable tests, CI and physically measured device evidence when available. An open PR, concept image, task verification or emulator run does not prove a merged or production-ready game.
4. **Older docs/art contracts/PR briefs:** valid for historical reproducibility or scoped compatibility only. Their "no 3D", "top-down only", fixed sprite sizes, camera zooms, Faith abilities, population caps, fixed eight regions and old task totals **are not final owner approvals**.

## GODSEED product versus implementation
- **OWNER-APPROVED PRODUCT GOAL:** offline Android medieval **3D Pixel Squares** *god-observer* simulation. Sims autonomously make causal decisions, gain knowledge, form relationships/families, construct settlements, expand into colonies and kingdoms through actual work and finite resources, and generate inspectable history. Player intervention is optional; divine powers/UI are due for redesign.
- **EXISTING GAME BASELINE:** JavaScript/Canvas 2D + Android WebView, legacy 64×48 authoritative map, Nim/chapter slice and save `version:1` / `godseed-one-small-life-v1`. Preserve this baseline and test migrations; never delete old saves, tests, work or PRs just because the target is 3D.
- **NOT DECIDED OR NOT PROVEN:** 3D engine choice, final camera projection, exact 3D art grid, final god powers, large civilization population, integration of all stacked PRs, physical 2–3 GB Android RAM/FPS/thermal qualification, release signing or final APK.
- **TECHNICAL TARGETS, NOT OWNER-DICTATED FINALS:** 16×16 / 16×24 legacy asset checks, 32×20 legacy zoom, suggested RAM budgets, 1 GB core plus optional 5 GB disk, and old 25/30/45-task backlogs. Do not disable their *existing* automated compatibility checks until a reviewed migration replaces them.

## Reference correction register
| File / category | How to read it now |
|---|---|
| `README.md`, `PROJECT_STATE.md`, `docs/DESIGN.md`, `docs/GODSEED_INTENDED_GAME.md` | Dated game/build descriptions. Any 2D-only design claim is **LEGACY**, not the product goal. |
| `AGENTS.md`, `docs/agents/README.md`, `docs/agents/BOT_MASTER_PROMPT.md` | Active onboarding must use owner-approved 3D target plus actual 2D compatibility constraints, never ban 3D. |
| `docs/PIXEL_WORLD_STYLE_GUIDE.md`, `docs/PIXEL_ART_ACCEPTANCE.md`, `config/pixel-art-contract.json` | **Existing 2D asset/renderer QA contract**, not a prohibition on a reviewed future 3D renderer. Maintain old tests while the legacy renderer exists. |
| `docs/SKYVIEW_VISION.md`, `docs/SKYVIEW_CAMERA_V04.md` | Historical 2D camera experiments. |
| `docs/agents/BOT_LAUNCH_ORDER.md`, old Codex prompts, `work-items/*.json` | Historical suggestion lists; no live task ownership or current progress. |
| `docs/agents/SAFE_INTERIOR_ARCHITECTURE.md` | Physical door/space and save safety requirements survive; rendering transition requires a consistent 3D coordinate adapter. |
| PR #49 consolidation plan | Integration proposal/evidence log, not proof of an already merged 3D game. |

## Evidence classification
`OWNER_APPROVED` = evidenced product direction. `LEGACY` = retained old runtime constraints. `PROPOSED` = design only. `IMPLEMENTED_ISOLATED` = exists on a feature branch. `CI_PASS_EXACT_SHA` = exact checked workflow, not another branch or physical phone. `IN_REVIEW` = not independently accepted. `VERIFIED_TASK` = reviewed *within its task scope*; not necessarily integrated. `DONE` = accepted integration/merged SHA and final CI. `PHYSICAL_UNVERIFIED` = no device measurement.

## Existing engineering conflicts — dated 2026-10-20, refresh before acting
- [PR #35](https://github.com/jbob-coder/The-idle-open-world-universe/pull/35): blueprint reservation references can alias mutable caller data.
- [PR #36](https://github.com/jbob-coder/The-idle-open-world-universe/pull/36): exterior and interior door anchors can disagree.
- [PR #45](https://github.com/jbob-coder/The-idle-open-world-universe/pull/45): imported chronicle goal progress can lack goal-relevant events.
- [PR #48](https://github.com/jbob-coder/The-idle-open-world-universe/pull/48): explorer's moving destination can prevent arrival.
- [Issue #54](https://github.com/jbob-coder/The-idle-open-world-universe/issues/54): 34/100 generated sites cross WLD-007 legacy protection **if WLD-008 is directly integrated**. Both isolated modules have their own tests; combined integration needs a safe frontier adapter.
- [PR #42](https://github.com/jbob-coder/The-idle-open-world-universe/pull/42): QA-006 documentation verified, **not** all 14 simulation scenarios implemented.
- [PR #51](https://github.com/jbob-coder/The-idle-open-world-universe/pull/51) / [PR #53](https://github.com/jbob-coder/The-idle-open-world-universe/pull/53): independent review pending; no merge claim.
- [PR #44](https://github.com/jbob-coder/The-idle-open-world-universe/pull/44): latest inspected API29 emulator step cancelled; not physical or final native certification.

## Before any agent edits
Read this page, the owner's dated decision, live governance/task registry, source branch/HEAD, relevant handoffs and actual test results. Obey task claims and the two-own-PR review limit. Never overwrite another bot's branch; no arbitrary deletion, force-push, save wipe or unreviewed merge. Prefer a reversible change with new regression tests and a precise evidence record. If technical documents conflict, preserve the old requirement as **historical** and obtain a new acceptance contract rather than pretending it was never written.

**Cleanup scope:** This page is documentation only. It neither implements 3D, assigns an engine, changes game logic, adds a new task, accepts another bot's code, nor removes historical evidence.
