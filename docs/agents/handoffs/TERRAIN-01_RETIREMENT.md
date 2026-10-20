# TERRAIN-01 — Certificado técnico de retiro (orden expresa del propietario)

**Fecha UTC:** 2026-10-19T16:57:33+00:00  
**BOT_ID:** TERRAIN-01 · **Motivo:** owner_request · **Repositorio:** jbob-coder/The-idle-open-world-universe  
**Coordinación examinada:** `docs/godseed-agent-task-governance-v1`, HEAD `9e988714ba66a2f2927dee337aefdf76c22b2638` antes del commit de este inventario.

Esta entrega conserva las cuatro tareas pertenecientes a TERRAIN-01, sus ramas y evidencia. No solicita nueva tarea, no instala ejecutor persistente ni intenta fusionar o borrar ningún PR.

## Estado exacto de las tareas

| Tarea | Estado real en GitHub | Propietario | Revisor independiente | PR / rama | HEAD comprobado |
|---|---|---|---|---|---|
| WLD-001 | verified | TERRAIN-01 | GDS-KESTREL-1810 | [#23](https://github.com/jbob-coder/The-idle-open-world-universe/pull/23) · `feat/wld-001-seeded-chunks-terrain-01` | `955338f2d10a16a89ad97bd5dc6917f8660809ed` |
| QA-003 | verified | TERRAIN-01 | FORGE-27 | [#30](https://github.com/jbob-coder/The-idle-open-world-universe/pull/30) · `test/qa-003-terrain-01-native-acceptance` | `ff8374a8118a625de72c4816e021adeef294acf5` |
| CIV-001 | in_review | TERRAIN-01 | **PENDING** | [#35](https://github.com/jbob-coder/The-idle-open-world-universe/pull/35) · `feat/civ-001-terrain-01-metric-blueprints` | `adbe40831b1595465c68cd00342309f43f01b173` |
| WLD-006 | verified | TERRAIN-01 | FORGE-27 | [#38](https://github.com/jbob-coder/The-idle-open-world-universe/pull/38) · `feat/wld-006-terrain-01-biome-ecology` | `8664aa20a4bc188541dfc918a2843f85017c2668` |

All four task statuses and owners were verified against live tasks.json; all four PRs were checked OPEN, NOT MERGED at handoff. **No claimed or in_progress tasks remain under TERRAIN-01.** Consequently no task can be legally released to ready by this retiring bot; CIV-001 remains in_review until independent verification. Verified tasks are NOT done unless owner-authorized integration eventually merges them.

## Code, tests and SHA details

### WLD-001 — deterministic chunks
- Source: `src/world/chunks.js`, `tests/chunks.test.js`, PR #23 HEAD `955338f2d10a16a89ad97bd5dc6917f8660809ed`, branch `feat/wld-001-seeded-chunks-terrain-01`. Standalone 32×32 chunk generator, signed world coords, deterministic seeded boundaries; legacy 64×48 runtime **not yet converted**.
- **PASS**: `node --test tests/*.test.js`, 88/88 including 6 chunk tests, [offline QA run 39183510756](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39183510756).
- **NOT_RUN/PASS unavailable**: [native run 39183510322](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39183510322) finished **CANCELLED**; do not report as native PASS. Physical Android 2–3GB NOT_RUN.
- Independent reviewer GDS-KESTREL-1810 accepted task-level evidence; PR still OPEN/draft.

### QA-003 — Android lifecycle and artifact provenance
- Modified `.github/workflows/native-android.yml`, `android/gradle/app/src/androidTest/java/io/godseed/one/NativeAndroidSmokeTest.java`, `tests/native/android_emulator_evidence.py`, `tests/native/run-emulator-acceptance.sh`, `tests/native/test_android_emulator_evidence.py`. PR #30 HEAD `ff8374a8118a625de72c4816e021adeef294acf5`, branch `test/qa-003-terrain-01-native-acceptance`, stacked on QA-001 PR #24.
- **PASS** [offline run 39186569230](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39186569230); **PASS** [native API29 emulator run 39186569278](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39186569278) 7/7 instrumentation, Gradle/WebView host. Python evidence tests 3/3 as recorded in PR. APK artifact 12157844452; screenshot/logcat/memory/provenance artifact 12158810382.
- **NOT_RUN**: physical 2–3 GB RAM phone 20-minute stability, PSS/RSS and production signing. Independent reviewer FORGE-27 verified task; still OPEN/unmerged.

### CIV-001 — metric 2D-era building blueprints
- Source `src/civilization/blueprints.js`, `tests/civilization_blueprints.test.js`, `docs/CIV-001_BLUEPRINT_LIBRARY.md`; PR #35 HEAD `adbe40831b1595465c68cd00342309f43f01b173`, branch `feat/civ-001-terrain-01-metric-blueprints`, base legacy PR #21 integration branch.
- **PASS** `node --test tests/*.test.js` 89/89 with 7 new blueprint tests; [offline run 39188386197](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39188386197). **PASS** Gradle/APK and 6/6 API29 instrumented [native run 39188386188](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39188386188), APK artifact 12159181583, emulator artifact 12158649413.
- **NOT_RUN**: real-game NPC construction/occupancy, functioning doors, 3D pixel-square viewport, physical Android. Feature exists as **opt-in independent planning code**, not live player experience.
- **Still in_review:** independent reviewer needed. Detailed machine-valid handoff is `docs/agents/handoffs/CIV-001.json`.

### WLD-006 — biome/ecology overlay
- Source `src/world/ecology.js`, `tests/ecology.test.js`, `docs/WLD_006_ECOLOGY.md`; PR #38 HEAD `8664aa20a4bc188541dfc918a2843f85017c2668`, stacked on WLD-001 PR #23 at `955338f2d10a16a89ad97bd5dc6917f8660809ed`.
- **PASS** `node --test tests/*.test.js` 95/95 including 7 ecology tests, [offline run 39189684385](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39189684385). **NOT_RUN/PASS unavailable**: [native run 39189684473](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39189684473) finished **CANCELLED**, do not claim native pass.
- Seeded grass/woodland/wetland/highland/climate, reproducible ruin/chapel-site candidates, 96-tick renewable berries and route/delta priority exist as standalone overlay; not wired to live game or persisted harvest. Independent FORGE-27 verified task; PR OPEN/draft/unmerged.

## Current product direction — 3D vs legacy 2D

The owner's latest documented direction is a **3D point of view with Pixel Squares visual style**, ant-farm-like autonomous NPC-created towns, kings and multiple colonies, observer-god influence optional. This supersedes the old requirement of exclusively 2D top-down presentation. Source: `docs/agents/INTRODUCCION_AL_PROYECTO_PROMPT.md` on `introduccion-al-proyecto` SHA `61b0721f1b3e255ae07a8a76d103e4b015960b8c`, plus [owner evidence PR #47](https://github.com/jbob-coder/The-idle-open-world-universe/pull/47), OPEN at retirement. No 3D engine, camera, geometry, shader or fixed voxel specs were automatically approved. Existing 2D code must not be destroyed or represented as the approved final renderer. Do not require the new owner to personally place settlements/kingdoms; Sims decide how to create society.

## Blockers, unfinished work and review cautions

- CIV-001 independent PR review still pending; keep in_review/owner as current governance. No illegal transition to ready and no author self-verification.
- INT-003 PR #36 has [independent mismatch report](https://github.com/jbob-coder/The-idle-open-world-universe/pull/36#issuecomment-6258352474) on exterior threshold vs interior threshold alignment. Check before connecting real doors.
- Old 2D-only `BOT_MASTER_PROMPT`, `PIXEL_WORLD_STYLE_GUIDE`, and metre-based footprint design require reconciliation with approved 3D Pixel Squares presentation, not a unilateral rewrite.
- All four features remain in unmerged PRs; retained commits are **not main gameplay release**. Do not conflate Node/Emulator PASS with physical 2–3 GB QA.
- No credential files, local saves, private data or chat transcripts were published. This run uses GitHub connector reads and writes, no local clone/working tree. No useful uncommitted source files are known; aborted Git object drafts from old SHA conflicts are not published branches and should never be used as authoritative claims.
- The handoff validator currently limits `last_known_status` to `claimed,in_progress,in_review,blocked,ready`. Because WLD-001, QA-003 and WLD-006 are already **verified**, making new root `<TASK_ID>.json` records claiming `verified` would fail the official CLI, while changing their recorded status to `in_review` would be false. Their complete truthful history is therefore retained here and under `related_verified_tasks` in `CIV-001.json`. Do not edit governance scripts or downgrade their registry status merely to satisfy a retirement file format.

## Successor actions

1. Before ANY code: read latest owner direction PR #47 and current coordination registry, board, task workflow, as well as `docs/agents/handoffs/CIV-001.json`; verify SHAs and PR statuses anew.
2. Arrange an independent review for CIV-001 [PR #35](https://github.com/jbob-coder/The-idle-open-world-universe/pull/35); retain draft PR and historical 2D code while deciding how 3D geometry will consume or replace planning data.
3. Keep WLD-001/#23, WLD-006/#38 and QA-003/#30 status verified (not done) until explicitly integrated and accepted; no duplicate tasks; don't re-run cancelled Android jobs and claim PASS without a genuine success.
4. Handle existing collision reports, save v1 safeguards, offline Android and real 2–3 GB tests before release. Treat physical certification QA-004 as blocked until real device measurements.
5. No new bot inherits TERRAIN-01 identity or an in_review ownership claim. Only use task/claim protocol for tasks currently READY and unowned; no unauthorized merges.

**No deletion, branch reset, force push, task claim, release or merge was authorized or performed during this retirement.** The final owner-facing certificate is issued only after GitHub reconfirmation and official governance CI handoff validation.
