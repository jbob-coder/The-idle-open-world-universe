# GODSEED — World and Systems Contracts for Codex Cloud

## Architecture boundaries
`src/sim.js` owns tile map, simulation tick, NPC decision-making, resources, enemies, combat, stories, Faith, and save serialization. Planned new region metadata belongs in a small pure world/region library called by the simulator, e.g. `src/world/regions.js`; **the module is not present yet**. `src/ui.js` renders *read-only* region identity, environmental art and status. Changing visuals must not advance simulation or mutate Faith.

## Region data
- Use `data/world-regions.v1.json` as planning authority and source of names/anchors. It is NOT loaded by the runtime today.
- Region membership is independent of semantic tiles 0..10. **Never renumber the tile enum to add eight biomes.** The same FOREST tile can appear in R03 or R06 with visual/encounter rules and subtle palette variation.
- The starter world remains 64×48. A region lookup should be O(1) after precomputation, or derived deterministically without per-render BFS/noise generation; atlas rendering keeps a small cache.
- Keep deterministic RNG separate from visual variation so drawing a region does not change the `s.seed` trajectory of gameplay.
- Discovery UI reveals a region only when Nim enters/reveals a region landmark under existing fog rules; do not expose spoiler coordinates.
- Save approach: region mapping derived from existing seed and stable manifest version; if region/discovery data persisted add optional `s.regions` metadata with safe `restore` defaults. Do not change global `version:1` without migration and test.

## Generation and connectivity
- Existing two villages: (25,21),(37,27). Existing shrines: (20,31),(42,19). Existing Nim start: (32,24).
- One reserved protected start within Manhattan distance 5; no unavoidable hostile spawn therein at the beginning. Existing 7×7 terrain clearing is not fully equivalent to a permanent protected radius and must be tested.
- BFS guarantees (for new world seeds, not by rewriting old save maps): start→each settlement, start→both shrines, start→at least one ruin. If a land bridge is necessary, place it as a traversable logical ROAD only when both visual/pathing semantics agree.
- Preserve food/wood/stone resources reachable from start despite carving roads/village pads. Don't spawn berry bushes over water, villages, shrines, camps or ruins.
- Existing `walkable` blocks WATER only; additional environmental hazard flags must be designed and tested separately, not inferred from art. Pathfinding remains bounded to 3,072 cells.
- Avoid blocking NPC home tiles, exhausting all food, inaccessible shrines or breaking the camp location.

## NPCs and region use
- **Three active travelers maximum** for this slice; Ira = herbalist of R02, Toren = guard of R01, Mera = scholar near northeastern shrine (42,19). Existing mechanical home positions remain as in source.
- A NPC's `homeX/homeY` remains authoritative; their `region_id` can be derived to drive appearance and target selection, but no player-directed routing. Visitors need a bounded patrol radius and collision checks.
- Actor roles tie to living zone activities: herb gardening, roadside watch, research. These use current one-shot Inspire effects as baseline; do not add new infinite resource exploit.
- Enemies spawned by area profile must respect global cap 5, start safety, and fallback escape/recovery logic. A region cannot force Nim into guaranteed endless death.

## Divine world interactions
- Existing `COST={bless:4,gift:5,bloom:6,guide:3,storm:8,inspire:5}` is the authority. New area visuals may enhance perceived impact but cannot alter costs or effects silently.
- Power targeting must still honor active zoom and fog-of-war; coordinates = world tile, not scaled UI pixels. Invalid target must neither debit Faith nor mutate a world object.
- World-region hooks are *future*: e.g. Bloom in R02 helps herbs, Inspire Toren affects wolf patrol; they must be finite and testable. Event log records real changes in state.

## Zone content contracts
| Area category | Required minimum function | Visual cue |
| --- | --- | --- |
| Safe spawn | survival resources, visible progress | fresh grass, clearings, starter stones |
| Hamlet | NPC life/contact, service opportunity | cottages/roads/fields |
| Forest | renewable berries and wood, bounded wolves | trees/canopy/moss |
| Ridge | harvestable stone and stronger risk | boulders/scarp |
| Ruins | finite lore/traps and rumor | broken masonry, runes |
| Shrine grove | finite blessing/knowledge | rune monoliths |
| Fen/wetlands | water traversal and discoveries | reeds, water edge, dry routes |

## What Codex should implement first
F01–F05 (foundation) before W01–W10 (new region rules); A/B visual integration may proceed alongside them only if gameplay behavior remains stable. S01–S05 disk planning remains distinct from RAM performance. Report each implementation/QA task with a commit and test link; don't call a region complete because it appears in lore docs.
