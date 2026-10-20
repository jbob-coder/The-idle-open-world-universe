/* GODSEED V3 opt-in autonomous simulation. Existing v1 saves are untouched. */
(function(root,factory){"use strict";const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GodseedV3Sim=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
  const VERSION=2,SIZE=20,STORAGE_KEY="godseed-v3-prototype-v1";
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
  // Four renewable patches inside the treeless village clearing; no randomness per tick.
  const GROVE=[{x:3,z:4},{x:4,z:6},{x:6,z:4},{x:7,z:6}];
  function groveFor(){return GROVE.map(p=>({x:p.x,z:p.z,berries:3}));}
  function nearestBush(c,bushes){
    let best=null,dist=Infinity;
    for(const b of bushes)if(b.berries>0){
      const d=distance(c,b);
      if(d<dist){dist=d;best=b;}
    }
    return best;
  }
  function walk(c,target){
    if(c.x!==target.x)c.x+=Math.sign(target.x-c.x);
    else c.z+=Math.sign(target.z-c.z);
    c.energy=Math.max(0,c.energy-1);
  }
  function act(s,c){
    if(!c.alive){c.goal="sin vida";return;}
    if(c.hunger<=60&&s.food>0){
      s.food--;s.foodEaten++;c.hunger=Math.min(100,c.hunger+38);
      c.goal="comer";record(s,c,"eat",{foodSpent:1});return;
    }
    if(c.energy<5&&!(c.hunger<20&&s.food===0)){
      c.energy=Math.min(20,c.energy+8);c.goal="descansar";
      record(s,c,"rest",{energy:c.energy});return;
    }
    // Food takes priority over building and wood reserves.
    if(s.food<2||c.hunger<=60){
      const bush=nearestBush(c,s.bushes);
      if(bush){
        if(distance(c,bush)<=1){
          bush.berries--;s.food++;s.foodGathered++;
          c.energy=Math.max(0,c.energy-2);c.goal="recolectar bayas";
          record(s,c,"forage",{x:bush.x,z:bush.z,foodProduced:1});
        }else{walk(c,bush);c.goal="buscar alimento";}
        return;
      }
      if(c.hunger<=60){
        c.energy=Math.min(20,c.energy+1);c.goal="esperar frutos";return;
      }
    }
    if(!s.structures.length&&s.wood>=4){
      s.wood-=4;s.spent+=4;s.structures.push({id:"first_shelter",type:"house",x:5,z:5});
      c.energy=Math.max(0,c.energy-2);c.goal="construir refugio";
      record(s,c,"build",{id:"first_shelter",woodSpent:4});return;
    }
    if(!s.structures.length||s.wood<4){
      const tree=nearestTree(c,s.forest);
      if(tree){
        if(distance(c,tree)<=1){
          const i=s.forest.findIndex(t=>t.x===tree.x&&t.z===tree.z);
          if(i<0)throw new Error("resource ownership conflict");
          s.forest.splice(i,1);s.wood++;s.harvested++;c.harvested++;
          c.energy=Math.max(0,c.energy-3);c.goal="recolectar madera";
          record(s,c,"harvest",{x:tree.x,z:tree.z,woodProduced:1});
        }else{walk(c,tree);c.goal="caminar hacia recurso";}
        return;
      }
      c.goal="sin madera";c.energy=Math.min(20,c.energy+1);return;
    }
    const home=s.structures[0];
    if(distance(c,home)>1){walk(c,home);c.goal="regresar al refugio";}
    else{c.energy=Math.min(20,c.energy+2);c.goal="cuidar refugio";}
  }
    function validateLegacy(s){
    if(!s||typeof s!=="object"||Array.isArray(s)||s.schemaVersion!==1||
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
  // Validation is the authority for both persisted and in-memory V2 states.
  function validate(s){
    if(!s||typeof s!=="object"||Array.isArray(s)||s.schemaVersion!==VERSION||
       !uint32(s.seed)||!Number.isSafeInteger(s.tick)||s.tick<0||
       !Array.isArray(s.citizens)||s.citizens.length!==1||
       !Array.isArray(s.forest)||!Array.isArray(s.structures)||s.structures.length>1||
       !Array.isArray(s.bushes)||s.bushes.length!==GROVE.length||
       !Array.isArray(s.events)||s.events.length>48)return false;
    for(const key of ["wood","harvested","spent","legacyHarvested",
      "food","foodGathered","foodEaten","foodGrown"]){
      if(!Number.isSafeInteger(s[key])||s[key]<0)return false;
    }
    if(s.wood!==s.harvested-s.spent||s.food!==s.foodGathered-s.foodEaten)return false;
    const original=forestFor(s.seed),keys=new Set();
    if(s.harvested+s.forest.length!==original.length)return false;
    for(const t of s.forest){
      if(!t||!pos(t.x,t.z)||!original.some(p=>p.x===t.x&&p.z===t.z))return false;
      const key=t.x+","+t.z;if(keys.has(key))return false;keys.add(key);
    }
    const c=s.citizens[0];
    if(!c||c.id!=="sim_aria"||c.name!=="Aria"||c.trait!=="explorer"||
       !pos(c.x,c.z)||!Number.isInteger(c.energy)||c.energy<0||c.energy>20||
       !Number.isInteger(c.hunger)||c.hunger<0||c.hunger>100||
       !Number.isInteger(c.health)||c.health<0||c.health>100||
       typeof c.alive!=="boolean"||c.alive!==(c.health>0)||
       !Number.isSafeInteger(c.harvested)||c.harvested<0||
       c.harvested+s.legacyHarvested!==s.harvested||
       typeof c.goal!=="string"||c.goal.length>80)return false;
    let berries=0;
    for(let i=0;i<GROVE.length;i++){
      const b=s.bushes[i],p=GROVE[i];
      if(!b||b.x!==p.x||b.z!==p.z||!Number.isInteger(b.berries)||
         b.berries<0||b.berries>3)return false;
      berries+=b.berries;
    }
    if(s.foodGathered+berries!==GROVE.length*3+s.foodGrown)return false;
    if(s.structures.length){
      const b=s.structures[0];
      if(!b||b.id!=="first_shelter"||b.type!=="house"||
         b.x!==5||b.z!==5||s.spent!==4)return false;
    }else if(s.spent!==0)return false;
    for(const e of s.events){
      if(!e||!Number.isSafeInteger(e.tick)||e.tick<0||e.tick>s.tick||
        !["sim_aria","sim_bran"].includes(e.actor)||
        !["build","harvest","forage","eat","rest"].includes(e.action))return false;
    }
    return true;
  }
  function instance(state){
    function snapshot(){return copy(state);}
    function advance(n){
      if(!Number.isSafeInteger(n)||n<0||n>20000)throw new RangeError("invalid steps");
      for(let i=0;i<n;i++){
        state.tick++;
        if(state.tick%15===0)for(const b of state.bushes){
          if(b.berries<3){b.berries++;state.foodGrown++;}
        }
        for(const c of state.citizens){
          if(!c.alive)continue;
          c.hunger=Math.max(0,c.hunger-1);
          if(c.hunger===0)c.health=Math.max(0,c.health-2);
          else if(c.hunger>65)c.health=Math.min(100,c.health+1);
          c.alive=c.health>0;
          act(state,c);
        }
      }
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
      citizens:[{id:"sim_aria",name:"Aria",trait:"explorer",x:4,z:4,
        energy:20,hunger:85,health:100,alive:true,harvested:0,goal:"explorar"}],
      forest:forestFor(seed),wood:0,harvested:0,spent:0,legacyHarvested:0,
      bushes:groveFor(),food:0,foodGathered:0,foodEaten:0,foodGrown:0,
      structures:[],events:[]});
  }
  // Old prototype saves are accepted only when they pass their original validation.
  // Bran's past harvesting stays attributed to an archived resource ledger.
  function migrateLegacy(s){
    if(!validateLegacy(s))throw new RangeError("corrupt V3 legacy save");
    const a=copy(s.citizens[0]),bran=s.citizens[1];
    a.hunger=85;a.health=100;a.alive=true;
    return Object.assign({},s,{schemaVersion:VERSION,citizens:[a],
      legacyHarvested:bran.harvested,bushes:groveFor(),
      food:0,foodGathered:0,foodEaten:0,foodGrown:0});
  }
    function restore(raw){
    if(typeof raw!=="string"||raw.length>64000)throw new RangeError("invalid V3 save");
    let state=JSON.parse(raw);
    if(state&&state.schemaVersion===1)state=migrateLegacy(state);
    if(!validate(state))throw new RangeError("corrupt V3 save");
    return instance(copy(state));
  }
    return Object.freeze({VERSION,SIZE,STORAGE_KEY,create,restore,validate});
});