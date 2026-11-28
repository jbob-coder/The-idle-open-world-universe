// Independent QA: native SQLite adapter only, synthetic records, never real saves.
// Run: node docs/completion/check_storage_boundary.mjs (Node 22.16+).
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { canonicalWorldJson as canon } from '../../tools/world_persistence_reference.mjs';
import { openSegmentedWorldStore as openStore } from '../../tools/world_journal_segments.mjs';

const dir = mkdtempSync(join(tmpdir(), 'godseed-qa-boundary-'));
const identity = { world_id: 'qa-fixture', seed: 'synthetic-seed' };
const segmentSize = 32;
const initial = { format: 'world-reference-v1', adapter_version: 'qa-fixture', ...identity,
  player_id: 'p1', initial: {world_id: identity.world_id}, revision: 0, journal: [], checkpoint: {marker: 0} };
const next = (raw, tag = '') => {
  const root = JSON.parse(raw), revision = root.revision + 1;
  return {...root, revision, checkpoint: {marker: revision}, journal: [...root.journal,
    {revision, transaction_id: `tx-${revision}${tag}`, command: {kind: 'qa-fixture'}}]};
};
const open = (path, mode = 'open') => openStore(path, {identity, segmentSize, mode});
const advance = (store, count) => {
  for (let i = 0; i < count; i++) {
    const old = store.read(), proposed = canon(next(old));
    assert.equal(store.compareAndSwap(old, proposed), true);
    assert.equal(store.read(), proposed);
  }
};
let passed = 0, failed = 0, serial = 0;
function test(name, run) {
  const path = join(dir, `case-${++serial}.db`), store = open(path, 'create');
  try {
    assert.equal(store.compareAndSwap(null, canon(initial)), true);
    run(store, path);
    passed++;
    console.log('PASS', name);
  } catch (e) {
    failed++;
    console.error('FAIL', name, e);
  } finally { store.close(); }
}
try {
  test('segment boundary and exact normal reopen', (store, path) => {
    advance(store, 33);
    const raw = store.read();
    assert.deepEqual(store.describe(), {revision: 33, segment_size: 32,
      segments: [{index: 0, first_revision: 1, last_revision: 32, sealed: true},
        {index: 1, first_revision: 33, last_revision: 33, sealed: false}], active_commands: 1});
    store.close();
    const reopened = open(path);
    try { assert.equal(reopened.read(), raw); } finally { reopened.close(); }
  });
  test('stale second writer cannot replace a committed record', (store, path) => {
    const other = open(path);
    try {
      const old = other.read(), winner = canon(next(old, '-a'));
      assert.equal(store.compareAndSwap(old, winner), true);
      assert.equal(other.compareAndSwap(old, canon(next(old, '-b'))), false);
      assert.equal(other.read(), winner);
    } finally { other.close(); }
  });
  test('history rewrite rejected without new revision', store => {
    advance(store, 1);
    const raw = store.read(), changed = next(raw);
    changed.journal[0].command.kind = 'rewritten';
    assert.throws(() => store.compareAndSwap(raw, canon(changed)), /historical command/);
    assert.equal(store.read(), raw);
  });
  test('duplicate transaction identity rejected', store => {
    advance(store, 1);
    const raw = store.read(), changed = next(raw);
    changed.journal[1].transaction_id = changed.journal[0].transaction_id;
    assert.throws(() => store.compareAndSwap(raw, canon(changed)), /journal identity/);
    assert.equal(store.read(), raw);
  });
  test('noncanonical bytes rejected without state change', store => {
    const raw = store.read();
    assert.throws(() => store.compareAndSwap(raw, JSON.stringify(next(raw), null, 2)), /invalid world record/);
    assert.equal(store.read(), raw);
  });
  test('append-only SQL triggers block direct update and deletion', (store, path) => {
    advance(store, 1);
    const raw = store.read(), db = new DatabaseSync(path);
    try {
      assert.throws(() => db.exec("UPDATE commands SET bytes='tampered' WHERE revision=1"), /append-only/);
      assert.throws(() => db.exec('DELETE FROM commands WHERE revision=1'), /append-only/);
    } finally { db.close(); }
    assert.equal(store.read(), raw);
  });
  test('corrupt head digest rejected on read and reopen', (store, path) => {
    advance(store, 1);
    const db = new DatabaseSync(path);
    try { db.exec("UPDATE head SET digest='tampered'"); } finally { db.close(); }
    assert.throws(() => store.read(), /digest mismatch/);
    store.close();
    assert.throws(() => open(path), /digest mismatch/);
  });
  test('256-command ceiling: 257 rejected, complete prior history retained', (store, path) => {
    advance(store, 256);
    const raw = store.read(), info = store.describe();
    assert.equal(info.revision, 256);
    assert.equal(info.segments.length, 8);
    assert.ok(info.segments.every(s => s.sealed));
    assert.throws(() => store.compareAndSwap(raw, canon(next(raw))), /invalid world record/);
    assert.equal(store.read(), raw);
    store.close();
    const reopened = open(path);
    try { assert.equal(reopened.read(), raw); } finally { reopened.close(); }
  });
} finally { rmSync(dir, {recursive: true, force: true}); }
console.log(`${passed}/${passed + failed} passed (native adapter-only; not gameplay or replay verification)`);
if (failed) process.exitCode = 1;
