/* GODSEED UI: intentionally dependency-free and low-resolution. */
(function(){'use strict';
const A=window.GodseedSim; if(!A)throw new Error('GODSEED simulation missing');
const $=id=>document.getElementById(id),size=16;
const ZOOMS=[{name:'Panorama',w:32,h:20},{name:'Cerca',w:24,h:15},{name:'Inspección',w:16,h:10}];
let zoomIndex=0,VW=ZOOMS[0].w,VH=ZOOMS[0].h;
const canvas=$('world'),screenCtx=canvas.getContext('2d',{alpha:false}),mini=$('minimap'),mctx=mini.getContext('2d',{alpha:false});
const scenery=document.createElement('canvas');scenery.width=canvas.width;scenery.height=canvas.height;
const sceneryCtx=scenery.getContext('2d',{alpha:false});let ctx=screenCtx,sceneX=-1,sceneY=-1;
let sceneryRedraws=0;
let oldCells=new Int16Array(VW*VH);oldCells.fill(-99);
screenCtx.imageSmoothingEnabled=false;sceneryCtx.imageSmoothingEnabled=false;mctx.imageSmoothingEnabled=false;
const SAVE_KEY='godseed-one-small-life-v1';let s,mode='inspect',camX=0,camY=0,lastDraw=0,lastHUD=0,lastSave=0,acc=0,frameLast=0,hover=null,flashMessage='',flashUntil=0;
try{s=A.restore(localStorage.getItem(SAVE_KEY));}catch(_){s=null}if(!s)s=A.create(Math.floor(Date.now()/1000));
function setZoom(next){
 zoomIndex=(next+ZOOMS.length)%ZOOMS.length;
 ({w:VW,h:VH}=ZOOMS[zoomIndex]);
 canvas.width=scenery.width=VW*size;canvas.height=scenery.height=VH*size;
 screenCtx.imageSmoothingEnabled=false;sceneryCtx.imageSmoothingEnabled=false;
 oldCells=new Int16Array(VW*VH);oldCells.fill(-99);sceneX=-1;sceneY=-1;
 camX=Math.max(0,Math.min(A.W-VW,camX));camY=Math.max(0,Math.min(A.H-VH,camY));
 const z=$('zoom');if(z){z.textContent='Zoom: '+ZOOMS[zoomIndex].name;z.setAttribute('aria-label','Zoom de cámara: '+ZOOMS[zoomIndex].name);}
 const status=$('zoomStatus');if(status)status.textContent=ZOOMS[zoomIndex].name+' · '+VW+' × '+VH+' casillas';
}
setZoom(0);
const setMode=v=>{mode=v;document.querySelectorAll('[data-power]').forEach(b=>{b.classList.toggle('active',b.dataset.power===mode);b.setAttribute('aria-pressed',String(b.dataset.power===mode));});$('instruction').textContent=(v==='inspect'?'Inspect a tile by clicking the world.':`Select a tile to use ${v.toUpperCase()}.`);};
const html=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notify(message){flashMessage=message;flashUntil=Date.now()+2700;$('toast').textContent=message;$('toast').classList.add('show');}
function stamp(s){const hour=Math.floor((s.tick%240)/10),min=Math.floor((s.tick%10)*6);return `DAY ${s.day} · ${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;}
const colors=['#3c5c43','#254b3a','#26536a','#62635e','#426c49','#837458','#688b57','#725338','#8b7e60','#76664c','#574f68'];
const hash=(x,y)=>((Math.imul(x+91,374761393)^Math.imul(y+37,668265263))>>>0);
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x|0,y|0,w|0,h|0);}
function dot(x,y,c){rect(x,y,1,1,c);}
const assets=window.GodseedAssets,terrain=window.GodseedTerrain,visualFx=window.GodseedFX.create();
const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');let reducedMotion=motionQuery.matches;
$('reduceMotion').checked=reducedMotion;$('reduceMotion').addEventListener('change',e=>{reducedMotion=e.target.checked;});
assets.loaded.then(()=>{document.querySelectorAll('[data-power]').forEach(button=>{const slot=button.querySelector('.ico,.power-icon');if(!slot)return;slot.textContent='';const c=document.createElement('canvas');c.width=c.height=16;c.className='power-pixel';c.setAttribute('aria-hidden','true');slot.appendChild(c);const f=assets.manifest.atlases[2].symbols.find(f=>f.name===button.dataset.power);if(f)assets.blit(c.getContext('2d'),2,f.rect,0,0);});const portrait=$('portrait');const f=assets.manifest.atlases[1].frames[0];assets.blit(portrait.getContext('2d'),1,f.rect,0,0);oldCells.fill(-99);draw();}).catch(e=>notify(e.message));
function drawTile(tile,x,y,wx,wy){if(assets.ready)terrain.draw(ctx,assets,s,tile,x,y,wx,wy);else rect(x,y,16,16,'#152723');}
function updateScenery(){
 let changed=camX!==sceneX||camY!==sceneY,k=0;
 for(let ry=0;ry<VH;ry++)for(let rx=0;rx<VW;rx++){
  const wx=camX+rx,wy=camY+ry,n=A.idx(wx,wy);
  const tile=s.seen[n]?(s.map[n]+1)*32+((s.map[n]===8||s.map[n]===2)?terrain.mask(s,wx,wy,s.map[n]):0):0;
  if(oldCells[k]!==tile){oldCells[k]=tile;changed=true;}k++;
 }
 if(!changed)return;
 sceneX=camX;sceneY=camY;sceneryRedraws++;
 ctx=sceneryCtx;
 for(let ry=0;ry<VH;ry++)for(let rx=0;rx<VW;rx++){
  const wx=camX+rx,wy=camY+ry,n=A.idx(wx,wy),x=rx*size,y=ry*size;
  if(!s.seen[n]){rect(x,y,size,size,'#11191A');continue;}
  drawTile(s.map[n],x,y,wx,wy);

 }
 ctx=screenCtx;
}
function positionCamera(){if(s.settings.follow){camX=Math.max(0,Math.min(A.W-VW,s.bot.x-(VW>>1)));camY=Math.max(0,Math.min(A.H-VH,s.bot.y-(VH>>1)));}}
function draw(){positionCamera();const b=s.bot;updateScenery();
 ctx.drawImage(scenery,0,0);
 if((s.tick%240)>172||(s.tick%240)<42)rect(0,0,canvas.width,canvas.height,'rgba(8,23,38,.18)');
 if(s.weather==='rain'&&!reducedMotion){
  for(let i=0;i<35;i++){const x=(i*97+s.tick*3)%canvas.width,y=(i*71+s.tick*5)%canvas.height;
   rect(x,y,1,4,'rgba(172,201,205,.36)');}
 }
 if(s.guide&&s.guide.x>=camX&&s.guide.x<camX+VW&&s.guide.y>=camY&&s.guide.y<camY+VH){const x=(s.guide.x-camX)*16,y=(s.guide.y-camY)*16;rect(x,y,16,1,'#e4d386');rect(x,y+15,16,1,'#e4d386');rect(x,y,1,16,'#e4d386');rect(x+15,y,1,16,'#e4d386');}
 const actors=window.GodseedActors.sorted([...(s.npcs||[]),...s.enemies,b]);
 for(const actor of actors){if(actor.x<camX||actor.x>=camX+VW||actor.y<camY||actor.y>=camY+VH||!s.seen[A.idx(actor.x,actor.y)])continue;
  const px=(actor.x-camX)*16,py=(actor.y-camY)*16;
  if(actor===b){rect(px+1,py+15,14,1,'#EFCB76');}
  window.GodseedActors.draw(ctx,assets,actor,s.tick,px,py);
  if(actor===b){ctx.fillStyle='#EAE3C1';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('NIM',px+8,py-10);ctx.textAlign='start';}
 }
 visualFx.sync(s,performance.now());visualFx.draw(ctx,assets,{x:camX,y:camY,width:VW,height:VH},performance.now(),reducedMotion);
 if(hover&&hover.x>=camX&&hover.x<camX+VW&&hover.y>=camY&&hover.y<camY+VH){const xx=(hover.x-camX)*16,yy=(hover.y-camY)*16;
  const result=mode==='inspect'?{ok:!!s.seen[A.idx(hover.x,hover.y)],why:'Unexplored'}:A.previewPower(s,mode,hover.x,hover.y);
  const c=result.ok?'#EFCB76':'#A45A44';rect(xx,yy,16,1,c);rect(xx,yy+15,16,1,c);rect(xx,yy,1,16,c);rect(xx+15,yy,1,16,c);
  if(!result.ok){rect(xx+7,yy+4,2,5,c);rect(xx+7,yy+11,2,2,c);}
  canvas.title=result.ok?(mode==='inspect'?'Inspect':mode+' · '+A.COST[mode]+' Faith'):result.why;
 }
 $('coordinates').textContent=`${b.x}, ${b.y} · ${A.regionAt(s,b.x,b.y).name} · ${ZOOMS[zoomIndex].name}`;
}
function drawMini(){const image=mctx.createImageData(A.W,A.H);for(let i=0;i<A.N;i++){const t=s.map[i],c=s.seen[i]?colors[t]:'#121c20';const k=i*4;image.data[k]=parseInt(c.slice(1,3),16);image.data[k+1]=parseInt(c.slice(3,5),16);image.data[k+2]=parseInt(c.slice(5,7),16);image.data[k+3]=255;}mctx.putImageData(image,0,0);mctx.fillStyle='#f9e6b2';mctx.fillRect(s.bot.x,s.bot.y,1,1);mctx.strokeStyle='#d9d8ab';mctx.lineWidth=.5;mctx.strokeRect(camX+.25,camY+.25,VW-.5,VH-.5);}
function bar(label,n,max=100){const pct=Math.round(Math.max(0,Math.min(1,n/max))*100);return `<div class="stat"><div class="stathead"><span>${label}</span><b>${Math.round(n)} / ${Math.round(max)}</b></div><div class="track"><i style="width:${pct}%" class="${label.toLowerCase().split(' ')[0]}"></i></div></div>`;}
function hud(){const b=s.bot,goal=b.goal;const xpNeed=10+b.level*8;
 $('quickStatus').textContent=`NIM L${b.level} · HP ${Math.ceil(b.hp)}/${b.maxHp} · Faith ${s.faith} · ${b.goal}`;
 $('clock').textContent=stamp(s);$('weather').textContent=s.weather.toUpperCase()+' · '+({R03:'WOODLAND',R04:'RIDGE WINDS',R06:'SACRED GROVE',R07:'FEN MIST'}[A.regionAt(s,b.x,b.y).id]||'BORDERLANDS');$('faith').textContent=s.faith;$('heroName').textContent=b.name;$('level').textContent=`LEVEL ${b.level}`;
 $('statbars').innerHTML=bar('Health',b.hp,b.maxHp)+bar('Hunger',b.hunger)+bar('Energy',b.energy)+bar('Experience',b.xp,xpNeed);
 $('goal').textContent=goal;$('thought').textContent='“'+b.thought+'”';
 $('inventory').innerHTML=`<span>Food <b>${b.food}</b></span><span>Wood <b>${b.wood}</b></span><span>Stone <b>${b.stone}</b></span><span>Tool <b>${b.tool?'Hatchet':'Hands'}</b></span>`;
 $('traits').textContent=`${b.background} · Curiosity ${Math.round(b.personality.curiosity*100)} · Caution ${Math.round(b.personality.caution*100)} · Resolve ${Math.round(b.personality.diligence*100)}`;
 $('skillRanks').textContent=A.SKILLS.map(k=>k.toUpperCase().slice(0,3)+' '+b.skills[k]).join(' · ');
 $('adventures').textContent=`${s.story.completed} rumors solved · ${s.story.clues.filter(q=>!q.solved).length} leads · ${b.tactics.dodge} dodges · ${b.tactics.parry} parries · ${b.tactics.trapsAvoided} traps avoided`;
 $('lead').textContent=(s.story.clues.find(q=>!q.solved)||{}).title||'No active legend';
 $('people').textContent=(s.npcs||[]).map(p=>p.name+' · '+p.role+' · '+p.mood+' · '+(p.activity||'Patrullando')+' · Confianza '+Math.round(p.trust)).join('  •  ')||'Sin viajeros todavía';
 $('milestones').title=(s.shrinesVisited||[]).length+' santuarios antiguos visitados';
 $('memory').textContent=b.memory.length?b.memory.slice(-4).reverse().join('  •  '):'Learning about the world…';
 $('milestones').textContent=`${b.steps} steps · ${b.fights} wins · ${b.ruins} ruins · ${b.scars} second chances`;

 const chapter=A.chapterStatus(s);
 $('chapterTitle').textContent=chapter.name.toUpperCase();
 $('chapterStep').textContent=chapter.completed?'3 / 3 · COMPLETED':(chapter.stage+1)+' / '+chapter.total+' · '+chapter.title;
 $('chapterObjective').textContent=chapter.objective;
 $('chapterProgress').setAttribute('aria-valuenow',String(chapter.stage));
 $('chapterProgressFill').style.width=Math.round(100*chapter.stage/chapter.total)+'%';
 const chapterTwo=A.roadStatus(s),panelTwo=$('chapterTwoPanel');
 panelTwo.hidden=!chapterTwo.unlocked;
 if(chapterTwo.unlocked){
  $('chapterTwoTitle').textContent=chapterTwo.name.toUpperCase();
  $('chapterTwoStep').textContent=chapterTwo.completed?'3 / 3 · COMPLETED':
   (chapterTwo.stage+1)+' / '+chapterTwo.total+' · '+chapterTwo.title;
  $('chapterTwoObjective').textContent=chapterTwo.objective;
  $('chapterTwoProgress').setAttribute('aria-valuenow',String(chapterTwo.stage));
  $('chapterTwoProgressFill').style.width=Math.round(100*chapterTwo.stage/chapterTwo.total)+'%';
 }

 $('events').innerHTML=s.log.slice(0,9).map(e=>`<div class="event ${html(e.type)}"><span class="evt-time">D${1+Math.floor(e.tick/240)}</span><div><strong>${html(e.title)}</strong><small>${html(e.detail)}</small></div></div>`).join('');
 $('powers').querySelectorAll('[data-power]').forEach(el=>{const c=A.COST[el.dataset.power];if(c!==undefined)el.classList.toggle('unaffordable',c>s.faith);});
 document.querySelectorAll('[data-speed]').forEach(el=>{const n=Number(el.dataset.speed);el.classList.toggle('active',s.settings.speed===n);el.setAttribute('aria-pressed',String(s.settings.speed===n));});
 $('follow').classList.toggle('active',s.settings.follow);$('follow').setAttribute('aria-pressed',String(s.settings.follow));
 drawMini();}
function save(){try{localStorage.setItem(SAVE_KEY,A.serialize(s));$('saveState').textContent='Saved locally';return true;}catch(e){$('saveState').textContent='Local saving blocked. Use Export.';return false;}}
function exportSave(){const blob=new Blob([A.serialize(s)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`godseed-day-${s.day}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),500);notify('World exported to JSON.');}
function backupDialog(kind){
 const box=$('saveDialog'),text=$('saveText');box.hidden=false;
 const exporting=kind==='export';
 $('backupTitle').textContent=exporting?'Export world backup':'Import world backup';
 $('backupHelp').textContent=exporting?'Copy this JSON to a safe place. Your game also auto-saves while installed.':'Paste previously exported GODSEED JSON below, then choose Import. This replaces the current world.';
 text.readOnly=exporting;text.value=exporting?A.serialize(s):'';text.placeholder=exporting?'':'Paste a saved GODSEED world here';
 $('saveCopy').hidden=!exporting;$('saveApply').hidden=exporting;$('saveDownload').hidden=!exporting;
 if(exporting){text.focus();text.select();}else{text.focus();}
}
$('saveClose').addEventListener('click',()=>{$('saveDialog').hidden=true;});
$('saveCopy').addEventListener('click',()=>{
 const t=$('saveText');t.focus();t.select();
 let copied=false;try{copied=document.execCommand('copy');}catch(_){}
 if(copied)notify('World backup copied.');else notify('Select the text and copy it manually.');
});
$('saveDownload').addEventListener('click',exportSave);
let pendingConfirmation=null;
function confirmAction(message,action){pendingConfirmation=action;$('confirmMessage').textContent=message;$('confirmDialog').hidden=false;$('confirmApply').focus();}
$('confirmCancel').addEventListener('click',()=>{pendingConfirmation=null;$('confirmDialog').hidden=true;});
$('confirmApply').addEventListener('click',()=>{const action=pendingConfirmation;pendingConfirmation=null;$('confirmDialog').hidden=true;if(action)action();});
$('saveApply').addEventListener('click',()=>{
 const restored=A.restore($('saveText').value);if(!restored){notify('Invalid world backup.');return;}
 confirmAction('Replace current world with the pasted backup?',()=>{if(!commitRestored(restored))return;hud();draw();$('saveDialog').hidden=true;notify('World backup restored.');});
});
function commitRestored(data){try{localStorage.setItem(SAVE_KEY,A.serialize(data));}catch(e){notify('Storage full or unavailable. Current world preserved.');return false;}s=data;acc=0;frameLast=0;oldCells.fill(-99);return true;}
function importSave(file){if(!file||file.size>1000000){notify('Invalid or oversized save file.');return;}const reader=new FileReader();reader.onload=()=>{const data=A.restore(reader.result);if(!data){notify('Save rejected: incompatible world.');return;}if(!commitRestored(data))return;hud();draw();notify('World restored.');};reader.readAsText(file);}
function tileFromPointer(e){return window.GodseedCamera.pointerToWorld({x:camX,y:camY,width:VW,height:VH},canvas.getBoundingClientRect(),e.clientX,e.clientY);}
let drag=null,suppressClick=false;
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,cx:camX,cy:camY};suppressClick=false;canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!drag)return;const scale=window.GodseedCamera.bounds({width:VW,height:VH},canvas.getBoundingClientRect()).scale;
 const dx=Math.round((e.clientX-drag.x)/(size*scale)),dy=Math.round((e.clientY-drag.y)/(size*scale));
 if(dx||dy){suppressClick=true;s.settings.follow=false;camX=Math.max(0,Math.min(A.W-VW,drag.cx-dx));camY=Math.max(0,Math.min(A.H-VH,drag.cy-dy));draw();}});
