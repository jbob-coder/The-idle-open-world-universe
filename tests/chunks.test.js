const test = require("node:test");
const assert = require("node:assert/strict");
const Chunks = require("../src/world/chunks");
const Sim = require("../src/sim");

test("world coordinates round-trip across positive and negative chunk edges", () => {
  for (const [x, y] of [
    [0, 0], [31, 31], [32, 32], [-1, -1], [-32, -32],
    [-33, 63], [1025, -1001], [1000001, -1000001]
  ]) {
    const position = Chunks.worldToChunk(x, y);
    assert.equal(position.localX >= 0 && position.localX < 32, true);
    assert.equal(position.localY >= 0 && position.localY < 32, true);
    assert.deepEqual(
      Chunks.chunkToWorld(position.chunkX, position.chunkY, position.localX, position.localY),
      { x, y }
    );
    assert.equal(position.index, position.localY * 32 + position.localX);
  }
  assert.deepEqual(Chunks.worldToChunk(-1, -33), {
    chunkX: -1, chunkY: -2, localX: 31, localY: 31, index: 1023
  });
});

test("seeded chunks are stable and independent of generation order", () => {
  for (const seed of [0, 1, 42, 2026, 0xffffffff]) {
    const initial = Chunks.generateChunk(seed, -2, 3);
    Chunks.generateChunk(seed, 1000, -1000);
    Chunks.generateChunk(seed, 0, 0);
    assert.deepEqual(Chunks.generateChunk(seed, -2, 3), initial);
    assert.equal(initial.tiles.length, 1024);
    assert.ok(initial.tiles instanceof Uint8Array);
    assert.ok(initial.tiles.every(tile => Object.values(Chunks.T).includes(tile)));
  }
  assert.notDeepEqual(
    Chunks.generateChunk(10, 1, 1).tiles,
    Chunks.generateChunk(11, 1, 1).tiles
  );
});

test("each chunk cell matches absolute tile sampling even across seams", () => {
  for (const seed of [1, 987654321]) {
    for (const [cx, cy] of [[-2, -2], [-1, 0], [0, 0], [0, -1], [1, 1], [47, -63]]) {
      const chunk = Chunks.generateChunk(seed, cx, cy);
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const world = Chunks.chunkToWorld(cx, cy, x, y);
          assert.equal(chunk.tiles[y * 32 + x], Chunks.tileAt(seed, world.x, world.y));
        }
      }
    }
    for (const x of [-33, -32, -1, 0, 31, 32, 1024]) {
      const a = Chunks.worldToChunk(x, 31);
      const b = Chunks.worldToChunk(x, 32);
      assert.equal(
        Chunks.generateChunk(seed, a.chunkX, a.chunkY).tiles[a.index],
        Chunks.tileAt(seed, x, 31)
      );
      assert.equal(
        Chunks.generateChunk(seed, b.chunkX, b.chunkY).tiles[b.index],
        Chunks.tileAt(seed, x, 32)
      );
    }
  }
});

test("generation uses one fixed-size buffer, with no global world allocation or shared mutation", () => {
  const a = Chunks.generateChunk(3, -1000, 1000);
  const b = Chunks.generateChunk(3, -1000, 1000);
  assert.equal(a.tiles.byteLength, 1024);
  assert.notEqual(a.tiles.buffer, b.tiles.buffer);
  const original = b.tiles[0];
  a.tiles[0] = 255;
  assert.equal(b.tiles[0], original);
  assert.equal(Chunks.tileAt(3, -32000, 32000), original);
  assert.equal(Object.hasOwn(Chunks, "cache"), false);
});

test("unsafe and noninteger locations fail instead of silently aliasing tiles", () => {
  assert.throws(() => Chunks.tileAt(1, 2.5, 0), RangeError);
  assert.throws(() => Chunks.tileAt(-1, 0, 0), RangeError);
  assert.throws(() => Chunks.tileAt(0x100000000, 0, 0), RangeError);
  assert.throws(() => Chunks.generateChunk(1, Number.MAX_SAFE_INTEGER, 0), RangeError);
  assert.throws(() => Chunks.chunkToWorld(1, 1, 32, 0), RangeError);
});

test("legacy v1 saves still restore unchanged while new chunk API remains opt-in", () => {
  const old = Sim.create(41);
  const snapshot = Sim.serialize(old);
  const restored = Sim.restore(snapshot);
  assert.deepEqual(restored.map, old.map);
  assert.equal(restored.version, 1);
  const chunk = Chunks.generateChunk(old.worldSeed, 0, 0);
  assert.equal(chunk.tiles.length, 1024);
  assert.equal(Sim.serialize(old), snapshot);
});
