(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GodseedFX=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function create(){let world=null,highest=0,effects=[];return {
 sync(s,now){if(world!==s){world=s;highest=0;effects=[];}for(const m of s.marks){if(!m.id||m.id<=highest)continue;highest=m.id;effects.push({id:m.id,kind:m.kind,x:m.x,y:m.y,start:now});}effects=effects.filter(e=>now-e.start<1000).slice(-12);},
 list(now){effects=effects.filter(e=>now-e.start<1000);return effects;},
 draw(ctx,assets,camera,now,reduced){for(const e of this.list(now)){if(e.x<camera.x||e.x>=camera.x+camera.width||e.y<camera.y||e.y>=camera.y+camera.height)continue;
  const x=(e.x-camera.x)*16,y=(e.y-camera.y)*16,phase=reduced?1:Math.min(7,Math.floor((now-e.start)/125));
  const symbol=assets.manifest.atlases[2].symbols.find(f=>f.name===e.kind);
  if(symbol)assets.blit(ctx,2,symbol.rect,x,y-8-(reduced?0:Math.floor(phase/2)));
  else {ctx.fillStyle=e.kind==='hurt'?'#A45A44':'#EFCB76';ctx.fillRect(x+3,y+2,10,1);ctx.fillRect(x+3,y+12,10,1);}
  if(!reduced&&symbol&&phase<6){ctx.fillStyle='#EFCB76';ctx.fillRect(x+2-phase,y+3,1,1);ctx.fillRect(x+13+phase,y+3,1,1);}
 }}
};}
return {create};
});
