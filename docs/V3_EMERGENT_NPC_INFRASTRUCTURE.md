# GODSEED V3 — NPC infrastructure capability (experimental gameplay slice)

**Product authority:** NPCs build the settlements, roads and eventual kingdoms through simulated decisions and material work. The programmer supplies capabilities and constraints, not a fixed kingdom, pre-selected ruler, map blueprint or scripted completion tick.

## Implemented on this branch

- `src/v3/infrastructure.js`: general deterministic `plan(world, structures, tick)`, `next(world, structures, roads, tick)` and `validate(...)`. Road demand is inferred from **actual completed houses and route camps**, sorted by current topology and identifiers, not handwritten tile coordinates. It plans reachable walking paths and skips existing ancient paths.
- `src/v3/expedition.js`: Mira, an autonomous homesteader, first survives, physically gathers food/timber and builds her house; only then she determines which road tile needs work, acquires one timber per road tile, walks to it and builds it. She can stop to eat/rest and resume later. Taren keeps his own supplies. **No autonomous king or generalized second-settlement population is claimed.**
- `src/v3/world_sim.js`: stores finished road edits in expedition state (not the global terrain generator) and projects paid roads into the WebGL/Canvas terrain read-only view. Legacy world schema 1 and 2 use explicit upgrades to schema 3; save key stays `godseed-v3-large-world-v1`.
- `src/v3/app.js`: inspect actual road counts and Mira's frontier needs/goal in the HUD.
- `v3/index.template.html`, `build_v3.py`, `GODSEED-V3-Play.html`: stand-alone offline build integrates the new module.
- `tests/v3_infrastructure.test.js` and `tests/v3_world_npc.test.js`: topology varies by runtime structures, material conservation, chronology/identity tamper rejection, migration and restart continuity.

## Invariants and development boundaries

- Built road = one distinct, walkable, physically reached tile with an NPC builder, completion tick and `timber` material, recorded under `expedition.roads`.
- All harvested wilderness wood = Taren carried wood + Mira carried wood + 4×route camps + 4×frontier houses + 1×finished road tiles.
- Roads are not spawned by rendering, map browsing or player camera position. Rendering only overlays completed roads.
- No edits to V1 saves, `main`, society's separate save key, NPC electoral roll, other agent branches, fixed original settlements or Android host.
- This first version links a single frontier house/camp with a bounded **local pathfinding computation**, not a finite-world or gameplay travel boundary. Cross-region roads will need chained segments, cargo carriers and independent worker groups. Do not clone this one actor into thousands of agents.
- Save migration 1→3 and 2→3 does not fabricate roads. A tampered schema-2 payload with schema-3 resources must fail closed.
- A seeded house still comes from the earlier branch's fixed site: the **new road path is emergent but the overall settlement/kingdom architecture is not yet emergent**. That limitation must not be glossed over.

## Continuation to full autonomous kingdom (proposed, not already implemented)

1. Generalize NPC action contracts: decide → reserve resources/site → navigate/work → commit progress → recover from interruptions; persist task state per NPC.
2. Make self-selected **building sites** based on accessible terrain, needs and existing roads, instead of fixed coordinates.
3. Give camp residents interchangeable labor specialties and dynamically generated, cap-checked inhabitants; assign work by competence, need and relationships.
4. Enable autonomous villages: finite food/water/waste, housing occupancy, public building utility, independent stores, roads to neighboring settlements, migration and actual trade caravans.
5. Form a kingdom only when several settlements and real governance institutions exist: leadership chosen by the inhabitants, enforceable policies, negotiated territorial integration, inheritance/succession, diplomacy and the possibility of fragmentation.
6. Scale the simulation with deterministic offscreen budgets and real Android memory/performance observations. Do not hardcode a capital or a victory date.

## Verification

Node: `node --test tests/v3_infrastructure.test.js tests/v3_world_npc.test.js`.
Full V3: `node --test tests/v3_sim.test.js tests/v3_society.test.js tests/v3_infrastructure.test.js tests/v3_world_npc.test.js`.
Build: `python build_v3.py` and compare generated `GODSEED-V3-Play.html`.
Observe `?mode=world`, advance enough ticks for a real house, then inspect `state.expedition.roads`, raw terrain appearance and save/reload.
Browser/device verification is separate from node unit tests; use exact branch SHA in any test result.

**Code/status:** This is an isolated proof branch stacked on `feat/godseed-v3-frontier-resident-mira-20261020`, not an authoritative claimed CIV-003 task (CIV-003 is still `planned` on a separate governance/integration line). A coordinator must resolve ownership/dependency and integration before any merge. GitHub Actions outcomes should be checked on the latest SHA before signoff.
