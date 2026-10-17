/* Stable region overlay, independent of mutable simulation RNG. */
(function(root,factory){const api=factory(typeof module!=='undefined'&&module.exports?require('../../data/world-regions.v1.json'):root.GodseedRegionData);if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GodseedRegions=api;})(typeof globalThis!=='undefined'?globalThis:this,function(data){
'use strict';
const cache=new WeakMap();
function noise(seed,x,y){let h=Math.imul(x+83,374761393)^Math.imul(y+57,668265263)^seed;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296;}
function membership(seed){const out=new Uint8Array(3072);for(let y=0;y<48;y++)for(let x=0;x<64;x++){
 if(Math.abs(x-32)+Math.abs(y-24)<=5)continue;
 let best=Infinity,which=0;data.regions.forEach((r,i)=>{const dx=x-r.anchor[0],dy=y-r.anchor[1],d=dx*dx+dy*dy+noise(seed+i,Math.floor(x/4),Math.floor(y/4))*18;if(d<best){best=d;which=i;}});
 // The southwest shrine is part of its sacred grove, not the hamlet.
 if(Math.abs(x-20)+Math.abs(y-31)<=2)which=6;
 out[y*64+x]=which;
}return out;}
function at(s,x,y){if(x<0||x>=64||y<0||y>=48)return null;let map=cache.get(s);if(!map){map=membership(s.worldSeed===undefined?s.seed:s.worldSeed);cache.set(s,map);}return data.regions[map[y*64+x]];}
function shape(s,T){for(let y=0;y<48;y++)for(let x=0;x<64;x++){
 const r=at(s,x,y),n=noise(s.worldSeed^0x7654,x,y),i=y*64+x;
 if(r.id==='R03'||r.id==='R06')s.map[i]=n<.62?T.FOREST:n<.77?T.BERRY:T.GRASS;
 if(r.id==='R04')s.map[i]=n<.64?T.STONE:n<.7?T.BERRY:T.MEADOW;
 if(r.id==='R07')s.map[i]=n<.42?T.WATER:n<.60?T.BERRY:T.MEADOW;
 if(r.id==='R01'||r.id==='R02')s.map[i]=n<.16?T.BERRY:n<.26?T.FOREST:T.GRASS;
}}
function connect(s,T){
 const road=(a,b)=>{let [x,y]=a;while(x!==b[0]||y!==b[1]){const i=y*64+x;if(![T.VILLAGE,T.SHRINE,T.RUIN].includes(s.map[i]))s.map[i]=T.ROAD;if(x!==b[0])x+=x<b[0]?1:-1;else y+=y<b[1]?1:-1;}};
 s.map[7*64+31]=T.RUIN;s.map[39*64+50]=T.RUIN;
 for(const link of data.traversalLinks){const a=data.regions.find(r=>r.id===link.from),b=data.regions.find(r=>r.id===link.to);road(a.anchor,b.anchor);}
 road([15,38],[20,31]);road([37,27],[42,19]);
 // Ensure destinations themselves are dry without destroying their function.
 for(const r of data.regions){const i=r.anchor[1]*64+r.anchor[0];if(s.map[i]===T.WATER)s.map[i]=T.ROAD;}
 // Re-establish a useful, reachable sanctuary resource floor after road carving.
 for(const [x,y,t] of [[34,24,T.BERRY],[30,24,T.FOREST],[32,22,T.STONE],[33,25,T.BERRY],[30,23,T.FOREST],[33,22,T.STONE]])s.map[y*64+x]=t;
}
return {at,membership,shape,connect,data};
});
