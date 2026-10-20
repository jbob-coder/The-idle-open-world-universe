/* GODSEED offline startup: visible from first parsed body, dismissed only after
 * decoded atlases and the world have actually rendered. No network or fake timer. */
(function(root){'use strict';
 const overlay=document.getElementById('godseedSplash');
 if(!overlay)return;
 const title=document.getElementById('splashStatus');
 const bar=document.getElementById('splashFill');
 const progress=document.getElementById('splashProgress');
 const percent=document.getElementById('splashPercent');
 const retry=document.getElementById('splashRetry');
 const enter=document.getElementById('splashEnter');
 const preview=new URLSearchParams(location.search).get('splashPreview')==='1';
 let current=0,ready=false,error=false;
 function step(value,message){
  if(ready||error)return;
  if(!Number.isFinite(value))return;
  current=Math.max(current,Math.min(100,Math.round(value)));
  bar.style.width=current+'%';
  progress.setAttribute('aria-valuenow',String(current));
  percent.textContent=current+'%';
  if(message)title.textContent=message;
 }
 function hide(){overlay.hidden=true;overlay.setAttribute('aria-busy','false');}
 function complete(){
  if(ready||error)return;
  step(100,'El mundo está listo');
  ready=true;
  overlay.setAttribute('aria-busy','false');
  // First paint the completed world behind the splash, then lift it.
  requestAnimationFrame(()=>{if(preview){enter.hidden=false;}else{hide();}});
 }
 function fail(message){
  if(ready)return;
  error=true;overlay.setAttribute('aria-busy','false');
  title.textContent='No se pudo cargar el mundo: '+String(message||'Error desconocido').slice(0,110);
  progress.setAttribute('aria-invalid','true');
  retry.hidden=false;
 }
 retry.addEventListener('click',()=>location.reload());
 enter.addEventListener('click',hide);
 root.GodseedSplash={step,complete,fail,getState:()=>({visible:!overlay.hidden,progress:current,ready,error,preview})};
})(window);
