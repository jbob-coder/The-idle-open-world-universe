// Node 20+, no npm packages. Validates original PNG atlases and their machine-readable coordinates.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
const manifest=JSON.parse(readFileSync('assets/asset-manifest.json','utf8'));
const tasks=JSON.parse(readFileSync('work-items/codex-tasks.json','utf8'));
assert.equal(manifest.schema,'godseed.assets.v1');
assert.equal(manifest.state,'starter-not-integrated');
assert.equal(manifest.atlases.length,4);
assert.equal(tasks.entries.length,25);
assert.equal(new Set(tasks.entries.map(t=>t.id)).size,25);
assert.ok(tasks.entries.every(t=>['todo','done','blocked','implemented_pending_visual_qa'].includes(t.status)), 'Known implementation states');
assert.ok(tasks.entries.filter(t=>t.status==='done').every(t=>t.evidence.length>0), 'Completed tasks require evidence');
const sign=[137,80,78,71,13,10,26,10];
function crc32(bytes){let crc=0xffffffff;for(const octet of bytes){crc^=octet;for(let i=0;i<8;i++)crc=crc&1?0xedb88320^(crc>>>1):crc>>>1;}return (crc^0xffffffff)>>>0;}
let total=0;
for(const atlas of manifest.atlases){
 const path=atlas.path;
 assert.ok(existsSync(path),'Missing '+path);
 const p=readFileSync(path);
 assert.deepEqual([...p.subarray(0,8)],sign);
 assert.equal(p.readUInt32BE(16),atlas.width,path+' width');
 assert.equal(p.readUInt32BE(20),atlas.height,path+' height');
 assert.equal(p[24],8);assert.equal(p[25],6);
 let off=8,parts=[];
 while(off<p.length){const n=p.readUInt32BE(off),name=p.toString('ascii',off+4,off+8);
  const end=off+12+n;assert.ok(end<=p.length,'broken chunk '+path);
  const checksum=p.readUInt32BE(off+8+n);
  assert.equal(crc32(p.subarray(off+4,off+8+n)),checksum, 'PNG CRC '+path+'/'+name);
  if(name==='IDAT')parts.push(p.subarray(off+8,off+8+n));
  off=end;
  if(name==='IEND')break;
 }
 assert.equal(off,p.length,'trailing binary data in '+path);
 const rgba=inflateSync(Buffer.concat(parts));assert.equal(rgba.length,atlas.height*(1+atlas.width*4),path+' raw bytes');
 for(let y=0;y<atlas.height;y++)assert.equal(rgba[y*(1+atlas.width*4)],0,'No PNG filtering expected '+path);
 const frames=atlas.tiles||atlas.frames||atlas.symbols||atlas.items;
 for(const f of frames){const [x,y,w,h]=f.rect;
  assert.ok(x>=0&&y>=0&&x+w<=atlas.width&&y+h<=atlas.height,'out-of-bounds frame '+path);
  assert.ok(w>0&&h>0);
 }
 console.log('PASS',path,atlas.width+'x'+atlas.height,frames.length+' atlas regions',p.length+' bytes');
 total+=p.length;
}
const terrain=manifest.atlases.find(x=>x.path.includes('terrain'));
assert.deepEqual([...new Set(terrain.tiles.map(x=>x.id))],Array.from({length:11},(_,i)=>i),'Simulation terrain IDs 0..10');
assert.ok(total<350000,'starter atlases should be tiny (<350KB)');
for(const ref of manifest.concepts)assert.ok(existsSync(ref.path),'Missing concept '+ref.path);
for(const planned of manifest.planned)assert.equal(planned.status,'planned');
console.log('PASS starter manifest, 25 work items, 3 references,',total+' total PNG bytes');
