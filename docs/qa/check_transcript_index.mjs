// Native SQLite tests, fresh temporary presentation-only databases.
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,existsSync,readFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openTranscriptIndex} from './transcript_index.mjs';
const dir=mkdtempSync(join(tmpdir(),'godseed-transcript-'));
const p={world_id:'W',epoch_id:'E1',actor_id:'P'},n={...p,actor_id:'N'},e={...p,epoch_id:'E2'};
const row=(i,s=p)=>({...s,ordinal:i,receipt_id:'B'+i,paragraph:0,content_version:'v1',template_id:'arrival',variant_index:0});
const resolve=(v,t,i)=>v==='v1'&&t==='arrival'&&i===0?'You reach the lobby.':null;
const path=join(dir,'index.db');let a=openTranscriptIndex(path,resolve,{mode:'create'}),b;let count=0;
const test=(name,f)=>{f();count++;console.log('PASS '+name)};
try{
 test('missing path fails without creation',()=>{const missing=join(dir,'missing.db');assert.throws(()=>openTranscriptIndex(missing,resolve));assert.equal(existsSync(missing),false)});
 test('explicit create cannot overwrite index',()=>assert.throws(()=>openTranscriptIndex(path,resolve,{mode:'create'})));
 test('foreign database unchanged',()=>{const other=join(dir,'other.db'),d=new DatabaseSync(other);d.exec('CREATE TABLE unrelated(x); INSERT INTO unrelated VALUES(1)');d.close();const before=readFileSync(other);assert.throws(()=>openTranscriptIndex(other,resolve),/foreign index/);assert.deepEqual(readFileSync(other),before)});
 test('empty scoped prefix',()=>assert.equal(a.read(p,a.cursor(p),64).done,true));
 test('append contiguous references',()=>assert.deepEqual(a.append(p,[row(1),row(2)]),{added:2,through:2}));
 test('exact retry unchanged',()=>assert.deepEqual(a.append(p,[row(1),row(2)]),{added:0,through:2}));
 test('mixed retry and new suffix',()=>assert.deepEqual(a.append(p,[row(2),row(3)]),{added:1,through:3}));
 test('divergent replay rejected',()=>assert.throws(()=>a.append(p,[{...row(2),receipt_id:'Other'}]),/conflicting/));
 test('gap rejected',()=>assert.throws(()=>a.append(p,[row(5)]),/noncontiguous/));
 test('cross-batch duplicate rolls back entire batch',()=>{assert.throws(()=>a.append(p,[row(4),{...row(5),receipt_id:'B1'}]),/UNIQUE/);assert.equal(a.cursor(p).through,3)});
 test('missing content rejected before append',()=>{assert.throws(()=>a.append(p,[{...row(4),content_version:'v2'}]));assert.equal(a.cursor(p).through,3)});
 test('private field rejected',()=>assert.throws(()=>a.append(p,[{...row(4),secret:'x'}])));
 test('actor and epoch isolated',()=>{a.append(n,[row(1,n)]);a.append(e,[row(1,e)]);assert.equal(a.cursor(p).through,3);assert.equal(a.cursor(n).through,1);assert.equal(a.cursor(e).through,1)});
 test('foreign record rejected',()=>assert.throws(()=>a.append(p,[row(4,n)])));
 test('foreign cursor rejected',()=>assert.throws(()=>a.read(p,a.cursor(e),2)));
 test('forged beyond-head prefix rejected',()=>assert.throws(()=>a.read(p,{...a.cursor(p),through:99},2)));
 test('old prefix excludes appended rows',()=>{const c=a.cursor(p);a.append(p,[row(4)]);const x=a.read(p,c,2);const y=a.read(p,x.next,2);assert.equal(y.done,true);assert.equal(y.segments[0].ordinal,3);assert.equal(a.cursor(p).through,4)});
 test('normal close and reopen',()=>{a.close();a=openTranscriptIndex(path,resolve);assert.equal(a.cursor(p).through,4);assert.equal(a.read(p,a.cursor(p),64).segments.length,4)});
 test('second connection retry observes current index',()=>{b=openTranscriptIndex(path,resolve);assert.equal(b.append(p,[row(4)]).added,0);assert.equal(b.append(p,[row(5)]).added,1);assert.equal(a.cursor(p).through,5);assert.throws(()=>a.append(p,[{...row(5),receipt_id:'Other'}]))});
 test('10000 indexed records, bounded ordered reads',()=>{for(let i=6;i<=10000;i+=64)a.append(p,Array.from({length:Math.min(64,10001-i)},(_,j)=>row(i+j)));let c=a.cursor(p),seen=0,pages=0;while(c.after<c.through){const x=a.read(p,c,64);assert(x.segments.length<=64);for(const s of x.segments)assert.equal(s.ordinal,++seen);c=x.next;pages++}assert.equal(seen,10000);assert.equal(pages,157);assert.equal(a.cursor(n).through,1);assert.equal(a.cursor(e).through,1)});
 test('closed adapter rejects read',()=>{b.close();assert.throws(()=>b.cursor(p),/closed/)});
}finally{b?.close();a.close();rmSync(dir,{recursive:true,force:true})}
console.log(`${count}/${count} passed (native presentation index only)`);
