/* GODSEED V3 opt-in autonomous simulation. Existing v1 saves are untouched. */
(function(root,factory){"use strict";const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GodseedV3Sim=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
  const VERSION=3,SIZE=20,STORAGE_KEY="godseed-v3-prototype-v1";
  const copy=x=>JSON.parse(JSON.stringify(x));
  // A day is derived from the simulation tick: no wall clock, extra state or save migration.
  const DAY_LENGTH=160;
  function dayInfo(tick){
    if(!Number.isSafeInteger(tick)||tick<0)throw new RangeError("invalid world time");
    const hour=tick%DAY_LENGTH;
    return {day:Math.floor(tick/DAY_LENGTH)+1,
      phase:hour>=120?"noche":hour>=104?"atardecer":hour<24?"amanecer":"día",
      hour};
  }
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
  // Seed-derived personality; observable, bounded cognition with no external AI services.
  const clamp=x=>Math.max(0,Math.min(100,x));
  const LANDMARKS=[{x:2,z:2},{x:10,z:4},{x:11,z:9},{x:6,z:12},
    {x:3,z:11},{x:13,z:5},{x:10,z:14},{x:14,z:13}];
  const remembered=new Set(["forage","eat","build","discover","reflect","hardship"]);
  function makeMind(seed,c,s){
    return {personality:{
      curiosity:40+(seed%41),
      caution:30+((seed>>>7)%51)
    },emotions:{contentment:55,stress:10},
    skills:{foraging:Math.min(100,s.foodGathered*2),woodworking:Math.min(100,c.harvested*8)},
    memories:[],visited:[c.z*SIZE+c.x],reflections:0};
  }
  function memory(s,c,action,details){
    if(!c.mind||!remembered.has(action))return;
    const m=c.mind.memories;
    // First meal/forage and construction are durable milestones, not spam.
    if((action==="eat"||action==="forage")&&m.some(v=>v.kind===action))return;
    if(action==="reflect"&&s.tick%30!==0)return;
    const entry={tick:s.tick,kind:action,x:c.x,z:c.z,
      valence:action==="hardship"?-2:action==="build"?2:1};
    if(action==="discover"&&details&&pos(details.x,details.z)){
      entry.x=details.x;entry.z=details.z;
    }
    if(m.length>=20){
      const index=m.findIndex(v=>v.kind!=="build"&&v.kind!=="eat"&&v.kind!=="forage");
      m.splice(index<0?0:index,1);
    }
    m.push(entry);
  }
  function visit(c){
    const key=c.z*SIZE+c.x;
    if(!c.mind.visited.includes(key))c.mind.visited.push(key);
  }
  function explore(s,c){
    const m=c.mind;
    if(m.personality.curiosity<46||m.emotions.stress>=28||
      c.hunger<72||c.energy<9)return false;
    const points=LANDMARKS;
    // Choosing a new landmark depends on remembered visited cells.
    const next=points.find(p=>!m.visited.includes(p.z*SIZE+p.x));
    if(!next)return false;
    walk(c,next);
    c.goal="explorar terreno";
    visit(c);
    if(c.x===next.x&&c.z===next.z)
      record(s,c,"discover",{x:next.x,z:next.z});
    return true;
  }

  function record(s,c,action,details){
    s.events.push({tick:s.tick,actor:c.id,action,details});
    if(s.events.length>48)s.events.shift();
    if(c.mind){
      const mood=c.mind.emotions;
      const effects={harvest:[1,0],forage:[2,-2],eat:[5,-5],
        build:[20,-15],rest:[1,-3],discover:[6,-3],
        reflect:[3,-10],hardship:[-8,9]};
      const delta=effects[action];
      if(delta){
        mood.contentment=clamp(mood.contentment+delta[0]);
        mood.stress=clamp(mood.stress+delta[1]);
      }
      memory(s,c,action,details);
    }
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
    // At night, return to the actual shelter and sleep, but never ignore hunger
    // or an empty pantry. Sleep is chosen by Aria, not requested by the player.
    const hour=s.tick%DAY_LENGTH;
    if(hour>=120&&s.structures.length&&s.food>0&&c.hunger>=65){
      const home=s.structures[0];
      if(distance(c,home)>1){
        walk(c,home);c.goal="regresar a dormir";
      }else{
        c.energy=Math.min(20,c.energy+5);
        c.goal="dormir";
        if(hour===120||hour%20===0)record(s,c,"sleep",{energy:c.energy});
      }
      return;
    }
    if(c.energy<5&&!(c.hunger<20&&s.food===0)){
      c.energy=Math.min(20,c.energy+8);c.goal="descansar";
      record(s,c,"rest",{energy:c.energy});return;
    }
    // Food takes priority over building and wood reserves.
    const foodTarget=2+Math.floor(c.mind.personality.caution/24);
    if(s.food<foodTarget||c.hunger<=60){
      const bush=nearestBush(c,s.bushes);
      if(bush){
        if(distance(c,bush)<=1){
          bush.berries--;s.food++;s.foodGathered++;
          c.energy=Math.max(0,c.energy-(c.mind.skills.foraging>=30?1:2));
          c.mind.skills.foraging=Math.min(100,c.mind.skills.foraging+2);
          c.goal="recolectar bayas";
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
          c.energy=Math.max(0,c.energy-(c.mind.skills.woodworking>=32?2:3));
          c.mind.skills.woodworking=Math.min(100,c.mind.skills.woodworking+8);
          c.goal="recolectar madera";
          record(s,c,"harvest",{x:tree.x,z:tree.z,woodProduced:1});
        }else{walk(c,tree);c.goal="caminar hacia recurso";}
        return;
      }
      c.goal="sin madera";c.energy=Math.min(20,c.energy+1);return;
    }
    const home=s.structures[0];
    if(c.mind.emotions.stress>=28){
      if(distance(c,home)>1){walk(c,home);c.goal="buscar seguridad";}
      else{
        c.energy=Math.min(20,c.energy+3);c.mind.reflections++;
        c.goal="reflexionar en refugio";
        record(s,c,"reflect",{relief:10});
      }
      return;
    }
    if(explore(s,c))return;
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
  // Preserve the exact V2 validator to reject malformed saves before migration.
  function validateV2(s){
    if(!s||typeof s!=="object"||Array.isArray(s)||s.schemaVersion!==2||
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
  function validate(s){
    if(!s||s.schemaVersion!==VERSION)return false;
    // Audit conserved resources, forest, food and one-citizen structure with
    // the established V2 validator; only the two new factual action types differ.
    if(!Array.isArray(s.events)||s.events.length>48)return false;
    if(!s.events.every(e=>e&&Number.isSafeInteger(e.tick)&&e.tick>=0&&
        e.tick<=s.tick&&["sim_aria","sim_bran"].includes(e.actor)&&
        ["build","harvest","forage","eat","rest","sleep","discover","reflect","hardship"].includes(e.action)))return false;
    const prior=Object.assign({},s,{schemaVersion:2,
      events:s.events.filter(e=>!["discover","reflect","hardship","sleep"].includes(e.action))});
    if(!validateV2(prior))return false;
    const c=s.citizens[0],m=c.mind;
    if(!m||typeof m!=="object"||Array.isArray(m)||
      !m.personality||!m.emotions||!m.skills||!Array.isArray(m.memories)||
      m.memories.length>20||!Array.isArray(m.visited)||m.visited.length>SIZE*SIZE||
      !Number.isSafeInteger(m.reflections)||m.reflections<0||m.reflections>s.tick)
      return false;
    for(const [o,keys] of [[m.personality,["curiosity","caution"]],
      [m.emotions,["contentment","stress"]],
      [m.skills,["foraging","woodworking"]]]){
      if(!o||typeof o!=="object"||keys.some(k=>!Number.isInteger(o[k])||o[k]<0||o[k]>100))
        return false;
    }
    const seen=new Set();
    for(const key of m.visited){
      if(!Number.isInteger(key)||key<0||key>=SIZE*SIZE||seen.has(key))return false;
      seen.add(key);
    }
    if(!seen.has(c.z*SIZE+c.x))return false;
    let last=-1;
    for(const note of m.memories){
      if(!note||!Number.isSafeInteger(note.tick)||note.tick<0||
        note.tick>s.tick||note.tick<last||!remembered.has(note.kind)||
        !pos(note.x,note.z)||!Number.isInteger(note.valence)||
        note.valence<-2||note.valence>2)return false;
      last=note.tick;
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
          if(c.hunger<35&&state.tick%10===0)
            record(state,c,"hardship",{hunger:c.hunger});
          if(c.energy<=6||c.hunger<55)
            c.mind.emotions.stress=clamp(c.mind.emotions.stress+1);
          else if(state.tick%7===0)
            c.mind.emotions.stress=clamp(c.mind.emotions.stress-1);
          if(c.hunger<30&&state.tick%10===0)
            c.mind.emotions.contentment=clamp(c.mind.emotions.contentment-1);
          if(c.alive)act(state,c);
          visit(c);
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
    const state={schemaVersion:VERSION,seed,tick:0,
      citizens:[{id:"sim_aria",name:"Aria",trait:"explorer",x:4,z:4,
        energy:20,hunger:85,health:100,alive:true,harvested:0,goal:"explorar"}],
      forest:forestFor(seed),wood:0,harvested:0,spent:0,legacyHarvested:0,
      bushes:groveFor(),food:0,foodGathered:0,foodEaten:0,foodGrown:0,
      structures:[],events:[]};
    state.citizens[0].mind=makeMind(seed,state.citizens[0],state);
    return instance(state);
  }
  // Old prototype saves are accepted only when they pass their original validation.
  // Bran's past harvesting stays attributed to an archived resource ledger.
  function migrateLegacy(s){
    if(!validateLegacy(s))throw new RangeError("corrupt V3 legacy save");
    const a=copy(s.citizens[0]),bran=s.citizens[1];
    a.hunger=85;a.health=100;a.alive=true;
    return Object.assign({},s,{schemaVersion:2,citizens:[a],
      legacyHarvested:bran.harvested,bushes:groveFor(),
      food:0,foodGathered:0,foodEaten:0,foodGrown:0});
  }
  function migrateV2(s){
    if(!validateV2(s))throw new RangeError("corrupt V3 v2 save");
    const state=copy(s);
    state.schemaVersion=VERSION;
    state.citizens[0].mind=makeMind(s.seed,s.citizens[0],s);
    return state;
  }
    function restore(raw){
    if(typeof raw!=="string"||raw.length>64000)throw new RangeError("invalid V3 save");
    let state=JSON.parse(raw);
    if(state&&state.schemaVersion===1)state=migrateLegacy(state);
    if(state&&state.schemaVersion===2)state=migrateV2(state);
    if(!validate(state))throw new RangeError("corrupt V3 save");
    return instance(copy(state));
  }
    return Object.freeze({VERSION,SIZE,STORAGE_KEY,DAY_LENGTH,dayInfo,create,restore,validate});
});