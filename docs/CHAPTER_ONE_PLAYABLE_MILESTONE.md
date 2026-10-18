# GODSEED — First Complete Playable Story Chapter

**Milestone:** Chapter I, *The Mossbound Oath*. This is a **small complete game loop**, not the finished 1–6 GB content roadmap or a shipped production APK.

## What is implemented

The autonomous 64×48 square-pixel medieval fantasy world now contains a finite introductory storyline with a beginning, connected objectives and a conclusion. The player remains an unseen god, influencing situations but **never** issuing direct movement commands.

**Objective sequence:**
1. **The First Hearth:** Nim independently gathers food, wood and stone, builds camp and crafts a hatchet.
2. **Voices of the Borderlands:** Nim meets any one of three existing travelers (Ira, Toren or Mera) through simulation encounters.
3. **The Mossbound Oath:** Nim discovers at least one genuine ruin and visits an existing ancient shrine. Ruin and shrine rewards remain subject to their own existing once-only semantics.

The first chapter completes exactly once and awards a bounded **+2 Nim max HP, +5 Faith and +12 experience**, plus the simulator's normal three-Faith milestone event bonus (each subject to existing caps or level-up rules). The chapter also adds a specific chronicle entry and enduring short Nim memory. Existing Faith/XP/crafting/AI paths are reused; no manual quest controls or fake objectives.

After completion the world **does not end**. Nim continues her autonomous routines, while the HUD shows the chapter as completed. This is the first meaningful story checkpoint, not a forced end-screen.

## Implementation ownership

- `src/sim.js`: authoritative `chapter` object in version-1 state, pure `chapterStatus` inspector, deterministic `advanceChapter` executed once per sim tick, three real goal checks, bounded reward.
- `src/ui.js`: reads `GodseedSim.chapterStatus` and updates a compact display only. Rendering never grants Faith, XP or chapter state transitions.
- `index.template.html`: a non-overlay pixel-square chapter status area inside Nim's panel, with text objective and a semantic progressbar (0/3, 1/3, 2/3, 3/3). No heavy sprite art, animations, internet dependency or WebView API change.
- `tests/chapter.test.js`: first objective, all stages, final reward once, save/restore, migration and independent 10k-tick autonomous completion test.
- `tests/chapter_browser_acceptance.py`: compiled offline Chromium at 640×360, three milestones, UI progress and actual screenshot under `qa-screenshots/chapter-one-completed-640x360.png`.
- `.github/workflows/qa.yml`: Node regression + new browser acceptance included in normal offline QA.

## Save compatibility

Keep localStorage key `godseed-one-small-life-v1`, simulation `version:1`, world size 64×48 and all tile IDs. Existing saves without `chapter` derive their starting chapter position from real saved evidence: camp, tool, NPC meetings, ruins and shrines. When an older save already qualifies as completed, mark the chapter finished but **do not issue fresh rewards for preexisting actions**. Invalid chapter metadata is reconstructed from real game achievements instead of creating an exploitable stage.

The chapter's own completion rewards are never granted again on redraw, save reload, longer autoplay or repeated discoveries.

## Acceptance and test commands

```bash
node --test tests/*.test.js
node scripts/validate_asset_manifest.mjs
node scripts/validate_pixel_art_contract.mjs
python build.py
python tests/chapter_browser_acceptance.py
python tests/lifecycle_acceptance.py
python android/build_apk.py
python tests/test_android_package.py
```

The browser test requires local Playwright + Chromium. CI executes the full original game acceptance suite and embeds the chapter in both existing offline HTML and the separately built WebView Gradle APK.

## Actual hardware / scope honesty

- Browser screenshots **are not physical Android device screenshots**.
- A previous Android API 29 **emulator** milestone installed the existing Gradle WebView APK and passed native storage/save-restoration instrumentation. Real 2GB/3GB RAM phones, 20-minute FPS/RSS/PSS, and sign-in-place upgrades remain unverified.
- Chapter I is a **first fully scoped storyline**, not an implementation of all future city economies, all eight region-specific chapter stories, or 1 GB of meaningful core downloadable content.
- All core game art continues to follow the 16×16 native tile, 16×24 actor, true square-pixel and 32×20 camera requirements.

## Future next playable chapter (not built)

Potential Chapter II: *The Last Cartographer*. Nim can follow rumors between Briarford, Emberwick and Crownfall and restore a lost route. Do not mark this complete or introduce quest rewards until a later PR adds actual autonomous decision rules, save-safe one-time consequences and tests.

## Branch ancestry

This independent first-story chapter branch derives from `feat/godseed-android-storage-host` (PR #6), which itself derives from GODSEED skyworld implementation PR #5. The review PR for Chapter I targets PR #6. No merge to `main` occurs automatically.
