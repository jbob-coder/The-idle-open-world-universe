# First playable initialization — review packet (cycle 008)

Status: independent QA coordination proposal. NOT owner approval, reviewed domain data or production implementation. Scope reserved in #87 comment 7231219418. Related #101 population admission, #84 GS-SLICE-01, #87 opening/travel, #77–80 domain reviews. Do not treat this document as authorization to overwrite peer-owned files.

## Pinned evidence
- Main f75bdd14827bd6ea8555f6ca428132e91cff97c3; #81 activation remains open, #77–80 draft.
- #79 NPC draft b51c461d05ee2a0b4b3886147f4120f1a8d2e270, data/npcs/b2_draft_profiles.json blob 602b7e31e8a0e40b7234c4dcdfeb36c6536401cd, tools/check_npc_drafts.mjs blob 0f92e2ad4c35f14d3537328a577035114d4adc48.
- #80 narrative 04ec522a2ee541a843234f3ea1fa0c01216c42b2, data/narrative/local_interaction_draft.json blob 75de31ea580fafaaf5b44f44f3a60899082d66df.
- #77 97ccbce13999416c4eb757619947ef55bf31abe5; #78 a3caeaeac33691f4df6c2b67ac80129119609062.
- WORLD.md 31df1d9d01f2dba2acf9fa3d344f368c22bf6070; POPULATION_AND_EMPLOYMENT.md a679c453ab66cc7d98ab776bac3bfc3ef125d607; LOCAL_LIFE.md dd53a8762380708d9e8a209249bb1f90a1f3a101.
- Exact fetched sources, JS isolate: 14/14 independent cross-source assertions, original NPC draft validator 27/27 (1 positive, 26 rejection cases), ESM wrappers/filesystem reads replaced by explicit input; connector blob identities supplied, not independent native SHA calculation. No Node CLI, actual initialization, SQLite or Android executed. These checks confirm correct draft blocking, not readiness.

## What prevents initialization?
All twelve NPCs are inactive adults (reference ages 19–46). No confirmed family/caregiver record, active initial location, actual calendar birth date or validated access. All 12 have 23 blocking unknowns: 276 field instances. A one-person accounting household is not proof of living alone; an occupation is not a credential, funded job or actual service. The existing draft validator correctly prohibits activating the pack. Do not turn unknowns into empty arrays or zero.

| Review group | Exact draft fields | Unknown instances | Proposed responsible peers |
|---|---|---:|---|
| Identity and definition | `identity.birth_date`, `identity.origin`, `identity.world_id`, `definitions` | 48 | 01 + 02, 03 definition references |
| Biography and personality | `biography.events`, `biography.education`, `personality.traits` | 36 | 02 |
| Biology | `biology.condition`, `biology.needs` | 24 | 02; 03 damage/condition interface |
| Capabilities | `capabilities.attributes`, `capabilities.skills`, `capabilities.ability` | 36 | 02 + 03 |
| Location and access | `spatial.current`, `spatial.access` | 24 | 01 + 02 |
| Family and relationships | `social.family`, `social.relationships` | 24 | 02 |
| Economic state | `economic.accounts`, `economic.assets`, `economic.agreement` | 36 | 02 + 01 |
| Knowledge and goals | `knowledge.packet`, `goals.active` | 24 | 02 |
| Execution and causal history | `execution.schedule_rng`, `history.receipts` | 24 | 01 + 02 + 03 |

Total: 276. Grouping is a coordination choice, not reassignment. A field may require multiple reviewed linked domain records; resolving a label or count is insufficient. Preserve tagged unknown/absent/not-applicable distinctions and provenance.

## Player-facing dependency inventory
All 20 narrative rows inactive. Ten named-target rows reference eight distinct adult NPCs; all named fixed-location targets match their reference workplace, not actual presence. The remaining four roster members still require validation for the first playable slice, not optional deletion.

| Row | Actor reference | Location | Family |
|---|---|---|---|
| I-003 | NPC-0001 | LOC-0003 | neighbor |
| I-004 | NPC-0001 | LOC-0003 | neighbor |
| I-005 | NPC-0002 | LOC-0008 | shop |
| I-007 | NPC-0008 | LOC-0011 | school |
| I-008 | NPC-0008 | LOC-0011 | school |
| I-009 | NPC-0006 | LOC-0010 | employment |
| I-011 | NPC-0004 | LOC-0009 | health |
| I-014 | NPC-0011 | LOC-0013 | community |
| I-016 | NPC-0007 | LOC-0010 | repair |
| I-020 | NPC-0012 | contextual | social |

I-001 preparation is B2-specific; I-019 rest binds an authorized contextual location. I-002 is the sole explicit travel row, landing to lobby. Neither graph connectivity nor a row's existence grants access. No named caregiver interaction or confirmed child care arrangement is provided; NPC-0001 caretaker is a building occupation, not a child's guardian. Do not relabel this NPC. NPC-0008 teacher and NPC-0009 administrator are reference roles, not actual staff presence or automatic admission.

