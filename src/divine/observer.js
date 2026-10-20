/* GODSEED divine observatory: bounded, deterministic and strictly read-only. */
(function(root,factory){
 const api=factory();
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.GodseedObserver=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_ROWS=12,MAX_MEMORIES=6,MAX_OPTIONS=80;
const str=(v,fallback='—')=>v===undefined||v===null||v===''?fallback:String(v).slice(0,180);
const number=(v)=>Number.isFinite(Number(v))?Math.round(Number(v)*10)/10:0;
const day=t=>'Day '+(1+Math.floor(Math.max(0,Number(t)||0)/240));
function row(label,value){return {label:str(label),value:str(value)};}
function compactHistory(arr,limit=MAX_MEMORIES){
 return (Array.isArray(arr)?arr:[]).slice(-limit).reverse().map(e=>{
  if(typeof e==='string')return str(e);
  if(!e||typeof e!=='object')return 'Unknown memory';
  return (e.tick===undefined?'':day(e.tick)+' · ')+str(e.text||e.title||e.detail);
 });
}
function life(s,person,type){
 const isNim=type==='nim',isCitizen=type==='citizen';
 const age=isNim?person.life&&person.life.age:person.age;
 const rows=[
  row('Role',isNim?(person.life&&person.life.occupation||'Wanderer'):person.role),
  row('Activity',isNim?person.goal:person.activity),
  row('Position',number(person.x)+', '+number(person.y)),
  row('Mood',isNim?person.thought:person.mood)
 ];
 if(age!==undefined)rows.push(row('Age',number(age)));
 if(isNim){
  rows.push(row('Health',number(person.hp)+' / '+number(person.maxHp)),
   row('Hunger',number(person.hunger)),row('Energy',number(person.energy)),
   row('Intention',s.living&&s.living.nimWish&&s.living.nimWish.until>s.tick?
    'Considering '+str(s.living.nimWish.intent):'Following own plans'));
 }else{
  rows.push(row('Trust',number(person.trust)));
  if(isCitizen){
   const town=s.living&&s.living.towns.find(t=>t.id===person.townId);
   rows.push(row('Home',town?town.name:person.townId),row('Profession skill',number(person.skill)),
    row('Relationships',Object.entries(person.relationships||{}).slice(0,4).map(([k,v])=>str(k)+': '+number(v)).join(' · ')||'No recorded bonds'));
  }
 }
 const history=isNim?
  compactHistory((person.life&&person.life.events)||[]).concat((Array.isArray(person.memory)?person.memory:[]).slice(-3).reverse().map(v=>str(v))).slice(0,MAX_MEMORIES):
  compactHistory(person.life);
 return {kind:'person',title:str(person.name||'Nim'),subtitle:type==='nim'?'Independent protagonist':type==='citizen'?'Settlement resident':'Traveler',
  rows:rows.slice(0,MAX_ROWS),memories:history,intentions:[]};
}
function townView(s,t){
 const citizens=(s.living.citizens||[]).filter(c=>c.townId===t.id);
 const relevant=(s.living.chronicle||[]).filter(e=>String(e.title||'').includes(t.name)||String(e.detail||'').includes(t.name));
 const whispers=(s.living.whispers||[]).filter(w=>!w.target||w.target.kind!=='town'||w.target.id===t.id).slice(-3).reverse();
 return {kind:'town',title:str(t.name),subtitle:'Medieval settlement · residents act independently',
  rows:[row('Age',t.age),row('Era',t.technology&&t.technology.era),row('Agenda',t.agenda),
   row('Food',number(t.stock&&t.stock.food)),row('Wood',number(t.stock&&t.stock.wood)),
   row('Stone',number(t.stock&&t.stock.stone)),row('Buildings',(t.buildings||[]).length),
   row('Residents',citizens.map(c=>c.name).join(', ')||'No named residents'),
   row('Position',number(t.x)+', '+number(t.y))],
  memories:compactHistory(relevant.slice(0,MAX_MEMORIES).reverse()),
  intentions:whispers.map(w=>day(w.tick)+' · '+str(w.label||w.intent)+' · '+
   (Array.isArray(w.decisions)?w.decisions.filter(d=>d.name===t.name).map(d=>d.agree?'Considering':'Declined').join(', '):'No response')).slice(0,3)};
}
function buildingView(s,b,t){
 const width=b.w||1,height=b.h||1;
 return {kind:'building',title:str(b.type).replace(/^./,c=>c.toUpperCase())+' · '+str(b.id),
  subtitle:str(t.name)+' · Built by the settlement, not the player',
  rows:[row('Use',b.type),row('Footprint',width+' × '+height+' tiles'),
   row('Gross area',number(width*height*4)+' m² (outdoor 2 m tiles)'),
   row('Position',number(b.x)+', '+number(b.y)),row('Roof',b.roof),
   row('Constructed',day(b.builtAt)),row('Interior','Not yet implemented')],
  memories:[],intentions:[]};
}
function overview(s){
 const towns=s.living&&Array.isArray(s.living.towns)?s.living.towns:[];
 const residents=s.living&&Array.isArray(s.living.citizens)?s.living.citizens:[];
 const messages=s.living&&Array.isArray(s.living.whispers)?s.living.whispers:[];
 return {kind:'overview',title:'Divine Observatory',subtitle:'Observe choices; do not command lives',
  rows:[row('Current day',s.day),row('World tick',s.tick),row('Towns',towns.length),
   row('Residents',residents.length),row('Travelers',(s.npcs||[]).length),
   row('Buildings',towns.reduce((n,t)=>n+(t.buildings||[]).length,0))],
  memories:compactHistory((s.living&&s.living.chronicle)||[]),
  intentions:messages.slice(-3).reverse().map(w=>day(w.tick)+' · '+str(w.label||w.intent)+' · '+str(w.message))};
}
function entries(s){
 const out=[{key:'overview',label:'World overview'}, {key:'person:nim',label:'Nim · independent life'}];
 for(const p of s.npcs||[])out.push({key:'person:traveler:'+p.id,label:str(p.name)+' · traveler'});
 if(s.living){
  for(const c of s.living.citizens||[])out.push({key:'person:citizen:'+c.id,label:str(c.name)+' · resident'});
  for(const t of s.living.towns||[]){
   out.push({key:'town:'+t.id,label:str(t.name)+' · town'});
   for(const b of t.buildings||[])out.push({key:'building:'+b.id,label:str(t.name)+' / '+str(b.type)+' '+str(b.id)});
  }
 }
 return out.slice(0,MAX_OPTIONS);
}
function inspect(s,key){
 if(!s||typeof s!=='object')return null;
 if(key==='overview')return overview(s);
 if(key==='person:nim'&&s.bot)return life(s,s.bot,'nim');
 if(typeof key!=='string')return null;
 if(key.startsWith('person:traveler:')){
  const id=key.slice(16),p=(s.npcs||[]).find(x=>String(x.id)===id);
  return p?life(s,p,'traveler'):null;
 }
 if(!s.living)return null;
 if(key.startsWith('person:citizen:')){
  const id=key.slice(15),p=(s.living.citizens||[]).find(x=>String(x.id)===id);
  return p?life(s,p,'citizen'):null;
 }
 if(key.startsWith('town:')){
  const t=s.living.towns.find(x=>x.id===key.slice(5));
  return t?townView(s,t):null;
 }
 if(key.startsWith('building:')){
  for(const t of s.living.towns){
   const b=(t.buildings||[]).find(x=>x.id===key.slice(9));
   if(b)return buildingView(s,b,t);
  }
 }
 return null;
}
function tileKey(s,x,y){
 if(!s||!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=64||y>=48)return null;
 const towns=s.living&&Array.isArray(s.living.towns)?s.living.towns:[];
 const nearTown=towns.some(t=>Math.abs(t.x-x)<=3&&Math.abs(t.y-y)<=3);
 if(!((s.seen||[])[y*64+x]||nearTown))return null;
 // People take precedence when standing inside the footprint of a building.
 if(s.bot&&s.bot.x===x&&s.bot.y===y)return 'person:nim';
 const citizen=s.living&&(s.living.citizens||[]).find(p=>p.x===x&&p.y===y);
 if(citizen)return 'person:citizen:'+citizen.id;
 const traveler=(s.npcs||[]).find(p=>p.x===x&&p.y===y);
 if(traveler)return 'person:traveler:'+traveler.id;
 for(const t of towns)for(const b of t.buildings||[]){
  if(x>=b.x&&x<b.x+(b.w||1)&&y>=b.y&&y<b.y+(b.h||1))
   return 'building:'+b.id;
 }
 const town=towns.find(t=>Math.abs(t.x-x)<=2&&Math.abs(t.y-y)<=2);
 return town?'town:'+town.id:null;
}
return {entries,inspect,tileKey};
});
