# GODSEED — Chapter II playable milestone: The Last Cartographer

**Status:** implemented in independent feature branch `feat/godseed-chapter-two-cartographer`, subject to its CI evidence and review. This is a **second complete, finite autonomous gameplay loop**, not completion of all planned expansions or production Android certification.

## The player-visible story

Chapter I, *The Mossbound Oath*, remains playable and unchanged. When it is completed, the sidebar unlocks **Chapter II — The Last Cartographer**. Nim independently follows the old frontier road. The player continues observing as an invisible god; there are no manual movement or quest-click-to-complete controls.

Three earned milestones:

1. **The Two Lanterns:** discover Briarford (R01) and Emberwick (R02). These are existing world regions; there is no fabricated new map instance.
2. **Crownfall Traces:** discover Crownfall Ruins (R05) and study at least **two actual ruins**.
3. **The Scholar's Route:** meet **Mera** the autonomous Rune Scholar, and visit **two distinct, real shrine tiles**.

The stages are checked by the authoritative simulation on a tick, not a UI button or render frame. The AI planner can autonomously pursue walkable region cells, ruins, shrines and Mera **after safety, hunger, rest and crafting conditions have priority**. Existing survival and God powers remain independent.

At completion, Nim receives **two units of food** and **14 XP**, and the god receives **four Faith**, plus the normal capped milestone-system bonus. Those one-time rewards are not granted again after ticks, reload, redraw or restored saves. The chronicle records a distinct `Chapter II complete` entry; memory gains an enduring short account.

## UI and pixel-square art

The sidebar retains Chapter I, preserving its completed state and older tests. Once Chapter I finishes, a separate **compact square-pixel Chapter II panel** is displayed with its exact objective and a semantic 0/3 to 3/3 progress bar. The panel is hidden before unlocking so low-end phone UI does not grow unnecessarily. It uses flat block borders, no gradients or animations, and does not create a new render loop or large sprite atlas.

The terrain remains authentic square-pixel 16×16 tiles, 16×24 actors, and 32×20 default sky view. JavaScript/Canvas remains the game engine, packaged as offline HTML in both browser preview and the existing Android hosts.

## Save compatibility / anti-replay

Retains `version:1`, `godseed-one-small-life-v1`, existing map tile IDs, 64×48 map and region metadata. New `chapterTwo` object stores version, stage, completion tick and awarded flag. Older saved games without this object reconstruct earned milestones from **real existing region discoveries, ruin count, Mera's meeting state and visited shrines**. If the restored legacy world already accomplished everything, it is marked complete **without awarding new resources retroactively**. Corrupt metadata is rebuilt from safe evidence; no external storage, network or new permissions.

No new NPC agents, background updates while closed, or expanded 1GB content pack are introduced.

## Reproducible acceptance

```bash
node --test tests/*.test.js
python build.py
python tests/chapter_browser_acceptance.py
python tests/chapter_two_browser_acceptance.py
python tests/mobile_acceptance.py
python android/build_apk.py
python tests/test_android_package.py
```

The Chapter II suite checks: progression locked until Chapter I, three full stages and exact reward, premature completion rejection, one-time state after save and long-running ticks, v1 legacy migration without retroactive rewards, corrupted metadata repair, pure read-only story status, goal selection and **10,000 cycles in a fully autonomous seeded playthrough**. The separate Chromium script exercises an offline 640×360 real game UI and writes `qa-screenshots/chapter-two-cartographer-640x360.png`. Both are part of the CI workflow.

Any passing green CI run confirms **that run's exact commit**, not future commits. PR reviewers should inspect the latest run before merging.

## Release readiness boundaries

- Android Gradle host was tested on an Android API 29 emulator in upstream PR #6; newer Chapter II source is packaged through the existing build process, but physical 2–3 GB RAM Android testing, installation on a user's handset, and 20-minute PSS/RSS/FPS testing remain **NOT VERIFIED**.
- This is **two completed story chapters** in one living medieval fantasy map, not the complete 1GB release content target. Optional app storage is still a bounded, opt-in implementation whose actual content is tiny.
- The chapter is a branch stacked above PR #7 → PR #6 → PR #5 → PR #4 → PR #3 → PR #2 → PR #1. **Do not merge to `main` automatically.**

## Next coherent game milestone

Chapter III could add a reason to revisit the Moonwell Fen, its rune ecology and NPC favors, but the game must first pass on physical low-end Android. Improving square-pixel buildings and world landmarks without breaking the two finished chapters is more valuable than inflating the APK with dummy content.
