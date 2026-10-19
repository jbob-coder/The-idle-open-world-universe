from pathlib import Path
import json, base64
p=Path(__file__).parent
h=(p/'index.template.html').read_text()
region_data='window.GodseedRegionData='+json.dumps(json.loads((p/'data/world-regions.v1.json').read_text()),separators=(',',':'))+';\n'
h=h.replace('/*SIM_SOURCE*/',region_data+(p/'src/world/regions.js').read_text()+'\n'+(p/'src/needs.js').read_text()+'\n'+(p/'src/chronicles.js').read_text()+'\n'+(p/'src/choices.js').read_text()+'\n'+(p/'src/living.js').read_text()+'\n'+(p/'src/sim.js').read_text())
manifest=json.loads((p/'assets/asset-manifest.json').read_text())
bundle={'manifest':manifest,'images':['data:image/png;base64,'+base64.b64encode((p/a['path']).read_bytes()).decode() for a in manifest['atlases']]}
render='window.GodseedAssetBundle='+json.dumps(bundle,separators=(',',':'))+';\n'
for name in ['camera','assets','terrain','actors','fx','settlements']:
    render+=(p/('src/render/'+name+'.js')).read_text()+'\n'
h=h.replace('/*UI_SOURCE*/',render+(p/'src/ui.js').read_text())

(p/'GODSEED-Play.html').write_text(h)
print('Standalone HTML:',(p/'GODSEED-Play.html').stat().st_size,'bytes')
