/* Persistent autonomous wilderness explorer. All supplies are physically gathered.
 * Camps belong to the expedition ledger; village stores are never remotely debited. */
(function(root,factory){"use strict";const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GodseedV3Expedition=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
  const Nav=typeof module!=="undefined"&&module.exports?require("./world_travel.js"):globalThis.GodseedV3WorldTravel;
  const Infra=typeof module!=="undefined"&&module.exports?require("./infrastructure.js"):globalThis.GodseedV3Infrastructure;
  const Agency=typeof module!=="undefined"&&module.exports?require("./agency.js"):globalThis.GodseedV3Agency;
  const Discovery=typeof module!=="undefined"&&module.exports?require("./discovery.js"):globalThis.GodseedV3Discovery;
  const Social=typeof module!=="undefined"&&module.exports?require("./social.js"):globalThis.GodseedV3Social;
  const Projects=typeof module!=="undefined"&&module.exports?require("./projects.js"):globalThis.GodseedV3Projects;
  const ROUTE=Nav.itinerary(),EVENT_LIMIT=64,CAMP_LIMIT=56;
  const copy=x=>JSON.parse(JSON.stringify(x));
  const positive=n=>Number.isSafeInteger(n)&&n>=0;
  function create(){return {explorer:null,camps:[],discoveries:[],events:[],
    knownChunks:[],woodGathered:0,woodSpent:0,foodGathered:0,foodEaten:0,
    settlers:[],houses:[],roads:[],social:Social.create(),projects:Projects.create(),settlerWoodGathered:0,settlerFoodGathered:0,settlerFoodEaten:0};}
  function record(s,tick,action,details,actor="world_taren"){
    s.events.push({tick,actor,action,details});
    if(s.events.length>EVENT_LIMIT)s.events.shift();
    if(actor==="world_mira"&&s.settlers.length)Agency.remember(s.settlers[0].mind,tick,action,details);
    if(actor==="world_taren"&&s.explorer&&s.explorer.mind)
      Agency.remember(s.explorer.mind,tick,action,details);
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
    c.routeIndex++;
    if(c.routeMode==="free")c.target=null;
    c.goal="reconocer nueva región";
  }

  // First inhabited wilderness camp; Mira acts on the same world clock.
  // Wilderness inventory is owned per person, never by the distant village.
  function advanceSettler(s,world,tick){
    const camp=s.camps[0];if(!camp)return;
    if(!s.settlers.length){
      const c={id:"world_mira",name:"Mira",trait:"colona",worldSettler:true,
        homeCampId:camp.id,x:camp.x,z:camp.z,energy:20,hunger:90,health:100,
        alive:true,wood:0,food:0,goal:"establecer hogar",bornAt:tick};
      c.mind=Agency.create(c.id,camp.x,camp.z);
      c.homeSite=Infra.chooseHomeSite(world,camp,c.mind.preferences,tick);
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
    const site=s.houses.length
      ?Infra.next(world,s.camps.filter(b=>b.id===c.homeCampId).concat(s.houses),s.roads,tick):null;
    const decision=Agency.decide(c.mind,{hunger:c.hunger,energy:c.energy,
      food:c.food,wood:c.wood,hasHome:s.houses.length>0,roadPending:!!site,
      homeProject:!!Projects.find(s.projects,"home",c.homeSite||camp)});
    Agency.commitChoice(c.mind,decision.action);
    if(decision.action==="forage"){gather("food");return;}
    if(decision.action==="gather_wood"){gather("wood");return;}
    if(decision.action==="build_home"){
      const place=c.homeSite;
      if(!place){c.goal="investigar un terreno seguro";return;}
      if(!Nav.same(c,place)){
        const route=Nav.local(world,c,place,tick);
        if(!route||!route.path.length){c.goal="buscar acceso al terreno";return;}
        const p=route.path[0];c.x=p.x;c.z=p.z;
        c.energy=Math.max(0,c.energy-1);mark(s,c);
        c.goal="trasladar madera al hogar";return;
      }
      const task=Projects.propose(s.projects,"home",place,c.id,tick);
      if(!task){c.goal="esperar una obra disponible";return;}
      const step=Projects.contribute(s.projects,task,c,tick);
      if(!step.worked){c.goal="obtener madera para la obra";return;}
      s.woodSpent+=step.woodSpent;c.goal="construir vivienda ("+task.progress+"/"+task.required+")";
      if(step.completed){
        s.houses.push({id:"frontier_home_1",type:"home",x:place.x,z:place.z,
          campId:camp.id,builder:c.id,completedAt:tick,name:"Casa de Mira"});
        c.goal="completé mi hogar";
        record(s,tick,"settler_build",{id:"frontier_home_1",woodSpent:task.required,
          x:place.x,z:place.z},c.id);
      }
      return;
    }
    if(decision.action==="build_road"&&site){
      if(!Nav.same(c,site)){
        const route=Nav.local(world,c,site,tick);
        if(!route||!route.path.length){c.goal="buscar acceso a la obra vial";return;}
        const p=route.path[0];c.x=p.x;c.z=p.z;
        c.energy=Math.max(0,c.energy-1);mark(s,c);
        c.goal="transportar madera al camino";return;
      }
      const task=Projects.propose(s.projects,"road",site,c.id,tick);
      if(!task){c.goal="esperar una obra disponible";return;}
      const step=Projects.contribute(s.projects,task,c,tick);
      if(!step.worked){c.goal="buscar materiales para el camino";return;}
      s.woodSpent+=step.woodSpent;c.goal="trabajar en camino";
      if(step.completed){
        s.roads.push({x:site.x,z:site.z,type:"road",material:"timber",
          builder:c.id,completedAt:tick});
        record(s,tick,"settler_build_road",{x:site.x,z:site.z,woodSpent:task.required},c.id);
      }
      return;
    }
    if(decision.action==="explore"){
      // Exploration is an optional choice after shelter. Deterministic interests
      // change the direction; camera/player commands never select a destination.
      const home=c.homeSite||camp,turn=Math.floor(tick/22);
      const place={x:home.x+((turn+c.mind.preferences.curiosity)%5)-2,
        z:home.z+((turn+c.mind.preferences.security)%5)-2};
      if(world.walkable(place.x,place.z)&&!Nav.same(c,place)){
        const route=Nav.local(world,c,place,tick);
        if(route&&route.path.length){
          c.x=route.path[0].x;c.z=route.path[0].z;
          c.energy=Math.max(0,c.energy-1);mark(s,c);
          c.goal="explorar por curiosidad";return;
        }
      }
      c.goal="observar el terreno";
      if(tick%22===0)record(s,tick,"settler_explore",{x:c.x,z:c.z},c.id);
      c.energy=Math.min(20,c.energy+1);return;
    }
    c.goal="descansar y pensar";c.energy=Math.min(20,c.energy+1);
  }
  function migrateLegacy(state){
    if(!state||typeof state!=="object"||Array.isArray(state))return state;
    return Object.assign({},state,{settlers:[],houses:[],roads:[],
      settlerWoodGathered:0,settlerFoodGathered:0,settlerFoodEaten:0});
  }
  function migrateV3(state){
    if(!state||typeof state!=="object"||Array.isArray(state))return state;
    const migrated=Object.assign({},state,{settlers:state.settlers.map(c=>Object.assign({},c))});
    const m=migrated.settlers[0],camp=migrated.camps[0],house=migrated.houses[0];
    if(m&&camp){
      m.mind=Agency.create(m.id,camp.x,camp.z);
      // Historical houses cannot move merely because a save was loaded.
      m.homeSite=house?{x:house.x,z:house.z}:
        {x:camp.anchorX-2,z:camp.anchorZ+2};
    }
    return migrated;
  }
  function migrateV2(state){
    if(!state||typeof state!=="object"||Array.isArray(state))return state;
    return migrateV3(Object.assign({},state,{roads:[]}));
  }
  // Existing travelers retain their actual route and personal history.
  // A version-4 save is not silently rewritten into another journey.
  function migrateV4(state){
    if(!state||typeof state!=="object"||Array.isArray(state))return state;
    const previous=copy(state);
    if(previous.explorer){
      previous.explorer.routeMode="legacy";
      previous.explorer.target=null;
      previous.explorer.mind=null;
    }
    previous.social=Social.create();
    return previous;
  }
  function migrateV5(state,tick){
    const previous=copy(state);
    // Older buildings were completed before work-order recording existed.
    // Do not invent imaginary historical workers or timber transfers.
    previous.projects=Projects.create(tick);
    return previous;
  }
  function advanceSocial(s,tick){return Social.advance(s,tick,record);}
  function advance(s,world,homeland){
    const tick=homeland.tick;
    advanceSettler(s,world,tick);
    if(!s.explorer){
      // A developed homeland attracts one independent traveler, without creating a population on the atlas.
      if(tick<600||!homeland.structures.some(b=>b.type==="workshop"))return;
      s.explorer={id:"world_taren",name:"Taren",trait:"cartógrafo",worldExplorer:true,
        x:24,z:24,energy:20,hunger:90,health:100,alive:true,wood:0,food:0,
        anchor:{x:24,z:24},routeIndex:0,stage:"supply",goal:"preparar expedición",bornAt:tick};
      s.explorer.routeMode="free";
      s.explorer.target=null;
      s.explorer.mind=Agency.create(s.explorer.id,24,24);
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
      const target=c.routeMode==="free"?c.target:ROUTE[c.routeIndex];
      if(!target){c.stage="supply";return;}
      if(Nav.same(c,target)){arrive(s,world,tick);return;}
      // Both region centers lie on the same continuous ancient road lattice.
      const step=Nav.roadStep(world,c,target);
      if(step){move(s,step);c.goal="viajar a región "+(c.routeIndex+1);}
      else{c.stage="return";c.goal="volver a camino seguro";}
      return;
    }
    const needsCamp=c.routeMode==="free"?
      (c.routeIndex>0&&s.camps.length<CAMP_LIMIT&&
       !s.camps.some(b=>b.anchorX===c.anchor.x&&b.anchorZ===c.anchor.z)&&
       (s.camps.length===0||Math.min(...s.camps.map(b=>
         Nav.distance({x:b.anchorX,z:b.anchorZ},c.anchor)))>=160)):
      (c.routeIndex>0&&(c.routeIndex-1)%4===0&&s.camps.length<CAMP_LIMIT&&
       !s.camps.some(b=>b.anchorX===c.anchor.x&&b.anchorZ===c.anchor.z));
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
    if(c.routeMode==="legacy"){
      if(c.routeIndex>=ROUTE.length){
        c.goal="cuidar el último campamento";c.energy=Math.min(20,c.energy+2);return;
      }
    }else{
      const choice=Discovery.select(world,c,s.discoveries);
      if(!choice){
        c.goal="exploración conocida, buscar nuevas actividades";
        c.energy=Math.min(20,c.energy+2);return;
      }
      c.target=choice;
      Agency.commitChoice(c.mind,"explore");
    }
    c.stage="travel";c.goal="explorar una región desconocida";
  }
  function validate(s,world,tick,removedCount){
    if(!s||!Array.isArray(s.camps)||s.camps.length>CAMP_LIMIT||
      !Array.isArray(s.settlers)||s.settlers.length>1||
      !Array.isArray(s.houses)||s.houses.length>1||
      !Array.isArray(s.roads)||s.roads.length>Infra.MAX_LOCAL_ROAD||
      !Array.isArray(s.discoveries)||s.discoveries.length>Discovery.MAX_DISCOVERIES||
      !Array.isArray(s.events)||s.events.length>EVENT_LIMIT||
      !Array.isArray(s.knownChunks)||s.knownChunks.length>4096||
      !Social.validate(s.social,s.explorer,s.settlers,tick))return false;
    for(const k of ["woodGathered","woodSpent","foodGathered","foodEaten",
      "settlerWoodGathered","settlerFoodGathered","settlerFoodEaten"])
      if(!positive(s[k]))return false;
    const projectUnits=Projects.validate(s.projects,tick,s.houses,s.roads,
      [s.explorer,...s.settlers].filter(Boolean));
    if(projectUnits===false)return false;
    const pending=s.projects.entries.filter(p=>p.status==="active")
      .reduce((n,p)=>n+p.progress,0);
    if(s.woodSpent!==(s.camps.length+s.houses.length)*4+s.roads.length+pending||
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
        !world.walkable(m.x,m.z)||!m.homeSite||
        !world.walkable(m.homeSite.x,m.homeSite.z)||
        Nav.distance(m.homeSite,first)<2||Nav.distance(m.homeSite,first)>12||
        !Agency.validate(m.mind,tick)||typeof m.goal!=="string"||
        m.goal.length>80)return false;
      for(const k of ["energy","hunger","health","food","wood"])
        if(!positive(m[k]))return false;
      if(m.energy>20||m.hunger>100||m.health>100||
        m.alive!==(m.health>0)||
        m.wood!==s.settlerWoodGathered-s.houses.length*4-s.roads.length-pending||
        m.food!==s.settlerFoodGathered-s.settlerFoodEaten)return false;
    }
    if(s.houses.length){
      const h=s.houses[0];
      if(!m||!h||h.id!=="frontier_home_1"||h.type!=="home"||
        h.x!==m.homeSite.x||h.z!==m.homeSite.z||
        h.campId!==first.id||h.builder!==m.id||
        h.name!=="Casa de Mira"||!positive(h.completedAt)||
        h.completedAt<m.bornAt||h.completedAt>tick)return false;
    }
    if(s.roads.length&&!s.houses.length)return false;
    if(!Infra.validate(world,s.camps.filter(b=>m&&b.id===m.homeCampId).concat(s.houses),s.roads,tick,
      m?m.id:null,m?m.bornAt:0))return false;
    const chunks=new Set();
    for(const id of s.knownChunks){
      if(typeof id!=="string"||!/^(-?\d+),(-?\d+)$/.test(id)||chunks.has(id))return false;
      const p=id.split(",").map(Number);
      if(p.some(v=>v< -32||v>31)||id!==p[0]+","+p[1])return false;chunks.add(id);
    }
    const c=s.explorer;
    if(c===null)return !s.camps.length&&!s.discoveries.length&&!s.events.length&&
      !s.settlers.length&&!s.houses.length&&!s.roads.length&&
      !s.knownChunks.length&&!s.woodGathered&&!s.woodSpent&&!s.foodGathered&&!s.foodEaten;
    if(!c||c.id!=="world_taren"||c.name!=="Taren"||c.trait!=="cartógrafo"||c.worldExplorer!==true||
      !positive(c.bornAt)||c.bornAt<600||c.bornAt>tick||!world.walkable(c.x,c.z)||
      !c.anchor||!Number.isInteger(c.anchor.x)||!Number.isInteger(c.anchor.z)||
      c.anchor.x< -488||c.anchor.x>472||c.anchor.z< -488||c.anchor.z>472||
      (c.anchor.x-24)%64!==0||(c.anchor.z-24)%64!==0||
      !positive(c.routeIndex)||c.routeIndex>(c.routeMode==="free"?
        Discovery.MAX_DISCOVERIES:ROUTE.length)||
      !["free","legacy"].includes(c.routeMode)||
      (c.routeMode==="free"?
        (!Agency.validate(c.mind,tick)||!Discovery.validTarget(world,c.target,s.discoveries)||
         (c.stage==="travel"&&!c.target)):
        (c.mind!==null||c.target!==null))||
      !["supply","return","travel"].includes(c.stage)||
      typeof c.goal!=="string"||c.goal.length>80)return false;
    for(const k of ["energy","hunger","health","food","wood"])if(!positive(c[k]))return false;
    if(c.energy>20||c.hunger>100||c.health>100||c.alive!==(c.health>0)||
      c.wood!==s.woodGathered-s.settlerWoodGathered-s.camps.length*4||
      c.food!==s.foodGathered-s.settlerFoodGathered-(s.foodEaten-s.settlerFoodEaten)||
      s.discoveries.length!==c.routeIndex||
      !chunks.has(Math.floor(c.x/16)+","+Math.floor(c.z/16))||
      (m&&!chunks.has(Math.floor(m.x/16)+","+Math.floor(m.z/16))))return false;
    const expected=c.routeIndex?(c.routeMode==="free"?
      s.discoveries[c.routeIndex-1]:ROUTE[c.routeIndex-1]):{x:24,z:24};
    if(!Nav.same(c.anchor,expected))return false;
    let previous=-1;
    for(let i=0;i<s.discoveries.length;i++){
      const d=s.discoveries[i],p=c.routeMode==="free"?d:ROUTE[i],
        landmark=world.landmark(Math.floor(p.x/64),Math.floor(p.z/64));
      if(!d||!landmark||d.id!==landmark.id||d.name!==landmark.name||d.type!==landmark.type||
        !Nav.same(d,landmark)||!positive(d.tick)||d.tick<c.bornAt||d.tick>tick||d.tick<previous)return false;
      previous=d.tick;
    }
    if(c.routeMode==="free"&&
      !Discovery.validateHistory(world,s.discoveries,c.bornAt,tick))return false;
    const ids=new Set();previous=-1;
    for(const camp of s.camps){
      const position=s.camps.indexOf(camp);
      const index=c.routeMode==="free"?
        s.discoveries.findIndex(d=>d.x===camp.anchorX&&d.z===camp.anchorZ):
        position*4;
      const d=s.discoveries[index];
      if(!camp||!d||index<0||camp.id!=="camp_"+(index+1)||
        (c.routeMode==="legacy"&&index!==position*4)||
        camp.type!=="camp"||ids.has(camp.id)||
        camp.x!==d.x+2||camp.z!==d.z+2||camp.anchorX!==d.x||camp.anchorZ!==d.z||
        camp.builder!==c.id||!positive(camp.completedAt)||camp.completedAt<d.tick||
        camp.completedAt>tick||camp.completedAt<previous||
        camp.name!=="Refugio de ruta "+(position+1))return false;
      ids.add(camp.id);previous=camp.completedAt;
    }
    const actions=["expedition_arrive","harvest","forage","eat","discover","build_camp","death","meet"];
    const residentActions=["settler_arrive","settler_forage","settler_harvest",
      "settler_eat","settler_build","settler_build_road","settler_explore","settler_death","settler_meet"];
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
  return Object.freeze({create,advance,advanceSocial,validate,migrateLegacy,migrateV2,migrateV3,migrateV4,migrateV5,snapshot:copy,ROUTE_LENGTH:ROUTE.length});
});
