# Pixel world art bible — medieval skyworld

## Hard grid and raster requirements
- Simulation tiles remain 16x16 logical pixels and world 64x48. Keep terrain sprites 16x16. 2x2 decoration uses 32x32 logical pixels (drawn across cells with an explicit anchor and layering rule).
- Actor base frame 16x24 pixels (feet at y=23), optional 24x32 portraits only when inspecting; do **not** enlarge physics collision or AI ranges. NPC frames use same anchor. Creature frames 16x16 or 24x24 with offsets; never stretch with bilinear filtering.
- CSS canvas: `image-rendering:pixelated`; JS 2D contexts: `imageSmoothingEnabled=false`. Draw integer screen/world coordinates. No translucent blur or anti-aliased lines within sprite sheets.
- The world should be legible from **32x20** default sky POV, with 24x15 and 16x10 inspection zooms. More detail means better clusters of individually placed pixels, not more render cost per frame.

## Palette (source: assets/palettes/medieval-fantasy.json)
Terrain: deep moss #254536, pine shade #183527, grass light #6A9960, herb #9FC780, earth #977354, warm dirt #BE9269, light stone #B6AEA0, stone shadow #686C69, stream #376A84, water glint #85B4B7, parchment #E4D7B4.
Architecture: timber #62432F, roof clay #995E40, roof highlights #CB8D58, window #F3CD85, shrine rune #8EDDD0.
Actors: readable dark outline #172421 with one warm face/hair highlight; cap simultaneous opaque colors in an actor sprite to 12 where possible.

## Base tiles (semantic IDs MUST match src/sim.js)
0 GRASS, 1 FOREST, 2 WATER, 3 STONE, 4 BERRY, 5 RUIN, 6 MEADOW, 7 CAMP, 8 ROAD, 9 VILLAGE, 10 SHRINE. Terrain *variants* are visual-only and derived from deterministic position hash, not new game logic IDs. Never repurpose these numeric IDs.

## Asset design rules
- One recognizable focal motif per tile: grass blades, leafy canopy, wave, boulder, berries, ruin pillar, flowers, cloth shelter, dirt road, house roof, rune obelisk.
- Use 3 terrain visual variants per base tile; environmental decorations selected through a seed+tile-coordinate hash (no per-frame RNG, no mutated terrain). Reuse a small atlas rather than hundreds of tiny image objects.
- Roads join through 4-neighbor connectivity masks (N/E/S/W). Render junctions/turns with pixel-sharp corners; draw road *on top* of grass but below props and characters. Do not create deceptive impassable cliffs in walkable tiles.
- Water edge sprites are optional; if implemented, choose based on adjacent WATER cells. Keep collision map authoritative even when shore art overlaps another cell.
- Tree canopies may overlap neighboring cells via a separate prop layer but cannot obscure Nim completely. Fade/reduce foreground canopy opacity near player, or provide a high-contrast 1px actor outline.
- Houses: clear roof + door + lintel, anchored to existing VILLAGE tile. Do not imply interiors exist yet. Camp: cloth + hearth. Ruin/shrine: visually distinct, e.g. broken arch vs glowing runestone.
- Effects: max 8–12 frames at 8–12fps when visible, compact sprite overlays, no blurred bloom. Prefer 4-frame sequence.
- Fantasy details: fences, carts, herbs, waystones, roots, flowers, cobblestone; visually sparse, 1–4 decorative motifs per tile at most. Avoid noisy all-over speckling.

## Layer order
1. opaque grass/terrain base
2. shore/road adjacency overlays
3. small details behind actors
4. buildings/large tree lower half
5. dynamic actors sorted by foot Y (Nim, NPCs, wolves, boars)
6. canopies/foreground props, with visibility safeguards
7. gods' effects, targeting and HUD

## Art delivery
Use committed starter source at `assets/tiles/`, `assets/sprites/`, `assets/fx/`, `assets/ui/`; high-level references under `assets/concepts/`. `assets/asset-manifest.json` records atlas mapping, dimensions, status and planned final additions. No external copyrighted sprite packages without proper license documentation. All source art in this handoff is newly produced starter art, not a claim that every planned animation is already complete.
