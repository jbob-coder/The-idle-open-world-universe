/* GODSEED WLD-003: opt-in, bounded chunk camera and local fog.
 * The legacy 64x48 simulation/save is intentionally untouched. WLD-004/007
 * own actor travel and save migration; this is a real God-view terrain atlas.
 */
(function(root, factory) {
 "use strict";
 const chunks = typeof module !== "undefined" && module.exports
  ? require("./chunks.js") : root.GodseedChunks;
 const store = typeof module !== "undefined" && module.exports
  ? require("./chunk_store.js") : root.GodseedChunkStore;
 const api = factory(chunks,store);
 if (typeof module !== "undefined" && module.exports) module.exports=api;
 if (root) root.GodseedChunkView=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Chunks,Store) {
 "use strict";
 if (!Chunks || !Store) throw new Error("Chunk view requires chunks and chunk store");
 const ZOOMS=Object.freeze([{name:"Panorama",width:32,height:20},
  {name:"Cerca",width:24,height:15},{name:"Inspección",width:16,height:10}]);
 const MAX_COORD=1000000, DEFAULT_FOG_CHUNKS=9, REVEAL_RADIUS=8;
 function coordinate(n,label) {
  if (!Number.isSafeInteger(n) || n < -MAX_COORD || n > MAX_COORD)
   throw new RangeError(label+" is outside bounded atlas coordinates");
  return n;
 }
 function zoomIndex(z) {
  if (!Number.isInteger(z) || z<0 || z>=ZOOMS.length)
   throw new RangeError("zoom must be 0, 1 or 2");
  return z;
 }
 function seenKey(x,y) {return x+","+y;}
 function create(seed,options) {
  const opts=options||{};
  const maxFog=opts.maxFogChunks===undefined?DEFAULT_FOG_CHUNKS:opts.maxFogChunks;
  if (!Number.isInteger(maxFog)||maxFog<4||maxFog>16)
   throw new RangeError("maxFogChunks must be between 4 and 16");
  const store=opts.store||Store.create(seed,{maxActive:9});
  if (!store || typeof store.chunkAt!=="function" || typeof store.tileAt!=="function" ||
      store.seed!==seed) throw new TypeError("chunk store must match atlas seed");
  let centerX=coordinate(opts.centerX===undefined?32:opts.centerX,"center x");
  let centerY=coordinate(opts.centerY===undefined?24:opts.centerY,"center y");
  let zoom=zoomIndex(opts.zoom===undefined?0:opts.zoom);
  const explored=new Map(); // LRU bitsets, at most 16 * 1024 bytes
  let previous=null,previousOrigin=null,forced=true,lastDirty=0,renderCount=0;
  function mark(x,y) {
   const pos=Chunks.worldToChunk(x,y),key=seenKey(pos.chunkX,pos.chunkY);
   let bitset=explored.get(key);
   if (!bitset) bitset=new Uint8Array(Chunks.CELLS);
   else explored.delete(key);
   bitset[pos.index]=1;explored.set(key,bitset);
   while(explored.size>maxFog)explored.delete(explored.keys().next().value);
  }
  function known(x,y) {
   const at=Chunks.worldToChunk(x,y),flags=explored.get(seenKey(at.chunkX,at.chunkY));
   return !!flags&&flags[at.index]===1;
  }
  function reveal() {
   for(let dy=-REVEAL_RADIUS;dy<=REVEAL_RADIUS;dy++)
    for(let dx=-REVEAL_RADIUS;dx<=REVEAL_RADIUS;dx++)
     if(dx*dx+dy*dy<=REVEAL_RADIUS*REVEAL_RADIUS)mark(centerX+dx,centerY+dy);
  }
  function camera() {
   const z=ZOOMS[zoom];
   return {centerX,centerY,x:centerX-Math.floor(z.width/2),
    y:centerY-Math.floor(z.height/2),width:z.width,height:z.height,
    zoom,name:z.name};
  }
  function update(x,y) {
   coordinate(x,"center x");coordinate(y,"center y");
   if(x===centerX&&y===centerY)return false;
   centerX=x;centerY=y;forced=true;reveal();return true;
  }
  function setZoom(z) {
   zoomIndex(z);if(zoom===z)return false;
   zoom=z;forced=true;previous=null;return true;
  }
  function pan(dx,dy) {
   coordinate(dx,"pan x");coordinate(dy,"pan y");
   return update(centerX+dx,centerY+dy);
  }
  function renderFrame() {
   const cam=camera(),size=cam.width*cam.height;
   const tiles=new Int16Array(size),dirty=[];
   const same=previous&&!forced&&previous.length===size&&
    previousOrigin&&previousOrigin.x===cam.x&&previousOrigin.y===cam.y;
   for(let j=0;j<cam.height;j++)for(let i=0;i<cam.width;i++){
    const x=cam.x+i,y=cam.y+j,index=j*cam.width+i;
    // WLD-003 fog remembers already observed terrain, never inventing what
    // an unrevealed tile contains or allocating the entire world.
    const tile=known(x,y)?store.tileAt(x,y):-1;
    tiles[index]=tile;
    if(!same||previous[index]!==tile)dirty.push({index,x,y,tile});
   }
   previous=tiles;previousOrigin={x:cam.x,y:cam.y};forced=false;
   lastDirty=dirty.length;renderCount++;
   return {camera:cam,tiles,dirty};
  }
  function setTile(x,y,tile) {
   coordinate(x,"edit x");coordinate(y,"edit y");
   return store.setTile(x,y,tile); // next render compares actual tile values
  }
  function stats() {
   return {renderCount,lastDirty,visibleTiles:ZOOMS[zoom].width*ZOOMS[zoom].height,
    fogChunks:explored.size,maxFogChunks:maxFog,store:store.stats()};
  }
  reveal();
  function invalidate(){forced=true;}
  return Object.freeze({camera,setCenter:update,setZoom,pan,renderFrame,
   reveal,known,setTile,stats,store,ZOOMS,invalidate});
 }
 return Object.freeze({ZOOMS,MAX_COORD,REVEAL_RADIUS,create});
});
