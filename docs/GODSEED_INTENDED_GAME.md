# GODSEED — Intended Game & Player Experience
**REFERENCE STATUS (2026-10-20): HISTORICAL 2D Codex brief dated 2026-10-17, NOT current final product authority.** The exclusive top-down camera, 16×16/16×24 source sizes, Faith toolbar and earlier zoom/town/region limits are still useful for the *legacy runtime* but do not constrain the approved 3D Pixel Squares autonomous-society goal. See [project authority and reference corrections](PROJECT_AUTHORITY_AND_REFERENCE_STATUS.md); preserve v1 saves and historical source tests.

## One-sentence identity
**Legacy v0.5 design statement (not new target):** GODSEED was specified as a **fully offline, lightweight Android landscape, medieval-fantasy, top-down pixel-square living-world simulation**: the player is a god who observes and influences autonomous inhabitants, especially Nim, without directly controlling anyone.

## 1. Player fantasy, loop, and boundaries
- **Player = god.** Inspect geography, characters, motives and stories; spend the Faith resource to alter conditions using Bless, Gift Food, Bloom, Guide, Lightning and Inspire. The player is *not* a controllable humanoid on the map. Do not add WASD/joystick movement or a player combat controller.
- **Nim = living autonomous simulated agent.** Nim chooses goals through deterministic game logic: explore, avoid hazards, forage, eat, rest, gather, craft, establish camp, explore ruins/shrines, talk to a traveler, gain experience, learn skills and respond to threats. Nim can decline or postpone a godly omen when survival is more urgent.
- **Other characters = autonomous.** Current baseline supports 3 lightweight traveling NPCs: Ira (Apothecary), Toren (Squire) and Mera (Rune Scholar). They move, hold trust/mood state, meet Nim, and can perform *one* role-appropriate favor following an Inspire action. No claim of general language-model conversation.
- **Emergent chronicle.** Events must explain why the world changed, who acted, where and what consequence happened. Show short readable game feedback, with a deeper journal for reviewing memories and discoveries.
- **Autonomy must be observable.** A player watching for a few minutes should see meaningful self-directed progress; god intervention is optional and should change opportunities rather than substitute for the AI planner.
- **Time model.** Pause, individual step and speed multipliers. World runs while app is foregrounded; it does not evolve on its own while closed. No cloud sync, telemetry, AI API, sign-in or internet permission.

**Minimum low-end hardware design target:** Android phones with **2 GB physical RAM**, with an additional **3 GB phone** tested. The running game must use substantially less than device RAM (preferred 128–192 MiB resident, provisional 256 MiB soft ceiling) and must not load up to 5 GB of optional disk packs into memory. Hardware testing is still pending. See `docs/LOW_RAM_HARDWARE_TARGET.md`.

## 2. Setting and visual language
**World:** a small forgotten medieval borderland with mossy royal roads, timber cottages, tiny hamlets, fields, tall forests, streams, rune shrines and collapsed masonry. Runes, divine omens and subtle magic coexist with everyday survival. Invent the art and lore for GODSEED; never copy a referenced game's visual identity.

**Camera:** perpendicular overhead sky view; no isometric, third-person, tilted 3D or oblique projection. Target *higher* default view **32×20 terrain cells**, with optional 24×15 close and 16×10 inspection zoom. These modes do not change simulation cell size or pathfinding. Follow Nim and free-pan for observation; tap to inspect or select a location for a god power.

**Pixel rules:** logical tiles 16×16 with discrete, clearly visible pixel squares; actor base frames 16×24 at anchored feet. Improve **pixel-level clusters and visual hierarchy**, not by blurring/upscaling an illustration. Foreground canopies must never completely hide Nim. World prioritizes readability of walkable roads, water hazards, targets, actor silhouettes, then small decoration.

**Art layers:** ground -> roads/water borders -> minor props -> structures -> dynamic actors sorted by foot-Y -> occluding foreground with actor outline -> deity FX -> HUD. Add deterministic tile variants, fences, plants, stone cracks, signs and simple roof details while respecting low-end performance budget. Avoid noisy details that disguise passability.

**UI:** show as much world as possible, plus discreet clock/weather, Faith, Nim's level/needs/current goal and a concise thought, an inspectable NPC panel, minimap and journal. God abilities remain touch-friendly in a compact Android landscape bar with clear selected/invalid target states. Support 640×360, 720×400 and 960×540 without clipping. Do not substitute a large decorative illustration for an interactive world.

