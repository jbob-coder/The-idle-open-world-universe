from pathlib import Path
p=Path(__file__).resolve().parents[1]
f=p/'index.template.html'
s=f.read_text()
s=s.replace('/* Compact Android landscape overlay.', '''/* Portable backup dialog works on old Android WebViews without a native file picker. */
#saveDialog[hidden]{display:none}
#saveDialog{position:fixed;inset:0;z-index:30;background:rgba(4,12,16,.92);display:grid;place-items:center;padding:14px}
#saveDialog .backup-panel{max-width:640px;width:100%;background:#172a2b;border:2px solid #c1aa75;border-radius:7px;padding:16px;box-shadow:0 6px 45px #000b}
#saveDialog h2{margin:0 0 8px;color:#e7d6a4;font-size:19px}
#saveDialog p{color:#b8cec4;line-height:1.5;font-size:12px}
#saveText{display:block;box-sizing:border-box;width:100%;min-height:120px;max-height:35vh;background:#101e21;color:#d9e2d2;font:12px monospace;border:1px solid #81927c;padding:8px;resize:vertical}
#saveDialog .backup-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}
#saveDialog .backup-actions button{padding:10px 13px;min-height:42px}
/* Compact Android landscape overlay.''')
s=s.replace('<div id="androidDock" aria-label=', '''<div id="saveDialog" hidden role="dialog" aria-modal="true" aria-labelledby="backupTitle">
  <div class="backup-panel"><h2 id="backupTitle">World backup</h2><p id="backupHelp"></p>
  <textarea id="saveText" spellcheck="false" autocomplete="off" autocorrect="off" autocapitalize="off"></textarea>
  <div class="backup-actions"><button id="saveCopy">Copy text</button><button id="saveApply" hidden>Import pasted save</button><button id="saveDownload">Download JSON</button><button id="saveClose">Close</button></div>
  </div></div>
<div id="androidDock" aria-label=''' )
f.write_text(s)
u=p/'src/ui.js'
ui=u.read_text()
needle="function importSave(file){"
insert="""function backupDialog(kind){
 const box=$('saveDialog'),text=$('saveText');box.hidden=false;
 const exporting=kind==='export';
 $('backupTitle').textContent=exporting?'Export world backup':'Import world backup';
 $('backupHelp').textContent=exporting?'Copy this JSON to a safe place. Your game also auto-saves while installed.':'Paste previously exported GODSEED JSON below, then choose Import. This replaces the current world.';
 text.readOnly=exporting;text.value=exporting?A.serialize(s):'';text.placeholder=exporting?'':'Paste a saved GODSEED world here';
 $('saveCopy').hidden=!exporting;$('saveApply').hidden=exporting;$('saveDownload').hidden=!exporting;
 if(exporting){text.focus();text.select();}else{text.focus();}
}
$('saveClose').addEventListener('click',()=>{$('saveDialog').hidden=true;});
$('saveCopy').addEventListener('click',()=>{
 const t=$('saveText');t.focus();t.select();
 let copied=false;try{copied=document.execCommand('copy');}catch(_){}
 if(copied)notify('World backup copied.');else notify('Select the text and copy it manually.');
});
$('saveDownload').addEventListener('click',exportSave);
$('saveApply').addEventListener('click',()=>{
 const restored=A.restore($('saveText').value);if(!restored){notify('Invalid world backup.');return;}
 if(!confirm('Replace current world with the pasted backup?'))return;
 s=restored;save();hud();draw();$('saveDialog').hidden=true;notify('World backup restored.');
});
"""
assert needle in ui
ui=ui.replace(needle,insert+needle)
old="$('save').addEventListener('click',()=>{save();notify('World saved.');});$('export').addEventListener('click',exportSave);\n$('import').addEventListener('click',()=>$('importFile').click());"
new="$('save').addEventListener('click',()=>{save();notify('World saved.');});$('export').addEventListener('click',()=>backupDialog('export'));\n$('import').addEventListener('click',()=>backupDialog('import'));"
assert old in ui
ui=ui.replace(old,new)
u.write_text(ui)
print('Installed save backup copy/paste dialog')
