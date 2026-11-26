# GODSEED — Narrative gameplay

Design baseline 2026-11-26. See [design index](../README.md) for decision precedence and status. The following source sections are preserved verbatim; later approved decisions override earlier candidate wording.

## Purpose
Present gameplay as a continuous, text-only novel within a living world. This specification records the owner-approved interface direction from 2026-11-26. It is a design requirement, not a claim of implementation.

## Presentation
- Use a clean, centered reading column, with justified paragraphs where supported, consistent spacing, and readable novel-style typography. Avoid artificial spacing, dramatic clichés, excessive labels, and decorative containers.
- No background illustrations, character portraits, or graphical scenes in the narrative interface.
- Header: left = current in-game day and time; center = character name, current/max health, and money; right = current location. All values must come from authoritative game state.
- Place a small circular bubble on the left, above the first narrative paragraph. Pressing the three-dot bubble opens the full character status panel described below.
- Present natural narration and dialogue in prose. Describe observable events, not hidden NPC thoughts or information the player has not acquired.
- Preserve earlier paragraphs; append new narration beneath them instead of replacing the reading history.

## Decisions
- Place context-relevant action options in a vertical stack immediately after the current narrative, in the same scroll area.
- Selecting an option only highlights it (subtle background/checkmark). It does not execute the action, advance time, or change game state.
- Allow the player to change the selected option before submitting.
- Place a separate Continue button at the bottom of the choices. Disable it when no action is selected. Pressing Continue submits the selected action once, with no extra confirmation message.
- Resolve the action against the authoritative world state. Append the resulting novel-style paragraph(s), then display the next applicable choices and Continue. Previous story text remains available.
- Never treat a choice as a guaranteed outcome. NPCs may respond according to their own circumstances, memories, needs, relationships and goals. Do not force NPC actions or chapter progression to fit the player.
- Proposed implementation safeguard: reject duplicate submissions and stale or invalid actions safely; preserve the reading history. Selection itself must never commit a world-state change. Independent world simulation follows its own time policy.

## Layout sketch
```text
Day 01          Character name         Location
08:42 AM        HP 100/100 | 250 CR
(...)
------------------------------------------------
          Centered novel reading column

          Narrative paragraph.
          Natural dialogue.

          Action A
          Action B  [selected]
          Action C

                    Continue
------------------------------------------------
          Next paragraph appears below
          after Continue; history remains.
          New choices + Continue.
```
The values and scene are illustrative only; not canon or starting statistics.

## Acceptance criteria (to be tested during implementation)
- [ ] Mobile reading layout is legible; no horizontal overflow; header fields align correctly.
- [ ] Narrative is text-only, paragraphs have consistent edges and spacing; bubble is on the upper left.
- [ ] Selection can change without mutating authoritative state or submitting an action.
- [ ] Continue submits exactly once; no confirmation dialog or separate result-only screen.
- [ ] The next narrative is appended, previous narrative remains, and contextual options refresh.
- [ ] NPC autonomy, knowledge boundaries, consequences and state-derived header values remain intact.
- [ ] Invalid/stale action handling and duplicate-tap prevention are tested.
- [ ] No HTML preview is required in ChatGPT; the actual game UI technology is to be selected after inspecting the active implementation.

## Scope / open decisions
Documentation only. No source code, engine, branch, save data or existing project files are changed. Exact typography, engine-specific implementation, and custom free-text action entry remain open. Do not import another game's characters, locations, or starting statistics as Godseed canon.

## Narrative gameplay — expanded activity resolution (2026-11-26)

Owner approved the expanded novel-style action flow, separation of training progress from permanent stat increases, and interruption of extended activities by meaningful events.

