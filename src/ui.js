/* GODSEED UI: intentionally dependency-free and low-resolution. */
(function(){'use strict';
const A=window.GodseedSim; if(!A)throw new Error('GODSEED simulation missing');
const $=id=>document.getElementById(id),size=16,VW=36,VH=22;
const canvas=$('world'),screenCtx=canvas.getContext('2d',{alpha:false}),mini=$('minimap'),mctx=mini.getContext('2d',{alpha:false});
const scenery=document.createElement('canvas');scenery.width=canvas.width;scenery.height=canvas.height;
const sceneryCtx=scenery.getContext('2d',{alpha:false});let ctx=screenCtx,sceneX=-1,sceneY=-1;
const oldCells=new Int16Array(VW*VH);oldCells.fill(-99);
screenCtx.imageSmoothingEnabled=false;sceneryCtx.imageSmoothingEnabled=false;mctx.imageSmoothingEnabled=false;
const SAVE_KEY='godseed-one-small-life-v1';let s,mode='inspect',camX=0,camY=0,lastDraw=0,lastHUD=0,lastSave=0,acc=0,frameLast=0,hover=null,flashMessage='',flashUntil=0;
try{s=A.restore(localStorage.getItem(SAVE_KEY));}catch(_){s=null}if(!s)s=A.create(Math.floor(Date.now()/1000));
const setMode=v=>{mode=v;document.querySelectorAll('[data-power]').forEach(b=>{b.classList.toggle('active',b.dataset.power===mode);b.setAttribute('aria-pressed',String(b.dataset.power===mode));});$('instruction').textContent=(v==='inspect'?'Inspect a tile by clicking the world.':`Select a tile to use ${v.toUpperCase()}.`);};
const html=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notify(message){flashMessage=message;flashUntil=Date.now()+2700;$('toast').textContent=message;$('toast').classList.add('show');}
function stamp(s){const hour=Math.floor((s.tick%240)/10),min=Math.floor((s.tick%10)*6);return `DAY ${s.day} · ${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`;}
const colors=['#3c5c43','#254b3a','#26536a','#62635e','#426c49','#837458','#688b57','#725338'];
const hash=(x,y)=>((Math.imul(x+91,374761393)^Math.imul(y+37,668265263))>>>0);
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x|0,y|0,w|0,h|0);}
function dot(x,y,c){rect(x,y,1,1,c);}
function drawTile(tile,x,y,wx,wy){let v=hash(wx,wy);rect(x,y,size,size,colors[tile]);
 // All ground motifs are deterministic rectangles; no image assets, shaders or allocations.
 if(tile===A.T.GRASS){if(v%5===0){rect(x+3,y+10,2,4,'#73936a');rect(x+12,y+6,1,3,'#a1aa73');}
  if(v%17===0){rect(x+9,y+9,3,2,'#837b68');rect(x+10,y+8,1,1,'#a39a7d');}
  if(v%29===0){rect(x+6,y+5,3,2,'#c4a66b');dot(x+5,y+5,'#b2bd8b');}return;}
 if(tile===A.T.WATER){rect(x,y+7,16,1,'#366b85');rect(x+(v%8),y+4,5,1,'#6ba5a9');if(v%3===0)rect(x+2,y+12,4,1,'#4d8499');
  if(v%7===0){rect(x+11,y+11,3,1,'#b1c8ad');}return;}
 if(tile===A.T.FOREST){rect(x+3,y+13,13,2,'#1b352a');rect(x+5,y+7,6,8,'#75583c');
  rect(x+2,y+5,12,7,'#1d3c31');rect(x+(v%3),y+2,12,7,'#2d7750');
  rect(x+5,y+1,7,6,v%3?'#38815c':'#51845e');rect(x+4,y+4,2,2,'#78a777');
  if(v%8===0){rect(x+12,y+12,2,2,'#d6b08a');}return;}
 if(tile===A.T.STONE){rect(x+1,y+13,14,2,'#303b3c');rect(x+2,y+10,13,5,'#3e4448');
  rect(x+4,y+5,10,8,'#90958a');rect(x+6,y+4,5,2,'#bdc4b1');
  rect(x+11,y+9,3,3,'#66746c');if(v%3===0){rect(x+2,y+2,4,2,'#666f66');}return;}
 if(tile===A.T.BERRY){rect(x+4,y+11,9,3,'#254a36');rect(x+3,y+5,10,8,'#4c9c5b');
  rect(x+6,y+4,6,6,'#2b7348');dot(x+4,y+7,'#e99b85');
  rect(x+10,y+9,2,2,'#f49c90');if(v%2===0)dot(x+8,y+6,'#f9bd91');return;}
 if(tile===A.T.RUIN){rect(x+1,y+12,14,3,'#353c36');rect(x+2,y+9,12,6,'#454843');
  rect(x+4,y+2,9,10,'#a8a38e');rect(x+6,y+4,5,1,'#dfc9a4');
  rect(x+7,y+6,2,5,'#555f56');dot(x+12,y+10,'#c1b49c');
  rect(x+2,y+3,2,3,'#62685a');rect(x+13,y+11,2,2,'#c4b98e');
  // Rune glyph is carved into the ancient stone, not a costly animated particle.
  dot(x+8,y+2,'#74b9aa');rect(x+8,y+3,1,2,'#74b9aa');return;}
 if(tile===A.T.CAMP){rect(x+1,y+13,14,2,'#2e2b25');rect(x+2,y+8,11,5,'#775039');
  rect(x+7,y+2,6,11,'#cb9f64');rect(x+2,y+7,12,2,'#d4b77f');
  rect(x+4,y+10,3,3,'#332d22');dot(x+8,y+1,'#d9d4b3');
  rect(x+12,y+11,2,3,'#f4a85c');dot(x+13,y+10,'#edcf76');return;}
 if(tile===A.T.MEADOW){rect(x+2,y+11,2,3,'#a3ba77');rect(x+11,y+8,2,3,'#b1d48c');
  dot(x+8,y+6,'#eacb81');dot(x+10,y+12,'#ebd0a1');
  if(v%4===0){rect(x+4,y+6,2,3,'#b5b688');dot(x+4,y+5,'#eabca0');}return;}
 dot(x+1+(v%12),y+2+((v>>>6)%12),'#50765b');if(v%4===0)dot(x+10,y+4,'#729478');
}
function drawBot(cx,cy,worldTime){const p=worldTime%6<3?0:1;rect(cx+4,cy+13,10,2,'#1c2926');rect(cx+5,cy+3,7,4,'#dfb482');rect(cx+6,cy+1,6,3,'#77533d');rect(cx+4,cy+7,9,5,'#e3c573');rect(cx+3,cy+8,2,3,'#af865d');rect(cx+12,cy+8,2,3,'#af865d');rect(cx+5,cy+12,3,2+p,'#453d38');rect(cx+10,cy+12,3,3-p,'#453d38');dot(cx+10,cy+4,'#302c29');}
function drawEnemy(x,y,e){rect(x+2,y+13,13,2,'#1b2b27');if(e.type==='Boar'){rect(x+2,y+6,12,7,'#b67a57');rect(x+10,y+3,4,5,'#d1a174');rect(x+3,y+5,3,2,'#7a4c36');dot(x+12,y+7,'#292424');rect(x+2,y+12,3,2,'#6b4534');}else{rect(x+3,y+7,10,6,'#a88473');rect(x+4,y+3,3,6,'#cab096');rect(x+10,y+3,3,6,'#cab096');rect(x+5,y+7,2,2,'#edcf9b');rect(x+10,y+7,2,2,'#edcf9b');dot(x+6,y+7,'#222');dot(x+11,y+7,'#222');}}
function drawPerson(x,y,p){
 const coat=['Apothecary','Herbalist'].includes(p.role)?'#819c72':['Rune Scholar','Lorekeeper'].includes(p.role)?'#846d9c':'#9b9e96';
 rect(x+3,y+13,11,2,'#22342c');rect(x+6,y+2,7,6,'#d8aa82');
 rect(x+5,y+1,9,3,['Rune Scholar','Lorekeeper'].includes(p.role)?'#b1a0c5':'#66503b');
 rect(x+4,y+8,10,5,coat);rect(x+3,y+9,2,3,'#d7b08c');
 rect(x+12,y+9,2,3,'#d7b08c');rect(x+5,y+13,3,2,'#433d34');
 rect(x+10,y+13,3,2,'#433d34');
 // A tiny readable heraldic insignia distinguishes medieval professions.
 if(p.role==='Squire')rect(x+8,y+9,3,4,'#c8c9b7');
 if(p.role==='Rune Scholar')dot(x+8,y+10,'#e6d39c');
 if(p.role==='Apothecary')dot(x+8,y+9,'#c1eab5');
 if(p.favorUntil>s.tick){rect(x+7,y-2,4,2,'#f2dc88');dot(x+5,y,'#f3e8ad');}
}
function updateScenery(){
 let changed=camX!==sceneX||camY!==sceneY,k=0;
 for(let ry=0;ry<VH;ry++)for(let rx=0;rx<VW;rx++){
  const wx=camX+rx,wy=camY+ry,n=A.idx(wx,wy);
  const tile=s.seen[n]?s.map[n]+1:0;
  if(oldCells[k]!==tile){oldCells[k]=tile;changed=true;}k++;
 }
 if(!changed)return;
 sceneX=camX;sceneY=camY;
 ctx=sceneryCtx;
 for(let ry=0;ry<VH;ry++)for(let rx=0;rx<VW;rx++){
  const wx=camX+rx,wy=camY+ry,n=A.idx(wx,wy),x=rx*size,y=ry*size;
  if(!s.seen[n]){rect(x,y,size,size,'#141e22');if(hash(wx,wy)%13===0)rect(x+7,y+7,2,2,'#233238');continue;}
  drawTile(s.map[n],x,y,wx,wy);
  // Light beaches and rocky shorelines make biome transitions readable.
  if(s.map[n]!==A.T.WATER&&wy>0&&s.map[A.idx(wx,wy-1)]===A.T.WATER)
   rect(x,y,16,2,'#b0a576');
  if(s.map[n]!==A.T.WATER&&wx>0&&s.map[A.idx(wx-1,wy)]===A.T.WATER)
   rect(x,y,2,16,'#918b6c');
 }
 ctx=screenCtx;
}
function positionCamera(){if(s.settings.follow){camX=Math.max(0,Math.min(A.W-VW,s.bot.x-(VW>>1)));camY=Math.max(0,Math.min(A.H-VH,s.bot.y-(VH>>1)));}}
function draw(){positionCamera();const b=s.bot;updateScenery();
 ctx.drawImage(scenery,0,0);
 if((s.tick%240)>172||(s.tick%240)<42)rect(0,0,canvas.width,canvas.height,'rgba(8,23,38,.18)');
 if(s.weather==='rain'){
  for(let i=0;i<35;i++){const x=(i*97+s.tick*3)%canvas.width,y=(i*71+s.tick*5)%canvas.height;
   rect(x,y,1,4,'rgba(172,201,205,.36)');}
 }
 if(s.guide&&s.guide.x>=camX&&s.guide.x<camX+VW&&s.guide.y>=camY&&s.guide.y<camY+VH){const x=(s.guide.x-camX)*16,y=(s.guide.y-camY)*16;rect(x,y,16,1,'#e4d386');rect(x,y+15,16,1,'#e4d386');rect(x,y,1,16,'#e4d386');rect(x+15,y,1,16,'#e4d386');}
 for(const p of s.npcs||[])if(p.x>=camX&&p.x<camX+VW&&p.y>=camY&&p.y<camY+VH&&s.seen[A.idx(p.x,p.y)])drawPerson((p.x-camX)*16,(p.y-camY)*16,p);
 for(const e of s.enemies)if(e.x>=camX&&e.x<camX+VW&&e.y>=camY&&e.y<camY+VH&&s.seen[A.idx(e.x,e.y)])drawEnemy((e.x-camX)*16,(e.y-camY)*16,e);
 if(b.x>=camX&&b.x<camX+VW&&b.y>=camY&&b.y<camY+VH){const px=(b.x-camX)*16,py=(b.y-camY)*16;rect(px+1,py+14,14,1,'#cfdda2');drawBot(px,py,s.tick>>1);ctx.fillStyle='#f0e0a2';ctx.font='bold 8px monospace';ctx.textAlign='center';ctx.fillText('NIM',px+8,py-3);ctx.textAlign='start';}
 for(const m of s.marks){if(m.x<camX||m.x>=camX+VW||m.y<camY||m.y>=camY+VH)continue;const xx=(m.x-camX)*16,yy=(m.y-camY)*16,c=({hit:'#e9dd88',hurt:'#ee7770',evade:'#88ccdb',parry:'#d1bb7c',bless:'#c4f7aa',gift:'#f1cb8d',bloom:'#85dbbb',guide:'#ddda92',storm:'#c6dffc',talk:'#f1c4a9',inspire:'#fff2a0'})[m.kind];rect(xx+2,yy+2,12,2,c);rect(xx+2,yy+12,12,2,c);rect(xx+2,yy+2,2,12,c);rect(xx+12,yy+2,2,12,c);}
 if(hover&&hover.x>=camX&&hover.x<camX+VW&&hover.y>=camY&&hover.y<camY+VH){const xx=(hover.x-camX)*16,yy=(hover.y-camY)*16;rect(xx,yy,16,1,'#efe2ac');rect(xx,yy+15,16,1,'#efe2ac');rect(xx,yy,1,16,'#efe2ac');rect(xx+15,yy,1,16,'#efe2ac');}
 $('coordinates').textContent=`${b.x}, ${b.y} · ${A.TILE_NAMES[s.map[A.idx(b.x,b.y)]]}`;
}
function drawMini(){const image=mctx.createImageData(A.W,A.H);for(let i=0;i<A.N;i++){const t=s.map[i],c=s.seen[i]?colors[t]:'#121c20';const k=i*4;image.data[k]=parseInt(c.slice(1,3),16);image.data[k+1]=parseInt(c.slice(3,5),16);image.data[k+2]=parseInt(c.slice(5,7),16);image.data[k+3]=255;}mctx.putImageData(image,0,0);mctx.fillStyle='#f9e6b2';mctx.fillRect(s.bot.x,s.bot.y,1,1);mctx.strokeStyle='#d9d8ab';mctx.lineWidth=.5;mctx.strokeRect(camX+.25,camY+.25,VW-.5,VH-.5);}
function bar(label,n,max=100){const pct=Math.round(Math.max(0,Math.min(1,n/max))*100);return `<div class="stat"><div class="stathead"><span>${label}</span><b>${Math.round(n)} / ${Math.round(max)}</b></div><div class="track"><i style="width:${pct}%" class="${label.toLowerCase().split(' ')[0]}"></i></div></div>`;}
function hud(){const b=s.bot,goal=b.goal;const xpNeed=10+b.level*8;
 $('quickStatus').textContent=`NIM L${b.level} · HP ${Math.ceil(b.hp)}/${b.maxHp} · ✧ ${s.faith} · ${stamp(s)}`;
 $('clock').textContent=stamp(s);$('weather').textContent=s.weather.toUpperCase();$('faith').textContent=s.faith;$('heroName').textContent=b.name;$('level').textContent=`LEVEL ${b.level}`;
 $('statbars').innerHTML=bar('Health',b.hp,b.maxHp)+bar('Hunger',b.hunger)+bar('Energy',b.energy)+bar('Experience',b.xp,xpNeed);
 $('goal').textContent=goal;$('thought').textContent='“'+b.thought+'”';
 $('inventory').innerHTML=`<span>🍎 Food <b>${b.food}</b></span><span>▥ Wood <b>${b.wood}</b></span><span>◆ Stone <b>${b.stone}</b></span><span>⚒ Tool <b>${b.tool?'Hatchet':'Hands'}</b></span>`;
 $('traits').textContent=`${b.background} · Curiosity ${Math.round(b.personality.curiosity*100)} · Caution ${Math.round(b.personality.caution*100)} · Resolve ${Math.round(b.personality.diligence*100)}`;
 $('skillRanks').textContent=A.SKILLS.map(k=>k.toUpperCase().slice(0,3)+' '+b.skills[k]).join(' · ');
 $('adventures').textContent=`${s.story.completed} rumors solved · ${s.story.clues.filter(q=>!q.solved).length} leads · ${b.tactics.dodge} dodges · ${b.tactics.parry} parries · ${b.tactics.trapsAvoided} traps avoided`;
 $('lead').textContent=(s.story.clues.find(q=>!q.solved)||{}).title||'No active legend';
 $('people').textContent=(s.npcs||[]).map(p=>p.name+' · '+p.role+' · '+p.mood+' · Confianza '+Math.round(p.trust)).join('  •  ')||'Sin viajeros todavía';
 $('memory').textContent=b.memory.length?b.memory.slice(-4).reverse().join('  •  '):'Learning about the world…';
 $('milestones').textContent=`${b.steps} steps · ${b.fights} wins · ${b.ruins} ruins · ${b.scars} second chances`;
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
$('saveApply').addEventListener('click',()=>{
 const restored=A.restore($('saveText').value);if(!restored){notify('Invalid world backup.');return;}
 if(!confirm('Replace current world with the pasted backup?'))return;
 s=restored;save();hud();draw();$('saveDialog').hidden=true;notify('World backup restored.');
});
function importSave(file){if(!file||file.size>1000000){notify('Invalid or oversized save file.');return;}const reader=new FileReader();reader.onload=()=>{const data=A.restore(reader.result);if(!data){notify('Save rejected: incompatible world.');return;}s=data;save();hud();draw();notify('World restored.');};reader.readAsText(file);}
function tileFromPointer(e){
 const r=canvas.getBoundingClientRect();
 // CSS object-fit:contain can letterbox the canvas on short landscape displays.
 // Account for those margins or divine interventions hit the wrong tile.
 const scale=Math.min(r.width/canvas.width,r.height/canvas.height);
 const renderedW=canvas.width*scale,renderedH=canvas.height*scale;
 const px=e.clientX-r.left-(r.width-renderedW)/2,py=e.clientY-r.top-(r.height-renderedH)/2;
 const ix=Math.floor(px*VW/renderedW),iy=Math.floor(py*VH/renderedH);
 return ix<0||iy<0||ix>=VW||iy>=VH?{x:-1,y:-1}:{x:camX+ix,y:camY+iy};
}
canvas.addEventListener('pointermove',e=>{hover=tileFromPointer(e);});canvas.addEventListener('pointerleave',()=>{hover=null;});
canvas.addEventListener('click',e=>{let {x,y}=tileFromPointer(e);if(!A.inside(x,y))return;if(mode==='inspect'){const known=s.seen[A.idx(x,y)],near=known?s.enemies.find(z=>z.x===x&&z.y===y):null,person=known?(s.npcs||[]).find(z=>z.x===x&&z.y===y):null,t=A.TILE_NAMES[s.map[A.idx(x,y)]];let message=`(${x},${y}) ${s.seen[A.idx(x,y)]?t:'Unexplored'}`+(near?` · ${near.type} ${near.hp} HP`:'')+(person?` · ${person.name} (${person.role}) · ${person.mood} · Trust ${Math.round(person.trust)}`:'');notify(message);$('inspect').textContent=message;return;}
 const r=A.power(s,mode,x,y);notify(r.ok?`${mode.toUpperCase()} used. -${r.cost} Faith`:r.why);if(r.ok){save();hud();draw();}});
mini.addEventListener('click',e=>{const r=mini.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)*A.W/r.width),y=Math.floor((e.clientY-r.top)*A.H/r.height);s.settings.follow=false;camX=Math.max(0,Math.min(A.W-VW,x-(VW>>1)));camY=Math.max(0,Math.min(A.H-VH,y-(VH>>1)));hud();draw();});
document.querySelectorAll('[data-power]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.power)));
document.querySelectorAll('[data-speed]').forEach(b=>b.addEventListener('click',()=>{s.settings.speed=Number(b.dataset.speed);hud();notify(s.settings.speed===0?'Time paused.':`Time running at ${s.settings.speed}×.`);}));
$('follow').addEventListener('click',()=>{s.settings.follow=!s.settings.follow;hud();draw();});
$('save').addEventListener('click',()=>{save();notify('World saved.');});$('export').addEventListener('click',()=>backupDialog('export'));
$('import').addEventListener('click',()=>backupDialog('import'));$('importFile').addEventListener('change',e=>{importSave(e.target.files[0]);e.target.value='';});
$('reset').addEventListener('click',()=>{if(confirm('Create a new world? Current progress will be overwritten. Export a backup first if needed.')){s=A.create((Date.now()>>>0)^Math.floor(Math.random()*10000000));save();hud();draw();notify('A new life begins.');}});
$('step').addEventListener('click',()=>{A.tick(s);hud();draw();});
window.addEventListener('keydown',e=>{if(e.target&&['INPUT','TEXTAREA'].includes(e.target.tagName))return;
 if(e.code==='Space'){e.preventDefault();s.settings.speed=s.settings.speed===0?1:0;hud();}
 if(e.key.toLowerCase()==='f'){$('follow').click();}
 if(e.key==='.'||e.key==='>'){$('step').click();}
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'||e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();s.settings.follow=false;camX=Math.max(0,Math.min(A.W-VW,camX+(e.key==='ArrowLeft'?-3:e.key==='ArrowRight'?3:0)));camY=Math.max(0,Math.min(A.H-VH,camY+(e.key==='ArrowUp'?-3:e.key==='ArrowDown'?3:0)));hud();draw();}
 if(/^[0-6]$/.test(e.key)){const names=['inspect','bless','gift','bloom','guide','storm','inspire'];setMode(names[Number(e.key)]);}
});
let active=true;document.addEventListener('visibilitychange',()=>{active=!document.hidden;frameLast=0;acc=0;if(!active)save();});window.addEventListener('beforeunload',save);
function frame(ts){requestAnimationFrame(frame);if(!active)return;if(!frameLast)frameLast=ts;const dt=Math.min(.15,Math.max(0,(ts-frameLast)/1000));frameLast=ts;acc+=dt*4*s.settings.speed;let loops=0;while(acc>=1&&loops<32){A.tick(s);acc-=1;loops++;}if(loops===32)acc=0;
 if(ts-lastDraw>85){draw();lastDraw=ts;}
 if(ts-lastHUD>450){hud();lastHUD=ts;}
 if(ts-lastSave>16000){save();lastSave=ts;}
 if(flashUntil&&Date.now()>flashUntil){$('toast').classList.remove('show');flashUntil=0;}}
setMode('inspect');hud();draw();requestAnimationFrame(frame);
window.GodseedDebug={getState:()=>s,setSpeed:(n)=>{s.settings.speed=n;hud();},step:(n)=>{for(let i=0;i<n;i++)A.tick(s);hud();draw();},newWorld:(seed)=>{s=A.create(seed);hud();draw();}};
})();
