const test=require('node:test'),assert=require('node:assert/strict'),S=require('../src/sim');
test('depleted reachable land renews survival and construction supplies',()=>{
 const s=S.create(41);s.map.fill(S.T.GRASS);s.npcs=[];s.tick=92;
 S.tick(s);for(const t of [S.T.BERRY,S.T.FOREST,S.T.STONE])assert.ok(S.findPath(s,(x,y,v)=>v===t),'reachable resource '+t);
});
test('building shelter preserves landmarks and restores survival priority',()=>{
 const s=S.create(9),b=s.bot;b.wood=5;b.stone=3;s.map[S.idx(b.x,b.y)]=S.T.SHRINE;s.shrinesVisited=[S.idx(b.x,b.y)];
 S.tick(s);S.tick(s);assert.equal(s.map[S.idx(32,24)],S.T.SHRINE);assert.ok(!s.camp||s.camp.x!==32||s.camp.y!==24);
 b.hp=1;b.hunger=0;b.food=2;S.plan(s);assert.equal(b.goal,'Eat');
});
test('unreachable omen falls back without crossing terrain',()=>{
 const s=S.create(10);s.map.fill(S.T.WATER);const b=s.bot;s.map[S.idx(b.x,b.y)]=S.T.GRASS;s.map[0]=S.T.GRASS;s.guide={x:0,y:0,ticks:300};s.camp={x:b.x,y:b.y};b.tool=1;
 S.plan(s);assert.equal(s.guide,null);for(let i=0;i<100;i++)S.tick(s);assert.ok(S.walkable(s,b.x,b.y));
});
test('invalid saves fail closed and oversize input is rejected',()=>{
 const s=S.create(8),raw=JSON.parse(S.serialize(s));delete raw.bot.hp;assert.equal(S.restore(raw),null);
 assert.equal(S.restore(' '.repeat(1000001)),null);
 const broken=JSON.parse(S.serialize(s));broken.enemies=[{x:NaN}];assert.equal(S.restore(broken),null);
});
test('power rejection is pure and pending inspiration cannot be purchased twice',()=>{
 const s=S.create(5),p=s.npcs[0];s.seen[S.idx(p.x,p.y)]=1;s.faith=50;assert.ok(S.power(s,'inspire',p.x,p.y).ok);
 const raw=S.serialize(s);assert.equal(S.power(s,'inspire',p.x,p.y).ok,false);assert.equal(S.serialize(s),raw);
 for(const kind of Object.keys(S.COST)){assert.equal(S.power(s,kind,NaN,0).ok,false);assert.equal(S.serialize(s),raw);}
});
test('five autonomous 10000 tick runs remain bounded, progress, and restore',()=>{
 for(const seed of [1,7,41,2026,987654]){const s=S.create(seed);for(let i=0;i<10000;i++)S.tick(s);
 assert.ok(S.validate(s));assert.ok(s.bot.steps>100);assert.ok(s.camp);assert.equal(s.bot.tool,1);assert.ok(s.npcs.some(p=>p.met));assert.ok(s.enemies.length<=5);assert.ok(S.serialize(s).length<100000);assert.ok(S.restore(S.serialize(s)));}
});
test('fully explored late worlds keep making journeys after 10000 ticks',()=>{
 for(const seed of [7,41,2026]){const s=S.create(seed);for(let i=0;i<10000;i++)S.tick(s);const before=s.bot.steps;for(let i=0;i<1000;i++)S.tick(s);assert.ok(s.bot.steps>before+10,'seed '+seed+' stops wandering');}
});

test('a distant camp does not grant remote healing during emergency recovery',()=>{
 const s=S.create(41),b=s.bot;
 s.camp={x:32,y:24};s.map[S.idx(32,24)]=S.T.CAMP;
 b.tool=1;b.x=50;b.y=39;b.hp=5;b.energy=90;b.hunger=100;b.food=10;
 s.enemies=[];s.npcs=[];
 S.plan(s);assert.equal(b.goal,'Recover');
 S.tick(s);S.tick(s);
 assert.equal(b.hp,7,'emergency recovery away from camp heals only two health');
 assert.ok(S.validate(s));
});

test('moderately wounded Nim returns autonomously to nearby camp for stronger recovery',()=>{
 const s=S.create(41),b=s.bot;
 s.camp={x:32,y:24};s.map[S.idx(32,24)]=S.T.CAMP;
 b.tool=1;b.x=36;b.y=24;b.hp=14;b.energy=90;b.hunger=100;b.food=10;
 s.enemies=[];s.npcs=[];
 S.plan(s);
 assert.equal(b.goal,'Return to camp');
 assert.ok(b.path.length>0&&b.path.length<=8);
 for(let i=0;i<6;i++)S.tick(s);
 assert.equal(b.hp,17,'Nim rests after returning within range of her hearth');
 assert.ok(Math.abs(b.x-s.camp.x)+Math.abs(b.y-s.camp.y)<=2);
 const loaded=S.restore(S.serialize(s));
 assert.ok(loaded);
 assert.equal(loaded.bot.hp,b.hp);
 assert.ok(S.validate(loaded));
});

test('immediate threats still override autonomous camp recovery',()=>{
 const s=S.create(41),b=s.bot;
 s.camp={x:32,y:24};s.map[S.idx(32,24)]=S.T.CAMP;
 b.tool=1;b.x=36;b.y=24;b.hp=14;b.energy=90;b.hunger=100;b.food=10;
 s.enemies=[{id:1,type:'Wolf',x:37,y:24,hp:11,attack:2,defense:0,cooldown:1}];
 S.plan(s);
 assert.equal(b.goal,'Defend','escaping or defending is more urgent than going home');
});
