/* GODSEED WLD-001: deterministic, stateless 32x32 world chunks.
 * This foundation does not replace the legacy 64x48 simulation or v1 saves.
 * Global sampling (not per-chunk RNG) keeps the same terrain at any border.
 * CommonJS and browser globals; no network or whole-world allocation.
 */
(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.GodseedChunks = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SIZE = 32;
  const CELLS = SIZE * SIZE;
  // Keep existing GodseedSim.T tile IDs. Historical structures are owned by
  // the legacy map/migration adapter, not spontaneously generated here.
  const T = Object.freeze({
    GRASS: 0, FOREST: 1, WATER: 2, STONE: 3,
    BERRY: 4, MEADOW: 6
  });

  function integer(value, name) {
    if (!Number.isSafeInteger(value)) {
      throw new RangeError(name + " must be a safe integer");
    }
  }
  function seedValue(seed) {
    integer(seed, "seed");
    if (seed < 0 || seed > 0xffffffff) {
      throw new RangeError("seed must be an unsigned 32-bit integer");
    }
    return seed >>> 0;
  }
  function worldToChunk(x, y) {
    integer(x, "x");
    integer(y, "y");
    const chunkX = Math.floor(x / SIZE);
    const chunkY = Math.floor(y / SIZE);
    const localX = x - chunkX * SIZE;
    const localY = y - chunkY * SIZE;
    return { chunkX, chunkY, localX, localY, index: localY * SIZE + localX };
  }
  function chunkToWorld(chunkX, chunkY, localX, localY) {
    integer(chunkX, "chunkX");
    integer(chunkY, "chunkY");
    integer(localX, "localX");
    integer(localY, "localY");
    if (localX < 0 || localX >= SIZE || localY < 0 || localY >= SIZE) {
      throw new RangeError("local coordinates must be in [0, 31]");
    }
    const x = chunkX * SIZE + localX;
    const y = chunkY * SIZE + localY;
    integer(x, "world x");
    integer(y, "world y");
    return { x, y };
  }

  // Integer-mixed positional hash: deterministic for a given seed and world
  // coordinate, independent of traversal order or simulation random state.
  function hash(seed, x, y, salt) {
    let h = (Math.imul(x | 0, 0x1f123bb5) ^
             Math.imul(y | 0, 0x5f356495) ^ seed ^ salt) >>> 0;
    h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
    h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function smooth(t) {
    return t * t * (3 - 2 * t);
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  // Value noise is anchored to WORLD coordinates so chunk seams do not
  // introduce different sampling origins at 31/32 or -1/0.
  function noise(seed, x, y, scale, salt) {
    const gx = Math.floor(x / scale);
    const gy = Math.floor(y / scale);
    const u = smooth(x / scale - gx);
    const v = smooth(y / scale - gy);
    return lerp(
      lerp(hash(seed, gx, gy, salt), hash(seed, gx + 1, gy, salt), u),
      lerp(hash(seed, gx, gy + 1, salt), hash(seed, gx + 1, gy + 1, salt), u),
      v
    );
  }
  function sample(seed, x, y) {
    const elevation = 0.68 * noise(seed, x, y, 24, 0x63a4) +
                      0.32 * noise(seed, x, y, 9, 0x19d1);
    const moisture = noise(seed, x, y, 19, 0x3b22);
    const detail = hash(seed, x, y, 0x7f12);

    if (elevation < 0.29) return T.WATER;
    if (elevation > 0.75) return T.STONE;
    if (moisture > 0.55 && detail < 0.65) return T.FOREST;
    if (moisture > 0.43 && detail < 0.09) return T.BERRY;
    if (moisture < 0.34 || detail > 0.91) return T.MEADOW;
    return T.GRASS;
  }
  function tileAt(seed, x, y) {
    const value = seedValue(seed);
    integer(x, "x");
    integer(y, "y");
    return sample(value, x, y);
  }
  function generateChunk(seed, chunkX, chunkY) {
    const value = seedValue(seed);
    integer(chunkX, "chunkX");
    integer(chunkY, "chunkY");
    // Prevent unsafe coordinate multiplication before allocating anything.
    const origin = chunkToWorld(chunkX, chunkY, 0, 0);
    chunkToWorld(chunkX, chunkY, SIZE - 1, SIZE - 1);
    const tiles = new Uint8Array(CELLS);
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        tiles[y * SIZE + x] = sample(value, origin.x + x, origin.y + y);
      }
    }
    return { chunkX, chunkY, width: SIZE, height: SIZE, tiles };
  }
  return Object.freeze({
    SIZE, CELLS, T, worldToChunk, chunkToWorld, tileAt, generateChunk
  });
});
