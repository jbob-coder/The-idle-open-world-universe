# WLD-004 — Autonomous cross-chunk travel: implementation and limitations

**Owner:** PATH-34  
**Task:** WLD-004; original acceptance: Nim and citizens must cross 4+ sectors without a teleport/menu, respecting hazards and blockers.  
**Branch:** `feat/wld-004-path-34-autonomous-travel` (stacked on WLD-003 PR #40, itself dependent on WLD-002 PR #31 and WLD-001 PR #23).  
**Status:** in_progress — implementation slice available; **do not mark full WLD-004 acceptance yet**.  
**Design authority:** [owner direction PR #47](https://github.com/jbob-coder/The-idle-open-world-universe/pull/47): 3D Pixel Squares and autonomous ant-farm Sims; this subsystem does **not** decide a 3D engine or camera.

## What the code actually does

- `src/world/chunk_travel.js`: renderer-neutral CommonJS/UMD module with a deterministic weighted A* path planner over the **real WLD-002 chunk store**; signed world coordinates, cross-chunk continuous one-tile steps, impassable water/stone, dynamically supplied hazards, and bounded pathfinding.
- An optional `Travel.create(store)` actor runtime advances people with work/home goals or individual id- and curiosity-derived exploration goals. No player orders are required. The simple goal selector is an initial behavioral mechanism, **not** a complete needs/cognition engine.
- Each person has stable ID, individual traits (caution, curiosity, intelligence) and independent positions. Caution changes traversal costs; intelligence changes per-actor path search budget; curiosity changes exploration distance. These are actual parameters, not UI-only stats.
- Save/import for **the optional travel component**; schema v1, per-actor state and tick count; missing routes are recalculated deterministically. Input and payload size are bounded. The legacy GODSEED `version:1` save, chapters and Nim state are unchanged.
- Bounded memory: at most 64 actors, 256 tile radius per planned route, up to 4096 search expansions per planning call, 64,000 characters per travel snapshot. WLD-002 caps active chunk cache separately. No-path replan cooldown prevents repeated expensive searches each tick.
- `build.py` embeds this module into the offline Android/WebView HTML **without activating it in the original game**.

## Evidence collected this session

A self-contained V8 JavaScript harness executed the contents of the committed `tests/chunk_travel.test.js` with GitHub-fetched source modules and assertion adapters: **10/10 pass** on the current module/test blobs. This is *not* a `node --test`, Chromium, Android emulator or physical device test. Do not report those as passed unless the corresponding CI workflow on the exact final commit completes successfully.

Test coverage includes signed crossings from x=-1 to x=131 (132 contiguous steps spanning five destination chunk columns), permanent water/stone blocks, dynamic hazards and route invalidation, blocked goals, save/restore deterministic resume, multiple independent citizens, bounded A*/chunk memory, opt-in legacy-save isolation, cooldown CPU regression, and corrupt-save rejection.

## Still missing / why not claiming completion

- The legacy GODSEED runtime still moves Nim and original citizens on the finite 64×48 map. The new opt-in actor simulation is **not yet the live in-game Nim/citizen runtime**, so a test of the optional module does not prove playable cross-chunk travel.
- The travel snapshot must be integrated into actual save/load and reconciliation with the WLD-007 v1-to-chunk bridge (PR #44) before claiming durable live world travel.
- Actor collisions, multi-party scheduling, local roads, hazards generated from live world activity, supply/logistics, destinations chosen by the live cognition system, and 3D visual rendering still require integration/acceptance.
- Android offline, browser behavior and whole-app performance await exact-SHA CI and (ultimately) physical-device tests.
- No migration of camera, art assets, renderer or 3D engine occurred in this task. Pixel Squares 3D remains owner-approved direction, not a completed feature.

## Safe follow-up plan

1. Inspect the latest WLD-007 save-adapter code, SIM-002/SIM-011 cognition APIs, WLD-003 viewer and open PRs; reconcile data ownership before editing `src/sim.js` or any save schema (those are shared/high-risk).
2. Add an explicit integration adapter that uses **actual** live NPC IDs, goal selection, route events, and saved global positions, and exercises 4+ chunk crossings without UI teleportation. Preserve legacy compatibility.
3. Attach a browser/Android render acceptance that shows real live travelers on the world, not a separate preview or a conceptual PNG. Coordinate 3D migration and current 2D ART-007 work with owner.
4. Run `node --test tests/*.test.js`, offline Chromium, build/Android tests and any physical device benchmarks. State exact SHA for each result.
5. Only after full acceptance and the task's PR is review-ready transition WLD-004 `in_progress → in_review`; independent reviewer later verifies and owner/integrator may approve integration.

## Ownership and other bots

Owner requested succession/takeover preparation on 2026-10-19; [coordination notice](https://github.com/jbob-coder/The-idle-open-world-universe/issues/27#issuecomment-6271995553) explicitly calls for MODO A / MODO B handoffs. No other bot's claimed or in_progress task is reassigned merely by authoring WLD-004. No PR is automatically merged. Obsolete legacy scope must be reconciled with the approved 3D direction and preserve useful code/tests before cancellation.
