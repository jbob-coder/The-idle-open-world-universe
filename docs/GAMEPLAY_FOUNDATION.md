> **LEGACY SIMULATION BASELINE (2026-10-20):** Preserve v1 saves and 2D implementation evidence; the final target is autonomous 3D Pixel Squares society, not the old fixed camera or initial population. See [current authority](https://github.com/jbob-coder/The-idle-open-world-universe/blob/docs/godseed-agent-task-governance-v1/docs/PROJECT_AUTHORITY_AND_REFERENCE_STATUS.md).

# GODSEED — Minimum Playable Systems: Foundation Before World Expansion
**Status: prioritized planning, NOT implemented work.** The source already supports several of these mechanics in basic form, so the task is to **validate, stabilize and connect** them into a reliable play loop, not write duplicate engines.

## P0: systems that must work before the map gets bigger

| System | Current baseline | Minimum acceptance |
| --- | --- | --- |
| Game bootstrap, offline clock and pause/speeds | Exists (HTML/WebView + JS ticks) | Start with no network, no JS errors, pause halts world, resume does not double-run |
| Seeded world + safe initial resources | Exists (terrain + 7×7 clearing) | Same seed = same map; spawn walkable and sufficient nearby food/wood/stone; initial threats bounded |
| Nim autonomous decision cycle | Exists (`plan`, `botAct`) | Prioritize hunger, low HP and energy, then resource work/exploration; no forced player movement; no repeated indecision loop |
| Movement/pathfinding and encounters | Exists BFS 3072 cells | All goals have bounded routes; unreachable destinations fall back; no going through water or trapping Nim |
| Needs/resources and renewable ecology | Exists hunger/energy/berries/camp | Food replenishes at a measured bounded rate; no irreversible soft lock from depletion; no save explosion |
| Basic craft/camp progression | Exists wood/stone/hatchet | Nim can autonomously gather/build/use a shelter without an impossible resource requirement |
| Wildlife/combat/recovery | Exists wolf/boar/dodge/parry/revive | Threat budget is bounded; Nim can survive/escape or recover; no violent endless spawn loop near start |
| 3 NPC social interactions | Exists Ira/Toren/Mera/trust/favors | Travel remains capped; Nim may meet them naturally; Inspire leads to one activity and one reward/event |
| Divine interventions | Exists Bless/Gift/Bloom/Guide/Storm/Inspire | Invalid target costs 0 Faith; successful power spends cost once; effects readable and state persists |
| Skills/ruins/shrines/story | Exists origins/skills/traps/rumors | Finite shrine reward and ruin progress; logs describe choices; no duplicate milestone farming |
| Fog/map awareness | Exists `seen`, minimap | Unknown cells stay unknown, region POIs discover naturally, inspection honors fog |
| Save/restore + Android lifecycle | Exists JSON + browser storage | v0.1–v0.4 saves migrate; pause/close/resume safe; offline APK structural check + real device QA pending |

## Five non-negotiable core invariants
1. **Nim acts alone:** no player movement/attack controls. The player always acts as a deity.
2. **Every action has state consequences:** survival needs, resources, progress or discoverable story, not a cosmetic-only HUD log.
3. **No soft locks from geography:** mandatory destinations are connected by walkable paths, or the planner can recover with a reachable fallback.
4. **All generated worlds are safe to save and replay:** determinism, bounded mutable state and old-save compatibility are preserved.
5. **Low-end Android is authoritative:** test on 2 GB and 3 GB total-RAM phones; prefer 128–192 MiB app resident, soft 256 MiB, pending real data; do not confuse with 1GB+5GB disk scope.

## Intended first 10–20 minutes
- Minute 0–2: Nim awakens in R00 Hearthfield, chooses nearby food, wood or stones; player sees goal/thought and a working clock.
- Minute 2–5: Nim eats/rests, forages and prepares camp. Player can use Bless or Bloom; actions are logged and visibly applied.
- Minute 5–10: Nim finds a road, reaches Briarford or Emberwick as survival allows, meets Toren or Ira autonomously; player can Inspire a revealed traveler.
- Minute 10–20: Nim pursues a shrine/ruin rumor or learns crafting/skills; threats remain proportional; world saves and later resumes.

These are **experience targets, not timers or scripted guaranteed outcomes**. Random seeds/AI priorities can vary, and a 10-minute real-world target needs actual tests because simulation speed is adjustable.

## Priority order and implementation owners
- **First batch F01–F05:** simulation/time; needs and renewable resource floor; pathfinding and AI goal fallback; god→NPC consequences; save/offline error handling.
- **Second batch W01–W05:** region schema and generation guarantees; safe locations; road connectivity; village NPC routines; zone resource/hostility weights.
- **Third batch W06–W10:** ruins/shrine anchors; meaningful discovery; difficulty/weather flavor; save migration/determinism; long-run/stress/device evidence.

The new 15 tasks are **in addition to 25 visual+5 storage tasks** (45 total planned tracked tasks). They do not silently complete or duplicate A/E; visual tasks implement artwork and HUD, while F/W establish correct gameplay/world topology.

## Anti-scope-creep
Do not add full village economies, 100 NPCs, multiplayer, an LLM, simulated society across days offline while app closed, additional world maps or a new Android engine before core loops and connectivity pass. Region names alone do not make the world richer; mechanics and consequences do.

## Definition of foundation complete
After F01–F05, the same deterministic seeded world reliably runs 10k simulation ticks with player controls optional and saves preserved; world Gate 1 is navigable. After W01–W10, all eight regions have stable identities, roles and accessible landmarks with meaningful actions and tested migration. Each task requires a code diff, test evidence and honest device status.
