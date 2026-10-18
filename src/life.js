/* GODSEED LIFE — offline deterministic society; no language model or remote APIs.
 * Structures are world-coordinate 2x2 footprints, not decorative icon placements.
 * Blueprint validation protects roads, ruins, shrines, forests, resources and water.
 */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GodseedLife=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const W=64,H=48,MAX_BUILDINGS=16;
const TOWNS=[{id:'Briarford',x:25,y:21},{id:'Emberwick',x:37,y:27}];
const BLUEPRINTS={
 cottage:{wood:3,stone:2,food:0,dist:2},
 farm:{wood:2,stone:1,food:1,dist:4},
 workshop:{wood:5,stone:3,food:1,dist:4},
 hall:{wood:7,stone:5,food:2,dist:3}
};
const TASKS=['build','farm','explore','rest','help','study','gather'];
const inside=(x,y)=>x>=0&&x<W&&y>=0&&y<H;
const at=(s,x,y)=>s.map[y*W+x];
const dist=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function journal(s,person,action,why){
 const l=s.life;
 l.decisions.unshift({tick:s.tick,person,action,why:String(why).slice(0,132)});
 l.decisions.length=Math.min(l.decisions.length,20);
}
function seedState(s){
 return {version:1,age:0,buildings:[],nextId:1,revision:0,
  stock:{wood:4,stone:3,food:5},decisions:[],letters:[],residents:{},
  heritage:s.map.flatMap((t,i)=>t===5?[i]:[]),
  community:0,lastConstruction:0};
}
function occupied(s,x,y){
 return !!s.life&&s.life.buildings.some(b=>x>=b.x&&x<b.x+2&&y>=b.y&&y<b.y+2);
}
function zone(s,x,y,type){
 if(!inside(x,y)||!inside(x+1,y+1))return false;
 for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
  const tx=x+dx,ty=y+dy,t=at(s,tx,ty);
  if(t!==0&&t!==6)return false;
  if(s.life.heritage.includes(ty*W+tx))return false;
  if(s.camp&&Math.abs(tx-s.camp.x)+Math.abs(ty-s.camp.y)<=1)return false;
  if((s.npcs||[]).some(p=>Math.abs(tx-p.homeX)+Math.abs(ty-p.homeY)<1))return false;
  for(const q of s.life.buildings)
   if(tx>=q.x-1&&tx<q.x+q.w+1&&ty>=q.y-1&&ty<q.y+q.h+1)return false;
 }
 // Houses need a clear walkable approach and remain near a real village/road.
 return true;
}
function candidate(s,town,type){
 const spec=BLUEPRINTS[type],want=spec.dist;
 const spots=[];
 for(let y=town.y-7;y<=town.y+6;y++)for(let x=town.x-7;x<=town.x+6;x++){
  if(!zone(s,x,y,type))continue;
  const d=Math.abs(x-town.x)+Math.abs(y-town.y);
  if(d<2||d>9)continue;
  let road=false;
  for(let yy=y-1;yy<=y+2;yy++)for(let xx=x-1;xx<=x+2;xx++)if(inside(xx,yy)&&at(s,xx,yy)===8)road=true;
  if(!road)continue;
  const tie=(((Math.imul(x+7,193)^Math.imul(y+13,389)^s.worldSeed)>>>0)%17)/100;
  spots.push({x,y,score:Math.abs(d-want)+tie});
 }
 spots.sort((a,b)=>a.score-b.score||a.y-b.y||a.x-b.x);
 return spots[0]||null;
}
function build(s,town,type,who,costs=true){
 const l=s.life,spec=BLUEPRINTS[type];if(!spec||l.buildings.length>=MAX_BUILDINGS)return null;
 if(costs&&Object.keys(l.stock).some(k=>l.stock[k]<spec[k]))return null;
 const plot=candidate(s,town,type);if(!plot)return null;
 if(costs)for(const k of Object.keys(l.stock))l.stock[k]-=spec[k];
 const variants=['timber','stone','moss'];
 const p=(s.npcs||[]).find(n=>n.name===who);
 const temperament=p&&l.residents[who]?l.residents[who].creativity:0.5;
 const style=variants[(Math.floor(temperament*10)+l.buildings.length+s.worldSeed)%variants.length];
 const b={id:l.nextId++,town:town.id,type,x:plot.x,y:plot.y,w:2,h:2,style,owner:who,builtAt:s.tick};
 l.buildings.push(b);l.revision++;
 journal(s,who,'Built '+type,town.id+' · '+style+' walls; plan adapted to nearby roads and terrain');
 return b;
}
function init(s){
 s.life=seedState(s);
 for(const p of s.npcs){
  s.life.residents[p.name]={energy:80,joy:54,creativity:((s.worldSeed+p.id*19)%75+20)/100,
   conviction:((s.worldSeed+p.id*13)%65+25)/100,friendship:{},focus:'life'};
 }
 for(const town of TOWNS)build(s,town,'cottage','Founders',false);
 return s.life;
}
function repair(s){
 if(!s.life||s.life.version!==1||!Array.isArray(s.life.buildings)||!Array.isArray(s.life.letters))return init(s);
 const l=s.life;
 l.heritage=Array.isArray(l.heritage)?l.heritage.filter(n=>Number.isInteger(n)&&n>=0&&n<W*H).slice(0,48):[];
 l.stock=l.stock&&typeof l.stock==='object'?l.stock:{};
 for(const k of ['wood','stone','food'])l.stock[k]=clamp(Number.isFinite(l.stock[k])?l.stock[k]:0,0,99);
 l.age=Number.isInteger(l.age)?clamp(l.age,0,2):0;
 l.community=Number.isFinite(l.community)?clamp(l.community,0,100):0;
 l.buildings=l.buildings.slice(0,MAX_BUILDINGS).filter(b=>b&&
  ['cottage','farm','workshop','hall'].includes(b.type)&&
  Number.isInteger(b.x)&&Number.isInteger(b.y)&&inside(b.x,b.y)&&inside(b.x+1,b.y+1)&&
  TOWNS.some(t=>t.id===b.town)).map((b,i)=>({
   id:i+1,x:b.x,y:b.y,w:2,h:2,town:b.town,type:b.type,
   style:['timber','stone','moss'].includes(b.style)?b.style:'timber',
   owner:String(b.owner||'Community').slice(0,26),builtAt:Number.isInteger(b.builtAt)?b.builtAt:0
  }));
 l.nextId=l.buildings.length+1;l.revision=Number.isInteger(l.revision)?l.revision:0;
 l.decisions=Array.isArray(l.decisions)?l.decisions.slice(0,20).filter(d=>d&&typeof d.person==='string'&&typeof d.action==='string'):[];
 l.letters=l.letters.slice(0,12).filter(z=>z&&typeof z.text==='string'&&TASKS.includes(z.intent)&&typeof z.to==='string'&&typeof z.status==='string');
 l.residents=l.residents&&typeof l.residents==='object'?l.residents:{};
 for(const p of s.npcs){
  const old=l.residents[p.name]||{};
  l.residents[p.name]={energy:clamp(Number.isFinite(old.energy)?old.energy:75,0,100),
   joy:clamp(Number.isFinite(old.joy)?old.joy:50,0,100),
   creativity:clamp(Number.isFinite(old.creativity)?old.creativity:.5,0,1),
   conviction:clamp(Number.isFinite(old.conviction)?old.conviction:.5,0,1),
   friendship:{},focus:typeof old.focus==='string'?old.focus.slice(0,24):'life'};
 }
 l.lastConstruction=Number.isInteger(l.lastConstruction)?l.lastConstruction:0;
 return l;
}
function classify(input){
 const words=String(input).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(Boolean);
 // Narrow offline intent vocabulary, including Spanish verb conjugations.
 const patterns=[
  ['build',/^(build|construct|constru|edific|house|home|casa|viviend|settlement|asentam|workshop|taller)/],
  ['farm',/^(farm|grow|plant|crop|food|granja|cultiv|sembr|comida|huerto|aliment)/],
  ['explore',/^(explor|travel|discover|wander|viaj|descubr|investig|mundo)/],
  ['rest',/^(rest|sleep|recover|descans|dorm|recuper|pausa)/],
  ['help',/^(help|care|protect|social|ayud|cuid|proteg|amistad|amig)/],
  ['study',/^(study|learn|research|read|estudi|aprend|leer|conocim)/],
  ['gather',/^(gather|collect|harvest|mine|recolect|recog|madera|piedra|miner)/]
 ];
 for(const [intent,re] of patterns)if(words.some(word=>re.test(word)))return intent;
 return null;
}
function issue(s,target,message){
 if(!s.life)repair(s);
 const text=String(message||'').trim().slice(0,180);
 if(text.length<3)return {ok:false,reason:'Write at least three characters.'};
 if(!['Nim',...s.npcs.map(p=>p.name)].includes(target))return {ok:false,reason:'Unknown inhabitant.'};
 const intent=classify(text);
 if(!intent)return {ok:false,reason:'Not understood offline. Try build, farm, explore, rest, help, study or gather (English or Spanish).'};
 if(s.life.letters.length&&s.tick-(s.life.letters[0].tick||0)<4)return {ok:false,reason:'The last message needs time to settle.'};
 const npc=s.npcs.find(p=>p.name===target);
 const traits=target==='Nim'?s.bot.personality:s.life.residents[target];
 const willingness=target==='Nim'?(traits.curiosity+traits.diligence)*.5:
   (traits.creativity+traits.conviction)*.45+(npc.trust/100)*.1;
 const hardship=target==='Nim'?(s.bot.hp<s.bot.maxHp*.4||s.bot.hunger<30):
   s.life.residents[target].energy<25;
 const mismatch=target==='Nim'?intent==='build'||intent==='farm':
   (intent==='explore'&&npc.role==='Apothecary')||(intent==='study'&&npc.role==='Squire');
 const accepted=!hardship&&!mismatch&&willingness>=(intent==='explore'?.47:.34);
 const reason=hardship?'Needs safety and rest first':mismatch?'Conflicts with current responsibilities':
    accepted?'Considers this compatible with personal goals':'Does not agree with the request';
 const letter={id:(s.life.letters[0]?.id||0)+1,tick:s.tick,to:target,
  text,intent,status:accepted?'considering':'declined',reason,until:s.tick+420};
 s.life.letters.unshift(letter);s.life.letters.length=Math.min(12,s.life.letters.length);
 journal(s,target,accepted?'Considering '+intent:'Declined '+intent,reason);
 if(accepted&&target!=='Nim'){s.life.residents[target].focus=intent;}
 return {ok:true,accepted,intent,reason,id:letter.id};
}
function direction(s,p,x,y,walkable){
 const dx=Math.sign(x-p.x),dy=Math.sign(y-p.y);
 const options=Math.abs(x-p.x)>Math.abs(y-p.y)?[[dx,0],[0,dy]]:[[0,dy],[dx,0]];
 for(const [ax,ay] of options){
  if(!ax&&!ay)continue;
  const nx=p.x+ax,ny=p.y+ay;
  if(walkable(s,nx,ny)&&!s.npcs.some(other=>other!==p&&other.x===nx&&other.y===ny)){
   p.facing=ax>0?'east':ax<0?'west':ay>0?'south':'north';
   p.x=nx;p.y=ny;p.movedAt=s.tick;return true;
  }
 }return false;
}
function stepPerson(s,p,T,walkable,random){
 const l=s.life;if(!l)return;
 const r=l.residents[p.name];if(!r)return;
 // An immediate supernatural favor is a distinct life event; do not replace
 // its visible outcome with the ordinary work/sleep label in the same period.
 if(p.favorUntil>s.tick&&p.favorSpent&&
    /^(Tending blessed herbs|Guarding the old road|Deciphering a prophecy)$/.test(p.activity))return;
 const town=p.name==='Toren'?TOWNS[0]:TOWNS[1],d=dist(p,town);
 // Residents never stand motionless for days; scheduled work, social, sleep.
 const period=s.tick%240,night=period>=190||period<30;
 if(night||r.energy<16){p.activity='Sleeping at home';r.energy=clamp(r.energy+8,0,100);r.joy=clamp(r.joy+1,0,100);
  direction(s,p,p.homeX,p.homeY,walkable);return;}
 const focus=r.focus;
 const resource=focus==='farm'||p.role==='Apothecary'?T.BERRY:
   focus==='gather'||p.role==='Squire'?T.FOREST:T.STONE;
 let best=null,score=1e9;
 for(let y=Math.max(1,p.y-7);y<=Math.min(H-2,p.y+7);y++)
  for(let x=Math.max(1,p.x-7);x<=Math.min(W-2,p.x+7);x++){
   if(at(s,x,y)!==resource)continue;
   const d=Math.abs(x-p.x)+Math.abs(y-p.y);
   if(d<score){score=d;best={x,y};}
  }
 if(best){
  p.activity=resource===T.FOREST?'Gathering timber':resource===T.STONE?'Quarrying stone':'Harvesting food';
  if(score<=1){
   if(direction(s,p,best.x,best.y,walkable)||score===0){
    const k=resource===T.FOREST?'wood':resource===T.STONE?'stone':'food';
    l.stock[k]=clamp(l.stock[k]+2,0,99);
    s.map[best.y*W+best.x]=T.GRASS;r.energy=clamp(r.energy-4,0,100);
   }
  }else direction(s,p,best.x,best.y,walkable);
 }else{
  p.activity='Visiting the community';
  direction(s,p,town.x,town.y,walkable);
  if(d<=3)r.joy=clamp(r.joy+2,0,100);
 }
}
function advance(s){
 if(!s.life||s.tick%24!==0)return;
 const l=s.life;
 for(const p of s.npcs){
  const r=l.residents[p.name];if(!r)continue;
  // Periodic independent life events, not a repeating combat XP counter.
  if(s.tick%120===0){
   const other=s.npcs.find(q=>q!==p&&dist(p,q)<=6);
   if(other){p.trust=clamp(p.trust+1,0,100);r.joy=clamp(r.joy+3,0,100);
    journal(s,p.name,'Shared a moment',other.name+' offered company near the settlement');}
   else journal(s,p.name,p.activity,'Chose a daily routine');
  }
 }
 for(const letter of l.letters)if(letter.status==='considering'){
  const r=l.residents[letter.to];
  if(letter.to!=='Nim'){
   const p=s.npcs.find(n=>n.name===letter.to);
   if(p&&r){
    // Advice guides priorities; the inhabitant decides whether and when it fits.
    if(letter.intent==='build'||letter.intent==='farm')r.focus=letter.intent;
    if(letter.intent==='rest'){r.energy=clamp(r.energy+12,0,100);p.activity='Resting by choice';}
    if(letter.intent==='help'){l.community=clamp(l.community+2,0,100);p.activity='Helping neighbors';}
    if(letter.intent==='study'){r.joy=clamp(r.joy+3,0,100);p.activity='Reading old chronicles';}
    letter.status='acted';journal(s,p.name,'Acted on '+letter.intent,'Chose how to interpret a divine suggestion');
   }
  }
 }
 // Councils consider needs, supplies and space; age progression is earned.
 if(s.tick-l.lastConstruction>=48&&l.buildings.length<MAX_BUILDINGS){
  const wantsFarm=l.buildings.filter(x=>x.type==='farm').length<2;
  const wantsWorkshop=l.buildings.length>=5&&!l.buildings.some(x=>x.type==='workshop');
  const wantsHall=l.buildings.length>=9&&!l.buildings.some(x=>x.type==='hall');
  const kind=wantsFarm?'farm':wantsWorkshop?'workshop':wantsHall?'hall':'cottage';
  const town=TOWNS[(l.buildings.length+s.worldSeed)%2];
  const resident=s.npcs[(l.buildings.length+s.worldSeed)%s.npcs.length];
  const built=build(s,town,kind,resident.name,true);
  if(built){l.lastConstruction=s.tick;l.community=clamp(l.community+6,0,100);
   s.log.unshift({tick:s.tick,title:'Settlement grows',detail:resident.name+' designed a '+built.style+' '+kind+' in '+town.id+'.',type:'milestone'});
   if(s.log.length>45)s.log.length=45;
  }
 }
 const next=l.buildings.length>=9&&l.buildings.some(x=>x.type==='workshop')?2:
   l.buildings.length>=5?1:0;
 if(next>l.age){l.age=next;journal(s,'Council','New era reached',['Founding','Village Age','Craft Age'][next]);}
}
function nimDirective(s,findPath,setGoal){
 const l=s.life;if(!l)return false;
 const letter=l.letters.find(q=>q.to==='Nim'&&q.status==='considering');
 if(!letter)return false;
 if(s.tick>letter.until){letter.status='expired';return false;}
 const b=s.bot;
 if(letter.intent==='rest'){setGoal(s,'Rest','I chose to rest after considering the divine words.');letter.status='acted';return true;}
 if(letter.intent==='help'){
  const p=s.npcs.find(n=>Math.abs(n.x-b.x)+Math.abs(n.y-b.y)<=12);
  if(p){const path=findPath(s,(x,y)=>Math.abs(x-p.x)+Math.abs(y-p.y)<=1);
   if(path&&path.length){setGoal(s,'Meet traveler','I may lend someone a hand.',path);letter.status='acted';return true;}}
 }
 if(letter.intent==='explore'||letter.intent==='study'||letter.intent==='gather'){
  const target=letter.intent==='explore'?(x,y,t,n)=>!s.seen[n]:
    letter.intent==='study'?(x,y,t)=>t===5:(x,y,t)=>t===1||t===3;
  const path=findPath(s,target);
  if(path&&path.length){setGoal(s,'Consider omen','I will investigate, in my own way.',path);letter.status='acted';return true;}
 }
 letter.status='declined';letter.reason='No suitable safe action found';return false;
}
return {TOWNS,BLUEPRINTS,init,repair,issue,stepPerson,advance,nimDirective,zone,occupied};
});
