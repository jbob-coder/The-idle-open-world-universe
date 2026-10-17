# GODSEED — Codex Cloud handoff readiness and release gates

This file deliberately distinguishes three meanings of "ready." Do not confuse **preparation ready to send** with **implementation complete** or **APK ready for distribution**.

## Gate P — Preparation ready to send to Codex Cloud
The goal of Gate P is to make implementation unambiguous and reproducible. The repo *may be sent to Codex Cloud* once all these checks pass.
- [x] Last running code baseline is identified: `feat/skyview-zoom-v0.4` (experimental branch), with stacked PR ancestry documented.
- [x] Stable prep branch `prep/codex-skyworld-v0.5` and PR #4 exist; no changes to `main`.
- [x] Intended product behavior, god controls, Nim/NPC autonomy and scope spelled out in `docs/GODSEED_INTENDED_GAME.md`.
- [x] HTML/JS/Canvas/WebView architecture, offline asset loading, storage/signing migration and recommended native build path described in `docs/ANDROID_HTML_APK_SPEC.md`.
- [x] Camera/zoom, pixel sizes, palette, FX, lore, performance and Android UI specifications stored with the repository.
- [x] Original source starter atlases, reference art, generator, manifest and provenance included; sources are *not* claimed to be rendered by current game.
- [x] The implementation plan has 25 independent acceptance tasks and tests.
- [x] A copy-ready prompt exists in `docs/CODEX_CLOUD_READY_PROMPT.md`.
- [x] Automated art regeneration and baseline Node tests passed on GitHub Actions (run 39071353986 at time of prep), with separate APK structure QA (run 39071353915).
- [ ] **Owner's deliberate handoff:** choose the correct GitHub repo/branch in Codex Cloud and submit the saved prompt. This is an external user action, not something the prep PR can complete.

**Gate P status: READY FOR CODEX IMPLEMENTATION HANDOFF** once the new documents are committed and verified. It does **not** mean finished game art.

**Storage handoff:** Prepared requirement 1 GB core installed target + optional 5 GB app-managed data (nominal 6 GB disk, NOT RAM), with `docs/STORAGE_BUDGET_AND_PACKS.md`, `config/storage-budget.json` and 5 more TODO tasks S01–S05 (30 total). None is runtime enforced by the current prototype.

**Low-RAM hardware directive:** Target **2–3 GB total physical RAM phones**, with preferred app resident usage 128–192 MiB and provisional 256 MiB soft ceiling. These are unverified targets, not phone-level allocation. See `docs/LOW_RAM_HARDWARE_TARGET.md` and `config/hardware-budget.json`.

**New foundation/world work:** `docs/GAMEPLAY_FOUNDATION.md` and `docs/WORLD_REGION_BLUEPRINT.md` plan 8 named functional regions, with `data/world-regions.v1.json` and 15 new `work-items/world-foundation-tasks.json` TODOs. Total 45 tasks (25 A–E + 5 S + 15 F/W). The plans are committed, **not implemented**.

## Gate I — Codex implementation complete (future)
- [ ] Tasks A01–E05 in `work-items/codex-tasks.json` marked DONE only after source and test evidence.
- [ ] Default high sky **32×20**, close 24×15, inspect 16×10; correct panning/follow/touch transforms.
- [ ] Manifest PNG atlases consumed by actual renderer; all map terrain IDs preserved, no blurred pixels; new animation assets where required.
- [ ] Recognizable Nim/NPCs/creatures and medieval towns, trees, roads, ruins and rune shrines at default height.
- [ ] God's valid and invalid targeting, per-power FX, one-time Faith/effects, legible NPC consequences and accessible text feedback.
- [ ] Autonomous Nim continues developing without player input; save key and version stable, prior JSON backups restored.
- [ ] Browser acceptance at 640×360, 720×400, 960×540 × each zoom, including offline mode and no unexpected network requests.
- [ ] Long-run simulation, frame-time and memory measurements reported, including any regressions or unknowns.
- [ ] Versioned experimental Android APK and exact build SHA/signature/ZIP checks (or honest tooling blocker).
- [ ] Implementation PR with real browser captures, changes, test outputs and the unresolved issue ledger. No silent merges to main.

- [ ] S01–S05 completed with actual app-private storage accounting, optional consent, 5 GB maximum extra use, 6 GB combined nominal quota, free-space guard, safe save-preserving deletion, rollback and low-storage tests; device evidence or explicit blocker.

- [ ] Android phones with **2 GB and 3 GB physical RAM** tested with real install, 20-minute autoplay, PSS/RSS/JS heap where measurable, frame times, pause/resume and optional-pack loading. Explicitly disclose if 128–192 MiB preferred/256 MiB soft target could not be met. No amount of Chromium testing substitutes for Android memory evidence.

- [ ] The five foundation tasks F01–F05 are verified; world tasks W01–W10 provide stable 8-region identities, reachable landmarks, bounded enemy/resource ecology, region exploration and old-save migration (100-seed checks and long-run simulations).

## Gate R — Android release-ready (strict future gate)
- [ ] APK installed and launched on **real low-end Android hardware**, not just Chromium and not just a structurally valid APK.
- [ ] Recorded model, Android/WebView versions, install path and screen capture; 20+ min autoplay and reliable pause/resume/rotation/backup.
- [ ] Frame rate, memory, temperature/battery observations and input correctness within documented targets or tested fallback.
- [ ] Protected stable signing identity, update compatibility, secure trusted-local WebView configuration, storage-origin migration if changed, correct target-SDK policy at release time.
- [ ] Owner approves PR stack integration and distribution. Hardware-unverified prototype must be labeled experimental.

## Status reporting template for Codex
Use in PR/hand-off report:

```text
GATE: P/I/R
BRANCH + COMMIT:
IMPLEMENTED / STILL TODO:
AUTOMATED TESTS: exact commands and pass counts
VISUAL SCREENSHOTS: source=Chromium OR source=Android physical
APK: SHA256, signing, min/target SDK, artifact location
PHYSICAL ANDROID: tested device evidence OR explicitly NOT TESTED
SAVE/MIGRATION: verified scenarios
PERFORMANCE: measured values vs targets, or NOT MEASURED
BLOCKERS / RISKS:
NEXT FIVE TASKS:
```

No task is complete based solely on documentation or reference images. Do not claim a production build is ready until Gate R is satisfied.
