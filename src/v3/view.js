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
      "attribute vec3 p;attribute vec3 c;uniform mat4 m;varying vec3 v;void main(){gl_Position=m*vec4(p,1.0);v=c;}");
    const frag=shader(gl,gl.FRAGMENT_SHADER,
      "precision mediump float;varying vec3 v;void main(){gl_FragColor=vec4(v,1.0);}");
    const program=gl.createProgram();gl.attachShader(program,vert);gl.attachShader(program,frag);gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error("WebGL link: "+gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const p=gl.getAttribLocation(program,"p"),c=gl.getAttribLocation(program,"c"),m=gl.getUniformLocation(program,"m");
    const buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.enableVertexAttribArray(p);gl.enableVertexAttribArray(c);
    gl.vertexAttribPointer(p,3,gl.FLOAT,false,24,0);
    gl.vertexAttribPointer(c,3,gl.FLOAT,false,24,12);
    gl.enable(gl.DEPTH_TEST);gl.clearColor(.10,.15,.20,1);
    let yaw=.7, elevation=.85, radius=30;
    function rotate(dx,dy){
      yaw+=Math.max(-1,Math.min(1,dx))*.9;
      elevation=Math.max(.22,Math.min(1.42,elevation+dy*.8));
    }
    function zoom(delta){radius=Math.max(13,Math.min(52,radius+delta));}
    function render(state){
      if(!state||!Array.isArray(state.citizens)||!Array.isArray(state.forest))
        throw new TypeError("authoritative world snapshot required");
      // Finite immutable snapshots only. No simulation methods in the renderer.
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
      const n=20;
      for(let z=0;z<n;z++)for(let x=0;x<n;x++){
        const alt=((x*7+z*11)%9)/85;
        quad([x,-.06,z],[x+1,-.06,z],[x+1,-.06,z+1],[x,-.06,z+1],
          [.26+alt,.39+alt,.22+alt]);
      }
      for(const tree of state.forest){
        box(tree.x+.35,0,tree.z+.35,.3,.95,.3,[.42,.29,.17]);
        box(tree.x+.12,.9,tree.z+.12,.76,1.15,.76,[.14,.38,.22]);
        box(tree.x+.23,2,tree.z+.23,.54,.36,.54,[.22,.51,.27]);
      }
      for(const b of state.bushes||[]){
        box(b.x+.28,0,b.z+.28,.48,.38,.48,[.16,.45,.23]);
        if(b.berries>0)box(b.x+.44,.32,b.z+.44,.18,.18,.18,[.69,.17,.26]);
      }
      for(const b of state.structures){
        const workshop=b.type==="workshop",store=b.type==="storehouse";
        const walls=workshop?[.44,.49,.51]:store?[.62,.51,.30]:[.55,.45,.31];
        const roof=workshop?[.19,.35,.48]:store?[.42,.38,.23]:[.57,.21,.19];
        const wide=store?1.95:workshop?1.8:1.6;
        box(b.x-.25,0,b.z-.15,wide,1.35,1.5,walls);
        box(b.x-.39,1.35,b.z-.28,wide+.26,.50,1.76,roof);
        box(b.x+.25,.12,b.z+1.36,.43,.79,.04,[.29,.17,.10]);
        if(workshop)box(b.x+1.05,1.75,b.z+.12,.29,.82,.30,[.37,.36,.34]);
        if(store)box(b.x+.85,.15,b.z+1.36,.38,.42,.06,[.75,.61,.32]);
      }
      for(const c of state.citizens){
        const col=c.id==="sim_aria"?[.40,.66,.95]:c.id==="sim_bran"?[.96,.72,.34]:[.85,.52,.70];
        box(c.x+.29,0,c.z+.29,.42,.88,.42,col);
        box(c.x+.25,.88,c.z+.25,.5,.38,.5,[.80,.62,.45]);
      }
      const target=[9.5,0,9.5],eye=[
        9.5+radius*Math.cos(elevation)*Math.sin(yaw),
        radius*Math.sin(elevation),
        9.5+radius*Math.cos(elevation)*Math.cos(yaw)
      ];
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const proj=perspective(Math.PI/3,canvas.width/canvas.height,.1,140);
      gl.uniformMatrix4fv(m,false,multiply(proj,lookAt(eye,target)));
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(v),gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES,0,v.length/6);
    }
    return Object.freeze({render,rotate,zoom});
  }
  return Object.freeze({create});
});