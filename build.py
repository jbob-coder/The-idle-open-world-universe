from pathlib import Path
import json
p=Path(__file__).parent
h=(p/'index.template.html').read_text()
region_data='window.GodseedRegionData='+json.dumps(json.loads((p/'data/world-regions.v1.json').read_text()),separators=(',',':'))+';\n'
h=h.replace('/*SIM_SOURCE*/',region_data+(p/'src/world/regions.js').read_text()+'\n'+(p/'src/sim.js').read_text())
h=h.replace('/*UI_SOURCE*/',(p/'src/ui.js').read_text())
(p/'GODSEED-Play.html').write_text(h)
print('Standalone HTML:',(p/'GODSEED-Play.html').stat().st_size,'bytes')
