# GODSEED v0.1 — Verification report
Date: 2026-10-17. Scope: offline low-end Android prototype.

## Confirmed tests executed

- Node simulation unit tests: 10/10 passed. Covers generation, deterministic state, God actions, bounds, pathfinding, leveling, reincarnation, JSON save validation, 2,000 tick stress and multiple seeds.
- Chromium desktop/mobile browser: 1280×800, 720×400 and 390×844 smoke tests passed, zero JS page exceptions, zero HTTP(S) requests observed.
- Chromium touch-focused: 720×400, 640×360 and 960×540 passed with eight landscape dock actions at least 44 CSS pixels high. A power selection + map action spent Faith; JSON backup export/import restored state; zero JavaScript exceptions and zero outgoing HTTP(S) requests.
- Offline HTML bundle: source embedded locally, no remote fonts/scripts/images.
- APK: ZIP integrity verified. Binary Android XML/DEX headers and offsets checked. DEX checksums valid. Embedded HTML bytes match built HTML. JDK `jarsigner -verify` returned success. Target API 28, minimum API 26, landscape, no INTERNET permission.

## Not verified (mandatory before calling this an Android release)

- Installing, starting or running the exact APK on physical Android hardware, including a low-memory Android 8 device.
- Android runtime acceptance of the SDK-free hand-assembled Dalvik DEX and compiled AXML.
- Android WebView behavior for `file:///android_asset` persistent storage on specific device versions.
- Font/touch/system navigation overlays, app resume and backup clipboard behavior on devices.
- Battery impact, frame time, memory, crash logs and multi-hour unattended running.
- v2/v3 APK signing, Google Play compliance, official Android SDK build, ABI compatibility (host is Java-only).

## Release classification

**Build artifact generated and signed, Android installation unverified.** It is an exploratory debug package, not production-ready. Debug key is included only in the developer source bundle for iterative compatibility; replacing it with a protected production key is required before real distribution.

## Acceptance on device — exact procedure

1. Install `GODSEED-Android-v0.1.apk` on Android 8.0 or later. Note device model, Android System WebView version and Android version.
2. Launch in landscape without networking. Screenshot the world and bottom god powers bar.
3. Allow Nim to gather, move and level; test 1×, 3×, pause, resume; inspect event log.
4. Select Bloom and tap near an open tile; ensure Faith decreases and new berries appear. Test Bless and Gift Food.
5. Save, force-close, reopen and confirm Nim's level, inventory, location and world state persist.
6. Export JSON text, copy to note, start a fresh world, paste import JSON and verify restoration.
7. Spend 20 minutes with screen active and check for WebView process crashes, memory pressure, unusable touch regions, and overheating.
8. Record result (PASS/FAIL), FPS/battery/memory if possible, and device evidence. Promote only after all required gates pass.