### Narrative and activity granularity
- Write substantial, coherent prose passages appropriate to the complexity of the decision. A meaningful routine, work session, training session, or journey may produce several connected paragraphs rather than a one-line result. Brief results remain appropriate for genuinely brief actions. Avoid filler and artificial minimum word counts.
- A choice can express a goal or routine and authorize its ordinary implied steps without requesting confirmation for each minor movement. Do not infer unrelated major commitments, risky actions, or unselected decisions. Keep player agency at consequential decision points.
- Resolve the activity as a sequence against authoritative state: validate prerequisites, perform feasible steps, account for elapsed in-world time and resource consumption, advance independent NPC/world activity under the simulation's time policy, apply actual consequences, and generate narration and fresh options from the resulting state.
- Describe the chain of events, natural dialogue, relevant sensory details, passage of time, and observable outcomes. Use second-person narration as the current prototype direction. Do not invent hidden NPC thoughts, unearned knowledge, or events merely to lengthen the text.
- Preserve earlier story paragraphs, append the new passage, refresh the header from actual time/location/health/money, and provide new context-sensitive choices. The three-dot status bubble remains upper left and opening it does not commit a pending choice.

### Progression and time
- Preparing for the day can include hygiene, dressing, breakfast, and cleanup where feasible, with plausible elapsed time and changes to condition or consumed supplies. Do not grant a permanent stat increase simply for completing a routine.
- Work can earn compensation, improve relevant skill experience, change relationships, and consume time or resources according to actual circumstances and results. Education and training can contribute relevant experience or adaptation progress.
- Separate training/learning progress from permanent attribute or mastery increases. Award a permanent increase only when the eventual defined progression requirements are met. Do not grant unrelated stats or guarantee payment or success.
- Time advances according to activity duration and actual events, not a fixed one-minute-per-choice rule. NPCs continue their own activities independently, including during routine player activities.
- Long activities may be interrupted by meaningful new events, unavailable resources, changed conditions, or consequential decisions. Stop at the interruption, account only for elapsed time and completed work, preserve valid partial progress, describe the situation, and return control with appropriate options. No forced choice or arbitrary interruption quota.

### Prototype examples (illustrative, not canon or balance constants)
- Prepare for the day: roughly 45 minutes, improved readiness, no automatic permanent stat gain.
- Repair-shop work: roughly 150 minutes including travel, possible payment and diagnostics learning, fatigue and a potential new contact.
- Exercise: roughly 60 minutes, endurance training progress and fatigue, not an automatic permanent endurance increase.
- Follow-up actions must depend on actual resulting location, condition, relationships, remaining opportunities and elapsed time. Example values such as 60 CR pay, 250 CR starting money and +1 progress are placeholders only.

### Acceptance criteria (pending)
- [ ] A routine choice resolves multiple authorized steps and appends a coherent multi-paragraph passage when warranted.
- [ ] Simple actions remain concise; narrative never fabricates outcomes or unselected commitments.
- [ ] Time, money, location, health, condition, consumed resources and learning progress reconcile with authoritative resolved events.
- [ ] A training session can contribute progress without immediately increasing a permanent stat; eventual increases obey defined rules.
- [ ] An interrupted activity preserves partial results, does not award unearned completion rewards, and presents meaningful new choices.
- [ ] NPC autonomy and individual memories are respected throughout elapsed time; no guaranteed NPC cooperation.
- [ ] Prior story text and status-panel pending selection remain intact; Continue commits exactly once.
- [ ] Demonstrate consecutive decisions with state-dependent options; test failure paths and interrupted/resumed activities.

Documentation only. Exact time model, progression formulas, condition/resource mechanics, interruption policy and activity execution architecture remain open. The two-step interactive preview is scripted; no game code or assets modified, no runtime tests performed.



## Currency display — 2026-11-26

Use Credits, not dollars or generic coins. Keep clean and dirty balances distinct; the compact display and knowledge rules are defined in [ECONOMY.md](ECONOMY.md). The previous monetary examples are illustrative only.

## Approved clock and consequence warnings — 2026-11-26

The clock remains paused while reading, selecting choices or checking status; Continue submits the action once, and NPCs advance independently in the same resolved fictional interval. Meaningful interruptions preserve elapsed time and partial progress. Show foreseeable material consequences inline before submission, without a second confirmation or forced compliance. See [TIME_AND_ACTIVITY.md](TIME_AND_ACTIVITY.md) for the approved rules and proposed resolution contract. Exact timing formulas and trigger criteria remain open.

