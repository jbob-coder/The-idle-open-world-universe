/* GODSEED deterministic simulation. UMD: browser global + CommonJS. No external services. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GodseedSim=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const W=64,H=48,N=W*H;const T={GRASS:0,FOREST:1,WATER:2,STONE:3,BERRY:4,RUIN:5,MEADOW:6,CAMP:7,ROAD:8,VILLAGE:9,SHRINE:10};
const TILE_NAMES=['Grass','Forest','Water','Stone','Berry bush','Ancient ruin','Meadow','Shelter','Kingdom road','Village','Ancient shrine'];
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
const ORIGINS=[
 {name:'Lost Apprentice',past:'Once helped a traveling craftsperson.',focus:'crafting',curiosity:.64,caution:.43,diligence:.70},
 {name:'Village Exile',past:'Banished from a village after a strange omen.',focus:'survival',curiosity:.57,caution:.61,diligence:.55},
 {name:'Ruins Seeker',past:'Grew up collecting broken legends.',focus:'lore',curiosity:.80,caution:.31,diligence:.53},
 {name:'Wandering Scout',past:'Traveled the borderlands without a home.',focus:'scouting',curiosity:.72,caution:.57,diligence:.60},
 {name:'Wildland Survivor',past:'Survived seasons alone in the forest.',focus:'survival',curiosity:.53,caution:.67,diligence:.65}
];
const SKILLS=['survival','scouting','combat','crafting','lore'];
// Maximum three light-weight villagers. This is rule-driven life, not an online AI.
const PEOPLE=[
 {name:'Ira',role:'Apothecary',dx:5,dy:3,color:0},
 {name:'Toren',role:'Squire',dx:-7,dy:-3,color:1},
 {name:'Mera',role:'Rune Scholar',dx:10,dy:-5,color:2}
];
const LORE=[
 ['The Ashen Crown','A royal crown was hidden beneath the old kingdom.'],
 ['The Moonwell','A moonlit well once granted visions to the royal scribes.'],
 ['The Mossbound Oath','Oathkeepers once guarded a shrine in the deep woods.'],
 ['Buried Fire','Runesmiths sealed a chamber of ancient flame.'],
 ['The Last Cartographer','The royal mapmaker hid a path to lost knowledge.']
];
function progress(b){
 if(!b.background)b.background=ORIGINS[0].name;
 if(!b.originStory)b.originStory='The past is mostly forgotten.';
 if(!b.skills||typeof b.skills!=='object')b.skills={};
 if(!b.skillXP||typeof b.skillXP!=='object')b.skillXP={};
 for(const name of SKILLS){if(!Number.isFinite(b.skills[name])||b.skills[name]<0)b.skills[name]=0;if(!Number.isFinite(b.skillXP[name])||b.skillXP[name]<0)b.skillXP[name]=0;}
 if(!b.tactics||typeof b.tactics!=='object')b.tactics={dodge:0,parry:0,trapsAvoided:0,trapsTriggered:0};
}
function improve(s,name,amount=1){const b=s.bot;progress(b);if(!SKILLS.includes(name)||amount<=0)return false;
 b.skillXP[name]+=amount;let leveled=false,required=5+b.skills[name]*6;
 while(b.skillXP[name]>=required&&b.skills[name]<20){b.skillXP[name]-=required;b.skills[name]++;required=5+b.skills[name]*6;leveled=true;}
 if(leveled){event(s,name.toUpperCase()+' grew','Nim improved '+name+' through practice (rank '+b.skills[name]+').');remember(s,'Learned '+name+' '+b.skills[name]);}
 return leveled;}
function originForSeed(seed){return ORIGINS[(seed>>>0)%ORIGINS.length];}

function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function idx(x,y){return y*W+x;}
function inside(x,y){return x>=0&&x<W&&y>=0&&y<H;}
function rand(s){s.seed=(Math.imul(1664525,s.seed>>>0)+1013904223)>>>0;return s.seed/4294967296;}
function rint(s,n){return Math.floor(rand(s)*n)}
function randomNoise(seed,x,y){let h=(Math.imul(x+83,374761393)^Math.imul(y+57,668265263)^(seed>>>0))>>>0;h=Math.imul(h^(h>>>13),1274126177)>>>0;return ((h^(h>>>16))>>>0)/4294967296;}
function initPeople(s){
 const b=s.bot;
 return PEOPLE.map((p,i)=>{
  const ox=clamp(b.x+p.dx,1,W-2),oy=clamp(b.y+p.dy,1,H-2);
  let x=ox,y=oy;
  for(let radius=0;radius<=8&&!walkable(s,x,y);radius++){
   for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
    if(walkable(s,ox+dx,oy+dy)){x=ox+dx;y=oy+dy;break;}
   }
  }
  return {id:i+1,name:p.name,role:p.role,x,y,homeX:x,homeY:y,
   trust:22,mood:'wary',met:false,lastTalk:-1000,favorUntil:0,favorSpent:false,activity:'Patrolling',encounters:0};
 });
}
function nearPerson(s,x,y,max=1){return (s.npcs||[]).find(p=>Math.abs(p.x-x)+Math.abs(p.y-y)<=max)||null;}
function updatePeople(s){
 if(s.tick%12!==0)return;
 for(const p of s.npcs||[]){
  if(p.favorUntil<=s.tick&&p.mood==='hopeful')p.mood='calm';
  // One purposeful response per divine blessing, never direct player control.
  if(p.favorUntil>s.tick&&!p.favorSpent){
   p.favorSpent=true;
   if(p.role==='Apothecary'||p.role==='Herbalist'){
    let planted=0;
    for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){
     const nx=p.x+dx,ny=p.y+dy;
     if(inside(nx,ny)&&s.map[idx(nx,ny)]===T.GRASS){s.map[idx(nx,ny)]=T.BERRY;planted++;}
    }
    p.activity='Tending blessed herbs';
    event(s,'Apothecary answered',p.name+' tended '+planted+' new enchanted herb patches.','god');
   }else if(p.role==='Squire'){
    const before=s.enemies.length;
    s.enemies=s.enemies.filter(e=>Math.abs(e.x-p.x)+Math.abs(e.y-p.y)>4);
    p.activity='Guarding the old road';
    event(s,'Squire answered',p.name+' drove off '+(before-s.enemies.length)+' nearby beasts.','god');
   }else{
    // The scholar reveals one ruin without teleporting Nim or issuing orders.
    let nearest=-1,best=1e9;
    for(let j=0;j<N;j++)if(s.map[j]===T.RUIN&&!s.seen[j]){
     const d=Math.abs(j%W-p.x)+Math.abs(Math.floor(j/W)-p.y);
     if(d<best){nearest=j;best=d;}
    }
    if(nearest>=0)s.seen[nearest]=1;
    p.activity='Deciphering a prophecy';
    event(s,'Rune scholar answered',p.name+(nearest>=0?' revealed a distant ruin in a vision.':' deciphered an old prophecy.'),'god');
   }
   addMark(s,p.x,p.y,'inspire');
  }
  // Capped to three tiny local wandering agents; no global per-NPC path search.
  const directions=[[0,0],...DIRS], [dx,dy]=directions[rint(s,directions.length)];
  const nx=p.x+dx,ny=p.y+dy;
  if(walkable(s,nx,ny)&&Math.abs(nx-p.homeX)+Math.abs(ny-p.homeY)<=9&&
     !s.npcs.some(other=>other!==p&&other.x===nx&&other.y===ny)){
    p.x=nx;p.y=ny;
  }
  if(p.favorUntil<=s.tick)p.activity=p.role==='Apothecary'?'Collecting herbs':p.role==='Squire'?'Patrolling':'Studying runes';
 }
}
function meetPerson(s,p){
 const b=s.bot;if(!p||s.tick-p.lastTalk<100)return false;
 p.lastTalk=s.tick;p.met=true;p.encounters++;p.trust=clamp(p.trust+4,0,100);
 const divine=p.favorUntil>s.tick;
 let detail=p.name+' the '+p.role.toLowerCase()+' spoke with Nim.';
 if(divine||p.trust>=50){
  if(b.food<4){b.food+=2;detail+=' A helpful offering gave Nim two food.';}
  else {b.energy=clamp(b.energy+10,0,100);detail+=' Words of comfort restored energy.';}
 }else if(p.role==='Rune Scholar'||p.role==='Lorekeeper'){
  detail+=' They shared a legend of the forgotten kingdom.';
  improve(s,'lore',2);
 }else if(p.role==='Squire'){
  detail+=' They warned Nim about wolves on the old road.';
 }else if(p.role==='Apothecary'||p.role==='Herbalist'){
  detail+=' They taught Nim to recognize healing herbs.';
  improve(s,'survival',1);
 }
 b.thought=divine?'Someone feels strangely blessed.':'There are other lives in this world.';
 b.path=[];gain(s,3,'meeting '+p.name);improve(s,'lore',1);
 remember(s,'Met '+p.name+', the '+p.role.toLowerCase());
 event(s,'Encounter: '+p.name,detail,'event');addMark(s,p.x,p.y,'talk');
 return true;
}
function terrain(s){const out=new Array(N);const key=s.seed>>>0;for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 let n=0;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++)n+=randomNoise(key,Math.floor(x/7)+ox,Math.floor(y/7)+oy)*(ox===0&&oy===0?4:1);n/=12;
 const j=randomNoise(key^0x5511,x,y);let t=T.GRASS;
 if(n<.265)t=T.WATER;else if(n>.71)t=T.STONE;else if(n>.47&&j<.68)t=T.FOREST;else if(j<.105)t=T.BERRY;else if(j>.89)t=T.MEADOW;
 out[idx(x,y)]=t;
 }return out;}
function event(s,title,detail,type='event'){
 const e={tick:s.tick,title:String(title),detail:String(detail),type};s.log.unshift(e);if(s.log.length>45)s.log.length=45;
 if(type==='milestone'){s.faith=clamp(s.faith+3,0,50);s.milestones++;}
}
function create(seed=1234567){const s={version:1,seed:seed>>>0||1234567,tick:0,day:1,weather:'clear',weatherUntil:0,faith:18,milestones:0,
 map:[],seen:new Array(N).fill(0),enemies:[],npcs:[],shrinesVisited:[],nextEnemyId:1,log:[],camp:null,guide:null,marks:[],settings:{follow:true,speed:1},
 bot:{name:'Nim',x:Math.floor(W/2),y:Math.floor(H/2),level:1,xp:0,hp:24,maxHp:24,hunger:86,energy:83,attack:4,defense:1,food:2,wood:0,stone:0,tool:0,
 goal:'Awakening',thought:'Where am I?',target:null,path:[],actionDelay:0,fights:0,ruins:0,scars:0,steps:0,
 personality:{curiosity:0.68,caution:0.42,diligence:0.57},memory:[]}};
 const origin=originForSeed(s.seed);s.bot.background=origin.name;s.bot.originStory=origin.past;
 s.bot.personality={curiosity:origin.curiosity,caution:origin.caution,diligence:origin.diligence};
 progress(s.bot);s.bot.skills[origin.focus]=1;
 s.story={clues:[],completed:0};
 s.map=terrain(s);for(let y=s.bot.y-3;y<=s.bot.y+3;y++)for(let x=s.bot.x-3;x<=s.bot.x+3;x++)if(inside(x,y))s.map[idx(x,y)]=T.GRASS;
 s.map[idx(s.bot.x+2,s.bot.y)]=T.BERRY;s.map[idx(s.bot.x-2,s.bot.y)]=T.FOREST;s.map[idx(s.bot.x,s.bot.y-2)]=T.STONE;
 for(let i=0;i<10;i++){const x=5+rint(s,W-10),y=5+rint(s,H-10);if(Math.abs(x-s.bot.x)+Math.abs(y-s.bot.y)>8 && s.map[idx(x,y)]!==T.WATER)s.map[idx(x,y)]=T.RUIN;}
 // A light medieval-fantasy world: paths, villages and shrines as logical tiles.
 const addRoad=(x1,y1,x2,y2)=>{
  let x=x1,y=y1;
  while(x!==x2||y!==y2){
   if(inside(x,y)&&[T.GRASS,T.MEADOW].includes(s.map[idx(x,y)]))s.map[idx(x,y)]=T.ROAD;
   if(x!==x2)x+=x<x2?1:-1;else y+=y<y2?1:-1;
  }
 };
 const villageSites=[[s.bot.x+5,s.bot.y+3],[s.bot.x-7,s.bot.y-3]];
 for(const [x,y] of villageSites){
  addRoad(s.bot.x,s.bot.y,x,y);
  s.map[idx(x,y)]=T.VILLAGE;
 }
 for(const [x,y] of [[s.bot.x+10,s.bot.y-5],[s.bot.x-12,s.bot.y+7]]){
  s.map[idx(x,y)]=T.SHRINE;
 }
 s.npcs=initPeople(s);discover(s,s.bot.x,s.bot.y);event(s,'The Forgotten Kingdom',`Nim, a ${origin.name}, awakens in the enchanted borderlands of a fallen medieval kingdom. ${origin.past}`,'milestone');
 return s;}
function discover(s,x,y){let count=0;for(let oy=-3;oy<=3;oy++)for(let ox=-3;ox<=3;ox++){const xx=x+ox,yy=y+oy;if(!inside(xx,yy)||ox*ox+oy*oy>12)continue;const n=idx(xx,yy);if(!s.seen[n]){s.seen[n]=1;count++;}}return count;}
function remember(s,subject){let m=s.bot.memory;if(m[m.length-1]!==subject){m.push(subject);if(m.length>12)m.shift();}}
function gain(s,xp,why){const b=s.bot;b.xp+=xp;let need=10+b.level*8;while(b.xp>=need&&b.level<50){b.xp-=need;b.level++;b.maxHp+=4;b.hp=Math.min(b.maxHp,b.hp+7);b.attack+=1;if(b.level%2===0)b.defense+=1;event(s,'LEVEL '+b.level,'Nim has grown stronger through '+why+'.','milestone');remember(s,'Level '+b.level+' reached');need=10+b.level*8;}}
function walkable(s,x,y){return inside(x,y)&&s.map[idx(x,y)]!==T.WATER;}
function findPath(s,predicate){ // BFS: max 3,072 tiles; deterministic neighbor order, no per-frame pathfinding
 const b=s.bot,queue=new Int16Array(N),parents=new Int16Array(N);parents.fill(-2);const start=idx(b.x,b.y);let front=0,back=0;queue[back++]=start;parents[start]=-1;let found=-1;
 while(front<back){const cur=queue[front++],cx=cur%W,cy=(cur/W)|0;if(predicate(cx,cy,s.map[cur],cur)){found=cur;break;}
 for(const [dx,dy] of DIRS){let nx=cx+dx,ny=cy+dy;if(!walkable(s,nx,ny))continue;let n=idx(nx,ny);if(parents[n]!==-2)continue;parents[n]=cur;queue[back++]=n;}}
 if(found===-1)return null;const path=[];let cur=found;while(cur!==start&&cur!==-1){path.push([cur%W,(cur/W)|0]);cur=parents[cur];}path.reverse();return path;
}
function nearestEnemy(s){const b=s.bot;let best=null,dist=1e9;for(const e of s.enemies){const d=Math.abs(e.x-b.x)+Math.abs(e.y-b.y);if(d<dist){best=e;dist=d;}}return {e:best,dist};}
function setGoal(s,goal,thought,path){const b=s.bot;b.goal=goal;b.thought=thought;b.path=path||[];}
function plan(s){const b=s.bot;const enemy=nearestEnemy(s);
 if(enemy.e&&enemy.dist<=1){if(b.hp< b.maxHp*.35 || b.energy<6){setGoal(s,'Escape','That beast is too dangerous!');return;}setGoal(s,'Defend','The beast is right beside me!');return;}
 if(b.hp<b.maxHp*.35){setGoal(s,'Recover','I need to recover.');return;}
 if(b.hunger<37&&b.food>0){setGoal(s,'Eat','My stomach is growling.');return;}
 if(b.energy<=28){setGoal(s,'Rest','My feet cannot go on.');return;}
 if(b.hunger<64 && b.food<=1){const p=findPath(s,(x,y,t)=>t===T.BERRY);if(p){setGoal(s,'Forage','Find something edible.',p);return;}}
 if(!s.camp){if(b.wood>=5&&b.stone>=3){setGoal(s,'Build','I could make a shelter.');return;}
 if(b.wood<5){let p=findPath(s,(x,y,t)=>t===T.FOREST);if(p){setGoal(s,'Gather wood','I need timber for shelter.',p);return;}}
 if(b.stone<3){let p=findPath(s,(x,y,t)=>t===T.STONE);if(p){setGoal(s,'Mine stone','Stones would make a strong hearth.',p);return;}}}
 if(s.camp&&b.tool===0){
 if(b.wood<2){const p=findPath(s,(x,y,t)=>t===T.FOREST);if(p){setGoal(s,'Gather wood','Now I need timber for a tool.',p);return;}}
 if(b.stone<2){const p=findPath(s,(x,y,t)=>t===T.STONE);if(p){setGoal(s,'Mine stone','Now I need stone for a tool.',p);return;}}
 if(b.wood>=2&&b.stone>=2){setGoal(s,'Craft','A better tool will help me.');return;}}
 if(b.hunger<78&&b.food<3){let p=findPath(s,(x,y,t)=>t===T.BERRY);if(p){setGoal(s,'Forage','I should pack some food.',p);return;}}
 if(s.guide&&s.guide.ticks>0){const gx=s.guide.x,gy=s.guide.y;if(!walkable(s,gx,gy)){s.guide=null;}else{const p=findPath(s,(x,y)=>x===gx&&y===gy);if(p){setGoal(s,'Follow omen','Something calls to me from afar.',p);return;}s.guide=null;}}
 if(b.energy<45){setGoal(s,'Rest','The day has been long.');return;}
 if(b.hunger>55&&b.energy>55&&Array.isArray(s.shrinesVisited)){
  const route=findPath(s,(x,y,t)=>t===T.SHRINE&&!s.shrinesVisited.includes(idx(x,y)));
  if(route&&route.length){setGoal(s,'Study shrine','Ancient magic sleeps in these stones.',route);return;}
 }
 // Nim may choose to socialize, but the god never steers the traveler directly.
 if(b.hunger>44&&b.energy>45){
  const npc=(s.npcs||[]).find(p=>{
   const d=Math.abs(p.x-b.x)+Math.abs(p.y-b.y);
   return d<=8 && (d<=1||s.seen[idx(p.x,p.y)]) &&
    s.tick-p.lastTalk>=100 && (!p.met||p.favorUntil>s.tick);
  });
  if(npc){
   const path=findPath(s,(x,y)=>Math.abs(x-npc.x)+Math.abs(y-npc.y)<=1);
   if(path){setGoal(s,'Meet traveler','I wonder what '+npc.name+' knows.',path);return;}
  }
 }
 // Discovered ruins are meaningful goals; pursue unseen ones as exploration grows.
 if(b.energy>45&&b.hunger>40){const p=findPath(s,(x,y,t,n)=>t===T.RUIN&&s.seen[n]);if(p){setGoal(s,'Study ruins','There is something ancient here.',p);return;}}
 if(s.story&&Array.isArray(s.story.clues)){
 const rumor=s.story.clues.find(q=>!q.solved);
 if(rumor&&b.energy>45&&b.hunger>55){const path=findPath(s,(x,y)=>x===rumor.x&&y===rumor.y);if(path){setGoal(s,'Follow rumor','The '+rumor.title+' may lead to something.',path);return;}}
 }
 const p=findPath(s,(x,y,t,n)=>!s.seen[n]);if(p){setGoal(s,'Explore','What lies beyond the known paths?',p);return;}
 const q=findPath(s,(x,y,t)=>t===T.FOREST||t===T.STONE||t===T.BERRY);setGoal(s,'Wander','I will make another journey.',q||[]);
}
function addMark(s,x,y,kind){s.marks.push({x,y,kind,until:s.tick+10});if(s.marks.length>12)s.marks.shift();}
function botMove(s,x,y){const b=s.bot;if(!walkable(s,x,y))return; b.x=x;b.y=y;b.steps++;let d=discover(s,x,y);
 if(d){b._discovered=(b._discovered||0)+d;if(b._discovered>=38){b._discovered-=38;gain(s,3,'exploration');s.faith=clamp(s.faith+1,0,50);improve(s,'scouting',2);}}
 if(s.guide&&x===s.guide.x&&y===s.guide.y){event(s,'Omen followed','Nim reached the place you pointed to.','milestone');s.guide=null;}
}
function botAct(s){const b=s.bot;const near=nearestEnemy(s);
 if(near.e&&near.dist<=1&&b.goal!=='Escape'){if(b.actionDelay>0)return;const e=near.e;const dmg=Math.max(1,b.attack+b.tool*2+rint(s,4)-e.defense);e.hp-=dmg;b.energy=clamp(b.energy-3,0,100);b.actionDelay=2;addMark(s,e.x,e.y,'hit');
 b.thought='I must survive this fight.';
 if(e.hp<=0){s.enemies=s.enemies.filter(z=>z!==e);b.fights++;b.personality.caution=clamp(b.personality.caution-.006,.1,.9);improve(s,'combat',4);gain(s,10,'defeating '+e.type);if(rand(s)<.5)b.food++;event(s,'Creature defeated','Nim overcame a '+e.type+'.','event');remember(s,'Defeated a '+e.type);}
 return;}
 if(b.goal==='Escape'&&near.e){const e=near.e;let directions=DIRS.map(([dx,dy])=>[b.x+dx,b.y+dy]).filter(([x,y])=>walkable(s,x,y)&&!s.enemies.some(q=>q.x===x&&q.y===y));directions.sort((a,c)=>(Math.abs(c[0]-e.x)+Math.abs(c[1]-e.y))-(Math.abs(a[0]-e.x)+Math.abs(a[1]-e.y)));if(directions.length){botMove(s,...directions[0]);b.energy=clamp(b.energy-2,0,100);}else{b.hp-=1;} b.personality.caution=clamp(b.personality.caution+.001,.1,.9);b.path=[];return;}
 if(b.path&&b.path.length){const [x,y]=b.path.shift();if(!walkable(s,x,y)){b.path=[];return;}botMove(s,x,y);return;}
 if(b.goal==='Meet traveler'){
  const npc=nearPerson(s,b.x,b.y,1);
  if(npc&&meetPerson(s,npc))return;
  b.path=[];return;
 }
 const tile=s.map[idx(b.x,b.y)];
 if(b.goal==='Eat'){b.food--;improve(s,'survival',1);b.hunger=clamp(b.hunger+37,0,100);b.hp=clamp(b.hp+2,0,b.maxHp);b.thought='That was needed.';return;}
 if(b.goal==='Recover'||b.goal==='Rest'){b.energy=clamp(b.energy+(s.camp&&Math.abs(b.x-s.camp.x)+Math.abs(b.y-s.camp.y)<3?17:12),0,100);b.hp=clamp(b.hp+(s.camp?3:2),0,b.maxHp);b.hunger=clamp(b.hunger-1,0,100);return;}
 if(b.goal==='Build'){s.map[idx(b.x,b.y)]=T.CAMP;s.camp={x:b.x,y:b.y};b.wood-=5;b.stone-=3;b.energy=clamp(b.energy-8,0,100);event(s,'First camp','Nim raised a canvas shelter and stone hearth at '+b.x+', '+b.y+'.','milestone');remember(s,'Built a home');improve(s,'crafting',5);return;}
 if(b.goal==='Craft'){b.wood-=2;b.stone-=2;b.tool=1;gain(s,8,'crafting');event(s,'New invention','Nim crafted a stone hatchet.','milestone');remember(s,'Crafted a stone hatchet');improve(s,'crafting',5);return;}
 if(tile===T.SHRINE&&!s.shrinesVisited.includes(idx(b.x,b.y))){
  s.shrinesVisited.push(idx(b.x,b.y));
  improve(s,'lore',4);gain(s,9,'discovering a shrine');
  s.faith=clamp(s.faith+4,0,50);
  event(s,'Sacred shrine','Nim studied ancient runes and the god gained four Faith.','milestone');
  remember(s,'Visited shrine '+s.shrinesVisited.length);
  return;
 }
 if(tile===T.BERRY){b.food+=2+rint(s,2);s.map[idx(b.x,b.y)]=T.GRASS;gain(s,2,'foraging');improve(s,'survival',2);b.thought='These berries will last a little while.';return;}
 if(tile===T.FOREST&&b.goal==='Gather wood'){b.wood+=b.tool?3:2;s.map[idx(b.x,b.y)]=T.GRASS;gain(s,2,'woodcutting');improve(s,'survival',2);return;}
 if(tile===T.STONE&&b.goal==='Mine stone'){b.stone+=b.tool?3:2;s.map[idx(b.x,b.y)]=T.GRASS;gain(s,2,'mining');improve(s,'survival',2);return;}
 if(tile===T.RUIN){
  // Exploration awards vary; clues lead to still-existing ruins and persist in v1 saves.
  s.map[idx(b.x,b.y)]=T.MEADOW;b.ruins++;
  b.personality.curiosity=clamp(b.personality.curiosity+.015,.1,.95);
  const hazard=rand(s)<.36;
  if(hazard){
   const detected=rand(s)<clamp(.19+b.personality.caution*.42+b.skills.scouting*.045,0,.88);
   if(detected){b.tactics.trapsAvoided++;improve(s,'scouting',3);event(s,'Trap spotted','Nim recognized an ancient pressure-stone beneath the moss.');}
   else{const dmg=2+rint(s,4);b.hp-=dmg;b.tactics.trapsTriggered++;event(s,'Ruin trap','A concealed snare injured Nim for '+dmg+'.','danger');addMark(s,b.x,b.y,'hurt');}
  }
  if(s.story&&Array.isArray(s.story.clues)){
    const solved=s.story.clues.find(q=>!q.solved&&q.x===b.x&&q.y===b.y);
    if(solved){solved.solved=true;s.story.completed++;gain(s,8,'following a rumor');event(s,'Rumor confirmed',solved.title+' was true!','milestone');}
    if(s.story.clues.length<10){
     // Choose one reachable unvisited ruin; only a few ruin discoveries invoke BFS.
     const target=findPath(s,(x,y,t)=>t===T.RUIN);
     if(target&&target.length){const [tx,ty]=target[target.length-1];
      if(!s.story.clues.some(q=>q.x===tx&&q.y===ty)){
       const [title,detail]=LORE[(b.ruins-1)%LORE.length];s.story.clues.push({title,detail,x:tx,y:ty,solved:false});
       event(s,'Whispered legend',title+': '+detail);
      }
     }
    }
  }
  improve(s,'lore',5);gain(s,18,'exploring ruins');
  event(s,'Ancient runes','Nim deciphered a monument of the lost kingdom.','milestone');remember(s,'Found ruin #'+b.ruins);return;
 }
 // Deterministic recovery for fully explored or depleted worlds; movement stays bounded.
 b.energy=clamp(b.energy+5,0,100);const p=findPath(s,(x,y,t)=>t===T.FOREST||t===T.BERRY||t===T.RUIN);if(p)b.path=p;
}
function revive(s){const b=s.bot;if(b.hp>0)return;
 b.scars++;b.hp=Math.max(10,Math.round(b.maxHp*.65));b.hunger=65;b.energy=65;b.x=s.camp?s.camp.x:(W>>1);b.y=s.camp?s.camp.y:(H>>1);b.path=[];s.enemies=[];discover(s,b.x,b.y);remember(s,'Survived fall #'+b.scars);event(s,'Life restored','The god returns Nim from the edge of death.','milestone');
}
function updateEnemies(s){const b=s.bot;
 if(s.enemies.length<5&&s.tick%53===0){for(let i=0;i<18;i++){const x=clamp(b.x+rint(s,19)-9,1,W-2),y=clamp(b.y+rint(s,17)-8,1,H-2),d=Math.abs(x-b.x)+Math.abs(y-b.y);if(d>5&&d<14&&walkable(s,x,y)&&(!s.camp||Math.abs(x-s.camp.x)+Math.abs(y-s.camp.y)>3)&&!s.enemies.some(e=>e.x===x&&e.y===y)){
 const tougher=s.day>4&&rand(s)<.35;s.enemies.push({id:s.nextEnemyId++,type:tougher?'Boar':'Wolf',x,y,hp:tougher?17:11,defense:tougher?2:0,attack:tougher?4:2,cooldown:1});break;}}}
 for(const e of s.enemies){if(e.cooldown>0){e.cooldown--;continue;}const d=Math.abs(e.x-b.x)+Math.abs(e.y-b.y);
 if(d===1){
  let dmg=Math.max(1,e.attack+rint(s,3)-b.defense);
  const dodgeChance=clamp(.08+b.personality.caution*.25+b.skills.scouting*.022,0,.58);
  const parryChance=clamp(.09+b.skills.combat*.03+(b.tool?.06:0),0,.55);
  const roll=rand(s);let result='hurt';
  if(b.energy>=8&&roll<dodgeChance){dmg=0;b.energy-=3;b.tactics.dodge++;result='evade';improve(s,'scouting',1);b.thought='I saw the attack coming. I dodged.';}
  else if(b.energy>=5&&roll<dodgeChance+parryChance){dmg=Math.max(0,Math.floor(dmg*.5));b.energy-=2;b.tactics.parry++;result='parry';improve(s,'combat',1);b.thought='I turned the blow aside.';}
  b.hp-=dmg;e.cooldown=3;addMark(s,b.x,b.y,result);
  if(s.tick%8===0)event(s,result==='evade'?'Attack evaded':result==='parry'?'Attack parried':'Under attack',result==='evade'?'Nim dodged the '+e.type+'.':result==='parry'?'Nim blocked part of a '+e.type+' attack.':'A '+e.type+' struck Nim for '+dmg+' health.',dmg>0?'danger':'event');
 }
 else if(d<6&&s.tick%3===0){let options=DIRS.map(([dx,dy])=>[e.x+dx,e.y+dy]).filter(([x,y])=>walkable(s,x,y)&&!(x===b.x&&y===b.y)&&!s.enemies.some(o=>o!==e&&o.x===x&&o.y===y));options.sort((a,c)=>(Math.abs(a[0]-b.x)+Math.abs(a[1]-b.y))-(Math.abs(c[0]-b.x)+Math.abs(c[1]-b.y)));if(options.length){e.x=options[0][0];e.y=options[0][1];}e.cooldown=1;}
 }
 revive(s);
}
function tick(s){s.tick++;revive(s);if(s.tick%240===0){s.day++;event(s,'Day '+s.day,'The world turns and Nim continues living.');}
 if(s.weatherUntil&&s.tick>=s.weatherUntil){s.weather='clear';s.weatherUntil=0;}
 if(s.tick%12===0){const b=s.bot;b.hunger=clamp(b.hunger-1,0,100);b.energy=clamp(b.energy-1,0,100);if(b.hunger===0)b.hp-=1;}
 if(s.tick%72===0)s.faith=clamp(s.faith+1,0,50);
 if(s.tick%93===0){for(let i=0;i<3;i++){let x=rint(s,W),y=rint(s,H),n=idx(x,y);if(s.map[n]===T.GRASS)s.map[n]=T.BERRY;}}
 if(s.guide){s.guide.ticks--;if(s.guide.ticks<=0)s.guide=null;}
 s.marks=s.marks.filter(z=>z.until>s.tick);
 // Planning is deliberate: every movement step or completed action chooses what matters now.
 const b=s.bot;if(b.actionDelay>0)b.actionDelay--;
 if(s.tick%2===0){plan(s);botAct(s);updateEnemies(s);}
 updatePeople(s);
 return s;}
const COST={bless:4,gift:5,bloom:6,guide:3,storm:8,inspire:5};
function power(s,kind,x,y){if(!Object.prototype.hasOwnProperty.call(COST,kind))return {ok:false,why:'Unknown power'};
 x=Math.floor(Number(x));y=Math.floor(Number(y));if(!inside(x,y))return {ok:false,why:'Choose a place on the map'};
 if(s.faith<COST[kind])return {ok:false,why:'Not enough Faith'};
 const b=s.bot;if(kind==='guide'&&!walkable(s,x,y))return {ok:false,why:'Nim cannot walk on water'};
 const citizen=kind==='inspire'&&s.seen[idx(x,y)]?nearPerson(s,x,y,1):null;
 if(kind==='inspire'&&!citizen)return {ok:false,why:'Choose a revealed traveler nearby'};
 s.faith-=COST[kind];if(kind==='bless'){b.hp=clamp(b.hp+12,0,b.maxHp);b.energy=clamp(b.energy+28,0,100);event(s,'Divine blessing','A warm light restores Nim.','god');addMark(s,b.x,b.y,'bless');}
 else if(kind==='gift'){b.food+=3;b.hunger=clamp(b.hunger+10,0,100);event(s,'Gift of sustenance','Three portions appear in Nim’s pack.','god');addMark(s,b.x,b.y,'gift');}
 else if(kind==='bloom'){let grows=0;for(let i=0;i<55&&grows<9;i++){let nx=x+rint(s,11)-5,ny=y+rint(s,11)-5;if(inside(nx,ny)&&s.map[idx(nx,ny)]===T.GRASS){s.map[idx(nx,ny)]=T.BERRY;grows++;}}
 s.weather='rain';s.weatherUntil=s.tick+120;event(s,'Rain of life',grows+' food bushes have sprouted.','god');addMark(s,x,y,'bloom');}
 else if(kind==='guide'){s.guide={x,y,ticks:300};event(s,'A divine whisper','Nim senses a direction in the wind.','god');addMark(s,x,y,'guide');}
 else if(kind==='inspire'){
  citizen.trust=clamp(citizen.trust+30,0,100);citizen.mood='hopeful';
  citizen.favorUntil=s.tick+240;citizen.favorSpent=false;citizen.activity='Answering an omen';
  event(s,'Divine inspiration',citizen.name+' witnesses an omen from the heavens and may offer Nim aid at their next meeting.','god');
  addMark(s,citizen.x,citizen.y,'inspire');
 }
 else if(kind==='storm'){let struck=0;s.enemies=s.enemies.filter(e=>{const d=Math.abs(e.x-x)+Math.abs(e.y-y);if(d<=3){struck++;return false;}return true;});event(s,'Judgment',struck?struck+' nearby hostile creatures dispersed.':'Lightning struck the empty earth.','god');addMark(s,x,y,'storm');}
 return {ok:true,kind,cost:COST[kind]};}
function validate(s){if(!s||s.version!==1||!Array.isArray(s.map)||s.map.length!==N||!Array.isArray(s.seen)||s.seen.length!==N||!s.bot)return false;
 const b=s.bot;return Number.isInteger(b.x)&&Number.isInteger(b.y)&&inside(b.x,b.y)&&Number.isFinite(b.level)&&b.level>=1&&b.level<=50&&Number.isFinite(s.tick)&&s.tick>=0&&Number.isInteger(s.seed)&&s.map.every(t=>Number.isInteger(t)&&t>=0&&t<=T.SHRINE)&&s.seen.every(t=>t===0||t===1)&&Array.isArray(s.enemies)&&s.enemies.length<=10&&(!s.npcs||(Array.isArray(s.npcs)&&s.npcs.length<=3&&s.npcs.every(p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&inside(p.x,p.y))));}
function serialize(s){const copy=JSON.parse(JSON.stringify(s));copy.bot.path=[];copy.marks=[];return JSON.stringify(copy);}
function restore(raw){try{const s=typeof raw==='string'?JSON.parse(raw):JSON.parse(JSON.stringify(raw));if(!validate(s))return null;s.bot.path=[];s.bot.actionDelay=0;s.marks=[];s.settings={speed:1,follow:true};s.bot.personality=s.bot.personality||{curiosity:.6,caution:.4,diligence:.5};
 progress(s.bot);
 // Migration: v0.1/v0.2 saves had no inhabitants. Keep old save schema intact.
 s.npcs=Array.isArray(s.npcs)?s.npcs.slice(0,3):initPeople(s);
 s.npcs=s.npcs.filter(p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&walkable(s,p.x,p.y)).map(p=>({
  id:clamp(Number(p.id)||1,1,3),name:String(p.name||'Traveler').slice(0,32),
  role:String(p.role||'Wanderer').slice(0,32),x:p.x,y:p.y,
  homeX:inside(p.homeX,p.homeY)?p.homeX:p.x,
  homeY:inside(p.homeX,p.homeY)?p.homeY:p.y,
  trust:clamp(Number(p.trust)||0,0,100),
  mood:['wary','calm','hopeful'].includes(p.mood)?p.mood:'calm',
  met:!!p.met,lastTalk:Number.isFinite(p.lastTalk)?p.lastTalk:-1000,
  favorUntil:Number.isFinite(p.favorUntil)?p.favorUntil:0,favorSpent:!!p.favorSpent,activity:String(p.activity||'Patrolling').slice(0,48),encounters:clamp(Number(p.encounters)||0,0,10000)
 }));
 s.shrinesVisited=Array.isArray(s.shrinesVisited)?s.shrinesVisited.filter(n=>Number.isInteger(n)&&n>=0&&n<N).slice(0,8):[];
 s.story=s.story&&typeof s.story==='object'&&Array.isArray(s.story.clues)?s.story:{clues:[],completed:0};
 s.story.clues=s.story.clues.slice(0,10).filter(q=>q&&typeof q.title==='string'&&inside(q.x,q.y));
 s.story.completed=clamp(Number(s.story.completed)||0,0,10);s.bot.memory=Array.isArray(s.bot.memory)?s.bot.memory.slice(-12):[];s.log=Array.isArray(s.log)?s.log.slice(0,45):[];s.guide=null;return s;}catch(e){return null;}}
return {W,H,N,T,COST,TILE_NAMES,ORIGINS,SKILLS,PEOPLE,create,tick,power,findPath,walkable,idx,inside,serialize,restore,validate,gain,plan,improve,initPeople};
});
