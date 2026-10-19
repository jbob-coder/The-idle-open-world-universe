# CIV-001 — Medieval metric blueprints and zoning

**Status:** Implemented standalone, opt-in planning library. **Not yet active in gameplay**: current NPC construction still uses legacy 2×2 buildings. No edits to the simulator, Android host, v1 saves, chapters, economy or main branch.

**Implementation:** src/civilization/blueprints.js (UMD/CommonJS); **tests:** tests/civilization_blueprints.test.js. The normative metric and safe-door contract is docs/agents/SAFE_INTERIOR_ARCHITECTURE.md from INT-001.

## Catalog and units

The outside simulation grid uses 2 × 2 meters per cell (4 m²). The inside grid uses 1 × 1 meter per cell. A building with w × h outside cells has (2w) × (2h) gross dimensions, 4wh m² gross area, and an inside envelope of 2w × 2h cells. The usable area with 1m perimeter walls is (2w−2)(2h−2) m² before furnishings.

| Blueprint ID | Outside footprint | Gross area | Inside envelope |
|---|---:|---:|---:|
| cottage | 3×3 | 36 m² | 6×6 |
| family_home | 4×4 | 64 m² | 8×8 |
| large_home | 5×4 | 80 m² | 10×8 |
| smithy | 5×5 | 100 m² | 10×10 |
| tavern | 6×5 | 120 m² | 12×10 |
| granary | 5×5 | 100 m² | 10×10 |
| chapel | 6×6 | 144 m² | 12×12 |
| communal_hall | 6×6 | 144 m² | 12×12 |

Each catalog entry provides kind, timber/stone/moss style options, timber/stone material costs, valid grass/meadow construction substrate and a required road-adjacent exterior approach. Costs are informational: stock deduction, worker allocation and construction completion belong to CIV-002.

Every plan selects north/south/east/west orientation. A door occupies one exterior 2m edge cell and two adjacent interior 1m threshold cells, with two safe arrival cells immediately inside the wall. The approach is a separate outdoor walking cell, not a teleport or screen transition.

## Pure API and adapter requirements

Example Node usage:

~~~js
const Plans = require('./src/civilization/blueprints');
const site = Plans.planAt('family_home', 24, 21, {
  buildingId: 'briarford-home-0001', orientation: 'south', style: 'timber'
});
const world = {
  tileAt: (x, y) => actualWorldTileAt(x,y),
  existingBuildings: actualReservations,
  isOccupied: (x,y) => actualOccupiedAt(x,y),
  isProtected: (x,y) => actualHeritageAt(x,y)
};
const result = Plans.validateSite(site,world);
if (result.ok) {
  const proposed = Plans.reserveSite(site,world);
  // proposed.existingBuildings is a NEW array, not a world mutation.
}
~~~

The callbacks above are placeholders: their implementations must read authoritative game state. For the current small world, use an object with width, height, tiles and optional originX/originY instead of a tileAt function. For a future chunk world, tileAt(x,y) supports signed global coordinates without allocating an entire universe.

Validation refuses unsafe footprint terrain (water, road, shrine, ruin, village, camp etc.), overlapping buildings, blocked earlier building approaches, a blocked or dangerous new approach, invalid IDs, malformed footprints and inaccessible roads. Road access means approach-on-road or a road in a single adjacent outside cell; **full graph connectivity is CIV-003**, not silently claimed here. validateSite returns an error reason on ordinary invalid proposals; reserveSite returns a proposed list, not a constructed building.

## Testing, preservation and future work

Run node --test tests/civilization_blueprints.test.js; the seven acceptance tests cover all eight metric blueprints, all four door orientations, safe access, terrain exclusions, reservation collision/door clearance, malformed data, negative global coordinates and a 40-site deterministic reservation loop. Run node --test tests/*.test.js for the repository-wide existing simulator, save and chapter regressions.

This task does not install the module in build.py; no new code path modifies running gameplay and no v1 save migration is performed. Follow-up work: INT-002 visual footprint enlargement, INT-003/004/005 interior persistence/doors/render, CIV-002 autonomous building/stock use, CIV-003 real connected roads, QA-004 physical Android 2GB/3GB profiling (blocked). Neither this module nor CI alone certifies an entire playable open world or physical performance.