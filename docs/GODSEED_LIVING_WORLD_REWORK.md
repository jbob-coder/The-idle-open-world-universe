# GODSEED — Living World Rework: civilization, autonomy, and world size

**User experience requirement:** GODSEED should feel like *a visual life simulation*, not a deterministic route follower with repetitive combat. The player is a god who **observes**, **speaks**, **suggests** and **influences**; individual inhabitants preserve agency. Buildings and the history of settlements must exist in the rendered, persistent world.

## What this branch truly implements (first working societal slice)

### Autonomous people
- The three existing named residents (Ira, Toren, Mera) now use a simple scheduled rule-based life loop: gather wood, quarry stone, grow/harvest food, travel, meet neighbors and rest at home at night or when exhausted.
- The colony stockpile represents resources collected from real map tiles. Collecting resources changes the actual map tile; renewal happens outside protected building footprints. The new code is deterministic and entirely offline.
- Each resident has basic personal energy, joy, conviction and creativity. Their personal creativity and local circumstances influence how new buildings look. Their activities and decisions are visible in the life diary.
- Existing divine Inspire responses and story Chapters I–III remain functional.
- **Not yet implemented:** births/deaths, full lifespan and family lines, property ownership law, hundreds of inhabitants, conversational AI, ambitions over years, nuanced social conflict. The code must not claim these exist.

### Village blueprints and common-sense placement
- Briarford and Emberwick start with actual *2×2 tile* timber/stone/moss cottages, not simply a single “village” tile.
- Villagers use explicit blueprint requirements and economy to expand:
  - Cottage — 3 timber + 2 stone
  - Farm — 2 timber + 1 stone + 1 food
  - Workshop — 5 timber + 3 stone + 1 food
  - Great hall — 7 timber + 5 stone + 2 food
- Sites must be near local settlements and roads, with 2×2 clear, protected footprints and spacing. No water, roads, shrines, intact ruins, historic ruin sites, resources or the player's camp may be overwritten. Villagers may customize architectural style.
- Every building has type, position, footprint, creator, visual style and construction time in the v1 save. Buildings are drawn on the cached, square-pixel Canvas layer without adding atlas megabytes.
- Growth is bounded to 16 structures in this first map. Settlement Age advances *Founding → Village → Craft* by actual buildings/workshops, not by arbitrary user clicks. It is **not** an entire tech tree.
- **Not yet implemented:** multi-building interiors, NPC obstacle navigation around walls, player-modifiable blueprint drafting GUI, roads built by builders, commerce, governance, farming seasons, housing need calculations for hundreds.

### God's message interface
- Choose **Nim, Ira, Toren or Mera**; write short English or Spanish text describing an **intent**, e.g. “Construye una casa”, “Cultiva alimentos”, “Descansa”, “Explora”.
- Offline interpretation maps supported vocabulary into one of: **build, farm, explore, rest, help, study, gather**. Other text is explicitly not understood. This is **not a neural language model**, and an unsupported sentence does not secretly trigger a random command.
- Each inhabitant weighs the intent against their health, occupation, personality and trust and records *considering / declined / acted*. A refusal is an accepted gameplay outcome. There is no button to force compliance or grant completed objectives.
- Resident suggestions influence their focus and next actions. Nim's own safety and survival still come first.
- The UI shows the settlement stockpile and age, built structures, inhabitants' current work and the recent decision journal.

### Preserve existing GODSEED
- Continue support for existing `version:1` world saves, `godseed-one-small-life-v1`, all 3 finished earlier narrative chapters, 64×48 region map, 16×16 tile pixel style, 3 NPC / 5-enemy baseline, low RAM budget, offline assets, native Android host, physical device release issue #13.
- New `life` data is sanitized/bounded on restore. Absence of this data in old saves creates a compatible first settlement rather than deleting the saved world.

## The critical next release: real world expansion (not yet implemented)

**The current 64×48 map is NOT an open world.** Calling it “open world” in user-facing copy is misleading. The new buildings in this branch do not change that.

Implement world coordinates and a chunk service next: immutable seed-derived 32×32 terrain chunks, a bounded cache of neighboring chunks, snapshot diffs for modified tiles and permanent structures, a global settlement registry, seamless camera and autonomous agent navigation across chunk borders, streaming pathfinding, and old-save mapping into world chunk (0,0). Keep memory bounded even if a character travels 1,000+ tiles.

Require tests that cross at least four chunks in one direction, leave/re-enter a previously modified village unchanged, create distant autonomous settlements with independent resource budgets, retain all prior GODSEED saves and satisfy existing phone memory targets.

## Subsequent living-world milestones
1. **Life stories:** needs, occupations, decisions, personalities, memories, relationships, rivalries, friendship, families, illness, aging and consequences. The life timeline must show why a choice was made, not just count hits/XP.
2. **Settlement simulation:** workers, stockpiles, blueprint approval and personal modification, roads, housing, construction/maintenance, professions, trading, economy, shortages, governance and distinct architecture per region.
3. **Era simulation:** actual tech tree; prerequisites, research, settlement development and transitions across recognizable eras. No instant jump by score threshold alone.
4. **God as observer:** natural-language parser with explainable intent recognition, partial requests/ambiguity handling, NPC autonomy and explicit opt-in for higher-quality **offline** language understanding if memory measurements allow. No cloud service needed to play.
5. **Presentation:** better 16×16 art for inhabited interiors, sprite variation, social emotes, animation, worksite progress, neighborhood maps and optional accessibility overlays; always measured for low-end Android.
6. **Release evidence:** 20-minute physical 2–3 GB Android device soak, FPS/RSS/PSS and backup/upgrade checks and signing; issue #13.

## Acceptance for THIS branch
- Node regression tests: settlements built on safe footprints from actual map materials; the God can send Spanish/English proposals; refusal, partial understanding and accepted proposals have durable records; performance/save size remain bounded; all old chapters still conclude.
- Offline Chromium Playwright: real message field, decision list, settlement visual development, saved world, no external requests, no JavaScript errors.
- Android Gradle + API29 emulator: existing six native instrumentation tests and exact-head APK artifact. CI tests are evidence **for this commit only** and do not replace real phone tests.
- No auto-merge into `main` and no edit/overwrite of Codex-owned branches.

The previous “100% completed” milestone applies only to the narrow 3-chapter story, not this requested life-simulation game. Track living-world work independently.
