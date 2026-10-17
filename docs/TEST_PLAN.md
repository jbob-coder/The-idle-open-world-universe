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

## Additional storage acceptance tests (S01–S05, not yet implemented)

Check core works with zero optional content, user opt-in, correct decimal GB versus GiB, accounting of APK/app data and separate RAM. Test 5 GB optional boundary, nominal 6 GB combined cap, phone with 0/300 MB free, free-space reserve, staged expansion peak usage, interrupted/oversized/corrupt pack, safe delete without wiping saves, old-save migration and measured actual Android install. `node scripts/validate_storage_budget.mjs` validates *planned policy numbers* only; runtime enforcement requires new tests and device evidence.

## Low-RAM compatibility checks

Target Android devices with **2 GB total physical RAM** and **3 GB total physical RAM** separately. Measure process PSS/RSS, WebView memory, frame time/fps, zoom, 20-minute autonomous run, NPC/divine scene, export/import and background resume. Engineering target **128–192 MiB resident** and **256 MiB provisional soft ceiling**; not yet verified. Check that optional 5 GB storage packs do **not** grow resident memory in proportion to their on-disk footprint. The `node scripts/validate_hardware_budget.mjs` CI check verifies documentation/configuration only, not runtime memory safety or a device benchmark.

## Added foundation and world topology validation (F01–F05, W01–W10)

Use `node scripts/validate_world_blueprint.mjs` for metadata and existing seed-map sanity, **not as proof of new regions running**. For implementation, add seeded topology and coverage tests across at least 100 seeds, walkable BFS to both villages/two shrines/one ruin, safe spawn, food/wood/stone floor, capped NPC/wildlife, meaningful regional discovery, one-time shrine rewards, 10k-tick autoplay, old-save migration and camera/god tap correctness. See `docs/WORLD_PLAYTEST_MATRIX.md`. All 15 F/W tasks are TODOs; total planned implementation work is 45 tasks.

## Evidence format per slice
Include: commit, changed files, test command, pass/fail count, screenshot names with browser or device attribution, known blockers, performance before/after. Do not label desktop Chromium captures as phone screenshots.

## Exit criteria for Codex
All relevant automated tests green, offline HTML opens, all 3 zooms pan and target correctly, autonomous Nim untouched, assets loaded entirely locally, UI readable at 640x360/720x400/960x540, APK structure valid, precise disclosure of hardware verification state, no committed keystore. Unverified physical install is a release blocker, not a reason to claim completion.
