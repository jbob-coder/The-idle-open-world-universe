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
