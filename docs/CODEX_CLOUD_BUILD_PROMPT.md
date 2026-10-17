> **Updated handoff:** The complete prompt to paste into Codex Cloud is now [CODEX_CLOUD_READY_PROMPT.md](CODEX_CLOUD_READY_PROMPT.md). This earlier prompt remains supporting implementation guidance. Treat [GODSEED_INTENDED_GAME.md](GODSEED_INTENDED_GAME.md), [ANDROID_HTML_APK_SPEC.md](ANDROID_HTML_APK_SPEC.md), and [HANDOFF_READINESS.md](HANDOFF_READINESS.md) as additional authority.

# Copy/paste into Codex Cloud — implement GODSEED medieval skyworld

**Repo:** `jbob-coder/The-idle-open-world-universe`
**Preparation branch:** `prep/codex-skyworld-v0.5`
**Create new implementation branch:** `feat/godseed-medieval-skyworld-v1`
**Do not begin on main.** Current experimental ancestry: v0.2 → v0.3 medieval/NPCs → v0.4 zoom → preparation branch. PRs are stacked and not equivalent to `main`.

You are the implementation engineer. This task is to **code, run tests, render browser screenshots, build a debug APK, and submit reviewable commits/PR**, not only to propose a design.

## Product goal
GODSEED is a lightweight offline Android medieval fantasy god-simulation in top-down pixel squares. Nim is an **autonomous, local, deterministic inhabitant** who explores, survives, learns, levels up and meets traveling NPCs. The god can inspect, heal/bless, gift food, bloom resources, guide indirectly, storm hazards, and inspire travelers. **Never add joystick or direct Nim control**. No network, LLM, heavy game engine, artificial 3D or painted terrain wallpaper.

The user wants a **HIGHER sky POV with MORE individual square-pixel detail**, not another closer 3D camera. Default to **32x20 tiles** with deliberate 16x16 pixel motifs; 24x15 close and 16x10 inspect modes accessible. Use 2D silhouettes visible at default zoom. World map remains 64x48. Keep medieval-style huts, roads, herbs, stone shrines, weathered ruins and NPC gear.

## Read first
`AGENTS.md`, `docs/CODEX_HANDOFF.md`, `docs/SKYVIEW_VISION.md`, `docs/PIXEL_WORLD_STYLE_GUIDE.md`, `docs/ARCHITECTURE_CONTRACTS.md`, `docs/DIVINE_INTERACTION_SPEC.md`, `docs/IMPLEMENTATION_SLICES.md`, `docs/ASSET_PIPELINE.md`, `docs/PERFORMANCE_BUDGET.md`, `docs/TEST_PLAN.md`, `assets/README.md`, `assets/asset-manifest.json`, `work-items/codex-tasks.json`. Inspect existing `src/sim.js`, `src/ui.js`, `index.template.html`, `build.py`, `android/build_apk.py` and tests before edits.

## Implementation procedure
1. Inventory existing code and run baseline automated tests. Identify camera/world mapping and existing v0.4 3-zoom path. Preserve save key and format.
2. Work through slices A→B→C→D→E in order, **five tasks each**, with small independently testable commits. Capture before/after screenshots from actual built HTML; never substitute mockups as implementation evidence.
3. Introduce small `src/render/` modules only if offline `build.py` can bundle them for older WebView. Otherwise keep thin helpers in `src/ui.js` and add tests. Use 16px atlas source, pixelated Canvas2D, deterministic decoration, cached terrain and simple FX.
4. Use original starter art in `assets/generated/`; expand or redraw according to manifest/art bible. Distinguish generated placeholders from truly finished sprite animations. Never use third-party assets without proper license.
5. Expand tests as each system arrives; run `node --test tests/*.test.js`, `python build.py`, browser mobile smoke and `python android/build_apk.py` + `python tests/test_android_package.py`. Measure browser redraw/performance. No fabricated physical hardware results.
6. Make landscape HUD usable at 640x360, 720x400, 960x540 incl. safe areas and all three zooms; verify god tap targeting/letterboxing. Save migration must preserve all preexisting worlds.
7. End with: implementation PR, affected files, tests and counts, browser screenshots, debug APK artifact/sha, measured constraints, Android-device state, follow-up backlog, and exact user test/install instructions.

## Non-negotiable invariants
Nim decides where to move/fight; god powers only change conditions. No silent schema changes: `godseed-one-small-life-v1`, `version:1`. Tile semantics stable 0..10. All functions local/offline. No production-signing secrets. Do not merge PR stack into `main` without explicit owner approval.

## Definition of done
Every implemented task in `work-items/codex-tasks.json` is backed by passing tests and evidence, original art is integrated without blurring, the simulation still makes autonomous progress, three cameras and NPC powers function, the offline HTML starts without network, the debug APK is structurally verified, and hardware QA is either recorded or explicitly unresolved. Use TODO/BLOCKED status for unfinished items.

## Useful implementation questions to decide autonomously
Use pixel-constrained art with source-of-truth atlas manifest. Favor 32x20 default over 24x15; preserve other two modes. Favor simple finite FX over procedural blur. Favor world traversal readability over UI ornament. Do not defer trivial design decisions to the user if these documents cover them.
