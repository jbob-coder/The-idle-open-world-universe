// Review-only rebuildable presentation index; not a world store or authorization layer.
// Caller supplies trusted, already committed, actor-scoped segment references.
// Use a dedicated disposable index DB, never an existing world/save DB.
import {DatabaseSync} from 'node:sqlite';
import {closeSync,lstatSync,openSync} from 'node:fs';
import {openTranscriptCursor,projectTranscriptPage,MAX_PAGE_SIZE} from './transcript_projection.mjs';
const scopeArgs=s=>[s.world_id,s.epoch_id,s.actor_id];
const fields=['world_id','epoch_id','actor_id','ordinal','receipt_id','paragraph','content_version','template_id','variant_index'];
const same=(a,b)=>fields.every(k=>a[k]===b[k]);
const check=(ok,msg)=>{if(!ok)throw Error(msg)};
const where='world_id=? AND epoch_id=? AND actor_id=?';
const APP_ID=0x47535449;
export function openTranscriptIndex(path,resolveText,{mode='open'}={}){
  check(typeof resolveText==='function','missing version resolver');
  check(typeof path==='string'&&path.length>0&&path!==':memory:'&&['create','open'].includes(mode),'invalid index path or mode');
  if(mode==='create')closeSync(openSync(path,'wx',0o600));
  check(lstatSync(path).isFile(),'existing regular index required');
  const db=new DatabaseSync(path);let closed=false;
  try{
    db.exec('PRAGMA busy_timeout=5000;');
    if(mode==='create')db.exec(`BEGIN IMMEDIATE;
      PRAGMA application_id=${APP_ID}; PRAGMA user_version=1;
      CREATE TABLE qa_transcript_segments(
        world_id TEXT NOT NULL,epoch_id TEXT NOT NULL,actor_id TEXT NOT NULL,
        ordinal INTEGER NOT NULL CHECK(ordinal>0),receipt_id TEXT NOT NULL,
        paragraph INTEGER NOT NULL CHECK(paragraph>=0),content_version TEXT NOT NULL,
        template_id TEXT NOT NULL,variant_index INTEGER NOT NULL CHECK(variant_index>=0),
        PRIMARY KEY(world_id,epoch_id,actor_id,ordinal),
        UNIQUE(world_id,epoch_id,actor_id,receipt_id,paragraph)
      ) STRICT, WITHOUT ROWID; COMMIT;`);
    check(db.prepare('PRAGMA application_id').get().application_id===APP_ID&&db.prepare('PRAGMA user_version').get().user_version===1,'foreign index format');
    db.prepare('SELECT '+fields.join(',')+' FROM qa_transcript_segments LIMIT 0').all();
  }catch(e){if(db.isTransaction)db.exec('ROLLBACK');db.close();throw e}
  const max=db.prepare(`SELECT COALESCE(MAX(ordinal),0) AS n FROM qa_transcript_segments WHERE ${where}`);
  const one=db.prepare(`SELECT * FROM qa_transcript_segments WHERE ${where} AND ordinal=?`);
  const range=db.prepare(`SELECT * FROM qa_transcript_segments WHERE ${where} AND ordinal>? AND ordinal<=? ORDER BY ordinal LIMIT ?`);
  const insert=db.prepare('INSERT INTO qa_transcript_segments VALUES(?,?,?,?,?,?,?,?,?)');
  const head=s=>{openTranscriptCursor(s,0);return max.get(...scopeArgs(s)).n};
  const transact=(mode,f)=>{check(!closed,'closed index');db.exec(mode);try{const x=f();db.exec('COMMIT');return x}catch(e){if(db.isTransaction)db.exec('ROLLBACK');throw e}};
  function append(scope,records){
    check(Array.isArray(records)&&records.length>=1&&records.length<=MAX_PAGE_SIZE,'invalid append batch');
    const first=records[0]?.ordinal,last=records.at(-1)?.ordinal;
    check(Number.isSafeInteger(first)&&first>=1&&Number.isSafeInteger(last),'invalid append ordinal');
    const cursor={...openTranscriptCursor(scope,last),after:first-1};
    // Validate scope, shape, order and versioned content before any writes.
    projectTranscriptPage(scope,cursor,records.length,records,resolveText);
    return transact('BEGIN IMMEDIATE',()=>{
      let n=head(scope),added=0;
      for(const r of records){
        if(r.ordinal<=n){const prior=one.get(...scopeArgs(scope),r.ordinal);check(prior&&same(prior,r),'conflicting segment replay');continue}
        check(r.ordinal===n+1,'noncontiguous append');
        insert.run(...fields.map(k=>r[k]));n++;added++;
      }
      return {added,through:n};
    });
  }
  function cursor(scope){return transact('BEGIN',()=>openTranscriptCursor(scope,head(scope)))}
  function read(scope,c,limit){
    return transact('BEGIN',()=>{
      // Validate cursor and page size before issuing a bounded indexed query.
      const current=head(scope);
      check(c&&Object.keys(c).length===5&&['world_id','epoch_id','actor_id','after','through'].every(k=>Object.hasOwn(c,k))&&scopeArgs(scope).every((v,i)=>v===scopeArgs(c)[i])&&Number.isSafeInteger(c.after)&&Number.isSafeInteger(c.through)&&c.after>=0&&c.through>=c.after&&c.through<=current,'invalid prefix cursor');
      check(Number.isSafeInteger(limit)&&limit>=1&&limit<=MAX_PAGE_SIZE,'invalid page size');
      const rows=range.all(...scopeArgs(scope),c.after,c.through,limit);
      return projectTranscriptPage(scope,c,limit,rows,resolveText);
    });
  }
  return Object.freeze({append,cursor,read,close(){if(!closed){db.close();closed=true}}});
}
