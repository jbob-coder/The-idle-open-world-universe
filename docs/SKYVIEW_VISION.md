# GODSEED — high-sky world vision (implementation target)

**Purpose:** the player is a deity watching one independently developing life and a tiny medieval-fantasy world; the world is the stage, not a wallpaper. Nim and NPCs decide things locally and can surprise the observer.

**POV:** perpendicular, normal top-down sky view, never angled or pseudo-isometric. Keep it high enough to see roads, villages and interactions simultaneously. The camera tracks Nim only when Follow is on; god can pan/inspect anywhere permitted by camera rules.

**Important distinction between existing code and target:**
- v0.4 already has camera `Cerca:24x15` (default), `Muy cerca:16x10`, `Panorama:32x20`.
- Target **higher primary sky POV**: make `Panorama 32x20` the default, `Cerca 24x15` for tracking, `Inspección 16x10` for sprite details. Keep all three accessible without changing underlying map coordinates. Do not mislabel existing implementation as target state.
- Rendering logical cell = 16x16 nearest-neighbor pixel units. On screen, pixel squares remain hard-edged; avoid smooth interpolation. Nim is 2D with a recognizable silhouette at every zoom, with outline/focus ring as necessary.

**Composition:**
- 65–75% of usable landscape view devoted to world when panels collapsed.
- A compact top strip shows day/season/weather/Faith. Bottom commands are for god powers, zoom and time; no joystick.
- Show "What Nim is doing" and "Why" in a readable status strip and optional journal. NPC/encounter details accessible on inspect.
- A minimal minimap or overlay provides location awareness; do not obscure actors. Do not change the logic simulation's 64x48 world in this art pass.

**World readability hierarchy:** traversable paths → hazards/water edges → destinations (hamlets/camp/shrine/ruins) → living actors → current divine targeting → decoration. Decoration must never make passable/impassable tiles ambiguous.

**Fantasy medieval identity:** timber/stone cottages, thatched roofs, mossy masonry, runestones, carved village signs, field boundaries, herbs, wagons, trees and worn dirt trails. Restrained mystical effects. No modern signage, tech, realistic 3D materials or borrowed franchise art.

**Not visualized as a command simulator:** Nim walks, forages, studies a shrine, encounters the apothecary, squire or rune scholar, and learns from those events. If the god blesses a shrine or inspires a traveler, visual feedback marks the change but never directly overrides Nim's policy.

**Definition of success:** At 640x360 users identify Nim, 1–2 nearby points of interest and the selected god power without zooming the page. The world texture is *constructed of pixel squares* at native 1x asset resolution, not high-resolution illustrations scaled down.

**Non-goals in this implementation package:** replacing a 2D simulation with an LLM, adding background simulation after app close, network multiplayer, seamless 3D interiors, or merging the experimental PR stack automatically.
