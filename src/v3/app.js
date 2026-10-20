/* GODSEED V3 proof controls: deterministic simulation tick, read-only render, isolated storage. */
(function(root){"use strict";
  const Sim=root.GodseedV3Sim,View=root.GodseedV3View,Fallback=root.GodseedV3Fallback;
  if(!Sim||!View||!Fallback)throw new Error("GODSEED V3 modules missing");
  const el=id=>document.getElementById(id);
  let canvas=el("scene");
  let simulation,view=null,rendererMode="unavailable",paused=false,speed=1,last=0,acc=0,dirty=true;
  let lastPersistedTick=-1,lastShownTick=-1,lastDraw=0,status="";
  function setStatus(message){status=message;el("headline").textContent=message;}
  function seedNow(){return ((Date.now()>>>0)^0x5a17b913)>>>0;}
  function newWorld(seed){
    simulation=Sim.create(seed===undefined?seedNow():seed);
    paused=false;acc=0;last=0;lastPersistedTick=-1;lastShownTick=-1;dirty=true;
    el("pause").setAttribute("aria-pressed","false");
    el("pause").textContent="Pausar";
    setStatus("Nuevo mundo autónomo · sin comandos a los Sims");
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
      if(!raw)return false;
      const loaded=Sim.restore(raw);simulation=loaded;
      paused=true;acc=0;last=0;dirty=true;
      lastPersistedTick=simulation.snapshot().tick;lastShownTick=-1;
      el("pause").setAttribute("aria-pressed","true");
      el("pause").textContent="Continuar";
      setStatus("Partida V3 recuperada y pausada");
      update();
      return true;
    }catch(error){
      setStatus("Guardado V3 inválido; sin borrar ni tocar partidas antiguas");
      return false;
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
      statsPair(stats,"Habitantes",state.citizens.length);
      statsPair(stats,"Madera disponible",state.wood);
      statsPair(stats,"Madera recolectada",state.harvested);
      statsPair(stats,"Madera gastada",state.spent);
      statsPair(stats,"Refugios construidos",state.structures.length);
      const people=el("citizens");people.textContent="";
      for(const c of state.citizens){
        const div=document.createElement("div");div.className="person";
        const title=document.createElement("strong");title.textContent=c.name+" · "+c.trait;
        const desc=document.createElement("div");desc.textContent="Objetivo: "+c.goal+" | Energía "+c.energy+"/20 | Madera "+c.harvested;
        div.appendChild(title);div.appendChild(desc);people.appendChild(div);
      }
      const events=el("events");events.textContent="";
      for(const e of state.events.slice(-6).reverse()){
        const div=document.createElement("div");
        div.textContent="Día "+e.tick+" · "+e.actor+": "+(e.action==="build"?"construyó refugio":"recolectó madera");
        events.appendChild(div);
      }
      lastShownTick=state.tick;
    }
    if(view){
      const factor=Math.min(root.devicePixelRatio||1,1.25);
      const w=Math.max(1,Math.floor(canvas.clientWidth*factor));
      const h=Math.max(1,Math.floor(canvas.clientHeight*factor));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;dirty=true;}
      if(dirty){view.render(state);dirty=false;}
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
    el("step").addEventListener("click",step);
    el("speed").addEventListener("click",function(){
      speed=speed===1?4:speed===4?12:1;el("speed").textContent="Velocidad ×"+speed;
    });
    el("zoomIn").addEventListener("click",()=>{if(view){view.zoom(-3);dirty=true;}});
    el("zoomOut").addEventListener("click",()=>{if(view){view.zoom(3);dirty=true;}});
    el("save").addEventListener("click",save);
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
      view.rotate((e.clientX-lastPointer.x)/Math.max(100,canvas.clientWidth),
        (e.clientY-lastPointer.y)/Math.max(100,canvas.clientHeight));
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
  if(!load())newWorld(14);
  if(rendererMode==="canvas-2d-fallback")setStatus("Modo compatible 2.5D · WebGL no disponible");
  // Public test/inspection interface; never exposes a writable simulation object.
  root.GodseedV3Debug=Object.freeze({
    getState:()=>simulation.snapshot(),newWorld,step,save,load,
    isPaused:()=>paused,pause:()=>{if(!paused)togglePause();return true;},
    resume:()=>{if(paused)togglePause();return true;},
    hasWebGL:()=>rendererMode==="webgl-3d",rendererMode:()=>rendererMode,storageKey:Sim.STORAGE_KEY
  });
  root.requestAnimationFrame(loop);
})(typeof window!=="undefined"?window:globalThis);
