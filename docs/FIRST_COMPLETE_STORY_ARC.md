# GODSEED — First complete autonomous story arc
**Scope:** a small, finite single-player story, not a full large-scale commercial release.
**Branch:** `feat/godseed-moonwell-finale-complete` (stacked on PR #15).
**Target:** 2–3 GB physical-RAM Android devices, **NOT verified in hardware**.

## What is complete in game code
GODSEED remains an offline, square-pixel (16×16 tiles) Canvas/WebView world.
Nim is an autonomous inhabitant—not an avatar controlled by the player.
The player remains an invisible god who can inspect, bless, offer supplies,
encourage plants and NPCs, guide via omens, or invoke a storm. None of these
actions are direct quest-completion inputs.

The first playable story has a beginning, middle and finite conclusion:
1. **Chapter I: The Mossbound Oath:** Nim gathers resources, builds shelter,
   crafts a tool, meets another life and earns the first shrine/ruin oath.
2. **Chapter II: The Last Cartographer:** Nim discovers two frontier settlements,
   examines Crownfall ruins, meets Mera and visits two distinct ancient shrines.
3. **Chapter III: The Moonwell Dawn:** Nim visits the real ruin at Moonwell Fen
   (50,39), discovers the wildwood, ridge and grove, **returns to Moonwell
   independently** and awakens the land.

Completion emits `THE END · The Moonwell Dawn`, awards a **single** +3 maximum
health, +5 Faith (plus the usual bounded milestone bonus) and 20 XP.
The finale is permanent across save/reload and **never repeats its reward**.
After credits-style text, Nim continues wandering and the living world remains
fully simulated. This is intentional post-story free play, not an empty screen.

## Visual and interface contract
- World 64×48 tiles, three camera zooms (32×20, 24×15, 16×10).
- Chapter I remains visible; Chapter II unlocks after Chapter I; Chapter III
  unlocks after Chapter II. A compact, flat **pixel-square** Chapter III panel
  displays 0–3 earned steps and a **THE END** state after the ritual.
- No large bitmap, particle layer, external font, new render loop, music or
  background network call was added.
- 3 local wandering NPCs, maximum 5 enemy agents, world resource renewal and
  8 reachable named regions continue operating after the narrative ending.

## Saves and migration
- Keep **`version:1`**, key `godseed-one-small-life-v1`, existing tiles 0–10.
- Add `finale` object `{version,stage,completedAt,rewarded,ritualDone}`; do not
  replace older fields, drop inventory, or reset Nim's levels.
- Legacy saves lacking Chapter III can reconstruct real regional discoveries
  and consumed Moonwell ruin evidence **without awarding retroactive resources
  or inventing a ritual completed before it existed**.
- Corrupt/incompatible completion data are reconstructed conservatively.
- The only way to conclude the last stage in the simulation is for Nim to
  return to the actual Moonwell after completing its prerequisites.
- The game does not simulate time while closed. Paused worlds stay paused after
  save/reload; accelerated speed resets to 1×.

## Reproducible evidence
Node: `node --test tests/*.test.js` including
`tests/chapter_three.test.js` (ending, anti-replay, old saves, 8 autonomous
seeds, continued play after ending).

Browser: `python build.py`, then
`python tests/chapter_three_browser_acceptance.py` offline, testing the real
HUD, 3/3 completion, save/reload and no remote requests.
The test captures `qa-screenshots/chapter-three-moonwell-dawn-640x360.png`.
The above are integrated into `GODSEED offline QA` GitHub Actions.

Android: `GODSEED native Android evaluation` recompiles and launches the
offline assets in API 29 emulator; six native instrumentation checks include
persistence and offline local storage. Emulator evidence is supplementary to
physical low-end hardware validation.

**Evidence must be tied to the exact PR HEAD and passing CI run**; a PR that
passed before subsequent edits is not automatically validated.

## Remaining release gates (NOT complete)
- Hardware soak tests on **real 2 GB and 3 GB Android devices**, ≥20 min,
  with FPS, frame times, RSS/PSS (include WebView child processes), cold start,
  thermals and offline file picker/save continuity; tracked in issue #13.
- Stable release signing identity, safe APK upgrade from prior signer,
  reproducible build provenance and dedicated user export/backup procedure.
- Installation, native touch and low-storage testing with human observation.
- Content volume: the earlier 1 GB core target and optional 5 GB storage
  allocation remain *budgets only*. The first complete story fits much less
  space. Never pad APKs or allocate gigabytes in RAM merely to hit a number.
- Future Chapter IV, wider world, economy and major content upgrades remain
  **expansion ideas**, not part of this completed first story arc.

**Definition of completion:** all three chapters are fully earnable without
manual Nim movement, persist after reload and continue living after the ending,
with full green CI on the latest commit. **This is a completed narrative vertical
slice, not a certified Play Store release.**
