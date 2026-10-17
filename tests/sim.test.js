const assert=require('node:assert/strict');
const test=require('node:test');
const S=require('../src/sim.js');
test('new world is 64x48, seeded, and safely playable',()=>{const x=S.create(1955);assert.equal(x.map.length,S.N);assert.equal(x.seen.length,S.N);assert.ok(S.walkable(x,x.bot.x,x.bot.y));assert.equal(x.bot.level,1);assert.equal(x.camp,null);assert.ok(x.seen.some(v=>v===1));});
test('world generation is reproducible and local',()=>{const a=S.create(3456),b=S.create(3456);assert.deepEqual(a.map,b.map);for(let i=0;i<100;i++){S.tick(a);S.tick(b)}assert.equal(S.serialize(a),S.serialize(b));});
test('God powers charge Faith, correctly affect Nim, and refuse insufficient resources',()=>{const x=S.create(1122);x.faith=20;x.bot.hp=6;x.bot.energy=10;let a=S.power(x,'bless',x.bot.x,x.bot.y);assert.equal(a.ok,true);assert.equal(x.bot.hp,18);assert.equal(x.faith,16);assert.ok(x.bot.energy>10);assert.equal(S.power(x,'gift',0,0).ok,true);assert.equal(x.bot.food,5);assert.equal(S.power(x,'not-real',0,0).ok,false);x.faith=0;assert.equal(S.power(x,'bloom',0,0).ok,false);});
test('map actions check bounds, water, and provide useful world effects',()=>{const x=S.create(13);let water=x.map.indexOf(S.T.WATER);const pos=(n)=>[n%S.W,Math.floor(n/S.W)];assert.equal(S.power(x,'guide',-1,4).ok,false);if(water!==-1)assert.equal(S.power(x,'guide',...pos(water)).ok,false);const px=x.bot.x+1,py=x.bot.y;const p=S.power(x,'guide',px,py);assert.equal(p.ok,true);assert.equal(x.guide.x,px);x.faith=50;assert.equal(S.power(x,'bloom',px,py).ok,true);assert.equal(x.weather,'rain');assert.ok(x.map.filter(v=>v===S.T.BERRY).length>=9);});
test('pathfinding stays in world and never crosses water',()=>{const x=S.create(44);let path=S.findPath(x,(a,b)=>a===x.bot.x+5&&b===x.bot.y);assert.ok(path&&path.length);for(const [xx,yy] of path)assert.equal(S.walkable(x,xx,yy),true);assert.equal(S.findPath(x,()=>false),null);});
test('level progression improves maximum hp and strength',()=>{const x=S.create(88);S.gain(x,35,'testing');assert.ok(x.bot.level>1);assert.ok(x.bot.maxHp>24);assert.ok(x.bot.attack>4);});
test('reincarnation preserves long-term progression',()=>{const x=S.create(55);x.bot.level=5;x.bot.maxHp=40;x.bot.hp=0;x.tick=1;S.tick(x);S.tick(x);assert.equal(x.bot.level,5);assert.ok(x.bot.hp>0);assert.equal(x.bot.scars,1);});
test('save and restore roundtrip; malformed files are rejected',()=>{const x=S.create(21);for(let i=0;i<70;i++)S.tick(x);x.bot.path=[[3,4]];x.marks.push({x:1,y:2,until:200});const raw=S.serialize(x),r=S.restore(raw);assert.ok(r);assert.equal(r.map.length,S.N);assert.deepEqual(r.bot.path,[]);assert.deepEqual(r.marks,[]);assert.equal(S.restore('not json'),null);const obj=JSON.parse(raw);obj.map.pop();assert.equal(S.restore(obj),null);});
test('simulation survives 2,000 steps without invalid state or frozen position',()=>{const x=S.create(2026);let start=[x.bot.x,x.bot.y].join(',');for(let i=0;i<2000;i++)S.tick(x);assert.equal(S.validate(x),true);assert.ok(x.bot.steps>20,'bot must actually travel');assert.ok(x.bot.level>=2,'bot must gain levels');assert.ok(x.bot.fights+x.bot.wood+x.bot.stone+x.bot.ruins+x.bot.steps>20);assert.notEqual([x.bot.x,x.bot.y].join(','),start);assert.ok(x.log.length<=45);assert.ok(x.bot.memory.length<=12);});
test('multiple seeds do not crash after 750 ticks',()=>{for(let seed=1;seed<=5;seed++){const x=S.create(seed);for(let i=0;i<750;i++)S.tick(x);assert.ok(S.validate(x),'seed '+seed);assert.ok(x.bot.steps>4,'seed '+seed);}});

