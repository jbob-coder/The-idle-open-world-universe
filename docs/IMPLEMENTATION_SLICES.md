> **HISTORICAL IMPLEMENTATION PLAN (2026-10-20):** Old 25/30 task counts, Canvas 2D visual scopes and agent directions are not live ownership instructions. The future target is 3D Pixel Squares and emergent autonomous civilization; see [current authority](https://github.com/jbob-coder/The-idle-open-world-universe/blob/docs/godseed-agent-task-governance-v1/docs/PROJECT_AUTHORITY_AND_REFERENCE_STATUS.md).

# Codex implementation batches: do five tasks at a time

**Art acceptance authority:** `docs/PIXEL_WORLD_STYLE_GUIDE.md`, `config/pixel-art-contract.json`, `docs/PIXEL_ART_ACCEPTANCE.md`. A pixel-square look is mandatory for terrain, characters, divine effects and HUD. The validator checks original starter source: `node scripts/validate_pixel_art_contract.mjs`; Codex still must show **runtime screenshots** before marking a task done.

This is a **work order**, not evidence that these items are implemented. Mark tasks complete only with tests/screenshots. Create implementation branch `feat/godseed-medieval-skyworld-v1` from this handoff and use separate commits per slice.

## Slice A — Camera and presentation (priority 1)
A01 Change primary view from v0.4's 24x15 to **higher-sky 32x20** (retain 24x15 and 16x10).
A02 Add pure dynamic camera world/screen coordinate helpers; ensure tile-pixel snapping.
A03 Follow Nim; God can manually pan; maintain logical 64x48 world and fog.
A04 Apply no-smoothing scaling; verify square pixels and Android safe-area letterboxing.
A05 Test 640x360/720x400/960x540×all zooms; capture browser screenshots.

## Slice B — Pixel terrain, props, medieval villages (priority 2)
B01 Consume manifest/palette and replace repetitive rectangles with selected 16x16 atlas tiles (original art).
B02 Add 4-neighbor roads and water shoreline variants without changing passability.
B03 Layer nonblocking flowers, stones, herbs, posts, fence tiles and trees deterministically.
B04 Make VILLAGE/SHRINE/RUIN/CAMP distinguishable as house/rune stones/collapsed stone/tent and preserve 1-cell world semantics.
B05 Cache/invalidate terrain correctly and compare redraw cost with v0.4.

## Slice C — Character art and behavior cues (priority 3)
C01 2D Nim with 4 facing directions and 2–4 walking frames; 16x24 frame, consistent feet.
C02 Apothecary/Squire/Rune Scholar identifiable from silhouette/equipment.
C03 Wolves/boars/deer starter visuals if appropriate; only wolves/boars currently simulated; deer is visual PLANNED until a real creature exists.
C04 Show Nim goals without issuing movement commands; modest idle/action states derived from sim.
C05 Depth order by foot Y and tests for sprite clipping behind tree canopies.

## Slice D — God's readable interactions (priority 4)
D01 Selection cursor and valid/invalid target preview; do not spend Faith for invalid taps.
D02 Bless/Gift/Bloom/Guide/Storm animation from committed FX atlas at low frame counts.
D03 Inspire targets known traveler; role-specific visual aftermath and chronicle entry.
D04 Clear event deduping and zero duplicate benefits on frame renders.
D05 Reduced-motion alternative, text feedback, FPS cap and interaction tests.

## Slice E — Android, packaging and verification (priority 5)
E01 Compact responsive HUD shows goal/thoughts, Faith, weather, NPC events without obscuring world.
E02 Full browser touch/keyboard and JSON backup regression all target viewports.
E03 Keep SDK-free experimental debug APK build + signature/manifest validation passing; handle signing keys safely. Evaluate conventional Gradle WebView packaging separately per `docs/ANDROID_HTML_APK_SPEC.md`, with storage-origin migration and device testing before replacement.
E04 Hardware QA plan executed if device access exists, otherwise mark physical test BLOCKED with exact reason.
E05 Publish screenshots, APK artifacts, before/after metrics, migration instructions and completion evidence.

## Slice S — Persistent storage and optional packs (five NEW tasks)

Owner requires **1 GB core installed game** with **up to 5 GB extra opt-in persistent data**, not RAM: nominal 6 GB managed disk. These are *additional five tasks*, beyond the 25 visual/core items, for **30 tasks** overall. Review `docs/STORAGE_BUDGET_AND_PACKS.md` and `work-items/storage-tasks.json`.

S01: measure installed core, optional and mutable footprint using device storage APIs.
S02: validated original offline-compatible content pack format and app-private installer.
S03: quota enforcement, consent, available-space reserve, staged install, rollback.
S04: clear install/remove/usage UI without deleting worlds or auto-allocating optional 5 GB.
S05: quota extremes, disk-full/corrupt-pack recovery, old saves, Android hardware size/usage tests.

Do NOT pad the APK to 1 GB, load pack bytes into RAM at once, or mark these implementation tasks done from documentation alone.

## Definition of 'implemented'
Source diff + unit/visual tests + real screenshot from running compiled code + explicitly labeled Android verification + documentation update. No category moves to done simply because an image or a spec exists.

## Follow-on beyond v1
NPC dialogue and trade, interior ruins, long-term memory consequences, village factions, seasons and weather patterns; defer until benchmark proves headroom. Do not expand gameplay or change schema during the core visual implementation unless isolated and migration-tested.

## Strict visual QA gate (applies to A/B/C/D/E and W tasks)

No tile, sprite, UI or zone task is DONE until it follows `docs/PIXEL_WORLD_STYLE_GUIDE.md` and `config/pixel-art-contract.json`, passes `node scripts/validate_pixel_art_contract.mjs` for source artifacts, and shows **crisp individual square pixels in an actual running game screenshot**. Check all three camera zooms and landscape 640×360 / 720×400 / 960×540. Source 16×16 terrain, actor 16×24, binary alpha, exact palette and nearest-neighbor raster scaling. Reference SVG mockups do not count as gameplay evidence. See `docs/PIXEL_ART_ACCEPTANCE.md`. This adds acceptance criteria, **not more TODO task IDs** (existing total 45).
