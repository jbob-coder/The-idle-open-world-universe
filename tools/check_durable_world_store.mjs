// Run with Node 22.16+: node tools/check_durable_world_store.mjs
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { openDurableWorldStore } from './durable_world_store.mjs';

const identity = { world_id: 'fixture', seed: 'fixed-fixture-seed' };
const bytes = (revision, progress = revision) => JSON.stringify({ format: 'world-reference-v1', ...identity, revision, progress });
const open = (path, mode = 'open') => openDurableWorldStore(path, { mode, identity });
const script = fileURLToPath(import.meta.url);
const mutate = (path, sql) => { const db = new DatabaseSync(path); try { db.exec(sql); } finally { db.close(); } };
if (process.argv[2] === 'child') {
  const [, , , mode, path, expected, next] = process.argv;
  if (mode === 'rollback') {
    const db = new DatabaseSync(path);
    try {
      db.exec('PRAGMA synchronous=EXTRA; BEGIN IMMEDIATE');
      db.prepare('UPDATE world_record SET bytes=? WHERE singleton=1').run('uncommitted fixture');
      db.exec('ROLLBACK');
      console.log('rolled back');
    } finally { db.close(); }
  } else {
    const s = open(path);
    if (mode === 'read') console.log(s.read());
    else if (mode === 'cas' || mode === 'after-commit') {
      const ok = s.compareAndSwap(expected, next);
      if (mode === 'after-commit') assert.equal(ok, true);
      console.log(ok);
    } else throw Error('unknown child mode');
    s.close();
  }
} else {
  const dir = mkdtempSync(join(tmpdir(), 'godseed-storage-test-'));
  let n = 0, failures = 0;
  const test = async (name, f) => { n++; try { await f(); console.log('PASS', name); } catch (e) { failures++; console.error('FAIL', name, e); } };
  const path = () => join(dir, `world-${n}.db`);
  const fresh = () => { const p = path(), s = open(p, 'create'); assert.equal(s.compareAndSwap(null, bytes(0)), true); s.close(); return p; };
  const read = p => { const s = open(p); try { return s.read(); } finally { s.close(); } };
  const child = (mode, p, ...args) => spawnSync(process.execPath, [script, 'child', mode, p, ...args], { encoding: 'utf8' });
  const output = r => { assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
  const concurrent = (p, next) => new Promise((resolve, reject) => {
    const c = spawn(process.execPath, [script, 'child', 'cas', p, bytes(0), next]);
    let out = '', err = ''; c.stdout.on('data', d => out += d); c.stderr.on('data', d => err += d);
    c.on('error', reject);
    c.on('close', code => { code === 0 ? resolve(out.trim()) : reject(Error(err || `exit ${code}`)); });
  });
  try {
    await test('explicit create and initial write', () => { const p = path(), s = open(p, 'create'); try { assert.equal(s.read(), null); assert.equal(s.compareAndSwap(null, bytes(0)), true); assert.equal(s.read(), bytes(0)); } finally { s.close(); } });
    await test('open missing path fails without creating file', () => { const p = path(); assert.throws(() => open(p)); assert.equal(existsSync(p), false); });
    await test('create cannot overwrite existing database', () => { const p = fresh(); assert.throws(() => open(p, 'create')); assert.equal(read(p), bytes(0)); });
    await test('reopen uninitialized database without reseeding', () => { const p = path(); open(p, 'create').close(); const s = open(p); try { assert.equal(s.read(), null); assert.equal(s.compareAndSwap(null, bytes(0)), true); } finally { s.close(); } });
    await test('foreign seed or world cannot open database', () => { const p = fresh(); for (const i of [{...identity, seed:'other'}, {...identity,world_id:'other'}]) assert.throws(() => openDurableWorldStore(p, { identity:i })); assert.equal(read(p), bytes(0)); });
    await test('wrong world bytes rejected', () => { const p = fresh(), s = open(p); try { assert.throws(() => s.compareAndSwap(bytes(0), JSON.stringify({...JSON.parse(bytes(1)),world_id:'other'}))); assert.equal(s.read(), bytes(0)); } finally { s.close(); } });
    await test('sequential commits and stale writer rejection', () => { const p = fresh(), s = open(p); try { assert.equal(s.compareAndSwap(bytes(0), bytes(1)), true); assert.equal(s.compareAndSwap(bytes(0), bytes(1,9)), false); assert.equal(s.read(), bytes(1)); } finally { s.close(); } });
    await test('skipped or old revision rolls back transaction', () => { const p = fresh(), s = open(p); try { assert.throws(() => s.compareAndSwap(bytes(0), bytes(2))); assert.throws(() => s.compareAndSwap(bytes(0), bytes(0))); assert.equal(s.compareAndSwap(bytes(0), bytes(1)), true); } finally { s.close(); } });
    await test('malformed proposed record preserves bytes', () => { const p = fresh(), s = open(p); try { assert.throws(() => s.compareAndSwap(bytes(0), '{broken')); assert.equal(s.read(), bytes(0)); } finally { s.close(); } });
    await test('actual separate process reads persisted bytes', () => { const p = fresh(); assert.equal(output(child('read', p)), bytes(0)); });
    await test('actual separate process writes and exits', () => { const p = fresh(); assert.equal(output(child('cas', p, bytes(0), bytes(1))), 'true'); assert.equal(read(p), bytes(1)); });
    await test('two concurrent processes cannot both commit same revision', async () => { const p = fresh(), a = bytes(1, 11), b = bytes(1, 22); const results = await Promise.all([concurrent(p, a), concurrent(p, b)]); assert.deepEqual(results.sort(), ['false','true']); assert.ok([a,b].includes(read(p))); });
    await test('explicit SQL rollback preserves prior world across normal exits', () => { const p = fresh(); assert.equal(output(child('rollback', p)), 'rolled back'); assert.equal(read(p), bytes(0)); assert.equal(output(child('cas', p, bytes(0), bytes(1))), 'true'); });
    await test('normal exit after commit preserves new revision', () => { const p = fresh(); assert.equal(output(child('after-commit', p, bytes(0), bytes(1))), 'true'); assert.equal(read(p), bytes(1)); assert.equal(output(child('cas', p, bytes(0), bytes(1))), 'false'); });
    await test('payload corruption detected by digest', () => { const p = fresh(); mutate(p, "UPDATE world_record SET bytes='tampered'"); assert.throws(() => open(p), /integrity/); });
    await test('missing initialized record fails closed', () => { const p = fresh(); mutate(p, 'DELETE FROM world_record'); assert.throws(() => open(p), /missing/); });
    await test('changed stored revision fails closed', () => { const p = fresh(); mutate(p, 'UPDATE world_record SET revision=7'); assert.throws(() => open(p), /revision/); });
    await test('corrupt database not recreated', () => { const p = path(); writeFileSync(p, 'not a database'); assert.throws(() => open(p)); assert.throws(() => open(p,'create')); });
    await test('incompatible schema version rejected', () => { const p = fresh(); mutate(p, 'PRAGMA user_version=2'); assert.throws(() => open(p), /incompatible/); });
    await test('closed adapter cannot operate', () => { const p = fresh(), s = open(p); s.close(); s.close(); assert.throws(() => s.read(), /closed/); });
  } finally { rmSync(dir, { recursive: true, force: true }); }
  console.log(`${n-failures}/${n} passed`); if (failures) process.exitCode = 1;
}
