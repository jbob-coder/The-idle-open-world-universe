# Acceptance and regression test plan

## Existing checks that must keep passing
`node --test tests/*.test.js` — simulation logic, medieval map, NPC favors, shrines and save migration.
`python build.py` — bundles offline HTML.
`python tests/browser_smoke.py`, `python tests/mobile_acceptance.py`, `python tests/capture_android_layouts.py` — browser acceptance (requires Playwright and Chromium; may need file:// permission depending on environment).
`python android/build_apk.py`, `python tests/test_android_package.py` — build and structure/signature tests (JDK may be required).

## New tests to add as Codex implements slices
1. Camera high sky default 32x20; near 24x15; inspect 16x10. Existing v0.4 currently defaults to 24x15 — update tests when intentionally implementing this change.
2. World-to-screen and screen-to-world roundtrip: center and boundary tiles, panning and Follow, all zooms, noninteger CSS scales and viewport letterbox.
3. Terrain renderer: deterministic atlas variant by tile/world seed, no RNG side effects or simulation mutation; shore/roads mask composition and rendering bounds.
4. Sprite animation: 4 cardinal directions, idle, walking, action; sorted actor feet; NPC occupation contrast at 32x20; no disappearing under canopies.
5. Divine reaction: one success => one event, one Faith debit, one visual FX; reject on unseen or invalid target with no debit. Verify 3 NPC roles.
6. Keyboard/touch and mobile UI: 10 controls visible, hit targets >=40 px on tested devices, accessible labels, safe area, pause/resume and power switch.
7. Persistence: export/import old v0.1–v0.4 JSON; restore missing fields; save with active god FX; no save schema change from purely visual work.
8. Offline: turn off network; all dependencies local; no failed external network requests.
9. Long run: >=10,000 deterministic ticks sampled for pathological loops, unbounded entity growth, Faith exploits, and save size.
10. APK: reproducible dev build, sign/manifest/ZIP check, Android launch **only if device/emulator actually available**. Record model/OS/FPS/memory.

## Evidence format per slice
Include: commit, changed files, test command, pass/fail count, screenshot names with browser or device attribution, known blockers, performance before/after. Do not label desktop Chromium captures as phone screenshots.

## Exit criteria for Codex
All relevant automated tests green, offline HTML opens, all 3 zooms pan and target correctly, autonomous Nim untouched, assets loaded entirely locally, UI readable at 640x360/720x400/960x540, APK structure valid, precise disclosure of hardware verification state, no committed keystore. Unverified physical install is a release blocker, not a reason to claim completion.
