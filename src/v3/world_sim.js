/* Large-world adapter: keep the existing settlement authoritative in its home
 * clearing; advance wilderness agents on the same clock, independently of camera. */
(function(root,factory){"use strict";const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GodseedV3WorldSim=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
  const node=typeof module!=="undefined"&&module.exports;
  const Society=node?require("./society.js"):globalThis.GodseedV3Society;
  const World=node?require("./world.js"):globalThis.GodseedV3World;
  const Expedition=node?require("./expedition.js"):globalThis.GodseedV3Expedition;
  const VERSION=6,STORAGE_KEY="godseed-v3-large-world-v1",SAVE_LIMIT=1500000;
  const copy=x=>JSON.parse(JSON.stringify(x));
  function instance(homeland,world,expedition){
    let home=homeland.snapshot(),sceneCache=null,sceneKey="";
    function snapshot(){
      const result=copy(home),c=expedition.explorer;
      if(c)result.citizens.push(copy(c));
      result.citizens=result.citizens.concat(copy(expedition.settlers));
      result.structures=result.structures.concat(copy(expedition.camps),copy(expedition.houses));
      result.roads=copy(expedition.roads);
      result.events=result.events.concat(copy(expedition.events)).sort((a,b)=>a.tick-b.tick).slice(-96);
      result.expedition=Expedition.snapshot(expedition);
      result.world={size:World.SIZE,min:World.MIN,max:World.MAX,tileCount:World.SIZE*World.SIZE,
        chunkSize:World.CHUNK,regionSize:World.REGION,regions:256,
        discoveredRegions:expedition.discoveries.length,knownChunks:expedition.knownChunks.length,
        biome:World.terrain(home.seed,c?c.x:5,c?c.z:5).biome,
        homelandCitizens:home.citizens.length,camps:expedition.camps.length,
        frontierResidents:expedition.settlers.length,frontierHomes:expedition.houses.length,
        constructedRoads:expedition.roads.length,
        socialConnections:expedition.social.ties.length,
        activeConstruction:expedition.projects.entries.filter(p=>p.status==="active").length,
        completedWorkOrders:expedition.projects.entries.filter(p=>p.status==="complete").length};
      return result;
    }
    function advance(n){
      if(!Number.isSafeInteger(n)||n<0||n>20000)throw RangeError("invalid world steps");
      for(let i=0;i<n;i++){
        home=homeland.advance(1);
        Expedition.advance(expedition,world,home);
        Expedition.advanceSocial(expedition,home.tick);
      }
      sceneCache=null;return snapshot();
    }
    function scene(x,z,half){
      if(!Number.isFinite(x)||!Number.isFinite(z)||!Number.isFinite(half))throw RangeError("invalid camera window");
      // A four-cell camera grid avoids rebuilding terrain on every pointer pixel.
      const cx=Math.max(World.MIN,Math.min(World.MAX,Math.round(x/4)*4));
      const cz=Math.max(World.MIN,Math.min(World.MAX,Math.round(z/4)*4));
      const radius=Math.max(16,Math.min(32,Math.ceil(half/4)*4));
      const id=home.tick+":"+cx+":"+cz+":"+radius;
      if(sceneCache&&sceneKey===id)return sceneCache;
      const result=snapshot(),visible=p=>Math.abs(p.x-cx)<=radius&&Math.abs(p.z-cz)<=radius;
      result.terrain=world.windowAt(cx,cz,radius,home.tick);
      // Apply only completed, paid NPC roads as presentation overlays.
      // The terrain generator remains authoritative for collision and geography.
      const made=new Set(expedition.roads.map(p=>p.x+","+p.z));
      for(const tile of result.terrain)if(made.has(tile.x+","+tile.z)){
        tile.kind="road";tile.color=[.58,.43,.29];
      }
      result.forest=home.forest.filter(visible).map(p=>Object.assign({},p));
      result.bushes=home.bushes.filter(visible).map(p=>Object.assign({},p));
      for(const tile of result.terrain){
        if(tile.tree)result.forest.push({x:tile.x,z:tile.z,biome:tile.biome});
        if(tile.bush)result.bushes.push({x:tile.x,z:tile.z,berries:tile.berries});
      }
      result.structures=result.structures.filter(visible);
      result.citizens=result.citizens.filter(visible);
      result.landmarks=[];
      for(let rz=Math.floor((cz-radius)/64);rz<=Math.floor((cz+radius)/64);rz++)
        for(let rx=Math.floor((cx-radius)/64);rx<=Math.floor((cx+radius)/64);rx++){
          const place=world.landmark(rx,rz);if(place&&visible(place))result.landmarks.push(place);
        }
      result.sceneKey=id;result.renderRadius=radius;result.worldCenter={x:cx,z:cz};
      sceneCache=result;sceneKey=id;return result;
    }
    function serialize(){
      const value={schemaVersion:VERSION,seed:home.seed,homeland:JSON.parse(homeland.serialize()),
        wilderness:world.save(home.tick),expedition:Expedition.snapshot(expedition)};
      const raw=JSON.stringify(value);if(raw.length>SAVE_LIMIT)throw RangeError("world save quota exceeded");return raw;
    }
    return Object.freeze({snapshot,advance,scene,serialize,
      terrain:(x,z)=>world.sample(x,z,home.tick),region:(x,z)=>world.region(x,z),
      metrics:()=>world.metrics()});
  }
  function create(seed){return instance(Society.create(seed),World.create(seed),Expedition.create());}
  function fromSociety(raw){
    const homeland=Society.restore(raw),seed=homeland.snapshot().seed;
    return instance(homeland,World.create(seed),Expedition.create());
  }
  function restore(raw){
    if(typeof raw!=="string"||raw.length>SAVE_LIMIT)throw RangeError("invalid large-world save");
    const s=JSON.parse(raw);
    if(!s||![1,2,3,4,5,VERSION].includes(s.schemaVersion)||!s.homeland||
      s.seed!==s.homeland.seed||!s.wilderness)
      throw RangeError("incompatible large-world save");
    const homeland=Society.restore(JSON.stringify(s.homeland)),tick=homeland.snapshot().tick;
    const world=World.create(s.seed,s.wilderness);
    const expedition=s.schemaVersion===VERSION?s.expedition:
      Expedition.migrateV5(s.schemaVersion===5?s.expedition:
        Expedition.migrateV4(s.schemaVersion===1?Expedition.migrateLegacy(s.expedition):
          s.schemaVersion===2?Expedition.migrateV2(s.expedition):
          s.schemaVersion===3?Expedition.migrateV3(s.expedition):s.expedition),tick);
    if(s.wilderness.berries.some(b=>b.at>tick)||
      !Expedition.validate(expedition,world,tick,s.wilderness.removed.length))
      throw RangeError("invalid wilderness progress");
    return instance(homeland,world,copy(expedition));
  }
  return Object.freeze({VERSION,STORAGE_KEY,create,restore,fromSociety});
});