## Narrative combat interface — first layout proposal (2026-11-26)

The owner requested a combat layout with named technique dropdowns and selectable technique levels. Proposed first layout: keep combat inside the existing vertical novel reading column, rather than switching to a separate battle dashboard. Retain the existing header, upper-left status bubble, narrative history and Continue button. Present only observed enemy information, including visible condition and approximate distance when known; do not reveal hidden stats or precise enemy HP without an established knowledge source.

```text
Day 01          Character          Location
09:42 AM        HP 72/100 | 250 CR
(...)
------------------------------------------
The creature steps toward you. Its left
leg trembles as it shifts its weight.

COMBAT OPTIONS
( ) Move back
( ) Defend
( ) Use weapon
( ) Use ability
    Technique   [ Flame pulse       v ]
    Level       [ Level 1           v ]
    Mastery       Apprentice
    Target      [ Creature          v ]
    Risk: Higher output may strain your arm.
( ) Attempt retreat

                 Continue
------------------------------------------
Resolved narration is appended below.
```

All names, values, scene details and choices are illustrative, not approved powers or canon. The selected action, technique, learned numbered level and target together form one pending intent. Technique mastery tier is displayed separately from numbered technique level. Reveal contextual selectors only where needed; include non-ability actions and feasible alternatives such as communication or environmental interaction when appropriate. Retain previously learned levels within the same technique name. Do not reveal undiscovered techniques or levels. Display known prerequisites and foreseeable risks, including the possibility of partial execution or injury when appropriate; impossible actions remain impossible. Do not automatically use the highest level. No stamina or mana resource is added.

Dropdown browsing, reading and changing targets do not advance time. Continue submits the selected intent once; combat uses the shared fictional clock, and NPC actions resolve independently in the actual elapsed interval. Combat initiative, action durations, simultaneous resolution, targeting details and damage formulas remain undecided; this layout does not establish fixed turns or guarantee retreat or attack success. Append resolved narrative and refresh valid actions without deleting prior history.

Acceptance checks (pending implementation): mobile legibility; named dropdowns only show character-known levels; selection can change without mutation; Continue commits once; warnings respect player knowledge; unknown enemy state is not exposed; NPCs can act independently during elapsed time; prior narration and status access remain intact. No engine or runtime implementation. Layout is a proposal pending owner review.

## Combat interface V4 and Option B — owner-approved (2026-11-26)

The owner preferred the simplified V4 visual direction and clarified that HTML is not the chosen game implementation technology. The preview is a layout reference only. The owner then selected Option B: selecting Use ability replaces the combat action list temporarily with the character's known techniques and their learned numbered levels. Keep the header, status access, narrative reading column and prior story history visible. Provide Back to actions and the existing Continue control. Do not expand a separate ability box under the original action list or repeat the ability name, mastery and other unnecessary labels in the compact selection area. Display each known technique/level as a compact selectable entry, e.g. Flame Pulse — Lv. 1, Flame Pulse — Lv. 2, Flame Barrier — Lv. 1; these examples are not canon. Show target selection and foreseeable warnings only when relevant to the chosen action; preserve knowledge boundaries and distinguish numbered technique levels from mastery tiers.

Proposed navigation safeguards: opening a submenu, selecting a technique or level, and returning to actions do not advance fictional time or commit an action. Back permits choosing a different action; Continue is enabled only for a complete pending intent and submits it once. After resolution append narration and refresh the main action list. This replaces conflicting layout details in the first combat proposal, not its simulation rules. Equivalent submenus for other actions are a candidate where additional choices are needed, not a mandatory extra step for every action. Acceptance checks: main actions visible initially; Use ability replaces only the action list; Back restores it; known levels remain individually selectable; no undiscovered levels exposed; no time/state changes until Continue; contextual warnings and targets preserved. Documentation only; no runtime implementation or tests performed.

## Concurrent combat timing and spatial context — owner-approved (2026-11-26)

