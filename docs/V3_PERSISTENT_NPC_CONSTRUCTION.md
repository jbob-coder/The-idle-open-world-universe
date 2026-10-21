# GODSEED — Persistent autonomous NPC construction

Repository: `jbob-coder/The-idle-open-world-universe`  
Experimental implementation: `feat/godseed-v3-autonomous-work-orders-20261020`  
Base: `feat/godseed-v3-autonomous-exploration-20261020` (draft PR #67); **not merged**.

## Authoritative owner requirement

GODSEED is an open-ended simulation without chapters. NPCs decide how and whether to forage, travel, construct, socialize, and establish communities. The programmer supplies general building abilities and physical rules, **not a prewritten kingdom or obligatory construction schedule**. Work continues offscreen and must persist through rest, hunger, and save/load.

## This implementation

- `src/v3/projects.js` is an **actor-neutral work-order system**, not a name-specific command. A proposed project records kind, site, initiator, current state, labor progress, timestamps and contributing worker IDs. A `home` requires four physically delivered timber units/labor shifts; a `road` requires one. Multiple distinct real workers can fund and advance the **same** work order through this module. There is no instant building or imaginary inventory.
- `src/v3/expedition.js`: Both Taren and Mira use these work orders: Taren chooses reachable wilderness camp plots and completes four timber-funded work shifts, while Mira builds her own home and road tiles. Each work tick requires the actor at the site, with at least one wood and enough energy; every unit subtracts actual personal inventory and adds to the world construction expense ledger. Jobs remain active while she rests, eats, gathers, or travels. A home or road enters the world structure list **only on completion**.
- `src/v3/agency.js`: unfinished shelter counts as an available continuation; construction and wood gathering remain alternatives alongside survival and exploration. The existence of a project does not override individual decisions.
- `src/v3/world_sim.js`: schema version **6**, migration from schemas 1–5; schema-5 migration gives existing old structures **no fictional labor history**, and starts recording new jobs at the import tick. Live scene construction counters are observational; the camera never creates structures. Standalone offline HTML and `build_v3.py` include the new module.
- `src/v3/app.js`: observer UI shows current/finished work orders.
- `tests/v3_projects.test.js`: verifies two independent worker contributions to one order, live Taren camp construction, interrupted/resumed labor, saved partial project state, timber conservation, identity/time tampering and schema-5 compatibility; the existing full suite guards wilderness and NPC progression.

## Hard gameplay invariants

1. Every new completed `home` or `road` after the work-order cutover has a corresponding fully paid job; preexisting imported buildings do not require retroactive fictional contributions.
2. Work progress is incremented **only when the worker is alive, physically on-site, has available energy, and pays exactly one timber**. No remote construction, automatic construction by drawing/map queries, or free timber.
3. Job progress cannot exceed its material cost. Worker contribution totals must equal progress, and completion tick must match the built structure. Workers cannot spend on detached/forged jobs.
4. In-progress timber has its own accounting: `total wood spent = route camps ×4 + completed homes ×4 + completed road tiles + material paid into active projects`. The worker's carried wood decreases at the same time.
5. At most three projects may be active at once, and each project has at most eight distinct contributors. Completed orders remain in the persistent audit ledger and must match actual completed structures. No lifetime project-count cap may prevent further construction; the validator rejects ledgers longer than the number of real structures plus three active worksites.


## Ledger scaling and persistence (follow-up)

The original work-order implementation stopped accepting every new project after 128 lifetime entries, including completed roads. That would eventually freeze construction in an expanding civilization. The follow-up removes the historical-count cap without changing save schema 6, removing past work orders, resetting NPCs, or changing timber costs. At most three **unfinished** worksites remain allowed at once.

Save validation indexes completed structures and paid construction receipts by type, coordinates, and completion tick. It rejects orphaned jobs, missing post-cutover receipts, duplicate project identities, unsupported contributors, and more project records than actual buildings plus the active-site allowance. Receipt lookups are linear in ledger size instead of repeatedly scanning every structure for each completed job. A 160-project regression checks that paid work continues beyond the old limit.

**Remaining scaling debt:** Completed jobs persist as one receipt per world structure. This is intentional audit preservation, but serialization size and linear find() lookups still grow with genuinely constructed roads and buildings. For much larger worlds, introduce versioned regional receipt compaction and an indexed live-project lookup, with explicit migration and tamper/conservation tests. Do not silently prune completed jobs under schema 6: it would invalidate the existing save proof for post-cutover structures.

## Limits — do not advertise a completed civilization

Both Taren and Mira are now live users of the shared construction API for their respective camp, home and road projects. The API has tests where two workers contribute to the **same** project, but the live pair have not yet chosen to collaborate on a common worksite. Residents have not yet been expanded into a generic multi-NPC village population. This PR therefore does **not** establish a kingdom, add families, introduce a generalized regional labor market, or prove a mobile world with thousands of independent agents.

A full multi-NPC economy requires generalized actor inventory ownership, material hauling between real storerooms, conflict arbitration, site reservation, construction cancellations, repair work, workplace choice, and an unbounded geographic expansion plan. Future kingdoms must arise from actual functioning independent settlements, cooperation and governance; no authored capital, ruler or founding tick.

## Recommended next code changes

- Extract the Mira-specific wilderness actor lifecycle into an NPC-agnostic settlement resident loop; each agent has its own needs, household/occupancy, inventory and decision context.
- Add shared storage and explicit resource transactions so multiple live builders can fund the same work order without conflating their individual inventory balances.
- Introduce work site reservations and real `repair`, `farm`, `store`, `bridge` recipes. Build choices should depend on shortages, safety, demand and terrain.
- Taren's instant camp-build path is retired for future work; replace his fixed original arrival trigger and Mira's dependence on the first camp with world-causal population migration, household growth and cooperation.
- Implement player-visible partial construction scaffolds, local labor histories and decision reason/alternatives.
- Only after multiple self-sufficient settlements exist: household formation, population renewal, regional diplomacy, community leadership and emergent kingdoms.

## Verification and coordination

Run `node --test tests/*.test.js`, `python build_v3.py`, and the repository's offline Chromium and Android CI workflows. Record the **exact tested SHA**; CI APK/emulator build does not certify performance on physical Android hardware. This branch must not overwrite the governance board or other agents' CIV-002/SIM-003 claims. Work is intentionally isolated and stacked; integration must reconcile multiple open V3 PRs first.
