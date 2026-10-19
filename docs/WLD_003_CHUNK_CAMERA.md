# WLD-003 — Chunk-aware God-view atlas / visual streaming

**Task:** WLD-003 (P0), owner LIFE-26  
**Dependencies:** WLD-001 and WLD-002 independently verified; this branch is stacked on WLD-002 / PR #31, which is stacked on WLD-001 / PR #23.  
**Status:** runtime implementation submitted for testing; no automatic merge.

## Real behavior

The original playable GODSEED scene and save remain available. Its standard
64x48 world is not silently replaced with incompatible generated terrain.

The optional **Open world atlas** control in the existing 2D world panel
switches to a pixel-square, touch-pannable map of deterministic WLD-001 32x32
chunks via WLD-002's bounded store. It can scroll across any observed positive
or negative border (including 31/32, -1/0 and -32/-33) without loading a full
world array, teleporting Nim, loading screens, menu-selected regions or network
calls. The God can visually inspect terrain, not direct residents through it.

**Camera:** tile-space center (signed integer, bounded +/- 1,000,000),
viewport 32x20 / 24x15 / 16x10 tiles; signed camera origin, constant center
when zoom changes. Touch-drag, arrow-key panning and mobile 44px buttons
navigate freely. The HUD reports center tile, zoom size and actual chunk
coordinate. Canvas pixel dimensions remain exactly 16x16 per world tile,
nearest-neighbor and no smoothing.

**Terrain:** existing local seed-based grass/forest/water/stone/berry/meadow
generator and persistent sparse delta store; the packed offline pixel atlas is
reused when loaded, with a 16px-square fallback when not yet decoded. Terrain
edits in the store appear in the rendered scene. The atlas does not invent
settlement buildings in regions where WLD-007 has not yet imported them.

**Fog:** newly observed terrain is revealed within an eight-tile radius of
the camera; previously observed fog data uses LRU bitsets capped at nine
32x32 chunks. Oldest observations may disappear after extensive travel so
this prototype cannot claim infinite durable explored-map memory. This fog
is a visualization cache; it is not persisted to legacy saves.

**Dirty tiles / budget:** camera-only changes invalidate at most 640 visible
cells (384 / 160 at closer zoom); identical subsequent frames repaint zero
cells; one visible terrain edit repaints one cell. Cached terrain buffers in
WLD-002 are bounded to nine 1024-byte chunks and independently keep
persistent sparse edits. The viewer stores no all-world texture.

## Exact contracts and separation of responsibility

- src/world/chunk_view.js: camera, signed coordinates, zoom, explored-tile
  bitset LRU, dirty viewport comparisons, store access and statistics.
- src/render/chunk_surface.js: integer 16px squares with atlas/fallback art,
  draw only dirty viewport cells.
- src/ui_chunk_atlas.js: opt-in God-view canvas overlay, touch/keyboard controls,
  status, safe read-only inspection, and isolated view Debug API.
- build.py: bundle modules into GODSEED-Play.html for fully offline Android
  WebView. No internet service or remote assets.
- tests/chunk_view.test.js: seven Node checks for 4+ signed borders, zoom,
  caches, sparse persistence, memory caps and unchanged original save.
- tests/chunk_atlas_browser_acceptance.py: offline real Chromium controls,
  mobile canvas sizes, screenshot, mouse-drag, no external requests,
  zero JS exceptions and unchanged version-1 gameplay.

## Explicitly incomplete (not claimed)

This is a **God-observable world atlas and chunk rendering integration**,
not an upgrade of Nim's legacy simulation pathfinder to global coordinates.
Resident cross-chunk autonomous travel belongs to WLD-004. Migration of
64x48 v1 historical map, towns, story and save into the new store belongs to
WLD-007. A persistent infinite explored-fog history, streaming offscreen
population, environmental ecology, global NPC settlements and seamless
interior-world camera transitions are also not yet implemented.

Physical Android 2GB and 3GB RAM, PSS, battery and thermal certification
require QA-004. Node/browsers/Android emulators can prove correctness and
offline packaging but do not certify physical low-memory performance.

## Review conditions

Verify the **exact PR HEAD** with Node, real offline Chromium, Gradle/Android
API29 emulator, screenshot from the actual runtime and save-reload test.
The PR must remain unmerged until independent review and OWNER approval.
Do not mark the entire world system or GODSEED project finished from this
visualization slice.
