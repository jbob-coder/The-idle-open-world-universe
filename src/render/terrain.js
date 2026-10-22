(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GodseedTerrain=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
function hash(s,x,y){let h=Math.imul(x+91,374761393)^Math.imul(y+37,668265263)^s.worldSeed;return (h^(h>>>13))>>>0;}
function variant(s,x,y){return hash(s,x,y)%3;}
function mask(s,x,y,type){let m=0;for(let i=0;i<4;i++){const nx=x+DIRS[i][0],ny=y+DIRS[i][1],n=ny*64+nx,t=s.map[n];if(nx>=0&&nx<64&&ny>=0&&ny<48&&s.seen[n]&&(t===type||(type===8&&(t===7||t===9||t===10))))m|=1<<i;}return m;}
function prop(s,x,y){const t=s.map[y*64+x],h=hash(s,x,y);if(t!==0&&t!==6)return null;if(h%13)return null;
 const r=typeof GodseedRegions!=='undefined'?GodseedRegions.at(s,x,y).id:'';
 return {name:r==='R01'?'signpost':r==='R02'?'fence':r==='R04'?'boulder':r==='R06'?'runestone':'flower_patch',variant:h%2};}
function draw(ctx,assets,s,t,x,y,wx,wy){const v=variant(s,wx,wy),sheet=assets.manifest.atlases[0],tile=sheet.tiles.find(a=>a.id===t&&a.variant===v);assets.blit(ctx,0,tile.rect,x,y);
 // Native-pixel joins: same semantic topology as navigation, never cosmetic water bridges.
 if(t===8){assets.blit(ctx,0,sheet.tiles.find(a=>a.id===0&&a.variant===v).rect,x,y);const m=mask(s,wx,wy,8);ctx.fillStyle='#8B6346';ctx.fillRect(x+3,y+3,10,10);ctx.fillStyle='#B49060';ctx.fillRect(x+5,y+5,6,6);
 for(let i=0;i<4;i++)if(m&(1<<i)){const r=[[3,0,10,8],[8,3,8,10],[3,8,10,8],[0,3,8,10]][i];ctx.fillStyle='#8B6346';ctx.fillRect(x+r[0],y+r[1],r[2],r[3]);const q=[[5,0,6,8],[8,5,8,6],[5,8,6,8],[0,5,8,6]][i];ctx.fillStyle='#B49060';ctx.fillRect(x+q[0],y+q[1],q[2],q[3]);}}
 if(t===2){const m=mask(s,wx,wy,2);ctx.fillStyle='#6FA9B7';if(!(m&1))ctx.fillRect(x,y,16,1);if(!(m&2))ctx.fillRect(x+15,y,1,16);if(!(m&4))ctx.fillRect(x,y+15,16,1);if(!(m&8))ctx.fillRect(x,y,1,16);}
 const p=prop(s,wx,wy);if(p){const a=assets.manifest.atlases[3].items.find(i=>i.name===p.name&&i.variant===p.variant);assets.blit(ctx,3,a.rect,x,y);}
}
return {hash,variant,mask,prop,draw};
});
