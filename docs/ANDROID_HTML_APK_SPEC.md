# GODSEED — Why HTML is used inside the Android APK, and the target packaging design
**Architectural decision (2026-10-17): Keep the JavaScript + Canvas game, but make Android hosting trustworthy and maintainable.** This document distinguishes what exists, what should be improved and what Codex must validate. An HTML game inside WebView is a legitimate Android application design, not a website that requires internet.

## 1. Existing architecture — factual
```text
Android debug APK (.apk)
└─ minimal Android Activity
   └─ android.webkit.WebView
      └─ file:///android_asset/index.html  ← bundled local offline game
         ├─ HTML: buttons, panels, menus and <canvas>
         ├─ CSS: landscape layout and pixelated scaling
         ├─ JavaScript simulation (src/sim.js): Nim/world/NPCs/god powers
         └─ JavaScript UI (src/ui.js): Canvas2D terrain, sprites, camera, input, save UI
```
`build.py` takes `index.template.html`, replaces `/*SIM_SOURCE*/` and `/*UI_SOURCE*/` with local JS, and emits `GODSEED-Play.html`. `android/build_apk.py` currently constructs a minimal **experimental, SDK-free** Android package with handcrafted DEX and Android binary manifest; embeds this HTML as `assets/index.html`; uses `keytool` and `jarsigner` with a debug key. `src/ui.js` currently uses `localStorage` and JSON export/import. This package targets SDK 28 with min SDK 26 (Android 8.0). Structural/package signature tests exist, **but successful installation/launch on physical Android has not been established**.

The current builder is an inventive development artifact; it is NOT a supported production APK toolchain. GitHub Actions changes the debug signing identity between runs.

## 2. Roles — what HTML does and does not do
- **HTML** describes the document: canvas, interactive power buttons, NPC panel, log, menus, backup controls. It is not the world simulation.
- **CSS** sets screen geometry, device safe areas, pixel-perfect scaling, touch targets, responsive HUD and appearance.
- **JavaScript** executes the **local** decision-making rules and state transitions for Nim, autonomous NPCs, wildlife, weather, inventory, leveling, story clues, powers and persistence logic. No LLM is required.
- **Canvas 2D** draws the 2D tiled fantasy world inside a canvas managed by the HTML page. Its graphics may come from original sprite atlases packaged as local assets.
- **WebView** is the Android system browser component embedded in the APK. The app can run fully offline when all code/fonts/images are packaged locally and no runtime network calls are made.
- **Android host** controls activity lifecycle, orientation, storage bridges if deliberately introduced, system back behavior, packaging, signature, app icon and release updates.

## 3. Why keep WebView for this project now
The small 64×48 world, low NPC count, deterministic JS planner and lightweight Canvas2D renderer can fit this approach. It supports fast iteration and reuses the proven browser-side tests and assets; migrating to Godot or Java/Kotlin would require a rewrite without proven performance gain. The key engineering problem is **efficient drawing and reliable Android lifecycle**, not the mere presence of HTML.

WebView still has startup/runtime overhead and variation across Android System WebView versions. If profiling shows hard limits even after caching/render optimization, compare alternative native rendering *using recorded device measurements*, not assumption.

## 4. Desired target architecture (keep separation)
```text
src/sim.js        Pure deterministic world simulation + save/restore
src/render/*      Optional local-only renderer modules; no game state mutations
src/ui.js         Camera, player-god controls, UI, scene coordination
assets/generated/ Tiny sprite atlases + manifest (or approved upgraded originals)
index.template.html / build.py
                 Assemble reliable offline web entrypoint with explicit local assets
android/          Maintained Android host + activity lifecycle + packaging
tests/            Simulation, renderer, browser, offline, save and APK smoke
```
**Recommended packaging path for a maintainable APK:** a conventional **Android Gradle Plugin + Kotlin/Java WebView activity**, built with a pinned supported JDK/Gradle/AGP/Android SDK toolchain. Keep the existing SDK-free builder as historical/experimental or development-only fallback. Migrate to Gradle only as a **separate tested deliverable**, not a casual builder replacement. Validate compatibility with Android 8/API 26, and verify current Play-distribution target requirements *at release time* rather than hardcoding today's guesses.