test('origin and traits are reproducible but vary between lives',()=>{
 const a=S.create(1),b=S.create(1),c=S.create(2);
 assert.deepEqual(a.bot.personality,b.bot.personality);
 assert.equal(a.bot.background,b.bot.background);
 assert.notEqual(a.bot.background,c.bot.background);
 assert.ok(a.bot.originStory.length>12);
 assert.equal(a.bot.skills.survival,1);
});
test('five skills advance by practice, not by class selection',()=>{
 const s=S.create(5),before=s.bot.skills.lore;
 S.improve(s,'lore',180);
 assert.ok(s.bot.skills.lore>before);
 assert.ok(s.bot.skills.lore<=20);
 assert.ok(s.bot.memory.some(m=>m.includes('lore')));
 assert.equal(S.improve(s,'imaginary',10),false);
});
test('rumors come from ruins and lead to further actual locations',()=>{
 const s=S.create(3);
 for(let i=0;i<6000;i++)S.tick(s);
 assert.ok(s.bot.ruins>=2);
 assert.ok(s.story.clues.length>=1);
 assert.ok(s.story.completed>=1);
 assert.ok(s.story.clues.every(q=>S.inside(q.x,q.y)));
});
test('tactics and trap detection happen without player controlling the bot',()=>{
 const s=S.create(789);
 // Exercise encounters explicitly: ecology changes must not make this depend
 // on the chance that a particular autoplay route meets a beast or trap.
 s.camp={x:32,y:24};s.bot.tool=1;s.bot.maxHp=s.bot.hp=200;
 s.enemies=[{id:1,type:'Wolf',x:33,y:24,hp:1000,attack:2,defense:100,cooldown:0}];
 for(let i=0;i<80;i++)S.tick(s);
 assert.ok(s.bot.tactics.dodge+s.bot.tactics.parry>=1);
 s.enemies=[];s.bot.x=32;s.bot.y=24;s.bot.hunger=100;s.bot.energy=100;s.bot.food=5;
 s.map.fill(S.T.GRASS);s.map[S.idx(32,24)]=S.T.RUIN;s.seen.fill(1);s.seed=1;
 S.tick(s);S.tick(s);
 assert.ok(s.bot.tactics.trapsAvoided+s.bot.tactics.trapsTriggered>=1);
 assert.equal(S.validate(s),true);
});
test('old v0.1 saves migrate to new story and skill state',()=>{
 const s=S.create(16),raw=JSON.parse(S.serialize(s));
 delete raw.story;for(const k of ['background','originStory','skills','skillXP','tactics'])delete raw.bot[k];
 const migrated=S.restore(raw);
 assert.ok(migrated);
 assert.ok(migrated.bot.skills);
 assert.ok(migrated.bot.tactics);
 assert.deepEqual(migrated.story,{clues:[],completed:0});
 for(let i=0;i<80;i++)S.tick(migrated);
 assert.equal(S.validate(migrated),true);
});

test('medieval travelers spawn deterministically, stay on land and are capped at three',()=>{
 const a=S.create(2026),b=S.create(2026);
 assert.equal(a.npcs.length,3);
 assert.deepEqual(a.npcs,b.npcs);
 assert.deepEqual(a.npcs.map(p=>p.role),['Apothecary','Squire','Rune Scholar']);
 assert.ok(a.npcs.every(p=>S.inside(p.x,p.y)&&S.walkable(a,p.x,p.y)));
 for(let i=0;i<1800;i++){S.tick(a);S.tick(b);}
 assert.equal(S.serialize(a),S.serialize(b));
 assert.ok(a.npcs.every(p=>S.inside(p.x,p.y)&&S.walkable(a,p.x,p.y)));
 assert.ok(a.npcs.some(p=>p.encounters>0),'Nim must meet at least one traveler independently');
 assert.ok(a.log.length<=45,'world chronicle remains bounded');
});
test('divine Inspire affects a discovered traveler but does not puppet Nim',()=>{
 const s=S.create(349),person=s.npcs[0],before=s.faith;
 const bx=s.bot.x,by=s.bot.y;
 assert.equal(S.power(s,'inspire',person.x,person.y).ok,false,'hidden travelers cannot be targeted');
 assert.equal(s.faith,before,'rejected actions should not cost Faith');
 s.seen[S.idx(person.x,person.y)]=1;
 assert.equal(S.power(s,'inspire',person.x,person.y).ok,true);
 assert.equal(s.faith,before-S.COST.inspire);
 assert.equal(person.mood,'hopeful');
 assert.ok(person.trust>22&&person.favorUntil>s.tick);
 assert.equal(s.bot.x,bx);
 assert.equal(s.bot.y,by);
 const faith=s.faith;
 assert.equal(S.power(s,'inspire',-1,-1).ok,false);
 assert.equal(s.faith,faith);
 assert.ok(s.log.some(e=>e.title==='Divine inspiration'));
});
test('existing saves without travelers migrate while retaining Nim and world progress',()=>{
 const initial=S.create(77);
 for(let i=0;i<60;i++)S.tick(initial);
 const old=JSON.parse(S.serialize(initial));
 const originalPosition=[old.bot.x,old.bot.y],originalTick=old.tick,originalFaith=old.faith;
 delete old.npcs;
 const restored=S.restore(old);
 assert.ok(restored);
 assert.equal(restored.tick,originalTick);
 assert.equal(restored.faith,originalFaith);
 assert.deepEqual([restored.bot.x,restored.bot.y],originalPosition);
 assert.equal(restored.npcs.length,3);
 assert.ok(restored.npcs.every(p=>S.walkable(restored,p.x,p.y)));
 const again=S.restore(S.serialize(restored));
 assert.deepEqual(again.npcs,restored.npcs);
 for(let i=0;i<250;i++)S.tick(restored);
 assert.ok(S.validate(restored));
});

