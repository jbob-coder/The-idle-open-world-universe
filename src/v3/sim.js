/* GODSEED V3 opt-in autonomous simulation. Existing v1 saves are untouched. */
(function(root,factory){"use strict";const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GodseedV3Sim=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
  const VERSION=1,SIZE=20,STORAGE_KEY="godseed-v3-prototype-v1";
  const copy=x=>JSON.parse(JSON.stringify(x));
  const pos=(x,z)=>Number.isSafeInteger(x)&&Number.isSafeInteger(z)&&x>=0&&z>=0&&x<SIZE&&z<SIZE;
  const uint32=x=>Number.isSafeInteger(x)&&x>=0&&x<=0xffffffff;
  const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
  function forestFor(seed){
    const found=[];
    for(let z=1;z<SIZE-1;z++)for(let x=1;x<SIZE-1;x++){
      if(x>=3&&x<=7&&z>=3&&z<=6)continue;
      const h=Math.imul(x+11,73856093)^Math.imul(z+17,19349663)^Math.imul(seed+1,83492791);
      if((h>>>0)%11<2)found.push({x,z});
    }
    for(const p of [{x:3,z:8},{x:8,z:6},{x:9,z:8},{x:5,z:10},{x:11,z:5},{x:7,z:11}]){
      if(!found.some(q=>q.x===p.x&&q.z===p.z))found.push(p);
    }
    return found.sort((a,b)=>a.z-b.z||a.x-b.x);
  }
  function record(s,c,action,details){
    s.events.push({tick:s.tick,actor:c.id,action,details});
    if(s.events.length>48)s.events.shift();
  }
  function nearestTree(c,forest){
    let best=null,score=Infinity;
    for(const t of forest){
      const bias=c.trait==="explorer"?Math.abs(t.z-10)/12:Math.abs(t.x-7)/12;
      const next=distance(c,t)+bias;
      if(next<score){score=next;best=t;}
    }
    return best;
  }
  function act(s,c){
    if(c.energy<5){c.energy=Math.min(20,c.energy+8);c.goal="descansar";return;}
    if(!s.structures.length&&s.wood>=4){
      s.wood-=4;s.spent+=4;s.structures.push({id:"first_shelter",type:"house",x:5,z:5});
      c.energy-=2;c.goal="construir refugio";
      record(s,c,"build",{id:"first_shelter",woodSpent:4});return;
    }
    // Keep a finite timber reserve instead of cutting every tree after founding.
    // Settlers remain autonomous: replenish if needed, then return to their home.
    if(s.structures.length&&s.wood>=4){
      const home=s.structures[0];
      if(distance(c,home)>1){
        if(c.x!==home.x)c.x+=Math.sign(home.x-c.x);
        else c.z+=Math.sign(home.z-c.z);
        c.energy--;c.goal="regresar al refugio";
      }else{
        c.energy=Math.min(20,c.energy+2);c.goal="cuidar refugio";
      }
      return;
    }
    const tree=nearestTree(c,s.forest);
    if(!tree){c.goal=s.structures.length?"mantener aldea":"sin madera";c.energy=Math.min(20,c.energy+1);return;}
    if(distance(c,tree)<=1){
      const i=s.forest.findIndex(t=>t.x===tree.x&&t.z===tree.z);
      if(i<0)throw new Error("resource ownership conflict");
      s.forest.splice(i,1);s.wood++;s.harvested++;c.harvested++;
      c.energy=Math.max(0,c.energy-3);c.goal="recolectar madera";
      record(s,c,"harvest",{x:tree.x,z:tree.z,woodProduced:1});return;
    }
    if(c.x!==tree.x)c.x+=Math.sign(tree.x-c.x);else c.z+=Math.sign(tree.z-c.z);
    c.energy--;c.goal="caminar hacia recurso";
  }
  function validate(s){
    if(!s||typeof s!=="object"||Array.isArray(s)||s.schemaVersion!==VERSION||
      !uint32(s.seed)||!Number.isSafeInteger(s.tick)||s.tick<0||
      !Array.isArray(s.citizens)||s.citizens.length!==2||
      !Array.isArray(s.forest)||!Array.isArray(s.structures)||s.structures.length>1||
      !Array.isArray(s.events)||s.events.length>48||
      !Number.isSafeInteger(s.wood)||s.wood<0||
      !Number.isSafeInteger(s.harvested)||s.harvested<0||
      !Number.isSafeInteger(s.spent)||s.spent<0||s.wood!==s.harvested-s.spent)return false;
    const original=forestFor(s.seed),keys=new Set();
    if(s.harvested+s.forest.length!==original.length)return false;
    for(const t of s.forest){
      if(!t||!pos(t.x,t.z)||!original.some(p=>p.x===t.x&&p.z===t.z))return false;
      const key=t.x+","+t.z;if(keys.has(key))return false;keys.add(key);
    }
    const expected=[["sim_aria","explorer"],["sim_bran","builder"]];
    for(let i=0;i<2;i++){
      const c=s.citizens[i];
      if(!c||c.id!==expected[i][0]||c.trait!==expected[i][1]||
        !pos(c.x,c.z)||!Number.isInteger(c.energy)||c.energy<0||c.energy>20||
        !Number.isSafeInteger(c.harvested)||c.harvested<0||
        typeof c.goal!=="string"||c.goal.length>80)return false;
    }
    if(s.citizens[0].harvested+s.citizens[1].harvested!==s.harvested)return false;
    if(s.structures.length){
      const b=s.structures[0];
      if(!b||b.id!=="first_shelter"||b.type!=="house"||b.x!==5||b.z!==5||s.spent!==4)return false;
    }else if(s.spent!==0)return false;
    for(const e of s.events){
      if(!e||!Number.isSafeInteger(e.tick)||e.tick<0||e.tick>s.tick||
        !expected.some(c=>c[0]===e.actor)||!["build","harvest"].includes(e.action))return false;
    }
    return true;
  }
  function instance(state){
    function snapshot(){return copy(state);}
    function advance(n){
      if(!Number.isSafeInteger(n)||n<0||n>20000)throw new RangeError("invalid steps");
      for(let i=0;i<n;i++){state.tick++;for(const c of state.citizens)act(state,c);}
      return snapshot();
    }
    function serialize(){
      const raw=JSON.stringify(state);
      if(raw.length>64000)throw new RangeError("save quota exceeded");
      return raw;
    }
    return Object.freeze({advance,snapshot,serialize});
  }
  function create(seed){
    if(!uint32(seed))throw new RangeError("seed must be uint32");
    return instance({schemaVersion:VERSION,seed,tick:0,
      citizens:[
        {id:"sim_aria",name:"Aria",trait:"explorer",x:4,z:4,energy:20,harvested:0,goal:"explorar"},
        {id:"sim_bran",name:"Bran",trait:"builder",x:6,z:4,energy:20,harvested:0,goal:"fundar"}],
      forest:forestFor(seed),wood:0,harvested:0,spent:0,structures:[],events:[]});
  }
  function restore(raw){
    if(typeof raw!=="string"||raw.length>64000)throw new RangeError("invalid V3 save");
    const state=JSON.parse(raw);
    if(!validate(state))throw new RangeError("corrupt V3 save");
    return instance(copy(state));
  }
  return Object.freeze({VERSION,SIZE,STORAGE_KEY,create,restore,validate});
});