An optional `androidx.webkit.WebViewAssetLoader` can serve bundled local files under an HTTPS-style asset origin for better origin isolation; this is not required for a first browser demo. If adopted, test storage migration because `file:///android_asset/index.html` and `https://appassets.androidplatform.net/...` have **different origins**, and localStorage does not automatically move. Preserve JSON export/import and/or implement a deliberate, tested migration bridge. Never silently strand or erase existing saves.

## 5. WebView host requirements
1. Landscape support and tested safe-area/viewport behavior with system bars and cutouts. Use a modern theme and explicit orientation policy; do not assume fixed window pixels.
2. Enable JavaScript and DOM storage only for trusted local game content. Disable unsafe universal/file-origin cross-access; restrict navigation to packaged game content. Do not enable remote browsing or untrusted content.
3. Default **offline**: bundle HTML, JS, CSS, pixel PNG atlases and all fonts/icons; no CDN, analytics or network permission. Audit Chromium/Android network requests in tests.
4. Correct lifecycle: stop simulation on pause/background and persist before host destruction; resume without double-running intervals, duplicating events or corrupting `localStorage`.
5. Robust backup: support export/import JSON, enforce size and schema checks, recover from full/unavailable storage, maintain previous saves on failed import.
6. Back/escape behavior: close dialog/inspect first, avoid accidental exit or data loss; no arbitrary browser history navigation.
7. Device scaling: `imageSmoothingEnabled=false`; all event targeting must account for camera pan/zoom and CSS letterbox/pillarbox. Buttons reachable at 640×360, 720×400, 960×540 and appropriate device scale factors.
8. Minimal permissions. Security hygiene: no overly permissive `addJavascriptInterface` bridge unless strictly required and restricted to trusted content; no executable code downloaded or injected from network.
9. Stable application package identity and protected **release signing key** stored outside the repo; CI debug keys are not release identities. Export save before moving between incompatible signatures or storage origins.
10. Generate a reproducible build report: tool versions, source commit, APK SHA256, min/target SDK, asset contents, signature verification and test counts; label untested hardware honestly.

## 6. Asset delivery choices
Option A: embed small sprite atlas PNGs as data URLs in the self-contained HTML (simple compatibility, but bigger HTML/base64 overhead). Option B: package asset files in the APK under assets and load with a trusted local/asset-loader URL (better caching and organization); browser preview must also have its matching local directory or a build-time single-file variant. Decide explicitly and test both browser and APK flows.

The current `build.py` embeds **scripts only**; committing `assets/generated/*.png` does NOT make the APK renderer use them. Codex must wire atlas loading, verify decoding and inspect browser screenshots. Never claim the atlas is in-game merely because files exist in Git.

## 7. Verification and release gates
**Required on CI:** Node simulation tests, deterministic asset generator verification, valid manifest, browser smoke at 3 viewports × all zooms, no JavaScript errors or network requests, touch targeting, old save migration, APK package/signature checks and honest artifact metadata.

**Required before claiming phone-ready:** actual install/launch on target Android hardware (preferably a low-end device), foreground/background restore, permission inspection, 20-minute unattended world run, FPS/frame pacing, RAM/CPU and battery observations, JSON backup/restore, screen recording and compatibility testing after build/signing changes. An emulator supplements but does not replace old-device profiling.

**Release blockers:** no verified install, missing signing continuity, persistence loss, touch targeting errors, unlicensed art, crashes, or budget-breaking frame times. Do not ship production APK through the experimental SDK-free builder merely because structural tests pass.

## 8. Migration strategy
**Phase 0:** preserve existing browser gameplay and current debug APK as baseline; snapshot saves and test files.
**Phase 1:** integrate 32×20 sky camera + pixel atlas art + divine FX inside existing Canvas stack; keep `src/sim.js` API stable.
**Phase 2:** run performance and storage/backup tests on old Android; tune frame rendering and memory.
**Phase 3:** create and verify conventional Android WebView host/Gradle build on an isolated branch, if tooling and physical testing are available. Match manifest/package identity deliberately, keep protected signing identity, and run migration checks. Do not force a packaging migration simply to finish the art task.
**Phase 4:** production-readiness review only after the device, signing, target-SDK and privacy checks pass.

**References:** `docs/ARCHITECTURE_CONTRACTS.md`, `docs/PERFORMANCE_BUDGET.md`, `docs/SAVE_SYSTEM.md`, `docs/TEST_PLAN.md`, `docs/HANDOFF_READINESS.md`, `android/build_apk.py` and `build.py`.
