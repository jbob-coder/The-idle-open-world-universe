/* GODSEED V3: isolated, deterministic settlement prototype. No network or external AI. */
(function(root,factory){"use strict";const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GodseedV3Society=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
  const VERSION=1,SIZE=20,STORAGE_KEY="godseed-v3-society-v1";
  const copy=x=>JSON.parse(JSON.stringify(x));
  const validPos=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.z)&&p.x>=0&&p.z>=0&&p.x<SIZE&&p.z<SIZE;
  const number=n=>Number.isSafeInteger(n)&&n>=0;
  const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
  const SITES=Object.freeze([{id:"home",type:"house",x:5,z:5,cost:4},
    {id:"workshop",type:"workshop",x:10,z:5,cost:6},
    {id:"storehouse",type:"storehouse",x:8,z:10,cost:4}]);
  const GROVE=Object.freeze([{x:3,z:4},{x:4,z:6},{x:6,z:4},{x:7,z:6}]);
  const PEOPLE=Object.freeze([
    {id:"sim_aria",name:"Aria",trait:"explorer",x:4,z:4,skill:2},
    {id:"sim_bran",name:"Bran",trait:"builder",x:16,z:15,skill:3},
    {id:"sim_elen",name:"Elen",trait:"caretaker",x:15,z:16,skill:2}
  ]);
  const same=(a,b)=>a.x===b.x&&a.z===b.z;
  function forestFor(seed){
    const reserved=[...SITES,...GROVE];
    const result=[];
    for(let z=1;z<SIZE-1;z++)for(let x=1;x<SIZE-1;x++){
      if(x>=3&&x<=7&&z>=3&&z<=6)continue;
      if(reserved.some(p=>p.x===x&&p.z===z))continue;
      const h=Math.imul(x+11,73856093)^Math.imul(z+17,19349663)^Math.imul(seed+1,83492791);
      if((h>>>0)%11<2)result.push({x,z});
    }
    for(const p of [{x:3,z:8},{x:8,z:6},{x:9,z:8},{x:5,z:10},{x:11,z:5},{x:7,z:11}]){
      if(!reserved.some(t=>same(t,p))&&!result.some(t=>same(t,p)))result.push(p);
    }
    return result.sort((a,b)=>a.z-b.z||a.x-b.x);
  }
  function actor(template){return {id:template.id,name:template.name,trait:template.trait,x:template.x,z:template.z,
    skill:template.skill,energy:20,hunger:85,health:100,alive:true,harvested:0,
    crafted:0,built:0,conversations:0,goal:"explorar",relations:{}};}
  function record(s,c,action,details){
    s.events.push({tick:s.tick,actor:c.id,action,details});
    if(s.events.length>96)s.events.shift();
  }
  function walk(c,target){
    if(c.x!==target.x)c.x+=Math.sign(target.x-c.x);
    else if(c.z!==target.z)c.z+=Math.sign(target.z-c.z);
    c.energy=Math.max(0,c.energy-1);
  }
  function nearest(c,items){let best=null,score=Infinity;
    for(const item of items){
      const d=distance(c,item);
      if(d<score){score=d;best=item;}
    }
    return best;
  }
  function gathering(s,c){
    const tree=nearest(c,s.forest);
    if(!tree){c.goal="sin árboles";return;}
    if(distance(c,tree)>1){walk(c,tree);c.goal="buscar madera";return;}
    const i=s.forest.findIndex(t=>same(t,tree));
    if(i<0)throw Error("tree ownership conflict");
    s.forest.splice(i,1);s.wood++;s.harvested++;c.harvested++;
    c.energy=Math.max(0,c.energy-2);c.goal="talar";
    record(s,c,"harvest",{x:tree.x,z:tree.z,amount:1});
  }
  function craft(s,c,recipe){
    const cost=2;
    if(s.wood<cost)throw Error("craft without materials");
    s.wood-=cost;s.craftedWood+=cost;c.crafted++;c.energy=Math.max(0,c.energy-2);
    if(recipe==="axe"){s.axe=1;s.axeCrafted++;}
    else if(recipe==="kit"){s.kits++;s.kitsCrafted++;}
    else throw Error("unknown recipe");
    c.goal="fabricar "+recipe;
    record(s,c,"craft",{recipe,woodSpent:cost});
  }
  function construct(s,c,site){
    if(s.wood<site.cost||s.structures.length!==SITES.indexOf(site))
      throw Error("invalid construction attempt");
    if(distance(c,site)>1){walk(c,site);c.goal="ir a obra";return;}
    if(site.id!=="home"&&s.kits<1)throw Error("construction kit missing");
    s.wood-=site.cost;s.spentWood+=site.cost;
    if(site.id!=="home"){s.kits--;s.kitsUsed++;}
    s.structures.push({id:site.id,type:site.type,x:site.x,z:site.z,builder:c.id,completedAt:s.tick});
    c.built++;c.goal="construir "+site.type;
    c.energy=Math.max(0,c.energy-3);
    if(site.id==="home"){s.settlement.foundedAt=s.tick;}
    record(s,c,"build",{site:site.id,woodSpent:site.cost,kitUsed:site.id!=="home"});
  }
  function forage(s,c){
    const bush=nearest(c,s.bushes.filter(b=>b.berries>0));
    if(!bush){c.goal="esperar bayas";return;}
    if(distance(c,bush)>1){walk(c,bush);c.goal="buscar bayas";return;}
    bush.berries--;s.food++;s.foodGathered++;c.energy=Math.max(0,c.energy-1);
    c.goal="recolectar alimento";record(s,c,"forage",{x:bush.x,z:bush.z,amount:1});
  }
  function social(s,c){
    const other=nearest(c,s.citizens.filter(p=>p.id!==c.id&&p.alive));
    if(!other)return false;
    if(distance(c,other)>2){walk(c,other);c.goal="buscar compañía";return true;}
    c.relations[other.id]=(c.relations[other.id]||0)+1;
    other.relations[c.id]=(other.relations[c.id]||0)+1;
    c.conversations++;other.conversations++;
    c.goal="conversar";record(s,c,"talk",{with:other.id,trust:c.relations[other.id]});
    return true;
  }
  function plan(s){
    if(!s.axe)return {type:s.wood>=2?"axe":"wood"};
    if(!s.structures.length)return {type:s.wood>=4?"build":"wood",site:SITES[0]};
    if(s.citizens.length>=2&&s.structures.length===1){
      if(!s.kits)return {type:s.wood>=2?"kit":"wood"};
      return {type:s.wood>=6?"build":"wood",site:SITES[1]};
    }
    // The council must choose a leader before the third public project is approved.
    if(s.citizens.length>=3&&s.structures.length===2&&s.settlement.leaderId){
      if(!s.kits)return {type:s.wood>=2?"kit":"wood"};
      return {type:s.wood>=4?"build":"wood",site:SITES[2]};
    }
    return {type:"none"};
  }
  function act(s,c){
    if(!c.alive)return;
    c.hunger=Math.max(0,c.hunger-1);
    if(c.hunger===0)c.health=Math.max(0,c.health-2);
    else if(c.hunger>65)c.health=Math.min(100,c.health+1);
    if(c.health===0){c.alive=false;c.goal="fallecido";record(s,c,"death",{});return;}
    if(c.hunger<=60&&s.food>0){
      s.food--;s.foodEaten++;c.hunger=Math.min(100,c.hunger+40);
      c.goal="comer";record(s,c,"eat",{foodSpent:1});return;
    }
    if(c.energy<5){c.energy=Math.min(20,c.energy+9);c.goal="descansar";return;}
    // Newcomers must travel into the inhabited settlement before undertaking work.
    if(c.id!=="sim_aria"&&s.structures.length&&distance(c,SITES[0])>2){
      walk(c,SITES[0]);c.goal="llegar a la aldea";return;
    }
    if(s.food<Math.max(2,s.citizens.length)||c.hunger<=58){
      if(s.bushes.some(b=>b.berries>0)){forage(s,c);return;}
    }
    if(s.citizens.length>1&&s.tick%9===0&&social(s,c))return;
    const job=plan(s);
    if(job.type==="wood"){gathering(s,c);return;}
    if(job.type==="axe"||job.type==="kit"){craft(s,c,job.type);return;}
    if(job.type==="build"){construct(s,c,job.site);return;}
    if(s.citizens.length>1&&s.tick%5===0&&social(s,c))return;
    const home=SITES[0];if(distance(c,home)>1){walk(c,home);c.goal="volver a casa";}
    else{c.energy=Math.min(20,c.energy+2);c.goal="cuidar aldea";}
  }
  function arrival(s){
    if(!s.structures.length||s.citizens.length>=3)return;
    if(s.tick-s.settlement.foundedAt<(s.citizens.length===1?20:75))return;
    const next=actor(PEOPLE[s.citizens.length]);
    s.citizens.push(next);record(s,next,"arrive",{settlement:s.settlement.id});
  }
  function elect(s){
    if(s.citizens.length<3||s.citizens.some(c=>!c.alive))return;
    if(s.citizens.reduce((n,c)=>n+c.conversations,0)<6)return;
    if(s.settlement.leaderId&&s.tick-s.settlement.electionTick<180)return;
    const ballots=s.citizens.map(voter=>{
      const ranking=s.citizens.map(candidate=>({
        id:candidate.id,
        score:candidate.skill*3+candidate.built*5+candidate.crafted*3+
          candidate.harvested+Math.min(20,voter.relations[candidate.id]||0)
      })).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
      return {voter:voter.id,candidate:ranking[0].id};
    });
    const votes={};for(const b of ballots)votes[b.candidate]=(votes[b.candidate]||0)+1;
    const candidates=s.citizens.map(c=>({id:c.id,votes:votes[c.id]||0}))
      .sort((a,b)=>b.votes-a.votes||a.id.localeCompare(b.id));
    s.settlement.leaderId=candidates[0].id;
    s.settlement.electionTick=s.tick;
    s.settlement.ballots=ballots;
    s.settlement.elections++;
    record(s,s.citizens.find(c=>c.id===s.settlement.leaderId),"elect",{
      leader:s.settlement.leaderId,ballots:copy(ballots)});
  }
  function create(seed){
    if(!number(seed)||seed>0xffffffff)throw RangeError("seed must be uint32");
    return instance({schemaVersion:VERSION,seed,tick:0,forest:forestFor(seed),
      bushes:GROVE.map(p=>({x:p.x,z:p.z,berries:3})),
      citizens:[actor(PEOPLE[0])],structures:[],
      wood:0,harvested:0,craftedWood:0,spentWood:0,
      axe:0,axeCrafted:0,kits:0,kitsCrafted:0,kitsUsed:0,
      food:0,foodGathered:0,foodEaten:0,foodGrown:0,
      settlement:{id:"village_01",name:"Primera Aldea",foundedAt:null,
        leaderId:null,electionTick:0,elections:0,ballots:[]},events:[]});
  }
  function validate(s){
    if(!s||typeof s!=="object"||Array.isArray(s)||s.schemaVersion!==VERSION||
      !number(s.seed)||s.seed>0xffffffff||!number(s.tick)||
      !Array.isArray(s.citizens)||s.citizens.length<1||s.citizens.length>3||
      !Array.isArray(s.forest)||!Array.isArray(s.bushes)||s.bushes.length!==4||
      !Array.isArray(s.structures)||s.structures.length>3||
      !Array.isArray(s.events)||s.events.length>96)return false;
    for(const key of ["wood","harvested","craftedWood","spentWood","axe","axeCrafted",
      "kits","kitsCrafted","kitsUsed","food","foodGathered","foodEaten","foodGrown"])
      if(!number(s[key]))return false;
    if(s.wood!==s.harvested-s.craftedWood-s.spentWood||
      s.food!==s.foodGathered-s.foodEaten||
      s.kits!==s.kitsCrafted-s.kitsUsed||
      s.axe!==s.axeCrafted||s.axe>1||
      s.craftedWood!==2*(s.axeCrafted+s.kitsCrafted)||
      s.kitsUsed!==Math.max(0,s.structures.length-1))return false;
    const trees=forestFor(s.seed);
    if(s.harvested+s.forest.length!==trees.length)return false;
    const treeKeys=new Set();
    for(const t of s.forest){
      if(!validPos(t)||!trees.some(p=>same(p,t)))return false;
      const key=t.x+","+t.z;if(treeKeys.has(key))return false;treeKeys.add(key);
    }
    let berries=0;
    for(let i=0;i<GROVE.length;i++){
      const b=s.bushes[i],p=GROVE[i];
      if(!b||!same(b,p)||!number(b.berries)||b.berries>3)return false;
      berries+=b.berries;
    }
    if(berries+s.foodGathered!==12+s.foodGrown||
      s.foodGrown>4*Math.floor(s.tick/15))return false;
    let spent=0;for(let i=0;i<s.structures.length;i++){
      const b=s.structures[i],p=SITES[i];
      if(!b||b.id!==p.id||b.type!==p.type||!same(b,p)||
        !PEOPLE.some(c=>c.id===b.builder)||!number(b.completedAt)||
        b.completedAt>s.tick)return false;
      spent+=p.cost;
    }
    if(spent!==s.spentWood||s.axeCrafted!==(s.structures.length?1:s.axeCrafted))return false;
    const ids=new Set(s.citizens.map(c=>c.id));
    for(let i=0;i<s.citizens.length;i++){
      const c=s.citizens[i],p=PEOPLE[i];
      if(!c||c.id!==p.id||c.name!==p.name||c.trait!==p.trait||
        !validPos(c)||!number(c.energy)||c.energy>20||!number(c.hunger)||
        c.hunger>100||!number(c.health)||c.health>100||
        c.alive!==(c.health>0)||!number(c.skill)||c.skill!==p.skill||
        !number(c.harvested)||!number(c.crafted)||!number(c.built)||
        !number(c.conversations)||typeof c.goal!=="string"||c.goal.length>80||
        !c.relations||typeof c.relations!=="object"||Array.isArray(c.relations))return false;
      for(const [target,value] of Object.entries(c.relations)){
        if(!ids.has(target)||target===c.id||!number(value)||value>20000)return false;
      }
    }
    if(s.citizens.reduce((n,c)=>n+c.harvested,0)!==s.harvested||
      s.citizens.reduce((n,c)=>n+c.crafted,0)!==s.axeCrafted+s.kitsCrafted||
      s.citizens.reduce((n,c)=>n+c.built,0)!==s.structures.length)return false;
    for(const c of s.citizens)for(const [id,v] of Object.entries(c.relations)){
      const target=s.citizens.find(a=>a.id===id);
      if(!target||target.relations[c.id]!==v)return false;
    }
    if(!s.settlement||s.settlement.id!=="village_01"||
      s.settlement.name!=="Primera Aldea"||
      (s.settlement.foundedAt===null)!==(s.structures.length===0)||
      (s.settlement.foundedAt!==null&&(!number(s.settlement.foundedAt)||
        s.settlement.foundedAt>s.tick))||
      !number(s.settlement.electionTick)||!number(s.settlement.elections)||
      !Array.isArray(s.settlement.ballots)||s.settlement.ballots.length>3||
      (s.settlement.leaderId!==null&&!ids.has(s.settlement.leaderId))||
      (!!s.settlement.leaderId)!==(s.settlement.elections>0))return false;
    for(const ballot of s.settlement.ballots)if(!ballot||!ids.has(ballot.voter)||
      !ids.has(ballot.candidate))return false;
    if(s.settlement.elections>0&&s.settlement.ballots.length!==3)return false;
    for(const e of s.events)if(!e||!number(e.tick)||e.tick>s.tick||
      !PEOPLE.some(c=>c.id===e.actor)||
      !["harvest","craft","build","forage","eat","talk","arrive","elect","death"].includes(e.action)||
      typeof e.details!=="object")return false;
    return true;
  }
  function instance(state){
    function snapshot(){return copy(state);}
    function advance(n){
      if(!number(n)||n>20000)throw RangeError("invalid steps");
      for(let i=0;i<n;i++){
        state.tick++;
        if(state.tick%15===0)for(const b of state.bushes){
          if(b.berries<3){b.berries++;state.foodGrown++;}
        }
        arrival(state);
        for(const c of state.citizens)act(state,c);
        if(state.tick%30===0)elect(state);
      }
      return snapshot();
    }
    function serialize(){const raw=JSON.stringify(state);
      if(raw.length>64000)throw RangeError("save too large");return raw;}
    return Object.freeze({advance,snapshot,serialize});
  }
  function restore(raw){
    if(typeof raw!=="string"||raw.length>64000)throw RangeError("invalid save");
    let value=JSON.parse(raw);
    if(!validate(value))throw RangeError("invalid society state");
    return instance(copy(value));
  }
  return Object.freeze({VERSION,SIZE,STORAGE_KEY,create,restore,validate});
});