# GODSEED — 10,000-ability catalog and skill-tree requirements

Status: owner-requested deliverable (Q12, Q13, Q20, Q26), specification only. 10,000 actual ability records, trees and hidden conditions are NOT yet generated or verified. Existing original-IP, one-core-ability, technique levels, mastery and acquisition rules remain authoritative. No final rarity or balance constants are chosen here.

## Catalog definition

Create exactly 10,000 distinct original core abilities with stable IDs AB-00001 through AB-10000. Do not count different levels, techniques, cosmetic variations, synonyms or the same mechanism with different names as different core abilities. Each ability needs an independent mechanical identity and defined limits. Rare shared core abilities may manifest differently by individual, without counting manifestations as new core abilities. Both owner-approved acquisition paths (cosmic awakening and type-specific glowing meteorite) remain; assignment probabilities and acquisition eligibility must be defined, including the notable age-18 awakening milestone.

Each record contains: stable ID, original name, mechanical concept, category tags, activation requirements, effects and targets, range/duration/phase rules, limitations/counterplay, compatibility with attributes and anatomy, environmental interactions, acquisition eligibility, rarity policy, manifestation parameters, skill-tree reference, hidden unlock-condition references, known/unknown disclosure policy, balance review and validation status. No stamina or mana meter is introduced. No automatic universal power at age 18.

## Skill trees

Every ability has its own directed acyclic skill graph with a root and reachable branches. Nodes represent techniques or permanent modifiers, not extra core abilities. Each node includes stable node ID, ability ID, technique name, numbered selectable level, mastery prerequisites, prerequisite node IDs, hidden condition IDs, effect/phase specification, cost/risks/constraints, counters, progression evidence and visibility rule. Keep seven mastery tiers separate from numbered levels and character level. Preserve learned lower levels and prevent display of undiscovered nodes/levels. Individual discovery and rare NPC innovations must follow valid prerequisites and actual world evidence, not automatic grants. New combinations should be compositions of valid learned techniques, with compatibility checks.

Hidden condition records: stable ID, private typed predicates over authoritative state/events, required counters/thresholds, temporal scope, eligibility and exclusions, trigger/once-only behavior, permitted player hint, reveal policy. Examples of predicate classes (not fixed content): repeated appropriate practice, relevant demonstrated mastery, environmental exposure, specific observed circumstances, combinations of milestones, recovery from relevant training. No secret condition is exposed to actor/narrative projections unless validly discovered. No arbitrary unlock based on prose or reload farming.

Q26: rare permanently active passive unlock from training is approved in direction. Classification and allowed superhuman scope need confirmation; proposed permanent trained passive trait is separate from an acquired core ability and does not violate one-ability limit. No actual permanent passive rate or formula selected.

## Production and QA plan

1. Establish original mechanical taxonomy and effect primitives; design distinct effect combinations only where gameplay genuinely differs. Agree on meaningful distinctions, skill-tree size/depth and rarity policy. Avoid copying existing IP.
2. Produce a small reviewed pilot catalog (proposed 100 records) with complete trees and private conditions; test interactions, hidden visibility and progression before scaling.
3. Expand in versioned batches with deterministic IDs and duplicate-mechanism audits; each ability must pass structural and semantic review, not merely a name generator. Keep draft and approved status separate.
4. Validate exact 10,000 unique core IDs, unique names/mechanism signatures, every tree reference, reachability/no cycles, cross-ability isolation, all hidden-condition references, valid effect primitives, caps, counterplay, progression and reveal behavior. Exercise sample ability interactions and automated property checks. Catalog completion requires review and tests, not just record count.

Storage proposal: immutable definitions partitioned by ID range/category, indexed by core ability ID and loaded on demand. Per-actor state stores at most one core ID, personal manifestation, learned nodes, progression evidence and discovered condition IDs. Do not duplicate the 10,000 trees into every actor save. Hidden conditions are private simulation data, not ordinary UI text; an offline client cannot guarantee secrecy from someone inspecting its own files. Persist catalog version and stable IDs; migrations must not reroll existing actors. No runtime catalog generation on every game start. No ability data or tests have been produced in this documentation increment.
