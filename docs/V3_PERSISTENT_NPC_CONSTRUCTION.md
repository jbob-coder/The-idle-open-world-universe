# GODSEED — Persistent autonomous NPC construction

Repository: `jbob-coder/The-idle-open-world-universe`  
Experimental implementation: `feat/godseed-v3-autonomous-work-orders-20261020`  
Base: `feat/godseed-v3-autonomous-exploration-20261020` (draft PR #67); **not merged**.

## Authoritative owner requirement

GODSEED is an open-ended simulation without chapters. NPCs decide how and whether to forage, travel, construct, socialize, and establish communities. The programmer supplies general building abilities and physical rules, **not a prewritten kingdom or obligatory construction schedule**. Work continues offscreen and must persist through rest, hunger, and save/load.

## This implementation

- `src/v3/projects.js` is an **actor-neutral work-order system**, not a name-specific command. A proposed project records kind, site, initiator, current state, labor progress, timestamps and contributing worker IDs. A `home` requires four physically delivered timber units/labor shifts; a `road` requires one. Multiple distinct real workers can fund and advance the **same** work order through this module. There is no instant building or imaginary inventory.
- `src/v3/expedition.js`: Mira uses these work orders for real homes and road tiles. Each work tick requires the actor at the site, with at least one wood and enough energy; every unit subtracts actual personal inventory and adds to the world construction expense ledger. Jobs remain active while she rests, eats, gathers, or travels. A home or road enters the world structure list **only on completion**.
- `src/v3/agency.js`: unfinished shelter counts as an available continuation; construction and wood gathering remain alternatives alongside survival and exploration. The existence of a project does not override individual decisions.
- `src/v3/world_sim.js`: schema version **6**, migration from schemas 1–5; schema-5 migration gives existing old structures **no fictional labor history**, and starts recording new jobs at the import tick. Live scene construction counters are observational; the camera never creates structures. Standalone offline HTML and `build_v3.py` include the new module.
- `src/v3/app.js`: observer UI shows current/finished work orders.
- `tests/v3_projects.test.js`: verifies two independent worker contributions to one order, interrupted/resumed labor, saved partial project state, actual timber conservation, project identity/time tampering and schema-5 compatibility; the existing full suite guards wilderness and NPC progression.

## Hard gameplay invariants

1. Every new completed `home` or `road` after the work-order cutover has a corresponding fully paid job; preexisting imported buildings do not require retroactive fictional contributions.
2. Work progress is incremented **only when the worker is alive, physically on-site, has available energy, and pays exactly one timber**. No remote construction, automatic construction by drawing/map queries, or free timber.
3. Job progress cannot exceed its material cost. Worker contribution totals must equal progress, and completion tick must match the built structure. Workers cannot spend on detached/forged jobs.
4. In-progress timber has its own accounting: `total wood spent = route camps ×4 + completed homes ×4 + completed road tiles + material paid into active projects`. The worker's carried wood decreases at the same time.
5. The project list and contributor count are bounded to avoid runaway mobile save size. Every project has a unique type/coordinate identity, and older saves migrate without moving existing structures.

## Limits — do not advertise a completed civilization

The shared work-order API is multi-worker capable and has explicit two-worker tests; **live Mira is currently its first integrated worker**. Live Taren still builds route camps using the older code and has not been assigned the new work-order capability. Residents have not yet been expanded into a generic multi-NPC village population. This PR therefore does **not** establish a kingdom, add families, introduce a generalized regional labor market, or prove a mobile world with thousands of independent agents.

A full multi-NPC economy requires generalized actor inventory ownership, material hauling between real storerooms, conflict arbitration, site reservation, construction cancellations, repair work, workplace choice, and an unbounded geographic expansion plan. Future kingdoms must arise from actual functioning independent settlements, cooperation and governance; no authored capital, ruler or founding tick.

## Recommended next code changes

- Extract the Mira-specific wilderness actor lifecycle into an NPC-agnostic settlement resident loop; each agent has its own needs, household/occupancy, inventory and decision context.
- Add shared storage and explicit resource transactions so multiple live builders can fund the same work order without conflating their individual inventory balances.
- Introduce work site reservations and real `repair`, `farm`, `store`, `bridge` recipes. Build choices should depend on shortages, safety, demand and terrain.
- Replace Taren's camp instant-build path and the hard-coded first resident arrival with world-causal voluntary participation and migration.
- Implement player-visible partial construction scaffolds, local labor histories and decision reason/alternatives.
- Only after multiple self-sufficient settlements exist: household formation, population renewal, regional diplomacy, community leadership and emergent kingdoms.

## Verification and coordination

Run `node --test tests/*.test.js`, `python build_v3.py`, and the repository's offline Chromium and Android CI workflows. Record the **exact tested SHA**; CI APK/emulator build does not certify performance on physical Android hardware. This branch must not overwrite the governance board or other agents' CIV-002/SIM-003 claims. Work is intentionally isolated and stacked; integration must reconcile multiple open V3 PRs first.
