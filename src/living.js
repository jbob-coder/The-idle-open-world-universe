/* GODSEED Living Settlements: bounded, deterministic offline agency. No external AI. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GodseedLiving=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const W=64,H=48,MAX_BUILDINGS=12;
const PASS=new Set([0,1,3,4,5,6,7,8,9,10]),GROUND=new Set([0,6]);
const BLUEPRINTS={
 house:{wood:4,stone:1,label:'Home',kind:'housing'},
 farm:{wood:2,stone:0,label:'Fields',kind:'food'},
 workshop:{wood:5,stone:4,label:'Workshop',kind:'craft'},
 market:{wood:6,stone:2,label:'Market',kind:'trade'},
 watchtower:{wood:7,stone:5,label:'Watchtower',kind:'defense'},
 well:{wood:1,stone:5,label:'Well',kind:'water'}
};
function hash(a,b,c){let n=(Math.imul(a+101,73856093)^Math.imul(b+17,19349663)^Math.imul(c+7,83492791))>>>0;n=Math.imul(n^(n>>>15),2246822519)>>>0;return n^(n>>>13);}
function distance(a,b,x,y){return Math.abs(a-x)+Math.abs(b-y);}
function townOf(s,id){return s.living.towns.find(t=>t.id===id);}
function people(s){return [...s.npcs,...s.living.citizens];}
function log(s,title,detail){
 s.log.unshift({tick:s.tick,title,detail,type:'event'});if(s.log.length>45)s.log.length=45;
 s.living.chronicle.unshift({tick:s.tick,title,detail});s.living.chronicle.length=Math.min(s.living.chronicle.length,16);
}
function site(s,town,type){
 const occupied=new Set(s.living.towns.flatMap(v=>v.buildings.map(z=>z.y*W+z.x)));
 let best=null,score=-1e9;
 for(let y=Math.max(2,town.y-5);y<=Math.min(H-3,town.y+5);y++)
 for(let x=Math.max(2,town.x-5);x<=Math.min(W-3,town.x+5);x++){
  const n=y*W+x;if(!GROUND.has(s.map[n])||occupied.has(n)||distance(x,y,town.x,town.y)<2)continue;
  // Protect all shrines, roads, villages, ruins, forests and water from building.
  const adjacent=[n-W,n+1,n+W,n-1],road=adjacent.some(k=>s.map[k]===8||s.map[k]===9);
  const nearbyRoad=road||adjacent.some(k=>k>=0&&k<W*H&&[k-W,k+1,k+W,k-1].some(q=>s.map[q]===8));
  if(!nearbyRoad)continue;
  const nearWater=adjacent.some(k=>s.map[k]===2),radius=distance(x,y,town.x,town.y);
  const preference=type==='farm'?(s.map[n]===6?14:2):type==='well'?(nearWater?18:1):type==='watchtower'?radius*2:0;
  const value=30-radius*3+preference+(road?9:0)+(hash(town.x,town.y,n)%9)/100;
  if(value>score){best={x,y};score=value;}
 }
 return best;
}
function build(s,town,type,starting=false){
 const bp=BLUEPRINTS[type];if(!bp||town.buildings.length>=MAX_BUILDINGS)return false;
 const pos=site(s,town,type);if(!pos)return false;
 if(!starting&&(town.stock.wood<bp.wood||town.stock.stone<bp.stone))return false;
 if(!starting){town.stock.wood-=bp.wood;town.stock.stone-=bp.stone;}
 const shapes=['oak','reed','stone'],roof=shapes[(hash(pos.x,pos.y,town.seed)+town.buildings.length)%3];
 town.buildings.push({id:town.id+'-'+(town.buildings.length+1),type,x:pos.x,y:pos.y,roof,builtAt:s.tick});
 if(!starting){log(s,town.name+' built '+bp.label, 'Residents chose a '+roof+' style '+bp.label.toLowerCase()+' near the old roads.');}
 return true;
}
function create(s){
 const towns=[
  {id:'briarford',name:'Briarford',x:25,y:21,seed:s.worldSeed^113,age:'Outpost',stock:{food:6,wood:2,stone:1},buildings:[],agenda:'housing',technology:{level:0,era:'Founding Age'},nextBuild:120},
  {id:'emberwick',name:'Emberwick',x:37,y:27,seed:s.worldSeed^771,age:'Outpost',stock:{food:5,wood:3,stone:1},buildings:[],agenda:'food',technology:{level:0,era:'Founding Age'},nextBuild:160}
 ];
 const living={version:1,towns,citizens:[],chronicle:[],whispers:[],nextWhisper:1};
 s.living=living;
 s.bot.life={age:19,occupation:'Wanderer',friends:[],events:[{tick:s.tick,text:'Awoke in the forgotten kingdom'}],lastCareerTick:-300};
 for(const t of towns){build(s,t,'house',true);build(s,t,'farm',true);}
 const identities=[
  ['Elin','Builder','briarford',.80,.46,.62],
  ['Rowan','Forager','briarford',.66,.78,.35],
  ['Sera','Mason','emberwick',.72,.51,.67],
  ['Bram','Farmer','emberwick',.59,.81,.44]
 ];
 for(let i=0;i<identities.length;i++){
  const [name,role,townId,diligence,kindness,independence]=identities[i],t=townOf(s,townId);
  living.citizens.push({id:20+i,name,role,townId,x:t.x,y:t.y,homeX:t.x,homeY:t.y,
   facing:'south',movedAt:-100,age:19+i*3,skill:1,skillXP:0,trust:35,
   kindness,diligence,independence,mood:'calm',activity:'Getting ready',relationships:{},life:[],actions:0});
 }
 log(s,'Two communities awaken','Briarford and Emberwick have working residents, limited supplies and homes. They choose how to grow.');
 return living;
}
function compatible(s){
 return s.living&&s.living.version===1&&Array.isArray(s.living.towns)&&s.living.towns.length===2&&
  Array.isArray(s.living.citizens)&&s.living.citizens.length<=4;
}
function restore(s){
 if(!compatible(s)){create(s);return;}
 const l=s.living;l.chronicle=Array.isArray(l.chronicle)?l.chronicle.slice(0,16):[];
 if(!s.bot.life||typeof s.bot.life!=='object')s.bot.life={age:19,occupation:'Wanderer',friends:[],events:[],lastCareerTick:-300};
 s.bot.life.age=Math.max(19,Math.min(120,Number(s.bot.life.age)||19));
 s.bot.life.events=Array.isArray(s.bot.life.events)?s.bot.life.events.slice(-10):[];
 s.bot.life.friends=Array.isArray(s.bot.life.friends)?s.bot.life.friends.slice(0,7).filter(n=>typeof n==='string'):[];
 s.bot.life.occupation=String(s.bot.life.occupation||'Wanderer').slice(0,32);
 s.bot.life.lastCareerTick=Number(s.bot.life.lastCareerTick)||-300;
 l.whispers=Array.isArray(l.whispers)?l.whispers.slice(-12):[];
 l.nextWhisper=Number.isInteger(l.nextWhisper)?l.nextWhisper:1;
 const townSeeds={briarford:{x:25,y:21},emberwick:{x:37,y:27}};
 for(const t of l.towns){
  const home=townSeeds[t.id];if(!home){create(s);return;}
  t.x=home.x;t.y=home.y;t.stock=t.stock||{food:4,wood:1,stone:1};
  for(const k of ['food','wood','stone'])t.stock[k]=Math.max(0,Math.min(999,Number(t.stock[k])||0));
  t.buildings=Array.isArray(t.buildings)?t.buildings.slice(0,MAX_BUILDINGS).filter(b=>b&&BLUEPRINTS[b.type]&&
   Number.isInteger(b.x)&&Number.isInteger(b.y)&&b.x>1&&b.x<W-2&&b.y>1&&b.y<H-2):[];
  t.agenda=BLUEPRINTS[t.agenda]||['housing','food','defense','trade'].includes(t.agenda)?t.agenda:'housing';
  const level=Number.isInteger(t.technology&&t.technology.level)?Math.max(0,Math.min(3,t.technology.level)):0;
  t.technology={level,era:['Founding Age','Farming Age','Craft Age','Trade Age'][level]};
 }
 for(const c of l.citizens){
  const t=townOf(s,c.townId)||l.towns[0];
  if(!Number.isInteger(c.x)||!Number.isInteger(c.y)||c.x<1||c.y<1||c.x>=W-1||c.y>=H-1){c.x=t.x;c.y=t.y;}
  c.life=Array.isArray(c.life)?c.life.slice(-6):[];c.relationships=c.relationships&&typeof c.relationships==='object'?c.relationships:{};
  c.actions=Number(c.actions)||0;c.skillXP=Number(c.skillXP)||0;c.skill=Number(c.skill)||1;
 }
}
function goalFor(s,p){
 const t=townOf(s,p.townId)||s.living.towns[0];
 const phase=(s.tick+p.id*23)%240;
 if(phase>=185)return {x:p.homeX,y:p.homeY,activity:'Resting at home'};
 if(phase>=140)return {x:t.x,y:t.y,activity:'Sharing evening stories'};
 if(phase>=90)return {x:t.x+(p.id%3)-1,y:t.y+1,activity:'Talking to neighbors'};
 // Occupations refer to REAL installed structures instead of abstract offsets.
 const workType=p.role==='Farmer'||p.role==='Forager'?'farm':p.role==='Mason'?'workshop':'house';
 const building=t.buildings.find(b=>b.type===workType)||t.buildings[0];
 return {x:building?building.x:t.x,y:building?building.y:t.y,
  activity:p.role==='Farmer'?'Tending fields':p.role==='Forager'?'Foraging near the farms':
   p.role==='Mason'?'Working at the workshop':'Building and maintaining homes'};
}
function walk(s,p,goal){
 if(!goal)return;
 const opts=[[0,0],[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:p.x+dx,y:p.y+dy}));
 let best=null,v=Infinity;
 for(const o of opts){
  if(o.x<1||o.y<1||o.x>=W-1||o.y>=H-1||!PASS.has(s.map[o.y*W+o.x])||s.map[o.y*W+o.x]===2)continue;
  if(s.living.citizens.some(q=>q!==p&&q.x===o.x&&q.y===o.y))continue;
  const cost=distance(o.x,o.y,goal.x,goal.y)+(hash(s.tick,p.id,o.x+o.y*W)%5)*.02;
  if(cost<v){v=cost;best=o;}
 }
 if(best&&(best.x!==p.x||best.y!==p.y)){
  p.facing=best.x>p.x?'east':best.x<p.x?'west':best.y>p.y?'south':'north';
  p.movedAt=s.tick;p.x=best.x;p.y=best.y;
 }
}
function work(s,p){
 const t=townOf(s,p.townId);if(!t)return;
 // Supplies are earned only by people who actually arrived at their work sites.
 const workspace=goalFor(s,p);
 if(distance(p.x,p.y,workspace.x,workspace.y)>2)return;
 let gainType=t.stock.food<5?'food':t.stock.wood<6?'wood':t.stock.stone<6?'stone':
  p.role==='Farmer'||p.role==='Forager'?'food':p.role==='Mason'?'stone':'wood';
 t.stock[gainType]=Math.min(999,t.stock[gainType]+1+(p.skill>=4&&s.tick%48===0?1:0));
 p.skillXP++;p.actions++;
 if(p.skillXP>=12+p.skill*4&&p.skill<12){p.skillXP=0;p.skill++;p.life.push('Became a level '+p.skill+' '+p.role);p.life=p.life.slice(-6);log(s,p.name+' improves at '+p.role,p.name+' learned by working, not by combat.');}
 if(p.actions%9===0){const other=s.living.citizens.find(q=>q!==p&&q.townId===p.townId);
  if(other){p.relationships[other.name]=Math.min(100,(p.relationships[other.name]||25)+2);other.relationships[p.name]=Math.min(100,(other.relationships[p.name]||25)+1);}
 }
}
function blueprintFor(t){
 if(t.stock.food<4)return 'farm';
 const count=type=>t.buildings.filter(b=>b.type===type).length;
 if(count('house')<2)return 'house';
 if(count('farm')<2)return 'farm';
 const agenda=t.agenda;
 if(agenda==='defense'&&!count('watchtower'))return 'watchtower';
 if(agenda==='craft'&&!count('workshop'))return 'workshop';
 if(agenda==='trade'&&!count('market'))return 'market';
 if(!count('well'))return 'well';
 if(!count('workshop')&&t.technology.level>=1)return 'workshop';
 if(!count('market')&&t.technology.level>=2)return 'market';
 if(!count('watchtower')&&t.technology.level>=1)return 'watchtower';
 return count('house')<4?'house':count('farm')<3?'farm':null;
}
function tick(s){
 if(!s.living||s.tick%12!==0)return;
 if(s.tick%240===0)advanceLife(s);
 for(const p of s.living.citizens){
  const task=goalFor(s,p);p.activity=task.activity;walk(s,p,task);
  if((s.tick+p.id*23)%240<90)work(s,p);
  if(s.tick%240===0){p.age+=1/12;p.mood=p.actions%5===0?'content':'calm';}
 }
 // Villages exchange surplus instead of waiting forever for absent professions.
 if(s.tick%120===0){const [west,east]=s.living.towns;
  if(west.stock.wood>=8&&east.stock.stone>=8){west.stock.wood-=3;east.stock.wood+=3;east.stock.stone-=3;west.stock.stone+=3;
   if(s.tick%480===0)log(s,'Trading caravan','Briarford timber and Emberwick stone crossed the old road.');}
 }
 for(const t of s.living.towns){
  if(s.tick%120===0){
   const citizens=s.living.citizens.filter(c=>c.townId===t.id);
   const craftSkill=citizens.reduce((n,c)=>n+c.skill,0)/Math.max(1,citizens.length);
   const built=type=>t.buildings.some(b=>b.type===type);
   const tech=t.technology;
   let next=tech.level;
   if(next===0&&t.buildings.length>=4&&t.stock.food>=5&&craftSkill>=1.5)next=1;
   else if(next===1&&t.buildings.length>=7&&built('workshop')&&craftSkill>=2)next=2;
   else if(next===2&&t.buildings.length>=9&&built('market')&&craftSkill>=3)next=3;
   if(next!==tech.level){tech.level=next;tech.era=['Founding Age','Farming Age','Craft Age','Trade Age'][next];
    log(s,t.name+' enters the '+tech.era,'New skills, infrastructure and supplies made a new generation of blueprints possible.');
   }
  }
  t.stock.food=Math.max(0,t.stock.food-Math.max(1,Math.floor(s.living.citizens.filter(p=>p.townId===t.id).length/2))*(s.tick%96===0?1:0));
  if(s.tick<t.nextBuild)continue;
  const type=blueprintFor(t);
  if(type&&build(s,t,type)){t.nextBuild=s.tick+144;const n=t.buildings.length;
   const next=n>=8?'Township':n>=5?'Village':'Hamlet';
   if(t.age!==next){t.age=next;log(s,t.name+' becomes a '+next,'Residents chose to expand their settlement.');}
  }else t.nextBuild=s.tick+48;
  // Once land is occupied, inhabitants can choose a new look rather than
  // expanding indefinitely or ignoring their community's built environment.
  if(t.age==='Township'&&(s.tick%1200===0||(Number.isInteger(t.renovateAfter)&&t.renovateAfter>0&&s.tick>=t.renovateAfter))&&t.stock.wood>=4&&t.stock.stone>=2){
   t.renovateAfter=0;
   const b=t.buildings.find(q=>q.type==='house');
   if(b){const styles=['oak','reed','stone'];b.roof=styles[(styles.indexOf(b.roof)+1)%styles.length];
    b.updatedAt=s.tick;t.stock.wood-=2;t.stock.stone-=1;
    log(s,t.name+' renovates a home','The residents chose '+b.roof+' roofing as their village matures.');
   }
  }
 }
}
function advanceLife(s){
 const b=s.bot,life=b.life;
 if(!life)return;
 life.age=Math.min(120,life.age+1/12);
 const careers=[['scouting','Wayfinder'],['lore','Chronicler'],['survival','Forager'],['crafting','Maker'],['combat','Guardian']];
 const choice=careers.slice().sort((a,c)=>{
  const bscore=(b.skills[c[0]]||0)+(c[0]==='lore'?b.personality.curiosity*.3:0);
  const ascore=(b.skills[a[0]]||0)+(a[0]==='lore'?b.personality.curiosity*.3:0);
  return bscore-ascore;
 })[0];
 if(choice&&b.skills[choice[0]]>=3&&choice[1]!==life.occupation&&s.tick-life.lastCareerTick>=240){
  life.occupation=choice[1];life.lastCareerTick=s.tick;
  life.events.push({tick:s.tick,text:'Chose to become a '+choice[1]});
  log(s,'Nim chooses a path','Through '+choice[0]+' experience, Nim chose a life as a '+choice[1]+'.');
 }
 for(const p of s.npcs){
  if(!p.met||p.trust<26||life.friends.includes(p.name))continue;
  life.friends.push(p.name);life.events.push({tick:s.tick,text:'Became friends with '+p.name});
  log(s,'A friendship takes root','Nim and '+p.name+' have built trust over repeated encounters.');
 }
 life.events=life.events.slice(-10);
}
function personTick(s,p){
 if(!s.living||s.tick%12!==0)return false;
 // Do not overwrite a character's earned, currently active divine-favor response.
 if(p.favorUntil>s.tick&&p.favorSpent)return true;
 const t=(p.name==='Ira'?s.living.towns[1]:s.living.towns[0]);
 const phase=(s.tick+p.id*19)%240;
 let target={x:p.homeX,y:p.homeY};
 if(phase>55&&phase<166){target=p.role==='Rune Scholar'?{x:p.homeX-2,y:p.homeY+1}:p.role==='Apothecary'?{x:t.x-1,y:t.y+1}:{x:t.x+2,y:t.y};}
 if(phase>=166&&phase<205)target={x:t.x,y:t.y};
 walk(s,p,target);
 p.activity=phase>=205||phase<55?'Sleeping at home':phase>=166?'Discussing the day':
  p.role==='Apothecary'?'Preparing remedies':p.role==='Squire'?'Guarding the road':'Studying old history';
 return true;
}
const COMMANDS=[
 {intent:'remodel',re:/\b(renovat|redesign|rebuild|remodel|appearance|roof|rediseñar|remodel|renovar|tejado|techos?|apariencia)\w*/i,label:'consider redesigning homes'},
 {intent:'housing',re:/\b(hous(?:e|ing)|shelter|home|casas?|viviendas?|edificios?)\b/i,label:'build homes'},
 {intent:'food',re:/\b(farm|crop|food|harvest|grain|cultivar|granja|comida|agricultur|alimento|cosecha)\w*/i,label:'grow food'},
 {intent:'defense',re:/\b(defend|protect|guard|wolves|wolf|wall|defender|proteger|lobos?|vigil|muralla)\w*/i,label:'protect residents'},
 {intent:'craft',re:/\b(craft|tool|workshop|smith|invent|forge|herramient|taller|forja|investig)\w*/i,label:'develop crafts'},
 {intent:'trade',re:/\b(trade|market|commerce|exchange|mercado|comercio|intercambi)\w*/i,label:'develop trade'},
 {intent:'explore',re:/\b(explore|travel|discover|journey|wander|explorar|viajar|descubri|aventura)\w*/i,label:'explore freely'},
 {intent:'housing',re:/\b(build|construct|construir)\w*/i,label:'build homes'},
 {intent:'rest',re:/\b(rest|sleep|recover|descansa|dormir|dorm|repos|curar)\w*/i,label:'rest'}
];
function interpret(message){
 const text=String(message||'').trim().slice(0,220);
 // A limited offline parser must never invert a negative instruction into a positive command.
 const denied=/\b(don.t|do not|never|avoid|no construy|no edifi|no hag|nunca|eviten|prohibi)\w*/i.test(text);
 const match=denied?null:COMMANDS.find(a=>a.re.test(text));
 return {text,intent:match?match.intent:'unknown',label:match?match.label:'unrecognized request'};
}
function whisper(s,message){
 if(!s.living)return {ok:false,reason:'World is still awakening'};
 const m=interpret(message);
 if(!m.text||m.text.length<3)return {ok:false,reason:'Write a short intention first'};
 if(m.intent==='unknown')return {ok:false,reason:'This offline version understands building, food, defense, crafts, trade, exploring and rest. No order was issued.'};
 if(s.living.whispers.length&&s.tick-s.living.whispers[s.living.whispers.length-1].tick<12)return {ok:false,reason:'Let the world consider the previous whisper'};
 const towns=s.living.towns,decisions=[];
 for(const t of towns){
  const workers=s.living.citizens.filter(c=>c.townId===t.id);
  const independence=workers.reduce((n,c)=>n+c.independence,0)/workers.length;
  const urgent=t.stock.food<3;
  const agree=!urgent||m.intent==='food'?independence<.75||hash(s.tick,t.x,m.text.length)%4!==0:m.intent==='food';
  if(agree&&['housing','food','defense','craft','trade'].includes(m.intent))t.agenda=m.intent;
  if(agree&&m.intent==='remodel')t.renovateAfter=s.tick+48;
  decisions.push({name:t.name,agree,reason:agree?'Residents will consider this within their needs and supplies.':'Residents are prioritizing survival or independence.'});
 }
 const nimAgree=s.bot.hunger>=30&&s.bot.energy>=25&&
  (m.intent==='explore'||m.intent==='rest'||m.intent==='food')&&(hash(s.worldSeed,s.tick,m.text.length)%10)<Math.floor(s.bot.personality.curiosity*10);
 if(nimAgree)s.living.nimWish={intent:m.intent,until:s.tick+120};
 const entry={id:s.living.nextWhisper++,tick:s.tick,message:m.text,intent:m.intent,label:m.label,decisions,nimAgree};
 s.living.whispers.push(entry);if(s.living.whispers.length>12)s.living.whispers.shift();
 log(s,'The god whispers',m.text+' · '+decisions.map(d=>d.name+': '+(d.agree?'considering':'declined')).join(', ')+(nimAgree?' · Nim is curious.':' · Nim has other plans.'));
 return {ok:true,entry};
}
function drawBuilding(ctx,b,x,y){
 const roofs={oak:'#98684d',reed:'#d4b577',stone:'#77878a'};
 const roof=roofs[b.roof]||roofs.oak;
 ctx.fillStyle='#172425';ctx.fillRect(x+1,y+5,15,11);
 ctx.fillStyle='#aa9b80';ctx.fillRect(x+2,y+7,12,7);
 if(b.type==='farm'){ctx.fillStyle='#544b2b';ctx.fillRect(x+1,y+3,14,12);ctx.fillStyle='#bdb160';
  for(let i=0;i<3;i++)ctx.fillRect(x+3+i*4,y+4,2,10);return;}
 if(b.type==='well'){ctx.fillStyle='#c6bda0';ctx.fillRect(x+2,y+4,12,10);ctx.fillStyle='#395f73';ctx.fillRect(x+4,y+6,8,5);
  ctx.fillStyle=roof;ctx.fillRect(x+2,y+2,12,3);return;}
 if(b.type==='watchtower'){ctx.fillStyle=roof;ctx.fillRect(x+5,y+1,7,4);ctx.fillStyle='#a89873';ctx.fillRect(x+6,y+5,5,10);return;}
 ctx.fillStyle=roof;ctx.fillRect(x+1,y+4,14,5);ctx.fillRect(x+3,y+2,10,2);
 ctx.fillStyle='#e7cd8b';ctx.fillRect(x+4,y+9,3,2);ctx.fillStyle='#473b30';ctx.fillRect(x+10,y+9,3,5);
 if(b.type==='market'){ctx.fillStyle='#ad7e48';ctx.fillRect(x+2,y+4,3,4);ctx.fillRect(x+9,y+4,3,4);}
 if(b.type==='workshop'){ctx.fillStyle='#6d7779';ctx.fillRect(x+2,y+1,3,5);}
}
function drawCitizen(ctx,p,x,y,tick){
 const moving=tick-p.movedAt<3,step=moving?(tick%2):0;
 const palette={Builder:'#d9aa74',Forager:'#70a98c',Mason:'#c3a3b7',Farmer:'#c7ba74'};
 ctx.fillStyle='#152423';ctx.fillRect(x+5,y+11,7,2);
 ctx.fillStyle=palette[p.role]||'#b7a285';ctx.fillRect(x+5,y+3,6,8);
 ctx.fillStyle='#e2bd94';ctx.fillRect(x+6,y+1,4,4);
 ctx.fillStyle='#3e3c31';ctx.fillRect(x+5,y+0,6,2);ctx.fillRect(x+5,y+11,2,3+step);ctx.fillRect(x+9,y+11,2,4-step);
 ctx.fillStyle='#2a322d';ctx.fillRect(x+6,y+4,1,1);ctx.fillRect(x+9,y+4,1,1);
}
return {create,restore,tick,personTick,whisper,interpret,BLUEPRINTS,site,drawBuilding,drawCitizen};
});
