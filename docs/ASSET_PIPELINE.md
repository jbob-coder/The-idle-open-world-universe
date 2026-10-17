# Asset production pipeline

The repository prep branch ships newly designed **source concepts**, palette, machine-readable manifest and starter pixel sprite atlases. The atlas examples are *starter assets*, not a complete final animation library. Planned placeholders are recorded explicitly in the manifest, never represented as completed.

1. Palette: `assets/palettes/medieval-fantasy.json`. Use fixed opaque colors and simple 1-pixel clusters.
2. Concepts: `assets/concepts/godseed-skyworld-overview.svg`, `godseed-character-inspect.svg`, `godseed-divine-reaction.svg` are explanatory design references. They do not render in-game and do not demonstrate Android performance.
3. Raster starter sheets: `assets/generated/terrain-starter.png` (11 tile semantics × 3 visual variants, 16×16 each), `actors-starter.png` (simple Nim/NPC reference frames), `fx-starter.png` (pixel-sharp divine icons). They are separate from production implementation. A manifest declares exact atlas regions, scale and ownership.
4. `assets/asset-manifest.json` lists committed files, dimensions, tile→sheet mapping, and planned assets not yet drawn; no phantom paths for shipped assets.
5. On implementation, either directly consume starter sheets or redraw assets to the production art bible. Do NOT silently upscale low-res rasters with interpolation or put high-res illustrative concept art behind sprites as a terrain wallpaper.
6. Use only original work or openly licensed assets with attribution and recorded license. Fonts: platform system or licensed bundled pixel font (do not include third-party font files by assumption).
7. Convert source art into a few compact RGBA PNG atlases, cache Image elements, and ensure all art works with Android WebView offline file:// origin. No runtime fetch dependencies.
8. Capture actual Chromium scene after each implementation slice; the user's art reference is not an acceptance screenshot.
9. Run an asset-manifest integrity check to verify dimensions and semantic coverage; include any generator reproducibility test with commit.
10. Update `assets/README.md` whenever statuses change. Avoid bloating Git history with large rendered mockups.

Asset request tracking: see `docs/IMPLEMENTATION_SLICES.md` and `work-items/codex-tasks.json`. Art statuses are `starter` (exists as source/reference but not integrated), `planned` (not drawn), `implemented` (connected to runtime and tested). Current handoff makes no claim to implemented art.
