/* GODSEED WLD-003: pixel-square chunk terrain Canvas surface.
 * Repaints only dirty 16px tiles; the source camera/cache stays memory-bounded.
 */
(function(root,factory) {
 "use strict";
 const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.GodseedChunkSurface=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const TILE_SIZE=16;
 const COLORS=Object.freeze({
  0:"#476c46",1:"#294e3e",2:"#285c76",3:"#6e7373",4:"#7b9a59",6:"#76945b"
 });
 function hash(x,y){
  let n=(Math.imul(x+91,374761393)^Math.imul(y+37,668265263))>>>0;
  return (n^(n>>>13))>>>0;
 }
 function square(ctx,x,y,fill){
  ctx.fillStyle=fill;ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
 }
 function paint(ctx,asset,tile,x,y,worldX,worldY){
  if(tile<0){
   square(ctx,x,y,"#111b21");
   ctx.fillStyle="#21323a";
   if(hash(worldX,worldY)%3===0)ctx.fillRect(x+7,y+7,2,2);
   return;
  }
  if(asset&&asset.ready&&asset.manifest&&asset.manifest.atlases&&
    asset.manifest.atlases[0]&&typeof asset.blit==="function"){
   const variants=asset.manifest.atlases[0].tiles;
   const frame=variants.find(t=>t.id===tile&&t.variant===hash(worldX,worldY)%3);
   if(frame&&frame.rect){asset.blit(ctx,0,frame.rect,x,y);return;}
  }
  square(ctx,x,y,COLORS[tile]||"#506554");
  // Readable 16x16 pixel patterns even while the packed atlas loads.
  ctx.fillStyle=tile===2?"#37758a":tile===3?"#a2a198":"#a0aa75";
  const h=hash(worldX,worldY);
  if(tile===2){ctx.fillRect(x+3,y+4,7,1);ctx.fillRect(x+7,y+11,6,1);}
  else if(tile===1){ctx.fillRect(x+3,y+3,10,8);ctx.fillStyle="#1d3d30";ctx.fillRect(x+6,y+8,5,6);}
  else if(tile===3){ctx.fillRect(x+4,y+2,7,5);ctx.fillRect(x+2,y+10,5,2);}
  else if(tile===4){ctx.fillRect(x+4,y+5,8,6);}
  else {ctx.fillRect(x+2+(h%8),y+3,2,3);ctx.fillRect(x+10,y+11,2,2);}
 }
 function create(canvas,assets){
  if(!canvas||typeof canvas.getContext!=="function")throw new TypeError("Canvas is required");
  const ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx)throw new Error("2D Canvas required");
  let last=null,draws=0,painted=0,skipped=0;
  function draw(view){
   const frame=view.renderFrame(),cam=frame.camera;
   const width=cam.width*TILE_SIZE,height=cam.height*TILE_SIZE;
   let cells=frame.dirty;
   if(canvas.width!==width||canvas.height!==height){
    canvas.width=width;canvas.height=height;
    cells=[];
    for(let index=0;index<frame.tiles.length;index++){
     cells.push({index,x:cam.x+index%cam.width,
      y:cam.y+Math.floor(index/cam.width),tile:frame.tiles[index]});
    }
   }
   ctx.imageSmoothingEnabled=false;
   for(const c of cells){
    const x=(c.index%cam.width)*TILE_SIZE;
    const y=Math.floor(c.index/cam.width)*TILE_SIZE;
    paint(ctx,assets,c.tile,x,y,c.x,c.y);
   }
   draws++;painted+=cells.length;if(!cells.length)skipped++;
   last={dirty:cells.length,camera:cam,painted};
   return last;
  }
  function stats(){return {draws,painted,skipped,last};}
  return Object.freeze({draw,stats});
 }
 return Object.freeze({TILE_SIZE,paint,create});
});
