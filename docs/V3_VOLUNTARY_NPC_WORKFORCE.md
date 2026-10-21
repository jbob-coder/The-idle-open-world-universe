# GODSEED V3 — Voluntary NPC construction collaboration

## Direction

GODSEED is a chapterless living-world simulation. The player supplies no ordered construction milestones. A character decides whether to assist another resident on an actual unfinished work order; distance, relationship, skills, needs, and finite personal supplies influence the decision. The engine only resolves legal physical consequences. No capital, king, town, or objective is spawned by this feature.

## Implemented vertical slice

- `src/v3/projects.js` exports `chooseVoluntaryWork`. It is actor-neutral: from existing active projects, ties, preferences, local distance and urgent needs, it selects an **offer**, not an order. Candidates are bounded to twelve Manhattan tiles; healthy, nourished, equipped workers may decline if trust or utility is insufficient.
- When an interested, locally connected NPC has no timber, the offer may include a materials-needed flag: Taren can forage actual wood first rather than receiving free supplies. The plan is re-evaluated each tick, so hunger or distance may interrupt it; a distant supply search may cause the NPC to abandon the opportunity. No extra save fields or mandatory orders are introduced.
- `src/v3/expedition.js` lets Taren optionally help finish Mira's real open home project. The traveler walks to the site, pays one timber from **his own** carried inventory per contribution and consumes energy. Mira remains recorded as the home's original owner. Contributor IDs and material costs remain in the original project ledger. Legacy scripted-route saves are not opted in.
- Save validation attributes mixed timber spending to **the actual contributing worker** rather than blindly charging all home/road wood to Mira. Existing world save schema 6 and historical buildings remain unchanged.
- `src/v3/agency.js` admits cooperative work events to the bounded personal memory log. When the traveler completes a house, the owner receives a separate pinned `settler_home_completed` memory without being credited for labor she did not perform. The offline WebGL HTML is regenerated to match source.
- `tests/v3_voluntary_work.test.js` covers two contributors building a home from real inventories, no remote or unfunded volunteering, no compelled work when hungry/exhausted, and choices changing as relationships change.

## Reality and limits

This is the first live two-person cooperation path, **not** general settlement growth. Taren and Mira are the only wilderness pair; relationship formation still requires physical proximity and their opportunities to collaborate may be rare. There is no universal resident roster, shared village storage, cooperative hauling, project abandonment, employment market, sovereign leadership, or full civilization yet. No forced kingdom-creation sequence is added.

A valid acceptance claim requires CI at the exact code SHA and an observed end-to-end joint build scenario; passing isolated project-selection tests alone must not be reported as proof of a spontaneous joint build during normal world play. The older homeland modes remain intact.

## Compatibility and coordination

- Base is draft PR #70 (which itself is stacked on #68, #67, and earlier experimental branches). No merge into `main`. Workflow-migration PR #69 remains a separate sibling.
- No governance task ownership is claimed: the formal `CIV-002` and `SIM-003` registry entries are unready or depend on work not yet verified; no tasks.json edits.
- Do not overwrite another bot's branches or rewrite legacy v1 saves. The V3 world save format remains version 6.
- Run `node --test tests/*.test.js`, `python build_v3.py`, native evaluation and browser CI. Do not treat Android emulator tests as physical phone evidence.

## Next implementation priorities

1. Increase *real* opportunities for voluntary collaboration: NPCs need persistent relationships before they diverge into distant regions, or a realistic local population.
2. Extract home/road work from hardcoded Mira/Taren lifecycle rules into a generic resident decision loop while retaining backward-compatible state and identity.
3. Add on-site material exchange and storage with strict conservation, then automatic project planning from food/shelter deficits. Only then expand population and emergent settlements.
