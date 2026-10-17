# Work items

The machine-readable `codex-tasks.json` contains **25 original implementation tasks** in five groups A–E, all initially `todo`. An additional `storage-tasks.json` contains **five S01–S05 tasks** (30 total) for the user-specified 1 GB core content target + up to 5 GB extra optional Android storage, NOT RAM. See `docs/STORAGE_BUDGET_AND_PACKS.md` and `config/storage-budget.json`. The app does not yet enforce this policy. This preparation branch does not yet implement the new atlas renderer. Codex changes task state to `doing`, `done` or `blocked` **only with test evidence and changes committed**. Read `docs/IMPLEMENTATION_SLICES.md`, `docs/TEST_PLAN.md` and `docs/CODEX_RUNBOOK.md`.

## New gameplay/world items (2026-10-17)

`world-foundation-tasks.json` contains **15 TODO tasks** across F01–F05 (minimum playable game systems) and W01–W10 (world area identities, topology, resources, sites, discovery and QA). Current total: **25 A–E + 5 S + 15 F/W = 45** planned tasks. Read `docs/GAMEPLAY_FOUNDATION.md`, `docs/WORLD_REGION_BLUEPRINT.md`, and `docs/WORLD_PLAYTEST_MATRIX.md` before marking any as done. The 8 region entries in `data/world-regions.v1.json` are not implemented terrain or AI behavior.
