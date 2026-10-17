from pathlib import Path
p=Path(__file__).resolve().parents[1]
f=p/'index.template.html'
s=f.read_text()
s=s.replace('No network, assets, external AI API, engine, or installation','No network, external AI API, or engine')
s=s.replace('Save portability: browser storage for local files is not guaranteed; Export JSON is recommended.','Your world saves locally on this device while the app stays installed. Export JSON periodically for a backup.')
s=s.replace('</style>', '''
/* Compact Android landscape overlay. Keeps all divine commands within thumb reach. */
#androidDock{display:none}
@media (orientation:landscape) and (max-height:650px) {
  :root {font-size:12px}
  body{padding-bottom:74px}
  .site{padding:7px;max-width:none}
  header{padding:4px 2px 9px;margin-bottom:7px;gap:9px}
  .sigil{width:34px;height:34px;font-size:17px}
  h1{font-size:22px;margin:0}.brand p{display:none}
  .eyebrow{font-size:8px}
  main{grid-template-columns:minmax(0,1fr) minmax(200px,.43fr);gap:8px}
  .panelhead{padding:7px 10px;min-height:30px}
  .worldframe{padding:5px}.worldtop{padding:3px;font-size:9px}
  #world{width:100%;max-height:58vh;height:auto;object-fit:contain}
  .underworld{padding:4px 1px;font-size:9px}
  .sidecol{display:block}.sidecol>.panel{margin-bottom:8px}
  .hero-body{padding:9px 11px}.herohead{gap:7px}.portrait{width:29px;height:29px}
  .herohead h2{font-size:13px}.section-title{margin:8px 0 3px}
  .stat{margin:0 0 5px}.stathead{margin-bottom:2px;font-size:9px}
  .panel.logpanel{margin-top:8px}.logpanel .events{max-height:160px}
  .powers-grid{grid-template-columns:repeat(3,1fr)}
  #androidDock{display:block;position:fixed;bottom:0;left:0;right:0;z-index:9;background:#101c20f7;border-top:2px solid #b9a77a;padding:3px max(7px,env(safe-area-inset-right)) calc(5px + env(safe-area-inset-bottom)) max(7px,env(safe-area-inset-left));box-shadow:0 -4px 20px #091114aa}
  #androidDock .docktop{display:flex;align-items:center;justify-content:space-between;color:#e4c98e;font-size:9px;letter-spacing:.03em;height:15px}
  #androidDock .dockrow{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px}
  #androidDock button{height:44px;min-width:0;padding:2px 1px;border-radius:4px;font-size:9px;line-height:1.05;touch-action:manipulation}
  #androidDock button.active{background:#596049;border-color:#eed69a;color:#fff4cb}
  #androidDock button .ico{display:block;font-size:17px;line-height:20px}
  footer{display:none}
}
@media (orientation:landscape) and (max-height:650px) and (max-width:600px){
  main{grid-template-columns:1fr}.sidecol{display:block}#world{max-height:47vh}
}
</style>''')
s=s.replace('<div id="toast" role="status"></div>', '''<div id="androidDock" aria-label="Quick god powers and time controls">
  <div class="docktop"><strong id="quickStatus">NIM · LEVEL 1</strong><span>SELECT POWER → TAP WORLD</span></div>
  <div class="dockrow">
    <button data-power="inspect" class="active"><span class="ico">⌕</span>Inspect</button>
    <button data-power="bless"><span class="ico">✧</span>Heal</button>
    <button data-power="gift"><span class="ico">▣</span>Food</button>
    <button data-power="bloom"><span class="ico">❀</span>Bloom</button>
    <button data-power="guide"><span class="ico">⌖</span>Guide</button>
    <button data-power="storm"><span class="ico">ϟ</span>Storm</button>
    <button data-speed="0"><span class="ico">Ⅱ</span>Pause</button>
    <button data-speed="3"><span class="ico">»</span>3× Time</button>
  </div>
</div><div id="toast" role="status"></div>''')
f.write_text(s)
u=p/'src'/'ui.js';ui=u.read_text()
ui=ui.replace(" $('clock').textContent=stamp(s);", " $('quickStatus').textContent=`NIM L${b.level} · HP ${Math.ceil(b.hp)}/${b.maxHp} · ✧ ${s.faith} · ${stamp(s)}`;\n $('clock').textContent=stamp(s);")
u.write_text(ui)
print('Updated landscape dock and UI status')
