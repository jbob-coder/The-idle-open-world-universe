from pathlib import Path
import json, base64
p=Path(__file__).parent
h=(p/'index.template.html').read_text()
region_data='window.GodseedRegionData='+json.dumps(json.loads((p/'data/world-regions.v1.json').read_text()),separators=(',',':'))+';\n'
h=h.replace('/*SIM_SOURCE*/',region_data+(p/'src/world/regions.js').read_text()+'\n'+(p/'src/living.js').read_text()+'\n'+(p/'src/sim.js').read_text())
manifest=json.loads((p/'assets/asset-manifest.json').read_text())
bundle={'manifest':manifest,'images':['data:image/png;base64,'+base64.b64encode((p/a['path']).read_bytes()).decode() for a in manifest['atlases']]}
render='window.GodseedAssetBundle='+json.dumps(bundle,separators=(',',':'))+';\n'
for name in ['camera','assets','terrain','actors','fx','settlements']:
    render+=(p/('src/render/'+name+'.js')).read_text()+'\n'
h=h.replace('/*UI_SOURCE*/',render+(p/'src/ui.js').read_text())
# WLD-003 runs in opt-in independent script elements AFTER the legacy game.
# Older Android WebViews must still start/save the village even if a future
# atlas module hits an unsupported API or a script parse/runtime error.
atlas_modules=['world/chunks.js','world/chunk_store.js','world/chunk_view.js',
               'render/chunk_surface.js','ui_chunk_atlas.js']
addon=''.join('<script>\n'+(p/('src/'+name)).read_text()+'\n</script>\n' for name in atlas_modules)
assert h.count('</body>')==1
h=h.replace('</body>',addon+'</body>')

(p/'GODSEED-Play.html').write_text(h)
print('Standalone HTML:',(p/'GODSEED-Play.html').stat().st_size,'bytes')
