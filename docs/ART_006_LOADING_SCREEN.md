# ART-006 — GODSEED Offline Loading Screen

## Game implementation

The GODSEED startup screen is installed inside the actual playable HTML and, therefore, the Android WebView APK built by `android/build_apk.py`. It uses a **local** pixel village composition with cottages, living farmland, a river, Nim, a divine shrine and the main brand.

- `assets/ui/godseed-loading-village.svg`: inline 640×360 crisp-edge vector pixel scene. It is a small, fully self-contained game-asset interpretation of the loading-screen visual concept. No remote assets, external fonts or browser fetch requests.
- `assets/ui/godseed-loading.css`: responsive splash panel for landscape and small Android screens; readable title, tagline and accessible live progressbar; `prefers-reduced-motion` honored.
- `src/splash.js`: loading state, safe dismissal, retry on decoding failure. `GodseedSplash.getState()` for regression checks.
- `src/ui.js`: reports meaningful stages only, then marks 100% when `GodseedAssets.loaded` resolves AND the first world `draw()` succeeds. No simulated waiting period or fake wall-clock percentage.
- `build.py`: embeds the SVG, CSS and JavaScript directly in `GODSEED-Play.html`. The native APK uses exactly this generated HTML; no extra permissions.
- `tests/loading_screen_acceptance.py`: Chromium offline at 720×400 and 640×360, image/heading/progress, atlas readiness, screenshot, manual preview close, game interaction and automatic production dismissal.

## Lifecycle contract

Initial splash markup renders without waiting on JS. The code reports roughly 20% after the simulation loads, 42% after the world and save are initialized, 75% when the initial world display is prepared, and **100% only after all image atlas assets have decoded and the world has drawn**. These coarse percentages identify discrete stages; they are not a byte transfer count or an ETA. If an atlas fails, the splash remains with a retry button. No timer is used to hide the splash.

Normal game: `#godseedSplash` is `hidden` as soon as a completed draw and one paint are available. For accessibility/visual QA only, `?splashPreview=1` holds the completed image until the tester selects “Entrar al mundo”; it does not pause or alter the simulation.

## Status and limitations

- Scope: splash/startup UI, brand, offline packaging and automated visual acceptance. No edits to game story, autonomous decisions, saves, battles or tile topology.
- As built, this is a native-pixel **SVG reconstruction for the splash**, not the full-resolution image-generation master. The original high-resolution concept is a reference; the compact vector was chosen to keep Android offline loading and app resources bounded. Artwork may be iterated independently.
- Do not claim this passes physical low-end phone testing until issue #13 produces actual 2GB/3GB measurements.
- `main` not modified; ART-006 goes through review and merge authorization. The splash task is not marked `done` simply because its PR passes CI.