## 3. Entity and world behavior contracts
- Existing world size **64×48 = 3,072 cells**; tile IDs **0–10** must retain meanings and save compatibility. Real pathability derives from `src/sim.js`, not the decorative atlas.
- Use only a small number of active inhabitants/enemies until *measured* memory and frame-time results support more. The v0.3/v0.4 baseline has three travelers and bounded enemies.
- Nature resources: wood/stone/berries are tangible; God Bloom creates appropriate food plants, not a scene-only effect. Habitats and roads can affect encounters only when deterministic and regression-tested.
- Locations: a village offers legible destination and interaction context; a shrine offers finite exploration rewards; ancient ruins provide dangers, clues and discoverable history. Do not imply playable interiors or a complex economy before those are implemented.
- Progression: level, origin, skills (survival/scouting/combat/crafting/lore), achievements, memories, learned behavior and inventory should be inspectable. Scope future advanced AI and NPC conversations as separate proposals, not currently delivered systems.
- Divine mechanics: `GodseedSim.power(state, kind, x, y)` is authoritative. Rendering only visualizes outcomes and MUST NEVER issue rewards, deduct Faith or schedule hidden extra simulation ticks from an animation frame.

## 4. Example observed session (target)
Nim wakes by a mossy path. At high sky zoom the player can see two nearby cottages, a forest trail and faint shrine runes. Nim chooses to forage because hunger is high; the player can watch or invoke Bloom to add bushes elsewhere. Nim later meets Ira the apothecary. God selects Inspire, sees a valid outline around the revealed traveler, taps her tile, sees a brief rune glow and a chronicle update. Ira may tend herbs according to her rules; Nim independently decides whether to approach, eat or continue toward ruins. At any point, the player can inspect Nim in a closer view without switching to direct control.

## 5. Scope: observed vs desired
| Domain | Last running v0.4 baseline | Codex target |
| --- | --- | --- |
| Simulation | Local rule-driven Nim, skills, ruins, three NPCs, powers | Preserve and expose intentions clearly; avoid scope creep |
| Visual | Canvas2D procedural rectangles, 24×15 default and three zoom modes | Atlas-backed medieval tile richness, 32×20 **default**, legible sprites |
| Art | Prep branch has 4 original PNG starter atlases, 3 SVG concepts, not yet integrated | Integrate/upgrade assets, add finite sprites and FX, no external dependencies |
| Android | Experimental SDK-free WebView APK builder; structured package checks | Reliable, offline, maintainable packaging, real device verification, safe signing |
| Saved data | `godseed-one-small-life-v1` and simulation `version:1` | Compatibility and export/import before storage or packaging migration |
| Device QA | No confirmed physical Android installation of new graphics | Record actual device model/OS, FPS/memory, 20-minute stability or mark blocked |

## 6. Acceptance demonstration
Record a **real running browser capture** at each target viewport and three zoom modes (not mockups); show Nim walking independently, shrine/village/road recognition, one NPC encounter, a successful and rejected Inspire target, Faith change exactly once, journal feedback, touch hit mapping, a restored older save, and an offline network-disabled session. Compile debug APK and validate its structure/signature. Only physical Android video/capture and measurements can demonstrate real hardware success.

## 7. Intended persistent storage (not yet implemented)

The final Android game targets **1 GB meaningful installed core content** plus **up to 5 GB optional extra game-managed disk space**, nominal **6 GB total**; this does **not** mean 6 GB RAM or a 6 GB APK. Optional packs require consent and available disk; core gameplay remains offline with no optional packs. Never fill empty space artificially, automatically reserve the 5 GB, delete game saves during cleanup or consume the device's last free storage. Report measured APK/core/optional/OS sizes honestly. See `docs/STORAGE_BUDGET_AND_PACKS.md` and `work-items/storage-tasks.json`.

## 8. Permanent constraints and deferred extensions
No third-party assets without recorded license. No heavy 3D engine, LLM, login or network. No silent save wipe. No hidden automation in the background of the device. Full cities, dungeons with interiors, natural-language NPC dialogue, multiplayer, expanded factions and advanced magic are *future* priorities and are not acceptance criteria for the first visual upgrade.

**Related authority:** `docs/SKYVIEW_VISION.md`, `docs/PIXEL_WORLD_STYLE_GUIDE.md`, `docs/DIVINE_INTERACTION_SPEC.md`, `docs/ARCHITECTURE_CONTRACTS.md`, `docs/WORLD_LORE_BIBLE.md`, `work-items/codex-tasks.json`.
