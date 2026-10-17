# GODSEED project state — experimental v0.2

CURRENT_OBJECTIVE: Adapt selected generic RPG features from user-provided WYLDHEART gameplay clip without copying visual style. Offline, low-end Android, rule-based autonomous Nim; god player only directs environment.

FIRST FIVE FEATURE SLICE (LOCAL IMPLEMENTATION): Distinct seeded origins, five use-based proficiencies, automatic dodge/parry choices, ruin traps and scouting checks, legend/rumor leads to other ruins. New RPG systems show in the character panel and chronicle; saves from v0.1 receive defaults via restore().

VISUAL DECISION: Keep the low-resolution 2D god-view interface. Do not implement 3D realism, third-person camera or copied WYLDHEART assets. User explicitly requested gameplay content, not that game's appearance.

BOUNDARY: This is v0.2 experimental. No physical Android installation or performance test yet. Do not claim production release. CI signs with a temporary key; a new APK may not update an existing APK in place. Back up saves before uninstalling.

NEXT FIVE (PLANNED): Procedural tiny dungeons, autonomous magic, stealth/lockpicking, upgraded camps, lightweight NPC rumors/trade. Multi-agent co-op/shared XP only after profiling memory and performance.

# GODSEED project state — 2026-10-17

CURRENT_OBJECTIVE: Establish `jbob-coder/The-idle-open-world-universe` as the source of truth for GODSEED, a lightweight offline Android god-observation game. Player influences one autonomous character (Nim) through divine powers, not manual controls.

VERIFIED_STATE: Android debug APK v0.1 built and structurally verified; Java/JAR v1 signing passes; Node simulator has 10 passing tests; browser smoke and landscape-touch acceptance passed at the tested viewports. There is NO confirmed physical Android installation, performance benchmark, or production-ready APK. The native Android bootstrap uses hand-generated AXML/DEX and must be tested on an actual device.

COMPLETED:
- 64 × 48 seeded world with fog, resources, weather, day/night, ruins, and wildlife.
- Autonomous rule-based Nim: exploring, foraging, shelter, crafting, defending, experience/leveling, memories, and basic personality shifts.
- Player god powers: Heal/Bless, Food Gift, Bloom, Guide, Lightning; Faith economy; pause, 1×, 3×, 8×, step.
- Offline Canvas UI with landscape touch toolbar and save JSON copy/paste backup.
- Browser HTML preview, debug APK, source modules, tests, screenshots, design/QA documents.

IN_PROGRESS: Hardware QA, long-run stability, more legible AI explanations, skills, and richer ecosystem behaviors.

NEXT_ACTION (choose at most 5 tasks per slice):
1. Install the exact debug APK on Android 8+ device; collect install/launch result and screen recording.
2. Test cold start, save persistence, export/import, app resume and orientation.
3. Collect low-end device FPS, CPU, memory, and battery measurements over a 20-minute session.
4. Improve Nim's decision explanations and prevent impossible-goal loops, with deterministic tests.
5. Extend gathering/survival/combat/study/construction skills and verify save migrations.

BLOCKERS: No physical Android device or emulator was used in this source transfer. Public debug signing material is deliberately NOT committed; CI generates temporary debug signing keys, which means those CI-built APKs cannot replace previous installations without uninstall/export/import.

ASSUMPTIONS: No external services, cloud AI, or network permissions. Offline world simulation runs when the game is open; there is no autonomous background work while closed. This is an autonomous agent represented by deterministic code, not consciousness or an LLM.

RISKS: Handcrafted DEX/AXML may not load on every Android version despite structural tests. WebView file-origin localStorage behavior and touch/system insets differ by device. CI debug signing identity changes per runner. Public GitHub source ZIP must never include keystores or long-lived signing secrets.

DECISIONS: First release is a small, source-auditable offline prototype. No 3D, no costly AI model, no login, no heavy engine. Five system decisions per planning batch are recorded in `docs/DESIGN.md`.

FILES_CHANGED (handoff): Original prototype imported in full except local signing key, intermediate files and redundant binaries. Repository documentation, .gitignore and QA workflow added. The checked-in debug APK is `dist/GODSEED-v0.1-debug.apk`.

TESTS_RUN: See `docs/QA_REPORT.md` and validate against CI. The 10 Node tests, browser smoke, mobile touch browser tests, and package signature/structure were executed in the source transfer environment. Hardware testing NOT run.

GRAPH CONTINUITY:
- `src/sim.js` → implements → seeded world, Nim planner, progression, god actions.
- `src/ui.js` → renders → Canvas world, god controls, stats, chronicle, backup.
- `index.template.html` + `build.py` → produce → `GODSEED-Play.html`.
- `android/build_apk.py` + `GODSEED-Play.html` → produce → debug APK.
- `tests/sim.test.js` → verifies → deterministic simulation rules.
- `tests/test_android_package.py` → verifies → APK headers, embedded assets, JAR signature.
- `docs/DESIGN.md` → governs → 5-decision design batches.
