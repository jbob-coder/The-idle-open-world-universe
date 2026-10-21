# GODSEED V3 — coordinate-based chunk rendering and adaptive residents

Status: experimental. Based on verified draft PR #72; not merged into main or the production Android app.

## World addressing
- The procedural world is 1,024 × 1,024 cells, signed coordinates `[-512,511]` in both axes.
- A chunk is exactly 16 × 16 cells. The chunk coordinate is `floor(worldCoordinate / 16)`; local position is `worldCoordinate - 16 * chunkCoordinate`. In particular `-1` belongs to chunk `-1`, local `15`, and `0` belongs to chunk `0`, local `0`.
- `World.locate(x,z)` resolves a cell into `{cx, cz, lx, lz, id}` without touching the terrain cache. Out-of-bounds positions resolve to `null`.
- Terrain is generated deterministically from seed + coordinates. Chunk creation is lazy, with a strict 48-chunk LRU cap; chunk eviction never deletes harvested trees, berry patches, people, buildings or NPC decisions.
- `world.windowAt` groups the visible rows into chunk spans. On a 65 × 65 viewport it performs roughly hundreds of chunk lookups rather than 4,225 separate cache lookups. Output remains z-major world coordinates, and returns fresh decorated tiles.

## Camera reuse and invalidation
- The camera is quantized to a four-cell grid, independent of the NPC update clock.
- `WorldSim.scene` keeps the last terrain window if the quantized camera coordinates, radius, and resource revision are unchanged. NPCs continue ticking and moving in the snapshot, but terrain does not need to be sampled again.
- Fruit patches regrow relative to their individual harvest timestamp. `world.nextVisualChange(tick)` gives the earliest such change; the camera cache expires at that exact tick. Resource harvest/forage immediately increments the terrain revision and invalidates cached terrain.
- NPC-built roads appear only as presentation overlays. The underlying procedural terrain cache is never mutated.
- Diagnostics: `World.create(seed).metrics()` reports `cachedChunks`, `chunkLimit`, `chunkBuilds`, `chunkHits`, `resourceEdits`, and `revision`; large-world adapter adds `terrainWindowsBuilt` and `terrainWindowsReused`.

## Living NPC feedback (first incremental step)
- Frontier resident decisions retain a bounded `adaptation` ledger for food search, timber, home work, road work and exploration. Successful material work reinforces the attempted action; repeated failures reduce its priority.
- An NPC who repeatedly fails to find resources searches farther: 12, 24, 36, up to 64 cells. Search remains constrained to actual navigable tiles; no supplies are conjured.
- Food shortage and exhaustion retain survival precedence. Individual behavior and feedback are deterministic and saved as part of the NPC mind. Saves created before the optional adaptation field remain valid.
- This does **not** yet create arbitrary dynamic population growth, free-form language intelligence or unlimited land. Homeland NPC templates and some construction blueprints remain fixed.

## Verification
Run `node --test tests/v3_chunk_window.test.js tests/v3_agency.test.js tests/v3_world_npc.test.js` plus the project's offline QA, headless WebGL proof and isolated Android emulator workflow. Confirm exact-commit green status before replacing the prior APK.

Known limits: Rendering still rebuilds GPU vertex arrays on changing scene ticks; this task reduces **terrain sampling** and **chunk cache churn** but does not yet implement resident-level streaming, GPU chunk meshes or LOD.
