/* Persistent autonomous wilderness explorer. All supplies are physically gathered.
 * Camps belong to the expedition ledger; village stores are never remotely debited. */
(function(root,factory){"use strict";const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GodseedV3Expedition=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
  const Nav=typeof module!=="undefined"&&module.exports?require("./world_travel.js"):globalThis.GodseedV3WorldTravel;
  const ROUTE=Nav.itinerary(),EVENT_LIMIT=64,CAMP_LIMIT=56;
  const copy=x=>JSON.parse(JSON.stringify(x));
  const positive=n=>Number.isSafeInteger(n)&&n>=0;
  function create(){return {explorer:null,camps:[],discoveries:[],events:[],
    knownChunks:[],woodGathered:0,woodSpent:0,foodGathered:0,foodEaten:0,
    settlers:[],houses:[],settlerWoodGathered:0,settlerFoodGathered:0,settlerFoodEaten:0};}
  function record(s,tick,action,details,actor="world_taren"){
    s.events.push({tick,actor,action,details});
    if(s.events.length>EVENT_LIMIT)s.events.shift();
  }
  function mark(s,p){
    const id=Math.floor(p.x/16)+","+Math.floor(p.z/16);
    if(!s.knownChunks.includes(id))s.knownChunks.push(id);
  }
  function move(s,p){
    const c=s.explorer;c.x=p.x;c.z=p.z;c.energy=Math.max(0,c.energy-1);mark(s,c);
  }
  function goLocal(s,world,target,tick){
    const c=s.explorer;if(Nav.same(c,target))return true;
    const route=Nav.local(world,c,target,tick);
    if(route&&route.path.length)move(s,route.path[0]);
    else c.goal="buscar paso seguro";
    return false;
  }
  function gather(s,world,kind,tick){
    const c=s.explorer,route=Nav.resource(world,c,kind,tick);
    if(!route){c.goal=kind==="food"?"esperar frutos silvestres":"buscar otro bosque";return false;}
    if(route.path.length){move(s,route.path[0]);c.goal=kind==="food"?"buscar provisiones":"buscar madera para campamento";return true;}
    const accepted=kind==="wood"?world.harvest(c.x,c.z):world.forage(c.x,c.z,tick);
    if(!accepted){c.goal="recurso agotado";return false;}
    c.energy=Math.max(0,c.energy-1);
    if(kind==="wood"){c.wood++;s.woodGathered++;c.goal="talar para refugio";}
    else{c.food++;s.foodGathered++;c.goal="recolectar provisiones";}
    record(s,tick,kind==="wood"?"harvest":"forage",{x:c.x,z:c.z,amount:1});return true;
  }
  function arrive(s,world,tick){
    const c=s.explorer;c.anchor={x:c.x,z:c.z};c.stage="supply";
    const place=world.landmark(Math.floor(c.x/64),Math.floor(c.z/64));
    if(place&&!s.discoveries.some(d=>d.id===place.id)){
      s.discoveries.push({id:place.id,x:place.x,z:place.z,name:place.name,type:place.type,tick});
      record(s,tick,"discover",{id:place.id,name:place.name,x:c.x,z:c.z});
    }
    c.routeIndex++;c.goal="reconocer nueva región";
  }

  // First inhabited wilderness camp; Mira acts on the same world clock.
  // Wilderness inventory is owned per person, never by the distant village.
  function advanceSettler(s,world,tick){
    const camp=s.camps[0];if(!camp)return;
    if(!s.settlers.length){
      const c={id:"world_mira",name:"Mira",trait:"colona",worldSettler:true,
        homeCampId:camp.id,x:camp.x,z:camp.z,energy:20,hunger:90,health:100,
        alive:true,wood:0,food:0,goal:"establecer hogar",bornAt:tick};
      s.settlers.push(c);mark(s,c);
      record(s,tick,"settler_arrive",{campId:camp.id,x:c.x,z:c.z},c.id);return;
    }
    const c=s.settlers[0];if(!c.alive)return;
    if(tick%4===0){
      c.hunger=Math.max(0,c.hunger-1);
      if(c.hunger===0)c.health=Math.max(0,c.health-2);
      else if(c.hunger>60)c.health=Math.min(100,c.health+1);
      if(c.health===0){c.alive=false;c.goal="fallecida";
        record(s,tick,"settler_death",{},c.id);return;}
    }
    if(c.hunger<=62&&c.food>0){
      c.food--;s.foodEaten++;s.settlerFoodEaten++;
      c.hunger=Math.min(100,c.hunger+36);c.goal="comer provisiones";
      record(s,tick,"settler_eat",{foodSpent:1},c.id);return;
    }
    if(c.energy<4){
      c.energy=Math.min(20,c.energy+(s.houses.length?12:8));
      c.goal=s.houses.length?"descansar en casa":"descansar en campamento";return;
    }
    const gather=kind=>{
      const route=Nav.resource(world,c,kind,tick);
      if(!route){c.goal=kind==="food"?"buscar nuevos frutos":"buscar nuevos árboles";return;}
      if(route.path.length){
        const p=route.path[0];c.x=p.x;c.z=p.z;c.energy=Math.max(0,c.energy-1);
        mark(s,c);c.goal=kind==="food"?"recolectar alimentos":"reunir madera";return;
      }
      const done=kind==="wood"?world.harvest(c.x,c.z):world.forage(c.x,c.z,tick);
      if(!done){c.goal="recurso agotado";return;}
      c.energy=Math.max(0,c.energy-1);
      if(kind==="wood"){c.wood++;s.woodGathered++;s.settlerWoodGathered++;}
      else{c.food++;s.foodGathered++;s.settlerFoodGathered++;}
      c.goal=kind==="wood"?"madera reunida":"provisiones reunidas";
      record(s,tick,kind==="wood"?"settler_harvest":"settler_forage",
        {x:c.x,z:c.z,amount:1},c.id);
    };
    if(c.hunger<40&&c.food===0){gather("food");return;}
    if(c.food<3){gather("food");return;}
    if(!s.houses.length){
      if(c.wood<4){gather("wood");return;}
      // Distinct walkable site inside the seeded landmark plaza.
      const site={x:camp.anchorX-2,z:camp.anchorZ+2};
      if(!Nav.same(c,site)){
        const route=Nav.local(world,c,site,tick);
        if(!route||!route.path.length){c.goal="buscar acceso al solar";return;}
        const p=route.path[0];c.x=p.x;c.z=p.z;
        c.energy=Math.max(0,c.energy-1);mark(s,c);
        c.goal="transportar madera al solar";return;
      }
      c.wood-=4;s.woodSpent+=4;c.energy=Math.max(0,c.energy-3);
      s.houses.push({id:"frontier_home_1",type:"home",x:site.x,z:site.z,
        campId:camp.id,builder:c.id,completedAt:tick,name:"Casa de Mira"});
      c.goal="casa construida";
      record(s,tick,"settler_build",{id:"frontier_home_1",woodSpent:4,
        x:site.x,z:site.z},c.id);return;
    }
    c.goal="cuidar su comunidad";c.energy=Math.min(20,c.energy+1);
  }
  function migrateLegacy(state){
    if(!state||typeof state!=="object"||Array.isArray(state))return state;
    return Object.assign({},state,{settlers:[],houses:[],
      settlerWoodGathered:0,settlerFoodGathered:0,settlerFoodEaten:0});
  }
  function advance(s,world,homeland){
    const tick=homeland.tick;
    advanceSettler(s,world,tick);
    if(!s.explorer){
      // A developed homeland attracts one independent traveler, without creating a population on the atlas.
      if(tick<600||!homeland.structures.some(b=>b.type==="workshop"))return;
      s.explorer={id:"world_taren",name:"Taren",trait:"cartógrafo",worldExplorer:true,
        x:24,z:24,energy:20,hunger:90,health:100,alive:true,wood:0,food:0,
        anchor:{x:24,z:24},routeIndex:0,stage:"supply",goal:"preparar expedición",bornAt:tick};
      mark(s,s.explorer);record(s,tick,"expedition_arrive",{x:24,z:24});return;
    }
    const c=s.explorer;if(!c.alive)return;
    if(tick%4===0){
      c.hunger=Math.max(0,c.hunger-1);
      if(c.hunger===0)c.health=Math.max(0,c.health-2);
      else if(c.hunger>60)c.health=Math.min(100,c.health+1);
      if(c.health===0){c.alive=false;c.goal="fallecido";record(s,tick,"death",{});return;}
    }
    if(c.hunger<=62&&c.food){
      c.food--;s.foodEaten++;c.hunger=Math.min(100,c.hunger+36);c.goal="comer de la mochila";
      record(s,tick,"eat",{foodSpent:1});return;
    }
    if(c.energy<4){c.energy=Math.min(20,c.energy+8);c.goal="descansar en el camino";return;}
    if(c.hunger<40&&c.food===0){gather(s,world,"food",tick);return;}
    if(c.stage==="travel"){
      const target=ROUTE[c.routeIndex];
      if(!target){c.stage="supply";return;}
      if(Nav.same(c,target)){arrive(s,world,tick);return;}
      // Both region centers lie on the same continuous ancient road lattice.
      const step=Nav.roadStep(world,c,target);
      if(step){move(s,step);c.goal="viajar a región "+(c.routeIndex+1);}
      else{c.stage="return";c.goal="volver a camino seguro";}
      return;
    }
    const needsCamp=c.routeIndex>0&&(c.routeIndex-1)%4===0&&s.camps.length<CAMP_LIMIT&&
      !s.camps.some(b=>b.anchorX===c.anchor.x&&b.anchorZ===c.anchor.z);
    if(c.food<4){gather(s,world,"food",tick);return;}
    if(needsCamp&&c.wood<4){gather(s,world,"wood",tick);return;}
    if(needsCamp){
      const site={x:c.anchor.x+2,z:c.anchor.z+2};
      if(!goLocal(s,world,site,tick)){c.goal="llevar materiales a campamento";return;}
      c.wood-=4;s.woodSpent+=4;c.energy=Math.max(0,c.energy-3);
      const camp={id:"camp_"+c.routeIndex,type:"camp",x:site.x,z:site.z,
        anchorX:c.anchor.x,anchorZ:c.anchor.z,builder:c.id,completedAt:tick,
        name:"Refugio de ruta "+(s.camps.length+1)};
      s.camps.push(camp);c.goal="construir refugio de ruta";
      record(s,tick,"build_camp",{id:camp.id,woodSpent:4,x:site.x,z:site.z});return;
    }
    if(!goLocal(s,world,c.anchor,tick)){c.goal="volver al camino";return;}
    if(c.routeIndex>=ROUTE.length){c.goal="cuidar el último campamento";c.energy=Math.min(20,c.energy+2);return;}
    c.stage="travel";c.goal="partir hacia el horizonte";
  }
  function validate(s,world,tick,removedCount){
    if(!s||!Array.isArray(s.camps)||s.camps.length>CAMP_LIMIT||
      !Array.isArray(s.settlers)||s.settlers.length>1||
      !Array.isArray(s.houses)||s.houses.length>1||
      !Array.isArray(s.discoveries)||s.discoveries.length>ROUTE.length||
      !Array.isArray(s.events)||s.events.length>EVENT_LIMIT||
      !Array.isArray(s.knownChunks)||s.knownChunks.length>4096)return false;
    for(const k of ["woodGathered","woodSpent","foodGathered","foodEaten",
      "settlerWoodGathered","settlerFoodGathered","settlerFoodEaten"])
      if(!positive(s[k]))return false;
    if(s.woodSpent!==(s.camps.length+s.houses.length)*4||
      s.woodGathered!==removedCount||
      s.settlerWoodGathered>s.woodGathered||
      s.settlerFoodGathered>s.foodGathered||
      s.settlerFoodEaten>s.foodEaten)return false;
    const m=s.settlers[0],first=s.camps[0];
    if(!m){
      if(s.houses.length||s.settlerWoodGathered||
        s.settlerFoodGathered||s.settlerFoodEaten)return false;
    }else{
      if(!first||m.id!=="world_mira"||m.name!=="Mira"||
        m.trait!=="colona"||m.worldSettler!==true||
        m.homeCampId!==first.id||!positive(m.bornAt)||
        m.bornAt<first.completedAt||m.bornAt>tick||
        !world.walkable(m.x,m.z)||typeof m.goal!=="string"||
        m.goal.length>80)return false;
      for(const k of ["energy","hunger","health","food","wood"])
        if(!positive(m[k]))return false;
      if(m.energy>20||m.hunger>100||m.health>100||
        m.alive!==(m.health>0)||
        m.wood!==s.settlerWoodGathered-s.houses.length*4||
        m.food!==s.settlerFoodGathered-s.settlerFoodEaten)return false;
    }
    if(s.houses.length){
      const h=s.houses[0];
      if(!m||!h||h.id!=="frontier_home_1"||h.type!=="home"||
        h.x!==first.anchorX-2||h.z!==first.anchorZ+2||
        h.campId!==first.id||h.builder!==m.id||
        h.name!=="Casa de Mira"||!positive(h.completedAt)||
        h.completedAt<m.bornAt||h.completedAt>tick)return false;
    }
    const chunks=new Set();
    for(const id of s.knownChunks){
      if(typeof id!=="string"||!/^(-?\d+),(-?\d+)$/.test(id)||chunks.has(id))return false;
      const p=id.split(",").map(Number);
      if(p.some(v=>v< -32||v>31)||id!==p[0]+","+p[1])return false;chunks.add(id);
    }
    const c=s.explorer;
    if(c===null)return !s.camps.length&&!s.discoveries.length&&!s.events.length&&
      !s.settlers.length&&!s.houses.length&&
      !s.knownChunks.length&&!s.woodGathered&&!s.woodSpent&&!s.foodGathered&&!s.foodEaten;
    if(!c||c.id!=="world_taren"||c.name!=="Taren"||c.trait!=="cartógrafo"||c.worldExplorer!==true||
      !positive(c.bornAt)||c.bornAt<600||c.bornAt>tick||!world.walkable(c.x,c.z)||
      !c.anchor||!Number.isInteger(c.anchor.x)||!Number.isInteger(c.anchor.z)||
      c.anchor.x< -424||c.anchor.x>472||c.anchor.z< -424||c.anchor.z>472||
      (c.anchor.x-24)%64!==0||(c.anchor.z-24)%64!==0||
      !positive(c.routeIndex)||c.routeIndex>ROUTE.length||
      !["supply","return","travel"].includes(c.stage)||
      typeof c.goal!=="string"||c.goal.length>80)return false;
    for(const k of ["energy","hunger","health","food","wood"])if(!positive(c[k]))return false;
    if(c.energy>20||c.hunger>100||c.health>100||c.alive!==(c.health>0)||
      c.wood!==s.woodGathered-s.settlerWoodGathered-s.camps.length*4||
      c.food!==s.foodGathered-s.settlerFoodGathered-(s.foodEaten-s.settlerFoodEaten)||
      s.discoveries.length!==c.routeIndex||
      !chunks.has(Math.floor(c.x/16)+","+Math.floor(c.z/16))||
      (m&&!chunks.has(Math.floor(m.x/16)+","+Math.floor(m.z/16))))return false;
    const expected=c.routeIndex?ROUTE[c.routeIndex-1]:{x:24,z:24};
    if(!Nav.same(c.anchor,expected))return false;
    let previous=-1;
    for(let i=0;i<s.discoveries.length;i++){
      const d=s.discoveries[i],p=ROUTE[i],landmark=world.landmark(Math.floor(p.x/64),Math.floor(p.z/64));
      if(!d||!landmark||d.id!==landmark.id||d.name!==landmark.name||d.type!==landmark.type||
        !Nav.same(d,landmark)||!positive(d.tick)||d.tick<c.bornAt||d.tick>tick||d.tick<previous)return false;
      previous=d.tick;
    }
    const ids=new Set();previous=-1;
    for(const camp of s.camps){
      const index=s.camps.indexOf(camp)*4,d=s.discoveries[index];
      if(!camp||!d||camp.id!=="camp_"+(index+1)||camp.type!=="camp"||ids.has(camp.id)||
        camp.x!==d.x+2||camp.z!==d.z+2||camp.anchorX!==d.x||camp.anchorZ!==d.z||
        camp.builder!==c.id||!positive(camp.completedAt)||camp.completedAt<d.tick||
        camp.completedAt>tick||camp.completedAt<previous||
        camp.name!=="Refugio de ruta "+(s.camps.indexOf(camp)+1))return false;
      ids.add(camp.id);previous=camp.completedAt;
    }
    const actions=["expedition_arrive","harvest","forage","eat","discover","build_camp","death"];
    const residentActions=["settler_arrive","settler_forage","settler_harvest",
      "settler_eat","settler_build","settler_death"];
    previous=-1;
    for(const e of s.events){
      if(!e||!positive(e.tick)||e.tick>tick||e.tick<previous||
        !(e.actor===c.id&&e.tick>=c.bornAt&&actions.includes(e.action))&&
        !(m&&e.actor===m.id&&e.tick>=m.bornAt&&residentActions.includes(e.action))||
        !e.details||typeof e.details!=="object"||Array.isArray(e.details))return false;
      previous=e.tick;
    }
    return true;
  }
  return Object.freeze({create,advance,validate,migrateLegacy,snapshot:copy,ROUTE_LENGTH:ROUTE.length});
});
