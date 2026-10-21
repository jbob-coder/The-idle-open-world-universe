/* GODSEED V3: offline WebGL1 cubic Pixel Squares spectator, no CDN or game-state writes. */
(function(root,factory){"use strict";const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GodseedV3View=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
  function multiply(a,b){
    const out=new Float32Array(16);
    for(let col=0;col<4;col++)for(let row=0;row<4;row++)
      for(let k=0;k<4;k++)out[col*4+row]+=a[k*4+row]*b[col*4+k];
    return out;
  }
  function perspective(fov,aspect,near,far){
    const f=1/Math.tan(fov/2),o=new Float32Array(16);
    o[0]=f/aspect;o[5]=f;o[10]=(far+near)/(near-far);
    o[11]=-1;o[14]=2*far*near/(near-far);return o;
  }
  function normalize(v){const n=Math.hypot(...v)||1;return v.map(x=>x/n);}
  const sub=(a,b)=>a.map((x,i)=>x-b[i]);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
  function lookAt(eye,center){
    const z=normalize(sub(eye,center)),x=normalize(cross([0,1,0],z)),y=cross(z,x);
    return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,
      -dot(x,eye),-dot(y,eye),-dot(z,eye),1]);
  }
  function shader(gl,type,source){
    const obj=gl.createShader(type);gl.shaderSource(obj,source);gl.compileShader(obj);
    if(!gl.getShaderParameter(obj,gl.COMPILE_STATUS))throw new Error("Shader: "+gl.getShaderInfoLog(obj));
    return obj;
  }
  function create(canvas){
    if(!canvas||typeof canvas.getContext!=="function")throw new TypeError("WebGL canvas required");
    const gl=canvas.getContext("webgl",{antialias:false,alpha:false,preserveDrawingBuffer:false});
    if(!gl)throw new Error("WebGL unavailable: this Android WebView/browser needs a 3D fallback");
    const vert=shader(gl,gl.VERTEX_SHADER,
      "attribute vec3 p;attribute vec3 c;uniform mat4 m;uniform vec2 center;varying vec3 v;varying float d;void main(){gl_Position=m*vec4(p,1.0);v=c;d=length(p.xz-center);}");
    const frag=shader(gl,gl.FRAGMENT_SHADER,
      "precision mediump float;varying vec3 v;varying float d;uniform vec2 fog;void main(){float f=smoothstep(fog.x,fog.y,d);gl_FragColor=vec4(mix(v,vec3(.10,.15,.20),f),1.0);}");
    const program=gl.createProgram();gl.attachShader(program,vert);gl.attachShader(program,frag);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error("WebGL link: "+gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const p=gl.getAttribLocation(program,"p"),c=gl.getAttribLocation(program,"c"),m=gl.getUniformLocation(program,"m");
    const centerUniform=gl.getUniformLocation(program,"center"),fogUniform=gl.getUniformLocation(program,"fog");
    const buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.enableVertexAttribArray(p);gl.enableVertexAttribArray(c);
    gl.vertexAttribPointer(p,3,gl.FLOAT,false,24,0);
    gl.vertexAttribPointer(c,3,gl.FLOAT,false,24,12);
    gl.enable(gl.DEPTH_TEST);gl.clearColor(.10,.15,.20,1);
    let yaw=.7,elevation=.85,radius=30,cx=9.5,cz=9.5,worldMode=false;
    let geometryKey="",vertexCount=0;
    function rotate(dx,dy){
      yaw+=Math.max(-1,Math.min(1,dx))*.9;
      elevation=Math.max(.22,Math.min(1.42,elevation+dy*.8));
    }
    function zoom(delta){radius=Math.max(13,Math.min(worldMode?44:52,radius+delta));}
    function focus(x,z){if(Number.isFinite(x)&&Number.isFinite(z)){
      cx=Math.max(-512,Math.min(511,x));cz=Math.max(-512,Math.min(511,z));}}
    function pan(dx,dy){if(!worldMode)return;
      focus(cx-(dx*Math.cos(yaw)+dy*Math.sin(yaw))*radius*1.5,
        cz-(-dx*Math.sin(yaw)+dy*Math.cos(yaw))*radius*1.5);}
    function camera(){return {x:cx,z:cz,half:32,radius};}
    function render(state){
      if(!state||!Array.isArray(state.citizens)||!Array.isArray(state.forest))
        throw new TypeError("authoritative world snapshot required");
      // Finite immutable snapshots only. No simulation methods in the renderer.
      worldMode=!!state.world;
      const nextKey=state.seed+":"+(state.sceneKey||state.tick+":"+state.forest.length+":"+state.structures.length)+":"+worldMode;
      if(nextKey!==geometryKey){
      const v=[];
      function vertex(a,col){v.push(a[0],a[1],a[2],col[0],col[1],col[2]);}
      function quad(a,b,c,d,col){
        vertex(a,col);vertex(b,col);vertex(c,col);
        vertex(a,col);vertex(c,col);vertex(d,col);
      }
      function shade(col,f){return col.map(n=>Math.min(1,n*f));}
      function box(x,y,z,w,h,d,col){
        const x1=x+w,y1=y+h,z1=z+d;
        quad([x,y1,z],[x1,y1,z],[x1,y1,z1],[x,y1,z1],shade(col,1.13));
        quad([x,y,z1],[x1,y,z1],[x1,y,z],[x,y,z],shade(col,.55));
        quad([x,y,z],[x1,y,z],[x1,y1,z],[x,y1,z],shade(col,.68));
        quad([x1,y,z1],[x,y,z1],[x,y1,z1],[x1,y1,z1],shade(col,.82));
        quad([x1,y,z],[x1,y,z1],[x1,y1,z1],[x1,y1,z],shade(col,.90));
        quad([x,y,z1],[x,y,z],[x,y1,z],[x,y1,z1],shade(col,.76));
      }
      const heights=new Map();
      const ground=(x,z)=>heights.get(Math.floor(x)+","+Math.floor(z))||0;
      if(state.terrain){
        for(const t of state.terrain)heights.set(t.x+","+t.z,t.height);
        for(const t of state.terrain){
          const x=t.x,z=t.z,y=t.height-.06,col=t.color;
          quad([x,y,z],[x+1,y,z],[x+1,y,z+1],[x,y,z+1],col);
          // Exposed terrace edges make elevation real geometry, not a painted map.
          for(const d of [[1,0],[0,1],[-1,0],[0,-1]]){
            const neighbor=ground(x+d[0],z+d[1])-.06;if(neighbor>=y)continue;
            if(d[0]===1)quad([x+1,neighbor,z],[x+1,neighbor,z+1],[x+1,y,z+1],[x+1,y,z],shade(col,.72));
            if(d[0]===-1)quad([x,neighbor,z+1],[x,neighbor,z],[x,y,z],[x,y,z+1],shade(col,.60));
            if(d[1]===1)quad([x+1,neighbor,z+1],[x,neighbor,z+1],[x,y,z+1],[x+1,y,z+1],shade(col,.78));
            if(d[1]===-1)quad([x,neighbor,z],[x+1,neighbor,z],[x+1,y,z],[x,y,z],shade(col,.65));
          }
          if(t.kind==="rock")box(x+.12,t.height,z+.15,.73,.42,.69,[.44,.45,.43]);
        }
      }else for(let z=0;z<20;z++)for(let x=0;x<20;x++){
          const alt=((x*7+z*11)%9)/85;
          quad([x,-.06,z],[x+1,-.06,z],[x+1,-.06,z+1],[x,-.06,z+1],[.26+alt,.39+alt,.22+alt]);
        }
      for(const tree of state.forest){
        const y=ground(tree.x,tree.z),distant=worldMode&&Math.hypot(tree.x-cx,tree.z-cz)>21;
        const leaf=tree.biome==="taiga"?[.34,.49,.41]:tree.biome==="desert"?[.42,.46,.22]:[.14,.38,.22];
        if(distant){box(tree.x+.2,y,tree.z+.2,.6,1.65,.6,leaf);continue;}
        box(tree.x+.35,y,tree.z+.35,.3,.95,.3,[.42,.29,.17]);
        box(tree.x+.12,y+.9,tree.z+.12,.76,1.15,.76,leaf);
        box(tree.x+.23,y+2,tree.z+.23,.54,.36,.54,shade(leaf,1.25));
      }
      for(const b of state.bushes||[]){
        const y=ground(b.x,b.z);
        box(b.x+.28,y,b.z+.28,.48,.38,.48,[.16,.45,.23]);
        if(b.berries>0)box(b.x+.44,y+.32,b.z+.44,.18,.18,.18,[.69,.17,.26]);
      }
      for(const place of state.landmarks||[]){
        const x=place.x,z=place.z,y=ground(x,z);
        if(place.type==="spring"){
          box(x-.7,y,z-.7,2.4,.15,2.4,[.36,.47,.43]);
          box(x-.5,y+.16,z-.5,2,.07,2,[.24,.60,.65]);
        }else if(place.type==="stones"){
          for(const p of [[-1,-1],[1,-1],[-1,1],[1,1]])box(x+p[0]+.25,y,z+p[1]+.25,.45,1.8,.45,[.47,.54,.52]);
        }else if(place.type==="watchtower"){
          box(x-.35,y,z-.35,1.7,2.7,1.7,[.42,.45,.43]);
          box(x-.5,y+2.7,z-.5,2,.25,2,[.59,.58,.48]);
          box(x+.2,y+2.95,z+.2,.6,.6,.6,[.49,.51,.44]);
        }else{
          box(x-.5,y,z-.35,.5,1.7,.6,[.48,.50,.43]);
          box(x+1,y,z-.35,.5,1.7,.6,[.48,.50,.43]);
          box(x-.5,y+1.7,z-.35,2,.4,.6,[.61,.59,.49]);
          box(x+.5,y,z+1,.6,.35,.5,[.46,.49,.43]);
        }
      }
      for(const b of state.structures){
        const y=ground(b.x,b.z);
        if(b.type==="camp"){
          box(b.x,y,b.z,1.3,.65,1.2,[.51,.39,.24]);
          box(b.x-.1,y+.65,b.z-.1,1.5,.25,1.4,[.70,.52,.27]);
          box(b.x+.2,y+.9,b.z+.12,1.1,.25,1.1,[.64,.45,.23]);continue;
        }
        const workshop=b.type==="workshop",store=b.type==="storehouse";
        const walls=workshop?[.44,.49,.51]:store?[.62,.51,.30]:[.55,.45,.31];
        const roof=workshop?[.19,.35,.48]:store?[.42,.38,.23]:[.57,.21,.19];
        const wide=store?1.95:workshop?1.8:1.6;
        box(b.x-.25,y,b.z-.15,wide,1.35,1.5,walls);
        box(b.x-.39,y+1.35,b.z-.28,wide+.26,.50,1.76,roof);
        box(b.x+.25,y+.12,b.z+1.36,.43,.79,.04,[.29,.17,.10]);
        if(workshop)box(b.x+1.05,y+1.75,b.z+.12,.29,.82,.30,[.37,.36,.34]);
        if(store)box(b.x+.85,y+.15,b.z+1.36,.38,.42,.06,[.75,.61,.32]);
      }
      for(const c of state.citizens){
        const y=ground(c.x,c.z),col=c.worldExplorer?[.91,.71,.32]:c.homeId==="village_02"?[.28,.85,.73]:
          c.id==="sim_aria"?[.40,.66,.95]:c.id==="sim_bran"?[.96,.72,.34]:[.85,.52,.70];
        box(c.x+.29,y,c.z+.29,.42,.88,.42,col);
        box(c.x+.25,y+.88,c.z+.25,.5,.38,.5,[.80,.62,.45]);
        if(c.worldExplorer)box(c.x+.30,y+.25,c.z+.12,.4,.5,.20,[.41,.30,.19]);
      }
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.DYNAMIC_DRAW);
      vertexCount=v.length/6;geometryKey=nextKey;
      }
      const target=[cx,.5,cz],eye=[
        cx+radius*Math.cos(elevation)*Math.sin(yaw),
        .5+radius*Math.sin(elevation),
        cz+radius*Math.cos(elevation)*Math.cos(yaw)
      ];
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const proj=perspective(Math.PI/3,canvas.width/canvas.height,.1,140);
      gl.uniformMatrix4fv(m,false,multiply(proj,lookAt(eye,target)));
      gl.uniform2f(centerUniform,worldMode?state.worldCenter.x:cx,worldMode?state.worldCenter.z:cz);
      gl.uniform2f(fogUniform,worldMode?state.renderRadius*.70:500,worldMode?state.renderRadius:600);
      gl.drawArrays(gl.TRIANGLES,0,vertexCount);
    }
    return Object.freeze({render,rotate,zoom,pan,focus,camera});
  }
  return Object.freeze({create});
});
