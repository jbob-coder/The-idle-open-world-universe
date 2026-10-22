// GODSEED strict square-pixel SOURCE-ASSET validator (Node20, no npm dependencies).
// This validates starter atlases and documented graphics rules, NOT runtime sprite integration.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {inflateSync} from 'node:zlib';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const art=JSON.parse(readFileSync('config/pixel-art-contract.json','utf8'));
const palette=JSON.parse(readFileSync(art.raster.paletteFile,'utf8'));
const manifest=JSON.parse(readFileSync('assets/asset-manifest.json','utf8'));
const game=require('../src/sim.js');
const html=readFileSync('index.template.html','utf8');
const ui=readFileSync('src/ui.js','utf8');
assert.equal(art.schema,'godseed.pixel-art-contract.v1');
assert.equal(art.status,'binding-design-rules-not-runtime-integration');
assert.equal(art.camera.projection,'orthographic-top-down');
assert.deepEqual(art.camera.defaultTargetWorldTiles,[32,20]); // target, NOT yet runtime default
assert.deepEqual(art.camera.currentBaselineDefaultWorldTiles,[24,15]);
assert.deepEqual(art.sizing.terrain,[16,16]);
assert.deepEqual(art.sizing.character,[16,24]);
assert.deepEqual(art.sizing.footAnchor,[8,23]);
assert.deepEqual(art.sim.worldTiles,[game.W,game.H]);
assert.equal(art.sim.terrainSemantics.length,11);
for(let i=0;i<11;i++)assert.equal(game.T[art.sim.terrainSemantics[i]],i,'terrain enum changed '+i);
assert.deepEqual(manifest.pixelRules.nativeTilePixels,art.sizing.terrain);
assert.deepEqual(manifest.pixelRules.actorFootAnchor,art.sizing.footAnchor);
assert.deepEqual(manifest.pixelRules.worldCells,art.sim.worldTiles);
assert.equal(manifest.pixelRules.smoothing,false);
assert.equal(art.raster.maximumSuggestedColorsPerSmallTile,6);
assert.deepEqual(art.raster.alphaAllowed,[0,255]);
assert.match(html,/image-rendering\s*:\s*pixelated/,'CSS must keep pixelated scaling');
assert.match(ui,/imageSmoothingEnabled\s*=\s*false/,'Canvas render context must disable smoothing');
const accepted=new Set(Object.values(palette.colors).map(hex=>hex.slice(1).toUpperCase()));
assert.ok(accepted.size>=16);
for(const [key,hex] of Object.entries(palette.colors)){
 assert.ok(/^#[0-9A-F]{6}$/i.test(hex),'bad palette '+key);
}
const checks=[];
for(const atlas of manifest.atlases){
 const png=readFileSync(atlas.path);
 assert.deepEqual([...png.subarray(0,8)],[137,80,78,71,13,10,26,10],atlas.path+' PNG header');
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
 assert.equal(width,atlas.width);assert.equal(height,atlas.height);
 assert.ok(width<=art.sizing.maximumAtlasSourceSidePixels&&height<=art.sizing.maximumAtlasSourceSidePixels,
   'atlas too large '+atlas.path);
 assert.equal(png[24],8,'must use RGBA 8-bit');assert.equal(png[25],6,'must be RGBA');
 let offset=8;const compressed=[];
 while(offset<png.length){
  const size=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8);
  assert.ok(offset+12+size<=png.length,'corrupt PNG chunk '+atlas.path);
  if(type==='IDAT')compressed.push(png.subarray(offset+8,offset+8+size));
  offset+=12+size;if(type==='IEND')break;
 }
 assert.ok(compressed.length>0,'no pixel data: '+atlas.path);
 const bytes=inflateSync(Buffer.concat(compressed));
 assert.equal(bytes.length,height*(1+width*4),'unsupported filtered scanline structure');
 let opaque=0,transparent=0;const used=new Set();
 for(let y=0;y<height;y++){
  const row=y*(1+width*4);assert.equal(bytes[row],0,'starter PNG must use unfiltered scanlines');
  for(let x=0;x<width;x++){
   const k=row+1+x*4,alpha=bytes[k+3];
   assert.ok(art.raster.alphaAllowed.includes(alpha),'forbidden antialiased partial alpha at '+atlas.path+':'+x+','+y+' = '+alpha);
   if(alpha===0){transparent++;continue;}
   opaque++;
   const hex=[bytes[k],bytes[k+1],bytes[k+2]].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
   assert.ok(accepted.has(hex),'unapproved opaque RGB #'+hex+' at '+atlas.path+':'+x+','+y);
   used.add(hex);
  }
 }
 const frames=atlas.tiles||atlas.frames||atlas.symbols||atlas.items;
 assert.ok(frames&&frames.length,'empty atlas manifest');
 for(const f of frames){
  const [x,y,w,h]=f.rect;
  assert.ok(Number.isInteger(x)&&Number.isInteger(y)&&Number.isInteger(w)&&Number.isInteger(h));
  assert.ok(x>=0&&y>=0&&x+w<=width&&y+h<=height,'invalid frame '+atlas.path);
 }
 if(atlas.path.includes('terrain')){
  assert.deepEqual([width,height],[176,48]);
  for(let i=0;i<11;i++){
   const forms=atlas.tiles.filter(t=>t.id===i);
   assert.equal(forms.length,art.raster.minimumTerrainVariantsPerSemanticTile,'terrain variants id '+i);
   assert.deepEqual(forms.map(x=>x.variant),[0,1,2]);
   for(const f of forms)assert.deepEqual(f.rect.slice(2),art.sizing.terrain);
  }
 }
 if(atlas.path.includes('actors')){
  for(const f of atlas.frames)assert.deepEqual(f.rect.slice(2),art.sizing.character);
  for(const role of ['Nim','Ira','Toren','Mera']){
   const frames=atlas.frames.filter(f=>f.name===role);
   assert.equal(frames.length,8,'starter role/direction/pose '+role);
   assert.deepEqual([...new Set(frames.map(f=>f.direction))].sort(),
      ['east','north','south','west']);
  }
 }
 checks.push({atlas:atlas.path,size:width+'x'+height,opaque,transparent,paletteColors:used.size});
}
assert.equal(art.runtime.mustIncludeCssPixelated,true);
assert.equal(art.runtime.mustDisableCanvasImageSmoothing,true);
assert.equal(art.accessibility.powerGlyphMustHaveText,true);
console.log('PASS GODSEED strict pixel SOURCE requirements; 11 terrain IDs, source palette, RGBA alpha edges and original atlas frames.');
for(const c of checks)console.log('PASS',c.atlas,c.size,'opaque='+c.opaque,'transparent='+c.transparent,'colors='+c.paletteColors);
console.log('Runtime atlas/zoom evidence is checked separately by tests/render_acceptance.py and tests/capture_android_layouts.py.');
