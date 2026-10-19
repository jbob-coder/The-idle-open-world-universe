/* GODSEED GOD-002: deterministic voluntary responses to the god's advice. */
(function(root,factory){
 const api=factory(typeof module!=='undefined'&&module.exports?require('../needs.js'):root.GodseedNeeds);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GodseedConsent=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Needs){
'use strict';
const MAX_HISTORY=4,MAX_REASON=150;
function clamp(n){return Number.isFinite(n)?Math.min(100,Math.max(0,Math.round(n))):0;}
function hash(seed,id,intent,tick){
 let n=(seed>>>0)^Math.imul(id>>>0,2654435761)^(tick>>>0);
 for(let i=0;i<intent.length;i++)n=Math.imul(n^intent.charCodeAt(i),16777619)>>>0;
 n=Math.imul(n^(n>>>16),2246822519)>>>0;
 return (n^(n>>>13))>>>0;
}
function actorId(p){return p&&p.name==='Nim'?0:Number(p&&p.id)||0;}
function profile(seed,p,stored){
 const identity=actorId(p),traits=p&&p.personality||{};
 const original=p&&typeof p.independence==='number'?p.independence:
  p&&p.name==='Nim'?traits.caution||0.5:p&&p.role==='Rune Scholar'?0.64:0.5;
 const innate=30+(hash(seed,identity,'faith',0)%41);
 const agency=clamp(20+original*72);
 const history=Array.isArray(stored&&stored.history)?stored.history.filter(e=>
  e&&Number.isInteger(e.tick)&&e.tick>=0&&typeof e.intent==='string'&&
  typeof e.reason==='string'&&['considering','declined'].includes(e.state)).slice(-MAX_HISTORY)
  .map(e=>({tick:e.tick,intent:e.intent.slice(0,24),state:e.state,reason:e.reason.slice(0,MAX_REASON)})):[];
 return {
  openness:stored&&typeof stored.openness==='number'&&Number.isFinite(stored.openness)?clamp(stored.openness):innate,
  agency:stored&&typeof stored.agency==='number'&&Number.isFinite(stored.agency)?clamp(stored.agency):agency,
  history
 };
}
function evaluate(s,p,m,town){
 const belief=profile(s.worldSeed,p,p.divineBelief);
 const isNim=p===s.bot,role=String(p.role||'');
 const n=!isNim&&p.needs?Needs.normalize(p.needs):null;
 const danger=(s.enemies||[]).some(e=>e&&e.targetCitizenId===p.id&&
  Math.abs(e.x-p.x)+Math.abs(e.y-p.y)<=3);
 let reason='',agree=false;
 const needsSafety=n&&(danger||n.safety<=30),needsFood=n&&n.hunger<=32,needsRest=n&&n.energy<=28;
 if(needsSafety&&!['defense','rest'].includes(m.intent))
  reason='Safety is urgent; other requests must wait.';
 else if(needsFood&&!['food','rest'].includes(m.intent))
  reason='Needs food before taking on a request.';
 else if(needsRest&&m.intent!=='rest')
  reason='Needs sleep before taking on a request.';
 else if(isNim&&s.bot.hunger<30&&!['food','rest'].includes(m.intent))
  reason='Nim needs food before considering this.';
 else if(isNim&&s.bot.energy<25&&m.intent!=='rest')
  reason='Nim needs rest before considering this.';
 else if(town&&town.stock&&town.stock.food<2&&!['food','defense','rest'].includes(m.intent))
  reason='The settlement has insufficient food to prioritize this.';
 else {
  const preferences={
   Builder:{housing:18,remodel:16},Mason:{craft:20,remodel:18},
   Farmer:{food:20},Forager:{food:18,explore:10},
   Squire:{defense:24},Apothecary:{food:15,rest:12},
   'Rune Scholar':{explore:22,craft:8}
  };
  const alignment=((preferences[role]||{})[m.intent]||0)+(isNim&&m.intent==='explore'?12:0);
  const jitter=(hash(s.worldSeed,actorId(p),m.intent,s.tick)%21)-10;
  const score=belief.openness-belief.agency*0.48+alignment+jitter;
  agree=score>=28;
  reason=agree?'Willing to consider this while keeping personal priorities.':
   'Declined; personal judgment and independence take precedence.';
 }
 return {id:isNim?'nim':String(p.id),name:p.name,role:isNim?'Wanderer':role,
  agree,state:agree?'considering':'declined',reason,belief:{openness:belief.openness,agency:belief.agency}};
}
function record(s,p,m,decision){
 const b=profile(s.worldSeed,p,p.divineBelief);
 b.history.push({tick:s.tick,intent:m.intent.slice(0,24),state:decision.state,reason:decision.reason.slice(0,MAX_REASON)});
 b.history=b.history.slice(-MAX_HISTORY);
 p.divineBelief=b;
}
return Object.freeze({profile,evaluate,record});
});
