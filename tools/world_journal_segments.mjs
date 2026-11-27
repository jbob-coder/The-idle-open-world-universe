// Experimental lossless SQLite journal segmentation; not a production migration/cutover.
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { closeSync, lstatSync, openSync } from 'node:fs';
import { canonicalWorldJson as canon } from './world_persistence_reference.mjs';

const APP_ID=0x47534a31, MAX_CHARS=16_000_000, MAX_COMMANDS=256;
const ensure=(v,m)=>{if(!v)throw Error(m)};
const id=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{1,50}$/.test(v);
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===keys.length&&keys.every(k=>Object.hasOwn(o,k));
const hash=v=>createHash('sha256').update(v,'utf8').digest('hex');
const genesis='0'.repeat(64), link=(prior,row)=>hash(prior+'\n'+row);
const same=(a,b)=>canon(a)===canon(b);

export function openSegmentedWorldStore(path,{mode='open',identity,segmentSize=32}={}){
 ensure(typeof path==='string'&&path.length>0&&path!==':memory:'&&['create','open'].includes(mode),'explicit local storage mode required');
 ensure(exact(identity,['world_id','seed'])&&id(identity.world_id)&&typeof identity.seed==='string'&&identity.seed.length>0&&identity.seed.length<=128,'invalid identity');
 ensure(Number.isInteger(segmentSize)&&segmentSize>=1&&segmentSize<=MAX_COMMANDS,'invalid segment size');
 const {world_id,seed}=identity;
 if(mode==='create')closeSync(openSync(path,'wx',0o600));
 ensure(lstatSync(path).isFile(),'existing regular database required');
 const db=new DatabaseSync(path);let closed=false;
 const segment=r=>Math.floor((r-1)/segmentSize);
 function parse(raw){
  ensure(typeof raw==='string'&&raw.length<=MAX_CHARS,'invalid record bytes');
  const root=JSON.parse(raw);
  ensure(canon(root)===raw&&exact(root,['format','adapter_version','world_id','seed','player_id','initial','revision','journal','checkpoint'])&&root.format==='world-reference-v1'&&root.world_id===world_id&&root.seed===seed&&id(root.adapter_version)&&id(root.player_id)&&root.initial?.world_id===world_id&&root.checkpoint&&typeof root.checkpoint==='object'&&!Array.isArray(root.checkpoint)&&Number.isInteger(root.revision)&&root.revision>=0&&root.revision<=MAX_COMMANDS&&Array.isArray(root.journal)&&root.journal.length===root.revision,'invalid world record');
  const seen=new Set();
  for(let i=0;i<root.journal.length;i++){
   const r=root.journal[i];ensure(exact(r,['revision','transaction_id','command'])&&r.revision===i+1&&id(r.transaction_id)&&!seen.has(r.transaction_id)&&r.command&&typeof r.command.kind==='string','invalid journal identity or sequence');seen.add(r.transaction_id);
  }
  return root;
 }
 const header=root=>{const {journal,...h}=root;return h};
 const fixed=root=>{const {journal,revision,checkpoint,...h}=root;return h};
 function readState(){
  const m=db.prepare('SELECT world_id,seed,segment_size,initialized FROM manifest WHERE singleton=1').get();
  ensure(m&&m.world_id===world_id&&m.seed===seed&&m.segment_size===segmentSize&&[0,1].includes(m.initialized),'segment manifest mismatch');
  const head=db.prepare('SELECT revision,header,digest,chain FROM head WHERE singleton=1').get();
  const rows=db.prepare('SELECT revision,segment,transaction_id,bytes,chain FROM commands ORDER BY revision').all();
  if(!head){ensure(m.initialized===0&&rows.length===0,'missing initialized journal');return {raw:null,root:null,chain:genesis}}
  ensure(m.initialized===1&&head.revision===rows.length&&rows.length<=MAX_COMMANDS,'journal length mismatch');
  let chain=genesis;const journal=[];
  for(let i=0;i<rows.length;i++){
   const r=rows[i],v=JSON.parse(r.bytes);chain=link(chain,r.bytes);
   ensure(r.revision===i+1&&r.segment===segment(i+1)&&v.revision===r.revision&&v.transaction_id===r.transaction_id&&canon(v)===r.bytes&&r.chain===chain,'journal segment integrity failure');journal.push(v);
  }
  const h=JSON.parse(head.header);ensure(canon(h)===head.header&&!Object.hasOwn(h,'journal')&&h.revision===head.revision&&head.chain===chain,'checkpoint header mismatch');
  const raw=canon({...h,journal});ensure(hash(raw)===head.digest,'world digest mismatch');
  return {raw,root:parse(raw),chain};
 }
 function tx(begin,fn){ensure(!closed,'database closed');db.exec(begin);try{const r=fn();db.exec('COMMIT');return r}catch(e){if(db.isTransaction)db.exec('ROLLBACK');throw e}}
 function write(prior,root,raw){
  let chain=prior.chain;const insert=db.prepare('INSERT INTO commands VALUES(?,?,?,?,?)');
  for(const r of root.journal.slice(prior.root?.revision??0)){const bytes=canon(r);chain=link(chain,bytes);insert.run(r.revision,segment(r.revision),r.transaction_id,bytes,chain)}
  db.prepare('INSERT INTO head VALUES(1,?,?,?,?) ON CONFLICT(singleton) DO UPDATE SET revision=excluded.revision,header=excluded.header,digest=excluded.digest,chain=excluded.chain').run(root.revision,canon(header(root)),hash(raw),chain);
  db.exec('UPDATE manifest SET initialized=1 WHERE singleton=1');
 }
 try{
  db.exec('PRAGMA busy_timeout=5000; PRAGMA synchronous=EXTRA;');
  if(mode==='create'){
   db.exec('PRAGMA journal_mode=DELETE;');
   tx('BEGIN IMMEDIATE',()=>{
    db.exec(`PRAGMA application_id=${APP_ID}; PRAGMA user_version=1;
     CREATE TABLE manifest(singleton INTEGER PRIMARY KEY CHECK(singleton=1),world_id TEXT NOT NULL,seed TEXT NOT NULL,segment_size INTEGER NOT NULL,initialized INTEGER NOT NULL CHECK(initialized IN (0,1))) STRICT;
     CREATE TABLE head(singleton INTEGER PRIMARY KEY CHECK(singleton=1),revision INTEGER NOT NULL,header TEXT NOT NULL,digest TEXT NOT NULL,chain TEXT NOT NULL) STRICT;
     CREATE TABLE commands(revision INTEGER PRIMARY KEY CHECK(revision>0),segment INTEGER NOT NULL CHECK(segment>=0),transaction_id TEXT UNIQUE NOT NULL,bytes TEXT NOT NULL,chain TEXT NOT NULL) STRICT;
     CREATE TRIGGER no_command_update BEFORE UPDATE ON commands BEGIN SELECT RAISE(ABORT,'append-only journal'); END;
     CREATE TRIGGER no_command_delete BEFORE DELETE ON commands BEGIN SELECT RAISE(ABORT,'append-only journal'); END;`);
    db.prepare('INSERT INTO manifest VALUES(1,?,?,?,0)').run(world_id,seed,segmentSize);
   });
  }
  ensure(db.prepare('PRAGMA application_id').get().application_id===APP_ID&&db.prepare('PRAGMA user_version').get().user_version===1&&db.prepare('PRAGMA journal_mode').get().journal_mode==='delete','incompatible segmented database');tx('BEGIN',readState);
 }catch(e){db.close();throw e}
 return Object.freeze({
  read:()=>tx('BEGIN',()=>readState().raw),
  compareAndSwap(expected,next){
   ensure(expected===null||typeof expected==='string','invalid expected bytes');const root=parse(next);
   return tx('BEGIN IMMEDIATE',()=>{const prior=readState();if(prior.raw!==expected)return false;
    ensure(root.revision===(prior.root?.revision??-1)+1,'nonsequential revision');
    if(prior.root)ensure(same(fixed(root),fixed(prior.root))&&same(root.journal.slice(0,prior.root.revision),prior.root.journal),'historical command or initial state rewrite');
    write(prior,root,next);return true});
  },
  // Explicit point-in-time copy from a trusted, fully validated v1 source. Never deletes or switches the source.
  importVerified(source,bindWorld){
   ensure(source&&typeof source.read==='function'&&typeof bindWorld==='function','invalid migration dependencies');
   const raw=source.read(),root=parse(raw),frozen=Object.freeze({read:()=>raw,compareAndSwap:()=>{throw Error('migration verifier must be read-only')}});
   const w=bindWorld(frozen),r=w.recover(),cp=w.exportPrivateCheckpoint(),v=w.verifyCheckpointContinuation(cp);
   ensure(r.world_id===world_id&&r.seed===seed&&r.revision===root.revision&&same(r.checkpoint,root.checkpoint)&&v.base_revision===root.revision&&same(v.checkpoint,root.checkpoint)&&same(v.private_state,cp.runtime),'source verification mismatch');
   ensure(source.read()===raw,'source changed during verification');
   return tx('BEGIN IMMEDIATE',()=>{const prior=readState();ensure(prior.raw===null,'migration target already initialized');write(prior,root,raw);return {world_id,revision:root.revision,source_digest:hash(raw)}});
  },
  describe:()=>tx('BEGIN',()=>{const {root}=readState(),n=root?.revision??0,segments=[];for(let start=1;start<=n;start+=segmentSize){const end=Math.min(n,start+segmentSize-1);segments.push({index:segment(start),first_revision:start,last_revision:end,sealed:end-start+1===segmentSize})}return {revision:root?.revision??null,segment_size:segmentSize,segments,active_commands:n%segmentSize}}),
  close(){if(!closed){db.close();closed=true}}
 });
}
