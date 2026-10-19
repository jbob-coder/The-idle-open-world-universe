/* GODSEED offline God Whisper intent grammar. Bounded, auditable, no remote AI. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GodseedIntent=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const INTENTS=[
 {intent:'remodel',label:'consider redesigning homes',words:/\b(?:renovat\w*|redesign\w*|rebuild\w*|remodel\w*|rooftops?|roofs?|renovar\w*|redisen\w*|remodelar\w*|tejados?|techos?|apariencia)\b/},
 {intent:'housing',label:'build homes',words:/\b(?:houses?|housing|homes?|shelters?|casas?|viviendas?|edificios?|refugios?)\b/},
 {intent:'food',label:'grow food',words:/\b(?:farms?|farming|crops?|food|harvest\w*|grain|grow|cultiv\w*|granjas?|comida|agricultur\w*|alimentos?|cosech\w*|sembr\w*)\b/},
 {intent:'defense',label:'protect residents',words:/\b(?:defend\w*|protect\w*|guards?|wolves?|walls?|defender\w*|protege\w*|lobos?|vigil\w*|murallas?|seguridad)\b/},
 {intent:'craft',label:'develop crafts',words:/\b(?:craft\w*|tools?|workshops?|smith\w*|invent\w*|forges?|herramient\w*|taller(?:es)?|forja\w*|investig\w*)\b/},
 {intent:'trade',label:'develop trade',words:/\b(?:trad(?:e|ing)|markets?|commerce|exchang\w*|mercados?|comercio|intercambi\w*)\b/},
 {intent:'explore',label:'explore freely',words:/\b(?:explor\w*|travel\w*|discover\w*|journey\w*|wander\w*|viajar\w*|descubri\w*|aventura\w*)\b/},
 {intent:'rest',label:'rest',words:/\b(?:rest\w*|sleep\w*|recover\w*|descans\w*|dormi\w*|repos\w*|curar\w*)\b/}
];
const TARGETS=[
 {kind:'town',id:'briarford',name:'Briarford'},
 {kind:'town',id:'emberwick',name:'Emberwick'},
 ...['Nim','Ira','Toren','Mera','Elin','Rowan','Sera','Bram'].map(name=>({kind:'person',id:name.toLowerCase(),name}))
];
const NEGATION=/\b(?:don'?t|doesn'?t|do\s+not|does\s+not|not|never|avoid|without|no|nunca|evit\w*|prohib\w*|sin)\b/;
function normalize(s){return s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[\u2018\u2019]/g,"'").toLowerCase();}
function interpret(message){
 const text=(typeof message==='string'?message:'').slice(0,220).trim();
 const normalized=normalize(text);
 const matches=INTENTS.filter(k=>k.words.test(normalized));
 // A house can be the object of renovation, not a second instruction.
 let choices=matches.filter(k=>k.intent!=='housing'||!matches.some(x=>x.intent==='remodel'));
 // A farm can be the object of protection; defense remains the action.
 if(choices.some(k=>k.intent==='defense')&&!/\b(?:build|construct|constru\w*)\b/.test(normalized))
  choices=choices.filter(k=>k.intent!=='food');
 if(!choices.length&&/\b(?:build|construct|constru\w*|edific\w*)\b/.test(normalized))
  choices=[INTENTS.find(k=>k.intent==='housing')];
 const selectedTargets=TARGETS.filter(t=>new RegExp('\\b'+t.id+'\\b').test(normalized));
 const ambiguous=choices.length>1||selectedTargets.length>1;
 const negated=NEGATION.test(normalized);
 const match=choices.length===1?choices[0]:null;
 const status=negated?'negated':ambiguous?'ambiguous':match?'recognized':'unsupported';
 const reason=status==='negated'?'Negated instruction: no order issued.':
  status==='ambiguous'?'Multiple intentions or recipients: specify one action and one recipient.':
  status==='unsupported'?'Unsupported offline request: no order issued.':'';
 return {text,intent:status==='recognized'?match.intent:'unknown',
  label:status==='recognized'?match.label:status==='ambiguous'?'ambiguous request':'unrecognized request',
  target:status==='recognized'&&selectedTargets.length===1?{...selectedTargets[0]}:null,
  status,reason};
}
return {interpret};
});
