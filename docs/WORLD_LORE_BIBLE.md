# World lore — The Forgotten Borderlands

A deliberately small medieval-fantasy region whose history can be discovered, not narrated all at once. The god watches **Nim**, a self-directed traveler of one of the five existing origins. The ruins predate the current travelers; the divine presence leaves omens, but no character knows that they live in a simulation.

**Regional identity:** moss-covered royal road, patches of wild forest, collapsed observatories, rune shrines and two hamlets. The 64x48 world is a single explorable region, not a collection of instanced continents. Avoid implying features that code does not simulate.

**Known cast:** Nim (autonomous protagonist); Ira the Apothecary (gathers and tends herbs); Toren the Squire (patrols threatened roads); Mera the Rune Scholar (searches for lost history). Each has limited local rules, trust/mood, memories in events, and divine favor responses. Not sentient, not an internet LLM.

**Recorded legends:** The Ashen Crown, The Moonwell, The Mossbound Oath, Buried Fire and The Last Cartographer. Use these as recurring ruin labels, signs and log events, not forced cinematic cutscenes or pre-scripted quests.

**One-sentence world pillars:** Small enough to observe, coherent enough to remember, unpredictable within explicit rules, and old enough to contain meaningful ruins.

**Visual identities:**
- Village: amber windows, clay roof, timber frames, fences, herbs and narrow roads.
- Rune shrine: pale carved blocks, green-blue runes and scattered votive stones.
- Ruins: broken masonry, grass in cracks, no fully modeled interior yet.
- Forest: canopy clusters, shadowed trunks and moss; retain actor silhouette.
- God: subtle golden-green spark/rune sign at targets, never a human avatar physically walking the map.

**Boundaries:** no modern technology, firearms, direct Nim control or borrowed game/film characters. Additional gods, kingdoms or NPC families are long-term possibilities, not committed gameplay.

## First mapped areas (planning, not shipped)

The first 64×48 region is divided conceptually into **Hearthfield Clearing**, **Briarford Hamlet**, **Emberwick Hamlet**, **Mossveil Wildwood**, **Stormstone Ridge**, **Crownfall Ruins**, **Oathkeeper Grove**, and **Moonwell Fen**. Their anchors, gameplay functions and dependencies are documented in `docs/WORLD_REGION_BLUEPRINT.md` and `data/world-regions.v1.json`. These named biome identities are planned overlays, not new map implementations or additional NPC simulation. Preserve the established small world and its current landmarks while Codex builds regional mechanics.
