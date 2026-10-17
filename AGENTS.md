# GODSEED — instructions for Codex Cloud
Repository authority: this repository. Target handoff branch: `prep/codex-skyworld-v0.5`. Integration base: `feat/skyview-zoom-v0.4`, not main (v0.2, v0.3, v0.4 are stacked experimental PRs).

Read in order: `docs/CODEX_CLOUD_BUILD_PROMPT.md`, `docs/CODEX_HANDOFF.md`, `docs/SKYVIEW_VISION.md`, `docs/PIXEL_WORLD_STYLE_GUIDE.md`, `docs/ARCHITECTURE_CONTRACTS.md`, `docs/DIVINE_INTERACTION_SPEC.md`, `docs/IMPLEMENTATION_SLICES.md`, `docs/TEST_PLAN.md`, `assets/asset-manifest.json`.

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
