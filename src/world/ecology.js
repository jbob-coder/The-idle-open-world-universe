/* GODSEED WLD-006: pure seeded biome, resource and heritage overlays.
 * Requires WLD-001 GodseedChunks. No global world array, network or v1 save edit.
 * Caller provides route/saved/protected cells to avoid overwriting history.
 */
(function (root, factory) {
  'use strict';
  const chunks = typeof module !== 'undefined' && module.exports
    ? require('./chunks.js') : root.GodseedChunks;
  const api = factory(chunks);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.GodseedEcology = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (Chunks) {
  'use strict';
  if (!Chunks) throw new Error('GodseedChunks (WLD-001) must load before ecology');
  const SIZE = Chunks.SIZE, T = Object.freeze({...Chunks.T, RUIN:5, ROAD:8, SHRINE:10});
  const BIOMES = Object.freeze({GRASSLAND:0, WOODLAND:1, WETLAND:2,
    HIGHLAND:3, COLD_UPLAND:4, WATERSHORE:5});
  const HERITAGE_CELL = 64, REGEN_TICKS = 96;

  function safe(n,name) { if (!Number.isSafeInteger(n)) throw new RangeError(name+' must be a safe integer'); }
  function seedOf(seed) { safe(seed,'seed'); if (seed<0||seed>0xffffffff) throw new RangeError('seed must be uint32'); return seed>>>0; }
  function hash(seed,x,y,salt) {
    let h=(seed ^ Math.imul(x|0,0x1f123bb5) ^ Math.imul(y|0,0x5f356495) ^ salt)>>>0;
    h=Math.imul(h^(h>>>16),0x7feb352d);
    h=Math.imul(h^(h>>>15),0x846ca68b);
    return ((h^(h>>>16))>>>0)/4294967296;
  }
  function lerp(a,b,t) { return a+(b-a)*t; }
  function smooth(t) { return t*t*(3-2*t); }
  function noise(seed,x,y,scale,salt) {
    const gx=Math.floor(x/scale),gy=Math.floor(y/scale);
    const u=smooth(x/scale-gx),v=smooth(y/scale-gy);
    return lerp(lerp(hash(seed,gx,gy,salt),hash(seed,gx+1,gy,salt),u),
                lerp(hash(seed,gx,gy+1,salt),hash(seed,gx+1,gy+1,salt),u),v);
  }
  function climateAt(seed,x,y) {
    const s=seedOf(seed);safe(x,'x');safe(y,'y');
    return {temperature:noise(s,x,y,96,0x3311),moisture:noise(s,x,y,64,0x77e2)};
  }
  function biomeAt(seed,x,y) {
    const s=seedOf(seed);safe(x,'x');safe(y,'y');
    const tile=Chunks.tileAt(s,x,y),climate=climateAt(s,x,y);
    if (tile===T.WATER) return BIOMES.WATERSHORE;
    if (tile===T.STONE) return BIOMES.HIGHLAND;
    if (climate.temperature<0.23) return BIOMES.COLD_UPLAND;
    if (climate.moisture>0.73) return BIOMES.WETLAND;
    if (tile===T.FOREST || climate.moisture>0.54) return BIOMES.WOODLAND;
    return BIOMES.GRASSLAND;
  }
  function candidate(seed,x,y) {
    const cx=Math.floor(x/HERITAGE_CELL),cy=Math.floor(y/HERITAGE_CELL);
    const px=cx*HERITAGE_CELL+12+Math.floor(hash(seed,cx,cy,0x4251)*40);
    const py=cy*HERITAGE_CELL+12+Math.floor(hash(seed,cx,cy,0x7a53)*40);
    if (!Number.isSafeInteger(px)||!Number.isSafeInteger(py)||x!==px||y!==py) return null;
    const base=Chunks.tileAt(seed,x,y);
    if (base!==T.GRASS&&base!==T.MEADOW) return null;
    // Keep isolated heritage sites off water, cliffs and unstable lake edges.
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      if (![T.GRASS,T.MEADOW,T.FOREST,T.BERRY].includes(Chunks.tileAt(seed,x+dx,y+dy))) return null;
    }
    const type=hash(seed,cx,cy,0x9b77)<0.5?'ruin':'chapel_site';
    return {id:'heritage:'+cx+':'+cy,type,x,y,tile:type==='ruin'?T.RUIN:T.SHRINE};
  }
  function landmarkAt(seed,x,y) {
    const s=seedOf(seed);safe(x,'x');safe(y,'y');
    return candidate(s,x,y);
  }
  function resourceAt(seed,x,y,tick,harvestedAt=null) {
    const s=seedOf(seed);safe(x,'x');safe(y,'y');safe(tick,'tick');
    if (tick<0) throw new RangeError('tick must be nonnegative');
    if (harvestedAt!==null && (!Number.isSafeInteger(harvestedAt)||harvestedAt<0||harvestedAt>tick))
      throw new RangeError('harvestedAt must be a past nonnegative tick or null');
    const base=Chunks.tileAt(s,x,y);
    if (base===T.WATER||base===T.STONE) return null;
    const moisture=climateAt(s,x,y).moisture;
    if (moisture<0.3||hash(s,x,y,0x551e)>0.09) return null;
    const readyAt=harvestedAt===null?0:harvestedAt+REGEN_TICKS;
    if (!Number.isSafeInteger(readyAt)) throw new RangeError('regrowth tick overflow');
    return {id:'renewable:berry:'+x+':'+y,kind:'berries',x,y,
      available:tick>=readyAt,nextReadyTick:readyAt};
  }
  function generateEcologyChunk(seed,chunkX,chunkY,opts={}) {
    const s=seedOf(seed);safe(chunkX,'chunkX');safe(chunkY,'chunkY');
    if (!opts||typeof opts!=='object'||Array.isArray(opts)) throw new TypeError('options must be an object');
    for(const name of ['routeAt','protectedAt','savedTileAt','harvestedAt'])
      if (opts[name]!==undefined&&typeof opts[name]!=='function') throw new TypeError(name+' must be a function');
    const tick=opts.tick===undefined?0:opts.tick;
    safe(tick,'tick');if(tick<0) throw new RangeError('tick must be nonnegative');
    const base=Chunks.generateChunk(s,chunkX,chunkY);
    const tiles=base.tiles.slice(),biomes=new Uint8Array(SIZE*SIZE);
    const resources=[],landmarks=[];
    for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++) {
      const p=Chunks.chunkToWorld(chunkX,chunkY,x,y),i=y*SIZE+x;
      biomes[i]=biomeAt(s,p.x,p.y);
      // Saved player deltas always win over procedural features; no silent reset.
      const saved=opts.savedTileAt?.(p.x,p.y);
      if (saved!==undefined && saved!==null) {
        if (!Number.isInteger(saved)||saved<0||saved>10) throw new RangeError('invalid saved tile');
        tiles[i]=saved;continue;
      }
      if (opts.protectedAt?.(p.x,p.y)) continue;
      if (opts.routeAt?.(p.x,p.y)) {tiles[i]=T.ROAD;continue;}
      const landmark=candidate(s,p.x,p.y);
      if (landmark) {tiles[i]=landmark.tile;landmarks.push(landmark);continue;}
      const item=resourceAt(s,p.x,p.y,tick,opts.harvestedAt?.(p.x,p.y)??null);
      if (item) resources.push(item);
    }
    return {chunkX,chunkY,width:SIZE,height:SIZE,tiles,biomes,resources,landmarks};
  }
  return Object.freeze({SIZE,T,BIOMES,HERITAGE_CELL,REGEN_TICKS,
    climateAt,biomeAt,landmarkAt,resourceAt,generateEcologyChunk});
});