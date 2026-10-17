# GODSEED source art — preparation branch

This folder includes **source concept images and starter raster assets** for a future Codex Cloud implementation. They are NOT claimed to be wired into runtime. The renderer currently draws directly with Canvas rectangles.

- `concepts/`: 3 new SVG art briefs showing a high sky POV, zoomed character and divine encounter, plus earlier v0.2 concepts.
- `palettes/medieval-fantasy.json`: original pixel palette with RGB hex values.
- `generated/terrain-starter.png`: 11 semantic terrains, three 16x16 visual variants each, arranged 11 columns by 3 rows. Each cell is a deliberate pixel cluster.
- `generated/actors-starter.png`: Nim and three medieval NPC roles with simple 16x24 frames, nonfinal.
- `generated/fx-starter.png`: compact god effect symbols. This is a starter reference atlas, not a finished animation.
- `asset-manifest.json`: exact dimensions and atlas coordinates. Planned art is labeled `planned`; assets present but not integrated are `starter`.

**Art origin/license:** New vector concept and procedural pixel art produced specifically for this repository handoff; no third-party sprite sheets, fonts or licensed franchise designs included. Treat any future third-party additions as requiring provenance and attribution.

For implementation and realistic performance, prefer a few image resources instead of 100s of separate PNG files. Keep native pixels crisp (`imageSmoothingEnabled=false`), and preserve semantic map IDs in `src/sim.js`.
