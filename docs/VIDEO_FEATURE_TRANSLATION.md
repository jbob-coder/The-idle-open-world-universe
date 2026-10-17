# GODSEED — Gameplay ideas adapted from the uploaded WYLDHEART clip

## Intent and boundaries

The supplied ~53-second clip describes features of a different game, WYLDHEART. GODSEED is **not** a remake, visual clone, or third-person co-op game. Its player remains an observing god. Nim is autonomous. The video is used only as a list of general RPG feature inspirations; no copyrighted sprites, images, dialogue, video or character designs are imported.

## First five implemented features — v0.2 experimental

1. **Origins and backgrounds.** Five deterministic character origins with different personality weights and a starting proficiency. Nim retains an origin story in save data.
2. **Learn-by-doing skill progression.** Survival, scouting, combat, crafting and lore gain proficiency from actually completing relevant actions; there are no class locks. This is distinct from Nim's character level.
3. **Risk-sensitive combat.** Nim can dodge or parry wildlife attacks according to energy, caution, proficiency, and equipment. These are simulation decisions, not real-time touchscreen controls.
4. **Dangerous ruins / trap detection.** Exploring ruins can trigger traps; scouting and caution improve detection, with recorded outcomes.
5. **Rumors and exploration clues.** Ruins can reveal legends pointing to another ruin. Nim may independently pursue these leads if fed, rested and not busy surviving. Completing a clue earns experience and a chronicle event.

## Already in v0.1

Open-world exploration, landscape, wild creatures, survival needs, food gathering, early crafting, shelter/camp, XP/leveling, memories and god interventions.

## Not implemented yet

NPC villages and spoken rumors, selectable companions and shared XP, true dungeons with rooms, deeper magic spells, stealth and lockpicking, equipment trees, elaborate settlement upgrading and story branching. These can be considered in five-item batches after profiling on old Android devices. The video's fully animated 3D combat, open-world mesh, realistic models and full co-op network game are **excluded** from GODSEED's low-end scope.

## Design rules

- Preserve 64×48 map, low-resolution Canvas 2D, offline Android WebView, no runtime network permissions, no external dependencies.
- Never require divine commands for Nim to advance; God actions influence circumstances only.
- All decisions are reproducible for a chosen world seed; no LLM or remote AI.
- Store <=10 clues, <=45 log messages, <=12 memory strings, and cap skills to rank 20. Existing v1 save schema is preserved; missing new fields are backfilled by restore().
- Simulate only while the app is active. No claims of persistent background computation or consciousness.

## Next five candidates — not yet implemented

1. Procedural dungeon interior as an independent tiny local 12×12 map, entered only when Nim explores a ruin.
2. Lightweight self-directed magic, learned through lore, with mana/cooldowns rather than particle-heavy effects.
3. Stealth and lockpicking action checks in dungeons.
4. Improved camp durability and staged upgrades.
5. Persistent NPC encounters, rumors and trade. Full co-op remains deferred.

## Acceptance gates

- New Node deterministic, migration, and long-run tests, plus browser landscape checks.
- The same APK packager structural checks; no physical Android performance or installation claim without testing.
- Post-merge CI green and an updated project-state document.
