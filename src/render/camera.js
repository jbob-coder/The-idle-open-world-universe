(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GodseedCamera=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function bounds(c,r){const scale=Math.min(r.width/(c.width*16),r.height/(c.height*16));return {scale,left:r.left+(r.width-c.width*16*scale)/2,top:r.top+(r.height-c.height*16*scale)/2};}
function pointerToWorld(c,r,x,y){const b=bounds(c,r),ix=Math.floor((x-b.left)/(16*b.scale)),iy=Math.floor((y-b.top)/(16*b.scale));return ix<0||iy<0||ix>=c.width||iy>=c.height?{x:-1,y:-1}:{x:c.x+ix,y:c.y+iy};}
function worldToPointer(c,r,x,y){const b=bounds(c,r);return {x:b.left+(x-c.x+.5)*16*b.scale,y:b.top+(y-c.y+.5)*16*b.scale};}
return {pointerToWorld,worldToPointer,bounds};
});
