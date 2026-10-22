# GODSEED implementation evidence

Base: `ff38045642fd5c9a10054ed93f2c67244dcde1e0`, prep/codex-skyworld-v0.5.
Existing PRs #1–#4 remain stacked and unmerged. Implementation branch: feat/godseed-medieval-skyworld-v1.

## Baseline
27 Node tests passed; all five source/policy validators passed; HTML build and browser smoke (1280×800, 720×400, 390×844) passed. Mobile baseline passed at 640×360, 720×400, 960×540. No external runtime requests.

## Foundation
F01–F05: offline clock, pause, 8× speed, repeated visibility resume and persistent reload tested in Chromium. Added reachable wood/stone/food ecological floor, protected landmarks from camp construction, prioritized eating before starvation recovery, rejected duplicate pending inspiration, rejected malformed survival/enemy data and >1MB JSON.

Five seeds run 10,000 ticks each, checking camp/tool progression, social contact, bounded entities and <100KB saves. Existing unreachable-omen fallback retained and tested. Existing 27 tests retained; the chance-based combat/trap test now sets up actual encounters because changed resource economics changes seeded travel routes.

Ruling: restoration retains version 1, tile IDs and map contents; invalid required numeric fields are rejected rather than silently creating broken characters. Renewal uses reachable land and deterministic order without consuming gameplay RNG. No rendering or movement controls were added to simulation.

Physical Android device testing: NOT VERIFIED (no attached Android hardware). Browser lifecycle evidence does not establish native lifecycle correctness.

## Regions
W01–W05: manifest-backed seeded Voronoi overlay with sanctuary reservation; deterministic forest/quarry/fen ecology; walkable roads to eight anchors and existing shrines; protected starter resources and enemy exclusion radius; three original NPC homes retained. 100-seed coverage/connectivity suite passes. 35 Node tests and offline lifecycle checks pass. Visual acceptance pending A–D integration.

Ruling: old saves derive an immutable worldSeed from their saved RNG seed when no original seed exists. Map, progress and positions are never regenerated. New roads replace water with semantic ROAD (dry causeway), not cosmetic bridges over blocked water.

## Discovery
W06–W10: finite Crownfall/Moonwell ruin rewards, Oathkeeper shrine preserved, one-time region chronicle/memory, region inspection and local atmospheric labels. Metadata migration preserves old maps and restores discovered IDs. 37 simulation tests pass, including 100 seeds and five 10k runs. Visual QA pending atlas integration. W10 physical 2/3GB-device evidence NOT VERIFIED: no adb, emulator or attached phone.

## Camera
A01–A05: 32×20 default, 24×15 and 16×10 alternatives; pure roundtrip transforms, integer follow, keyboard/minimap/touch drag panning. Browser test found the old dock covered the center target at 640×360; compact header and bounded canvas height fix that. Nine running Chromium captures, successful actual NPC clicks at each zoom/size, ten controls, zero errors. Pixel source validator passes. Screenshots are desktop Chromium, never Android hardware.

## Terrain
B01–B05: all four manifest atlases bundled as data URLs and drawn; terrain variants, cardinal roads, water edges and deterministic regional props. Actor and power starter frames integrated for subsequent animation slices. Fog conceals unknown terrain. Native atlas decode: 106,496 bytes. Cache invalidation covers topology/fog/camera/zoom and asset decode; 100 unchanged draws rebuild scenery zero times. Desktop before/after timing in qa-screenshots/render-metrics.json is a microbenchmark, not Android FPS. 40 tests pass; nine viewport/zoom screenshots plus regional QA scenes captured.

## Actors
C01–C05: four cardinal facings and two walking poses from simulation movement timestamps; explicit idle pose; distinctive herbalist satchel, guard shield, scholar staff/book. Original palette-limited wolf/boar frames added to existing props atlas (no extra texture). Foot anchor (8,23) mapped to cell bottom, actors sorted by feet; ground/canopy motifs render behind inhabitants so interactive characters remain visible. Current autonomous goal shown in the mobile dock. 42 Node tests passed and four-facing group scenes captured at each viewport. Source art regenerated and both raster validators passed.

## Divine interaction
D01–D05: pure simulator target preview; unseen terrain powers rejected (Bless/Gift retain their established global Nim effect); hidden travelers cannot be targeted through an adjacent revealed tile. Pending favors reject duplicate purchase. Marks have authoritative IDs; visual-only queue deduplicates and caps at 12, expires after 1 second even while paused, resets on world change. Native glyphs animate in eight bounded phases; reduced-motion checkbox/system preference gives a static glyph and text chronicle. Render cap adjusted to 20Hz (target cadence, not hardware measurement). 45 Node tests and full mobile captures pass; 100 render calls leave simulation byte-for-byte unchanged.

## Preservation and packaging checkpoint
Workspace restart preserved all eight commits, all source and captures. Re-ran 45 Node tests and five validators. Updated obsolete preparation-only ledger assertions to require evidence for completed tasks. Compact HUD now has square borders and atlas glyphs. Save imports persist before replacing the live world; quota failure preserves current state, covered by lifecycle acceptance on a real persistent (intercepted, offline) browser origin.