## Opening scenarios for peer review (synthetic design, no names/dates/funds created)

### O-05: five-year-old player
Propose a fixture with reviewed age-appropriate origin, actual care arrangement and authorized residence. An existing adult may become a caregiver only if approved linked histories, relationship, consent/authority and housing support it; alternatively introduce a new validated caregiver subject to 01/02 admission and owner data review. No selection of an actual relative in this packet. School pathway requires age eligibility, actual staffing/qualification, permitted travel and school admission, not just a location. Initial household resources, access, independent child-appropriate field experience and mandatory biology must be coherent. Cosmic event remains future, first character's 17th anniversary; no acquired phenomenon-derived power.

Candidate scenario: home preparation, ask caregiver, authorized departure, possible lesson or legitimate alternative/stay-home decision, return and rest. These are test intents, not predetermined story or forced schooling mechanics beyond reviewed rules. Required actual evidence: one valid care relationship, household/tenure, age/schedule and school eligibility, supplies and ownership, caregiver and staff independent actions. I-007/008 teacher reference is only a potential consumer of the reviewed data. Add a contextual care interaction through 04 after review. No adult employment or impossible prehistory.

### O-18: eighteen-year-old player
Propose a separate fixture with reviewed independent or supported residence and age-appropriate history, no guaranteed employment/wealth or arbitrary family. Exact birth/opening date supplied by 01/02 after review; cosmic event is one year earlier if opening is 18th birthday. Require explicit historical cosmic record and effects; resolve natural milestone once at birthday opening or preserve actual prior resolution. Selected intended ability stays locked unless actual eligible acquisition succeeded. Do not fabricate outcome probability or apply later-age policy to older NPCs without 03 review.

Candidate scenario: prepare at authorized residence, travel via known legs, request vacancy at workshop or purchase supplies, accept/decline actual available work/learning, return or choose another route. I-009/I-010 reference employment only when actual vacancy/agreement/eligibility/funding exists; I-005/I-006 shop only when actual staff/stock/funds/access exist. Refusal is a valid outcome; no automatic salary or job. Alternative player paths and independent offscreen NPC actions required.

### Shared initialization sequence (proposed, not API)
```text
Character draft (reversible, no elapsed time or world mutation)
  -> reviewed calendar + immutable universe identity
  -> coherent biography/roles + domain definition versions
  -> validated household/care/access + economic opening records
  -> validated conditions, capabilities and individual knowledge
  -> atomic population registration / activity scheduling
  -> actual initial milestone/prehistory reconciliation
  -> committed scoped actor view + prepared choices
```
01 owns atomic publication; 02 owns actor and society data; 03 owns progression/power eligibility; 04 owns creation view and initial interactions. Order is illustrative; actual milestone and history staging must be inside initialization transaction, not a second public mutation. No player-facing choice until the complete required snapshot commits. Failed initialization cannot leave partial actor, cash, time, RNG, knowledge, reservations or narrative. Technical retry reconstructs same world/identity, no new draw.

## Go/no-go checklist for actual first-slice implementation
1. Owner reviews detailed opening data and specifications under existing documentation gate. This packet requests review, does not establish it. No further broad questionnaire is needed; unresolved engineering details may be delegated under existing rules.
2. 01/02/03 agree calendar version (#82), prehistory and activation-blocking definition records; 03 resolves older-at-phenomenon policy before affected actor activation.
3. 02 supplies complete validated 12-reference-profile pack with coherent actor histories, household/financial/role/condition/access/knowledge/goals. Any added caregiver is separately reviewed; no placeholder actor, no inferred relative. Review all needed age-5 and age-18 fixture data. The twelve-profile requirement is not reduced by this packet.
4. 01/02 agree atomic registration, capacity reservations, identity uniqueness and zero partial side effects, including actual scheduler/knowledge/domain references (#101 synthetic evidence only).
5. 04 with 01/02 supplies reviewed context-bound travel, home and care/service choices, source-bound eligibility, actual receipt/preview scope (#97/#99); no guaranteed job/lesson/availability.
6. Affected peers review and record precise accepted contract versions; retain four-peer ring and separate integration verification. Only then implement real local life loop on approved branches.
7. Acceptance after implementation: actual age-5 and age-18 creation in isolated worlds, no duplicate initial endowments/milestones, at least two plausible local paths across multiple days, independent NPC behavior and actual economic/learning effects, authorized views, interruption, normal recovery and entire-world rewind. No claims of passing these until executed; native Android later.

**Current result: NO-GO for production activation.** All 276 unresolved instances remain. The test oracle and draft structural validator prove that blocking is working, not that the game is playable. The most valuable next action is affected peer completion of actual initialization data and interface reconciliation, not adding more standalone QA fixtures. Keep all existing review PRs and owner requirements. No gameplay or real saves altered.
