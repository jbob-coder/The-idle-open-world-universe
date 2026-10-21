#!/usr/bin/env python3
"""Create a deterministic, single-file GODSEED V3 WebGL preview. No dependencies or CDN."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TEMPLATE = ROOT / "v3/index.template.html"
OUTPUT = ROOT / "GODSEED-V3-Play.html"

def build():
    html = TEMPLATE.read_text(encoding="utf-8")
    for marker, path in (
        ("/*V3_SIM_SOURCE*/", "src/v3/sim.js"),
        ("/*V3_FRONTIER_SOURCE*/", "src/v3/frontier.js"),
        ("/*V3_SOCIETY_SOURCE*/", "src/v3/society.js"),
        ("/*V3_WORLD_SOURCE*/", "src/v3/world.js"),
        ("/*V3_WORLD_TRAVEL_SOURCE*/", "src/v3/world_travel.js"),
        ("/*V3_INFRASTRUCTURE_SOURCE*/", "src/v3/infrastructure.js"),
        ("/*V3_AGENCY_SOURCE*/", "src/v3/agency.js"),
        ("/*V3_DISCOVERY_SOURCE*/", "src/v3/discovery.js"),
        ("/*V3_EXPEDITION_SOURCE*/", "src/v3/expedition.js"),
        ("/*V3_WORLD_SIM_SOURCE*/", "src/v3/world_sim.js"),
        ("/*V3_ATLAS_SOURCE*/", "src/v3/atlas.js"),
        ("/*V3_VIEW_SOURCE*/", "src/v3/view.js"),
        ("/*V3_FALLBACK_SOURCE*/", "src/v3/fallback.js"),
        ("/*V3_APP_SOURCE*/", "src/v3/app.js"),
    ):
        if html.count(marker) != 1:
            raise ValueError("template marker must occur exactly once: " + marker)
        source = (ROOT / path).read_text(encoding="utf-8")
        if "</script" in source.lower():
            raise ValueError("unexpected script terminator in " + path)
        html = html.replace(marker, source)
    if "/*V3_" in html:
        raise ValueError("unresolved V3 bundler marker")
    OUTPUT.write_text(html, encoding="utf-8")
    print("GODSEED V3 standalone HTML:", OUTPUT, OUTPUT.stat().st_size, "bytes")

if __name__ == "__main__":
    build()
