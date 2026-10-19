/* GODSEED WLD-007: lossless legacy 64x48 save window in a seeded chunk world.
 * Opt-in bridge: never replaces the authoritative v1 save key or tick loop.
 * Interior NPC/household state remains owned by GodseedSim.
 */
(function(root,factory){
  "use strict";
  const chunks=typeof module!=="undefined"&&module.exports
    ?require("./chunks.js"):root.GodseedChunks;
  const sparse=typeof module!=="undefined"&&module.exports
    ?require("./chunk_store.js"):root.GodseedChunkStore;
  const sim=typeof module!=="undefined"&&module.exports
    ?require("../sim.js"):root.GodseedSim;
  const api=factory(chunks,sparse,sim);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GodseedLegacyWorld=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Chunks,Store,Sim){
  "use strict";
  if(!Chunks||!Store||!Sim||typeof Sim.restore!=="function")
    throw new Error("WLD-007 requires chunks, chunk store and v1 simulator");
  const SCHEMA=1,MAX_LEGACY_BYTES=1000000,MAX_ENVELOPE_BYTES=5200000;
  const WINDOW=Object.freeze({x:0,y:0,width:Sim.W,height:Sim.H});
  const SITE_ID=/^[a-z][a-z0-9:_-]{0,63}$/i;
  function inside(x,y){return x>=0&&x<Sim.W&&y>=0&&y<Sim.H;}
  function validPos(x,y){return Number.isSafeInteger(x)&&Number.isSafeInteger(y);}
  function cleanLegacy(raw){
    if(typeof raw!=="string"||raw.length>MAX_LEGACY_BYTES)
      throw new RangeError("v1 save must be a bounded JSON string");
    const world=Sim.restore(raw);
    if(!world||!Sim.validate(world))throw new RangeError("invalid version-1 saved world");
    return world;
  }
  function sites(world){
    const found=[],ids=new Set();
    const towns=world.living&&Array.isArray(world.living.towns)?world.living.towns:[];
    if(towns.length>32)throw new RangeError("legacy town count exceeds 32");
    for(const town of towns){
      if(!town||typeof town.id!=="string"||!SITE_ID.test(town.id)||
         !validPos(town.x,town.y)||!inside(town.x,town.y)||
         !Array.isArray(town.buildings)||town.buildings.length>32)
        throw new RangeError("invalid legacy settlement");
      const tid="legacy:town:"+town.id;
      if(ids.has(tid))throw new RangeError("duplicate legacy settlement ID");
      ids.add(tid);
      found.push({id:tid,kind:"settlement",type:"village",x:town.x,y:town.y,
        label:String(town.name||town.id).slice(0,80),townId:null});
      for(const building of town.buildings){
        if(!building||typeof building.id!=="string"||!SITE_ID.test(building.id)||
           typeof building.type!=="string"||!SITE_ID.test(building.type)||
           !validPos(building.x,building.y)||!inside(building.x,building.y)||
           !Number.isInteger(building.w)||!Number.isInteger(building.h)||
           building.w<1||building.h<1||
           !inside(building.x+building.w-1,building.y+building.h-1))
          throw new RangeError("invalid legacy building footprint");
        const bid="legacy:building:"+building.id;
        if(ids.has(bid))throw new RangeError("duplicate legacy building ID");
        ids.add(bid);
        found.push({id:bid,kind:"building",type:building.type,
          x:building.x,y:building.y,label:building.type.slice(0,80),townId:town.id});
      }
    }
    return found;
  }
  class Bridge {
    constructor(world,store){
      if(store.seed!==world.worldSeed)
        throw new RangeError("legacy seed and expanded chunk seed disagree");
      this._legacy=Sim.serialize(world);
      this._world=world;
      this._store=store;
      this._sites=sites(world);
    }
    legacyState(){
      return Sim.restore(this._legacy); // Defensive copy; no live-world mutations.
    }
    tileAt(x,y){
      if(!validPos(x,y))throw new RangeError("world coordinates must be safe integers");
      return inside(x,y)?this._world.map[y*Sim.W+x]:this._store.tileAt(x,y);
    }
    chunkAt(cx,cy){
      const chunk=this._store.chunkAt(cx,cy),origin=Chunks.chunkToWorld(cx,cy,0,0);
      // Copy the actual historical tiles over procedural samples. Do not
      // materialize or store 3072 changed tiles as sparse 256-cell deltas.
      const minX=Math.max(origin.x,0),minY=Math.max(origin.y,0);
      const maxX=Math.min(origin.x+Chunks.SIZE,Sim.W);
      const maxY=Math.min(origin.y+Chunks.SIZE,Sim.H);
      for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++)
        chunk.tiles[(y-origin.y)*Chunks.SIZE+x-origin.x]=this._world.map[y*Sim.W+x];
      chunk.sites=this.sitesAt(cx,cy);
      return chunk;
    }
    setTile(x,y,tile){
      if(!validPos(x,y))throw new RangeError("world coordinates must be safe integers");
      if(inside(x,y))throw new RangeError("historic v1 window is authoritative and read-only");
      return this._store.setTile(x,y,tile);
    }
    putSite(raw){
      if(!raw||!validPos(raw.x,raw.y)||inside(raw.x,raw.y)||
         typeof raw.id!=="string"||raw.id.startsWith("legacy:"))
        throw new RangeError("expanded site must be outside the historic window");
      return this._store.putSite(raw);
    }
    site(id){
      const local=this._sites.find(p=>p.id===id);
      return local?{...local}:this._store.site(id);
    }
    sitesAt(cx,cy){
      Chunks.chunkToWorld(cx,cy,0,0);
      const natural=this._sites.filter(p=>{
        const at=Chunks.worldToChunk(p.x,p.y);
        return at.chunkX===cx&&at.chunkY===cy;
      });
      return [...natural,...this._store.sitesAt(cx,cy)].map(p=>({...p}))
        .sort((a,b)=>a.id.localeCompare(b.id));
    }
    evictAll(){this._store.evictAll();}
    stats(){return {...this._store.stats(),legacyCells:Sim.N,legacySites:this._sites.length};}
    snapshot(){
      return {schemaVersion:SCHEMA,legacy:JSON.parse(this._legacy),
        sparse:this._store.snapshot()};
    }
    serialize(){
      const result=JSON.stringify(this.snapshot());
      if(result.length>MAX_ENVELOPE_BYTES)throw new RangeError("expanded save quota exceeded");
      return result;
    }
  }
  function importLegacy(raw,options){
    const world=cleanLegacy(raw);
    return new Bridge(world,Store.create(world.worldSeed,options));
  }
  function restoreExpanded(raw,options){
    if(typeof raw!=="string"||raw.length>MAX_ENVELOPE_BYTES)
      throw new RangeError("expanded save must be bounded JSON");
    const doc=JSON.parse(raw);
    if(!doc||Array.isArray(doc)||doc.schemaVersion!==SCHEMA||
       !doc.legacy||typeof doc.legacy!=="object"||Array.isArray(doc.legacy)||
       !doc.sparse||typeof doc.sparse!=="object"||Array.isArray(doc.sparse))
      throw new RangeError("invalid expanded save envelope");
    const legacy=JSON.stringify(doc.legacy),world=cleanLegacy(legacy);
    if(doc.sparse.seed!==world.worldSeed)throw new RangeError("conflicting seed");
    const store=Store.restore(JSON.stringify(doc.sparse),options);
    // Never allow an untrusted expanded snapshot to override the historic
    // 64x48 tile map or replace the legacy villages with duplicate sites.
    for(const patch of doc.sparse.patches){
      for(const pair of patch.tiles){
        const xy=Chunks.chunkToWorld(patch.chunkX,patch.chunkY,
          pair[0]%Chunks.SIZE,Math.floor(pair[0]/Chunks.SIZE));
        if(inside(xy.x,xy.y))throw new RangeError("overlapping legacy tile patch");
      }
      for(const site of patch.sites){
        if(inside(site.x,site.y)||site.id.startsWith("legacy:"))
          throw new RangeError("overlapping legacy site");
      }
    }
    return new Bridge(world,store);
  }
  return Object.freeze({SCHEMA,WINDOW,MAX_LEGACY_BYTES,MAX_ENVELOPE_BYTES,
    importLegacy,restoreExpanded});
});
