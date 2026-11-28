// Host-only synthetic SQLite diagnostic; not an Android benchmark or game model.
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { arch, platform, release } from 'node:os';
const ok=(v,m)=>{if(!v)throw Error(m)};
const q=(a,p)=>[...a].sort((x,y)=>x-y)[Math.ceil(a.length*p)-1];
function run(count){
 const dir=mkdtempSync(join(tmpdir(),'godseed-a54-')), path=join(dir,'test.db');
 const db=new DatabaseSync(path);
 try {
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
 CREATE TABLE actor(id INTEGER PRIMARY KEY, rev INTEGER NOT NULL);
 CREATE TABLE history(actor INTEGER NOT NULL, seq INTEGER NOT NULL, body TEXT NOT NULL, PRIMARY KEY(actor,seq)) WITHOUT ROWID;
 CREATE TABLE catalog(id INTEGER PRIMARY KEY, body TEXT NOT NULL);
 CREATE TABLE learned(actor INTEGER, ability INTEGER, PRIMARY KEY(actor,ability)) WITHOUT ROWID;`);
 const actor=db.prepare('INSERT INTO actor VALUES (?,0)'), hist=db.prepare('INSERT INTO history VALUES (?,?,?)'), ability=db.prepare('INSERT INTO catalog VALUES (?,?)'), learn=db.prepare('INSERT INTO learned VALUES (?,?)');
 const body=JSON.stringify({kind:'synthetic_event',data:'x'.repeat(96)}), def=JSON.stringify({kind:'placeholder_not_ability',data:'x'.repeat(384)});
 db.exec('BEGIN');
 for(let i=1;i<=10000;i++)ability.run(i,def);
 for(let a=1;a<=count;a++){actor.run(a);learn.run(a,a);for(let s=1;s<=1000;s++)hist.run(a,s,body);}
 db.exec('COMMIT');
 const tail=db.prepare('SELECT seq,body FROM history WHERE actor=? ORDER BY seq DESC LIMIT 20');
 const owned=db.prepare('SELECT catalog.id,catalog.body FROM learned JOIN catalog ON catalog.id=learned.ability WHERE learned.actor=?');
 const bump=db.prepare('UPDATE actor SET rev=rev+1 WHERE id=?');
 const timings=[], reads=[], writes=Array(count+1).fill(0);const before=process.memoryUsage().rss;
 for(let i=0;i<300;i++){
  const a=1+i%count, t=performance.now();
  db.exec('BEGIN IMMEDIATE');bump.run(a);hist.run(a,1001+writes[a]++,body);db.exec('COMMIT');timings.push(performance.now()-t);
  const u=performance.now(), records=tail.all(a), defs=owned.all(a);reads.push(performance.now()-u);
  ok(records.length===20&&records[0].seq===1000+writes[a]&&defs.length===1&&defs[0].id===a,'scoped query mismatch');
 }
 ok(db.prepare('SELECT SUM(rev) n FROM actor').get().n===300,'revision count');
 ok(db.prepare('SELECT COUNT(*) n FROM history').get().n===count*1000+300,'history count');
 ok(db.prepare('PRAGMA integrity_check').get().integrity_check==='ok','integrity');
 const plan=db.prepare('EXPLAIN QUERY PLAN SELECT seq,body FROM history WHERE actor=? ORDER BY seq DESC LIMIT 20').all(1).map(x=>x.detail);
 ok(plan.some(x=>x.includes('SEARCH')&&x.includes('PRIMARY KEY')),'indexed query expected');
 const sqlite=db.prepare('select sqlite_version() v').get().v;
 db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
 const report={actors:count,history_rows:count*1000+300,catalog_placeholder_rows:10000,iterations:300,sqlite,commit_ms:{p50:q(timings,.5),p95:q(timings,.95),max:Math.max(...timings)},scoped_read_ms:{p50:q(reads,.5),p95:q(reads,.95),max:Math.max(...reads)},database_bytes:statSync(path).size,rss_before_bytes:before,rss_after_bytes:process.memoryUsage().rss,query_plan:plan,integrity:'ok'};
 return report;
 } finally { db.close(); rmSync(dir,{recursive:true,force:true}); }
}
console.log(JSON.stringify({scope:'synthetic x86_64 host only; not Galaxy A54; not real catalog, gameplay, rewind, or application benchmark',node:process.version,arch:arch(),platform:platform(),kernel:release(),cases:[run(12),run(128)]},null,2));
