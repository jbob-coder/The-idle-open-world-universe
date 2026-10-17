# GODSEED — STRICT SQUARE-PIXEL ART BIBLE (binding production specification)

**Authority:** `config/pixel-art-contract.json` defines measurable rules, `assets/palettes/medieval-fantasy.json` is the color source of truth, and `assets/asset-manifest.json` is the sprite-atlas inventory. **Status: design and preparatory assets, not completed renderer integration.** Read `docs/PIXEL_ART_ACCEPTANCE.md` before marking visual tasks done.

## 0. Non-negotiable identity

GODSEED is a **true square-pixel, overhead 2D medieval-fantasy simulation**. World details must be deliberately designed **one square pixel cluster at a time**, not vector gradients or an ordinary smooth illustration shrunk down. The default final camera is **higher sky POV: 32 × 20 world cells**; preserve 24×15 close and 16×10 close inspection. The current v0.4 code defaults to 24×15; Codex must make the intentional switch and update tests. Pixel squares, color boundaries, and silhouettes remain crisp at *all* zooms.

The player is an invisible god: no human player avatar, joystick or attack control. Nim and three NPCs act autonomously. Visual polish must never override simulation results, fog, collision, or Faith costs.

## 1. Pixel grid and drawing rules

| Element | Native source dimensions | Anchoring / constraint |
| --- | --- | --- |
| Terrain/roads/water/floor | **16×16 pixels per logical world tile** | Tile origin is upper-left of map cell; world remains 64×48 |
| Nim and traveler frames | **16×24 transparent RGBA pixels** | Feet at (8,23), bottom-aligned to occupied world cell |
| Animal frames | 16×16 baseline; 24×24 only with defined offsets | Wolf/boar only while simulator has those animals |
| Small ground props | 16×16 | Anchor is world-cell origin; can overlap only via explicit layer |
| Medium props/buildings | 32×32 or composed 16×16 segments | **Multiple visual cells do not imply multiple collision cells** |
| Large canopy/roof | explicit 16px segments, maximum visible 48×48 initially | Render foreground after actors but protect visibility |
| Gods' FX | 16×16 frames, limited stages | Finite lifespan, no gameplay mutation from draw |
| UI glyphs | 8×8 / 16×16 pixel source on transparent background | Text label in accessible HTML; icon never sole affordance |
| Atlas texture | source-aligned to 16px grid; ≤512×512 preferred | Atlas sheets remain small and decoded images bounded |

Only literal square pixels, flat color clusters, horizontal/vertical 1px or stepped diagonal outlines. No vector-rendered sprites, soft gradients, anti-aliased strokes, blurred shadows, smooth scaling, bilinear textures, high-resolution photo overlay, simulated paintbrush or semi-transparent sprite-edge pixels. Carefully authored *hard* diagonal stairs are allowed. Visual FX overlays may use limited uniform opacity at the **whole-layer** level when necessary; source PNG sprite edges remain binary alpha.

### Raster test rules
- Native exported sprites are PNG RGBA; every alpha byte **0 or 255** for prepared art.
- Opaque RGB values must belong to the tracked original palette or an explicitly versioned and reviewed palette extension.
- An empty transparent pixel is not visible, so transparent RGB values are not art colors.
- No automatic "smoothing" on edge pixels; avoid indexed-to-RGBA exports creating partially transparent edges.
- Tile cuts, anchor coordinates and 16px subdivision boundaries must match the atlas manifest.
- Multiple 16px tiles may form houses and trees, but avoid painterly whole-screen images as fake terrain.

## 2. Renderer scaling is part of the art spec

- Canvas context `imageSmoothingEnabled = false`; DOM canvas `image-rendering: pixelated`. Ensure any scratch/offscreen canvas, newly created context and sprite destination obey the same rule.
- Draw sprites at **integer world/canvas coordinates** at native source resolution before applying the final nearest-neighbor screen scale. Use integer camera cell offsets, integer sprite anchors, and explicit pixel snapping for 1px outlines.
- Preserve **equal X/Y scale and aspect ratio**. Prefer integer magnification when viewport permits; if landscape safe areas force a fractional CSS display size, use **nearest neighbor** without stretching and test screenshot pixel regularity. Letterboxed margins must be included in pointer→world coordinates, even at 640×360.
- Camera zoom is a viewport dimension switch (32×20, 24×15, 16×10), **not** a simulation tile-size, hitbox, fog or movement speed change.
- Default higher POV must still visibly show Nim and neighboring settlements. Solve poor readability with silhouette contrast or outline, not arbitrary enlargement of physics.
- Scene caching: invalidate after fog reveals, terrain edits, camera move, zoom, and neighboring road/water connectivity changes. Renderer should never advance sim time or alter RNG.

## 3. Exact palette and color discipline

The definitive palette is **`assets/palettes/medieval-fantasy.json`**. Representative existing colors:

