// GODSEED deterministic starter-pixel raster generator. Original content; no dependencies.
// Usage: node scripts/generate_starter_assets.mjs
const C={"dark":"#152723","moss":"#31563D","grass":"#547E48","bright":"#83A85D","light":"#B9CA83","pine":"#264734","pine2":"#397453","pine3":"#609966","bark":"#71513A","sand":"#B49060","soil":"#8B6346","stone":"#7D8074","stone2":"#B7B8A0","stoneDark":"#4B5853","water":"#335F85","waterLight":"#6FA9B7","berry":"#D67482","gold":"#EFCB76","blue":"#6589BA","skin":"#D6A17A","robe":"#966FAD","red":"#A45A44","white":"#EAE3C1","brown":"#654737","azure":"#A0DFD0","black":"#11191A","purple":"#8766AB","green":"#77B881"};

function col(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16),255];}

function raster(w,h,bg=null){const data=new Uint8Array(w*h*4);if(bg)for(let i=0;i<w*h;i++){const c=col(bg);data.set(c,i*4);}return {w,h,data};}

function pixel(im,x,y,c){x|=0;y|=0;if(x<0||y<0||x>=im.w||y>=im.h)return;const off=(y*im.w+x)*4;im.data.set(col(c),off);}

function box(im,x,y,w,h,c){for(let yy=Math.max(0,y|0);yy<Math.min(im.h,(y+h)|0);yy++)for(let xx=Math.max(0,x|0);xx<Math.min(im.w,(x+w)|0);xx++)pixel(im,xx,yy,c);}

function line(im,x,y,x2,y2,c){x|=0;y|=0;x2|=0;y2|=0;let dx=Math.abs(x2-x),dy=-Math.abs(y2-y),sx=x<x2?1:-1,sy=y<y2?1:-1,err=dx+dy;while(true){pixel(im,x,y,c);if(x===x2&&y===y2)break;let e2=2*err;if(e2>=dy){err+=dy;x+=sx;}if(e2<=dx){err+=dx;y+=sy;}}}

function dotRand(n){let v=(Math.imul(n^0x5a5a1234,1664525)+1013904223)>>>0;v^=v>>>15;v=Math.imul(v,2246822519)>>>0;return (v^(v>>>13))>>>0;}

function tileArt(im,ox,oy,id,variant){
 const r=(n)=>dotRand(id*1231+variant*719+n*1171);
 const p=(x,y,c)=>pixel(im,ox+x,oy+y,c),b=(x,y,w,h,c)=>box(im,ox+x,oy+y,w,h,c),l=(x,y,xx,yy,c)=>line(im,ox+x,oy+y,ox+xx,oy+yy,c);
 b(0,0,16,16,(id===2?C.water:id===8?C.sand:id===6?C.bright:id===5||id===3?C.stoneDark:id===1?C.moss:C.grass));
 for(let i=0;i<7;i++){const n=r(i),x=n%16,y=(n>>>5)%16;p(x,y,id===2?C.waterLight:id===3||id===5?C.stone:C.bright);}
 if(id===0){for(let i=0;i<4;i++){const n=r(i+12),x=2+n%12,y=2+(n>>>4)%12;b(x,y,1,3,C.bright);p(x+1,y+1,C.moss);}if(variant===2)b(3,6,3,2,C.soil);}
 if(id===1){b(6,9,4,7,C.bark);b(2,4,12,10,C.pine);b(4,2,9,9,C.pine2);b(6,1,5,5,C.pine3);b(3,5,3,2,C.bright);b(12,8,2,3,C.pine2);}
 if(id===2){for(let i=0;i<4;i++){const n=r(i+21),x=1+n%11,y=2+(n>>>5)%13;b(x,y,4,1,i===0?C.azure:C.waterLight);}b(0,8,16,2,C.water);if(variant===2)b(7,6,2,1,C.white);}
 if(id===3){b(2,11,13,4,C.stoneDark);b(4,6,10,8,C.stone);b(6,4,8,4,C.stone2);b(10,8,2,2,C.stoneDark);p(6,5,C.white);}
 if(id===4){b(6,10,4,5,C.bark);b(2,7,12,6,C.moss);b(4,3,9,9,C.pine3);b(2,6,8,5,C.pine2);for(let i=0;i<4;i++){const n=r(i+6);p(4+n%8,5+((n>>>4)%6),C.berry);}}
 if(id===5){b(1,12,14,3,C.stoneDark);b(3,8,10,4,C.stone);b(5,3,7,8,C.stone2);b(7,5,2,6,C.stoneDark);b(9,3,3,2,C.white);p(3,7,C.bright);}
 if(id===6){for(let i=0;i<6;i++){const n=r(i+15),x=1+n%13,y=2+(n>>>3)%12;b(x,y,1,3,C.moss);p(x,y,i%2===0?C.berry:C.gold);}}
 if(id===7){b(2,12,12,3,C.soil);b(4,7,9,6,C.red);b(5,5,7,3,C.gold);b(7,9,3,4,C.black);b(12,11,2,2,C.gold);l(2,14,4,6,C.brown);}
 if(id===8){b(0,0,16,16,C.grass);b(1,0,14,16,C.soil);b(3,0,10,16,C.sand);for(let i=0;i<8;i++){let n=r(i+31),x=3+n%10,y=(n>>>5)%16;p(x,y,i%2===0?C.stone2:C.soil);}}
 if(id===9){b(0,13,16,3,C.soil);b(3,6,11,8,C.brown);b(4,7,9,7,C.sand);for(let y=2;y<=6;y++)b(5-y+4,y,Math.min(15,2*(y-1)+5),1,C.red);b(7,9,3,5,C.black);b(11,9,2,2,C.gold);b(0,14,16,2,C.stone);}
 if(id===10){b(1,14,14,2,C.stoneDark);b(3,9,10,6,C.stone);b(6,3,5,10,C.stone2);b(7,2,3,2,C.white);b(8,5,1,6,C.azure);b(6,8,5,1,C.azure);b(4,12,8,1,C.dark);}
}

