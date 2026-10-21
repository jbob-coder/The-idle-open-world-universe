# GODSEED V3 — Autonomous exploration and social interactions

Status: experimental gameplay feature branch `feat/godseed-v3-autonomous-exploration-20261020`, stacked on living-world PR #66. Owner mandate: no story chapters; NPC choices, settlements and eventual kingdoms must emerge from persistent state. This work **does not merge any PR or claim ownership of other agents' assigned tasks**.

## Completed code on this branch

- `src/v3/discovery.js`: chooses from real unknown landmarks on the 1,024×1,024 seeded map. Destinations depend on distance, location type, the explorer's memory of already visited places, and individual curiosity/security/craft preferences. There is no author's prescribed destination order. `select` never mutates world state, and its bounded evaluation checks at most the 256 region centers.
- `src/v3/expedition.js`: Taren has routeMode `free` on **new world creation**; he persists a currently chosen actual target until it is reached. The ordinary simulation clock, never a camera query, moves him on real connected roads, consumes gathered wilderness food, and records discoveries. New wilderness camps are considered based on distance from existing shelter instead of `routeIndex % 4`. The remaining first-camp dependency for Mira is explicit interim technical debt.
- `src/v3/social.js`: proximity-bound (2-tile radius) encounter simulation. Willingness depends on the NPCs' individual curiosity/security and ability to participate; people can refuse. A repeated encounter observes a cooldown and grows a bounded relationship record. No communication occurs remotely or via observer commands.
- `src/v3/agency.js`: stores explorer discoveries and encounters in bounded memory as it already does for settlers. Major resident life events are protected from routine memory eviction.
- `src/v3/world_sim.js`: the independent world clock advances both exploration and physical meetings; read-only snapshot includes observable relationship counts.
- `src/v3/app.js`, `build_v3.py`, `v3/index.template.html` and `GODSEED-V3-Play.html`: offline God view includes NPC relationships; standalone HTML embeds all new dependencies.
- Tests: `tests/v3_discovery.test.js`, `tests/v3_social.test.js`, `tests/v3_journey_conservation.test.js`, `tests/v3_world_npc.test.js`. Coverage includes multiple seeds, no duplicate discoveries, preference-dependent targets, actual proximity, freedom not to socialize, resource conservation, tamper rejection and exact save/restore.

## Save and history contract

The opt-in large-world save changes from schema **4 → 5**. The localStorage key `godseed-v3-large-world-v1` does not change.

- Fresh world: Taren has `routeMode:"free"`, an individual `mind` and persisted current `target`.
- Restored world schema 1–4: Taren has `routeMode:"legacy"`; the prior 224-waypoint schedule and discovery order are preserved, not rewritten in hindsight. Migrated social ledger starts empty; past relationships are not fabricated.
- Same authoritative resource ledger continues to account for actual trees, food, house, camp and road expenditure. Social interactions currently exchange no resources or items, avoiding magic inventory transfers.
- All social ties and current targets are validated on load; malformed identities, forged locations and impossible meeting sequences fail closed.
- Future schema upgrades must preserve `free` and `legacy` mode semantics until legacy archives have a dedicated explicit importer.

## Known architectural debt and next gameplay implementation

These are **unimplemented** and must not be advertised as finished kingdom-building:

1. Generalize NPC spawning. Taren still appears after an authored minimum tick/workshop condition, and Mira still enters after the first camp. Replace these with finite, causally grounded family/migration/population systems (food, housing, attraction, mortality) and independent scheduling.
2. Build independent NPC work projects. A home-site choice and a local road exist; tools, blueprints, material ownership, task cancellation, multi-worker projects, repairs, and arbitrary building types must become reusable skills.
3. Extend communication to relationship-driven cooperation, disputes, family, settlements and migration. Conversations and trust are present; no political affiliation/role negotiation is yet implemented.
4. Make settlements emerge only when residents actually build sufficient shelter, food systems, paths and civic institutions, and *choose* to form a community. Do not name a capital or create a settlement purely by crossing a tick threshold.
5. Make kingdoms emerge from alliances, governance, territory and voluntary/involuntary political integration among already-established settlements. Support conflict, succession and fragmentation, with multiple kingdoms later; no authored kingdom script.
6. Remove preauthored ancient road grids, seeded plazas, fixed homeland blueprint, settlement office targets and council timing from **new** gameplay without erasing the older compatibility environment. Implement real surface roads as traversable navigation cost edits, not only visual overlays.
7. Scale and verify offscreen NPC evolution: deterministic state for unloaded chunks, no camera-coupled simulation, bounded work per tick, seed-diverse long runs, memory budgets, real device battery/performance checks.

## Tests and verification

`node --test tests/*.test.js` plus `python build_v3.py`; generated standalone HTML must match the committed artifact. CI workflows: **GODSEED offline QA**, **GODSEED V3 offline 3D proof**, and **GODSEED V3 isolated Android APK**. The latter is an emulator/build proof, not a physical Android acceptance. Record the exact head SHA and CI outcome in PR; earlier intermediate run failures do not indicate the final head outcome.

Graph of responsibilities:

- `World.terrain` → defines → actual walkability and resources
- `Discovery.select` → considers → explorer preferences, existing discoveries, landmarks
- `Agency.commitChoice` → updates → persistent individual motivation
- `Expedition.advance` → performs → bounded physical travel / work / consumption
- `Social.advance` → considers → proximity + consent + survival state
- `Expedition.validate` → validates → discoveries, buildings, resources and relationship history
- `WorldSim.serialize/restore` → preserves → authoritative history across sessions
- `App/View` → observes → world state without authoritative NPC commands

## Ownership

This branch is stacked on #66 (which is stacked on #65, #64, and the experimental large-world/society sequence). It is intentionally not merged to main. Existing CIV/SIM/WLD tasks may have different owners on the governance branch; coordinate integration rather than overwriting another bot's active claim.
