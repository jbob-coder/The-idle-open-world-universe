/* GODSEED ART-007: map-first God-view shell, built on the verified read-only
 * GOD-004 observatory. This UI only rearranges existing controls/DOM; it never
 * rewrites Sim.tick, world saves, divine rules, movement, NPCs or player agency.
 */
(function () {
 "use strict";
 const byId=id=>document.getElementById(id);
 const main=document.querySelector("main"),site=document.querySelector(".site");
 const original=byId("world"),hero=document.querySelector(".sidecol .herohead");
 const observer=byId("godObservatory"),powers=byId("powers");
 const whisper=byId("godWhisper"),events=document.querySelector(".sidecol .logpanel");
 const worldPanel=document.querySelector(".maincol>.panel");
 const timePanel=document.querySelector(".maincol .timebox");
 const atlas=byId("minimap");
 const Debug=window.GodseedDebug,Observatory=window.GodseedObservatory;
 if(!site||!main||!original||!hero||!observer||!powers||!whisper||
    !events||!worldPanel||!timePanel||!atlas||!Debug||!Observatory){
  throw new Error("ART-007 requires a working GOD-004 observation/game UI");
 }
 document.body.classList.add("godseed-mapfirst");
 worldPanel.id="godviewWorldPanel";
 worldPanel.setAttribute("role","tabpanel");
 worldPanel.setAttribute("aria-label","Living world");
 const make=(tag,id,cls,text)=>{
  const n=document.createElement(tag);
  if(id)n.id=id;
  if(cls)n.className=cls;
  if(text!==undefined)n.textContent=text;
  return n;
 };
 const header=document.querySelector("header");
 const info=make("div","godviewSummary");
 const clock=make("span","godviewClock");
 const faith=make("span","godviewFaith","faith");
 const population=make("span","godviewPopulation","population");
 const pause=make("button","godviewPause",null,"Pause");
 pause.type="button";pause.title="Pause or resume simulation; never changes Nim's decisions";
 info.append(clock,population,faith,pause);
 header.appendChild(info);
 const drawer=make("section","godviewDrawer");
 drawer.hidden=true;drawer.setAttribute("aria-label","Contextual God-view inspector");
 const head=make("div","godviewDrawerHead");
 const heading=make("strong","godviewDrawerTitle",null,"");
 const close=make("button","godviewDrawerClose",null,"Back to world");
 close.type="button";close.setAttribute("aria-label","Close panel and return to world");
 head.append(heading,close);
 const body=make("div","godviewDrawerBody");
 drawer.append(head,body);site.appendChild(drawer);
 const nav=make("nav","godviewTabs");
 nav.setAttribute("role","tablist");nav.setAttribute("aria-label","God-view sections");
 site.appendChild(nav);
 const icons={
  world:["11111111","10000001","10100101","10011001","10011001","10100101","10000001","11111111"],
  lives:["00011000","00111100","00111100","00011000","01111110","01111110","01000010","01000010"],
  villages:["00011000","00111100","01111110","11111111","11111111","11011011","11011011","11111111"],
  chronicle:["01111100","01000100","01110100","01000100","01110100","01000100","01000100","01111100"],
  council:["00111100","01000010","10000001","10100101","10011001","01000010","00111100","00011000"],
  miracles:["00011000","00011000","01111110","01111110","00011000","00011000","00100100","01000010"],
  settings:["00011000","00111100","11011011","11100111","11100111","11011011","00111100","00011000"]
 };
 function pixelIcon(name){
  const c=make("canvas");c.width=c.height=8;c.setAttribute("aria-hidden","true");
  const ctx=c.getContext("2d");ctx.imageSmoothingEnabled=false;
  ctx.fillStyle="#ddce9d";
  icons[name].forEach((line,y)=>{for(let x=0;x<8;x++)if(line[x]==="1")ctx.fillRect(x,y,1,1);});
  return c;
 }
 const tabs=[
  ["world","Mundo","Living world"],
  ["lives","Vidas","People and their real choices"],
  ["villages","Pueblos","Actual built settlements"],
  ["chronicle","Crónica","World event chronicle"],
  ["council","Consejo","Nonbinding divine messages"],
  ["miracles","Poderes","Original divine powers, not redesigned V3"],
  ["settings","Opciones","Time, zoom and save backups"]
 ];
 const panels={},buttons={};
 for(const [key,title,description] of tabs){
  if(key!=="world"){
   const section=make("section","godview"+key[0].toUpperCase()+key.slice(1),"godview-section");
   section.setAttribute("role","tabpanel");
   section.setAttribute("aria-label",description);
   section.hidden=true;
   body.appendChild(section);
   panels[key]=section;
  }
  const b=make("button","godviewTab-"+key,"",title);
  b.type="button";b.setAttribute("role","tab");
  b.setAttribute("aria-controls",key==="world"?worldPanel.id:panels[key].id);
  b.setAttribute("aria-selected",String(key==="world"));
  b.setAttribute("aria-label",description);
  b.prepend(pixelIcon(key));
  buttons[key]=b;nav.appendChild(b);
 }
 // One inspector only: move the actual GOD-004 inspector, live Nim portrait
 // and optional stats into the same region. No redundant fake data clone.
 const lives=panels.lives;
 const intro=make("p",null,"godview-intro","Observe choices, motivations, memories and relationships. Residents decide on their own.");
 lives.appendChild(intro);
 lives.appendChild(hero);
 const inspect=make("div","godviewLifeFacts");
 inspect.textContent="Choose Nim, a resident or a building below.";
 lives.append(inspect,observer);
 const stats=document.querySelector(".sidecol .hero-body");
 if(stats){
  const status=byId("citizenLives");
  if(status){
   lives.appendChild(make("h3",null,null,"Residents at work"));
   lives.appendChild(status);
  }
  const expandable=make("details","godviewLifeDetails");
  expandable.appendChild(make("summary",null,null,"Nim's needs, inventory, story and skills"));
  expandable.appendChild(stats);
  lives.appendChild(expandable);
 }
 const villages=panels.villages;
 villages.appendChild(make("p",null,"godview-intro","Built settlements and actual stored supplies. Kingdoms, borders and dynasties are not implemented."));
 const townStatus=byId("townStatus");
 if(townStatus)villages.appendChild(townStatus);
 const mapPanel=atlas.closest(".panel");
 if(mapPanel)villages.appendChild(mapPanel);
 const unavailable=make("p",null,"godview-unavailable","Political map and monarchies: not yet simulated.");
 villages.appendChild(unavailable);
 const chronicle=panels.chronicle;
 chronicle.appendChild(make("p",null,"godview-intro","Recorded world events. No imaginary history is added by this screen."));
 chronicle.appendChild(events);
 const council=panels.council;
 council.appendChild(make("p",null,"godview-intro","Your message is heard by autonomous residents; listening does not guarantee obedience."));
 council.appendChild(whisper);
 const miracles=panels.miracles;
 const oldPowers=powers.closest(".panel");
 miracles.appendChild(make("p",null,"godview-intro","Prototype divine powers preserved for compatibility. Their final influence and costs are a separate GOD-006 task."));
 if(oldPowers)miracles.appendChild(oldPowers);
 const settings=panels.settings;
 settings.appendChild(make("p",null,"godview-intro","World time only advances when the game is running. Export JSON before testing another device."));
 const oldTime=timePanel.closest(".panel");
 if(oldTime)settings.appendChild(oldTime);
 const context=make("span","godviewContextBadge");
 lives.insertBefore(context,observer);
 const missing=make("p",null,"godview-unavailable","Families and rulers need their own persistent simulation before they can be inspected.");
 lives.appendChild(missing);

 let active="world";
 function selectTab(key){
  if(!buttons[key])return false;
  active=key;
  drawer.hidden=key==="world";
  worldPanel.setAttribute("aria-hidden",String(key!=="world"));
  for(const [id,b] of Object.entries(buttons)){
   b.setAttribute("aria-selected",String(id===key));
   b.classList.toggle("active",id===key);
  }
  for(const [id,p] of Object.entries(panels))p.hidden=id!==key;
  if(key!=="world"){
   const label=tabs.find(t=>t[0]===key)[1];
   heading.textContent=label;
   body.scrollTop=0;
  }
  return true;
 }
 for(const [key,button] of Object.entries(buttons))
  button.addEventListener("click",()=>selectTab(key));
 close.addEventListener("click",()=>selectTab("world"));
 // Preserve legacy God powers but never give them direct residents movement.
 // The tap target becomes the map after a power is chosen from its own tab.
 miracles.addEventListener("click",e=>{
  if(e.target&&e.target.closest&&e.target.closest("button[data-power]"))selectTab("world");
 });
 // The original GOD-004 listener first identifies the real entity on the map.
 // Only if a genuine inspectable record exists do we open the single drawer.
 original.addEventListener("click",event=>{
  if(!document.querySelector('.power[data-power="inspect"].active'))return;
  const c=Debug.getCamera(),rect=original.getBoundingClientRect();
  const at=window.GodseedCamera.pointerToWorld(c,rect,event.clientX,event.clientY);
  const target=window.GodseedObserver.tileKey(Debug.getState(),at.x,at.y);
  if(target&&Observatory.select(target))selectTab("lives");
 });
 pause.addEventListener("click",()=>{
  const state=Debug.getState();
  const target=state.settings.speed===0?1:0;
  const button=settings.querySelector('.timebox [data-speed="'+target+'"]');
  if(button)button.click(); // Delegate to the existing authoritative control.
  updateInfo();
 });
 document.addEventListener("keydown",e=>{
  if(e.key==="Escape"&&!drawer.hidden&&!["INPUT","TEXTAREA"].includes(e.target.tagName)){
   selectTab("world");
  }
 });
 function updateInfo(){
  const state=Debug.getState();
  if(!state)return;
  const text=byId("clock")?byId("clock").textContent:"Day "+state.day;
  clock.textContent=text;
  const people=1+(state.npcs?state.npcs.length:0)+
   (state.living&&state.living.citizens?state.living.citizens.length:0);
  population.textContent=people+" people observed";
  faith.textContent=state.faith+" Faith";
  pause.textContent=state.settings.speed===0?"Play":"Pause";
  const selection=Observatory.getSelection();
  context.textContent=selection==="overview"?"WORLD OVERVIEW":"OBSERVING "+selection.replace(/[^a-z0-9:_-]/gi,"").slice(0,32);
 }
 const timer=window.setInterval(()=>{if(!document.hidden)updateInfo();},1250);
 window.addEventListener("pagehide",()=>window.clearInterval(timer),{once:true});
 selectTab("world");updateInfo();
 window.GodseedMapFirst=Object.freeze({
  open:selectTab,
  current:()=>active,
  close:()=>selectTab("world"),
  refresh:updateInfo,
  tabs:()=>tabs.map(z=>z[0])
 });
})();