The owner approved combat based on character speed, action duration, environment/setting and distance rather than traditional alternating turns. All four factors must influence feasible actions, timing and outcomes where relevant. Use the same shared fictional timeline for players, allies, opponents and independent world events, consistent with [TIME_AND_ACTIVITY.md](TIME_AND_ACTIVITY.md). Reading, menu navigation and pending selections remain time-free; Continue commits a selected action once.

Proposed technical direction: use concurrent, interruptible actions with distinct preparation, movement or effect travel, execution/contact and recovery phases as applicable. Derive timing from the relevant effective movement, reaction or execution capabilities and the action's actual requirements, not one universal speed multiplier. Distance, range, relative motion, route accessibility, terrain, obstacles, cover, visibility and available space influence the relevant phases and feasibility. Avoid counting the same movement or speed modifier twice. Re-evaluate at meaningful event boundaries rather than assuming initial distances or targets remain fixed. NPCs act on their own knowledge and goals and are not limited to one action per player action. A fast actor may finish several feasible actions during a longer action; a faster actor does not automatically win. Preserve causal ordering, actual elapsed time, partial progress, interruptions, attribute prerequisites, risk warnings, and the approved Option B interface. Physically impossible actions remain impossible. Do not introduce hidden enemy stats into the narration or interface.

Illustrative timing only: a creature 6 m away moving toward a stationary player at an effective 3 m/s takes 2 s to reach the player's position if unobstructed and unchanged. A technique with a 1 s preparation phase can begin its effect before that arrival; a 3 s preparation may be interrupted by contact. Actual reach, effect travel, changes of position, obstacles, enemy decisions and other events can change this result. These numbers are not balance constants, approved abilities, or guaranteed outcomes.

Pending acceptance checks: compare equal actions with different character speeds; different action durations at equal speed; near versus far targets; clear versus obstructed paths; moving targets and changes in range; concurrent NPC actions and meaningful interruptions; equivalent player/NPC resolution; no player-first bias solely from menu submission; no double-counting of elapsed time; preserve partial activity and causal state across save/load. Exact time resolution, action phase formulas, spatial representation, tie resolution, reaction opportunities, damage and recovery rules remain open. Documentation only; no runtime code or tests performed.

## Reflex-based combat reactions and action cancellation — owner-approved (2026-11-26)

The owner approved cancellation of an action in progress to react to an unexpected attack in some circumstances, based on the character's Reflexes stat. This is a conditional opportunity, not a universal free cancel or guaranteed dodge. Preserve concurrent combat, actual elapsed time, distance, setting, action duration, and independent NPC decisions.

Proposed integration: interpret Reflexes as the existing candidate combat attribute "reaction speed" in CHARACTER_STATUS.md rather than introducing a redundant attribute. The final display name and numerical conversion remain open. Reflexes influences response latency after a threat is perceived; detection depends on actual awareness, visibility, sensory capabilities and available information. A reaction must fit the available time and the actor's current action phase, physical condition, movement capability and spatial constraints. Some phases may be interruptible, others committed; an attack already released is not undone by canceling later recovery. A successful opportunity permits a feasible response, not automatic avoidance of damage. Stop at the appropriate fictional decision boundary if the player can meaningfully choose; reading the response options does not advance time, but the chosen response consumes its actual latency and execution time. NPCs evaluate comparable opportunities independently without access to hidden player intentions. Preserve elapsed time, costs already incurred and effects already resolved; unfinished progress may be lost or retained only according to the action's definition. No refund or rewind merely from cancellation.

Illustrative timing: if an observed threat will make contact in 0.6 s, a character whose response latency is 0.2 s and whose feasible defensive movement takes 0.3 s may react in time; a character requiring 0.4 s latency plus 0.3 s movement cannot complete that defense before contact under those same conditions. These are example values, not stat conversions or guaranteed outcomes.

Pending checks: different Reflexes values at equal circumstances; unseen threats; insufficient distance/time; interruptible versus committed phases; already-resolved effects and spent resources preserved; no extra elapsed time from paused selection; no automatic dodge; equivalent player/NPC rules and save/load consistency. Exact Reflexes scaling, phase cancellation constraints, reaction options, handling of partially completed defenses and event ordering remain open. Documentation only; no runtime code or tests performed.

