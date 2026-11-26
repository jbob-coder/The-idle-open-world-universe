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
