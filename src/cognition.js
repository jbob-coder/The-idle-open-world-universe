/* GODSEED SIM-011 — bounded, offline, deterministic individual cognition.
 * Separate from needs, occupational skill, personality, and action success.
 * Intelligence changes planning/learning; it never directly manufactures output.
 */
(function(root,factory){
 'use strict';
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.GodseedCognition=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION=1,MAX_HISTORY=4,MAX_HORIZON=4;
 const STATS=Object.freeze(['intelligence','focus','creativity','empathy','patience']);
 const DOMAINS=Object.freeze(['craft','land','community','survival']);
 const STYLES=Object.freeze(['practice','observation','reflection']);
 const INTENTS=Object.freeze(['work','explore','help','rest','seek_safety','eat','sleep','wash','warm','socialize']);
 const DOMAIN_FOR=Object.freeze({work:'craft',explore:'land',help:'community',rest:'survival',
   seek_safety:'survival',eat:'survival',sleep:'survival',wash:'survival',warm:'survival',socialize:'community'});
 function object(v){return !!v&&typeof v==='object'&&!Array.isArray(v);}
 function bound(v,min,max,fallback){return Number.isFinite(v)?Math.min(max,Math.max(min,Math.round(v))):fallback;}
 function hash(seed,id,salt){
  let n=(seed>>>0)^(Math.imul((id>>>0)+37,2654435761)>>>0)^(Math.imul(salt+11,2246822519)>>>0);
  n=Math.imul(n^(n>>>16),2246822519)>>>0;
  n=Math.imul(n^(n>>>13),3266489917)>>>0;
  return (n^(n>>>16))>>>0;
 }
 function initial(seed,p){
  const id=Number.isSafeInteger(p&&p.id)?p.id:0;
  const stats={};
  for(let i=0;i<STATS.length;i++)stats[STATS[i]]=25+(hash(seed,id,i)%66);
  const knowledge={},practice={};
  for(let i=0;i<DOMAINS.length;i++){
   knowledge[DOMAINS[i]]=4+(hash(seed,id,10+i)%13);
   practice[DOMAINS[i]]=0;
  }
  return {version:VERSION,stats,learningStyle:STYLES[hash(seed,id,50)%STYLES.length],
   knowledge,practice,goal:'',lastPlan:null,history:[]};
 }
 function cleanPlan(raw){
  if(!object(raw)||!INTENTS.includes(raw.goal))return null;
  const rawOptions=Array.isArray(raw.considered)?raw.considered:[];
  const considered=rawOptions.slice(0,3).filter(v=>object(v)&&INTENTS.includes(v.intent))
   .map(v=>({intent:v.intent,score:bound(v.score,-1000,1000,0)}));
  return {goal:raw.goal,horizon:bound(raw.horizon,1,MAX_HORIZON,1),
   confidence:bound(raw.confidence,0,100,0),considered};
 }
 function cleanEvent(v){
  if(!object(v)||!INTENTS.includes(v.action)||!Number.isSafeInteger(v.tick)||v.tick<0)return null;
  const domain=DOMAIN_FOR[v.action];
  if(v.domain!==domain||typeof v.result!=='string')return null;
  const result=v.result.slice(0,32);
  if(!['produced','surveyed','supported','recovered'].includes(result))return null;
  return {tick:Math.min(v.tick,1000000000),action:v.action,domain,result,
   learned:bound(v.learned,0,8,0)};
 }
 // No trusting serialized stats with unexpected shape, unbounded values or arbitrary keys.
 function profile(seed,p,stored){
  const base=initial(seed,p);
  if(!object(stored)||stored.version!==VERSION)return base;
  const stats=object(stored.stats)?stored.stats:{};
  const knowledge=object(stored.knowledge)?stored.knowledge:{};
  const practice=object(stored.practice)?stored.practice:{};
  for(const k of STATS)base.stats[k]=bound(stats[k],0,100,base.stats[k]);
  for(const k of DOMAINS){
   base.knowledge[k]=bound(knowledge[k],0,100,base.knowledge[k]);
   base.practice[k]=bound(practice[k],0,100,0);
  }
  if(STYLES.includes(stored.learningStyle))base.learningStyle=stored.learningStyle;
  if(INTENTS.includes(stored.goal))base.goal=stored.goal;
  base.lastPlan=cleanPlan(stored.lastPlan);
  if(Array.isArray(stored.history))
   base.history=stored.history.slice(-MAX_HISTORY).map(cleanEvent).filter(Boolean);
  return base;
 }
 function horizon(p){
  const s=object(p&&p.cognition)&&object(p.cognition.stats)?p.cognition.stats:{};
  return bound(1+Math.floor((bound(s.intelligence,0,100,50)+bound(s.focus,0,100,50))/65),1,MAX_HORIZON,2);
 }
 function score(person,options,context){
  const brain=object(person&&person.cognition)?person.cognition:null;
  if(!brain||!object(brain.stats))return options.slice();
  const a=brain.stats,k=object(brain.knowledge)?brain.knowledge:{};
  const tweaks={
   work:Math.round((bound(a.focus,0,100,50)-50)/17)+Math.round((bound(k.craft,0,100,10)-10)/30),
   explore:Math.round((bound(a.creativity,0,100,50)-50)/15)+Math.round((bound(a.intelligence,0,100,50)-50)/25),
   help:Math.round((bound(a.empathy,0,100,50)-50)/16)+Math.round((bound(k.community,0,100,10)-10)/30),
   rest:Math.round((bound(a.patience,0,100,50)-50)/19)
  };
  // Small weights preserve survival and work windows and avoid "smart always wins".
  return options.map(o=>({intent:o.intent,why:o.why,
   score:o.score+bound(tweaks[o.intent]||0,-7,7,0)}));
 }
 function plan(person,options,chosen){
  const ranked=options.slice().sort((a,b)=>b.score-a.score||a.intent.localeCompare(b.intent));
  const runner=ranked.find(o=>o.intent!==chosen.intent);
  const gap=runner?Math.max(0,chosen.score-runner.score):0;
  const survival=chosen.score>=999;
  return {goal:chosen.intent,horizon:horizon(person),
   confidence:survival?100:bound(45+gap,0,100,50),
   considered:ranked.filter(o=>o.intent!==chosen.intent).slice(0,3)
    .map(o=>({intent:o.intent,score:Math.round(o.score)}))};
 }
 function rememberPlan(person,raw){
  if(!object(person)||!object(person.cognition))return;
  const valid=cleanPlan(raw);
  if(!valid)return;
  person.cognition.lastPlan=valid;
  person.cognition.goal=valid.goal;
 }
 function observe(person,raw){
  if(!object(person)||!object(person.cognition)||!object(raw)||
     !INTENTS.includes(raw.action)||!Number.isSafeInteger(raw.tick)||raw.tick<0)return null;
  const allowed={work:'produced',explore:'surveyed',help:'supported',rest:'recovered',
   seek_safety:'recovered',eat:'recovered',sleep:'recovered',wash:'recovered',
   warm:'recovered',socialize:'recovered'};
  if(allowed[raw.action]!==raw.result)return null; // no learning for merely intending/traveling
  const c=person.cognition,domain=DOMAIN_FOR[raw.action];
  const score=bound(c.stats&&c.stats.intelligence,0,100,50);
  const styleBonus=(c.learningStyle==='practice'&&raw.action==='work')||
    (c.learningStyle==='observation'&&raw.action==='explore')||
    (c.learningStyle==='reflection'&&raw.action==='help')?1:0;
  const learned=bound(1+Math.floor(score/45)+styleBonus,1,5,1);
  c.knowledge[domain]=bound((c.knowledge[domain]||0)+learned,0,100,0);
  // Occupational skill remains owned by existing Living.work; no double-resource award.
  c.practice[domain]=bound((c.practice[domain]||0)+1,0,100,0);
  const entry={tick:Math.min(raw.tick,1000000000),action:raw.action,
   domain,result:raw.result,learned};
  if(!Array.isArray(c.history))c.history=[];
  c.history.push(entry);c.history=c.history.slice(-MAX_HISTORY);
  return {...entry};
 }
 return Object.freeze({VERSION,MAX_HISTORY,STATS,DOMAINS,STYLES,
  profile,score,plan,cleanPlan,rememberPlan,observe,horizon});
});
