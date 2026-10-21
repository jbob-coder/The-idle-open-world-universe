/* GODSEED V3: reusable, deterministic bounded decision engine for living NPCs.
 * NPCs select among legal opportunities; no chapter flags, quests or fixed
 * action timelines. This is simulated agency, not metaphysical free will. */
(function(root,factory){"use strict";const api=factory();
 if(typeof module!=="undefined"&&module.exports)module.exports=api;
 if(root)root.GodseedV3Agency=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";
 const ACTIONS=Object.freeze(["eat","rest","forage","gather_wood","build_home",
   "build_road","explore","reflect"]);
 const EVENTS=new Set(["settler_build","settler_build_road","settler_forage",
   "settler_harvest","settler_eat","settler_arrive","settler_death","settler_explore",
   "expedition_arrive","discover","build_camp","eat","forage","harvest","death",
   "meet","settler_meet"]);
 const MAX_MEMORIES=16;
 const positive=n=>Number.isSafeInteger(n)&&n>=0;
 const clamp=n=>Math.max(0,Math.min(100,n));
 function hash(id,x,z){
   let v=2166136261>>>0;
   for(const ch of String(id))v=Math.imul(v^ch.charCodeAt(0),16777619)>>>0;
   v=Math.imul(v^(x|0),2246822519)>>>0;
   return Math.imul(v^(z|0),3266489917)>>>0;
 }
 function create(id,x,z){
   const seed=hash(id,x,z);
   return {preferences:{curiosity:25+(seed%65),craftsmanship:25+((seed>>>8)%65),
       security:25+((seed>>>16)%65)},
     memories:[],lastChoice:null,choices:0,explorations:0,curiosityUrge:70};
 }
 function decide(mind,ctx){
   const p=mind.preferences,options=[];
   const add=(action,utility,reason,legal=true)=>{
     if(legal)options.push({action,utility:Math.round(utility),reason});
   };
   const hunger=clamp(ctx.hunger),energy=Math.max(0,Math.min(20,ctx.energy)),
     food=ctx.food,wood=ctx.wood,house=!!ctx.hasHome,road=!!ctx.roadPending;
   add("eat",220+(62-hunger), "hunger",hunger<=62&&food>0);
   add("rest",200+(4-energy)*10,"exhaustion",energy<4);
   // Saving a meal and keeping emergency reserves have independent utility.
   add("forage",food<3?160+(3-food)*6:62+(70-hunger),
     "food_security",food<3||hunger<70);
   add("build_home",88+p.security*.65,"shelter",!house&&wood>=(ctx.homeProject?1:4));
   add("gather_wood",81+p.craftsmanship*.55,"building_materials",
     (!house&&wood<(ctx.homeProject?1:4))||(house&&road&&wood<1));
   add("build_road",70+p.craftsmanship*.55,"connect_homes",house&&road&&wood>=1);
   add("explore",21+p.curiosity*.76+mind.curiosityUrge*.45,"discover",
     energy>=9&&hunger>=68&&food>=3);
   add("reflect",25+p.security/5,"wellbeing",energy>=5);
   // Priorities above are scores evaluated only on feasible actions, never
   // instructions of what must happen on a particular world tick.
   options.sort((a,b)=>b.utility-a.utility||ACTIONS.indexOf(a.action)-ACTIONS.indexOf(b.action));
   return {action:options[0]?.action||"reflect",
     reason:options[0]?.reason||"no_viable_work",
     utility:options[0]?.utility||0,
     alternatives:options.slice(1,4).map(o=>({action:o.action,utility:o.utility}))};
 }
 function commitChoice(mind,action){
   if(!ACTIONS.includes(action))throw RangeError("invalid NPC decision");
   mind.lastChoice=action;mind.choices++;
   // Curiosity gradually returns during ordinary work. Exploring satisfies it;
   // the individual can change priorities later instead of repeating a script.
   mind.curiosityUrge=clamp(mind.curiosityUrge+(action==="explore"?-18:2));
 }
 function remember(mind,tick,action,details){
   if(!EVENTS.has(action))return;
   const previous=mind.memories[mind.memories.length-1];
   if(previous&&previous.action===action&&tick-previous.tick<20)return;
   mind.memories.push({tick,action});
   if(mind.memories.length>MAX_MEMORIES){
     // Never let routine foraging erase the founding of a home or first arrival.
     const pinned=new Set(["settler_arrive","settler_build","settler_death"]);
     const index=mind.memories.findIndex(m=>!pinned.has(m.action));
     mind.memories.splice(index<0?0:index,1);
   }
   if(action==="settler_explore")mind.explorations++;
 }
 function validate(mind,tick){
   if(!mind||typeof mind!=="object"||Array.isArray(mind)||
      !mind.preferences||!Array.isArray(mind.memories)||
      mind.memories.length>MAX_MEMORIES||!positive(mind.choices)||
      mind.choices>tick||!positive(mind.explorations)||
      mind.explorations>mind.choices||!positive(mind.curiosityUrge)||
      mind.curiosityUrge>100||
      !(mind.lastChoice===null||ACTIONS.includes(mind.lastChoice)))return false;
   for(const k of ["curiosity","craftsmanship","security"]){
     const v=mind.preferences[k];if(!positive(v)||v<25||v>89)return false;
   }
   let prev=-1;
   for(const m of mind.memories){
     if(!m||!positive(m.tick)||m.tick>tick||m.tick<prev||!EVENTS.has(m.action))return false;
     prev=m.tick;
   }
   return true;
 }
 return Object.freeze({ACTIONS,create,decide,commitChoice,remember,validate,MAX_MEMORIES});
});