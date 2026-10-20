# GODSEED V3 — crafting → construction → settlement → social life → leadership

Date: 2026-10-20. Status: experimental isolated vertical slice, **not merged**.
Base: `feat/godseed-v3-one-living-npc-20261020` at `884a01272b6c899c70f9f9c01d7b50f3c9652e51`.
Authority: owner direction is an offline, autonomous medieval 3D Pixel Squares ant-farm. The player's intervention is optional.

## Objective and observable loop

1. Start with **Aria only**. She independently seeks food, rests, collects a finite tree resource, crafts a tool at real material cost, travels to a site, and constructs a shelter. A placed structure must occupy a distinct map position.
2. Once a shelter exists, at most two named outsiders can arrive at different times. This is a **scripted bounded migration demonstration**, **not** reproduction or a claim of a realistic population model.
3. Residents exchange real social interactions while near one another, raising bilateral trust and contributing to a persistent relationship ledger. Personal skills/contributions can differ.
4. Given 3 residents and sufficient interaction, citizens vote autonomously on a leader. Votes are inspectable and persist. A leader has a recorded role, not magical authority; future policy/leadership effects remain a separate task.
5. If labor and materials permit, inhabitants add a workshop and a storehouse on separate sites. Each project consumes the inventory exactly once. No prefab city and no player command is required.

## Isolation and compatibility

- Keep the existing solo `src/v3/sim.js` and original V1 files intact.
- New world implementation in `src/v3/society.js` with independent save key `godseed-v3-society-v1`; **never reuse** the incompatible solo V3 `godseed-v3-prototype-v1` key.
- The app's `?mode=society` is opt-in. Existing solo V3 remains the default and can be restored without mutation. No implicit import/conversion is attempted.
- No unrelated agent-owned PR branches, `main`, signing configuration, or history are changed.

## Deterministic design contracts

| Domain | State / rules | Evidence / failure control |
| --- | --- | --- |
| World | 20×20 seeded finite trees, 4 reusable berry bushes, 3 fixed *candidate* sites | Site positions must not overlap trees or one another; no building without accumulated material |
| Inventory | `wood = harvested - craftedWood - spentWood`, `food = gathered - eaten` | Validate before persistence; no negative balances |
| Crafting | Stone axe: 2 harvested wood → 1 shared tool, at most once | Event includes crafter, recipe and resource cost |
| Building | Hut 4 wood, workshop 6 wood, storehouse 4 wood; crafting prerequisite | Build at reachable, distinct location; event names worker and cost |
| Individual | Stable ID, role/trait, hunger, health, energy, skill/contribution, goal | Autonomous bounded priority rules; no owner clicks |
| Society | At most 3 villagers, paired trust scores, proximity conversations | Symmetric, bounded persisted relationship state |
| Leadership | Each resident votes based on observed work contribution, skills and trust | Election happens only after social threshold; deterministic ties; event retains ballots |
| Saving | Separate schema/version and key, strict finite bounds, deep-copy snapshots | Reject malformed resources and leader IDs; no silent wipe of old saves |
| Rendering | Read-only renderer receives snapshots | Structures and added citizens visible in WebGL + Canvas fallback |
| Performance | Max 3 citizens, bounded events, zero network | No claim of scalable kingdoms or physical Android certification |

## Acceptance criteria and commands

```sh
node --check src/v3/society.js
node --test tests/v3_society.test.js tests/v3_sim.test.js
python build_v3.py
git diff --exit-code -- GODSEED-V3-Play.html
python tests/v3_browser_acceptance.py
```

Test against multiple seeds with no player input: natural tool crafting, shelter then workshop/storehouse, no resource creation, bilateral relationship formation, fair deterministic ballots, save/restore equivalence, tamper rejection, strict key isolation. Confirm browser launch in `?mode=society` and legacy `?mode=solo`. Physical Android RAM/FPS/heat and APK signing are separate release gates.

## Scope and known missing systems

This slice is **not** fully emergent multi-settlement civilization, families, births, long-term personality learning, trade networks, dynamic political legitimacy, wars, or moving across streamed chunks. The first settlement is deliberately bounded so that resource ownership, crafting, social state and leadership can be tested before scaling.

## Dependency graph / follow-up

`seeded trees → harvested wood → crafted axe → shelter → migrant arrival → interactions → election`  
`shelter + wood + worker → workshop → storehouse`  
`simulation state → immutable snapshot → WebGL/Canvas`  
`simulation state → strict serialization → isolated V3 society save`

Follow-ups after proof: spatial pathfinding around obstacles; actual building placement planning and door collisions; task delegation by leader; richer competing personal goals and learning; families and generations; multiple settlements and inter-settlement travel; chunk/offscreen simulation; 2–3 GB Android hardware acceptance.
