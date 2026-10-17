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
