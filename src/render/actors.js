(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GodseedActors=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function frame(actor,tick){return {direction:actor.facing||'south',phase:tick-(actor.movedAt||-100)<4?Math.floor(tick/2)%2:0};}
function sorted(actors){return actors.slice().sort((a,b)=>a.y-b.y||a.x-b.x||(a.id||0)-(b.id||0));}
function draw(ctx,assets,actor,tick,x,y){const f=frame(actor,tick);if(actor.type){const sprite=assets.manifest.atlases[3].items.find(a=>a.name===actor.type&&a.variant===f.phase);if(sprite)assets.blit(ctx,3,sprite.rect,x,y);return;}
 const sprite=assets.manifest.atlases[1].frames.find(a=>a.name===actor.name&&a.direction===f.direction&&a.phase===f.phase);if(sprite)assets.blit(ctx,1,sprite.rect,x,y-8);
 if(actor.favorUntil>tick){ctx.fillStyle='#EFCB76';ctx.fillRect(x+6,y-12,4,2);}
}
return {frame,sorted,draw};
});
