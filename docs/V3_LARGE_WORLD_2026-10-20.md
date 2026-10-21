# GODSEED V3 — large world implementation

CURRENT_OBJECTIVE: Expand the current 3D game into a large world with actual autonomous activity outside the founding settlement.

Owner request, October 20, 2026: “Godseed on github, works on the world so that its big. Create a code for the game you task is to advance the game development not to check if it works … focus only on creating”. This implementation follows that creation-focused scope. No gameplay tests, browser acceptance, emulator runs, or physical-device benchmarks were executed for this change.

Source base: `feat/godseed-v3-crafting-settlement-leader-20261020` at `75bcf267891eb1d84d7e2797b3a67aa46f0570e9` (the settlement/council/two-community line, PR #57). Working branch: `feat/godseed-v3-large-world-20261020`. The separate Aria diurnal integration is not incorporated here.

## What the code adds

- A finite **1,024 × 1,024 tile world**, coordinates **−512 through 511** on both axes. That is **1,048,576 tiles**, compared with the previous 400-tile local prototype, or **2,621.44 times its area**. A tile has no newly assigned real-world meter scale.
- **256 regions** of 64 × 64 tiles, with meadow, forest, marsh, desert, highland, taiga, and water palettes. Seeded elevation, lake basins, winding rivers, terrace geometry, stone outcrops, ancient roads, and bridges.
- **255 procedural landmarks** (one in every region except the original homeland): ruins, standing stones, springs, and old watchtowers. These are geography, not invented inhabited settlements.
- **16 × 16 chunks**, an LRU terrain cache capped at **48 chunks / 12,288 generated terrain records**, and a camera window capped at **65 × 65 terrain tiles**. Rendering uses nearby geometry, simpler distant trees, cached WebGL vertex uploads, and edge fog. These are source-level budgets, not measured memory/FPS results.
- A god atlas, drag-to-pan, optional orbit, arrow-key camera movement, return-to-village, and explorer follow controls. Atlas observation does not discover places for NPCs, advance time, or generate populations.
- An autonomous traveler, **Taren**, appears after the homeland has a workshop and reaches 600 ticks. He gathers real local berries, carries rations, rests, follows connected roads, records landmark arrivals, and spends **four gathered wood per camp**. His sequential route covers 224 adjoining regions in the interior 15 × 15 region square. Up to 56 route camps are built, one after every four discoveries, starting with the first. The outermost northern/western region strip remains available to camera exploration but is outside this first expedition itinerary.
- The original Aria/Bran/Elen settlement keeps running on the same clock while the camera is elsewhere. Its local 20 × 20 simulation remains authoritative in the home clearing. The traveler's food and wood are separate; he does not remotely consume village stores.

## Open the feature

Build the single-file game with `python build_v3.py`, open `GODSEED-V3-Play.html`, and select **Gran mundo**. A hosted/file URL can also select `?mode=world`; add `&renderer=2d` for the existing projected Canvas fallback. The no-query entry point retains the original solo mode.

In the large world, drag moves the camera. **Cámara: girar** changes the drag gesture to orbit; Shift-drag also orbits on desktop. **Atlas** selects a distant camera position. **Seguir explorador** follows Aria until Taren arrives, then follows Taren. These controls never command NPC movement. **Aldea local** and **Modo Aria sola** return to the separate original modes.

## Save ownership and generation contract

| Owner | Durable data | Storage key |
|---|---|---|
| Existing solo simulation | Original Aria state | `godseed-v3-prototype-v1` |
| Existing local society | Original settlement/council/frontier state | `godseed-v3-society-v1` |
| Large world | Independent homeland copy, terrain edits, traveler, camps, discoveries | `godseed-v3-large-world-v1` |

The first large-world load copies an existing valid local society save if one exists. It never modifies the source society save. Subsequent changes remain in the large-world slot; switching modes does not synchronize the two simulations. If no local society save exists, the new large world starts from seed 14 through the normal new-world flow.

The generated landscape is derived only from the seed, signed global coordinates, and generator version 1. Chunks are transient. Harvested trees persist as removed coordinates, so moving the camera or evicting a chunk does not restore timber. Berry patches store remaining fruit and a simulation-tick timestamp; regrowth is calculated from elapsed **game ticks**, not wall clock or render calls. Fully regrown patches can be removed from the sparse save. No evolution occurs while the game is closed.

Wilderness resource records are capped at 8,192. The serialized world has a 1,500,000-character ceiling. Restore validates the generator version, seed match, original homeland through its existing validator, resource positions, expedition balances, camp costs, chronological discoveries, itinerary anchors, actor bounds, and event bounds. Generator changes must explicitly migrate or bump the version; silently changing version-1 terrain rules would move resources under old saves.

## Continuity graph

| Source node | Relationship | Target node |
|---|---|---|
| Owner request 2026-10-20 | requires | Large autonomous 3D world |
| `src/v3/world.js` | generates | Seeded terrain, roads, regional landmarks, sparse ecology |
| `src/v3/world_travel.js` | provides | Bounded local BFS and connected road itinerary |
| `src/v3/expedition.js` | implements | Traveler survival, discoveries, material-funded camps |
| `src/v3/world_sim.js` | composes | Existing homeland and wilderness on one clock |
| `src/v3/view.js` | renders | Nearby WebGL geometry and world camera |
| `src/v3/fallback.js` | renders | Nearby projected Canvas world |
| `src/v3/atlas.js` | displays | Terrain overview and actual exploration progress |
| `src/v3/app.js` | connects | Mode selection, observer controls, isolated saves |
| `v3/index.template.html` + `build_v3.py` | produce | Offline `GODSEED-V3-Play.html` |

COMPLETED: Source implementation, user-facing entry point, offline bundler integration, and repository continuity record.

VERIFICATION_STATUS: **Gameplay/runtime NOT_RUN**, at the owner's request. Packaging with `build_v3.py` only assembles the HTML; it is not game verification. No screenshot, test pass, CI result, APK, measured performance, or release certification is claimed by this document.

LIMITS: One additional explorer, a fixed route, no new simulated families or camp populations, no inter-region trade or military simulation, no erosion/hydrology simulation, no new engine or dependencies. Existing homeland residents still use their original local movement rules. Wilderness traversal blocks water and rock, but does not yet model slope-dependent movement. Atlas region visibility is god observation, not NPC knowledge.

NEXT_ACTION: Extend camps into independently inhabited settlements with real migration, regional depots, and supply routes; retain the separate resource ledgers. When validation is requested, exercise chunk seam identity (including negative coordinates), eviction/resource persistence, large-world save/reload, expedition survival/camp accounting, atlas navigation in both renderers, and the existing solo/society modes. Then profile actual Android memory/frame time before increasing chunk/actor budgets.

Implementation references consulted: [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices), particularly batching and back-buffer budgets; [MDN Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) for the existing touch/mouse input path. The project uses its own generator and simulation; no external runtime content is fetched.
