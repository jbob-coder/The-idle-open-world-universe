# QA-007 — Chromium mobile reset timing acceptance

Regression source: issue #52 and Actions #39361142154, branch introduccion-al-proyecto at SHA 77269481685454ab950b9cdf218891b367f4663d.

Problem: tests/mobile_acceptance.py called GodseedDebug.newWorld(seed), returned to Playwright, then made a separate JS evaluate request to assert tick == 0. The app uses requestAnimationFrame at speed 1, so the simulation may advance between those two calls. The failure was observed once after 82/82 Node tests passed; it was not proof that reset itself retained the old tick.

Repair: use one synchronous page.evaluate JS task to create each world, inspect its worldSeed, tick, and Nim identity, and immediately pause the new simulation before the task returns. Repeat across ten successive seeds for each of the three viewport sizes. Preserve save/export/import and offline-network checks. This tests the actual reset invariant without requiring the live simulation to stop in normal gameplay.

Verification: python tests/mobile_acceptance.py after python build.py; repeat ten times and run full .github/workflows/qa.yml at the exact PR commit. No physical Android test is implied. The code change is in test-only scope and does not change game semantics, Android release signing, legacy saves, or any other bot's implementation branch.
