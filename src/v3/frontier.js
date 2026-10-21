/* Autonomous two-community frontier extension for the isolated GODSEED V3 society.
 * Strictly bounded: one extra outpost, one founder, one courier. No RNG or network.
 * The parent simulation remains authoritative for clock, citizens and finite trees.
 */
(function(root,factory){"use strict";const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.GodseedV3Frontier=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
 const SITE=Object.freeze({id:"east_outpost",type:"house",x:15,z:13,cost:4});
 const SITE_ID="village_02";
 const number=n=>Number.isSafeInteger(n)&&n>=0;
 const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
 const same=(a,b)=>a.x===b.x&&a.z===b.z;
 const obstructs=t=>t.x>=SITE.x-1&&t.x<=SITE.x+2&&t.z>=SITE.z-1&&t.z<=SITE.z+2;
 const newState=()=>({id:SITE_ID,name:"Colina Oriental",status:"unfounded",
   site:{x:SITE.x,z:SITE.z},founderId:null,approvedBy:null,
   approvedAt:null,foundedAt:null,cargoWood:0,wood:0,food:0,
   deliveries:0,shipmentsDispatched:0,foodConsumed:0,delivery:null});
 function crop(s,c,ctx,siteClear=false){
   const options=s.forest.filter(t=>siteClear?obstructs(t):dist(t,SITE)<=4);
   const t=ctx.nearest(c,options);
   if(!t)return false;
   if(dist(c,t)>1){ctx.walk(c,t);c.goal=siteClear?"despejar solar":"talar junto al puesto";return true;}
   const index=s.forest.findIndex(a=>same(a,t));
   if(index<0)throw Error("frontier tree already removed");
   s.forest.splice(index,1);s.harvested++;s.outpost.wood++;c.harvested++;
   c.energy=Math.max(0,c.energy-2);c.goal=siteClear?"limpiar terreno":"acopiar madera";
   ctx.record(s,c,"harvest",{x:t.x,z:t.z,amount:1,settlement:SITE_ID});
   return true;
 }
 function found(s,c,ctx){
   // Blockers first, before returning to construction coordinates.
   if(crop(s,c,ctx,true))return;
   if(dist(c,SITE)>1){ctx.walk(c,SITE);c.goal="viajar a segunda comunidad";return;}
   const o=s.outpost;
   if(o.cargoWood!==SITE.cost)throw Error("missing reserved founding timber");
   o.cargoWood=0;s.spentWood+=SITE.cost;
   s.structures.push({id:SITE.id,type:SITE.type,x:SITE.x,z:SITE.z,
     builder:c.id,completedAt:s.tick});
   c.built++;c.homeId=SITE_ID;c.energy=Math.max(0,c.energy-3);
   c.goal="fundar nueva comunidad";
   o.status="established";o.foundedAt=s.tick;
   ctx.record(s,c,"build",{site:SITE.id,woodSpent:SITE.cost,kitUsed:false});
   ctx.record(s,c,"found_outpost",{settlement:SITE_ID,leader:o.approvedBy});
 }
 function localFood(s,c){
   return (s.outpost.status==="travelling"&&c.id===s.outpost.founderId)||
     (s.outpost.status==="established"&&dist(c,SITE)<=4);
 }
 function foodAvailable(s,c){return localFood(s,c)?s.outpost.food:s.food;}
 function consumeFood(s,c){
   if(localFood(s,c)){if(s.outpost.food<1)throw Error("empty frontier pantry");s.outpost.food--;s.outpost.foodConsumed++;}
   else{if(s.food<1)throw Error("empty mother pantry");s.food--;}
 }
 function beforeAction(s,c,ctx){
   const o=s.outpost;
   if(c.id===o.founderId&&o.status==="travelling"){found(s,c,ctx);return true;}
   if(c.id===o.founderId&&o.status==="established"){
     if(o.food===0&&c.hunger<48&&dist(c,{x:5,z:5})>3){
       ctx.walk(c,{x:5,z:5});c.goal="volver por suministros";return true;
     }
     if(dist(c,SITE)>2&&!(o.food===0&&c.hunger<48)){
       ctx.walk(c,SITE);c.goal="regresar al puesto";return true;
     }
     if(dist(c,SITE)<=2){
       if(o.wood<4&&crop(s,c,ctx))return true;
       c.goal="mantener el puesto";c.energy=Math.min(20,c.energy+2);return true;
     }
   }
   if(o.delivery&&o.delivery.courierId===c.id){
     if(dist(c,SITE)>2){
       ctx.walk(c,SITE);c.goal="transportar alimentos";return true;
     }
     const food=o.delivery.food;
     o.delivery=null;o.food+=food;o.deliveries++;
     c.goal="entregar alimentos";
     ctx.record(s,c,"deliver",{settlement:SITE_ID,food});
     return true;
   }
   return false;
 }
 function afterTick(s,ctx){
   const o=s.outpost;
   if(o.status==="unfounded"){
     if(s.tick<2400||s.structures.length!==3||!s.settlement.leaderId||
       s.wood<4||s.food<4||s.settlement.orders.length!==3)return;
     const founder=s.citizens.find(c=>c.role==="builder"&&c.alive);
     if(!founder)return;
     s.wood-=4;s.food-=2;o.cargoWood=4;o.food=2;
     o.founderId=founder.id;o.approvedBy=s.settlement.leaderId;
     o.approvedAt=s.tick;o.status="travelling";
     ctx.record(s,s.citizens.find(c=>c.id===o.approvedBy),"approve_outpost",
       {settlement:SITE_ID,founder:founder.id,wood:4,food:2});
   }else if(o.status==="established"&&!o.delivery&&o.food<=1&&s.food>=5){
     const courier=s.citizens.find(c=>c.role==="forager"&&c.alive&&c.homeId==="village_01");
     if(!courier)return;
     s.food-=2;o.shipmentsDispatched++;o.delivery={courierId:courier.id,food:2,startedAt:s.tick};
     ctx.record(s,courier,"dispatch",{settlement:SITE_ID,food:2});
   }
 }
 function projectV2(s){
   const o=s.outpost,est=o.status==="established";
   return {...s,schemaVersion:2,structures:s.structures.slice(0,3),
     wood:s.wood+o.cargoWood+o.wood+(est?SITE.cost:0),
     food:s.food+o.food+(o.delivery?o.delivery.food:0),
     spentWood:s.spentWood-(est?SITE.cost:0),
     citizens:s.citizens.map(c=>({...c,built:c.built-(est&&c.id===o.founderId?1:0)})),
     events:s.events.filter(e=>!["approve_outpost","found_outpost","dispatch","deliver"].includes(e.action))};
 }
 function validate(s){
   if(!s||!s.outpost||!Array.isArray(s.citizens)||!Array.isArray(s.structures))return false;
   const o=s.outpost,est=o.status==="established",travel=o.status==="travelling";
   if(o.id!==SITE_ID||o.name!=="Colina Oriental"||
     !o.site||!same(o.site,SITE)||
     !["unfounded","travelling","established"].includes(o.status)||
     !number(o.cargoWood)||o.cargoWood>4||!number(o.wood)||!number(o.food)||
     !number(o.deliveries)||!number(o.shipmentsDispatched)||
     !number(o.foodConsumed)||s.structures.length>4||
     est!==(s.structures.length===4))return false;
   if(o.status==="unfounded"&&(o.founderId!==null||o.approvedBy!==null||
     o.approvedAt!==null||o.foundedAt!==null||o.cargoWood||o.wood||
     o.food||o.delivery||o.deliveries||o.shipmentsDispatched||o.foodConsumed))return false;
   if((travel||est)&&(!s.citizens.some(c=>c.id===o.founderId)||
     !s.citizens.some(c=>c.id===o.approvedBy)||
     !number(o.approvedAt)||o.approvedAt>s.tick))return false;
   if(travel&&(o.cargoWood!==4||o.foundedAt!==null||o.delivery!==null))return false;
   if(est&&(!number(o.foundedAt)||o.foundedAt<o.approvedAt||o.foundedAt>s.tick||
     o.cargoWood!==0))return false;
   if(!(o.delivery===null||(est&&o.delivery&&o.delivery.food===2&&
     number(o.delivery.startedAt)&&o.delivery.startedAt<=s.tick&&
     s.citizens.some(c=>c.id===o.delivery.courierId&&c.id!==o.founderId))))return false;
   // Outpost logistics are a conserved, separately audited sub-ledger.
   const inflight=o.delivery?o.delivery.food:0;
   if(o.shipmentsDispatched!==o.deliveries+(o.delivery?1:0)||
      o.food+inflight+o.foodConsumed!==(o.status==="unfounded"?0:2)+
        o.shipmentsDispatched*2)return false;
   if(est){
     const house=s.structures[3];
     if(house.id!==SITE.id||house.type!==SITE.type||!same(house,SITE)||
       house.builder!==o.founderId||house.completedAt!==o.foundedAt||
       s.forest.some(obstructs))return false;
   }
   for(const c of s.citizens)
     if(!["village_01",SITE_ID].includes(c.homeId)||
       (c.homeId===SITE_ID&&(!est||c.id!==o.founderId))||
       (est&&c.id===o.founderId&&c.homeId!==SITE_ID))return false;
   if(s.wood+o.cargoWood+o.wood!==s.harvested-s.craftedWood-s.spentWood||
     s.food+o.food+(o.delivery?o.delivery.food:0)!==s.foodGathered-s.foodEaten)return false;
   for(const e of s.events.filter(e=>
     ["approve_outpost","found_outpost","dispatch","deliver"].includes(e.action)))
     if(!number(e.tick)||e.tick>s.tick||
       !s.citizens.some(c=>c.id===e.actor)||!e.details||e.details.settlement!==SITE_ID)
       return false;
   return true;
 }
 return Object.freeze({SITE,SITE_ID,newState,foodAvailable,consumeFood,
   beforeAction,afterTick,projectV2,validate});
});
