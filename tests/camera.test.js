const test=require('node:test'),assert=require('node:assert/strict'),C=require('../src/render/camera');
test('camera centers roundtrip through letterboxes at every zoom',()=>{
 for(const [w,h] of [[32,20],[24,15],[16,10]])for(const [width,height] of [[640,210],[720,250],[960,400]]){
 const cam={x:7,y:8,width:w,height:h},box={left:12,top:31,width,height};
 for(const [x,y] of [[7,8],[7+w-1,8+h-1],[10,11]]){const p=C.worldToPointer(cam,box,x,y);assert.deepEqual(C.pointerToWorld(cam,box,p.x,p.y),{x,y});}
 assert.deepEqual(C.pointerToWorld(cam,box,box.left-1,box.top-1),{x:-1,y:-1});
 }
});
