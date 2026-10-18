/* Native-pixel settlement structures. 2x2 world-tile blueprints drawn directly
 * into the existing cached Canvas terrain layer; no new atlases or RAM buffers. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GodseedSettlements=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const tones={
 timber:{wall:'#b7956d',roof:'#765038',trim:'#edcd8a',shadow:'#452f28'},
 stone:{wall:'#929c98',roof:'#495963',trim:'#d5dbc2',shadow:'#354447'},
 moss:{wall:'#85a083',roof:'#47664e',trim:'#e1c98e',shadow:'#33463d'}
};
function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x|0,y|0,w|0,h|0);}
function draw(c,b,x,y){
 const t=tones[b.roof==='oak'?'timber':b.roof==='reed'?'moss':'stone']||tones.timber;
 // Base + outline preserved at 1 physical pixel, never gradients or blur.
 rect(c,x+1,y+9,30,21,t.shadow);rect(c,x+3,y+11,26,18,t.wall);
 if(b.type==='farm'){
  rect(c,x+2,y+2,28,28,'#5f6337');
  for(let k=0;k<4;k++){
   rect(c,x+3,y+5+k*6,26,3,'#a17c47');
   for(let j=0;j<5;j++)rect(c,x+5+j*5,y+4+k*6,2,2,'#9fc573');
  }
  rect(c,x+12,y+14,8,7,'#394e41');rect(c,x+14,y+12,4,3,'#e2c783');
  return;
 }
 if(b.type==='well'){
  rect(c,x+3,y+9,26,20,t.roof);rect(c,x+5,y+11,22,16,t.wall);
  rect(c,x+8,y+11,16,14,'#396777');rect(c,x+11,y+13,10,9,'#64a4b2');
  rect(c,x+6,y+5,3,9,t.trim);rect(c,x+23,y+5,3,9,t.trim);
  rect(c,x+5,y+3,22,5,t.roof);return;
 }
 if(b.type==='market'){
  rect(c,x+2,y+10,28,20,t.wall);
  rect(c,x+1,y+6,30,7,t.roof);for(let off=3;off<=27;off+=6)
   rect(c,x+off,y+7,3,6,t.trim);
  rect(c,x+5,y+18,22,4,'#624630');rect(c,x+7,y+14,5,4,'#a6c275');
  rect(c,x+20,y+15,5,4,'#f0c47a');return;
 }
 if(b.type==='watchtower'){
  rect(c,x+9,y+7,14,23,t.wall);rect(c,x+7,y+5,18,5,t.roof);
  rect(c,x+7,y+1,18,5,t.shadow);for(let off=8;off<25;off+=5)
   rect(c,x+off,y,3,4,t.roof);
  rect(c,x+13,y+18,6,12,t.shadow);rect(c,x+14,y+20,4,4,t.trim);return;
 }
 if(b.type==='hall'){
  rect(c,x+2,y+8,28,22,t.wall);
  rect(c,x+1,y+5,30,7,t.roof);rect(c,x+5,y+2,22,5,t.roof);
  rect(c,x+13,y+17,6,13,t.shadow);rect(c,x+15,y+19,2,8,t.trim);
  for(const off of [5,24]){rect(c,x+off,y+13,3,7,t.shadow);rect(c,x+off,y+15,1,2,t.trim);}
  rect(c,x+12,y+1,8,2,t.trim);rect(c,x+15,y+0,2,5,t.trim);return;
 }
 if(b.type==='workshop'){
  rect(c,x+4,y+12,24,16,t.wall);
  rect(c,x+2,y+9,28,6,t.roof);rect(c,x+6,y+6,20,5,t.roof);
  rect(c,x+7,y+18,5,10,t.shadow);rect(c,x+8,y+20,3,4,t.trim);
  rect(c,x+19,y+17,6,5,t.shadow);rect(c,x+20,y+18,4,2,'#e0a571');
  rect(c,x+23,y+2,4,12,t.shadow);rect(c,x+24,y+0,2,3,t.trim);return;
 }
 // Cottage: pitched roof, chimney, framed windows and accessible door.
 rect(c,x+4,y+13,24,16,t.wall);
 rect(c,x+2,y+11,28,5,t.roof);
 rect(c,x+4,y+7,24,4,t.roof);rect(c,x+7,y+4,18,4,t.roof);
 rect(c,x+23,y+3,4,7,t.shadow);rect(c,x+24,y+1,2,5,t.trim);
 rect(c,x+7,y+18,5,5,t.shadow);rect(c,x+8,y+19,3,2,t.trim);
 rect(c,x+20,y+18,5,5,t.shadow);rect(c,x+21,y+19,3,2,t.trim);
 rect(c,x+14,y+22,5,8,t.shadow);rect(c,x+17,y+26,1,2,t.trim);
}
return {draw};
});