Experimental APK: built with JDK 21.0.2, 44,126 bytes, JAR-v1 debug signature verified. SHA256 recorded in dist/manifest.json. APK embedded HTML equals the current generated file. No private signing material tracked. Native Android lifecycle, phone installation, FPS/PSS/RSS: NOT VERIFIED. Android SDK/Gradle were downloaded outside the repository for a separate packaging evaluation; no large storage feature was started before publishing this checkpoint.

## Independent review fixes
Review found no Critical and two Important issues. Fixed inherited late-world Wander stall: retain a reachable journey and choose a destination away from the occupied resource tile. New test failed for seed 7 before the fix; seeds 7/41/2026 now continue moving for 1,000 ticks after their first 10,000. Suite: 46/46.

Replaced native JavaScript confirm() with accessible DOM confirmation for import/reset. Browser acceptance deliberately makes window.confirm throw; backup restore still passes at all three landscape sizes. Quota failure preserves the current world. Updated experimental APK and screenshots pass again. Native device execution still NOT VERIFIED.

Published checkpoint: https://github.com/jbob-coder/The-idle-open-world-universe/pull/5 (draft, against prep branch). Conventional Gradle/AGP host now compiles separately, but storage work and device validation remain in progress.

## Conventional Android and storage batch — 2026-10-22

Preserved and rechecked published checkpoint `96eee6948302f08d4084b10c87b2370409cde604` and PR #5 before continuing. Added the separate Gradle 8.13 / AGP 8.9.2 host; the SDK-free builder and earlier APKs remain available. Both embed the same offline HTML and retain the save origin/key/version. The Gradle host adds native pause/resume callbacks and bounded app-private optional lore, SAF selection, explicit install/remove consent, actual byte accounting, quota/reserve checks, hash validation, staged updates and interruption recovery. Corrupt installed lore remains removable. The original eight-region sample is a separate 1,690-byte file and is not installed automatically.

S01–S04 have implementation evidence; S05 and E04 remain blocked on physical Android hardware. The 45-task ledger now has 43 done and two blocked. Actual device storage, SAF execution, upgrade/lifecycle behavior, RSS/PSS/FPS and 20-minute device runs are NOT VERIFIED. The 1 GB core content target is not met or padded; the initial optional format supports at most 64 files of 1 MiB each within the larger 5 GB/6 GB policy.

Verification on this workspace:

- `node --test tests/*.test.js`: **46 passed, 0 failed, 0 skipped**; includes 100 seeds, five 10,000-tick simulations and three 11,000-tick late-world journeys.
- All five manifest/pixel/world/hardware/storage validators pass. Regenerated PNG atlases exactly match committed bytes.
- `python build.py`: standalone offline HTML, 251,799 bytes.
- Browser smoke: 1280×800, 720×400, 390×844; zero JavaScript errors and zero external requests.
- Mobile acceptance: 640×360, 720×400, 960×540; 10 touch controls at least 44 pixels, divine action, backup restoration and offline checks pass.
- Lifecycle acceptance: pause, 8× time, background save, repeated resume, reload, corrupt/quota import preservation pass in Chromium.
- Renderer acceptance: four decoded atlases, 114,688 decoded bytes; 100 unchanged draws produce zero terrain-cache rebuilds and no simulation mutation. Desktop timing was 38 ms for 100 draws versus a 5.9 ms historical baseline in this run under concurrent build load. This is a microbenchmark, not Android FPS or resident RAM.
- `tests/capture_android_layouts.py`: 42 running Chromium screenshots, including all nine viewport/zoom combinations; those nine reviewed for hard pixel edges. Regional/actor scenes include explicitly documented QA fixtures. No screenshots are presented as physical Android captures.
- Optional-storage UI bridge test passes with a fake native host; `tests/storage_host.py` passes 23 JVM filesystem/quota checks, including falling free space during a write and preserved sibling save.
- Gradle `testDebugUnitTest assembleDebug lintDebug`: five JUnit tests, zero failures. Lint: zero errors, six visible warnings. The intentionally retained API 28 target is a warning for this non-Play experiment; other errors remain enforced. See STORAGE_IMPLEMENTATION.md for the warning scope.
- SDK-free APK: 45,393 bytes; ZIP, DEX/manifest structure, exact embedded HTML and JAR-v1 debug signature pass.
- Gradle APK: 107,111 bytes; compiled bridge classes, exact embedded HTML, API/application identity, no permissions and Android v2 debug signature pass. Exact hashes are in `dist/manifest.json` and `dist/gradle-manifest.json`.

Next dependent work requires devices: install each APK with the appropriate signing identity, verify backup before switching, exercise SAF import/cancel/replace/remove and low-space recovery, then measure 2 GB/3 GB device memory and frame pacing. Modern target-SDK migration and a launcher icon remain separate release preparation; this PR remains an experimental draft and does not merge the existing chain.