canvas.addEventListener('pointerup',()=>{drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;suppressClick=true;});
canvas.addEventListener('pointermove',e=>{hover=tileFromPointer(e);});canvas.addEventListener('pointerleave',()=>{hover=null;});
canvas.addEventListener('click',e=>{if(suppressClick){suppressClick=false;return;}let {x,y}=tileFromPointer(e);if(!A.inside(x,y))return;if(mode==='inspect'){const known=s.seen[A.idx(x,y)],near=known?s.enemies.find(z=>z.x===x&&z.y===y):null,person=known?(s.npcs||[]).find(z=>z.x===x&&z.y===y):null,t=A.TILE_NAMES[s.map[A.idx(x,y)]];let message=`(${x},${y}) ${s.seen[A.idx(x,y)]?t+' · '+A.regionAt(s,x,y).name:'Unexplored'}`+(near?` · ${near.type} ${near.hp} HP`:'')+(person?` · ${person.name} (${person.role}) · ${person.mood} · Trust ${Math.round(person.trust)}`:'');notify(message);$('inspect').textContent=message;return;}
 const r=A.power(s,mode,x,y);notify(r.ok?`${mode.toUpperCase()} used. -${r.cost} Faith`:r.why);if(r.ok){save();hud();draw();}});
mini.addEventListener('click',e=>{const r=mini.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)*A.W/r.width),y=Math.floor((e.clientY-r.top)*A.H/r.height);s.settings.follow=false;camX=Math.max(0,Math.min(A.W-VW,x-(VW>>1)));camY=Math.max(0,Math.min(A.H-VH,y-(VH>>1)));hud();draw();});
document.querySelectorAll('[data-power]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.power)));
document.querySelectorAll('[data-speed]').forEach(b=>b.addEventListener('click',()=>{s.settings.speed=Number(b.dataset.speed);hud();notify(s.settings.speed===0?'Time paused.':`Time running at ${s.settings.speed}×.`);}));
$('follow').addEventListener('click',()=>{s.settings.follow=!s.settings.follow;hud();draw();});
$('zoom').addEventListener('click',()=>{setZoom(zoomIndex+1);hud();draw();notify('Cámara '+ZOOMS[zoomIndex].name+' · Nim sigue actuando solo.');});
$('zoomDock').addEventListener('click',()=>$('zoom').click());
$('save').addEventListener('click',()=>{save();notify('World saved.');});$('export').addEventListener('click',()=>backupDialog('export'));
$('import').addEventListener('click',()=>backupDialog('import'));$('importFile').addEventListener('change',e=>{importSave(e.target.files[0]);e.target.value='';});
$('reset').addEventListener('click',()=>{confirmAction('Create a new world? Export a backup first to keep current progress.',()=>{const next=A.create((Date.now()>>>0)^Math.floor(Math.random()*10000000));if(!commitRestored(next))return;hud();draw();notify('A new life begins.');});});
$('step').addEventListener('click',()=>{A.tick(s);hud();draw();});
window.addEventListener('keydown',e=>{if(e.key==='Escape'){pendingConfirmation=null;$('confirmDialog').hidden=true;$('saveDialog').hidden=true;return;}if(e.target&&['INPUT','TEXTAREA'].includes(e.target.tagName))return;
 if(e.code==='Space'){e.preventDefault();s.settings.speed=s.settings.speed===0?1:0;hud();}
 if(e.key.toLowerCase()==='f'){$('follow').click();}
 if(e.key.toLowerCase()==='z'){$('zoom').click();}
 if(e.key==='.'||e.key==='>'){$('step').click();}
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();s.settings.follow=false;camX=Math.max(0,Math.min(A.W-VW,camX+(e.key==='ArrowLeft'?-3:e.key==='ArrowRight'?3:0)));camY=Math.max(0,Math.min(A.H-VH,camY+(e.key==='ArrowUp'?-3:e.key==='ArrowDown'?3:0)));hud();draw();}
 if(/^[0-6]$/.test(e.key)){const names=['inspect','bless','gift','bloom','guide','storm','inspire'];setMode(names[Number(e.key)]);}
});
let active=true;document.addEventListener('visibilitychange',()=>{active=!document.hidden;frameLast=0;acc=0;if(!active)save();});window.addEventListener('beforeunload',save);window.addEventListener('pagehide',()=>{active=false;acc=0;frameLast=0;save();});window.addEventListener('pageshow',()=>{active=!document.hidden;acc=0;frameLast=0;});
window.GodseedHostLifecycle={pause:()=>{active=false;acc=0;frameLast=0;save();},resume:()=>{active=true;acc=0;frameLast=0;}};
function frame(ts){requestAnimationFrame(frame);if(!active)return;if(!frameLast)frameLast=ts;const dt=Math.min(.15,Math.max(0,(ts-frameLast)/1000));frameLast=ts;acc+=dt*4*s.settings.speed;let loops=0;while(acc>=1&&loops<32){A.tick(s);acc-=1;loops++;}if(loops===32)acc=0;
 if(ts-lastDraw>50){draw();lastDraw=ts;}
 if(ts-lastHUD>450){hud();lastHUD=ts;}
 if(ts-lastSave>16000){save();lastSave=ts;}
 if(flashUntil&&Date.now()>flashUntil){$('toast').classList.remove('show');flashUntil=0;}}
setMode('inspect');hud();draw();requestAnimationFrame(frame);
window.GodseedDebug={getState:()=>s,getRenderStats:()=>({sceneryRedraws,atlasesReady:assets.ready,decodedBytes:assets.decodedBytes,activeEffects:visualFx.list(performance.now()).length,reducedMotion}),draw,getCamera:()=>({x:camX,y:camY,width:VW,height:VH,zoom:ZOOMS[zoomIndex].name}),setZoom:(i)=>{setZoom(i);hud();draw();},setSpeed:(n)=>{s.settings.speed=n;hud();},step:(n)=>{for(let i=0;i<n;i++)A.tick(s);hud();draw();},newWorld:(seed)=>{s=A.create(seed);hud();draw();}};
})();
