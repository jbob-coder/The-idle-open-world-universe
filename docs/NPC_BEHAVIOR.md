# NPC & autonomy contract (existing mechanics vs proposed visual work)

**Existing mechanics verified by source review:** `src/sim.js` has deterministic `initPeople`, `updatePeople`, `meetPerson`, and three traveler records capped to 3 NPCs. People wander near `homeX/homeY` at a small periodic cadence; no online model.

| Traveler | Profession | Existing Inspire consequence | Pixel sign |
|---|---|---|---|
| Ira | Apothecary | Blessing can grow herb resources near her | Satchel + herb green |
| Toren | Squire | Drives off beasts near his patrol | Shield + steel gray |
| Mera | Rune Scholar | Can reveal a clue/ruin in the world | Rune staff + violet |

Nim independently prioritizes hunger, recovery, foraging, shelter, crafting, danger, ruins and NPC contact when conditions make it relevant; encounters generate log/history. The player changes conditions with Faith powers, not the decisions of Nim.

**Do not couple rendering to logic:** `renderNpc` may read role, direction, mood, activity, favorUntil; it must not call `updatePeople()` from the draw loop. Draw event messages after sim tick transitions. If facing isn't persisted, derive direction from last and current position in renderer local memory.

**Future social behaviors (not implemented):** barter, favors, camp visits, distrust/rumors, villagers remembering divine events. These require separate deterministic tests and save migration plans; avoid introducing them during visual redesign.

**Acceptance:** at most 3 live NPCs in base game, deterministic movement per seed, gifts only applied once, no extra player command panel for moving NPCs, stable save JSON, correct offline flow.
