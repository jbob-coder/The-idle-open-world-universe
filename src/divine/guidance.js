/* GOD-006: finite, auditable divine influence. Never steers characters directly. */
(function(root,factory){
 'use strict';
 const intent=typeof module!=='undefined'&&module.exports?require('./intent.js'):root.GodseedIntent;
 const api=factory(intent);
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(root)root.GodseedGuidance=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Intent){
 'use strict';
 if(!Intent||typeof Intent.interpret!=='function')throw new Error('GOD-001 intent parser required');
 const GUIDANCE=Object.freeze([
  {id:'food',label:'Encourage harvest',intent:'food',cost:2,message:'Grow food',
   benefit:'Residents may prioritize cultivation when they can.',risk:'Farm labor competes with repairs and defense.'},
  {id:'housing',label:'Suggest shelter',intent:'housing',cost:3,message:'Build housing',
   benefit:'Councils may weigh new homes against scarce supplies.',risk:'Wood, stone and workers may be diverted.'},
  {id:'defense',label:'Warn of danger',intent:'defense',cost:3,message:'Protect residents',
   benefit:'The town may consider defenses and patrols.',risk:'Guards may have less time for food production.'},
  {id:'craft',label:'Encourage craftsmanship',intent:'craft',cost:3,message:'Develop crafts',
   benefit:'Artisans may consider tools and workshops.',risk:'Production may use material reserves.'},
  {id:'trade',label:'Propose trade',intent:'trade',cost:2,message:'Develop trade',
   benefit:'Residents may assess markets and neighboring villages.',risk:'Travel and trade may expose scarce supplies.'},
  {id:'remodel',label:'Suggest renovation',intent:'remodel',cost:4,message:'Renovate rooftops',
   benefit:'Residents may schedule a visual home redesign.',risk:'Renovation can be delayed by unmet survival needs.'},
  {id:'explore',label:'Invite exploration',intent:'explore',cost:2,message:'Explore',
   benefit:'Nim may consider the unknown on their own schedule.',risk:'Travel may expose a person to hunger or enemies.'},
  {id:'rest',label:'Counsel rest',intent:'rest',cost:1,message:'Rest',
   benefit:'Nim may consider resting when personal priorities permit.',risk:'Rest may delay travel and other ambitions.'}
 ].map(x=>Object.freeze(x)));
 const byId=new Map(GUIDANCE.map(x=>[x.id,x]));
 function targets(s){
  const out=[{key:'world',kind:'world',name:'Whole world'}];
  for(const t of s&&s.living&&Array.isArray(s.living.towns)?s.living.towns:[]){
   if((t.id==='briarford'||t.id==='emberwick')&&typeof t.name==='string')
    out.push({key:'town:'+t.id,kind:'town',id:t.id,name:t.name.slice(0,80)});
  }
  for(const c of s&&s.living&&Array.isArray(s.living.citizens)?s.living.citizens:[])
   out.push({key:'person:citizen:'+String(c.id),kind:'person',id:c.id,name:String(c.name).slice(0,70)});
  if(s&&s.bot)out.push({key:'person:nim',kind:'person',id:'nim',name:'Nim'});
  return out.slice(0,16);
 }
 function denied(action,scope,why){
  return {ok:false,action:action||null,scope:scope||null,reason:why,
   cost:action?action.cost:0,agency:'People may decline; no direct character commands.',
   risk:action?action.risk:'No effects.',benefit:action?action.benefit:'No effect.'};
 }
 function preview(s,id,targetKey){
  const action=byId.get(id),key=typeof targetKey==='string'?targetKey:'world';
  const scope=targets(s).find(x=>x.key===key);
  if(!action)return denied(null,scope,'Unsupported guidance; no effect');
  if(!scope)return denied(action,null,'Unknown or unavailable observer target');
  if(!s||!s.living||!Array.isArray(s.living.whispers))return denied(action,scope,'No living society to hear guidance');
  if(scope.kind==='person')return denied(action,scope,
   'Individual consent is not connected in this observer branch; inspect this person or choose a settlement.');
  if(scope.kind==='town'&&(id==='explore'||id==='rest'))return denied(action,scope,
   'This guidance is personal; use the whole-world context for Nim.');
  if(!Number.isFinite(s.faith)||s.faith<action.cost)return denied(action,scope,
   'Need '+action.cost+' faith; only '+String(s.faith)+' available');
  const last=s.living.whispers[s.living.whispers.length-1];
  if(last&&Number.isFinite(last.tick)&&s.tick-last.tick<12)return denied(action,scope,
   'The last whisper is still being considered; wait '+(12-(s.tick-last.tick))+' ticks.');
  const message=action.message+(scope.kind==='town'?' '+scope.name:'');
  const parsed=Intent.interpret(message);
  if(parsed.status!=='recognized'||parsed.intent!==action.intent||
     (scope.kind==='town'&&(!parsed.target||parsed.target.kind!=='town'||parsed.target.id!==scope.id))||
     (scope.kind==='world'&&parsed.target)){
   return denied(action,scope,'Unrecognized or ambiguous target; no guidance sent');
  }
  return {ok:true,action,scope,cost:action.cost,message,reason:'',
   benefit:action.benefit,risk:action.risk,
   agency:'Residents may consider or decline based on independence and needs. Nothing is built, healed, granted or completed by pressing Send.',
   sideEffect:'Costs '+action.cost+' faith only after the society hears the message; 12-tick cooldown. There is no automatic simulation tick.'};
 }
 function offer(s,id,targetKey,whisper){
  const proposed=preview(s,id,targetKey);
  if(!proposed.ok)return {ok:false,reason:proposed.reason,quote:proposed};
  if(typeof whisper!=='function')return {ok:false,reason:'No simulation whisper adapter',quote:proposed};
  let result;
  try{result=whisper(s,proposed.message);}
  catch(e){return {ok:false,reason:'The world could not hear this whisper',quote:proposed};}
  if(!result||!result.ok)return {ok:false,reason:result&&result.reason||'The world did not accept the message',quote:proposed};
  // Only the divine budget is spent here. Living simulation owns all autonomy/decisions.
  s.faith-=proposed.cost;
  return {ok:true,quote:proposed,entry:result.entry||null,cost:proposed.cost,
   outcome:'heard',reason:'Message heard; each resident remains free to consider or decline.'};
 }
 return Object.freeze({GUIDANCE,targets,preview,offer});
});
