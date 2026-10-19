# GODSEED ART-007 — Map-first responsive Divine Observatory UI

Owner: LIFE-26. Task: ART-007, P0, depends on independently verified GOD-004.
Implementation branch: feat/art-007-life-26-godview-layout, based on verified GOD-004 PR #28.
Design inputs: docs/design/GODSEED_V3_VISUAL_EXPERIENCE_REFERENCE.md (PR #37);
GOV-004 V3 design documents (PR #39, documentation only). Neither design PR
is a claim that families, monarchies or a new divine-power model run today.

## User experience

GODSEED opens directly to an unobstructed top-down, 16x16 source-pixel world.
At landscape 640x360 and 720x400, the actual existing simulation canvas
occupies at least 65 percent of its usable central stage; a short status strip
above it displays real time, current Faith and pause/resume without a second
simulator. A 44px touch-navigation strip below selects the following panels:

- Mundo (default) — the actual living map; no drawer covers it.
- Vidas — one **existing read-only GOD-004** inspector for Nim, citizens,
  towns and constructed structures. Actual Nim portrait canvas is scaled with
  nearest-neighbor pixels; the original detailed HUD, chapter progression and
  needs are available in an expandable block.
- Pueblos — real measured supplies, buildings and the existing 64x48 minimap;
  explicitly states that political kingdoms are not yet simulated.
- Crónica — the real world event log; no fabricated kingdom history.
- Consejo — the existing God whisper input with autonomous acceptance/refusal,
  not a joystick or command console.
- Poderes — legacy direct powers preserved as a separate prototype mechanic;
  final consequence-based divine influence is **GOD-006** and not implemented.
  Selecting a power returns to the map for the original validated interaction.
- Opciones — the original authoritative time controls, zoom, export/import,
  local save and reset. No save data or permission model changed.

The nav uses consistent local 8x8 bitmap glyphs drawn with Canvas2D, no fonts
or icons from a CDN. The single drawer appears only when the player requests
information, council, miracles or settings, and can be closed by Back to world,
the World tab or Escape. Real tile inspection may open the existing GOD-004
inspector when an inspectable resident or site is touched. Untrusted citizen
text remains rendered with textContent; XSS defenses belong to GOD-004 and
continue to be tested.

## Compatibility and scope

The implementation adds only UI/layout modules:
- src/ui_layout_v3.css — compact map-first CSS, 44px targets, accessible
  pixel renderer, mobile drawer and device-size breakpoints.
- src/ui_layout_v3.js — DOM hierarchy and tab interactions, read-only
  observer integration, existing power/time button delegation.
- build.py — composes those files into one standalone offline HTML blob,
  after the verified GOD-004 observer. No network permission is required.

The existing src/sim.js and src/living.js are **not changed**. Nim and the
citizens remain autonomous and the same version-1 save key and chapter state
are preserved. There is no new artificial wealth, colony, kingdom, heredity,
AI model, teleportation or direct simulation command created by UI work.
The small map and the physical 2–3 GB memory requirements are separate
WLD/QA tasks; viewport/screenshot testing is not a physical memory benchmark.

## Acceptance evidence

tests/godview_layout_browser_acceptance.py checks real offline Chromium
at 640x360, 720x400, 960x540: >=65% stage map, keyboard/touch tabs,
one contextual observer, portrait, all seven functioning sections, real
save/pause, zero JavaScript exceptions or outbound requests, and unchanged
serialized world after read-only navigation. Real running screenshots are
saved as godview-world-*.png and godview-life-*.png under qa-screenshots.

Existing acceptance tests continue to verify:
- Bless and Inspire Faith changes exactly once, with Nim location unchanged.
- Actual 32x20, 24x15 and 16x10 zoom modes and pointer-to-world hits.
- Chapters I, II and III and rewards and the old backup lifecycle after reload.
- Offline native pack UI, paused render budget and real APK packaging.

Before handing to in_review, use GitHub Actions results at **exact PR HEAD**
for all Node + Chromium tests and native Android API29 smoke. Physical RAM,
PSS, battery and heat certification remain unverified. PRs are not merged by
the author; a different bot independently verifies and the owner/integrator
alone approves integration.
