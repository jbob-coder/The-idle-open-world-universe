# Codex Cloud runbook — implementation start

**Select repo** `jbob-coder/The-idle-open-world-universe`, **base branch** `prep/codex-skyworld-v0.5`. This is a handoff, not a runtime renderer release. Create **implementation branch** `feat/godseed-medieval-skyworld-v1`. Read `AGENTS.md`, `docs/GODSEED_INTENDED_GAME.md`, `docs/ANDROID_HTML_APK_SPEC.md`, `docs/HANDOFF_READINESS.md`, and paste `docs/CODEX_CLOUD_READY_PROMPT.md` into Codex Cloud.

```bash
git switch prep/codex-skyworld-v0.5
git switch -c feat/godseed-medieval-skyworld-v1
node scripts/validate_asset_manifest.mjs
node scripts/generate_starter_assets.mjs
git diff --exit-code -- assets/generated/
node --test tests/*.test.js
python build.py
```

Implement work-items A01–E05 in `work-items/codex-tasks.json` as five-task batches; update status and attach tests/evidence. Make the **default camera 32×20** (v0.4 currently 24×15), preserve 24×15/16×10, and update Chromium tests to the intentional new default.

`src/ui.js` currently renders via Canvas; `src/sim.js` owns autonomous rules. Modular rendering may require updates to `build.py` to include bundled local PNGs in the single HTML file and Android WebView. Do not introduce an HTTP dependency or break the `/*SIM_SOURCE*/` and `/*UI_SOURCE*/` marker replacement.

Run `node --test tests/*.test.js`, `python build.py`, `python tests/browser_smoke.py`, `python tests/mobile_acceptance.py`, `python tests/capture_android_layouts.py`, `python android/build_apk.py`, `python tests/test_android_package.py` with required local Playwright/Chromium and JDK dependencies. Report any unavailable tool honestly.

**Open a reviewable PR** targeting the preparation branch. Existing stack: #1 v0.2→main; #2 v0.3→v0.2; #3 v0.4→v0.3; preparation PR→v0.4. Do not merge directly into main or expose signing keys.

Deliver changed source, validated tests, browser screenshots, signed debug APK with exact evidence, performance stats where measured, explicit hardware test status, and 25-task evidence. Never present concept SVGs as screenshots or an APK structurally verified as installed on a phone.
