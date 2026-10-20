/* WLD-008: opt-in bounded offscreen citizen simulation. Not wired to legacy v1. */
(function(root,factory){
"use strict";
const Store=typeof module!=="undefined"&&module.exports?require("./chunk_store.js"):root.GodseedChunkStore;
const Chunks=typeof module!=="undefined"&&module.exports?require("./chunks.js"):root.GodseedChunks;
const api=factory(Store,Chunks);
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.GodseedOffscreenSociety=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(Store,Chunks){
"use strict";
const VERSION=1,MAX_EVENTS=48,MAX_SAVE_BYTES=250000;
const NEAR_CADENCE=4,FAR_CADENCE=24,MAX_STEPS=20000;
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]],T=Chunks.T;
const passable=t=>t!==T.WATER&&t!==T.STONE;
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const copy=x=>JSON.parse(JSON.stringify(x));
function chooseHome(store){
 let fallback=null;
 for(let y=-12;y<=12;y++)for(let x=-12;x<=12;x++){
  const tile=store.tileAt(x,y);
  if(tile!==T.GRASS&&tile!==T.MEADOW)continue;
  if(!passable(store.tileAt(x+1,y)))continue;
  if(!fallback)fallback={x,y};
  let nearby=0;
  for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++)
   if(Math.abs(dx)+Math.abs(dy)<=5&&store.tileAt(x+dx,y+dy)===T.FOREST)nearby++;
  if(nearby>=4)return{x,y};
 }
 if(!fallback)throw new Error("No suitable starting terrain");
 return fallback;
}
function nextForest(store,citizen,home){
 const queue=[{x:citizen.x,y:citizen.y,first:null}];
 const visited=new Set([citizen.x+","+citizen.y]);
 for(let q=0;q<queue.length&&q<500;q++){
  const current=queue[q];
  if(store.tileAt(current.x,current.y)===T.FOREST)
   return current.first||{x:current.x,y:current.y};
  for(const dir of DIRS){
   const x=current.x+dir[0],y=current.y+dir[1],key=x+","+y;
   if(Math.abs(x-home.x)>12||Math.abs(y-home.y)>12||visited.has(key))continue;
   visited.add(key);
   if(!passable(store.tileAt(x,y)))continue;
   queue.push({x,y,first:current.first||{x,y}});
  }
 }
 return null;
}
function instance(store,state){
 function record(type,citizen,details){
  state.events.push({tick:state.tick,type,who:citizen,details});
  if(state.events.length>MAX_EVENTS)state.events.shift();
 }
 function act(c){
  if(c.energy<=4){c.energy=Math.min(60,c.energy+12);c.goal="recover";return;}
  if(state.built){c.energy=Math.min(60,c.energy+3);c.goal="maintain shelter";return;}
  if(state.stock.wood>=4){
   store.putSite({id:"settlers_hamlet",kind:"settlement",type:"hamlet",
    x:state.home.x,y:state.home.y,label:"Settlers Hamlet",townId:null});
   store.putSite({id:"settlers_shelter",kind:"building",type:"house",
    x:state.home.x+1,y:state.home.y,label:"First Shelter",townId:"settlers_hamlet"});
   state.stock.wood-=4;state.ledger.spent+=4;state.built=true;
   c.energy-=2;c.goal="shelter built";
   record("construction",c.id,{woodSpent:4,remaining:state.stock.wood});return;
  }
  if(store.tileAt(c.x,c.y)===T.FOREST){
   store.setTile(c.x,c.y,T.GRASS);
   state.stock.wood++;state.ledger.harvested++;
   c.energy-=3;c.goal="harvesting timber";
   record("harvest",c.id,{x:c.x,y:c.y,woodProduced:1});return;
  }
  const next=nextForest(store,c,state.home);
  if(next){c.x=next.x;c.y=next.y;c.energy--;c.goal="seek forest";}
  else c.goal="no accessible forest";
 }
 function snapshot(){
  return copy({tick:state.tick,home:state.home,citizens:state.citizens,
   stock:state.stock,ledger:state.ledger,built:state.built,events:state.events,
   offscreenActions:state.offscreenActions,cache:store.stats(),
   settlement:store.site("settlers_hamlet"),shelter:store.site("settlers_shelter")});
 }
 function advance(steps,view){
  if(!Number.isInteger(steps)||steps<0||steps>MAX_STEPS)throw new RangeError("invalid ticks");
  const camera=view||{x:state.home.x,y:state.home.y};
  if(!Number.isSafeInteger(camera.x)||!Number.isSafeInteger(camera.y))
   throw new RangeError("invalid camera coordinates");
  for(let i=0;i<steps;i++){
   state.tick++;
   const far=distance(camera,state.home)>32,cadence=far?FAR_CADENCE:NEAR_CADENCE;
   if(state.tick%cadence!==0)continue;
   if(far)state.offscreenActions++;
   for(const c of state.citizens)act(c);
  }
  return snapshot();
 }
 function serialize(){
  const raw=JSON.stringify({schemaVersion:VERSION,seed:store.seed,state,world:store.snapshot()});
  if(raw.length>MAX_SAVE_BYTES)throw new RangeError("offscreen save quota exceeded");
  return raw;
 }
 return Object.freeze({advance,snapshot,serialize,store});
}
function create(seed,options){
 const store=Store.create(seed,{maxActive:options&&options.maxActive||3});
 const home=chooseHome(store);
 return instance(store,{tick:0,home,citizens:[
  {id:"settler_a",x:home.x,y:home.y,energy:60,goal:"survey"},
  {id:"settler_b",x:home.x+1,y:home.y,energy:60,goal:"survey"}],
  stock:{wood:0},ledger:{harvested:0,spent:0},built:false,events:[],offscreenActions:0});
}
function restore(raw,options){
 if(typeof raw!=="string"||raw.length>MAX_SAVE_BYTES)throw new RangeError("invalid offscreen save");
 const data=JSON.parse(raw),s=data&&data.state;
 if(!data||data.schemaVersion!==VERSION||!s||
  !Number.isInteger(s.tick)||s.tick<0||
  !Array.isArray(s.citizens)||s.citizens.length!==2||
  !s.home||!Number.isSafeInteger(s.home.x)||!Number.isSafeInteger(s.home.y)||
  !s.stock||!Number.isInteger(s.stock.wood)||s.stock.wood<0||
  !s.ledger||!Number.isInteger(s.ledger.harvested)||!Number.isInteger(s.ledger.spent)||
  s.stock.wood!==s.ledger.harvested-s.ledger.spent||
  typeof s.built!=="boolean"||!Array.isArray(s.events)||s.events.length>MAX_EVENTS||
  !Number.isInteger(s.offscreenActions)||s.offscreenActions<0||
  !s.citizens.every(c=>typeof c.id==="string"&&Number.isSafeInteger(c.x)&&
    Number.isSafeInteger(c.y)&&Number.isInteger(c.energy)&&c.energy>=0&&c.energy<=60))
  throw new RangeError("invalid offscreen society state");
 const store=Store.restore(JSON.stringify(data.world),{maxActive:options&&options.maxActive||3});
 if(store.seed!==data.seed||Boolean(store.site("settlers_hamlet"))!==s.built||
  Boolean(store.site("settlers_shelter"))!==s.built)
  throw new RangeError("inconsistent offscreen save");
 return instance(store,s);
}
return Object.freeze({create,restore,NEAR_CADENCE,FAR_CADENCE,MAX_SAVE_BYTES});
});
