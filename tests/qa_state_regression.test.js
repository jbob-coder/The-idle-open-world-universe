'use strict';

// QA-001: deterministic state and save regressions for the currently finite v1 world.
// These tests intentionally exercise the real simulation module, not a mock.
// They do NOT imply chunk streaming, interior gameplay, or physical Android QA.
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/sim.js');

function advance(world, steps) {
  for (let n = 0; n < steps; n++) S.tick(world);
  return world;
}

test('QA-001: same version-1 snapshot produces identical resumed autonomous timelines', () => {
  for (const seed of [17, 41, 2026]) {
    const initial = advance(S.create(seed), 288);
    const snapshot = S.serialize(initial);
    const a = S.restore(snapshot);
    const b = S.restore(snapshot);
    assert.ok(a && b, 'seed ' + seed + ' failed to restore');
    assert.equal(a.version, 1);
    assert.equal(a.tick, initial.tick);
    for (let step = 1; step <= 360; step++) {
      S.tick(a);
      S.tick(b);
      if (step % 24 === 0) {
        assert.ok(S.validate(a), 'seed ' + seed + ' invalid at ' + step);
        assert.equal(S.serialize(a), S.serialize(b),
          'seed ' + seed + ' diverged after identical reloads at ' + step);
      }
    }
    assert.ok(a.bot.steps > 0, 'Nim must continue acting autonomously');
    assert.ok(S.serialize(a).length < 100000, 'v1 save must remain bounded');
    assert.equal(S.serialize(initial), snapshot, 'advancing restored copies must not mutate source');
  }
});

test('QA-001: pre-living version-1 save upgrades without replacing map or earned progress', () => {
  const original = advance(S.create(41), 240);
  original.bot.food = 7;
  const old = JSON.parse(S.serialize(original));
  const tiles = old.map.slice();
  const prior = {
    tick: old.tick, seed: old.seed, xp: old.bot.xp, steps: old.bot.steps,
    food: old.bot.food, level: old.bot.level, x: old.bot.x, y: old.bot.y
  };
  delete old.worldSeed;
  delete old.regions;
  delete old.npcs;
  delete old.living;
  delete old.chapter;
  delete old.chapterTwo;
  delete old.finale;
  delete old.bot.life;
  const before = JSON.stringify(old);
  const recovered = S.restore(old);
  assert.ok(recovered, 'the legacy world must remain loadable');
  assert.equal(JSON.stringify(old), before, 'restoration must not mutate imported JSON');
  assert.equal(recovered.version, 1, 'save schema remains version 1');
  assert.deepEqual(recovered.map, tiles, 'do not regenerate or erase old terrain');
  assert.equal(recovered.worldSeed, prior.seed);
  for (const [key, value] of Object.entries(prior)) {
    const actual = ['tick', 'seed'].includes(key) ? recovered[key] : recovered.bot[key];
    assert.equal(actual, value, 'lost legacy progress: ' + key);
  }
  assert.equal(recovered.npcs.length, 3);
  assert.equal(recovered.living.citizens.length, 4);
  assert.equal(recovered.living.towns.length, 2);
  assert.ok(S.validate(recovered));
  advance(recovered, 120);
  assert.ok(S.validate(recovered), 'migrated world must continue operating');
  assert.ok(S.restore(S.serialize(recovered)), 'migrated world must save again');
});

test('QA-001: bad primary state is rejected rather than repaired into an unrelated world', () => {
  const baseline = S.serialize(S.create(73));
  const corruptions = [
    data => { data.version = 2; },
    data => { data.map.pop(); },
    data => { data.map[0] = -7; },
    data => { data.seen[10] = 2; },
    data => { data.bot.x = -1; },
    data => { data.bot.hp = 'healthy'; },
    data => { data.faith = 51; },
    data => { data.enemies = [{ id: 1, x: -1, y: 3, hp: 1, attack: 1, defense: 0, cooldown: 0 }]; }
  ];
  for (const corrupt of corruptions) {
    const data = JSON.parse(baseline);
    corrupt(data);
    const input = JSON.stringify(data);
    assert.equal(S.restore(input), null, 'invalid primary state must fail closed');
    assert.equal(JSON.stringify(data), input, 'invalid save inspection must be side-effect free');
  }
  assert.ok(S.restore(baseline), 'the valid baseline must still load');
});

test('QA-001: two restored worlds do not share mutable history, terrain or citizens', () => {
  const snapshot = S.serialize(advance(S.create(13), 120));
  const a = S.restore(snapshot);
  const b = S.restore(snapshot);
  assert.ok(a && b);
  a.map[0] = a.map[0] === S.T.GRASS ? S.T.STONE : S.T.GRASS;
  a.bot.memory.push('only in first world');
  a.living.citizens[0].skill += 1;
  assert.notDeepEqual(a.map, b.map);
  assert.ok(!b.bot.memory.includes('only in first world'));
  assert.notEqual(a.living.citizens[0].skill, b.living.citizens[0].skill);
  assert.equal(S.serialize(b), S.serialize(S.restore(snapshot)),
    'independent restore must not retain edits from another session');
});

test('QA-001: divine suggestion persists as one consideration, not a forced action', () => {
  const s = S.create(41);
  const buildings = s.living.towns.map(t => t.buildings.length);
  const steps = s.bot.steps;
  const response = S.whisper(s, 'Cultiven más comida');
  assert.equal(response.ok, true);
  assert.equal(response.entry.intent, 'food');
  assert.equal(response.entry.decisions.length, 2);
  assert.deepEqual(s.living.towns.map(t => t.buildings.length), buildings,
    'sending an intention may not immediately build infrastructure');
  assert.equal(s.bot.steps, steps, 'god cannot force Nim to move');
  const loaded = S.restore(S.serialize(s));
  assert.ok(loaded);
  assert.equal(loaded.living.whispers.length, 1);
  assert.equal(loaded.living.whispers[0].id, response.entry.id);
  assert.equal(loaded.living.nextWhisper, response.entry.id + 1);
  const before = S.serialize(loaded);
  assert.equal(S.whisper(loaded, 'Build houses').ok, false,
    'reloading cannot bypass the whisper cooldown');
  assert.equal(S.serialize(loaded), before, 'rejected message cannot mutate saved state');
  advance(loaded, 96);
  assert.ok(S.validate(loaded));
  assert.equal(loaded.living.whispers.length, 1,
    'time passing cannot silently duplicate a divine message');
});

test('QA-001: town state remains bounded through autonomous ticks and v1 reload', () => {
  for (const seed of [5, 99]) {
    const state = advance(S.create(seed), 1440);
    assert.ok(S.validate(state));
    assert.equal(state.living.citizens.length, 4);
    assert.ok(state.living.citizens.some(c => c.actions > 0),
      'citizens must do work rather than existing solely as sprites');
    assert.ok(state.living.towns.every(t => t.buildings.length <= 12));
    const saved = S.serialize(state);
    assert.ok(saved.length < 100000);
    const restored = S.restore(saved);
    assert.ok(restored);
    assert.deepEqual(
      restored.living.towns.map(t => t.buildings.map(b => [b.id, b.x, b.y, b.w, b.h])),
      state.living.towns.map(t => t.buildings.map(b => [b.id, b.x, b.y, b.w, b.h])),
      'installed buildings and footprint dimensions must survive reload'
    );
    assert.equal(restored.bot.steps, state.bot.steps);
    assert.ok(S.validate(restored));
  }
});
