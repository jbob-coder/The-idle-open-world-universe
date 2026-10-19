/* GODSEED GOD-003 — verifiable, bounded divine-suggestion lifecycle.
 * Human-like agency remains in GOD-002 consent / SIM-002 choices. This module
 * only observes genuine subsequent actions, never performs them.
 */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GodseedGuidanceLifecycle=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
 "use strict";
 const LIMIT=12,MAX_PEOPLE=8,MAX_EVENTS=8,DEADLINE=480;
 const INTENTS=new Set(['housing','food','defense','craft','trade','explore','rest','remodel']);
 const PHASES=new Set(['declined','considered','acted','result']);
 const TYPES=new Set(['heard','considered','declined','action','result']);
 function integer(v,fallback=0){return Number.isSafeInteger(v)&&v>=0?Math.min(v,1000000000):fallback;}
 function text(v,max=140){return typeof v==='string'?v.slice(0,max):'';}
 function name(v){return text(v,48);}
 function actorId(p){return p&&p.name==='Nim'?'nim':String(p&&p.id);}
 function marker(type,tick,summary,proof){
  return {type,tick:integer(tick),summary:text(summary),
   proof:text(proof||'',150)};
 }
 function initial(s,entry,actors){
  const people=(entry.people||[]).slice(0,MAX_PEOPLE).map(d=>{
   const actor=actors.find(p=>String(d.id)===actorId(p));
   const status=d.agree?'considered':'declined';
   return {id:text(d.id,24),name:name(d.name),intent:entry.intent,
    status,accepted:!!d.agree,
    events:[
     marker('heard',s.tick,'Heard an optional suggestion'),
     marker(status==='considered'?'considered':'declined',s.tick,
      text(d.reason,140)||'Made a personal decision')
    ],result:null,
    origin:actor&&Number.isInteger(actor.x)&&Number.isInteger(actor.y)?
     {x:actor.x,y:actor.y}:null,
    distance:0
   };
  });
  return {version:1,until:integer(s.tick+DEADLINE),people};
 }
 function attach(s,entry,actors){
  if(!s||!entry||!INTENTS.has(entry.intent))return null;
  entry.lifecycle=initial(s,entry,actors||[]);
  return entry.lifecycle;
 }
 function add(rec,event){
  if(rec.events.length>=MAX_EVENTS)rec.events.shift();
  rec.events.push(event);
 }
 function validAction(intent,activity){
  if(!activity||typeof activity!=='object')return false;
  switch(intent){
   case 'food':return activity.kind==='produce'&&activity.resource==='food'&&activity.amount>0;
   case 'housing':return activity.kind==='build'&&activity.buildingType==='house';
   case 'craft':return activity.kind==='produce'&&['wood','stone'].includes(activity.resource)&&activity.amount>0;
   case 'trade':return activity.kind==='trade'&&activity.amount>0;
   case 'explore':return activity.kind==='explore'&&activity.distance>0;
   case 'rest':return activity.kind==='recover'&&activity.resource==='energy'&&activity.amount>0;
   case 'defense':return activity.kind==='protect'&&activity.amount>0;
   case 'remodel':return activity.kind==='remodel'&&activity.amount>0;
   default:return false;
  }
 }
 function observe(s,person,activity){
  if(!s||!s.living||!person||!activity)return 0;
  let changed=0,id=actorId(person);
  for(const w of (s.living.whispers||[]).slice(-LIMIT)){
   if(!w.lifecycle||!INTENTS.has(w.intent)||w.tick>=s.tick||s.tick>w.lifecycle.until)continue;
   const rec=w.lifecycle.people.find(p=>p.id===id&&p.accepted&&p.status==='considered');
   if(!rec||!validAction(w.intent,activity))continue;
   const detail=text(activity.detail||'',130);
   // Evidence is the actual action and measured delta, not the original request.
   const proof=activity.kind+(activity.resource?':'+activity.resource:'')+
    (activity.amount!==undefined?' delta='+Math.round(activity.amount):'');
   rec.status='acted';add(rec,marker('action',s.tick,detail||'Observed action',proof));
   // An observed measurable action is a factual outcome, not proof the
   // divine whisper caused it. The optional advice had no direct commands.
   rec.status='result';rec.result={status:'observed',tick:integer(s.tick),
    summary:text(detail||'An action took place'),
    proof:text(proof)};
   add(rec,marker('result',s.tick,'Observed independently; causation not assumed',proof));
   changed++;
  }
  return changed;
 }
 function expire(s){
  if(!s||!s.living)return 0;let changed=0;
  for(const w of (s.living.whispers||[]).slice(-LIMIT)){
   if(!w.lifecycle||s.tick<=w.lifecycle.until)continue;
   for(const rec of w.lifecycle.people){
    if(rec.status!=='considered'&&rec.status!=='acted')continue;
    rec.status='result';rec.result={
     status:'unobserved',tick:integer(s.tick),
     summary:'No matching completed action was observed within the window',
     proof:'No measurable outcome'
    };
    add(rec,marker('result',s.tick,rec.result.summary,rec.result.proof));changed++;
   }
  }
  return changed;
 }
 function cleanMarker(e,now){
  if(!e||!TYPES.has(e.type)||!Number.isSafeInteger(e.tick)||e.tick<0||e.tick>now)return null;
  return marker(e.type,e.tick,e.summary,e.proof);
 }
 function cleanRecord(p,intent,now){
  if(!p||!PHASES.has(p.status)||typeof p.id!=='string'||p.id.length>24||
    typeof p.name!=='string'||p.name.length>48||!INTENTS.has(intent))return null;
  const events=Array.isArray(p.events)?p.events.slice(-MAX_EVENTS)
   .map(e=>cleanMarker(e,now)).filter(Boolean):[];
  // Tampered saves cannot claim factual proof without an action event.
  const performed=events.some(e=>e.type==='action');
  const result=p.result&&typeof p.result==='object'&&
   ['observed','unobserved'].includes(p.result.status)&&
   Number.isSafeInteger(p.result.tick)&&p.result.tick>=0&&p.result.tick<=now?
   {status:p.result.status,tick:p.result.tick,summary:text(p.result.summary),
    proof:text(p.result.proof,150)}:null;
  if(p.status==='result'&&(!result||
    (result.status==='observed'&&!performed)))return null;
  if(p.status==='acted'&&!performed)return null;
  const origin=p.origin&&Number.isSafeInteger(p.origin.x)&&Number.isSafeInteger(p.origin.y)&&
   Math.abs(p.origin.x)<=1000000&&Math.abs(p.origin.y)<=1000000?
   {x:p.origin.x,y:p.origin.y}:null;
  return {id:text(p.id,24),name:name(p.name),intent,status:p.status,accepted:p.accepted===true,
   events,result,origin,distance:integer(p.distance)};
 }
 function restore(s){
  if(!s||!s.living)return;
  const now=integer(s.tick);
  for(const w of (s.living.whispers||[]).slice(-LIMIT)){
   const l=w&&w.lifecycle;
   if(!l||l.version!==1||!INTENTS.has(w.intent)||!Number.isSafeInteger(l.until)||
     l.until<integer(w.tick)||l.until>integer(w.tick)+DEADLINE||
     !Array.isArray(l.people)){if(w)delete w.lifecycle;continue;}
   const people=l.people.slice(0,MAX_PEOPLE).map(p=>cleanRecord(p,w.intent,now)).filter(Boolean);
   w.lifecycle={version:1,until:l.until,people};
  }
 }
 function summary(entry){
  if(!entry||!entry.lifecycle)return [];
  return entry.lifecycle.people.map(p=>({
   name:p.name,status:p.status,accepted:p.accepted,
   result:p.result?{...p.result}:null,
   latest:p.events.length?{...p.events[p.events.length-1]}:null
  }));
 }
 return Object.freeze({LIMIT,MAX_PEOPLE,MAX_EVENTS,DEADLINE,attach,observe,expire,restore,summary});
});
