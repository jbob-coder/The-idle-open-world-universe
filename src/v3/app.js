/* GODSEED V3 proof controls: deterministic simulation tick, read-only render, isolated storage. */
(function(root){"use strict";
  const useWorld=/(?:^|[?&])mode=world(?:&|$)/.test(root.location.search||"");
  const useSociety=useWorld||/(?:^|[?&])mode=society(?:&|$)/.test(root.location.search||"");
  const Sim=useWorld?root.GodseedV3WorldSim:useSociety?root.GodseedV3Society:root.GodseedV3Sim;
  const View=root.GodseedV3View,Fallback=root.GodseedV3Fallback;
  if(!Sim||!View||!Fallback)throw new Error("GODSEED V3 modules missing");
  const el=id=>document.getElementById(id);
  if(useWorld)document.body.classList.add("world-mode");
  let canvas=el("scene");
  let simulation,view=null,rendererMode="unavailable",paused=false,speed=1,last=0,acc=0,dirty=true;
  let lastPersistedTick=-1,lastShownTick=-1,lastDraw=0,status="";
  let atlas=null,atlasOpen=false,followExplorer=false,orbitCamera=false;
  function setStatus(message){status=message;el("headline").textContent=message;}
  function seedNow(){return ((Date.now()>>>0)^0x5a17b913)>>>0;}
  function newWorld(seed){
    simulation=Sim.create(seed===undefined?seedNow():seed);
    if(view&&view.focus)view.focus(9.5,9.5);
    paused=false;acc=0;last=0;lastPersistedTick=-1;lastShownTick=-1;dirty=true;
    el("pause").setAttribute("aria-pressed","false");
    el("pause").textContent="Pausar";
    setStatus(useWorld?"Gran mundo · 1.048.576 casillas · vida autónoma":
      useSociety?"Sociedad autónoma · fabricación y elecciones":"Nuevo mundo autónomo · sin comandos a los Sims");
    update();
    return simulation.snapshot();
  }
  function save(){
    if(!simulation)return false;
    try{
      root.localStorage.setItem(Sim.STORAGE_KEY,simulation.serialize());
      lastPersistedTick=simulation.snapshot().tick;
      setStatus("Mundo guardado localmente · V3 independiente");
      return true;
    }catch(error){
      setStatus("No se pudo guardar: almacenamiento local no disponible");
      return false;
    }
  }
  function load(){
    try{
      const raw=root.localStorage.getItem(Sim.STORAGE_KEY);
      let loaded;
      if(!raw){
        if(!useWorld)return false;
        const societySave=root.localStorage.getItem(root.GodseedV3Society.STORAGE_KEY);
        if(!societySave)return false;
        loaded=Sim.fromSociety(societySave);
      }else loaded=Sim.restore(raw);
      simulation=loaded;
      paused=true;acc=0;last=0;dirty=true;
      lastPersistedTick=simulation.snapshot().tick;lastShownTick=-1;
      el("pause").setAttribute("aria-pressed","true");
      el("pause").textContent="Continuar";
      setStatus(useWorld&&!raw?"Tu aldea se amplió al gran mundo · copia independiente y pausada":"Partida V3 recuperada y pausada");
      update();
      return true;
    }catch(error){
      setStatus("Guardado V3 inválido; sin borrar ni tocar partidas antiguas");
      return "invalid";
    }
  }
  function togglePause(){
    paused=!paused;acc=0;last=0;
    el("pause").setAttribute("aria-pressed",String(paused));
    el("pause").textContent=paused?"Continuar":"Pausar";
    setStatus(paused?"Simulación pausada":"Mundo autónomo en marcha");
    return paused;
  }
  function step(){
    if(!paused)togglePause();
    const result=simulation.advance(1);
    dirty=true;update();
    return result;
  }
  function statsPair(parent,label,value){
    const dt=document.createElement("dt"),dd=document.createElement("dd");
    dt.textContent=label;dd.textContent=String(value);
    parent.appendChild(dt);parent.appendChild(dd);
  }
  function update(){
    if(!simulation)return;
    const state=simulation.snapshot();
    if(lastShownTick!==state.tick){
      const stats=el("stats");stats.textContent="";
      statsPair(stats,"Semilla",state.seed);
      statsPair(stats,"Ciclo",state.tick);
      if(useWorld){
        statsPair(stats,"Mundo",state.world.size+" × "+state.world.size);
        statsPair(stats,"Regiones",state.world.regions);
        statsPair(stats,"Lugares descubiertos",state.world.discoveredRegions);
        statsPair(stats,"Campamentos de ruta",state.world.camps);
        statsPair(stats,"Caminos construidos por NPC",state.world.constructedRoads);
        statsPair(stats,"Vínculos personales",state.world.socialConnections);
        statsPair(stats,"Obras activas",state.world.activeConstruction);
        statsPair(stats,"Órdenes de obra terminadas",state.world.completedWorkOrders);
      }
      statsPair(stats,"Habitantes",state.citizens.length);
      statsPair(stats,useWorld?"Madera de la aldea":"Madera disponible",state.wood);
      statsPair(stats,"Madera recolectada",state.harvested);
      statsPair(stats,"Madera gastada",useSociety?state.spentWood:state.spent);
      statsPair(stats,useSociety?"Edificios terminados":"Refugios construidos",state.structures.length);
      if(useSociety){
        statsPair(stats,"Herramientas",state.axe);
        statsPair(stats,"Kits fabricados",state.kitsCrafted);
        statsPair(stats,"Líder",state.settlement.leaderId||"Sin elegir");
        statsPair(stats,"Elecciones",state.settlement.elections);
        statsPair(stats,"Prioridad del consejo",state.settlement.policy||"none");
        statsPair(stats,"Repartos de oficio",state.settlement.ordersIssued||0);
        statsPair(stats,"Comunidades",state.outpost.status==="established"?2:1);
        statsPair(stats,"Puesto oriental",state.outpost.status);
        statsPair(stats,"Reservas orientales",state.outpost.wood+" madera / "+state.outpost.food+" comida");
        statsPair(stats,"Entregas completadas",state.outpost.deliveries);
      }
      statsPair(stats,useWorld?"Comida de la aldea":"Comida disponible",state.food);
      statsPair(stats,"Bayas recolectadas",state.foodGathered);
      statsPair(stats,"Raciones consumidas",state.foodEaten);
      const people=el("citizens");people.textContent="";
      for(const c of state.citizens){
        const div=document.createElement("div");div.className="person";
        const title=document.createElement("strong");title.textContent=c.name+" · "+c.trait;
        const desc=document.createElement("div");
        if(c.worldExplorer){
          desc.textContent="Objetivo: "+c.goal+" | Posición "+c.x+", "+c.z+
            " | Salud "+c.health+"/100 | Saciedad "+c.hunger+"/100 | Energía "+c.energy+
            "/20 | Mochila: "+c.food+" comida / "+c.wood+" madera | Regiones visitadas "+c.routeIndex;
        }else if(c.worldSettler){
          desc.textContent="Objetivo: "+c.goal+" | Posición "+c.x+", "+c.z+
            " | Salud "+c.health+"/100 | Saciedad "+c.hunger+"/100"+
            " | Energía "+c.energy+"/20 | Mochila "+c.food+" comida / "+
            c.wood+" madera | Campamento "+c.homeCampId+
            (c.mind?" | Decisión "+(c.mind.lastChoice||"considerando opciones")+
            " | Curiosidad "+c.mind.preferences.curiosity+
            " | Seguridad "+c.mind.preferences.security+
            " | Memorias "+c.mind.memories.length:"");
        }else if(c.mind){
          const mind=c.mind;
          desc.textContent="Objetivo: "+c.goal+
            " | Salud "+c.health+"/100 | Hambre "+c.hunger+"/100 | Energía "+c.energy+"/20"+
            " | Ánimo "+mind.emotions.contentment+"/100 | Estrés "+mind.emotions.stress+"/100"+
            " | Curiosidad "+mind.personality.curiosity+"/100 | Prudencia "+mind.personality.caution+"/100"+
            " | Experiencia recolectando "+mind.skills.foraging+"/100"+
            " | Lugares conocidos "+mind.visited.length+" | Recuerdos "+mind.memories.length;
        }else{
          desc.textContent="Objetivo: "+c.goal+" | Salud "+c.health+"/100 | Hambre "+c.hunger+
            "/100 | Energía "+c.energy+"/20 | Fabricaciones "+c.crafted+
            " | Construcciones "+c.built+" | Conversaciones "+c.conversations+
            " | Oficio "+c.role+" | Tareas de oficio "+c.ordersCompleted+
            " | Comunidad "+c.homeId+
            " | Comida recolectada "+c.foraged+" | Recuerdos "+c.memories.length+
            (state.settlement.leaderId===c.id?" | Líder elegido":"");
        }
        div.appendChild(title);div.appendChild(desc);people.appendChild(div);
      }
      const events=el("events");events.textContent="";
      const memoryPanel=el("memories");memoryPanel.textContent="";
      if(useSociety){
        el("memories").previousElementSibling.textContent="Consejo de la aldea";
        const council=state.settlement;
        const div=document.createElement("div");
        div.textContent="Líder: "+(council.leaderId||"ninguno")+
          " | Votos: "+council.ballots.map(b=>b.voter+" → "+b.candidate).join(", ");
        memoryPanel.appendChild(div);
        const policy=document.createElement("div");
        policy.textContent="Prioridad: "+council.policy+" | Evidencia: "+council.policyReason;
        memoryPanel.appendChild(policy);
        for(const person of state.citizens){
          if(person.worldExplorer||person.worldSettler)continue;
          const note=document.createElement("div");
          const latest=person.memories.length?person.memories[person.memories.length-1]:null;
          note.textContent=person.name+" · "+person.role+" · "+person.ordersCompleted+
            " tareas · recuerdo: "+(latest?latest.kind+" (ciclo "+latest.tick+")":"sin recuerdos");
          memoryPanel.appendChild(note);
        }
        if(useWorld){
          const note=document.createElement("div");
          const discoveries=state.expedition.discoveries;
          note.textContent=state.expedition.explorer?
            "Expedición: "+discoveries.length+" lugares. "+(discoveries.length?"Último: "+discoveries[discoveries.length-1].name:""):
            "Un cartógrafo llegará cuando exista un taller y transcurran 600 ciclos.";
          memoryPanel.appendChild(note);
        }
      }else{
        const mind=state.citizens[0].mind;
        const memoryLabels={build:"Su primer refugio",forage:"Encontró comida",
          eat:"Su primera comida",discover:"Descubrió un lugar",
          reflect:"Pensó en su hogar",hardship:"Pasó hambre"};
        for(const entry of mind.memories.slice(-4).reverse()){
          const div=document.createElement("div");
          div.textContent="Ciclo "+entry.tick+" · "+(memoryLabels[entry.kind]||entry.kind);
          memoryPanel.appendChild(div);
        }
      }
      for(const e of state.events.slice(-6).reverse()){
        const div=document.createElement("div");
        const labels={build:"construyó edificio",harvest:"recolectó madera",
          forage:"recolectó bayas",eat:"comió",rest:"descansó",
          discover:"descubrió un lugar",reflect:"reflexionó",hardship:"pasó hambre",
          craft:"fabricó "+(e.details.recipe||"objeto"),
          talk:"conversó con "+(e.details.with||"otro habitante"),
          arrive:"llegó a la aldea",elect:"fue elegido líder",death:"falleció",
          assign:"recibió oficio "+(e.details.role||""),
          council:"decidió priorizar "+(e.details.policy||""),
          approve_outpost:"aprobó fundación de otra comunidad",
          found_outpost:"fundó Colina Oriental",
          dispatch:"despachó provisiones",deliver:"entregó alimentos",
          expedition_arrive:"llegó para explorar el gran mundo",
          build_camp:"construyó un refugio de ruta",
          settler_arrive:"llegó al campamento",
          settler_harvest:"cosechó madera silvestre",
          settler_forage:"recolectó comida silvestre",
          settler_eat:"consumió provisiones",
          settler_build:"construyó su propia casa",
          settler_build_road:"construyó un tramo de camino",
          settler_death:"falleció en la frontera"};
        div.textContent="Ciclo "+e.tick+" · "+e.actor+": "+(labels[e.action]||e.action)+
          (e.action==="build"&&e.details.site?" ("+e.details.site+")":"")+
          (e.action==="discover"&&e.details.name?" · "+e.details.name:"");
        events.appendChild(div);
      }
      lastShownTick=state.tick;
    }
    if(view){
      const factor=Math.min(root.devicePixelRatio||1,1.25);
      const w=Math.max(1,Math.floor(canvas.clientWidth*factor));
      const h=Math.max(1,Math.floor(canvas.clientHeight*factor));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;dirty=true;}
      if(dirty){
        if(useWorld){
          if(followExplorer){const target=state.expedition.explorer||state.citizens[0];view.focus(target.x,target.z);}
          const camera=view.camera(),region=simulation.region(camera.x,camera.z);
          el("hint").textContent=region.name+" · "+Math.round(camera.x)+", "+Math.round(camera.z)+
            " · "+(orbitCamera?"Arrastra para girar":"Arrastra para viajar con la cámara");
          view.render(simulation.scene(camera.x,camera.z,camera.half));
          if(atlasOpen&&atlas)atlas.render(state,camera);
        }else view.render(state);
        dirty=false;
      }
    }
  }
  function loop(now){
    if(!last)last=now;
    const elapsed=Math.max(0,Math.min(250,now-last));last=now;
    if(!paused&&simulation){
      acc+=elapsed*speed;
      const steps=Math.min(18,Math.floor(acc/450));
      if(steps){
        acc-=steps*450;simulation.advance(steps);dirty=true;
        const tick=simulation.snapshot().tick;
        if(tick-lastPersistedTick>=35)save();
      }
    }
    if(dirty||now-lastDraw>450){update();lastDraw=now;}
    root.requestAnimationFrame(loop);
  }
  function controls(){
    el("pause").addEventListener("click",togglePause);
    // Compact observer controls stay out of the game world until requested.
    function toggleOverlay(button,bodyClass){
      const open=!document.body.classList.contains(bodyClass);
      document.body.classList.toggle(bodyClass,open);
      button.setAttribute("aria-expanded",String(open));
      return open;
    }
    if(useWorld){
      el("menuToggle").addEventListener("click",()=>{
        const open=toggleOverlay(el("menuToggle"),"ui-menu-open");
        if(open){
          document.body.classList.remove("ui-inspector-open");
          el("infoToggle").setAttribute("aria-expanded","false");
        }
      });
      el("infoToggle").addEventListener("click",()=>{
        const open=toggleOverlay(el("infoToggle"),"ui-inspector-open");
        if(open){
          document.body.classList.remove("ui-menu-open");
          el("menuToggle").setAttribute("aria-expanded","false");
        }
      });
      el("quickAtlas").addEventListener("click",()=>el("atlasToggle").click());
    }
    el("step").addEventListener("click",step);
    el("speed").addEventListener("click",function(){
      speed=speed===1?4:speed===4?12:1;el("speed").textContent="Velocidad ×"+speed;
    });
    el("zoomIn").addEventListener("click",()=>{if(view){view.zoom(-3);dirty=true;}});
    el("zoomOut").addEventListener("click",()=>{if(view){view.zoom(3);dirty=true;}});
    el("save").addEventListener("click",save);
    function switchMode(mode){
      if(!save())return;
      root.location.search="mode="+mode+(rendererMode==="canvas-2d-fallback"?"&renderer=2d":"");
    }
    el("mode").textContent=useSociety?"Modo Aria sola":"Modo sociedad";
    el("mode").addEventListener("click",function(){
      // Switching simulations reloads the page and never touches the other save key.
      switchMode(useSociety?"solo":"society");
    });
    el("largeWorld").textContent=useWorld?"Aldea local":"Gran mundo";
    el("largeWorld").addEventListener("click",()=>switchMode(useWorld?"society":"world"));
    function setAtlas(open){
      atlasOpen=open;el("atlas").style.display=open?"flex":"none";
      el("atlasToggle").setAttribute("aria-expanded",String(open));dirty=true;
      if(open)el("atlasClose").focus();
    }
    function stopFollowing(){followExplorer=false;el("followExplorer").setAttribute("aria-pressed","false");}
    if(useWorld){
      el("worldTools").style.display="flex";
      atlas=root.GodseedV3Atlas.create(el("atlasMap"),(x,z)=>{
        if(view){stopFollowing();view.focus(x,z);setAtlas(false);dirty=true;}
      });
      el("atlasToggle").addEventListener("click",()=>setAtlas(!atlasOpen));
      el("atlasClose").addEventListener("click",()=>setAtlas(false));
      el("homeCamera").addEventListener("click",()=>{
        if(view){stopFollowing();view.focus(9.5,9.5);dirty=true;}
      });
      el("followExplorer").addEventListener("click",()=>{
        followExplorer=!followExplorer;el("followExplorer").setAttribute("aria-pressed",String(followExplorer));dirty=true;
      });
      el("orbitCamera").addEventListener("click",()=>{
        orbitCamera=!orbitCamera;el("orbitCamera").setAttribute("aria-pressed",String(orbitCamera));
        el("orbitCamera").textContent=orbitCamera?"Cámara: girar":"Cámara: desplazar";dirty=true;
      });
    }
    el("reset").addEventListener("click",function(){
      try{root.localStorage.removeItem(Sim.STORAGE_KEY);}catch(error){}
      newWorld();
    });
    let lastPointer=null;
    canvas.addEventListener("pointerdown",function(e){
      lastPointer={id:e.pointerId,x:e.clientX,y:e.clientY};
      try{canvas.setPointerCapture(e.pointerId);}catch(error){}
    });
    canvas.addEventListener("pointermove",function(e){
      if(!lastPointer||lastPointer.id!==e.pointerId||!view)return;
      const dx=(e.clientX-lastPointer.x)/Math.max(100,canvas.clientWidth),
        dy=(e.clientY-lastPointer.y)/Math.max(100,canvas.clientHeight);
      if(useWorld&&!orbitCamera&&!e.shiftKey){stopFollowing();view.pan(dx,dy);}
      else view.rotate(dx,dy);
      lastPointer.x=e.clientX;lastPointer.y=e.clientY;dirty=true;
    });
    for(const type of ["pointerup","pointercancel","lostpointercapture"])
      canvas.addEventListener(type,()=>{lastPointer=null;});
    canvas.addEventListener("wheel",function(e){e.preventDefault();if(view){view.zoom(Math.sign(e.deltaY)*2);dirty=true;}},{passive:false});
    root.addEventListener("pagehide",save);
    document.addEventListener("visibilitychange",function(){
      if(document.hidden){if(!paused)togglePause();save();}
    });
    root.addEventListener("keydown",function(e){
      if(e.key==="Escape"){setAtlas(false);return;}
      if(e.target&&/^(BUTTON|INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;
      if(useWorld&&view&&["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)){
        e.preventDefault();stopFollowing();const camera=view.camera();
        view.focus(camera.x+(e.key==="ArrowLeft"?-8:e.key==="ArrowRight"?8:0),
          camera.z+(e.key==="ArrowUp"?-8:e.key==="ArrowDown"?8:0));dirty=true;return;
      }
      if(e.code==="Space"){e.preventDefault();togglePause();}
      if(view&&e.key==="ArrowLeft"){view.rotate(-.12,0);dirty=true;}
      if(view&&e.key==="ArrowRight"){view.rotate(.12,0);dirty=true;}
    });
  }
  const forceFallback=Boolean(root.location&&((root.location.search||"").indexOf("renderer=2d")>=0));
  try{
    if(forceFallback)throw new Error("Canvas2D QA");
    view=View.create(canvas);rendererMode="webgl-3d";
  }catch(error){
    // After a partial shader initialization a WebGL canvas cannot become 2D.
    // Replace canvas before binding movement and creating the fallback context.
    const replacement=canvas.cloneNode(false);
    canvas.parentNode.replaceChild(replacement,canvas);
    canvas=replacement;
    try{
      view=Fallback.create(canvas);rendererMode="canvas-2d-fallback";
    }catch(fallbackError){
      const warning=el("warning");warning.style.display="block";
      warning.textContent="WebGL y Canvas2D no están disponibles; la simulación continúa sin imagen.";
    }
  }
  controls();
  // Invalid saves remain on disk untouched until the player explicitly resets.
  if(load()===false)newWorld(14);
  if(rendererMode==="canvas-2d-fallback")setStatus("Modo compatible 2.5D · WebGL no disponible");
  // Public test/inspection interface; never exposes a writable simulation object.
  root.GodseedV3Debug=Object.freeze({
    getState:()=>simulation.snapshot(),newWorld,step,save,load,
    fastForward:(n)=>{
      if(!paused)togglePause();
      const result=simulation.advance(n);dirty=true;update();return result;
    },
    isPaused:()=>paused,pause:()=>{if(!paused)togglePause();return true;},
    resume:()=>{if(paused)togglePause();return true;},
    hasWebGL:()=>rendererMode==="webgl-3d",rendererMode:()=>rendererMode,storageKey:Sim.STORAGE_KEY,
    mode:()=>useWorld?"world":useSociety?"society":"solo",
    worldMetrics:()=>useWorld?simulation.metrics():null,
    camera:()=>view&&view.camera?view.camera():null,
    observe:(x,z)=>{if(useWorld&&view){followExplorer=false;view.focus(x,z);dirty=true;update();}}
  });
  root.requestAnimationFrame(loop);
})(typeof window!=="undefined"?window:globalThis);
