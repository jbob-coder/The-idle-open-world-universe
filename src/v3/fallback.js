/* Offline Canvas2D projected fallback. It does not claim GPU 3D. */
(function(root,factory){"use strict";const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.GodseedV3Fallback=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
 function create(canvas){
  if(!canvas||typeof canvas.getContext!=="function")throw new TypeError("Canvas required");
  const ctx=canvas.getContext("2d",{alpha:false});
  if(!ctx)throw new Error("Canvas2D unavailable");
  let yaw=.7,elevation=.85,radius=30,cx=10,cz=10,worldMode=false;
  function rotate(dx,dy){yaw+=Math.max(-1,Math.min(1,dx))*.9;
   elevation=Math.max(.22,Math.min(1.42,elevation+dy*.8));}
  function zoom(delta){radius=Math.max(13,Math.min(worldMode?44:52,radius+delta));}
  function focus(x,z){if(Number.isFinite(x)&&Number.isFinite(z)){
   cx=Math.max(-512,Math.min(511,x));cz=Math.max(-512,Math.min(511,z));}}
  function pan(dx,dy){if(!worldMode)return;
   focus(cx-(dx*Math.cos(yaw)+dy*Math.sin(yaw))*radius*1.5,
    cz-(-dx*Math.sin(yaw)+dy*Math.cos(yaw))*radius*1.5);}
  function camera(){return {x:cx,z:cz,half:28,radius};}
  function render(s){
   if(!s||!Array.isArray(s.forest)||!Array.isArray(s.citizens)||!Array.isArray(s.structures))
    throw new TypeError("world snapshot required");
   const w=canvas.width,h=canvas.height;if(w<1||h<1)return;
   worldMode=!!s.world;
   ctx.imageSmoothingEnabled=false;ctx.fillStyle="#17272c";ctx.fillRect(0,0,w,h);
   const scale=Math.min(w/28,h/22)*30/radius,cy=Math.cos(yaw),sy=Math.sin(yaw),
    se=Math.sin(elevation),ce=Math.cos(elevation);
   const project=(x,y,z)=>{let dx=x-cx,dz=z-cz;
    return [w*.5+(dx*cy-dz*sy)*scale,h*.5+((dx*sy+dz*cy)*se-y*ce)*scale];};
   const depth=(x,z)=>x*sy+z*cy;
   const heights=new Map();
   for(const t of s.terrain||[])heights.set(t.x+","+t.z,t.height);
   const ground=(x,z)=>heights.get(Math.floor(x)+","+Math.floor(z))||0;
   function poly(pts,color){ctx.beginPath();for(let i=0;i<pts.length;i++){
    const p=project(...pts[i]);if(!i)ctx.moveTo(...p);else ctx.lineTo(...p);
   }ctx.closePath();ctx.fillStyle=color;ctx.fill();}
   function cube(x,y,z,a,b,d,top,front,side){
    y+=ground(x,z);
    let x1=x+a,y1=y+b,z1=z+d;
    let faces=[
     {k:depth(x,z+d),col:front,p:[[x,y,z1],[x1,y,z1],[x1,y1,z1],[x,y1,z1]]},
     {k:depth(x+a,z),col:side,p:[[x1,y,z],[x1,y,z1],[x1,y1,z1],[x1,y1,z]]},
     {k:depth(x,z+d),col:side,p:[[x,y,z],[x,y,z1],[x,y1,z1],[x,y1,z]]},
     {k:depth(x+a,z),col:front,p:[[x,y,z],[x1,y,z],[x1,y1,z],[x,y1,z]]}
    ];
    faces.sort((l,r)=>l.k-r.k);
    for(const f of faces.slice(-2))poly(f.p,f.col);
    poly([[x,y1,z],[x1,y1,z],[x1,y1,z1],[x,y1,z1]],top);
   }
   let tiles=[];
   if(s.terrain)tiles=s.terrain.map(t=>({x:t.x,z:t.z,height:t.height,color:t.color,order:depth(t.x+.5,t.z+.5)}));
   else for(let z=0;z<20;z++)for(let x=0;x<20;x++)tiles.push({x,z,height:0,order:depth(x+.5,z+.5)});
   tiles.sort((a,b)=>a.order-b.order);
   for(const t of tiles){let alt=(t.x*7+t.z*11)%9,y=t.height-.06;
    poly([[t.x,y,t.z],[t.x+1,y,t.z],[t.x+1,y,t.z+1],[t.x,y,t.z+1]],
     t.color?"rgb("+t.color.map(c=>Math.round(c*255)).join(",")+")":alt<3?"#436d40":alt<6?"#486f44":"#497548");}
   let things=[];
   for(const t of s.forest)things.push({type:"tree",x:t.x,z:t.z,order:depth(t.x+.5,t.z+.5)});
   for(const t of s.bushes||[])things.push({type:"bush",x:t.x,z:t.z,berries:t.berries,order:depth(t.x+.5,t.z+.5)});
   for(const t of s.structures)things.push({type:"house",kind:t.type,x:t.x,z:t.z,order:depth(t.x+.5,t.z+.5)});
   for(const t of s.landmarks||[])things.push({type:"landmark",kind:t.type,x:t.x,z:t.z,order:depth(t.x+.5,t.z+.5)});
   for(const t of s.terrain||[])if(t.kind==="rock")things.push({type:"rock",x:t.x,z:t.z,order:depth(t.x+.5,t.z+.5)});
   for(const t of s.citizens)things.push({type:"citizen",x:t.x,z:t.z,actor:t,order:depth(t.x+.5,t.z+.5)});
   things.sort((a,b)=>a.order-b.order);
   for(const t of things){
    const projected=project(t.x,ground(t.x,t.z),t.z);
    if(projected[0]<-100||projected[0]>w+100||projected[1]<-100||projected[1]>h+100)continue;
    if(t.type==="tree"){
     if(worldMode&&Math.hypot(t.x-cx,t.z-cz)>18){
      cube(t.x+.2,0,t.z+.2,.6,1.65,.6,"#4b914a","#286c39","#23592d");continue;}
     cube(t.x+.35,0,t.z+.35,.3,.95,.3,"#835c39","#634728","#503a25");
     cube(t.x+.12,.9,t.z+.12,.76,1.15,.76,"#4b914a","#286c39","#23592d");
     cube(t.x+.23,2,t.z+.23,.54,.36,.54,"#68a05a","#358442","#2f7538");
    }else if(t.type==="bush"){
     cube(t.x+.28,0,t.z+.28,.48,.38,.48,"#3a8b42","#215a2a","#1b4824");
     if(t.berries>0)cube(t.x+.44,.32,t.z+.44,.18,.18,.18,"#dc6573","#a52f46","#84283e");
    }else if(t.type==="rock"){
     cube(t.x+.12,0,t.z+.15,.73,.42,.69,"#83857e","#636760","#54574f");
    }else if(t.type==="landmark"){
     if(t.kind==="spring")cube(t.x-.6,0,t.z-.6,2.2,.15,2.2,"#438d9b","#396d79","#31545f");
     else if(t.kind==="watchtower"){
      cube(t.x-.35,0,t.z-.35,1.7,2.7,1.7,"#a1a18c","#727b72","#626b62");
      cube(t.x-.5,2.7,t.z-.5,2,.3,2,"#b2b19b","#858673","#737664");
     }else if(t.kind==="stones"){
      for(const p of [[-1,-1],[1,-1],[-1,1],[1,1]])
       cube(t.x+p[0]+.25,0,t.z+p[1]+.25,.45,1.8,.45,"#9da592","#747e75","#5c675f");
     }else{
      cube(t.x-.5,0,t.z-.35,.5,1.7,.6,"#a4a58b","#788170","#646d5f");
      cube(t.x+1,0,t.z-.35,.5,1.7,.6,"#a4a58b","#788170","#646d5f");
      cube(t.x-.5,1.7,t.z-.35,2,.4,.6,"#b4af94","#868672","#737763");
     }
    }else if(t.type==="house"){
     if(t.kind==="camp"){
      cube(t.x,0,t.z,1.3,.65,1.2,"#ae8b50","#80603b","#64482d");
      cube(t.x-.1,.65,t.z-.1,1.5,.3,1.4,"#d1a45b","#aa7e40","#896037");continue;
     }
     const workshop=t.kind==="workshop",store=t.kind==="storehouse";
     const wide=store?1.95:workshop?1.8:1.6;
     const walls=workshop?["#929ba2","#687986","#52616e"]:store?["#bfaa76","#998356","#756241"]:["#b99a62","#94734b","#795b3e"];
     const roof=workshop?["#638cb0","#426888","#2e526d"]:store?["#95895b","#756a48","#5b513a"]:["#b75b49","#964638","#77392f"];
     cube(t.x-.25,0,t.z-.15,wide,1.35,1.5,...walls);
     cube(t.x-.39,1.35,t.z-.28,wide+.26,.5,1.76,...roof);
     if(workshop)cube(t.x+1.05,1.75,t.z+.12,.29,.82,.30,"#777a78","#555c5c","#444b49");
     if(store)cube(t.x+.85,.15,t.z+1.36,.38,.42,.06,"#e8cc78","#b99b4f","#937742");
    }else{
     let colors=t.actor.worldExplorer?["#f7d890","#cc9b43","#a47c30"]:
       t.actor.id==="sim_aria"?["#88c0ff","#507fc3","#3968a4"]:
       t.actor.homeId==="village_02"?["#8be0c9","#42b7a5","#288979"]:
       t.actor.id==="sim_bran"?["#f8d785","#c09542","#a87a33"]:["#f0b4d5","#c474a2","#984e7e"];
     cube(t.x+.29,0,t.z+.29,.42,.88,.42,...colors);
     cube(t.x+.25,.88,t.z+.25,.5,.38,.5,"#e9bb8b","#b98a66","#9a6e52");
    }
   }
  }
  return Object.freeze({render,rotate,zoom,pan,focus,camera,mode:"canvas-2d-fallback"});
 }
 return Object.freeze({create});
});
