# GODSEED source art — preparation branch

This folder includes **source concept images and starter raster assets** for a future Codex Cloud implementation. They are NOT claimed to be wired into runtime. The renderer currently draws directly with Canvas rectangles.

- `concepts/`: 3 new SVG art briefs showing a high sky POV, zoomed character and divine encounter, plus earlier v0.2 concepts.
- `palettes/medieval-fantasy.json`: original pixel palette with RGB hex values.
- `generated/terrain-starter.png`: 11 semantic terrains, three 16x16 visual variants each, arranged 11 columns by 3 rows. Each cell is a deliberate pixel cluster.
- `generated/actors-starter.png`: 128×96, four actors × four orientations × two frames, each 16×24; nonfinal.
- `generated/fx-starter.png`: 112×16, seven compact 16×16 interface/divine symbols; not finished animations.\n- `generated/props-starter.png`: 128×32, 16 procedural prop tiles (8 motifs × 2 visual variants).
- `asset-manifest.json`: exact dimensions and atlas coordinates. Planned art is labeled `planned`; assets present but not integrated are `starter`.

**Art origin/license:** New vector concept and procedural pixel art produced specifically for this repository handoff; no third-party sprite sheets, fonts or licensed franchise designs included. Treat any future third-party additions as requiring provenance and attribution.

For implementation and realistic performance, prefer a few image resources instead of 100s of separate PNG files. Keep native pixels crisp (`imageSmoothingEnabled=false`), and preserve semantic map IDs in `src/sim.js`.

## Reproducible original art

`node scripts/generate_starter_assets.mjs` recreates all four PNG atlases offline using Node.js without npm packages. `node scripts/validate_asset_manifest.mjs` checks PNG headers, CRC, decoded RGBA lengths, atlas bounds, 11 tile IDs, 25-task ledger and all three concept SVG references. CI also checks that regeneration does not modify committed image files.

No production art is wired into the running game by this preparation branch. Codex Cloud must do integration, comparison screenshots and hardware QA separately.