| Role | Actual source palette entries |
| --- | --- |
| Shadow / readable outline | `dark #152723`, `black #11191A` |
| Grass / forest | `grass #547E48`, `bright #83A85D`, `moss #31563D`, `pine #264734`, `pine2 #397453`, `pine3 #609966` |
| Paths and wood | `soil #8B6346`, `sand #B49060`, `bark #71513A`, `brown #654737` |
| Stones and ruins | `stone #7D8074`, `stone2 #B7B8A0`, `stoneDark #4B5853` |
| Water / rune light | `water #335F85`, `waterLight #6FA9B7`, `azure #A0DFD0` |
| Characters / accents | `skin #D6A17A`, `blue #6589BA`, `robe #966FAD`, `gold #EFCB76`, `red #A45A44`, `berry #D67482` |
| Text / map distinction | `white #EAE3C1`, `light #B9CA83` |

Use about 3–6 deliberate colors for a **single** small tile variant and ≤12 opaque colors on a character **where practical**. Contrast matters more than palette count. Shading uses stepped tile clusters, not gradients. A new palette shade requires a real edit to source JSON + generator/source art + validation + an explanation in the PR. Do not substitute a random online sprite palette.

## 4. Terrain: 11 semantic tiles, richer variants

Semantic IDs are fixed in `src/sim.js`:
`0 GRASS`, `1 FOREST`, `2 WATER`, `3 STONE`, `4 BERRY`, `5 RUIN`, `6 MEADOW`, `7 CAMP`, `8 ROAD`, `9 VILLAGE`, `10 SHRINE`.

Terrain *appearance* may have a minimum of **three non-identical, authored 16px variants** per tile ID, selected deterministically by world seed, tile coordinates and region. Avoid animation RNG that alters simulation randomness. Frame variants must preserve walkability; a tile painted as deep water cannot behave as a road.

- **Grass/Meadow:** 2–4 square stalks, sparse flowers, earthen chips. Negative space is important; no visual static noise.
- **Forest:** deep green clusters, brown 1px trunk accents, stepped 2–3-tone canopy. Forest floor remains legible from above.
- **Water:** readable darker pool / shallow edge and short **hard-edged** 1px ripples. No transparent blurred waves, smooth caustic or continuous gradients.
- **Rock/Ridge:** stepped boulders, angular strata, 1px cracks, and restrained glints. Distinguish gatherable stone vs decorative gravel.
- **Berry:** one bright berry cluster, dark foliage, harvesting state conveyed by sprite *state*, not new tile ID unless simulator changes.
- **Ruin:** fractured pale blocks, arch remains and weathering, with visible entrance/interaction tile.
- **Camp:** tent/fire/logs on traversable ground; smoke = 1–3 discrete square-pixel frames and reduced-motion static icon.
- **ROAD:** worn dirt/cobble clusters, four-neighbor **N/E/S/W edge masks**, turns, T-junctions and crossroads. A connected visual road **must** be truly walkable.
- **VILLAGE:** timber wall, roof and dark doorway above matching logical town center. No false navigable interiors.
- **SHRINE:** pale standing stone and **pixel rune** distinct from RUIN, no light-gradient glow.

For every terrain: implement variant consistency, border masks where appropriate, and *same seed = same pixel arrangement* across zoom/save/load.

## 5. Buildings and towns

Medieval borderlands architecture: small timber-and-plaster houses, worn clay roof tiles, chimney, dark doorway, village fences, signposts, water well, raised planting bed, stone tower debris and shrine runes. Build **from 16px pieces** (possibly 32px composite objects). A house at the VILLAGE tile is a visual anchor and may extend over neighboring tiles in a depth-sorted prop layer; it must **not** silently block Nim's path. Doors and interiors must not promise playable rooms unless tested scenes exist. Windows use **solid amber 1–2px patches**, not ambient bloom. Roofs use stepped checker clusters rather than anti-aliased diagonals. Every building must have a clear dark/light silhouette against grass.

**Area differentiation for the 8-region plan:**
- R00 Hearthfield: low grass, a few stones and starter camp (open and navigable).
- R01 Briarford: clay/timber cottage, watch sign, palisade segments and yellow road.
- R02 Emberwick: herb pots, garden rows, apothecary shutters and fenced plots.
- R03 Mossveil: dense dark pine with deterministic canopy and logs; actor outline near trees.
- R04 Stormstone: sharp rock clusters, gray-brown quarry chips and stepped ridgeline.
- R05 Crownfall: broken pale stone, ancient arch and dust; ruin remains distinct from shrine.
- R06 Oathkeeper: sacred pine, runestone and cool blue-green carved glyphs.
- R07 Moonwell: tile-bound pond, reeds, water edges, dry walkable paths and pale rune stones.

These visual identities are *required for Codex implementation*, **not currently implemented regional systems**. See `data/world-regions.v1.json` for the area coordinates and game function. The 8 names are design areas, not eight separate massive maps.

## 6. Nim, NPCs and creatures

Actors are **2D 16×24 square-pixel silhouettes**: dark boundary, two readable face pixels, hair/hood, colored torso, two independent feet and one profession prop. Keep feet centered at (8,23) so front/back sorting and positioning stay consistent. Use **four cardinal facing directions** (south/east/north/west). Add 2–4 discrete walk frames, 1–2 idle and a small action state; do not tween body parts continuously between frames.

