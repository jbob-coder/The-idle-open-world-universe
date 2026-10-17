# Codex implementation batches: do five tasks at a time

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
E03 SDK-free experimental debug APK build + JAR signature/manifest validation; handle signing keys safely.
E04 Hardware QA plan executed if device access exists, otherwise mark physical test BLOCKED with exact reason.
E05 Publish screenshots, APK artifacts, before/after metrics, migration instructions and completion evidence.

## Definition of 'implemented'
Source diff + unit/visual tests + real screenshot from running compiled code + explicitly labeled Android verification + documentation update. No category moves to done simply because an image or a spec exists.

## Follow-on beyond v1
NPC dialogue and trade, interior ruins, long-term memory consequences, village factions, seasons and weather patterns; defer until benchmark proves headroom. Do not expand gameplay or change schema during the core visual implementation unless isolated and migration-tested.
