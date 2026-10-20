# GODSEED — Historical v0.1 design decisions in groups of five

**REFERENCE STATUS (2026-10-20):** This is a v0.1 engineering decision log. The exclusive 2D and defer-3D directions below are superseded **as final product requirements**, not erased from Git history. Read [project authority and reference corrections](PROJECT_AUTHORITY_AND_REFERENCE_STATUS.md), preserving compatibility and evidence.

State: **v0.1 experimental Android APK prototype**. Goal: a low-spec offline god game where the user watches a single autonomous character evolve and intervenes indirectly.

## Group 1 — Foundation (implemented)

1. God/player cannot directly move Nim; divine intervention affects opportunities.
2. One persistent independent creature/person rather than a large population.
3. Top-down readable pixel world, no 3D or expensive post-processing.
4. Offline Android APK with touch UI and no account or network requirement.
5. Old-phone-first: 64×48 map, small assets, simple simulation cadence.

## Group 2 — The world (implemented)

6. Procedural seeded map, with grass, forests, lakes, stone, berry bushes, ruins, meadow and shelter.
7. Exploration with fog-of-war and an overview atlas.
8. Day/night and weather changes, simulated with lightweight logic.
9. Boars and other hostile wildlife roaming/spawning in the environment.
10. Gatherable wood/stone/food and ten initially scattered ruins.

## Group 3 — Nim's autonomy (implemented, basic model)

11. Hunger, energy, hit points, and injury/second-chance system.
12. A deterministic priority-based goal planner and breadth-first grid navigation.
13. Independent forage, gather, rest, build, craft, explore and defend decisions.
14. Experience points, level-ups, increased attack/defense/HP.
15. Stored memory snippets and slowly adapting personality attributes.

## Group 4 — God gameplay (implemented)

16. Faith earned as Nim discovers terrain and achieves milestones.
17. Heal / Bless, Gift Food, Bloom, Guide and Lightning; inspection is free.
18. Time controls: Pause, 1×, 3×, 8× and single-step.
19. Readable game chronicle and an inspectable Nim state.
20. Versioned local save/restore and copy/paste JSON backups.

## Group 5 — Life experience (planned, v0.2)

21. Profession skill branches: gathering, survival, combat, study and construction.
22. More detailed decision explanations: show *why* Nim chose a goal.
23. Building durability/upgrades, not just first shelter.
24. Repeat encounters with recognizable animals and evolving relationship history.
25. Adaptive goal evaluation so Nim avoids repeatedly choosing impossible objectives.

## Group 6 — World progression (planned, later)

26. New regions unlocked by Nim's exploration rather than massive simultaneous maps.
27. Seasonal ecology affecting resources and travel hazards.
28. Discoverable history and ruins with varied effects and persistent discoveries.
29. Crafting progression tied to materials and knowledge instead of abstract levels alone.
30. Optional deity interventions with costs, opportunity tradeoffs, and consequences.

## Group 7 — Reliability/performance (partly implemented)

31. Fixed small world and a 2D Canvas, no WebGL — implemented.
32. Only ~4 logic updates/sec and throttled redraws — implemented.
33. No LLM, cloud services or remote background process — implemented.
34. Cap pathfinding, enemies, log length and save payload — implemented.
35. Measure frame time/memory on low-end phones and tune — **not verified on Android**.

## Group 8 — Ship criteria (partly implemented)

36. Actual Android APK signed/debug package — built, signature structurally verified.
37. Touch-friendly landscape power bar — browser verified at 640×360, 720×400, 960×540.
38. Cold install / device save/load / app resume / rotation testing — **open**.
39. Debug keystore/production signing and safe update path — **open**.
40. Capture measured FPS, memory and battery on minimum hardware before promotion — **open**.

## Design guardrails

- A player must see Nim doing meaningful actions **without** commanding the next task.
- God powers should change chances, not replace Nim's autonomy.
- Never advertise the rule engine as sentience or as offline LLM training.
- v0.1 simulation runs while app is foreground; no continued life simulation while closed.
- Offline progression, villages, multiple agents and dialogue models remain ideas, not promises or implemented features.
- Store game state in small, portable, validated saves. Migrate explicitly when future schema changes.

## Current objective and verification record

CURRENT_OBJECTIVE: Install and evaluate GODSEED v0.1 APK on real Android; then iterate in five-feature batches.
VERIFIED_STATE: deterministic rule-based simulation and browser-rendered pixel UI; signed debug APK package checks.
NEXT_ACTION: On-device install and startup, tap/power/backup/save acceptance, then profile hardware and choose next five features.
BLOCKERS: No Android emulator/device or SDK available in the build container; actual Android launch and WebView persistence unknown.
DECISION: Keep browser-based Canvas implementation wrapped by a minimal Android activity to minimize runtime cost; defer richer 3D/LLM systems.
RISK: Binary APK packaging is an SDK-free bootstrap; manual Dex/AXML and JAR-v1 signing should be replaced with official SDK build tools before production.
GRAPH: GodseedSim→drives→Nim; Nim→explores→World; GodPower→changes→World; Chronicle→records→Milestones; Tests→verify→Simulation; MainActivity→hosts→OfflineHTML; APK→packages→OfflineHTML; Save→persists→WorldState.
