/* Read-only observatory UI: the simulation and save schema are never mutated. */
(function(){
'use strict';
const O=window.GodseedObserver,debug=window.GodseedDebug,anchor=document.getElementById('inspect');
if(!O||!debug||!anchor)return;
const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
const css=el('style');
css.textContent='#godObservatory{margin-top:12px;padding:12px;background:#182d2c;border:2px solid #78998d;color:#e7e4cc;max-width:100%;overflow-wrap:anywhere}'+
 '#godObservatory h3{font-size:12px;color:#e9d39e;margin:0 0 5px;letter-spacing:.06em}'+
 '#godObservatory p{font-size:11px;color:#b9cbc1;margin:4px 0 9px}'+
 '#godObservatory select{width:100%;min-width:0;max-width:100%;min-height:44px;padding:8px;background:#233b38;color:#f4e5bc;border:1px solid #899a83;font:12px monospace}'+
 '#godObservatory dl{margin:9px 0;display:grid;grid-template-columns:minmax(80px,37%) minmax(0,1fr);gap:5px 9px;font-size:11px}'+
 '#godObservatory dt{color:#a6c4b7}#godObservatory dd{margin:0;color:#f0e4c5}'+
 '#godObservatory .ob-list{margin:5px 0 0;padding-left:17px;font-size:10px;max-height:120px;overflow-y:auto}'+
 '#godObservatory .ob-list li{margin:4px 0}#godObservatory h4{margin:8px 0 3px;font-size:11px;color:#e1cf97}';
document.head.appendChild(css);
const box=el('section');box.id='godObservatory';box.setAttribute('aria-label','Read-only Divine Observatory');
box.appendChild(el('h3','','DIVINE OBSERVATORY'));
box.appendChild(el('p','','Tap an observed person or building, or select a life below. No orders are issued.'));
const choice=el('select');choice.id='observerTarget';choice.setAttribute('aria-label','Choose person, settlement or building');
box.appendChild(choice);
const detail=el('div');detail.id='observerDetails';detail.setAttribute('aria-live','off');box.appendChild(detail);
anchor.insertAdjacentElement('afterend',box);
let selected='overview',lastTick=-1,lastList='',lastKey='';
function state(){return debug.getState();}
function render(force=false){
 const s=state();if(!s)return;
 const options=O.entries(s),signature=options.map(e=>e.key+'|'+e.label).join('\n');
 if(signature!==lastList){
  choice.replaceChildren();
  for(const item of options){const option=el('option','',item.label);option.value=item.key;choice.appendChild(option);}
  lastList=signature;
 }
 if(!options.some(x=>x.key===selected))selected='overview';
 choice.value=selected;
 if(!force&&lastTick===s.tick&&lastKey===selected)return;
 lastTick=s.tick;lastKey=selected;
 const data=O.inspect(s,selected);
 detail.replaceChildren();
 if(!data){detail.appendChild(el('p','','No observable record.'));return;}
 detail.appendChild(el('h4','',data.title));
 detail.appendChild(el('p','',data.subtitle));
 const dl=el('dl');
 for(const item of data.rows){dl.append(el('dt','',item.label),el('dd','',item.value));}
 detail.appendChild(dl);
 for(const [heading,values] of [['Life memories',data.memories],['Divine intentions',data.intentions]]){
  if(!values.length)continue;
  detail.appendChild(el('h4','',heading));
  const list=el('ul','ob-list');
  for(const v of values.slice(0,6))list.appendChild(el('li','',v));
  detail.appendChild(list);
 }
}
choice.addEventListener('change',()=>{selected=choice.value;render(true);});
const world=document.getElementById('world');
if(world)world.addEventListener('click',event=>{
 if(!document.querySelector('.power[data-power="inspect"].active'))return;
 const cam=debug.getCamera(),rect=world.getBoundingClientRect();
 const tile=window.GodseedCamera.pointerToWorld(cam,rect,event.clientX,event.clientY);
 const key=O.tileKey(state(),tile.x,tile.y);
 if(key){selected=key;render(true);}
});
render(true);
const clock=window.setInterval(()=>{if(!document.hidden)render();},1500);
window.addEventListener('pagehide',()=>window.clearInterval(clock),{once:true});
window.GodseedObservatory={select:key=>{if(O.inspect(state(),key)){selected=key;render(true);return true;}return false;},getSelection:()=>selected,refresh:()=>render(true)};
})();
