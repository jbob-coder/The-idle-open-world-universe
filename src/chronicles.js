/* GODSEED SIM-007 — bounded individual memories with factual consequences.
 * Chronicle entries record observed world deltas, never imagined outcomes.
 * Entirely deterministic and offline; existing v1 saves remain compatible.
 */
(function(root, factory) {
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.GodseedChronicles=api;
})(typeof globalThis!=='undefined'?globalThis:this,function() {
  'use strict';
  const VERSION=1,MAX_ENTRIES=12,TARGET=5;
  const INTENTS=Object.freeze(['work','explore','help','rest','seek_safety','eat',
    'sleep','wash','warm','socialize']);
  const GOALS=Object.freeze(['master_craft','help_neighbors','map_surroundings']);
  const MORALS=Object.freeze(['duty','care','curiosity','wellbeing']);
  const IMPACT_KEYS=Object.freeze(['movement','food','wood','stone','relationship',
    'energy','hunger','safety','social','skill']);
  function obj(v){return !!v&&typeof v==='object'&&!Array.isArray(v);}
  function finite(v,min,max,fallback){
    return Number.isFinite(v)?Math.max(min,Math.min(max,Math.round(v))):fallback;
  }
  function text(v,max){return typeof v==='string'?v.slice(0,max):'';}
  function identity(p){
    if(p&&p.role==='Forager')return 'map_surroundings';
    const care=Number.isFinite(p&&p.kindness)?p.kindness:0.5;
    const duty=Number.isFinite(p&&p.diligence)?p.diligence:0.5;
    return care>duty?'help_neighbors':'master_craft';
  }
  function seedEthics(p){
    return {care:finite((p&&p.kindness)*100,0,100,50),
      duty:finite((p&&p.diligence)*100,0,100,50),
      curiosity:finite((p&&p.independence)*100,0,100,50)};
  }
  function newJournal(p){
    return {version:VERSION,goal:identity(p),progress:0,goalTarget:TARGET,
      ethics:seedEthics(p),entries:[]};
  }
  function normalizeImpact(raw){
    const out={};
    for(const key of IMPACT_KEYS)out[key]=finite(obj(raw)?raw[key]:null,-999,999,0);
    return out;
  }
  function normalizedEvent(raw){
    if(!obj(raw)||!Number.isSafeInteger(raw.tick)||raw.tick<0||
       !INTENTS.includes(raw.choice)||!MORALS.includes(raw.moral))return null;
    const impact=normalizeImpact(raw.impact);
    const observed=IMPACT_KEYS.some(k=>impact[k]!==0);
    return {tick:Math.min(raw.tick,1000000000),choice:raw.choice,
      reason:text(raw.reason,120),alternative:INTENTS.includes(raw.alternative)?
        raw.alternative:null,consequence:text(raw.consequence,140),
      moral:raw.moral,observed,
      impact};
  }
  function restore(p,raw){
    const state=newJournal(p);
    if(!obj(raw)||raw.version!==VERSION)return state;
    state.progress=finite(raw.goal===state.goal?raw.progress:0,0,TARGET,0);
    // Ethical priorities are born from personality; invalid save values cannot
    // silently rewrite traits, and no local storage value grants a divine command.
    if(Array.isArray(raw.entries))state.entries=raw.entries.slice(-MAX_ENTRIES)
      .map(normalizedEvent).filter(Boolean);
    return state;
  }
  function bias(p,options){
    if(!Array.isArray(options))return [];
    const state=obj(p&&p.journal)?p.journal:null;
    if(!state||!GOALS.includes(state.goal))return options.slice();
    const e=obj(state.ethics)?state.ethics:seedEthics(p);
    const ethical={
      work:Math.round((finite(e.duty,0,100,50)-50)/25),
      help:Math.round((finite(e.care,0,100,50)-50)/25),
      explore:Math.round((finite(e.curiosity,0,100,50)-50)/25),
      rest:0
    };
    const goalIntent={master_craft:'work',help_neighbors:'help',
      map_surroundings:'explore'}[state.goal];
    return options.map(o=>({...o,score:o.score+
      Math.max(-2,Math.min(2,ethical[o.intent]||0))+
      (o.intent===goalIntent?3:0)}));
  }
  function num(v){return Number.isFinite(v)?v:0;}
  function snapshot(p,t,partner){
    const n=obj(p&&p.needs)?p.needs:{},stock=obj(t&&t.stock)?t.stock:{};
    const rel=obj(p&&p.relationships)?p.relationships:{};
    return {x:num(p&&p.x),y:num(p&&p.y),
      food:num(stock.food),wood:num(stock.wood),stone:num(stock.stone),
      relationship:partner?num(rel[partner.name]):0,
      energy:num(n.energy),hunger:num(n.hunger),safety:num(n.safety),
      social:num(n.social),skill:num(p&&p.skill)};
  }
  function impactBetween(before,after){
    if(!obj(before)||!obj(after))return normalizeImpact(null);
    const diff={movement:Math.abs(num(after.x)-num(before.x))+
      Math.abs(num(after.y)-num(before.y))};
    for(const key of IMPACT_KEYS)if(key!=='movement')
      diff[key]=num(after[key])-num(before[key]);
    return normalizeImpact(diff);
  }
  function moralFor(choice,impact){
    if(['seek_safety','eat','sleep','wash','warm','rest'].includes(choice))
      return 'wellbeing';
    if(choice==='help')return 'care';
    if(choice==='work')return 'duty';
    return 'curiosity';
  }
  function relevantGoal(event,goal){
    const i=event.impact;
    if(goal==='master_craft')return event.choice==='work'&&
      (i.wood>0||i.stone>0||i.food>0||i.skill>0);
    if(goal==='help_neighbors')return event.choice==='help'&&i.relationship>0;
    return event.choice==='explore'&&i.movement>0;
  }
  function record(p,decision,before,after,tick){
    if(!obj(p)||!obj(p.journal)||!obj(decision)||
      !INTENTS.includes(decision.intent)||!Number.isSafeInteger(tick)||tick<0)return null;
    const state=p.journal,impact=impactBetween(before,after);
    const observed=IMPACT_KEYS.some(k=>impact[k]!==0);
    const earlier=state.entries[state.entries.length-1];
    // Record a real change immediately; an attempted/no-change decision is
    // sampled at day-phase intervals, labeled as such rather than as success.
    if(!observed&&tick%48!==0&&earlier&&earlier.choice===decision.intent)return null;
    const event={tick:Math.min(tick,1000000000),choice:decision.intent,
      reason:text(decision.why,120),
      alternative:Array.isArray(decision.alternatives)&&decision.alternatives.length&&
        INTENTS.includes(decision.alternatives[0].intent)?decision.alternatives[0].intent:null,
      consequence:text(decision.consequence,140),
      moral:moralFor(decision.intent,impact),observed,impact};
    state.entries.push(event);
    if(state.entries.length>MAX_ENTRIES)state.entries.shift();
    if(relevantGoal(event,state.goal))state.progress=Math.min(TARGET,state.progress+1);
    return JSON.parse(JSON.stringify(event));
  }
  function describeGoal(goal){
    return {master_craft:'Build a lasting craft career',
      help_neighbors:'Strengthen community bonds',
      map_surroundings:'Learn the surrounding land'}[goal]||'Find a calling';
  }
  function describeImpact(impact){
    if(!obj(impact))return 'No verified change';
    const parts=[];
    for(const k of IMPACT_KEYS){
      const n=finite(impact[k],-999,999,0);
      if(n)parts.push(k+' '+(n>0?'+':'')+n);
    }
    return parts.length?parts.join(', '):'No verified change';
  }
  return Object.freeze({VERSION,MAX_ENTRIES,GOALS,INTENTS,IMPACT_KEYS,
    newJournal,restore,bias,snapshot,impactBetween,record,describeGoal,describeImpact});
});
