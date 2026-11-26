# GODSEED — World time, activity resolution and consequences

2026-11-26. Documentation only. The clock pause rule was previously approved and reconfirmed by the owner; meaningful activity interruptions were previously approved in GAMEPLAY.md. The owner additionally approved foreseeable consequence warnings, including leaving a work shift without authorization. The technical model below is a proposed design contract, not implemented code.

## Approved rules

- Fictional time is paused while the player reads narration, reviews or selects choices, checks character status, or otherwise has not submitted a time-consuming action. Real-world waiting never advances the world.
- Continue submits the selected action once. Selecting or changing a choice alone does not commit it. No additional confirmation dialog is required. Information-only interactions do not advance time unless they represent an actual in-world action such as asking a person or searching.
- A submitted action advances the shared world clock by its actual resolved duration. NPCs and world systems act independently during the same fictional interval; their durations do not add sequentially to the player's clock.
- Meaningful events may interrupt long activities at the point they affect the player or create an actionable decision. Ordinary events can proceed without interruption. An unknown distant event is not automatically player-visible, and news does not require player involvement. Preserve partial work, consumed resources and elapsed time.
- Warn about material, reasonably foreseeable consequences before submission, especially when a choice may breach an existing obligation. An inline choice warning or selected-choice detail is part of the existing interface, not an extra confirmation. Use conditional language for uncertain outcomes; disclose only what the character could reasonably know from rules, experience and observed information.
- Warnings inform rather than prohibit feasible actions. Do not make the player comply with a supervisor or other NPC. Responses depend on actual policies, agreements, authority, circumstances, history, relationships and the independently acting NPC. Do not guarantee discipline or forgiveness, disclose hidden information, or treat lost future wages as forfeiture of already earned pay.
- Apply this warning principle to employment, education, agreements, relationships and other commitments. Unforeseeable consequences can still occur. Relevant NPCs retain their own evidence-based memories and may learn about outcomes through later communication; no universal knowledge or reputation change.

## Proposed technical contract

Use one authoritative fictional clock with a calendar presentation and a sufficiently fine integer time unit (seconds are a candidate, not a finalized implementation choice). Each actor has a current location or in-transit state, current activity, commitments and available resources. Work, travel, sleep and other activities that require exclusive attention share an actor's time budget. Compatible simultaneous actions need explicit rules, not implicit double use of time.

For each confirmed activity:
1. Validate feasibility, current state revision, prerequisites and declared intent. Reject duplicate or stale submissions without advancing time twice.
2. Create a bounded activity with intended duration, required resources, checkpoints and possible interruption conditions. Duration depends on actual task and context; do not apply a constant duration to all choices.
3. Advance the shared clock to the next relevant completion, resource/access change or scheduled event. Advance affected NPCs through that same interval based on their plans and circumstances. World events may occur without the player knowing.
4. At each boundary reconcile actual time, movements, costs, progress, obligations, effects and actor-specific observations. Re-evaluate prerequisites and events. Proposed tie policy: settle elapsed work before evaluating new decisions; resolve simultaneous conflicts through explicit stable ordering and causal dependencies, not arbitrary player priority. Exact ordering remains open.
5. If a new material decision is required, stop at that fictional instant, preserve any pending activity and completed portion, and present feasible choices. If no interruption requires a decision, continue until the goal completes, fails or reaches another meaningful boundary.
6. Render only resolved outcomes and knowledge available to the player. Append narration, refresh the state-derived header and show fresh choices with relevant warnings. Clock remains paused until the next submitted action.

Proposed activity statuses: planned, active, interrupted, completed, abandoned, failed. Resume is a fresh feasibility check of the remaining work, not a replay of already completed steps. Some activities cannot resume after circumstances change; explain why when known. Commit effects once using stable event/transaction identities. Save/reload must preserve the current clock, partial activity, NPC plans, observations, outstanding obligations and the current decision context without advancing time merely because of loading.

## Illustrative interrupted workshop shift

A fictional example, not a fixed event or an assigned player job:

| Time | Event | Resolution |
|---|---|---|
| 08:00 | Player starts a four-hour work activity | Intended end 12:00; NPCs independently act. |
| 09:20 | An NPC brings news of an emergency | 80 minutes of elapsed work recorded, assuming all were compensable. |
| 09:20 | New choice becomes necessary | Clock stops; 160 minutes of intended work remain unresolved. |
| 09:20 | Player reads or selects an option | No time passes and no option is executed. |

Available choices depend on the actual state:
- Continue working.
- Ask for more information; time advances only when this in-world conversation is submitted.
- Request authorization to leave; the supervisor may grant or deny it.
- Leave without authorization. Inline warning example: "Leaving your shift without authorization may result in disciplinary action or loss of pay for unworked time."

The 80 minutes are retained; the remaining work is not earned merely because it was scheduled. At a hypothetical 12 CR/hour, 80 compensable minutes correspond to 16 CR gross earned entitlement; payment and deductions depend on the agreement and funded settlement. The 160 unworked minutes do not automatically earn 32 CR. No automatic fine, firing, loss of already earned wages, or NPC knowledge of an unobserved departure. If the player chooses to leave, use the actual route and travel time; do not teleport to the emergency. The emergency may evolve independently, including while the player continues working.

## Acceptance scenarios — pending implementation

- Reading, changing selection, opening status and save/reload preserve the fictional clock and world state.
- A duplicate Continue does not advance time or create a second transaction.
- A 240-minute player activity and concurrent NPC activity share one timeline, not a sum of their durations.
- An interruption at +80 minutes retains only completed effects and leaves 160 minutes unresolved.
- Resuming an interrupted activity cannot duplicate earlier wages, skill gains or resource consumption.
- Routine distant events do not force a pause or reveal hidden knowledge.
- A foreseeable breach shows a warning before Continue, without forcing an extra dialog or preventing a feasible departure.
- NPC decisions and memories depend on actual evidence, policies and circumstances; there is no guaranteed punishment or forgiveness.
- An unfunded earned wage remains an obligation rather than creating money. Already earned entitlement and future unworked time remain distinct.
- Travel and simultaneous activities respect explicit route/access and actor time budgets.

## Open decisions

Exact calendar, initial date and time, time unit, travel and task duration formulas, interruption significance criteria, simultaneous event conflict policy, offscreen simulation fidelity, wage rounding and settlement intervals, and specific disciplinary policies remain to be designed. No engine, runtime code, save file or test suite has been added. Next design increment: formalize activity durations, NPC scheduling/decision inputs and interruption criteria without reopening the approved pause or warning rules.
