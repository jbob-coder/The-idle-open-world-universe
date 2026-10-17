from pathlib import Path
p=Path(__file__).parent
h=(p/'index.template.html').read_text()
h=h.replace('/*SIM_SOURCE*/',(p/'src/sim.js').read_text())
h=h.replace('/*UI_SOURCE*/',(p/'src/ui.js').read_text())
(p/'GODSEED-Play.html').write_text(h)
print('Standalone HTML:',(p/'GODSEED-Play.html').stat().st_size,'bytes')
