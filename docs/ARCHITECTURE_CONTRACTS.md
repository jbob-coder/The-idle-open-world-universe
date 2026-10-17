# Architecture contracts for CodeX Cloud

## Source of truth now
- `src/sim.js`: UMD; `GodseedSim` on browser, CommonJS for Node. Exposes `create,tick,power,findPath,walkable,idx,inside,serialize,restore,validate,plan,improve` and constants. World: W=64,H=48,N=3072, tile IDs 0–10, three active NPC max, Faith powers.
- `src/ui.js`: browser IIFE; canvas rendering, camera, sprites, user input, saves. Sets `window.GodseedDebug` for tests, including `getCamera()`.
- `index.template.html`: includes literal marker `/*SIM_SOURCE*/` and `/*UI_SOURCE*/`; `python build.py` replaces marker with source to produce self-contained `GODSEED-Play.html`. Native WebView loads same offline HTML.
- `android/build_apk.py` produces SDK-free experimental debug APK; signer isn't protected release identity.
- `tests/sim.test.js`, `tests/medieval_world.test.js`, Python Chromium mobile checks, `tests/test_android_package.py`.

## Renderer extraction strategy
Do NOT blindly import ES modules in HTML; old WebView and standalone packaging must continue working.
Option A (safer): author `src/render/*.js` as IIFEs exporting namespace `window.GodseedRender`; adjust `build.py` to embed them **between** sim and UI in a stable order and update verification.
Option B: retain `src/ui.js` as bootstrap but expose small pure renderer factories, concatenate sources at build time. Either must keep the offline single HTML and proper test ordering.

Proposed renderer boundaries (not asserted to exist yet):
`terrain.drawTile(ctx, tileId, x, y, neighborMask, variant)`
`terrain.drawWorld(ctx, state, camera, dirtyGrid)`
`actors.draw(ctx, actor, camera, animState, role)`
`fx.enqueue(event)/draw(...)`
`hud.bindControls()/refresh(state)`
`camera.worldToCanvas(x,y)/pointerToWorld(clientX,clientY,bounds)`.
Do not introduce rendering mutation in `GodseedSim.tick()` or `power()`.

## Camera semantics
`camera={x,y,width,height,tilePx:16}`; world tile center projects to canvas `((tileX-camera.x)+0.5)*16`, similarly Y. Default target high sky 32x20; near 24x15; inspect 16x10. Canvas backing dimensions = width*16 x height*16. CSS presentation must preserve aspect; pointer conversion must subtract letterbox/pillarbox margins. Snap on integer tile positions; do not change collision/path calculations on zoom.

## Persistence and migration
Save key `godseed-one-small-life-v1`, format `version:1`; `serialize` and `restore` are the only authority. Renderer settings may be stored in settings only if migration keeps old data valid. Do not wipe old saves or change signing identity silently. Test saves without `npcs` or shrine journal, and invalid/oversized saves.

## Asset pipeline
Treat `assets/asset-manifest.json` as source of dimensional truth. PNGs in `assets/generated/` are starter art, not a finished atlas contract until the integration layer maps IDs. Keep source palettes and SVG concepts; prefer offline compact decoded textures and full-frame atlas reuse. Generate asset bundles at build time if formats need adaptation; no network fetch at runtime.

## Autonomous behaviors
Nim policy remains decision-first and deterministic seeded; three travelers move without user commands. No simulated consciousness. New narrative/visual decoration must not introduce hidden path blockers or periodic effects that alter resource economics unexpectedly.
