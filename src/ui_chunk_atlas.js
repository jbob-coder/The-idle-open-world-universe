/* GODSEED WLD-003: opt-in God-view world atlas.
 * The existing village Canvas remains playable and unchanged. This atlas
 * visualizes true seeded chunks across signed borders but does NOT pretend
 * Nim can travel there until WLD-004/007 integrate simulation and saves.
 */
(function(){
 "use strict";
 const Debug=window.GodseedDebug,Views=window.GodseedChunkView,
  Surface=window.GodseedChunkSurface,Assets=window.GodseedAssets;
 if(!Debug||!Views||!Surface||!Assets)throw new Error("Chunk atlas runtime dependencies missing");
 const byId=id=>document.getElementById(id);
 const original=byId("world");
 if(!original||!original.parentNode)throw new Error("World Canvas missing");
 const container=original.parentNode;
 const bar=document.createElement("div");
 bar.id="chunkAtlasBar";bar.style.cssText="display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin:8px 0";
 const toggle=document.createElement("button");toggle.id="chunkAtlasToggle";
 toggle.type="button";toggle.setAttribute("aria-pressed","false");
 toggle.textContent="Open world atlas";toggle.title="Observe persistent seeded regions beyond the original map; no direct sim control";
 const note=document.createElement("span");note.id="chunkAtlasNotice";
 note.textContent="Terrain preview · the original village stays playable";
 note.style.cssText="font-size:10px;color:#c5d0bb";
 bar.appendChild(toggle);bar.appendChild(note);
 container.insertBefore(bar,original);
 const canvas=document.createElement("canvas");canvas.id="chunkAtlasCanvas";
 canvas.width=512;canvas.height=320;
 canvas.setAttribute("aria-label","Chunked world atlas, drag to pan. Not direct movement for Nim.");
 canvas.style.cssText="display:none;width:100%;height:auto;image-rendering:pixelated;border:2px solid #718078;touch-action:none;cursor:grab;background:#111b21";
 original.insertAdjacentElement("afterend",canvas);
 const controls=document.createElement("div");controls.id="chunkAtlasControls";
 controls.style.cssText="display:none;gap:6px;flex-wrap:wrap;align-items:center;margin:8px 0";
 const status=document.createElement("span");status.id="chunkAtlasStatus";
 status.style.cssText="font-size:11px;color:#e4d6ae;display:block;flex-basis:100%;overflow-wrap:anywhere";
 controls.appendChild(status);
 const buttons=[
  ["chunkAtlasNorth","North",0,-16],["chunkAtlasWest","West",-16,0],
  ["chunkAtlasEast","East",16,0],["chunkAtlasSouth","South",0,16]
 ];
 const moveButtons=[];
 for(const [id,label,dx,dy] of buttons){
  const button=document.createElement("button");button.type="button";
  button.id=id;button.textContent=label;button.setAttribute("aria-label","Pan atlas "+label);
  button.style.minHeight="44px";
  controls.appendChild(button);moveButtons.push([button,dx,dy]);
 }
 const zoomButton=document.createElement("button");zoomButton.id="chunkAtlasZoom";
 zoomButton.textContent="Atlas zoom";zoomButton.type="button";
 zoomButton.style.minHeight="44px";controls.appendChild(zoomButton);
 const hint=document.createElement("small");hint.style.cssText="flex-basis:100%;font-size:10px;color:#b8c6bb";
 hint.textContent="God-view terrain preview. This does not teleport, command or move Nim. Cross-chunk travel and v1 world import are separate tasks.";
 controls.appendChild(hint);
 canvas.insertAdjacentElement("afterend",controls);

 let active=false,view=null,surface=null,loadedSeed=null,drag=null,dragged=false;
 function ensure(){
  const state=Debug.getState(),seed=state.worldSeed>>>0;
  if(!view||loadedSeed!==seed){
   loadedSeed=seed;
   view=Views.create(seed,{centerX:state.bot.x,centerY:state.bot.y,maxFogChunks:9});
   surface=Surface.create(canvas,Assets);
  }
 }
 function render(){
  if(!active)return null;
  const frame=surface.draw(view),c=view.camera(),stats=view.stats();
  status.textContent="Atlas: "+c.centerX+", "+c.centerY+" · "+c.name+
   " · "+c.width+"×"+c.height+" tiles · Chunk "+
   Math.floor(c.centerX/32)+", "+Math.floor(c.centerY/32)+
   " · observed "+stats.fogChunks+" sectors · drawn "+frame.dirty+" changed cells";
  zoomButton.textContent="Zoom: "+c.name;
  return frame;
 }
 function open(){
  if(active)return false;
  ensure();active=true;
  original.style.display="none";canvas.style.display="block";
  controls.style.display="flex";
  toggle.setAttribute("aria-pressed","true");toggle.textContent="Return to village";
  view.invalidate();render();return true;
 }
 function close(){
  if(!active)return false;
  active=false;original.style.display="block";canvas.style.display="none";
  controls.style.display="none";
  toggle.setAttribute("aria-pressed","false");toggle.textContent="Open world atlas";
  drag=null;return true;
 }
 function pan(dx,dy){
  if(!active)return false;
  const changed=view.pan(dx,dy);render();return changed;
 }
 function center(x,y){if(!active)return false;const changed=view.setCenter(x,y);render();return changed;}
 function zoom(z){if(!active)return false;const changed=view.setZoom(z);render();return changed;}
 function inspect(x,y){
  if(!active)return null;
  const camera=view.camera();
  if(!Number.isInteger(x)||!Number.isInteger(y))return null;
  const known=view.known(x,y);
  const tile=known?view.store.tileAt(x,y):null;
  const names={0:"Grass",1:"Forest",2:"Water",3:"Stone",4:"Berry",6:"Meadow"};
  note.textContent="Atlas "+x+", "+y+" · "+(known?names[tile]||"Terrain":"Unexplored")+
   " · no direct Nim movement";
  return {x,y,known,tile};
 }
 function fromPointer(event){
  const r=canvas.getBoundingClientRect(),camera=view.camera();
  if(!r.width||!r.height)return null;
  const nx=(event.clientX-r.left)/r.width,ny=(event.clientY-r.top)/r.height;
  if(nx<0||nx>=1||ny<0||ny>=1)return null;
  return {x:camera.x+Math.floor(nx*camera.width),
   y:camera.y+Math.floor(ny*camera.height)};
 }
 toggle.addEventListener("click",()=>active?close():open());
 for(const [b,dx,dy] of moveButtons)b.addEventListener("click",()=>pan(dx,dy));
 zoomButton.addEventListener("click",()=>{if(active)zoom((view.camera().zoom+1)%Views.ZOOMS.length);});
 canvas.addEventListener("pointerdown",event=>{
  if(!active)return;
  drag={x:event.clientX,y:event.clientY,cx:view.camera().centerX,cy:view.camera().centerY};
  dragged=false;canvas.setPointerCapture(event.pointerId);
 });
 canvas.addEventListener("pointermove",event=>{
  if(!active||!drag)return;
  const rect=canvas.getBoundingClientRect(),c=view.camera();
  const dx=Math.round((drag.x-event.clientX)*c.width/Math.max(rect.width,1));
  const dy=Math.round((drag.y-event.clientY)*c.height/Math.max(rect.height,1));
  if(!dx&&!dy)return;
  dragged=true;center(drag.cx+dx,drag.cy+dy);
 });
 canvas.addEventListener("pointerup",event=>{
  if(active&&drag&&!dragged){
   const pos=fromPointer(event);if(pos)inspect(pos.x,pos.y);
  }
  drag=null;
 });
 canvas.addEventListener("pointercancel",()=>{drag=null;});
 // Capture the atlas's own shortcuts before the legacy finite camera handler.
 window.addEventListener("keydown",event=>{
  if(!active||event.target&&["INPUT","TEXTAREA"].includes(event.target.tagName))return;
  const step=8;
  const dirs={ArrowLeft:[-step,0],ArrowRight:[step,0],
   ArrowUp:[0,-step],ArrowDown:[0,step]};
  if(dirs[event.key]){event.preventDefault();event.stopImmediatePropagation();
   pan(dirs[event.key][0],dirs[event.key][1]);}
  else if(event.key==="z"||event.key==="Z"){
   event.preventDefault();event.stopImmediatePropagation();
   zoom((view.camera().zoom+1)%Views.ZOOMS.length);
  }else if(event.key==="Escape"){
   event.stopImmediatePropagation();close();
  }
 },true);
 Assets.loaded.then(()=>{if(view&&active){view.invalidate();render();}});
 window.GodseedChunkAtlas=Object.freeze({
  open,close,pan,setCenter:center,setZoom:zoom,inspect,render,
  stats:()=>view?{active,camera:view.camera(),view:view.stats(),surface:surface.stats()}:null,
  isOpen:()=>active
 });
})();
