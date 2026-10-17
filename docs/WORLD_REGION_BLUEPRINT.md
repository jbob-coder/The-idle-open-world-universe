# GODSEED — First World Region Blueprint (64×48)
**Status: planning, not implementation.** Authority: `data/world-regions.v1.json`. All coordinates in logical tiles `0..63` × `0..47`. World art is overhead 2D square pixels. No map files, movement logic, or saves are changed by this blueprint.

## What the current game already contains
Current `src/sim.js` generates a seeded 64×48 map, clears a safe-ish 7×7 starting area around Nim at (32,24), places berries, wood and stone, approximately 10 generic ruins, two VILLAGE tiles at **(25,21)** and **(37,27)**, and shrine tiles at **(42,19)** and **(20,31)**. Ira lives near the eastern village, Toren near the western village, and Mera near the northeastern shrine. It has roads, three autonomous NPCs, wolves/boars, skills, a Faith/power economy and saves, **but no persisted named regions, regional danger tables or regional production systems.** The eight region names below are proposals until integrated and tested.

## First playable region layout
| ID | Region (proposed) | Anchor | Purpose | Content priorities |
| --- | --- | --- | --- | --- |
| R00 | **Hearthfield Clearing** | (32,24) | Safe arrival, learn survival without commands | Food, wood, stone, camp, visible Nim intent |
| R01 | **Briarford Hamlet** | (25,21) | Western social hub and guarded roads | Toren, cottage, guard sign, limited shelter |
| R02 | **Emberwick Hamlet** | (37,27) | Eastern healing/food hub | Ira, herb plot, fence, Bloom/Inspire synergy |
| R03 | **Mossveil Wildwood** | (10,13) | Gathering and first forest danger | Timber, berry patch, wolf trails, moss detail |
| R04 | **Stormstone Ridge** | (52,10) | Quarry/highlands and stronger danger | Stone, boars, rocky paths, old quarry |
| R05 | **Crownfall Ruins** | (31,7) | Discoverable history and traps | Royal arch, rumors, finite lore reward |
| R06 | **Oathkeeper Grove** | (15,38) | Divine lore and shrine pilgrimage | Shrine near (20,31), runic grove, Faith |
| R07 | **Moonwell Fen** | (50,39) | Water navigation and magical clues | Marsh pools, reeds, dry stepping paths |

**Important:** Region anchor != exactly where a given ruin or shrine is currently generated. The anchors define future region identities, while actual POIs may remain seed-dependent. The two **existing** settlement tiles and shrine coordinates must be honored as integration constraints. R03–R07 are predominantly future biome overlays, not already functioning areas.

## World map schematic (not a screenshot)
```text
                  NORTH  y=0
      [Mossveil] [Crownfall Ruins] [Stormstone Ridge]
           \           |             /
    [Briarford] — [Hearthfield] — [Emberwick]
          \            |               \
       [Oathkeeper Grove]         [Moonwell Fen]
                  SOUTH  y=47
             WEST x=0   EAST x=63
```
This describes major paths and gameplay relationships, not exact map topology. Use a seeded region influence map for natural boundaries rather than placing rectangular zones visibly on the map. **Roads are connectors, not an extra biome occupying the same semantic tile IDs.**

## Recommended area generation contract
1. Keep seeded terrain and tile IDs `GRASS:0 ... SHRINE:10` intact. Region IDs live separately from terrain IDs, allowing different art/encounter/resource rules without changing save semantics.
2. Use deterministic region identification based on anchor proximity plus small seeded jitter. Reserve a **Manhattan radius 5** starter sanctuary around Nim. Tie break by region ID for reproducible behavior; avoid expensive repeated noise in draw loop.
3. Place/validate starting food, wood and stone; guarantee one reachable path from start to both villages, the two existing shrines and at least one ruin (BFS over actual walkability). Keep water impassable until a genuine bridge/ford mechanic is implemented.
4. Roads must connect real points of interest; avoid painting a visual road over impassable water without fixing traversal logic.
5. Respect the current limit of **three traveling NPCs and five enemies**. Place hostile activity away from the protected starting area. Regional wildlife names are themes, not additional NPCs unless implemented.
6. Use the same region ID to style world fog, map discovery descriptions, ambient tiles and journal entries. Render may not change AI decisions or supply unlimited resources.
7. Preserve old saves: build region IDs deterministically, do not rewrite previous maps or move existing player/NPC coordinates on load. Provide optional metadata migration if storing per-region discovery milestones.

## Gate 1: complete an autonomous vertical slice
The **first three linked areas** are more important than eight decorative regions. Nim must spawn safely, gather/eat/rest, reach or establish camp, leave and return, autonomously meet a traveler, receive a divine intervention and continue with no player movement. Enemy hazards must be escapable; if all foraging resources disappear, a renewable source must recover gameplay. Journal and HUD explain actions. Existing functionality should remain intact while defects/soft locks are fixed.

## Gate 2: make each region purposeful
Once Gate 1 is stable, connect the five wilderness/ruin areas with unique resources, hazards, visual language and at least one finite discovery. Distinguish travel costs, safe routes and region encounter behavior without creating dozens of simulated NPCs. More decorative buildings alone do not count as a new functional region.

## Long-term (NOT MVP scope)
Multiple separate maps, settlements with populations, farming economies, trade caravans, seasonal changes, dungeon interiors and large optional content packs. Those can later use chunked map manifests and streaming. Their planned 1–6 GB disk allowance does not justify greater RAM consumption. The first 64×48 map must actually play well on **2–3 GB total-RAM Android phones** before growing.

## Evidence requirements
Test region ID assignment across at least 100 fixed seeds for determinism and complete tile coverage. For every seed validate safe spawn, water/road consistency, reachable mandatory destinations, source resources, and finite shrine/ruin rewards; run 10k ticks across varied seeds. Verify no game action is triggered by rendering, and old pre-region saves still restore. Device memory/FPS must be separately measured before expanding the world.

**Next read:** `docs/GAMEPLAY_FOUNDATION.md`, `docs/WORLD_SYSTEM_CONTRACTS.md`, `docs/WORLD_PLAYTEST_MATRIX.md`, `work-items/world-foundation-tasks.json`.

## Pixel-square consistency across all eight planned regions

Each region's distinct vegetation, roads, rock, shrine, ruin and settlement styles must use **the same native 16×16 tile grid, palette rules, hard edges and 2D overhead camera**. Make visual identity through original clustered pixel motifs, not by assigning each biome a large smooth painting or introducing inconsistent perspective. The strict art and regional visual checklist is in `docs/PIXEL_WORLD_STYLE_GUIDE.md` and `docs/PIXEL_ART_ACCEPTANCE.md`. No region qualifies as implemented until **both its gameplay function and its square-pixel presentation** work in actual screenshots.
