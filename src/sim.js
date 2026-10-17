/* GODSEED deterministic simulation. UMD: browser global + CommonJS. No external services. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GodseedSim=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const W=64,H=48,N=W*H;const T={GRASS:0,FOREST:1,WATER:2,STONE:3,BERRY:4,RUIN:5,MEADOW:6,CAMP:7};
const TILE_NAMES=['Grass','Forest','Water','Stone','Berry bush','Ancient ruin','Meadow','Shelter'];
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
function clamp(n,a,b){return Math.max(a,Math.min(b,n));}
function idx(x,y){return y*W+x;}
function inside(x,y){return x>=0&&x<W&&y>=0&&y<H;}
function rand(s){s.seed=(Math.imul(1664525,s.seed>>>0)+1013904223)>>>0;return s.seed/4294967296;}
function rint(s,n){return Math.floor(rand(s)*n)}
function randomNoise(seed,x,y){let h=(Math.imul(x+83,374761393)^Math.imul(y+57,668265263)^(seed>>>0))>>>0;h=Math.imul(h^(h>>>13),1274126177)>>>0;return ((h^(h>>>16))>>>0)/4294967296;}
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
 map:[],seen:new Array(N).fill(0),enemies:[],nextEnemyId:1,log:[],camp:null,guide:null,marks:[],settings:{follow:true,speed:1},
 bot:{name:'Nim',x:Math.floor(W/2),y:Math.floor(H/2),level:1,xp:0,hp:24,maxHp:24,hunger:86,energy:83,attack:4,defense:1,food:2,wood:0,stone:0,tool:0,
 goal:'Awakening',thought:'Where am I?',target:null,path:[],actionDelay:0,fights:0,ruins:0,scars:0,steps:0,
 personality:{curiosity:0.68,caution:0.42,diligence:0.57},memory:[]}};
 s.map=terrain(s);for(let y=s.bot.y-3;y<=s.bot.y+3;y++)for(let x=s.bot.x-3;x<=s.bot.x+3;x++)if(inside(x,y))s.map[idx(x,y)]=T.GRASS;
 s.map[idx(s.bot.x+2,s.bot.y)]=T.BERRY;s.map[idx(s.bot.x-2,s.bot.y)]=T.FOREST;s.map[idx(s.bot.x,s.bot.y-2)]=T.STONE;
 for(let i=0;i<10;i++){const x=5+rint(s,W-10),y=5+rint(s,H-10);if(Math.abs(x-s.bot.x)+Math.abs(y-s.bot.y)>8 && s.map[idx(x,y)]!==T.WATER)s.map[idx(x,y)]=T.RUIN;}
 discover(s,s.bot.x,s.bot.y);event(s,'A spark awakens','Nim opens their eyes in an unfamiliar world.','milestone');
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
 // Discovered ruins are meaningful goals; pursue unseen ones as exploration grows.
 if(b.energy>45&&b.hunger>40){const p=findPath(s,(x,y,t,n)=>t===T.RUIN&&s.seen[n]);if(p){setGoal(s,'Study ruins','There is something ancient here.',p);return;}}
 const p=findPath(s,(x,y,t,n)=>!s.seen[n]);if(p){setGoal(s,'Explore','What lies beyond the known paths?',p);return;}
 const q=findPath(s,(x,y,t)=>t===T.FOREST||t===T.STONE||t===T.BERRY);setGoal(s,'Wander','I will make another journey.',q||[]);
}
function addMark(s,x,y,kind){s.marks.push({x,y,kind,until:s.tick+10});if(s.marks.length>12)s.marks.shift();}
function botMove(s,x,y){const b=s.bot;if(!walkable(s,x,y))return; b.x=x;b.y=y;b.steps++;let d=discover(s,x,y);
 if(d){b._discovered=(b._discovered||0)+d;if(b._discovered>=38){b._discovered-=38;gain(s,3,'exploration');s.faith=clamp(s.faith+1,0,50);}}
 if(s.guide&&x===s.guide.x&&y===s.guide.y){event(s,'Omen followed','Nim reached the place you pointed to.','milestone');s.guide=null;}
}
function botAct(s){const b=s.bot;const near=nearestEnemy(s);
 if(near.e&&near.dist<=1&&b.goal!=='Escape'){if(b.actionDelay>0)return;const e=near.e;const dmg=Math.max(1,b.attack+b.tool*2+rint(s,4)-e.defense);e.hp-=dmg;b.energy=clamp(b.energy-3,0,100);b.actionDelay=2;addMark(s,e.x,e.y,'hit');
 b.thought='I must survive this fight.';
 if(e.hp<=0){s.enemies=s.enemies.filter(z=>z!==e);b.fights++;b.personality.caution=clamp(b.personality.caution-.006,.1,.9);gain(s,10,'defeating '+e.type);if(rand(s)<.5)b.food++;event(s,'Creature defeated','Nim overcame a '+e.type+'.','event');remember(s,'Defeated a '+e.type);}
 return;}
 if(b.goal==='Escape'&&near.e){const e=near.e;let directions=DIRS.map(([dx,dy])=>[b.x+dx,b.y+dy]).filter(([x,y])=>walkable(s,x,y)&&!s.enemies.some(q=>q.x===x&&q.y===y));directions.sort((a,c)=>(Math.abs(c[0]-e.x)+Math.abs(c[1]-e.y))-(Math.abs(a[0]-e.x)+Math.abs(a[1]-e.y)));if(directions.length){botMove(s,...directions[0]);b.energy=clamp(b.energy-2,0,100);}else{b.hp-=1;} b.personality.caution=clamp(b.personality.caution+.001,.1,.9);b.path=[];return;}
 if(b.path&&b.path.length){const [x,y]=b.path.shift();if(!walkable(s,x,y)){b.path=[];return;}botMove(s,x,y);return;}
 const tile=s.map[idx(b.x,b.y)];
 if(b.goal==='Eat'){b.food--;b.hunger=clamp(b.hunger+37,0,100);b.hp=clamp(b.hp+2,0,b.maxHp);b.thought='That was needed.';return;}
 if(b.goal==='Recover'||b.goal==='Rest'){b.energy=clamp(b.energy+(s.camp&&Math.abs(b.x-s.camp.x)+Math.abs(b.y-s.camp.y)<3?17:12),0,100);b.hp=clamp(b.hp+(s.camp?3:2),0,b.maxHp);b.hunger=clamp(b.hunger-1,0,100);return;}
 if(b.goal==='Build'){s.map[idx(b.x,b.y)]=T.CAMP;s.camp={x:b.x,y:b.y};b.wood-=5;b.stone-=3;b.energy=clamp(b.energy-8,0,100);event(s,'First shelter','Nim built a small shelter at '+b.x+', '+b.y+'.','milestone');remember(s,'Built a home');return;}
 if(b.goal==='Craft'){b.wood-=2;b.stone-=2;b.tool=1;gain(s,8,'crafting');event(s,'New invention','Nim crafted a stone hatchet.','milestone');remember(s,'Crafted a stone hatchet');return;}
 if(tile===T.BERRY){b.food+=2+rint(s,2);s.map[idx(b.x,b.y)]=T.GRASS;gain(s,2,'foraging');b.thought='These berries will last a little while.';return;}
 if(tile===T.FOREST&&b.goal==='Gather wood'){b.wood+=b.tool?3:2;s.map[idx(b.x,b.y)]=T.GRASS;gain(s,2,'woodcutting');return;}
 if(tile===T.STONE&&b.goal==='Mine stone'){b.stone+=b.tool?3:2;s.map[idx(b.x,b.y)]=T.GRASS;gain(s,2,'mining');return;}
 if(tile===T.RUIN){s.map[idx(b.x,b.y)]=T.MEADOW;b.ruins++;b.personality.curiosity=clamp(b.personality.curiosity+.015,.1,.95);gain(s,18,'exploring ruins');event(s,'Ancient knowledge','Nim decoded a forgotten stone monument.','milestone');remember(s,'Found ruin #'+b.ruins);return;}
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
 if(d===1){const dmg=Math.max(1,e.attack+rint(s,3)-b.defense);b.hp-=dmg;e.cooldown=3;addMark(s,b.x,b.y,'hurt');if(s.tick%8===0)event(s,'Under attack','A '+e.type+' struck Nim for '+dmg+' health.','danger');}
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
 return s;}
const COST={bless:4,gift:5,bloom:6,guide:3,storm:8};
function power(s,kind,x,y){if(!Object.prototype.hasOwnProperty.call(COST,kind))return {ok:false,why:'Unknown power'};
 x=Math.floor(Number(x));y=Math.floor(Number(y));if(!inside(x,y))return {ok:false,why:'Choose a place on the map'};
 if(s.faith<COST[kind])return {ok:false,why:'Not enough Faith'};
 const b=s.bot;if(kind==='guide'&&!walkable(s,x,y))return {ok:false,why:'Nim cannot walk on water'};
 s.faith-=COST[kind];if(kind==='bless'){b.hp=clamp(b.hp+12,0,b.maxHp);b.energy=clamp(b.energy+28,0,100);event(s,'Divine blessing','A warm light restores Nim.','god');addMark(s,b.x,b.y,'bless');}
 else if(kind==='gift'){b.food+=3;b.hunger=clamp(b.hunger+10,0,100);event(s,'Gift of sustenance','Three portions appear in Nim’s pack.','god');addMark(s,b.x,b.y,'gift');}
 else if(kind==='bloom'){let grows=0;for(let i=0;i<55&&grows<9;i++){let nx=x+rint(s,11)-5,ny=y+rint(s,11)-5;if(inside(nx,ny)&&s.map[idx(nx,ny)]===T.GRASS){s.map[idx(nx,ny)]=T.BERRY;grows++;}}
 s.weather='rain';s.weatherUntil=s.tick+120;event(s,'Rain of life',grows+' food bushes have sprouted.','god');addMark(s,x,y,'bloom');}
 else if(kind==='guide'){s.guide={x,y,ticks:300};event(s,'A divine whisper','Nim senses a direction in the wind.','god');addMark(s,x,y,'guide');}
 else if(kind==='storm'){let struck=0;s.enemies=s.enemies.filter(e=>{const d=Math.abs(e.x-x)+Math.abs(e.y-y);if(d<=3){struck++;return false;}return true;});event(s,'Judgment',struck?struck+' nearby hostile creatures dispersed.':'Lightning struck the empty earth.','god');addMark(s,x,y,'storm');}
 return {ok:true,kind,cost:COST[kind]};}
function validate(s){if(!s||s.version!==1||!Array.isArray(s.map)||s.map.length!==N||!Array.isArray(s.seen)||s.seen.length!==N||!s.bot)return false;
 const b=s.bot;return Number.isInteger(b.x)&&Number.isInteger(b.y)&&inside(b.x,b.y)&&Number.isFinite(b.level)&&b.level>=1&&b.level<=50&&Number.isFinite(s.tick)&&s.tick>=0&&Number.isInteger(s.seed)&&s.map.every(t=>Number.isInteger(t)&&t>=0&&t<=T.CAMP)&&s.seen.every(t=>t===0||t===1)&&Array.isArray(s.enemies)&&s.enemies.length<=10;}
function serialize(s){const copy=JSON.parse(JSON.stringify(s));copy.bot.path=[];copy.marks=[];return JSON.stringify(copy);}
function restore(raw){try{const s=typeof raw==='string'?JSON.parse(raw):JSON.parse(JSON.stringify(raw));if(!validate(s))return null;s.bot.path=[];s.bot.actionDelay=0;s.marks=[];s.settings={speed:1,follow:true};s.bot.personality=s.bot.personality||{curiosity:.6,caution:.4,diligence:.5};s.bot.memory=Array.isArray(s.bot.memory)?s.bot.memory.slice(-12):[];s.log=Array.isArray(s.log)?s.log.slice(0,45):[];s.guide=null;return s;}catch(e){return null;}}
return {W,H,N,T,COST,TILE_NAMES,create,tick,power,findPath,walkable,idx,inside,serialize,restore,validate,gain,plan};
});
