/* Optional local lore UI. The Android host owns files, consent, quotas and transactions. */
(function(){'use strict';const $=id=>document.getElementById(id),host=window.GodseedNativePacks;
const bytes=n=>Number(n).toLocaleString()+' bytes ('+(Number(n)/1e9).toFixed(3)+' GB)';
function showLore(id){try{const lore=JSON.parse(host.lore(id)),known=window.GodseedDebug.getState().regions.discovered;const entries=lore.entries.filter(e=>known.includes(e.region_id));$('packLore').textContent=lore.title+'\n\n'+(entries.map(e=>e.text).join('\n\n')||'Explore more regions to discover this history.');}catch(_){$('packLore').textContent='This lore pack is unavailable.';}}
function refresh(message){if(message)$('storageMessage').textContent=message;
 if(!host){$('storageUsage').textContent='Optional local packs require Android storage support. Core gameplay is available offline with no packs.';$('packImport').disabled=true;return;}
 try{const u=JSON.parse(host.usage());if(u.error)throw Error(u.error);
 $('storageUsage').textContent='Core APK: '+bytes(u.coreBytes)+'\nMutable app data (includes cache): '+bytes(u.mutableBytes)+'\nOptional used: '+bytes(u.optionalBytes)+' / 5.000 GB\nPhone space available: '+bytes(u.freeBytes)+'\nCache included above: '+bytes(u.cacheBytes)+'\nSupported lore file: up to '+bytes(u.maxPackBytes)+'. Space is checked again before installation. OS and shared WebView overhead are not included.';
 const list=$('packList');list.textContent='';for(const pack of u.packs){const row=document.createElement('div'),label=document.createElement('span'),read=document.createElement('button'),remove=document.createElement('button');label.textContent=pack.title+' · '+bytes(pack.bytes)+' ';read.textContent='Read discovered lore';remove.textContent='Remove';read.onclick=()=>showLore(pack.id);remove.onclick=()=>host.requestRemove(pack.id);row.append(label,read,remove);list.appendChild(row);}
 }catch(_){$('storageMessage').textContent='Storage accounting is unavailable. Core play and saves remain separate.';}}
$('packImport').addEventListener('click',()=>{if(host)host.requestImport();});$('packRefresh').addEventListener('click',()=>refresh());
window.GodseedStorage={refresh};refresh();
})();
