// Development reference: Node 22.16+ with node:sqlite. Local filesystem only.
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { closeSync, lstatSync, openSync } from 'node:fs';

const APP_ID = 0x474f4453;
const MAX_CHARS = 16_000_000;
const hash = bytes => createHash('sha256').update(bytes, 'utf8').digest('hex');
const require = (ok, message) => { if (!ok) throw new Error(message); };
const validIdentity = x => x && typeof x.world_id === 'string' && /^[A-Za-z0-9_-]{1,50}$/.test(x.world_id) && typeof x.seed === 'string' && x.seed.length > 0 && x.seed.length <= 128;

export function openDurableWorldStore(path, { mode = 'open', identity } = {}) {
  require(typeof path === 'string' && path.length > 0 && path !== ':memory:', 'local database path required');
  require(['create', 'open'].includes(mode) && validIdentity(identity), 'explicit mode and world identity required');
  const { world_id, seed } = identity;
  if (mode === 'create') closeSync(openSync(path, 'wx', 0o600));
  require(lstatSync(path).isFile(), 'existing regular database required');
  const db = new DatabaseSync(path);
  let closed = false;
  const parse = bytes => {
    require(typeof bytes === 'string' && bytes.length > 0 && bytes.length <= MAX_CHARS, 'invalid world bytes');
    const root = JSON.parse(bytes);
    require(root && root.format === 'world-reference-v1' && root.world_id === world_id && root.seed === seed && Number.isSafeInteger(root.revision) && root.revision >= 0, 'world identity or revision mismatch');
    return root;
  };
  const readState = () => {
    const meta = db.prepare('SELECT world_id, seed, initialized FROM world_identity WHERE singleton=1').get();
    require(meta && meta.world_id === world_id && meta.seed === seed && [0, 1].includes(meta.initialized), 'identity manifest mismatch');
    const row = db.prepare('SELECT revision, bytes, digest FROM world_record WHERE singleton=1').get();
    if (!row) { require(meta.initialized === 0, 'initialized world record missing'); return { bytes: null, revision: -1 }; }
    require(meta.initialized === 1 && hash(row.bytes) === row.digest, 'world record integrity failure');
    require(parse(row.bytes).revision === row.revision, 'stored revision mismatch');
    return row;
  };
  const transaction = (begin, fn) => {
    require(!closed, 'database closed');
    db.exec(begin);
    try { const result = fn(); db.exec('COMMIT'); return result; }
    catch (err) { if (db.isTransaction) db.exec('ROLLBACK'); throw err; }
  };
  try {
    db.exec('PRAGMA busy_timeout=5000; PRAGMA synchronous=EXTRA;');
    if (mode === 'create') {
      db.exec('PRAGMA journal_mode=DELETE;');
      transaction('BEGIN IMMEDIATE', () => {
        db.exec(`PRAGMA application_id=${APP_ID}; PRAGMA user_version=1;
          CREATE TABLE world_identity(singleton INTEGER PRIMARY KEY CHECK(singleton=1), world_id TEXT NOT NULL, seed TEXT NOT NULL, initialized INTEGER NOT NULL CHECK(initialized IN (0,1))) STRICT;
          CREATE TABLE world_record(singleton INTEGER PRIMARY KEY CHECK(singleton=1), revision INTEGER NOT NULL CHECK(revision>=0), bytes TEXT NOT NULL, digest TEXT NOT NULL CHECK(length(digest)=64)) STRICT;`);
        db.prepare('INSERT INTO world_identity VALUES (1, ?, ?, 0)').run(world_id, seed);
      });
    }
    require(db.prepare('PRAGMA application_id').get().application_id === APP_ID && db.prepare('PRAGMA user_version').get().user_version === 1, 'incompatible database format');
    require(db.prepare('PRAGMA journal_mode').get().journal_mode === 'delete', 'unsupported journal mode');
    transaction('BEGIN', readState);
  } catch (err) { db.close(); throw err; }
  return Object.freeze({
    read: () => transaction('BEGIN', () => readState().bytes),
    compareAndSwap(expected, next) {
      require(expected === null || typeof expected === 'string', 'invalid expected bytes');
      const root = parse(next);
      return transaction('BEGIN IMMEDIATE', () => {
        const prior = readState();
        if (prior.bytes !== expected) return false;
        require(root.revision === prior.revision + 1, 'nonsequential commit revision');
        db.prepare('INSERT INTO world_record VALUES (1, ?, ?, ?) ON CONFLICT(singleton) DO UPDATE SET revision=excluded.revision, bytes=excluded.bytes, digest=excluded.digest').run(root.revision, next, hash(next));
        db.exec('UPDATE world_identity SET initialized=1 WHERE singleton=1');
        return true;
      });
    },
    close() { if (!closed) { db.close(); closed = true; } }
  });
}
