/* GODSEED V3 proof controls: deterministic simulation tick, read-only render, isolated storage. */
(function(root){"use strict";
  const Sim=root.GodseedV3Sim,View=root.GodseedV3View;
  if(!Sim||!View)throw new Error("GODSEED V3 modules missing");
  const el=id=>document.getElementById(id);
  const canvas=el("scene");
  let simulation,view=null,paused=false,speed=1,last=0,acc=0,dirty=true;
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
      const stats=el("stats");stats.replaceChildren();
      statsPair(stats,"Semilla",state.seed);
      statsPair(stats,"Ciclo",state.tick);
      statsPair(stats,"Habitantes",state.citizens.length);
      statsPair(stats,"Madera disponible",state.wood);
      statsPair(stats,"Madera recolectada",state.harvested);
      statsPair(stats,"Madera gastada",state.spent);
      statsPair(stats,"Refugios construidos",state.structures.length);
      const people=el("citizens");people.replaceChildren();
      for(const c of state.citizens){
        const div=document.createElement("div");div.className="person";
        const title=document.createElement("strong");title.textContent=c.name+" · "+c.trait;
        const desc=document.createElement("div");desc.textContent="Objetivo: "+c.goal+" | Energía "+c.energy+"/20 | Madera "+c.harvested;
        div.appendChild(title);div.appendChild(desc);people.appendChild(div);
      }
      const events=el("events");events.replaceChildren();
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
  try{view=View.create(canvas);}catch(error){
    const warning=el("warning");
    warning.style.display="block";
    warning.textContent="No hay contexto WebGL 3D en este navegador o dispositivo. La simulación sigue disponible, pero no se mostrará como 3D.";
  }
  controls();
  if(!load())newWorld(14);
  // Public test/inspection interface; never exposes a writable simulation object.
  root.GodseedV3Debug=Object.freeze({
    getState:()=>simulation.snapshot(),newWorld,step,save,load,
    isPaused:()=>paused,pause:()=>{if(!paused)togglePause();return true;},
    resume:()=>{if(paused)togglePause();return true;},
    hasWebGL:()=>Boolean(view),storageKey:Sim.STORAGE_KEY
  });
  root.requestAnimationFrame(loop);
})(typeof window!=="undefined"?window:globalThis);