- **Nim:** identifiable blue/brown tunic, gold utility detail and carrying bag; always visible without a giant overhead label.
- **Ira / Apothecary:** forest-green cloak, herb satchel and light herbal accent.
- **Toren / Squire:** slate/metal armor plates, angular shield, guarded posture.
- **Mera / Rune Scholar:** violet hood, small rune staff and cyan glyph.
- **Wolf/boar:** recognizable quadruped sprites with front/side/back where possible; both are existing simulated enemies. Deer/sheep/birds are planned art/content, **not** existing autonomous animal entities.
- **No photo-real portraits** or 2.5D character models. Close inspection remains the same logical raster design, scaled nearest neighbor.

A selected/targeted creature or NPC gets an unobtrusive **1px pixel corner outline**, not smooth circular blobs. NPC status details in UI remain accessible to readers of small screens.

## 7. Divine powers, icon language and motion

Each god power has a unique **16×16 pixel glyph** plus readable text:
`Inspect`: white/gold four tile corners; `Bless`: vertical cross; `Gift`: ration/satchel; `Bloom`: angular sprout; `Guide`: stepped wayfinder; `Storm`: stepped lightning; `Inspire`: rune halo above a revealed traveler.

Animated effects: generally **4 frames**, maximum **8–12 small frames** and 8–12 fps as a design limit; keep particle/alpha cost bounded. Brief colored pixel flickers are allowed; no radial gradients, no Gaussian blur, screen shake, motion-blurred lightning or GPU shaders. `prefers-reduced-motion` replaces movement with a static sharp symbol + chronicle entry. Gameplay effects come *only* from `GodseedSim.power`; no render-time Faith deduction or reward.

## 8. HUD / Android UI uses pixels too

The **HUD is part of the style**. Square-corner pixel frames, 1–2px solid borders, flat limited colors, stacked pixel-square icons, crisp selection state. Avoid modern glossy cards, pill buttons, blurred glass, radial background, giant emoji controls, gradient borders and soft drop shadows. HTML/CSS native text may use a readable system monospace as a pragmatic fallback; **do not fake pixels by rasterizing tiny unreadable fonts**. Maintain contrast and touch area; decorative borders must not consume the interactive hit target.

At 640×360 landscape the world remains the focal point and **all ten dock controls** (god powers/time/zoom) stay accessible with text labels. Nim's current goal/thought and a small Faith/event cue must be visible or immediately accessible. Respect device safe areas.

## 9. Performance, exports and QA

**Device target:** Android phones with 2–3 GB total RAM. Preferred app process resident memory 128–192 MiB and provisional 256 MiB soft ceiling, **not measured**. Use compact shared atlases and terrain caching; avoid full-scene raster backgrounds, high-resolution animated layers and loading optional disk packs into RAM. Current world 64×48, camera 32×20 maximum common view. Keep the original 4 starter atlases reproducible via `node scripts/generate_starter_assets.mjs`.

For each visual slice require:
1. Source raster atlas + palette/manifest update (if changed).
2. `node scripts/validate_asset_manifest.mjs` and `node scripts/validate_pixel_art_contract.mjs` (checks artifacts/rules, not artistic excellence).
3. Browser screenshots from **running compiled game** at 640×360, 720×400 and 960×540 × all 3 zooms; compare crops at 1× and 4× magnification.
4. Verify shoreline/roads/nav match simulation, actor visibility in forest, status and divine feedback, no runtime JS errors, save compatibility and offline operation.
5. Actual Android RAM/FPS/visual checks on a 2GB and 3GB phone **when available**; otherwise hardware QA marked BLOCKED, never fabricated.

## 10. Forbidden vs allowed decisions

**HARD FAIL:** sloped/isometric perspective; smooth vector sprites; fuzzy edges; gradient shading on pixel sources; downloaded nonoriginal sprite sheets without licenses; 3D models; a high-res painting used as the world terrain; animations generating game state; excessive modern glossy UI; silent renumbering of 0..10 tile IDs; blurry zoom/filter; multiplying logical hitboxes because sprite is larger; visually traversable but logically blocked routes.

**Allowed with proof:** sparse stepped diagonal lines, carefully selected transparent overlays for whole FX layers, integer-pixel outlines, nearest-neighbor zoom, composited 32px buildings from 16px tiles, art palette extension with provenance and tests, accessibility-focused readable OS font, optimized chunk loading where it does not break offline saves.

## 11. Handoff requirements for Codex Cloud

Codex shall review each slice against this bible. If an art reference conflicts with gameplay readability, **favor playable pixel-square readability**, not an imitation screenshot. Do not mark tasks A/B/C/D/E or W as done until the new art actually appears in the running game. `docs/PIXEL_ART_ACCEPTANCE.md` is the review matrix. Existing concept SVGs and PNG starters are **references/prep material**, not proof of production integration.
