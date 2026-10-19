# INT-003 — Durable interior identity, furniture and door anchors

**Status:** an optional version-1 game-state extension, with real serialization and restore integration. NOT a functioning door-entry system, rendered interior or inhabited household.

## Implemented contract

- src/world/interiors.js provides a bounded spatial data model. Each room uses a stable ID of the form interior:<buildingId>. It records buildingId, safeZone, a 1-metre-per-cell grid, template, furniture, revision and four directional door anchors.
- src/sim.js initializes spaces for new worlds and restores this optional state independently of the original version:1 game save. The existing offline save key godseed-one-small-life-v1 and chapter/progression data are preserved.
- build.py includes the same room model before sim.js so CommonJS and Android offline WebView use one implementation.
- The exterior footprint remains 2 metres per tile (4 square metres); the interior is 1 metre per cell. A 4x4 exterior family home maps to an 8x8 interior (64 square metres gross), with boundary walls and a smaller usable floor.
- The four cardinal door directions persist thresholdWorld (exterior door tile), approachWorld (safe return **coordinate**, still requiring INT-004 terrain validation), thresholdInside and safeArrivalInside. Geometric checks reject mismatched anchors. Furniture must not overlap walls, other furniture or the interior arrival cell.

## API

Import GodseedInteriors from src/world/interiors.js.

1. empty(): create a version:1 interior collection.
2. register(spaces, living, buildingId, spec): validate an **existing uniquely identified** settlement building, door anchors and furniture, then atomically create/update one room, returning a defensive copy.
3. find(spaces, id): read a room through a defensive copy.
4. restore(raw, living): sanitize a save's optional room data against its current exterior buildings; preserve valid rooms and drop bad optional rooms without discarding Nim's world.

A room can contain up to 32 furniture entries. At most 24 rooms are stored; exterior footprint must be 2x2 through 6x6 and IDs, revisions and coordinates are validated. Historical 1x1 structures retain their exterior identity but are not assigned a room until a geometrically safe upgrade exists.

The model is not a magic room bigger than the building. Creating or inspecting spatial records does **not** move residents, advance time, generate a second world, or authorize passage. Actual entry, collision, occupancy, furniture use and return to the same physical door belong to INT-004/005/006/007.

## Verifiable acceptance

Run node --test tests/interior_persistence.test.js and node --test tests/*.test.js. The tests cover old saves with absent spaces; persistent multi-building rooms; 4x4-to-8x8 dimensions; all four orientations; invalid arrivals and overlapping beds; malformed optional data recovering without wiping game progress; duplicate building IDs; record limits; deterministic long-running simulation restoration.

GitHub Actions must verify the exact implementation HEAD. Physical 2–3 GB Android performance, memory, 20-minute soak and temperature are NOT VERIFIED here (QA-004). No changes to GODSEED's existing offline user save key, no network access and no claim that playable doors exist.
