# WLD-006 — Deterministic biome, ecology and heritage chunk overlay

**Scope:** opt-in pure WLD-001 extension; not wired into the running 64×48 game or saved data. WLD-001 must load first. It respects the existing tile IDs and uses only bounded per-chunk buffers. It does not claim chunk streaming, camera travel, dynamic river/pathfinding or inhabited chapels are already playable.

Module: src/world/ecology.js. Entry points:

- climateAt(seed,x,y) returns deterministic temperature and moisture, each in [0,1].
- biomeAt(seed,x,y) returns grassland, woodland, wetland, highland, cold upland or watershore IDs. Sampling uses absolute signed world coordinates, never local chunk RNG.
- landmarkAt(seed,x,y) returns a reproducible candidate for a historic **ruin** or **chapel site** (existing shrine semantic tile ID 10). One candidate per global 64×64 area; not every area is suitable. The candidate never means an already built or staffed church. Stable ID, type and location can be re-derived after reload.
- resourceAt(seed,x,y,tick,harvestedAt) returns a deterministic berry source with stable ID, availability and next ready tick. The caller must persist its harvest timestamp; renewable berries regrow exactly after **96 simulation ticks**. This module never collects, duplicates or consumes resources.
- generateEcologyChunk(seed,chunkX,chunkY,options) returns tiles, biomes, resources and landmarks for exactly 32×32 cells. Each tile and biome buffer is an independent 1,024-byte Uint8Array. Remaining arrays are bounded per chunk. No global map allocation or network request.

## Authority order and route safety

The future host should provide callbacks:

~~~js
const Eco = require('./src/world/ecology');
const layer = Eco.generateEcologyChunk(worldSeed, chunkX, chunkY, {
  tick: currentTick,
  savedTileAt: (x,y) => actualSavedDelta(x,y),
  protectedAt: (x,y) => actualHeritageReservation(x,y),
  routeAt: (x,y) => actualRoadNetworkCell(x,y),
  harvestedAt: (x,y) => actualHarvestTimestamp(x,y)
});
~~~

The sample callbacks are adapter placeholders, not existing production APIs. Order: **saved terrain delta → protected cell → declared route → generated heritage/resource → WLD-001 base terrain**. A declared road emits tile ID 8 unless a saved edit/protected cell takes precedence. No newly generated lake, ruin or resource can block a declared road. Water itself is inherited from WLD-001; this slice does not generate additional barriers. Route planning across chunks belongs to WLD-003/004, sparse state persistence to WLD-002 and v1 migration to WLD-007.

## Tests and remaining work

Run node --test tests/ecology.test.js. Seven tests cover climate variation, repeatable 32×32 tile/biome chunks across positive and negative seams, route preservation, saved tile precedence, reproducible ruin and chapel-site IDs, 96-tick berry depletion/regrowth, fixed-size buffers and invalid data rejection. The stacked WLD-001 branch also includes the existing version-1 save regression suite.

Android emulation is not physical 2GB/3GB device certification. NPC pathfinding, world streaming, offscreen simulation, actual populated churches and ancient ruins, and persistent harvest storage remain outside this scope.