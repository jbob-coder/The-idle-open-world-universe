# GODSEED — World/Autonomy Validation Matrix

**Purpose:** a reproducible acceptance plan for the additional foundation and regional design tasks, independent of sprite appearance.

## Test tiers
| Gate | Test method | Required evidence |
| --- | --- | --- |
| F0: simulation boot | `node --test tests/*.test.js`, `python build.py` | 0 failures and no external network fetch |
| F1: decision progress | 10,000 ticks × multiple fixed seeds | Nim goals progress; no endless invalid paths, NaN stats, unbounded logs/NPC/enemies |
| F2: terrain safety | 100 deterministic seed sweeps, BFS | all required anchors valid/reachable, initial food/wood/stone, no water-road contradiction |
| F3: regional identity | 64×48 region membership × 100 seeds | 3,072 cells assigned exactly one valid region ID; same seed/manifest → identical result |
| F4: encounter/governance | 3 NPCs, Inspire success/reject, cooldown | no Faith debit on invalid; one benefit and journal entry per favor |
| F5: finite discovery | shrine/ruin progression and restoration | one-time rewards, old saves migrate, no repeated Faith farming |
| F6: visual integration | 640×360,720×400,960×540 × 3 zooms | current region readable, actor not occluded, targeting correct |
| F7: Android QA | physical 2 GB/3 GB RAM phone when possible | process memory PSS/RSS, FPS, 20 min, pause/resume, offline backup; or BLOCKED |

## Seed suite example
`[1,2,3,7,42,99,256,1024,9090,20261017]` for long-run regression; sweep at least 100 deterministic seeds including these for world generation. Keep CPU cost bounded; test timeouts should be measured in CI and not set to a fabricated figure.

## Failure examples Codex should investigate
- River water separates one of the villages; displayed dirt path visually passes through impassable WATER.
- A deterministic seed places all edible berries unreachable after one forage; Nim loops `Find food` indefinitely.
- NPC stays permanently under a tree sprite, so user cannot target Inspire.
- Follow omen persists on an unreachable tile; Nim repeatedly replans full BFS rather than clearing fallback.
- Shrine rewards can be earned repeatedly by walking off/on or by loading old saves.
- Region overlays mutate `s.seed` from draw calls, changing Nim's choices based on FPS.
- Resource/ruin generation overwrites a saved camp or home after migration.
- Sim runs while paused, backgrounded, or twice after app resume.
- Optional 5 GB pack mistakenly loaded into the JS heap on a 2 GB RAM device.

## Long-run evidence format
```json
{"commit":"...","seed":42,"ticks":10000,"finalDay":42,"nimLevel":6,
 "newRegions":8,"connectedLandmarks":5,"softLocks":0,
 "npcCount":3,"enemyPeak":5,"memoryKB":0,"status":"illustrative-shape-not-results"}
```
Values in example are placeholders **not measured performance outcomes**. Real test harness must calculate values rather than copying them.

## Gates that may remain blocked in preparation
- Full NPC behavior, regional generator/landmark placement and new biome ecology are not implemented; do not claim corresponding tests PASS.
- Browser visual screenshots cannot verify Android device performance.
- Existing save-schema validation must be used when region discovery metadata is added.