function actorArt(im,ox,oy,actor,dir,frame){
 const p=(x,y,c)=>pixel(im,ox+x,oy+y,c),b=(x,y,w,h,c)=>box(im,ox+x,oy+y,w,h,c);
 const robe=[C.blue,C.green,C.stone,C.purple][actor],trim=[C.gold,C.bright,C.white,C.azure][actor];
 const step=frame?1:0;
 b(3,22,10,1,C.dark);b(4,21+step,4,2,C.black);b(9,21-step,4,2,C.black);
 b(4,12,9,9,robe);b(3,13,3,6,C.dark);b(12,13,2,5,C.dark);b(5,11,7,3,C.brown);
 b(5,6,7,7,C.skin);b(4,4,8,4,actor===3?C.purple:actor===2?C.stone:C.brown);
 if(actor===0){b(5,3,7,3,C.brown);b(10,5,3,3,C.brown);b(4,14,3,5,C.red);b(10,15,3,3,C.gold);}
 if(actor===1){b(4,4,10,2,C.moss);b(3,14,3,5,C.gold);b(10,11,4,6,C.green);p(12,11,C.white);}
 if(actor===2){b(4,3,9,5,C.stone2);b(5,5,7,4,C.stone);b(1,12,3,8,C.stoneDark);b(12,13,3,7,C.stone2);b(11,15,2,2,C.gold);}
 if(actor===3){b(5,3,7,6,C.purple);b(6,7,5,5,C.skin);b(7,13,2,6,C.azure);b(2,11,2,10,C.brown);p(3,9,C.gold);}
 if(dir===0){b(7,10,1,2,C.black);b(11,10,1,2,C.black);} // facing front
 else if(dir===1){b(10,9,2,2,C.black);b(7,15,3,2,trim);} // right
 else if(dir===2){b(5,6,7,7,robe);b(4,4,8,4,C.brown);b(7,15,2,3,trim);} // back
 else {b(5,9,2,2,C.black);b(10,15,2,2,trim);} // left
 if(frame===1){p(4,18,trim);p(12,17,trim);}
}

function fxArt(im,ox,oy,id){
 const p=(x,y,c)=>pixel(im,ox+x,oy+y,c),b=(x,y,w,h,c)=>box(im,ox+x,oy+y,w,h,c),l=(x,y,xx,yy,c)=>line(im,ox+x,oy+y,ox+xx,oy+yy,c);
 const color=[C.white,C.azure,C.gold,C.green,C.blue,C.gold,C.purple][id];
 if(id===0){b(2,2,12,1,color);b(2,13,12,1,color);b(2,2,1,12,color);b(13,2,1,12,color);}
 if(id===1){b(7,1,2,14,color);b(1,7,14,2,color);b(4,4,8,8,C.azure);b(7,3,2,10,C.white);}
 if(id===2){b(3,8,10,7,C.sand);b(3,8,10,2,C.brown);b(6,5,4,3,C.gold);p(8,12,C.white);}
 if(id===3){b(7,9,2,6,C.moss);l(8,9,5,4,color);l(8,8,11,3,color);b(4,3,4,2,C.light);b(8,2,4,2,C.light);}
 if(id===4){p(8,0,color);b(7,2,2,10,color);b(5,12,6,2,color);l(3,14,5,12,C.white);l(11,12,13,14,C.white);}
 if(id===5){b(2,2,12,3,C.stoneDark);l(10,5,7,9,color);l(7,9,11,9,color);l(11,9,4,15,color);}
 if(id===6){b(6,2,4,2,color);b(4,5,8,1,color);b(7,4,2,10,color);l(3,9,12,9,C.gold);p(2,3,C.white);p(13,2,C.white);}
}

