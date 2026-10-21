# GODSEED V3 — NPC system: audited implementation, gaps and continuation handoff

**Audit date:** 2026-10-20 (Puerto Rico local date; some GitHub Actions records are dated 2026-10-21 UTC).  
**Type:** source-grounded documentation / handoff, **not** a gameplay implementation, release, task claim, independent code review or approval to merge.  
**Owner objective:** self-directed NPCs that craft, build, maintain settlements, socialize, elect leadership, and eventually populate and develop the large world without mandatory player commands.

## 1. Exact source and evidence boundaries

| Line | Location / source HEAD inspected | Meaning |
| --- | --- | --- |
| Legacy shipped/default | `main` at `163fe24d2679c57ae73b23f001d8c64c7729983f` | Separate older V1 code. The V3 NPC work below **is not on main**. |
| Local autonomous society | [draft PR #57](https://github.com/jbob-coder/The-idle-open-world-universe/pull/57), `feat/godseed-v3-crafting-settlement-leader-20261020` at `75bcf267891eb1d84d7e2797b3a67aa46f0570e9` | Three-person society, council, outpost. |
| Expanded world | [PR #60](https://github.com/jbob-coder/The-idle-open-world-universe/pull/60), `feat/godseed-v3-large-world-20261020` at `aedcb28d93dde1c6096c4df7da971f32f030c5c2` | Built **on PR #57**; adds streamed world and Taren, preserves local society logic. This is the source tree for this document. |
| Separate diurnal branch | [PR #58](https://github.com/jbob-coder/The-idle-open-world-universe/pull/58) at `2e6f9a254ee9b200a8be370acf29b4f690c99bec` | Day/night, Aria rest/poses in a **separate integration line**. Do not assume those changes are in PR #57/#60. |

**Observed CI, not rerun by this documentation author:** exact-head PR #57 [V3 offline proof](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39521564197) and [V3 Android preview](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39521557836) both have GitHub Actions `conclusion=success` for `75bcf267...`. This confirms those workflow results, **not** independent physical-device acceptance. PR #60 explicitly reports that gameplay, browser, emulator and physical-device tests were **NOT RUN by its author**; a successful HTML build is not equivalent to gameplay acceptance. This audit inspected source and documentation using GitHub, but **did not execute local tests**. Do not extend PR #57 CI results to the PR #60 code.

Existing specialized documents are [one NPC](V3_ONE_LIVING_NPC.md), [social founding slice](V3_AUTONOMOUS_SETTLEMENT_VERTICAL_SLICE.md), [council phase 2](V3_COUNCIL_AUTONOMY_PHASE2.md), [frontier phase 3](V3_FRONTIER_TWO_COMMUNITIES_PHASE3.md), and [large world](V3_LARGE_WORLD_2026-10-20.md). Their historical status statements refer to their respective source versions; this file connects them without redefining their evidence.

## 2. The three **distinct** NPC runtime modes

| Entry | Authoritative simulation | Active inhabitants | Storage key | Scope |
| --- | --- | --- | --- | --- |
| Default / `?mode=solo` | `src/v3/sim.js` | Aria, alone | `godseed-v3-prototype-v1` | Individual survival, seed-derived personality, stress/mood, learning-by-use and bounded memories; not a society. |
| `?mode=society` | `src/v3/society.js` + `src/v3/frontier.js` | Aria; later Bran and Elen | `godseed-v3-society-v1` | Local 20×20 autonomous economy, council, at most two settlements and three people. |
| `?mode=world` / **Gran mundo** | `src/v3/world_sim.js` composes `society.js`, `world.js` and `expedition.js` | Society's three residents **plus** Taren (separate wilderness explorer) | `godseed-v3-large-world-v1` | Local 20×20 society continues on the same tick while Taren explores a 1,024×1,024 landscape. |

The older V1 game and its `godseed-one-small-life-v1` save belong to another runtime. Do **not** merge those schemas by name or overwrite save slots. The large-world mode may make a **one-time copy** of a valid society save on first use; later progress in the society and world slots diverges and is **not synchronized** (`src/v3/app.js`, `world_sim.js`).

Important: `world_sim.snapshot()` appends Taren to the **read-only presentation snapshot**'s citizens and adds camps to structures. **Taren is not inserted into `society.js`'s authoritative citizen roster**, does not vote or converse with Aria/Bran/Elen, and does not receive council jobs. Calling the combined display a four-person society would be inaccurate.

## 3. NPC catalog and actual autonomy

| NPC | Creation / residence | Implemented activity | What is **not** implemented |
| --- | --- | --- | --- |
| **Aria** (`sim_aria`) | Starts the society in the founding clearing; solo Aria is a different simulation identity/slot | Society founder: survival, timber harvest, axe/kit crafting, building, conversations, voting; often steward if elected | No family, child lifecycle, independent open-ended planner or negotiation. Society personality is only a fixed `explorer` trait; do not conflate with solo cognitive schema. |
| **Bran** (`sim_bran`) | Scripted arrival after the first shelter; fixed initial coordinates/`builder` trait | Gather, craft/build, socialize, vote, specialized builder work; eligible founder of second outpost | No procedurally generated origin, trade skill economy, personal household or independent village election. |
| **Elen** (`sim_elen`) | Scripted later arrival; fixed initial coordinates/`caretaker` trait | Food-gathering role, conversations/vote, outpost courier with tracked inventory and physical travel | No family-care system or general regional trading network. |
| **Taren** (`world_taren`) | World-only, once homeland has a workshop and at least 600 ticks have elapsed | Autonomous cartography, ration gathering, harvesting finite wilderness wood, road travel, landmark discovery and resource-costed route camps | Not a voting citizen, worker in village, settlement founder with a population, merchant or companion AI. |

The social cast is bounded to **three**; the extra world explorer is not a fourth council participant. Names, traits, arrivals and building sites are authored constants, not general procedural civilization generation.

## 4. Decision pipeline: what each tick actually does

### 4.1 Society (`society.js`)

For every simulation tick, the authoritative local society:
1. Advances `tick`; each fifteenth tick allows bounded berry regrowth (maximum three berries per bush).
2. Checks the shelter and elapsed founding time before adding the predetermined next migrant, up to three.
3. Updates each living citizen in order: hunger loses one; starvation damages health; death stops actions. If hungry enough and eligible local food exists, consumes one real food. If energy is under five, rests. A new migrant travels to the first house once; a persisted `settled` milestone prevents repeated forced return.
4. Gives the outpost founder/courier first opportunity to execute **physical** site clearing, construction, returning and delivery (`Frontier.beforeAction`).
5. Otherwise prioritizes food shortage, periodic social contact, unfinished shared construction, then elected work orders, then village maintenance. Characters move at most one Manhattan grid step per action using simple axis-first walking; the local villagers **do not use A-star or obstacle-aware global pathfinding**.
6. Every 30 ticks evaluates elections (only with three living people and sufficient conversations; reelection subject to a 180-tick cooldown after a leader exists). On election, leader gets `steward` and followers are ranked for `builder` and `forager` jobs. Council chooses among `secure_food`, `reserve_wood` and `community` using measured food/wood thresholds, refreshed every 45 ticks while led.
7. Gives the frontier extension the opportunity to approve an outpost expedition or dispatch a courier with actual goods (`Frontier.afterTick`).

Hunger, rest, distance and available materials have behavioral consequences. **Council roles are deterministic heuristics, not an LLM, goal planner or learned profession model.** Votes use current skill/contribution/trust scores and stable tie-breaking; they do not constitute informed political deliberation. Relationship increases are bilateral when people physically meet. There are **no friendship categories, attraction, family bonds, disagreement, crime, diplomacy or negotiated votes**.

### 4.2 World explorer (`expedition.js` + `world_travel.js`)

Taren's separate per-tick logic:
1. Arrives only after the local workshop/tick threshold; has his own inventory (`wood`, `food`), hunger, health, energy, goal, route index, anchor and stage.
2. Hunger decays every fourth tick; he eats carried food, rests, searches nearby finite timber and renewable wilderness food when needed.
3. Uses a fixed connected itinerary of **224 regional destinations**. A bounded breadth-first search (up to 768 visited nodes) handles **local** resource/site reachability; road-step travel between region centers is a simple walkability-gated axis step, not general cross-world replanning.
4. Discovers landmarks only on actual arrival; after each group of four discoveries beginning with the first, attempts a route camp, paying **four physically gathered wood**. At most **56 camps** are allowed. Neither atlas browsing nor rendering produces NPC discoveries.
5. Saves expedition counters, discovered landmark records, camp locations and events. The local homeland keeps advancing even when the camera is elsewhere, **while the game is open**. There is no real-time background/offline world evolution after the app closes.

A camp is currently a paid static marker, **not** a staffed independent settlement. The large-world document reports a 48-chunk LRU cache, 16×16 chunks, 64×64 regions and 1,024×1,024 coordinates (−512…511); these are implementation limits, not performance benchmarks.

## 5. Resource crafting, construction and social contracts

**Local deterministic recipes** (`society.js`):

| Output / action | Material contract | Prerequisite |
| --- | --- | --- |
| Wooden axe | 2 harvested wood, one shared axe | Start of founding loop |
| Construction kit | 2 wood per kit | Shared inventory |
| First house | 4 wood | Axe and reachable authored site |
| Workshop | 6 wood + one kit | At least two villagers |
| Storehouse | 4 wood + one kit | Three villagers **and elected leader** |
| Eastern outpost house | Reserve 4 wood + 2 food for expedition; consumes the 4 wood on completion | Three founding buildings, elected council, builder, local stock, ≥2400 ticks |
| Later outpost delivery | 2 additional food moved to a courier-in-transit ledger, physically delivered | Established outpost low on food, sufficient home food |
| Taren's route camp | 4 **wilderness** wood | Destination discovered, terrain route/site reached, sufficient carried supply |

All local structure positions are still **fixed candidate coordinates** (founding house 5,5; workshop 10,5; storehouse 8,10; outpost 15,13) inside the 20×20 home map. A tree intersecting a building's four-by-four footprint is cleared and accounted for before constructing. This is not an arbitrary placement/zoning engine or a genuinely emergent city plan.

Conservation contracts to retain in future changes:
- **Society wood:** `village wood + reserved expedition wood + outpost wood = all harvested local wood − craft wood − built wood`.
- **Society food:** `village food + outpost food + in-transit courier food = local gathered food − eaten food`. Outpost travel and consumption are geographically scoped; no remote deduction from an arbitrary pantry.
- **Expedition:** `Taren carried wood = wilderness wood gathered − 4×camps built` and `carried food = wilderness food gathered − food eaten`.
- No wood regrowth is implemented in the founding local forest; berry regrowth is deterministic. The wilderness persists harvested tree positions as sparse deletions even after chunk eviction.

Capped local records: up to 96 society events, 12 factual memories per citizen, three ballots and three active roles. The outpost has no separate voter roster; the founding village's elected leader approves it. Original `society.js` validity constraints inspect ballots, symmetric relations, actor identities, stock balances and migration history. Do not silently relax validators to make new fields load.

## 6. Implementation map — read these files before editing

| Source | Owns / calls | Do not put here |
| --- | --- | --- |
| `src/v3/sim.js` | **Solo** Aria cognition, needs, memories and separate restore | Council, settlement save migrations |
| `src/v3/society.js` | **Local society authority**: residents, decision loop, jobs, crafting, stores, council, local schema v1→v2→v3 | Global wilderness tiles or camera |
| `src/v3/frontier.js` | Second outpost founding, founder movement, geographic pantry, courier and conservation validation | General kingdom or renderer mutations |
| `src/v3/world.js` | Seeded terrain, chunk generation/cache, sparse wilderness resource removals and berry changes | NPC political or family decisions |
| `src/v3/world_travel.js` | Bounded local BFS, simple road stepping and finite itinerary | Persistent actor identity or transactions |
| `src/v3/expedition.js` | Taren, discoveries, personal inventories, four-wood camps and event validation | Voting or local village authoritative citizen state |
| `src/v3/world_sim.js` | Composes local society tick with wilderness expedition, saves large world, builds read-only render snapshots | Duplicated authoritative local citizens |
| `src/v3/app.js` | Mode selection, controls, explicit save/load, world camera | Rule decisions during rendering |
| `src/v3/view.js` / `fallback.js` / `atlas.js` | WebGL/Canvas read-only visualization, God atlas | Resource generation, advancing simulation or changing NPC goals |
| `v3/index.template.html` + `build_v3.py` | Bundles sources into offline `GODSEED-V3-Play.html` | Implicit CDN/network dependencies |

**Continuity graph:**

`Owner NPC autonomy requirement → society.act/plan → real harvesting/crafting/building → bounded settlement.`  
`Citizen contributions + trust → ballots → leader → roles/policy → jobs and council-authorized frontier.`  
`Founding stores → resource reservations → founder travel and build → separate outpost pantry → physical courier.`  
`Local society tick + wilderness generator + Taren expedition → world_sim → snapshot → WebGL / Canvas.`  
`Authoritative mode state → isolated versioned save → validated reload; graphics do not own simulation.`

## 7. Persistence and compatibility gates

- Society currently writes **schema version 3** under a historically named `...society-v1` *storage key*. These are **not** the same version number. Its restore validates real schema-1 and schema-2 state **before** migration to schema 3. Existing fixtures: `tests/fixtures/v3_society_schema1_seed14.json` and `v3_society_schema2_seed14.json`.
- Solo Aria writes its own schema version 3 under `godseed-v3-prototype-v1`. Neither solo nor legacy V1 is merged with local society data.
- Large-world saves use schema version **1** under `godseed-v3-large-world-v1`, enclosing a separately validated serialized **society schema-3 homeland**, wilderness edits and explorer records. Restore checks seed/generator/resource/route constraints. The world slot is capped at 1,500,000 characters; society serialization caps at 64,000 characters.
- Changing PR #57's schema, local actor identities or frontier accounting breaks PR #60's composition and can break historical saves. Introduce explicit migration fixtures for every schema change; test all three modes separately.
- Before merging, check exact ancestry against the independent V3 Aria diurnal integration PR #58 and any concurrent branches. Do not silently cherry-pick day/night changes, replace `main`, erase localStorage, change APK signing origin or claim backward compatibility without a verified replay.

## 8. Evidence matrix: what has actually been checked

| Claim | State at audit | Reproducible evidence / gap |
| --- | --- | --- |
| Deterministic founding, three-person election and jobs in local society | **CODE PRESENT; upstream CI PASS** | `tests/v3_society.test.js` 100-seed, snapshot and migration tests; PR #57 [exact-head offline CI](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39521564197). |
| One founder travels and establishes second outpost; deliveries are ledgered | **CODE PRESENT; upstream CI PASS** | `src/v3/frontier.js` + `tests/v3_society.test.js`; same PR #57 CI. It proves only **two** local communities, not a regional civilization. |
| Historical society saves and tamper rejection | **CODE PRESENT; upstream CI PASS** | `tests/v3_society.test.js` + two historical fixtures, same source-head CI. |
| Source for 1,024×1,024 world and one Taren expedition | **CODE PRESENT; RUNTIME UNVERIFIED IN THIS AUDIT** | PR #60 `aedcb28...` source, `src/v3/world.js`, `expedition.js`, `world_sim.js`. |
| Large-world tests, playability, 224-region completion, saves and browser/WebGL behavior | **NOT VERIFIED AT PR #60 HEAD** | PR #60 states gameplay/browser/device tests not run by author; do not inherit green PR #57 result. Add world-specific tests. |
| Real physical Android 2 GB / 3 GB RAM performance and upgrade safety | **NOT VERIFIED** | Needs device logs, PSS, frame pacing, suspend/restart and save lifecycle evidence. |

## 9. Unfinished work: prioritized, **proposed** tasks, not claimed tasks

These are suggestions for the project coordinator, **not** `GOD-`/`SIM-` registry task IDs or permission to appropriate other agents' areas. Consult authoritative `docs/godseed-agent-task-governance-v1/docs/agents/tasks.json`, its generated board, and open PRs before registration/claim.

**P0 — acceptance for the unfinished large-world code**
- **NPC-A01 / test coverage:** Add `tests/v3_world.test.js` covering seeds, Taren's arrival gate, route reachability, resource ledger, deterministic step-by-step vs batched advance, long-play saving, tamper rejection, negative-coordinate chunk seams and sparse resource eviction/reentry. Fail if camps appear without payment or landmark discovery teleports. Run against exact SHA.
- **NPC-A02 / real browser proof:** Exercise `?mode=solo`, `?mode=society` and `?mode=world` in WebGL and Canvas fallback, mode isolation, first-load society copy, independent subsequent save slots, atlas controls, world rebuilding with `python build_v3.py`. Capture actual screenshots and browser errors, not illustrations.
- **NPC-A03 / navigation and survival correctness:** Stress fixed-route/road blocking, local BFS 768-node cap, camp-site impassability, starvation when resources are unreachable, outpost courier/founder starvation and simultaneous tree clearance. Every actor must either make progress or emit a bounded, inspectable blocked reason rather than silently oscillate.
- **NPC-A04 / integration gate:** Compare PR #60 with PR #57 live heads and the separate diurnal PR #58. Prevent duplicate state owners, test save migration on exact merged candidate, review Android native packaging and old V1 preservation before any integration decision.

**P1 — real social civilization beyond the bounded proof**
- **NPC-B01 / general action planner:** Build a deterministic, extensible needs→goals→actions interface with reservations and failure recovery for gathering, tools, workshops, transport and shelter. Preserve existing priorities and conservation first; avoid claims that one NPC can “do everything” without authored action contracts and measurable acceptance.
- **NPC-B02 / genuine region settlements:** Convert a paid expedition camp into a persistent community **only after** new inhabitants physically migrate and a real local inventory, housing/occupancy, jobs and governance state exist. Do not copy villages into 255 landmarks or spawn unsupported population.
- **NPC-B03 / relationships, households and generations:** Add real pairwise history, consensual household formation, age and kinship, births/deaths, grief, succession and validated population bounds; define save migration and offscreen progression before implementation. Current symmetric trust counters are insufficient.
- **NPC-B04 / political autonomy:** Independent electorates per settlement, lawful leader replacement on death, accountable policies/delegation, rival interests and durable election evidence. Maintain deterministic tie rules and avoid infinite leader reelections without meaningful voter changes.
- **NPC-B05 / regional supply chains:** Actual origin/destination ownership, loading, transport capacity, route travel, fuel/food use, delivery/failure recovery, market or barter rules. Preserve the existing courier/outpost ledger and independent Taren supplies.

**P2 — scalable fidelity and low-end delivery**
- **NPC-C01 / population scheduling:** Active vs offscreen actor cadence, bounded memory/AI CPU, deterministic replay, migration of actor state between chunks, and profiling of a realistic population (not just three people plus one traveler).
- **NPC-C02 / expressive psychology and visible feedback:** Integrate personality and factual memories across modes by explicit migrated data contracts; goals must change behavior with observable causes. Do not label log entries as learning or free-form intelligence. Connect WebGL/Canvas animations to actions only through snapshots.
- **NPC-C03 / physical Android:** Test real 2 GB and 3 GB devices: RAM/PSS, thermal/FPS, background/restart/storage, offline WebView compatibility and APK upgrade preservation.

Each task needs source owner, dependencies, acceptance tests, a fresh branch and the repository's legal task-state transition. Avoid editing `docs/agents/tasks.json` without `tools/godseed_tasks.py` on the correct coordination branch.

## 10. Practical next-session handoff

**CURRENT_OBJECTIVE:** finish documenting and verifying the whole NPC autonomy chain; only then add believable families, multiregional populations and emergent settlement governance.  
**VERIFIED_STATE:** source inspected at PR #57 `75bcf267...` and PR #60 `aedcb28...`; PR #57 exact-head CI success observed. Separate V3 modes and saves confirmed from code.  
**COMPLETED (this handoff):** file-to-feature mapping, decision and economic contracts, scope distinctions, evidence and prioritized proposed backlog.  
**NOT_COMPLETED:** no source-gameplay changes; no new local/remote test run on PR #60 HEAD; no merge; no release or physical-device qualification; no task registry ownership change.  
**BLOCKERS / RISKS:** absence of world-specific regression evidence, simple local navigation, fixed three-person society, distinct diurnal integration line, and requirement to protect saves and branch ownership.  
**NEXT_ACTION:** coordinator assigns a **nonconflicting** acceptance task for `feat/godseed-v3-large-world-20261020`, then executes tests on its exact current HEAD and reports observations with URLs; do not merge PR #60 based on PR #57's green checks.  
**FILES CHANGED BY DOCUMENTATION DELIVERY:** this Markdown file only; no gameplay, save, generated HTML, task-board or Android files changed.  
**TESTS RUN BY THIS DOCUMENTATION AUTHOR:** none; GitHub Actions outcomes above were independently read, not re-executed.