test('medieval fantasy terrain includes paths, villages and persistent shrines',()=>{
 const a=S.create(2026),b=S.create(2026);
 assert.deepEqual(a.map,b.map);
 assert.equal(a.map.filter(t=>t===S.T.VILLAGE).length,2);
 assert.equal(a.map.filter(t=>t===S.T.SHRINE).length,2);
 assert.ok(a.map.some(t=>t===S.T.ROAD));
 assert.ok(a.npcs.every(p=>S.walkable(a,p.homeX,p.homeY)));
 assert.deepEqual(a.shrinesVisited,[]);
 const saved=S.restore(S.serialize(a));
 assert.deepEqual(saved.shrinesVisited,[]);
 assert.ok(S.validate(saved));
});
test('apothecary responds to divine inspiration with a bounded autonomous harvest',()=>{
 const s=S.create(42),p=s.npcs.find(p=>p.role==='Apothecary');
 s.seen[S.idx(p.x,p.y)]=1;s.faith=50;
 const before=s.map.filter(t=>t===S.T.BERRY).length;
 assert.equal(S.power(s,'inspire',p.x,p.y).ok,true);
 for(let i=0;i<12;i++)S.tick(s);
 assert.equal(p.favorSpent,true);
 assert.equal(p.activity,'Tending blessed herbs');
 assert.ok(s.map.filter(t=>t===S.T.BERRY).length>=before);
 assert.ok(s.log.some(x=>x.title==='Apothecary answered'));
 const logs=s.log.filter(x=>x.title==='Apothecary answered').length;
 for(let i=0;i<24;i++)S.tick(s);
 assert.equal(s.log.filter(x=>x.title==='Apothecary answered').length,logs,'one autonomous act per blessing');
});
test('inspired squire and rune scholar perform role-specific actions',()=>{
 for(const role of ['Squire','Rune Scholar']){
  const s=S.create(56),p=s.npcs.find(p=>p.role===role);
  s.seen[S.idx(p.x,p.y)]=1;s.faith=50;
  assert.equal(S.power(s,'inspire',p.x,p.y).ok,true);
  for(let i=0;i<12;i++)S.tick(s);
  assert.equal(p.favorSpent,true,role);
  assert.ok(s.log.some(x=>x.title===(role==='Squire'?'Squire answered':'Rune scholar answered')));
  assert.ok(p.activity.length>5);
 }
});
test('v0.2 saves migrate without new world features and preserve old progress',()=>{
 const s=S.create(89);
 for(let i=0;i<15;i++)S.tick(s);
 const old=JSON.parse(S.serialize(s));
 delete old.shrinesVisited;
 for(const p of old.npcs){delete p.favorSpent;delete p.activity;}
 const restored=S.restore(old);
 assert.ok(restored);
 assert.deepEqual(restored.shrinesVisited,[]);
 assert.ok(restored.npcs.every(p=>p.favorSpent===false&&p.activity.length));
 assert.equal(restored.tick,s.tick);
 assert.equal(restored.bot.level,s.bot.level);
 for(let i=0;i<400;i++)S.tick(restored);
 assert.equal(S.validate(restored),true);
});
