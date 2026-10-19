/* GOD-006: contextual, touch-safe influence replacing direct God power buttons. */
(function(){
 'use strict';
 const G=window.GodseedGuidance,dbg=window.GodseedDebug,sim=window.GodseedSim;
 const powers=document.getElementById('powers');
 if(!G||!dbg||!sim||!powers)return;
 window.GodseedGuidanceMode=true;
 const el=(tag,txt)=>{const x=document.createElement(tag);if(txt!==undefined)x.textContent=txt;return x;};
 const css=el('style');
 css.textContent='#powers .powers-grid{display:none!important}'+
 '#divineCouncil{margin:10px 0;border:2px solid #998865;background:#172b2c;padding:12px;min-width:0}'+
 '#divineCouncil h3{font-size:13px;letter-spacing:.05em;color:#ecd59d;margin:0 0 6px}'+
 '#divineCouncil p{font-size:11px;color:#c7d3c0;margin:6px 0 9px}'+
 '#divineCouncil label{display:block;font-size:11px;color:#cad7c7;margin:7px 0 4px}'+
 '#divineCouncil select{font:12px monospace;background:#263d3b;border:1px solid #abaf8d;color:#f2e8cc;width:100%;max-width:100%;min-height:44px;padding:8px}'+
 '#divineCouncil .guidanceFacts{display:grid;grid-template-columns:minmax(85px,34%) minmax(0,1fr);gap:5px 8px;font-size:11px;margin:9px 0;overflow-wrap:anywhere}'+
 '#divineCouncil .guidanceFacts dt{color:#a0c8b7}#divineCouncil .guidanceFacts dd{margin:0}'+
 '#divineCouncil button{width:100%;min-height:44px;background:#475940;border:2px solid #b7aa7c;color:#fff4d2}'+
 '#divineCouncil button:disabled{opacity:.55;cursor:not-allowed}'+
 '#guidanceFeedback{white-space:pre-wrap;overflow-wrap:anywhere}'+
 '#androidDock [data-power]:not([data-power="inspect"]){display:none!important}'+
 '@media(orientation:landscape) and (max-height:650px){#androidDock .dockrow{grid-template-columns:repeat(5,minmax(0,1fr))!important}}';
 document.head.appendChild(css);
 const original=powers.querySelector('.powers-grid');
 if(original){original.hidden=true;original.setAttribute('aria-hidden','true');
  original.querySelectorAll('button').forEach(b=>{b.disabled=true;b.tabIndex=-1;});}
 const originalNote=powers.querySelector('.tiny.muted');
 if(originalNote)originalNote.textContent='Observer mode · no instant healing, item grants, storms or orders. Your influence is a suggestion.';
 const instruction=document.getElementById('instruction');
 if(instruction)instruction.textContent='Tap to observe. Select a cause below and review risks before sending.';
 const canvas=document.getElementById('world');
 if(canvas)canvas.setAttribute('aria-label','Pixel world; tap to inspect a life or settlement; no direct powers');
 const whispers=document.querySelector('#godWhisper .whisper-note');
 if(whispers)whispers.textContent+=' Free-text whispers cost 0 faith but affect the world and require 12 ticks between messages; they may be refused.';
 const dock=document.getElementById('androidDock');
 if(dock){
  dock.setAttribute('aria-label','Observer and time controls');
  const caption=dock.querySelector('.docktop span');
  if(caption)caption.textContent='OBSERVE → CONSIDER → GUIDE';
  const row=dock.querySelector('.dockrow');
  if(row){
   row.querySelectorAll('button[data-power]').forEach(b=>{
    if(b.dataset.power!=='inspect'){b.disabled=true;b.hidden=true;b.tabIndex=-1;}
   });
   const guide=el('button','✧ Influence');guide.id='guidanceDock';guide.type='button';
   guide.addEventListener('click',()=>{document.getElementById('divineCouncil').scrollIntoView({block:'center'});document.getElementById('guidanceAction').focus({preventScroll:true});});
   const inspect=row.querySelector('[data-power="inspect"]');
   row.insertBefore(guide,inspect?inspect.nextSibling:row.firstChild);
  }
 }
 const box=el('section');box.id='divineCouncil';box.setAttribute('aria-label','Indirect divine guidance');
 box.appendChild(el('h3','DIVINE COUNCIL · CONSEQUENCES BEFORE INFLUENCE'));
 box.appendChild(el('p','Residents have beliefs, hunger and independent priorities. A suggestion can be declined; sending is never an order.'));
 const targetLabel=el('label','Observe a scope');targetLabel.htmlFor='guidanceScope';box.appendChild(targetLabel);
 const scope=el('select');scope.id='guidanceScope';box.appendChild(scope);
 const actionLabel=el('label','Consider a cause');actionLabel.htmlFor='guidanceAction';box.appendChild(actionLabel);
 const action=el('select');action.id='guidanceAction';
 for(const choice of G.GUIDANCE){const opt=el('option',choice.label);opt.value=choice.id;action.appendChild(opt);}
 box.appendChild(action);
 const facts=el('dl');facts.className='guidanceFacts';facts.id='guidanceFacts';box.appendChild(facts);
 const btn=el('button','Offer this guidance');btn.id='guidanceSubmit';btn.type='button';box.appendChild(btn);
 const feedback=el('p','Choose a cause to see its cost, scope and possible outcomes.');
 feedback.id='guidanceFeedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');box.appendChild(feedback);
 const anchor=document.getElementById('godObservatory')||document.getElementById('inspect');
 anchor.insertAdjacentElement('beforebegin',box);
 const state=()=>dbg.getState(),safe=s=>String(s===undefined||s===null?'—':s);
 let knownTargets='',lastTick=null,lastFaith=null,lastSelection='';
 function render(force){
  const s=state();if(!s)return;
  const items=G.targets(s);
  const sig=items.map(x=>x.key+':'+x.name).join('|');
  if(sig!==knownTargets){
   const old=scope.value||'world';scope.replaceChildren();
   for(const item of items){const opt=el('option',item.name+(item.kind==='person'?' · inspect only':''));opt.value=item.key;scope.appendChild(opt);}
   scope.value=items.some(x=>x.key===old)?old:'world';knownTargets=sig;
  }
  if(!force&&lastTick===s.tick&&lastFaith===s.faith&&lastSelection===scope.value+'|'+action.value)return;
  lastTick=s.tick;lastFaith=s.faith;lastSelection=scope.value+'|'+action.value;
  const quote=G.preview(s,action.value,scope.value);facts.replaceChildren();
  const rows=[['Scope',quote.scope?quote.scope.name:'Unknown'],
   ['Faith cost',quote.cost+' faith (only if heard)'],
   ['Agency',quote.agency],['Possible benefit',quote.benefit],['Risk / side effect',quote.risk],
   ['Timing',quote.sideEffect||'No cost or effects if refused before delivery'],
   ['Current status',quote.ok?'May be offered; not guaranteed':quote.reason]];
  for(const [name,value] of rows){facts.appendChild(el('dt',name));facts.appendChild(el('dd',safe(value)));}
  btn.disabled=!quote.ok;
 }
 scope.addEventListener('change',()=>render(true));
 action.addEventListener('change',()=>render(true));
 const observer=document.getElementById('observerTarget');
 if(observer)observer.addEventListener('change',()=>{if(G.targets(state()).some(x=>x.key===observer.value)){scope.value=observer.value;render(true);}});
 btn.addEventListener('click',()=>{
  const result=G.offer(state(),action.value,scope.value,sim.whisper);
  if(!result.ok){feedback.textContent=result.reason;render(true);return;}
  const entry=result.entry;
  const accepted=entry&&Array.isArray(entry.decisions)?entry.decisions.filter(x=>x.agree).map(x=>x.name):[];
  const declined=entry&&Array.isArray(entry.decisions)?entry.decisions.filter(x=>!x.agree).map(x=>x.name):[];
  feedback.textContent='Heard · -'+result.cost+' faith. Considering: '+(accepted.join(', ')||'none')+
    '. Declined: '+(declined.join(', ')||'none')+'. No resident was moved or awarded resources.';
  dbg.step(0);
  document.getElementById('save').click();
  render(true);
 });
 render(true);
 const interval=setInterval(()=>{if(!document.hidden)render(false);},1300);
 window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});
 window.GodseedGuidanceUI={render:()=>render(true),getSelection:()=>({scope:scope.value,action:action.value}),select:(kind,key)=>{if(kind==='scope'&&G.targets(state()).some(x=>x.key===key))scope.value=key;else if(kind==='action'&&G.GUIDANCE.some(x=>x.id===key))action.value=key;else return false;render(true);return true;}};
})();