## Localized injuries and overall health — delegated design decision (2026-11-26)

The owner delegated the decision on body-part damage. Adopt overall HP (existing current/max display) together with persistent localized injuries and functional impairment. Keep the primary reading interface simple; communicate observable effects through narration and show known player injuries in the existing status/condition view, not a mandatory body dashboard.

Design rules: resolve contact using the actual target, reach, timing, environment, defense, protection, attack characteristics, effective durability and applicable anatomy. A chosen target is an intention, not guaranteed contact. Track a single causal damage event with overall health effects and any local injury consequences; do not subtract duplicate HP solely because an injury is also recorded. Not every hit causes a lasting injury. Local severity and affected function determine impairment; minor and major injuries differ. Human examples: head injuries may impair awareness/concentration/coordination; arm injuries may impair grip, weapon handling or techniques requiring that limb; leg injuries may impair movement, balance and evasion; torso injuries may impair breathing, endurance or physical performance. These are possible effects, not automatic fixed debuffs. Use side-specific regions when relevant; support nonhuman anatomy through species definitions, not universal human limbs. Existing injuries can affect subsequent action timing, feasibility, defensive response and NPC decisions. Apply equivalent mechanics to players and NPCs/creatures where biology permits. Distinguish effective temporary or persistent functional impairment from permanently acquired attributes and technique mastery.

Recovery direction: track overall health and injury state separately; restored HP does not automatically repair every injury. Recovery depends on actual injury, elapsed fictional time, biology, relevant treatment and ability effects; severe injuries may persist. Do not guarantee natural healing or introduce new mana/stamina resources. Preserve injuries, treatment, elapsed time and causally resolved effects across save/load. Disclose opponent injuries only through observable evidence or valid assessment, not hidden condition records. No mandatory exact enemy body-part HP display. Target options appear only where meaningful in the existing compact action flow.

Pending checks: comparable damage to different regions; minor vs severe injury; attack misses or hits another region; armor or defense changes result; multiple injury effects without duplicated health damage; persistent impairment affects movement/reaction/technique use; recovery of HP without automatic full injury cure; nonhuman anatomy; unchanged earned mastery and base stats; equivalent player/NPC rules; observation boundaries; save/load. Exact injury severity bands, HP aggregation, damage formulas, treatment/recovery schedules, fatality/incapacitation and permanent injury rules remain open. Documentation only; no runtime implementation or tests performed.

## Biological condition, recovery and fatality — owner-approved (2026-11-26)

The owner approved the proposed biological condition system connecting localized damage, effective attributes, action feasibility, recovery and world time. This extends the preceding localized-injury decision.

- Resolve contact, attack force/effect, protection, defense, durability and affected anatomy before deriving overall health damage and any localized injury. Apply actual consequences once and refresh feasible actions from the resulting state.
- Use minor, moderate, severe and critical injury severity bands. Support permanent impairment as approved; represent permanence independently of acute severity in the technical model so a stable lasting injury need not be life-threatening. Minor injuries may cause slight impairment, moderate injuries noticeable impairment, severe injuries substantial functional loss, and critical injuries possible incapacitation or vital danger. Multiple injuries can coexist and may deteriorate when circumstances warrant; do not make deterioration universal.
- Modify effective performance according to affected function while preserving earned attributes and technique mastery. A leg injury may reduce speed, agility and balance without directly reducing reaction speed; an intact ability to react does not guarantee the body can execute a defense. Do not impose blanket penalties or assume that every injury affects every stat.
- Recovery depends on actual injury, biological characteristics, treatment, nutrition, rest, fictional elapsed time and applicable healing abilities. NPCs retain injuries and may autonomously withdraw, seek care, recover or deteriorate while the player is elsewhere. Preserve HP and injury state separately; restoring HP does not guarantee anatomical restoration. Permanent impairment may remain unless an applicable restoration mechanism exists.
- Zero HP is not automatically death. Depending on actual condition, a character may be unconscious, incapacitated, critically injured or dead. Determine death from failure of essential biological functions under the applicable species/ability rules, rather than an HP threshold alone. No automatic revival, respawn, resurrection, or player-specific immunity is established by this decision.
- Keep the narrative-first interface, existing status access, observation limits and shared fictional clock. No mandatory anatomical dashboard or new stamina/mana resource.

