/* GODSEED: safe, persistent, metric-scaled medieval interiors.
 * Exterior: 2 m per world tile. Interior: 0.5 m per tile; 4x linear scale.
 * Room tiles are generated on demand; only compact room changes are saved.
 */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;root.GodseedInteriors=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const MAX_ROOMS=32,MAX_OCCUPANTS=8;
const TYPES=new Set(['house','farm','workshop','market','watchtower','well']);
const safe=(s,x,y)=>x>=1&&y>=1&&x<63&&y<47&&s.map[y*64+x]!==2;
function building(s,id){if(!s.living||typeof id!=='string')return null;
 for(const town of s.living.towns)for(const b of town.buildings)
  if(b.id===id&&TYPES.has(b.type))return b;
 return null;
}
function outerDoor(s,b){
 if(!b)return null;
 const w=b.w||1,h=b.h||1;
 const opts=[
  {x:b.x+Math.floor((w-1)/2),y:b.y+h,side:'south'},
  {x:b.x+w,y:b.y+Math.floor((h-1)/2),side:'east'},
  {x:b.x-1,y:b.y+Math.floor((h-1)/2),side:'west'},
  {x:b.x+Math.floor((w-1)/2),y:b.y-1,side:'north'}
 ];
 return opts.find(p=>safe(s,p.x,p.y)&&!s.living.towns.some(t=>t.buildings.some(q=>
  p.x>=q.x&&p.x<q.x+(q.w||1)&&p.y>=q.y&&p.y<q.y+(q.h||1))))||null;
}
function interiorSize(b){
 // A 3x3 building occupies 6m x 6m outdoors; its 0.5m interior grid is 12x12.
 return {width:Math.max(8,Math.min(20,4*(b.w||1))),
  height:Math.max(8,Math.min(20,4*(b.h||1))),tileMetres:.5,
  outdoorTileMetres:2};
}
function layout(b){
 const g=interiorSize(b),w=g.width,h=g.height;
 const tiles=Array(w*h).fill('floor'),door={x:Math.floor(w/2),y:h-1};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x===0||y===0||x===w-1||y===h-1)tiles[y*w+x]='wall';
 tiles[door.y*w+door.x]='door';
 const objects=[];
 const place=(kind,x,y,ww=1,hh=1)=>{
  if(x<1||y<1||x+ww>=w||y+hh>=h-1)return false;
  for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++){
   if(tiles[yy*w+xx]!=='floor')return false;
  }
  for(let yy=y;yy<y+hh;yy++)for(let xx=x;xx<x+ww;xx++)tiles[yy*w+xx]=kind;
  objects.push({kind,x,y,w:ww,h:hh});return true;
 };
 const cx=Math.floor(w/2),cy=Math.floor(h/2);
 if(b.type==='house'){
  place('bed',2,2,2,3);place('hearth',w-3,2,1,2);
  place('table',cx,cy,2,2);place('storage',2,h-4,2,2);
 }else if(b.type==='workshop'){
  place('forge',2,2,3,2);place('anvil',cx,cy,2,2);
  place('storage',w-4,h-5,2,2);place('table',2,h-4,2,2);
 }else if(b.type==='farm'){
  place('storage',2,2,3,2);place('table',cx,cy,2,2);
  place('hearth',w-3,2,1,2);
 }else if(b.type==='market'){
  place('counter',2,3,w-5,2);place('storage',2,h-5,2,2);
 }else if(b.type==='watchtower'){
  place('storage',2,2,2,2);place('table',cx,cy,2,2);
 }else if(b.type==='well'){
  place('water',cx-1,cy-1,2,2);
 }
 return {...g,id:b.id,type:b.type,door,tiles,objects,safe:true};
}
function room(s,id){
 const b=building(s,id);if(!b)return null;
 if(!s.interiors)s.interiors={version:1,rooms:{}};
 const rooms=s.interiors.rooms;
 if(!Object.prototype.hasOwnProperty.call(rooms,id)){
  if(Object.keys(rooms).length>=MAX_ROOMS)return null;
  rooms[id]={visits:0,lastEntered:0,rested:0};
 }
 return {building:b,state:rooms[id],layout:layout(b)};
}
function occupants(s,id){
 return (s.living?.citizens||[]).filter(p=>p.insideId===id);
}
function enter(s,p,id){
 const b=building(s,id),d=outerDoor(s,b);
 if(!b||!d||!p||p.insideId||p.x!==d.x||p.y!==d.y||
    !s.living?.citizens?.includes(p)||occupants(s,id).length>=MAX_OCCUPANTS)return false;
 const r=room(s,id);if(!r)return false;
 p.insideId=id;p.indoorX=r.layout.door.x;p.indoorY=r.layout.door.y-1;
 p.activity=b.type==='house'?'Sleeping indoors':'Working indoors';p.movedAt=s.tick;
 r.state.visits++;r.state.lastEntered=s.tick;return true;
}
function exit(s,p){
 if(!p||!p.insideId)return false;
 const b=building(s,p.insideId),d=outerDoor(s,b);
 if(!d){p.insideId=null;delete p.indoorX;delete p.indoorY;return false;}
 p.x=d.x;p.y=d.y;p.insideId=null;delete p.indoorX;delete p.indoorY;
 p.movedAt=s.tick;p.activity='Leaving the doorway';return true;
}
function rest(s,p){
 if(!p||!p.insideId)return false;
 const r=room(s,p.insideId);if(!r)return false;
 p.activity='Sleeping indoors';p.mood='content';
 if(s.tick%48===0){r.state.rested++;p.skillXP=Math.max(0,p.skillXP||0);}
 return true;
}
function sanitize(s){
 if(!s.interiors||s.interiors.version!==1||!s.interiors.rooms||typeof s.interiors.rooms!=='object')s.interiors={version:1,rooms:{}};
 const rooms={};
 for(const [id,v] of Object.entries(s.interiors.rooms).slice(0,MAX_ROOMS)){
  if(!building(s,id)||!v||typeof v!=='object')continue;
  rooms[id]={visits:Math.max(0,Math.min(99999,Number.isInteger(v.visits)?v.visits:0)),
   lastEntered:Math.max(0,Math.min(s.tick,Number.isInteger(v.lastEntered)?v.lastEntered:0)),
   rested:Math.max(0,Math.min(99999,Number.isInteger(v.rested)?v.rested:0))};
 }
 s.interiors={version:1,rooms};
 for(const p of s.living.citizens){
  if(typeof p.insideId!=='string'||!building(s,p.insideId)||!outerDoor(s,building(s,p.insideId))){
   p.insideId=null;delete p.indoorX;delete p.indoorY;continue;
  }
  const g=layout(building(s,p.insideId));
  p.indoorX=Number.isInteger(p.indoorX)?Math.max(1,Math.min(g.width-2,p.indoorX)):g.door.x;
  p.indoorY=Number.isInteger(p.indoorY)?Math.max(1,Math.min(g.height-2,p.indoorY)):g.door.y-1;
 }
}
return {MAX_ROOMS,building,outerDoor,interiorSize,layout,room,occupants,enter,exit,rest,sanitize};
});
