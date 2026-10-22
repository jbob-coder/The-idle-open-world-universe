/* Build embeds every atlas. There is no runtime network dependency. */
(function(){'use strict';const bundle=window.GodseedAssetBundle,images=[],api={manifest:bundle.manifest,images,ready:false,decodedBytes:0};
api.blit=function(ctx,index,r,x,y){if(!api.ready)return;ctx.drawImage(images[index],r[0],r[1],r[2],r[3],Math.round(x),Math.round(y),r[2],r[3]);};
api.loaded=Promise.all(bundle.images.map((src,index)=>new Promise((resolve,reject)=>{const img=new Image();images[index]=img;img.onload=()=>{api.decodedBytes+=img.width*img.height*4;resolve();};img.onerror=()=>reject(new Error('Bundled atlas failed: '+index));img.src=src;}))).then(()=>{api.ready=true;});
window.GodseedAssets=api;
})();
