/* Pixel-square observer view: only the small selected room is drawn.
 * No extra atlas, no new render loop, and never moves Nim on the world map.
 */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GodseedInteriorView=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const COLORS={
 floor:'#957c60',wall:'#4b5046',door:'#d4bd83',bed:'#aeb09d',
 hearth:'#be7447',table:'#6d5037',storage:'#765c42',
 forge:'#b36d48',anvil:'#9ca6a2',counter:'#c99c66',water:'#609ca3'
};
function render(canvas,room,people=[]){
 if(!canvas||!room)return false;
 const g=room.layout||room,w=g.width,h=g.height,scale=12;
 canvas.width=w*scale;canvas.height=h*scale;canvas.style.aspectRatio=w+'/'+h;
 const c=canvas.getContext('2d',{alpha:false});c.imageSmoothingEnabled=false;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const t=g.tiles[y*w+x];
  c.fillStyle=COLORS[t]||COLORS.floor;c.fillRect(x*scale,y*scale,scale,scale);
  if(t==='floor'&&((x*3+y*7)%7===0)){c.fillStyle='#b49b7b';c.fillRect(x*scale+2,y*scale+2,2,2);}
  if(t==='wall'){c.fillStyle='#6e7061';c.fillRect(x*scale,y*scale,scale,2);}
  if(t==='door'){c.fillStyle='#584b3e';c.fillRect(x*scale+3,y*scale+2,6,10);c.fillStyle='#e2d095';c.fillRect(x*scale+7,y*scale+6,2,2);}
 }
 for(const o of g.objects){
  const x=o.x*scale,y=o.y*scale;
  c.fillStyle='#332e2a';c.fillRect(x+2,y+2,Math.max(3,o.w*scale-4),Math.max(3,o.h*scale-4));
  c.fillStyle=COLORS[o.kind]||'#c9a46c';c.fillRect(x+3,y+3,Math.max(2,o.w*scale-6),Math.max(2,o.h*scale-6));
  if(o.kind==='bed'){c.fillStyle='#e2d2b1';c.fillRect(x+4,y+4,Math.max(5,o.w*scale-8),6);}
  if(o.kind==='forge'){c.fillStyle='#e3a45b';c.fillRect(x+8,y+5,8,6);}
 }
 for(const [i,p] of people.slice(0,8).entries()){
  let x=(Number.isInteger(p.indoorX)?p.indoorX:g.door.x)+(i%2?1:0),
      y=(Number.isInteger(p.indoorY)?p.indoorY:g.door.y-1)-Math.floor(i/2);
  x=Math.max(1,Math.min(w-2,x));y=Math.max(1,Math.min(h-2,y));
  c.fillStyle='#162a27';c.fillRect(x*scale+3,y*scale+8,7,3);
  c.fillStyle=['#dec38d','#a7c18d','#e0a2a2','#c3badc'][i%4];c.fillRect(x*scale+4,y*scale+3,6,7);
  c.fillStyle='#e8bd94';c.fillRect(x*scale+5,y*scale+1,4,4);
 }
 return true;
}
return {render};
});