The previously demonstrated stat values are illustrative and not balance constants. Pending design: HP/biological-state reconciliation (including zero-HP survival and prevention of invalid actions), severity thresholds, effective-attribute composition, treatment and recovery rates, vital-function criteria, stabilization, death persistence and the player-facing consequences of death. Acceptance scenarios must include localized impairment with intact reflexes; multiple concurrent injuries; deterioration and recovery during offscreen NPC activity; HP restoration without full injury repair; zero HP with survival or incapacitation; fatal vital failure regardless of displayed HP; and preservation across save/load. Documentation only; no runtime implementation or tests performed.

## Single persistent world and character succession — owner-approved (2026-11-26)

The owner approved creating another playable character after a previous character dies, in the same persistent world. The game creates only one world seed; a new seed is generated only after the user deletes the game's cache/data that contains the world. Do not create a new world seed on character creation, death, normal exit, reload, or ordinary New Game navigation. No in-game reseed option is authorized. The previous character's death and actual world state persist.

Technical interpretation proposed for review: the owner's term "cache" refers to deliberate deletion of authoritative local game/world data, not ordinary disposable temporary cache. Store the seed and authoritative world state durably, since operating systems can clear temporary caches automatically; exact platform and deletion behavior remain open. A missing/corrupt save is not authorization to silently generate a replacement world. Seed determines reproducible generation inputs but does not replace the saved history of actions, NPCs, economic transactions, relationships, deaths and world changes. Existing menu labels and Saved Characters behavior in INTERFACE.md require reconciliation without permitting independent world seeds.

### Decision questionnaire — assistant recommendations, awaiting owner review

1. Timeline after death: continue from the actual world date/time; no reset to Day 1.
2. Active characters: one player-controlled character at a time; other living characters are autonomous. Whether voluntary character switching is supported remains a decision.
3. Succession: create a new character with an age-appropriate background and plausible life history in the existing world. Do not recreate a deceased character as the same person.
4. Starting location: select from plausible available origins/residences, not automatic return to the old character's location.
5. Prior character possessions and estate: remain in the world; inheritance depends on actual relationships, legal rules and access, not account ownership.
6. Progress and powers: no automatic transfer of level, stats, techniques, money, abilities or knowledge to a successor.
7. Historical reputation and NPC memory: persist and refer to the previous character; a successor earns a separate reputation, with connections only where justified.
8. Death records: keep a persistent character record and factual death event; no automatic resurrection or respawn.
9. World clock while creating a successor or outside gameplay: paused, consistent with approved time rules; any intentional time skip requires an explicit future rule.
10. Saving: automatically persist committed events and use recoverable checkpoints, not independent world timelines; preserve the seed and simulation random state.
11. Save recovery: recover the last consistent checkpoint plus available committed events without granting an intentional rollback or silently generating a fresh seed. Technical backup format remains open.
12. Seed lifecycle: stable seed stored once with world identity and generation version; no player seed selector or reroll. Derive subsystem random streams from that world seed, not new independent world seeds.
13. Data deletion: only a deliberate deletion of authoritative game data produces a fresh world on next launch; do not expose routine cache eviction as a reset. Actual deletion controls and warnings depend on the future platform.
14. Menu: New Game creates a character in the existing world (or initializes the world on first launch); Continue resumes a valid active character; Saved Characters shows the roster/history, never independent world saves. Voluntary switching remains open.
15. NPC/world continuity: all surviving NPCs, settlements, rifts, institutions, resources and consequences persist; the new protagonist is not the center of the world.
16. Knowledge boundaries: previous playthrough knowledge is not automatically character knowledge; only valid in-world learning and observations unlock information.

Only the single-seed and post-death character succession rules were explicitly approved in this turn. The numbered answers are assistant recommendations for owner review, not locked decisions beyond already approved rules. No game data was deleted and no seed was generated. Documentation only; no runtime code or tests performed.