function propArt(im,ox,oy,id,v){
 const b=(x,y,w,h,c)=>box(im,ox+x,oy+y,w,h,c),p=(x,y,c)=>pixel(im,ox+x,oy+y,c);
 if(id===0){b(7,10,3,6,C.bark);b(2,6,12,7,C.pine);b(4,3,9,7,C.pine2);b(6,1,5,6,C.pine3);}
 if(id===1){b(7,9,3,7,C.bark);b(3,9,11,4,C.pine);b(5,6,8,4,C.pine2);b(6,3,6,4,C.pine3);b(8,1,2,2,C.bright);}
 if(id===2){b(1,12,14,3,C.stoneDark);b(3,7,11,7,C.stone);b(5,5,6,4,C.stone2);}
 if(id===3){for(let i=0;i<5;i++){const x=2+i*3;b(x,11-i%2,1,4,C.moss);p(x,10-i%2,i%2?C.berry:C.gold);}}
 if(id===4){b(2,7,3,9,C.brown);b(12,7,3,9,C.brown);b(2,9,13,2,C.sand);b(2,12,13,2,C.sand);}
 if(id===5){b(3,8,12,6,C.brown);b(4,9,11,4,C.sand);b(3,5,10,2,C.brown);b(6,13,2,3,C.black);b(12,13,2,3,C.black);}
 if(id===6){b(7,3,2,13,C.bark);b(3,4,10,5,C.sand);p(6,6,C.dark);p(9,6,C.dark);}
 if(id===7){b(6,2,3,14,C.stone2);b(4,6,7,3,C.stone);b(7,3,2,9,C.azure);b(2,15,12,1,C.dark);}
 if(v===1&&id<4){p(13,3,C.gold);p(12,4,C.bright);}
}

function png(im){
 const out=[];const put=(a)=>{for(const b of a)out.push(b);};
 const u32=n=>[(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255];
 function crc(a){let v=0xffffffff;for(const byte of a){v^=byte;for(let i=0;i<8;i++)v=v&1?0xedb88320^(v>>>1):v>>>1;}return (v^0xffffffff)>>>0;}
 function chunk(name,data){const tag=Array.from(name).map(c=>c.charCodeAt(0));return [...u32(data.length),...tag,...data,...u32(crc([...tag,...data]))];}
 let raw=[];for(let y=0;y<im.h;y++){raw.push(0);for(let i=y*im.w*4;i<(y+1)*im.w*4;i++)raw.push(im.data[i]);}
 let z=[0x78,0x01],a=1,b=0;for(const byte of raw){a=(a+byte)%65521;b=(b+a)%65521;}
 for(let at=0;at<raw.length;at+=65535){const len=Math.min(65535,raw.length-at);const last=at+len>=raw.length;z.push(last?1:0,len&255,(len>>8)&255,(~len)&255,((~len)>>8)&255);for(let i=0;i<len;i++)z.push(raw[at+i]);}
 z.push(...u32(((b<<16)|a)>>>0));
 put([137,80,78,71,13,10,26,10]);put(chunk("IHDR",[...u32(im.w),...u32(im.h),8,6,0,0,0]));put(chunk("IDAT",z));put(chunk("IEND",[]));
 return Uint8Array.from(out);
}

function b64(a){const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";let s="";for(let i=0;i<a.length;i+=3){const v=(a[i]<<16)|((a[i+1]||0)<<8)|(a[i+2]||0);s+=alphabet[(v>>>18)&63]+alphabet[(v>>>12)&63]+(i+1<a.length?alphabet[(v>>>6)&63]:"=")+(i+2<a.length?alphabet[v&63]:"=");}return s;}

function buildSheets(){
 const terrain=raster(176,48);
 for(let v=0;v<3;v++)for(let i=0;i<11;i++)tileArt(terrain,i*16,v*16,i,v);
 const actors=raster(128,96);
 for(let dir=0;dir<4;dir++)for(let a=0;a<4;a++)for(let f=0;f<2;f++)actorArt(actors,(a*2+f)*16,dir*24,a,dir,f);
 const fx=raster(112,16);for(let i=0;i<7;i++)fxArt(fx,i*16,0,i);
 const props=raster(128,32);for(let v=0;v<2;v++)for(let i=0;i<8;i++)propArt(props,i*16,v*16,i,v);
 return [
 {path:"assets/generated/terrain-starter.png",image:terrain},
 {path:"assets/generated/actors-starter.png",image:actors},
 {path:"assets/generated/fx-starter.png",image:fx},
 {path:"assets/generated/props-starter.png",image:props}
 ];
}
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
const produced=buildSheets();
for(const {path,image} of produced){mkdirSync(dirname(path),{recursive:true});writeFileSync(path,png(image));console.log(path,image.w+'x'+image.h);}
