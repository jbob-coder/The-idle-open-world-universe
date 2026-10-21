/* Seeded V3 wilderness. Coordinates, not load order, own terrain identity.
 * Only depleted resources are persistent; chunk eviction never resets them. */
(function(root,factory){"use strict";const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GodseedV3World=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
  const VERSION=1,SIZE=1024,MIN=-512,MAX=511,CHUNK=16,REGION=64;
  const CACHE_LIMIT=48,EDIT_LIMIT=8192,BERRY_PERIOD=40;
  const BIOMES=Object.freeze({
    meadow:{name:"Praderas",color:[.32,.48,.25],trees:9},
    forest:{name:"Bosque antiguo",color:[.18,.36,.22],trees:34},
    marsh:{name:"Humedales",color:[.30,.40,.28],trees:12},
    desert:{name:"Tierras ocres",color:[.65,.53,.33],trees:2},
    highland:{name:"Sierra de piedra",color:[.43,.45,.41],trees:4},
    taiga:{name:"Bosque boreal",color:[.40,.53,.47],trees:20},
    water:{name:"Ríos y lagos",color:[.15,.36,.48],trees:0}
  });
  const key=(x,z)=>x+","+z;
  const integer=n=>Number.isSafeInteger(n);
  const inside=(x,z)=>integer(x)&&integer(z)&&x>=MIN&&x<=MAX&&z>=MIN&&z<=MAX;
  const home=(x,z)=>x>=0&&x<20&&z>=0&&z<20;
  const mod=(n,d)=>((n%d)+d)%d;
  const clamp=n=>Math.max(MIN,Math.min(MAX,n));
  function hash(seed,x,z,salt){
    let h=(seed^Math.imul(x,374761393)^Math.imul(z,668265263)^salt)>>>0;
    h=Math.imul(h^(h>>>13),1274126177);return (h^(h>>>16))>>>0;
  }
  function noise(seed,x,z,scale,salt){
    const ix=Math.floor(x/scale),iz=Math.floor(z/scale);
    let tx=x/scale-ix,tz=z/scale-iz;
    tx=tx*tx*(3-2*tx);tz=tz*tz*(3-2*tz);
    const a=hash(seed,ix,iz,salt)/4294967295,b=hash(seed,ix+1,iz,salt)/4294967295;
    const c=hash(seed,ix,iz+1,salt)/4294967295,d=hash(seed,ix+1,iz+1,salt)/4294967295;
    return (a+(b-a)*tx)*(1-tz)+(c+(d-c)*tx)*tz;
  }
  const road=(x,z)=>mod(x-24,32)===0||mod(z-24,32)===0;
  function landmark(seed,rx,rz){
    if(!integer(rx)||!integer(rz)||rx< -8||rx>7||rz< -8||rz>7||(rx===0&&rz===0))return null;
    const h=hash(seed,rx,rz,7703),types=["ruin","stones","spring","watchtower"];
    const names=["Ruinas","Círculo de piedras","Manantial","Torre antigua"];
    const suffix=["del Alba","del Musgo","de Ceniza","de la Bruma","del Roble","del Eco"];
    const i=h%types.length;
    return {id:"landmark_"+rx+"_"+rz,x:rx*REGION+24,z:rz*REGION+24,
      type:types[i],name:names[i]+" "+suffix[(h>>>8)%suffix.length],rx,rz};
  }
  function region(seed,x,z){
    const rx=Math.floor(x/REGION),rz=Math.floor(z/REGION);
    const h=hash(seed,rx,rz,1709);
    const names=["Valle","Marca","Cuenca","Tierras","Llanura","Confín"];
    const suffix=["del Alba","Esmeralda","del Viento","Olvidado","Gris","del Norte"];
    return {rx,rz,name:rx===0&&rz===0?"Valle de la Primera Aldea":
      names[h%names.length]+" "+suffix[(h>>>9)%suffix.length],landmark:landmark(seed,rx,rz)};
  }
  function terrain(seed,x,z){
    if(!inside(x,z))return null;
    const apron=x>=-3&&x<=22&&z>=-3&&z<=22;
    const rx=Math.floor(x/REGION),rz=Math.floor(z/REGION),lx=rx*REGION+24,lz=rz*REGION+24;
    const plaza=Math.abs(x-lx)<=3&&Math.abs(z-lz)<=3;
    const supplyBush=(x===lx+4||x===lx+5)&&z===lz+1;
    const supplyTree=x===lx+1&&z>=lz+4&&z<=lz+7;
    const provision=supplyBush||supplyTree;
    const elevation=noise(seed,x,z,128,911)*.68+noise(seed,x,z,40,193)*.32;
    const wet=noise(seed,x,z,72,4409),heat=noise(seed,x,z,112,1907)*.6+(z-MIN)/SIZE*.4;
    const river=mod(x+Math.round(Math.sin(z/27+seed%13)*9+noise(seed,0,z,80,883)*28),192);
    const isWater=!apron&&!plaza&&!provision&&(elevation<.27||river<3);
    const path=road(x,z)&&!home(x,z);
    let biome=isWater?"water":elevation>.69?"highland":heat<.30?"taiga":
      heat>.60&&wet<.43?"desert":wet>.68?"marsh":wet>.46?"forest":"meadow";
    if(apron||plaza||provision)biome="meadow";
    const h=hash(seed,x,z,6721),rock=!apron&&!plaza&&!provision&&!path&&!isWater&&
      (elevation>.77||biome==="highland"&&h%9===0);
    const height=apron||plaza||provision?0:isWater?(path ? .20 : 0):Math.round(Math.max(0,elevation-.3)*10)*.25;
    const tree=!supplyBush&&!apron&&!plaza&&!path&&!isWater&&!rock&&h%100<BIOMES[biome].trees;
    // Wayside fruit and timber make long routes supportable without magic rations.
    const wayside=!path&&!apron&&!isWater&&!rock&&
      (mod(x-24,32)===1||mod(z-24,32)===1);
    const bush=!supplyTree&&!tree&&!home(x,z)&&!isWater&&!rock&&
      (supplyBush||wayside&&h%4===0||!apron&&!plaza&&!path&&h%29===0);
    const resourceTree=supplyTree||tree||(!tree&&!bush&&wayside&&h%3===0&&!plaza);
    const color=path?(isWater?[.55,.43,.28]:[.53,.46,.31]):rock?[.47,.47,.44]:BIOMES[biome].color;
    const variation=((h>>>16)%7-3)*.009;
    return Object.freeze({x,z,height,biome,kind:path?(isWater?"bridge":"road"):
      isWater?"water":rock?"rock":"ground",walkable:(!isWater||path)&&!rock,
      tree:resourceTree,bush,color:color.map(c=>Math.max(0,Math.min(1,c+variation)))});
  }
  function create(seed,saved){
    if(!integer(seed)||seed<0||seed>0xffffffff)throw RangeError("invalid world seed");
    const cache=new Map(),removed=new Set(),berries=new Map();let revision=0;
    if(saved){
      if(saved.generatorVersion!==VERSION||!Array.isArray(saved.removed)||
        !Array.isArray(saved.berries)||saved.removed.length+saved.berries.length>EDIT_LIMIT)
        throw RangeError("invalid wilderness save");
      for(const p of saved.removed){
        if(!p||!inside(p.x,p.z)||home(p.x,p.z)||!terrain(seed,p.x,p.z).tree||removed.has(key(p.x,p.z)))
          throw RangeError("invalid harvested tree");
        removed.add(key(p.x,p.z));
      }
      for(const b of saved.berries){
        if(!b||!inside(b.x,b.z)||!terrain(seed,b.x,b.z).bush||
          !integer(b.amount)||b.amount<0||b.amount>3||!integer(b.at)||b.at<0||berries.has(key(b.x,b.z)))
          throw RangeError("invalid berry patch");
        berries.set(key(b.x,b.z),{x:b.x,z:b.z,amount:b.amount,at:b.at});
      }
    }
    function base(x,z){
      if(!inside(x,z))return null;
      const cx=Math.floor(x/CHUNK),cz=Math.floor(z/CHUNK),id=key(cx,cz);
      let chunk=cache.get(id);
      if(chunk){cache.delete(id);cache.set(id,chunk);}
      else{
        chunk=[];
        for(let dz=0;dz<CHUNK;dz++)for(let dx=0;dx<CHUNK;dx++)
          chunk.push(terrain(seed,cx*CHUNK+dx,cz*CHUNK+dz));
        cache.set(id,chunk);
        if(cache.size>CACHE_LIMIT)cache.delete(cache.keys().next().value);
      }
      return chunk[mod(z,CHUNK)*CHUNK+mod(x,CHUNK)];
    }
    function berryCount(x,z,tick){
      const b=berries.get(key(x,z));
      return b?Math.min(3,b.amount+Math.max(0,Math.floor((tick-b.at)/BERRY_PERIOD))):3;
    }
    function sample(x,z,tick){
      const t=base(x,z);if(!t)return null;
      return Object.assign({},t,{color:t.color.slice(),tree:t.tree&&!removed.has(key(x,z)),
        berries:t.bush?berryCount(x,z,tick):0});
    }
    function harvest(x,z){
      const t=base(x,z),id=key(x,z);
      if(!t||!t.tree||home(x,z)||removed.has(id)||removed.size+berries.size>=EDIT_LIMIT)return false;
      removed.add(id);revision++;return true;
    }
    function forage(x,z,tick){
      const t=base(x,z),id=key(x,z);
      if(!t||!t.bush||!integer(tick)||tick<0||
        (!berries.has(id)&&removed.size+berries.size>=EDIT_LIMIT))return false;
      const amount=berryCount(x,z,tick);if(amount<1)return false;
      const previous=berries.get(id);
      const at=!previous||amount===3?tick:
        previous.at+Math.floor((tick-previous.at)/BERRY_PERIOD)*BERRY_PERIOD;
      berries.set(id,{x,z,amount:amount-1,at});revision++;return true;
    }
    function windowAt(x,z,half,tick){
      x=Math.round(clamp(x));z=Math.round(clamp(z));half=Math.max(12,Math.min(32,Math.ceil(half)));
      const cells=[];
      for(let tz=Math.max(MIN,z-half);tz<=Math.min(MAX,z+half);tz++)
        for(let tx=Math.max(MIN,x-half);tx<=Math.min(MAX,x+half);tx++)cells.push(sample(tx,tz,tick));
      return cells;
    }
    function save(tick){
      // Fully regrown patches need no delta. Depleted trees remain persistent.
      for(const [id,b] of berries)if(berryCount(b.x,b.z,tick)===3)berries.delete(id);
      return {generatorVersion:VERSION,removed:Array.from(removed,id=>{
        const p=id.split(",").map(Number);return {x:p[0],z:p[1]};
      }),berries:Array.from(berries.values(),b=>Object.assign({},b))};
    }
    return Object.freeze({sample,harvest,forage,windowAt,save,
      walkable:(x,z)=>{const t=base(x,z);return !!t&&t.walkable;},
      metrics:()=>({cachedChunks:cache.size,chunkLimit:CACHE_LIMIT,resourceEdits:removed.size+berries.size,revision}),
      region:(x,z)=>region(seed,x,z),landmark:(rx,rz)=>landmark(seed,rx,rz)});
  }
  return Object.freeze({VERSION,SIZE,MIN,MAX,CHUNK,REGION,CACHE_LIMIT,EDIT_LIMIT,BIOMES,
    inside,home,road,terrain,region,landmark,create});
});
