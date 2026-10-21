/* Read-only god atlas: moving the camera does not discover regions or spawn NPCs. */
(function(root){"use strict";
  const World=root.GodseedV3World;
  function create(canvas,onFocus){
    const ctx=canvas.getContext("2d"),background=document.createElement("canvas");
    background.width=128;background.height=128;
    const bg=background.getContext("2d");let lastSeed=null;
    const project=p=>({x:(p.x-World.MIN)/World.SIZE*256,z:(p.z-World.MIN)/World.SIZE*256});
    canvas.width=256;canvas.height=256;
    canvas.addEventListener("pointerdown",function(event){
      const box=canvas.getBoundingClientRect();
      const x=Math.max(World.MIN,Math.min(World.MAX,Math.floor((event.clientX-box.left)/box.width*World.SIZE+World.MIN)));
      const z=Math.max(World.MIN,Math.min(World.MAX,Math.floor((event.clientY-box.top)/box.height*World.SIZE+World.MIN)));
      onFocus(x,z);
    });
    function render(state,camera){
      if(!ctx||!bg)return;
      if(lastSeed!==state.seed){
        const data=bg.createImageData(128,128);
        for(let z=0;z<128;z++)for(let x=0;x<128;x++){
          // Sample off the exact road lines so the atlas communicates the biomes.
          const t=World.terrain(state.seed,World.MIN+x*8+3,World.MIN+z*8+3),i=(z*128+x)*4;
          for(let c=0;c<3;c++)data.data[i+c]=Math.round(t.color[c]*255);
          data.data[i+3]=255;
        }
        bg.putImageData(data,0,0);lastSeed=state.seed;
      }
      ctx.imageSmoothingEnabled=false;ctx.drawImage(background,0,0,256,256);
      ctx.strokeStyle="#d9d4b128";ctx.lineWidth=1;
      for(let i=0;i<=256;i+=16){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i,256);ctx.stroke();
        ctx.beginPath();ctx.moveTo(0,i);ctx.lineTo(256,i);ctx.stroke();}
      ctx.strokeStyle="#f8d584";ctx.lineWidth=1.5;
      ctx.beginPath();let previous=project({x:24,z:24});ctx.moveTo(previous.x,previous.z);
      for(const d of state.expedition.discoveries){const next=project(d);
        ctx.lineTo(next.x,previous.z);ctx.lineTo(next.x,next.z);previous=next;}
      ctx.stroke();
      for(const d of state.expedition.discoveries){const p=project(d);ctx.fillStyle="#e5ebd8";ctx.fillRect(p.x-1,p.z-1,3,3);}
      for(const b of state.expedition.camps){const p=project(b);ctx.fillStyle="#e9a85c";ctx.fillRect(p.x-2,p.z-2,4,4);}
      const home=project({x:5,z:5});ctx.fillStyle="#87c6f3";ctx.fillRect(home.x-3,home.z-3,6,6);
      const c=state.expedition.explorer;
      if(c){const p=project(c);ctx.fillStyle=c.alive?"#ffe99a":"#a64d4d";
        ctx.beginPath();ctx.arc(p.x,p.z,3,0,Math.PI*2);ctx.fill();}
      const focus=project(camera),span=camera.half/4;
      ctx.strokeStyle="#ffffff";ctx.lineWidth=1;
      ctx.strokeRect(focus.x-span/2,focus.z-span/2,span,span);
    }
    return Object.freeze({render});
  }
  root.GodseedV3Atlas=Object.freeze({create});
})(typeof window!=="undefined"?window:globalThis);
