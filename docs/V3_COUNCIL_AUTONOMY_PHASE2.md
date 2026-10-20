# GODSEED V3 — Autonomous council, division of labor, individual memories (phase 2)

Updated 2026-10-20. Implementation branch: `feat/godseed-v3-crafting-settlement-leader-20261020` (PR #57, **draft**, no merges).

## Goal

Continue the three-person seed village with a *causal leadership loop*. Election must do more than set a flag: a leader assigns named work according to individual expertise, chooses a settlement priority based on measured shortages, and residents execute jobs **on their own** while retaining survival autonomy. Neither the player nor a divine action needs to trigger any work.

This is a deliberately small, finite, explainable 20×20 experiment. It is not multiple kingdoms, trade, family life or unlimited AI.

## Authoritative contracts

- **Roster and leadership.** The existing election remains vote-based. Only a living elected leader may issue orders. The leader is steward; remaining living residents divide building/material work and foraging according to previous contributions and traits. Assignments are **advice with responsibilities**, not forced movement: hunger and energy override them.
- **Distinct actual work.** After the initial shelter, workshop and storehouse are built, food workers provision a modest communal pantry, builders collect finite timber toward a reserve, and the steward strengthens relationships. No new forest is spawned. During construction everybody may still collaborate, preserving the foundational build chain.
- **Council reasoning.** Periodically evaluate actual communal food, timber reserve and residents. Choose an observable policy from `secure_food`, `reserve_wood` and `community`. Explain its measured trigger in a bounded event. Orders and policy are persisted in authoritative state, never computed only by the HUD.
- **Cognition.** Each NPC retains a bounded, factual list of important personal experiences (building, crafting, eating, working, conversations, elections or appointment). Memory does not pretend to be a language model or full learning system. Per-person work contributions are inspectable.
- **Persistence and isolation.** Society save schema increments from 1 to 2 **on the same society-only key** `godseed-v3-society-v1`. Only genuine schema-1 saves which pass their original validator may migrate. No contact with V3 solo saves or V1 saves. Malformed orders, invalid leader references, resource fabrication and forged memories must fail closed.
- **Determinism.** The same seed and ticks always yield the same authoritative state regardless of update cadence or renderer. Memory and order arrays remain capped for low-memory mobile.
- **Graphics.** WebGL 3D and Canvas2D show the same world snapshot, while the observatory displays the current policy, per-NPC responsibilities, and their documented actions. No network dependency.

## Acceptance and measurable evidence

- 100 independent seeded villages build their founding structures, socialize and elect without input.
- At least one leader-issued assignment decision with three distinct responsibilities; workers demonstrably execute their specializations, preserving all resource conservation equations.
- Save/load at schema 2 with the exact same tick/leader/orders/memories and unchanged autonomous future state.
- Valid existing schema-1 society saves restore successfully without mutation of their original resources; tampered schema-1 and schema-2 saves are rejected.
- Extended 10,000 or 20,000 tick simulation: bounded memory, events, voters and resources; no imaginary renewable wood.
- Browser WebGL, fallback, mode switch and offline Android package proof remain green at exact head SHA.

## Limits and next gates

Fixed candidate building sites and three named villagers remain a scope constraint; dynamic city layouts and migration between distinct settlements need a separate spatial navigation and settlement ID contract. Real family/kinship, leadership consent, richer psychology, elections after death and low-memory physical device performance are not claimed.


## Implemented files and behavior (phase 2)

- \`src/v3/society.js\`: schema-2 authoritative council state, policy audits (\`food\`, \`wood\`, \`residents\`), three elected-leader-issued roles, completed-job counters, bounded per-person factual memories, and an irreversible \`settled\` arrival milestone for migrant workers. The milestone repairs a previous oscillation where residents were pulled back before reaching distant work.
- Food worker gathers berries to a policy-dependent pantry target; builder harvests **existing trees** to a policy-dependent finite lumber target; steward pursues conversation/trust. Hungrier or exhausted characters still prioritize survival. These are actual simulation effects, not UI-only role strings.
- \`src/v3/app.js\`: council priority and measured rationale, roles, completed work and memories appear in the observation panel, without changing the solo V3 flow.
- \`tests/v3_society.test.js\`: 100-seed positive results **for all three roles**, 20,000-tick state/size bounds, deterministic cadence, invalid ballots/orders/memory rejection and save migration.
- \`tests/fixtures/v3_society_schema1_seed14.json\`: real schema-1 society snapshot generated from the previous published prototype at tick 350. Historical people, locations, resources and votes stay intact during schema-2 loading; a leader with no migrated work orders assigns and chooses policy on its **next** tick.
- \`tests/v3_browser_acceptance.py\`: verifies separate mode saves, GPU WebGL, Canvas fallback, council observatory, and the authentic schema-1 browser-load path.
- \`GODSEED-V3-Play.html\`: reproducibly rebuilt by \`python build_v3.py\` with source markers, no CDN.

### Observed behavior in an in-process diagnostic

On seed 14 at tick 2,000 the three citizen assignments were \`Aria → steward\`, \`Bran → builder\`, \`Elen → forager\`, with actual observed completion counters 823, 4 and 144 respectively, and six timber units preserved. These figures describe one deterministic test state, **not** balancing targets for other worlds.

Each new policy is based on measured communal inventories rather than a timer creating resources. Final role and policy implementation is in an isolated draft PR; compare the exact GitHub Actions commit result before merging. A green Chromium test does not prove release-ready Android performance.

### Known restrictions

- Leadership can choose stocking priorities and delegate roles, but cannot yet negotiate, create new villages or legislate. Votes are deterministic and still tend to select Aria because of her founding contributions.
- Role assignment is deterministic, not learned job selection; factual memories are bounded logs, not reasoning from natural-language histories.
- Wood does not regrow, social systems cap at three residents, buildings use fixed candidate sites, and pathfinding remains rudimentary.
- Society schema-2 migration covers **only** historical society schema-1 saves. It does not merge original V1 or solo V3 save identities. Migrations are validated before being accepted.
