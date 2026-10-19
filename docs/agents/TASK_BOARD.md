# GODSEED — Task Board (generated)

> **Source of truth:** `docs/agents/tasks.json`. NEVER manually edit this board; regenerate with `python tools/godseed_tasks.py board --write` and commit BOTH files.
> The status is about a TASK, not the percentage of the whole game. `in_review` or a green PR is **not** `done` until integration is merged and accepted.

**Tracked work:** 70 tasks · planned: 38 · ready: 4 · claimed: 0 · in_progress: 3 · blocked: 3 · in_review: 6 · verified: 16 · done: 0 · cancelled: 0.

**Coordination branch:** `docs/godseed-agent-task-governance-v1`  
**Implementation baseline:** `integration/godseed-living-society-multitile-architecture` (PR #21).

## Confirmed baseline, not outstanding task completion

- PR #16: autonomous Chapters I–III (narrative vertical slice).
- PR #17: richer living settlements, 8 visible people, relationships and God whispers.
- PR #21: six pixel-square 2×2 building variants and footprint-safe architecture; 82 Node tests and 6 native Android emulator tests passed on PR head. PRs remain **unmerged**.
- PR #20 is an **alternative** experimental society engine; do not merge #20 and #17/#21 into the same runtime.
- **Missing:** real interiors, working entry/exit doors, household jobs at home, true chunked open world, deep BitLife-style generations and physical low-RAM certification.

## Registered tasks

| ID | P | Area | State | Owner | Depends on | Definition of done (short) |
|---|---|---|---|---|---|---|
| **ART-002** | P0 | art | **planned** | — | INT-001, CIV-001 | Tile-coherent roofs, doors, interior walls and furnishings |
| **ART-007** | P0 | art | **in_progress** | LIFE-26 | GOD-004 | Redesign GODSEED mobile god-view into map-first coherent pixel interface |
| **CIV-001** | P0 | civilization | **in_review** | TERRAIN-01 | INT-001 | Metric 3×3–6×6 medieval blueprint library and zoning |
| **CIV-002** | P0 | civilization | **planned** | — | CIV-001, SIM-005 | Construction sites, builders, work orders and interruptions |
| **CIV-005** | P0 | civilization | **planned** | — | SIM-006, CIV-002 | Medieval technology and era advancement with real prerequisites |
| **CIV-009** | P0 | civilization | **planned** | — | CIV-005, SIM-004 | Kings, succession, political legitimacy, noble houses and diplomacy |
| **CIV-010** | P0 | civilization | **planned** | — | WLD-005, CIV-002, SIM-005 | Found frontier colonies and simulate logistics, settlements and autonomy |
| **GOD-001** | P0 | divine | **verified** | FORGE-27 | — | Multilingual intent parsing with negation, target and ambiguity |
| **GOD-002** | P0 | divine | **verified** | FORGE-27 | SIM-001, GOD-001 | Per-person belief, safety and autonomy acceptance engine |
| **GOD-003** | P0 | divine | **ready** | — | GOD-002, SIM-002 | Nonblocking suggestions lifecycle: heard→considered→action→result |
| **GOD-004** | P0 | divine | **verified** | FORGE-27 | — | God view: inspect life, building, village, memories and intent |
| **GOD-006** | P0 | divine | **blocked** | FORGE-27 | GOD-004, GOD-001 | Replace direct god power toolbar with indirect consequence-based divine influence |
| **GOV-001** | P0 | governance | **verified** | ARCHIVIST | — | Repository task registry, bot lifecycle, automation and handoff |
| **GOV-002** | P0 | governance | **verified** | ORBIT-01 | — | ♾️ Continuous bot work-loop prompt, lifecycle automation and safe handoffs |
| **GOV-003** | P0 | governance | **verified** | RELAY-01 | — | Context-limit retirement and new-chat successor handoff |
| **GOV-004** | P0 | governance | **verified** | DESIGN-28 | — | Author GODSEED V3 divine-view, intelligent lives and kingdoms design bible |
| **INT-001** | P0 | interiors | **verified** | DOORKEEPER | — | Safe layers, metric grid, doors and interiors technical contract |
| **INT-002** | P0 | interiors | **ready** | — | INT-001 | Enlarge exterior homes and public buildings to 3×3–6×6 cells |
| **INT-003** | P0 | interiors | **in_review** | GDS-KESTREL-1810 | INT-001 | Persist interior IDs, furnishings and entry/return anchors |
| **INT-004** | P0 | interiors | **planned** | — | INT-002, INT-003 | Implement safe, atomic door entry and exit |
| **INT-005** | P0 | interiors | **planned** | — | INT-003, INT-004 | Render indoor pixel rooms, furniture and 3 camera zoom levels |
| **INT-006** | P0 | interiors | **planned** | — | INT-003, SIM-001 | Assign households, beds and private spaces to each citizen |
| **INT-007** | P0 | interiors | **planned** | — | INT-004, INT-006 | Autonomous sleep, food, shelter and social actions indoors |
| **INT-010** | P0 | interiors | **planned** | — | INT-004, INT-005 | Interior transitions: adversarial Android and save regression |
| **SIM-001** | P0 | people | **verified** | LIFE-26 | — | Need profile: hunger, energy, comfort, safety, social, hygiene · [#19](https://github.com/jbob-coder/The-idle-open-world-universe/issues/19) |
| **SIM-002** | P0 | people | **verified** | LIFE-26 | SIM-001 | Utility-based choices with visible why/alternative/consequence · [#19](https://github.com/jbob-coder/The-idle-open-world-universe/issues/19) |
| **SIM-003** | P0 | people | **planned** | — | SIM-001, INT-003 | Homes, household membership, work IDs and inventories · [#19](https://github.com/jbob-coder/The-idle-open-world-universe/issues/19) |
| **SIM-005** | P0 | people | **planned** | — | SIM-001, CIV-001 | Profession schedules and workplace resource delivery · [#19](https://github.com/jbob-coder/The-idle-open-world-universe/issues/19) |
| **SIM-010** | P0 | people | **planned** | — | SIM-002, SIM-005 | Long life-soak regression: agency, finite population and persistence · [#19](https://github.com/jbob-coder/The-idle-open-world-universe/issues/19) |
| **SIM-011** | P0 | people | **in_review** | CORTEX-19 | SIM-001, SIM-002 | Individual intelligence, cognition, learning styles and personality effect on choices |
| **SIM-012** | P0 | people | **planned** | — | SIM-004, SIM-011 | Family inheritance, kinship transmission and intergenerational variation |
| **SIM-013** | P0 | people | **planned** | — | SIM-011, WLD-008 | Low-RAM population simulation LOD and offscreen event aggregation |
| **QA-001** | P0 | qa | **verified** | GDS-KESTREL-1810 | — | Node state-machine regression for life, worlds and migration |
| **QA-002** | P0 | qa | **blocked** | — | QA-001 | Chromium offline Android-layout interaction acceptance |
| **QA-003** | P0 | qa | **verified** | TERRAIN-01 | QA-001 | Gradle host + API29 emulator instrumentation and artifacts |
| **QA-004** | P0 | qa | **blocked** | — | QA-003 | Physical Android 2 GB and 3 GB 20-minute soak · [#13](https://github.com/jbob-coder/The-idle-open-world-universe/issues/13) |
| **QA-006** | P0 | qa | **in_review** | SCOPE-31 | — | V3 cross-system causal acceptance for divine agency, cognition, families, kingdoms and resource efficiency |
| **WLD-001** | P0 | world | **verified** | TERRAIN-01 | — | Seeded world coordinate system and 32×32 chunk generator · [#18](https://github.com/jbob-coder/The-idle-open-world-universe/issues/18) |
| **WLD-002** | P0 | world | **verified** | GDS-KESTREL-1810 | WLD-001 | Sparse modified-terrain deltas and chunk persistence · [#18](https://github.com/jbob-coder/The-idle-open-world-universe/issues/18) |
| **WLD-003** | P0 | world | **in_review** | LIFE-26 | WLD-001, WLD-002 | Chunk-aware camera, fog, terrain renderer and coordinate UI · [#18](https://github.com/jbob-coder/The-idle-open-world-universe/issues/18) |
| **WLD-004** | P0 | world | **ready** | — | WLD-001, WLD-002 | Cross-chunk autonomous navigation and bounded pathfinding · [#18](https://github.com/jbob-coder/The-idle-open-world-universe/issues/18) |
| **WLD-005** | P0 | world | **planned** | — | WLD-002, CIV-001 | Distant independent villages with local resources and population · [#18](https://github.com/jbob-coder/The-idle-open-world-universe/issues/18) |
| **WLD-007** | P0 | world | **in_progress** | FORGE-27 | WLD-001, WLD-002 | Map existing 64×48 version-1 saves into expanded world · [#18](https://github.com/jbob-coder/The-idle-open-world-universe/issues/18) |
| **WLD-008** | P0 | world | **planned** | — | WLD-002, WLD-003 | Bound active chunks, offscreen simulation and memory · [#18](https://github.com/jbob-coder/The-idle-open-world-universe/issues/18) |
| **WLD-010** | P0 | world | **planned** | — | WLD-003, WLD-004, WLD-007, WLD-008 | Four-border open-world acceptance and multi-region save QA · [#18](https://github.com/jbob-coder/The-idle-open-world-universe/issues/18) |
| **ART-001** | P1 | art | **planned** | — | SIM-002 | Animated medieval residents, age stages, work and social emotes |
| **ART-003** | P1 | art | **planned** | — | INT-009, GOD-004 | Responsive world/indoor HUD and accessible mobile controls |
| **ART-005** | P1 | art | **planned** | — | INT-005, ART-002 | Automated visual regressions of rooms, buildings and villagers |
| **ART-006** | P1 | art | **verified** | SPLASH-01 | — | Playable GODSEED medieval pixel-art splash and truthful offline loading state |
| **CIV-003** | P1 | civilization | **planned** | — | CIV-001, WLD-001 | Path streets, roads, fields and districts based on settlement needs |
| **CIV-004** | P1 | civilization | **planned** | — | CIV-002, SIM-005 | Markets, home stores, trade caravans and local shortages |
| **CIV-006** | P1 | civilization | **planned** | — | SIM-002, CIV-001 | Council approvals, autonomy, refusals and architectural remodeling |
| **CIV-007** | P1 | civilization | **planned** | — | INT-004, CIV-002 | Building wear, fires, repairs and shelters during attacks |
| **CIV-008** | P1 | civilization | **planned** | — | CIV-001, INT-008 | Distinct functional medieval public buildings and services |
| **GOD-007** | P1 | divine | **planned** | — | GOD-004, SIM-007 | Visual god narrative dashboard and life-history/century time controls |
| **INT-008** | P1 | interiors | **planned** | — | INT-005, SIM-005 | Workplace interiors: forge, tavern, granary, shrine and hall |
| **INT-009** | P1 | interiors | **planned** | — | INT-005, GOD-004 | God-level house inspector and door/floor UI |
| **SIM-004** | P1 | people | **planned** | — | SIM-003 | Affection, friendship, conflict, families and child growth · [#19](https://github.com/jbob-coder/The-idle-open-world-universe/issues/19) |
| **SIM-006** | P1 | people | **planned** | — | SIM-002, SIM-005 | Education, learned skills and non-combat life progression · [#19](https://github.com/jbob-coder/The-idle-open-world-universe/issues/19) |
| **SIM-007** | P1 | people | **in_progress** | CORTEX-19 | SIM-002 | Personal journals, memories, long goals and moral decisions · [#19](https://github.com/jbob-coder/The-idle-open-world-universe/issues/19) |
| **SIM-008** | P1 | people | **planned** | — | SIM-004, SIM-007 | Generations, inheritance and meaningful mortality · [#19](https://github.com/jbob-coder/The-idle-open-world-universe/issues/19) |
| **SIM-009** | P1 | people | **planned** | — | SIM-002, SIM-004 | Contextual resident social interaction and visible animations · [#19](https://github.com/jbob-coder/The-idle-open-world-universe/issues/19) |
| **QA-005** | P1 | qa | **verified** | LIFE-26 | — | Diagnose and stabilize paused divine FX render timing in Chromium CI |
| **REL-001** | P1 | release | **ready** | — | QA-003 | Stable Android signing identity and save-safe upgrade |
| **REL-003** | P1 | release | **planned** | — | QA-002, QA-003, REL-001 | Integrate stacked PRs, QA gate and tagged Android beta |
| **WLD-006** | P1 | world | **in_review** | TERRAIN-01 | WLD-001 | Streaming biome ecology, climate, water and landmarks · [#18](https://github.com/jbob-coder/The-idle-open-world-universe/issues/18) |
| **WLD-009** | P1 | world | **planned** | — | WLD-003 | God's regional atlas and village discovery UX · [#18](https://github.com/jbob-coder/The-idle-open-world-universe/issues/18) |
| **ART-004** | P2 | art | **planned** | — | WLD-006 | Medieval biome props, weather/time and seasonal differences |
| **GOD-005** | P2 | divine | **planned** | — | GOD-001, QA-004 | Optional advanced offline language understanding feasibility |
| **REL-002** | P2 | release | **planned** | — | WLD-008 | Real optional offline content pack streaming and disk budgets |

## How bots update states

```bash
python tools/godseed_tasks.py validate
python tools/godseed_tasks.py transition INT-001 claimed --expect ready --actor ARCH-01 --branch feat/safe-interiors-contract --note 'Owning the metric / door contract'
python tools/godseed_tasks.py transition INT-001 in_progress --expect claimed --actor ARCH-01 --note 'Reviewing existing simulation and saves'
python tools/godseed_tasks.py transition INT-001 in_review --expect in_progress --actor ARCH-01 --note 'Implementation verified, needs review' --evidence 'PR #NN, commit SHA, CI run URL'
python tools/godseed_tasks.py board --write
```

Commits updating task status belong on the **coordination branch**, not on main. If another bot already claimed the task, do not overwrite it; consult `docs/agents/TASK_WORKFLOW.md`.

## Optional new task after delivery

After your OWN task reaches `in_review`, `verified` or `done` **with evidence**, you may propose **one** necessary follow-up. The new task is never automatically yours. First verify no equivalent ID/scope exists in the registry, open issues or PRs.

```bash
python tools/godseed_tasks.py add --after SIM-001 --actor LIFE-01 --area people --priority P1 --title 'Sim occupational fatigue and recuperation' --acceptance 'Measured exhaustion affects job decisions and preserves version 1 saves in seeded tests.' --depends SIM-001 --reason 'Observed repeated work without adequate rest in the submitted acceptance tests.'
python tools/godseed_tasks.py validate
```

The CLI assigns the next unique ID, checks provenance and exact-title duplicates, and picks `ready` only if prerequisites are verified; otherwise `planned`. It updates `tasks.json` and this generated board together. Commit/push both on the coordination branch. No automatic claiming or implementation of the new task.

## Hardware and release truth

2–3 GB refers to **total physical device RAM**; target app PSS approximately 128–192 MiB with provisional 256 MiB soft limit, unverified. The game remains offline. The previous 1 GB core / up to 5 GB optional content are *disk targets*, not completed content or RAM allocation. Hardware QA = **BLOCKED** until real measurements in issue #13.
