# GODSEED — Strict Pixel-Art Visual Acceptance Matrix

**REFERENCE STATUS (2026-10-20):** This is **legacy Canvas 2D asset quality assurance**, not a ban on the future 3D Pixel Squares observer. Do not silently disable 2D validators: replace them only via reviewed migration. [Current product authority and reference corrections](PROJECT_AUTHORITY_AND_REFERENCE_STATUS.md).

**QA scope (older A–E/W asset pipeline):** five groups of visual evidence, all in-game screenshots and automated checks. Reference concepts and PNG atlases are **not** themselves evidence of a completed renderer. Use `config/pixel-art-contract.json` and `docs/PIXEL_WORLD_STYLE_GUIDE.md` as authority. This is an implementation review **checklist**, not 30 new tasks: it maps to existing A–E and W tasks (45 total across F/W/A–E/S as of this handoff).

## Per-artifact gates (all statuses currently TODO for integration)

| Target | Acceptance: crisp square pixels | Existing task linkage |
| --- | --- | --- |
| Base grass/meadow/forest | Native 16×16 raster and ≥3 coherent variants; forest no complete Nim occlusion | B01, B03, C05 |
| Water + roads | Pixel-sharp edge masks, 4-neighbor joins and true walkability | B02, W03 |
| Rock + berry | Angular ledges and bright berry distinction; gathering visibly consistent | B01, W05 |
| Village/camp | 16px modular timber/roof/tent visual, clear door, no fake new collision cells | B04, W04 |
| Ruin + shrine | Broken arch vs cyan rune monolith visually distinct; finite sim reward | B04, W06 |
| Nim | 16×24, feet at (8,23), readable at all zooms; four directions, 2–4 walking poses | C01, C04 |
| Ira/Toren/Mera | Visually distinct profession props + HUD inspect label | C02, D03 |
| Wolf + boar | Sprite readable as simulated enemy, clear safe-vs-danger feedback | C03 |
| God powers (7 symbols) | Each 16×16 crisp icon + text; correct Faith cost and target validity | D01–D05 |
| 8 named world areas | Distinct terrain clusters without importing 3D/painted textures; related gameplay works | W01–W10 |
| Android landscape UI | Hard 1–2px pixel borders, non-glossy, 10 reachable controls, correct pointer targeting | A04, A05, E01 |
| Performance | Bounded assets/cache, no blur/filters/hidden downloads; measured 2–3GB-device behavior | B05, E04, S05 |

## Screenshots required for review

- Default sky 32×20 at **640×360, 720×400, 960×540**.
- Close 24×15 at the same three sizes.
- Inspect 16×10 at the same three sizes.
- Crop ×4 using **nearest-neighbor** magnification to show pixel edges (optional extra evidence, not a substitute for original screenshot).
- At least one forest occlusion test, one busy village, one ruin/shrine, one NPC profession close-up, and successful/invalid divine targeting.
- Caption every visual with **source: running Chromium / running Android physical device / reference concept**. Do not label concept SVG as game evidence.

## Automated pass/fail rules

`node scripts/validate_pixel_art_contract.mjs` shall enforce existing **source** contract and starter raster constraints: map IDs preserved, exact palette colors (for nontransparent PNG pixels), binary alpha, atlas region sizes, no overlarge atlas textures, native sizes and CSS Canvas nearest-neighbor directives. **This can pass while art remains only prepared, not integrated.**

Later Codex must add runtime screenshot comparisons and scene tests for per-layer sorting, road connectivity, selected NPC and invalid god target. Automated code checks do not substitute artistic readability or physical device measurements.

## Art rejection examples

- "More detail" accomplished by scaling a high-resolution matte painting under Nim.
- Bilinear resampling makes grass and character pixels fuzzy.
- Forest canopies hide the actor/interactive location completely.
- 32×20 sky view replaced by slanted isometric scenery.
- Tile art suggests a bridge but simulation blocks WATER.
- Tiny 6px toolbar buttons with high-resolution emoji replacing pixel icons.
- Power animation debits 5 Faith for every drawn frame.
- "All eight regions implemented" means only eight names in a JSON file.
- A huge optional storage content pack gets eagerly decoded into 2GB phone RAM.

## Sign-off criteria

Require a source commit, updated original manifest, checks that pass, 9 baseline viewport/zoom screenshots, an accessible control demo, autonomous AI regression, correct save load, an honest APK/device status, and no unlicensed art. The authoritative QA ledger remains `work-items/codex-tasks.json` and `work-items/world-foundation-tasks.json`; do not report this matrix as additional completed gameplay work.
