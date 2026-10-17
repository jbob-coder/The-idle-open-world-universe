# The Idle Open World Universe — GODSEED

**GODSEED v0.1** is the first experimental build of an **offline Android god-observation RPG/simulation** for older phones. You are the god; **Nim** is an independently acting, rule-driven pixel-world inhabitant. You cannot control Nim directly. You can watch exploration, survival, crafting, wildlife encounters, leveling and memories, and change the world indirectly using Faith-powered divine actions.

![720×400 gameplay preview](assets/godseed-android-landscape-720x400.png)

## Download and play

- **[Download the Android APK (v0.1 debug prototype)](dist/GODSEED-v0.1-debug.apk)** — minimum Android 8.0/API 26; landscape; offline; no requested Android permissions. Install manually from a source you trust. Android may block unknown apps by default.
- **[Play the offline HTML preview](GODSEED-Play.html)** — downloads as one self-contained file. Browser storage and Android app storage are separate.
- [Project state and next five tasks](PROJECT_STATE.md) · [Full design batches](docs/DESIGN.md) · [Verification evidence](docs/QA_REPORT.md)

**Do not treat this as a production-ready APK.** The Android package's hand-generated Dalvik/bootstrap and WebView storage behavior have **not been verified on a physical Android device or emulator**. The APK is **JAR v1 debug signed** and targets Android API 28. It is not Play Store compliant by current standards. Back up gameplay data using the built-in text export before uninstalling, clearing app data, or changing signing identities.

## What exists

The procedural world uses a 64×48 tile grid rendered with 2D Canvas and minimal pixel styling. Nim independently chooses priorities from hunger, energy, danger, resources and discovery. It pathfinds across available land, gathers resources, levels up, attempts crafting and shelter, explores ruins, and records events. Faith buys Heal, Food, Bloom, Guide or Lightning interventions. The player can pause, step, and adjust game speed.

Nim is **not a sentient AI or LLM**. This is a small deterministic simulation with fixed, inspectable decision rules, designed to work offline on low-end Android hardware. Simulation runs **only while the app is open**; no background world evolution is implemented.

## Structure

- `src/sim.js`: game simulation, Nim's planner, persistence validator, progression, wildlife, and god powers.
- `src/ui.js`: rendering, mobile controls, chronicle, backups, speed, camera, and minimap.
- `index.template.html`, `build.py` → `GODSEED-Play.html`: standalone browser game.
- `android/`: Android reference manifest/activity and the experimental SDK-free APK builder.
- `dist/GODSEED-v0.1-debug.apk`: signed experimental Android artifact, not a tested store release.
- `tests/`: Node simulation, browser/mobile smoke, and APK structure checks.
- `docs/`: roadmap and QA limits. `assets/`: real browser captures.

## Reproduce

Needs Python 3.11+, Node 20+; for APK rebuild requires Java JDK (`keytool`, `jarsigner`). The desktop browser tests additionally need Playwright and Chromium; those are not required to run the game.

```bash
python build.py
node --test tests/sim.test.js
python android/build_apk.py
python tests/test_android_package.py
# With Playwright + Chromium available:
python tests/browser_smoke.py
python tests/mobile_acceptance.py
```

The SDK-free builder creates a **new debug keystore** in `android/debug-only/` if none exists. This folder is gitignored and **must never be published or used for production signing**. CI signs with an ephemeral key; builds from different machines are **not update-compatible** without the original key. A supported Android SDK/Gradle build and protected signing identity are needed before distributing stable updates.

## Source of truth

This repository contains the code and project documentation. Work in verified batches of five tasks and update `PROJECT_STATE.md` whenever gameplay or packaging changes. Prioritize battery efficiency, reliability, save continuity, readable pixel UI and unattended Nim behavior over 3D graphics or large AI models.

## Status

- 10/10 deterministic Node simulation tests passed in the transfer environment.
- Offline browser smoke and mobile-size controls/backup tests passed in Chromium.
- APK ZIP, binary manifest, DEX structural checks and JAR-v1 signature checks passed.
- Physical Android installation, frame rate, battery and memory measurements: **not verified**.
