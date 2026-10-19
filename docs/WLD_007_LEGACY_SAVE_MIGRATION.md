# WLD-007 — Import a version-1 64×48 world into the expanded chunk atlas

**Status:** implemented and tested *opt-in adapter*. This does **not** install the chunk world as the running UI or replace GODSEED's v1 localStorage key. WLD-003/WLD-004/WLD-008/WLD-010 own seamless runtime/camera/AI/low-RAM integration.

## Migration contract

The true historical \`GodseedSim\` 64×48 map occupies **world coordinates 0..63 × 0..47**. It is never regenerated, stretched, shifted or cropped. Its 3,072 tiles include old roads, villages, ruins, shrines, camps and custom terrain that cannot be represented by WLD-001's six procedural biome tile types. A read-only historical overlay takes priority over procedural terrain, even when an individual 32×32 chunk crosses the historical boundary at y=48. Outside the window, WLD-001's deterministic seed and WLD-002's sparse edit/site ledger are authoritative.

\`src/world/legacy_bridge.js\` is a UMD/CommonJS \`GodseedLegacyWorld\` API:

- \`importLegacy(v1Json, {maxActive})\` validates through \`GodseedSim.restore\`/\`validate\`; rejects invalid, corrupt, oversized v1 maps and unknown core version. It holds a private canonical legacy save, a bounded sparse chunk store and an indexed 2×2m legacy town/building site catalog.
- \`tileAt(x,y)\` and \`chunkAt(cx,cy)\` expose an exact, deterministic historical window merged into the newer 32×32 chunks, with signed coordinates and a maximum cache of 16 chunks. \`legacyState()\` returns a defensive native v1 state copy (including Nim, citizens, towns, all three chapters, resources, inventory, technology and event histories).
- \`sitesAt\` and \`site\` expose stable \`legacy:town:<id>\` / \`legacy:building:<id>\` metadata derived from real historical town/building records. Those records are NOT built twice or converted into a new economy. Outside the window, \`putSite\` stores frontier sites with stable IDs.
- \`setTile\` refuses writes inside the historical window until a specifically reviewed bidirectional save adapter exists. Outside, it uses WLD-002's sparse durable edits. Returning chunk buffers, sites or v1 state never grants mutation access to the authoritative historical save.
- \`serialize()\` emits a bounded \`{schemaVersion:1, legacy:<canonical v1 object>, sparse:<WLD-002 snapshot>}\` export. \`restoreExpanded(json)\` restores both independently after validating the seed, actual v1 core and all sparse data. It rejects expanded tile/site overlays *inside* the 64×48 authoritative window to prevent ambiguous writes.
- \`evictAll()\` drops ephemeral chunk cache, not history or modified frontier tiles.

The original Android save **\`godseed-one-small-life-v1\`** and native save format stay unchanged. No destructive auto-conversion, new forced migration or rewriting another bot's \`src/sim.js\`/\`src/ui.js\`. The adapter is embedded read-only as a module in the offline HTML/Android WebView for future explicit integration; the current game continues to run on its legacy state.

## Verification, exclusions and handoff

\`node --test tests/legacy_bridge.test.js\` covers all 3,072 old map tiles, chunk edge overlays, real village/building IDs, Nim/inventory/chapters, frontier modifications and eviction, repeated independent save/restore, mutation isolation, bad v1 imports, tampered sparse seed and attempted duplicate overlays. \`python tests/world_legacy_browser_acceptance.py\` performs the same opt-in migration within offline mobile Chromium 640×360 and captures a screenshot.

Run **full** \`node --test tests/*.test.js\`, existing \`tests/chapter_browser_acceptance.py\`, \`tests/chapter_two_browser_acceptance.py\`, \`tests/chapter_three_browser_acceptance.py\`, lifecycle/backup tests and Gradle/API29 CI at **exact work SHA**. An emulator pass is not proof of 2–3 GB physical-device RAM/thermal stability.

**Not implemented:** bidirectional overlay writes into the original 64×48 native save, procedural NPC navigation outside that map, streamed camera, world LOD, distant economic villages, a migration button or live seamless open-world play. Integration of the other independently developed branches is intentionally deferred. Never mark WLD-010 complete based on this isolated import API.

**Android API29 parser compatibility:** Embedding WLD-002's optional chunk store exposes its source to older Android WebViews. This branch replaces a JavaScript numeric-separator literal (`4_000_000` → `4000000`) without changing the quota value; numeric separators are unsupported in Chrome/WebView ≤74, and a lexical error would prevent the shared inline SIM script from evaluating at all. This is a targeted compatibility hypothesis for the initial 3/6 native startup failure; **only fresh exact-SHA emulator CI can confirm remediation**. The Node test checks the bundled source does not reintroduce this syntax.
