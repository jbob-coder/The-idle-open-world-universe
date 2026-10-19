# WLD-002 — Sparse chunk changes and persistent settlement sites

**Status:** API / acceptance slice only. This is not a connected open-world runtime.

## Contract

\`src/world/chunk_store.js\` wraps the verified WLD-001 \`GodseedChunks\` generator in a separate persistent layer. Unmodified terrain is **not serialized**. Each saved entry contains a signed chunk coordinate, changed \`[cellIndex, tileId]\` pairs, and optional stable-ID site records (\`settlement\`, \`building\`, \`road\`, \`landmark\`). The API preserves negative world coordinates, explicit site identity, and regenerated terrain across cache eviction, restore and independent copies.

The cache holds at most 9 chunks by default (configurable 1–16), each 1,024 tile bytes. Modified chunks and sparse edits are kept in a separate bounded ledger and never silently dropped by cache eviction. Limits currently enforced: 256 modified chunks, 256 edited terrain cells and 24 sites per chunk, 4,000,000 JSON characters per snapshot. Operations reject quota violations instead of discarding recorded history. These are **application design limits**, not measured mobile RAM usage.

- \`create(seed,{maxActive})\` opens a per-seed store; \`tileAt(x,y)\`, \`setTile(x,y,id)\` and \`chunkAt(chunkX,chunkY)\` access local terrain.
- \`putSite({id,kind,type,x,y,label,townId})\`, \`site(id)\`, \`sitesAt(chunkX,chunkY)\` and \`removeSite(id)\` persist settlement/building locations.
- \`evictAll()\` releases cached tile buffers only.
- \`serialize()\` writes canonical deterministic JSON; \`restore(json)\` validates a bounded untrusted payload in an isolated new instance.

## Compatibility and intentionally missing functionality

This module is **opt-in**, CommonJS/browser compatible, and is not wired to \`src/sim.js\`, \`src/ui.js\` or the existing v1 save key. It therefore cannot damage the current 64×48 gameplay or legacy world saves; it also **does not yet** provide live traversal, map streaming, citizen navigation, building interiors, climate or cross-world migration. Those require WLD-003/004/007/008 and integration of the persistent store with the authoritative simulation save.

A site is a stable, spatially checked **metadata record**, not a finished economic settlement simulator. Town inventories and character state remain with their future simulation adapter, not invented inside this sparse terrain ledger. Tests cover snapshot rejection, tile reversions, negative boundaries, LRU bounds and eviction/restore.

## Acceptance

\`node --test tests/chunk_store.test.js\`, followed by \`node --test tests/*.test.js\` and the relevant offline CI. CI must be checked against the exact PR SHA. No physical Android 2–3GB soak or PSS/FPS certification is implied.
