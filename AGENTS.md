# GODSEED — instructions for Codex Cloud
Repository authority: this repository. Target handoff branch: `prep/codex-skyworld-v0.5`. Integration base: `feat/skyview-zoom-v0.4`, not main (v0.2, v0.3, v0.4 are stacked experimental PRs).

Storage scope: **1 GB core target + up to 5 GB optional app-managed persistent storage**, nominal 6 GB total, NOT RAM. This is a future requirement, not current APK footprint. Optional storage is opt-in, never auto-preallocated. Read `docs/STORAGE_BUDGET_AND_PACKS.md`, `config/storage-budget.json` and `work-items/storage-tasks.json` (5 S01–S05 tasks; 45 total with foundation/world). Keep core offline and protect user saves.

RAM target: **devices with 2–3 GB TOTAL physical RAM**; app should aim for **128–192 MiB resident**, provisional 256 MiB soft ceiling. These are **unverified engineering goals**, not 2–3 GB memory allocated to the game. Do not load 1–6 GB on-disk content into RAM. Read `docs/LOW_RAM_HARDWARE_TARGET.md` and `config/hardware-budget.json`; add physical-memory QA evidence to E04 and S05.

World planning authority (new): `docs/GAMEPLAY_FOUNDATION.md`, `docs/WORLD_REGION_BLUEPRINT.md`, `docs/WORLD_SYSTEM_CONTRACTS.md`, `docs/WORLD_PLAYTEST_MATRIX.md`, `data/world-regions.v1.json`, and `work-items/world-foundation-tasks.json`. **Eight named regions are implemented on the feature branch; see task ledgers and docs/IMPLEMENTATION_EVIDENCE.md.** Work F01–F05 for base game reliability first, then W01–W10 to add regions. These 15 tasks add to 25 original + 5 storage = **45 total tasks**. Keep world 64×48 and tile IDs 0–10 stable; avoid modifying saves by changing region art.

**HARD PIXEL-ART GATE** (owner instruction): GODSEED's entire world, props, actors, creatures, gods' powers **and Android HUD** must remain crisp native **square pixels**, not smooth/painted/vector or pseudo-3D visuals. Terrain is 16×16, main actor frames 16×24, nearest-neighbor scaling, 32×20 high-sky intended default. Use `docs/PIXEL_WORLD_STYLE_GUIDE.md`, `config/pixel-art-contract.json`, `docs/PIXEL_ART_ACCEPTANCE.md` and `node scripts/validate_pixel_art_contract.mjs`. No game feature is done if its visual output is blurry, and prepared art is not proof of renderer integration. Keep original 45 tasks; this is a binding acceptance standard, not a new task batch.

**NON-NEGOTIABLE SQUARE-PIXEL REVIEW GATE:** Read `docs/PIXEL_WORLD_STYLE_GUIDE.md`, `config/pixel-art-contract.json`, and `docs/PIXEL_ART_ACCEPTANCE.md`. Art must remain real 2D 16×16 terrain pixel tiles, 16×24 actors, binary-alpha palette-limited original PNGs, Canvas imageSmoothing disabled, crisp nearest-neighbor zoom, pixel-edged medieval buildings, creatures and divine FX, plus a pixel-art styled Android HUD. Reject blended textures, vector-like actors, high-resolution painted terrain, gradient FX and 3D/isometric perspectives. Before *any* A/B/C/D/E or W visual task becomes DONE run `node scripts/validate_pixel_art_contract.mjs` and review actual running-game screenshots at all 3 zooms. The PNG atlases are integrated on the feature branch; preserve the renderer and screenshot evidence.

Read in order: `docs/CODEX_CLOUD_READY_PROMPT.md`, `docs/HANDOFF_READINESS.md`, `docs/GODSEED_INTENDED_GAME.md`, `docs/ANDROID_HTML_APK_SPEC.md`, `docs/CODEX_CLOUD_BUILD_PROMPT.md`, `docs/CODEX_HANDOFF.md`, `docs/SKYVIEW_VISION.md`, `docs/PIXEL_WORLD_STYLE_GUIDE.md`, `docs/ARCHITECTURE_CONTRACTS.md`, `docs/DIVINE_INTERACTION_SPEC.md`, `docs/IMPLEMENTATION_SLICES.md`, `docs/TEST_PLAN.md`, `assets/asset-manifest.json`.

Constraints:
- Keep Nim an autonomous rule-driven inhabitant. The god changes circumstances; no joystick, forced attack, direct control or cloud LLM.
- Keep the game fully offline with tiny memory/CPU cost for older Android. Canvas2D only; no Unity/Three.js/external JS CDN.
- Maintain existing save identity `godseed-one-small-life-v1`, simulation `version:1`, tile IDs 0–10 and `src/sim.js` API unless safe migrations and tests are provided.
- Higher/overhead POV with individually visible PIXEL SQUARES; no smoothing, isometric, fake 3D, painting over the entire map, or photo-texture assets.
- Aim for landscape 640x360, 720x400, 960x540 including device safe areas. Dynamic viewport transforms must be used for click/touch targeting and minimap.
- Keep generated binary assets reproducible from committed source. Check origins/licensing in `assets/README.md`. Reference artwork is not playable proof.
- Run Node tests; build offline HTML; run Playwright viewport smoke when available; structurally validate/sign debug APK. Do not claim Android physical-device QA without real evidence.
- Finish one slice at a time, never report a planned item as implemented. Use a dedicated implementation branch; include screenshots, test results and migration notes in each PR.
- `src/sim.js` owns game mechanics. `src/ui.js` currently owns rendering and interactions; extract modules carefully to preserve `build.py` script-injection contract and older WebView support. Read existing tests FIRST.

Do not merge stacked branches into `main` without owner approval; no secrets, signing keys or keystores committed.
