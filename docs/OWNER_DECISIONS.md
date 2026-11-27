# GODSEED — Owner questionnaire decisions, 2026-11-26

Authority: owner answers to questions 1–39 in the project conversation. This record supersedes conflicting earlier proposals in the relevant subject documents. It does not activate systems, select a final platform, change existing save data, or approve unspecified balance values. References to "chapter" below mean novel presentation rather than mandatory story progression. The separate design documents linked below contain engineering proposals, not additional owner approvals.

## Decision register

| Question | Recorded decision |
|---|---|
| 1 | Both natural births/immigration and procedural generation for newly discovered regions, with coherent histories. |
| 2 | All listed modes: NPC-led building and organization formation from needs/resources, conditional opportunities, and major world events. |
| 3 | Combine causally emerging and random world events. |
| 4 | NPC ambitions may change depending on circumstances; not mandatory or constant. |
| 5 | Personality evolves with experience, relationships, trauma and age. |
| 6 | No simulated forgetting, misremembering, misunderstanding or deliberate generation of false beliefs as a normal memory mechanic. Preserve accurate records of acquired information; no omniscience. See memory clarification below. |
| 7 | NPCs may refuse duties, leave jobs, commit crimes or disobey based on their own circumstances and judgment. |
| 8 | Unanswered; exact biological need list remains open. Previously approved injury/health rules remain. |
| 9 | Natural recovery, medical treatment and applicable superhuman healing. |
| 10 | Aging, possible physical decline, retirement and natural death. Preserve the existing age-40 plateau; do not impose an automatic universal decline at 40. |
| 11 (additional population instruction) | NPC creation can be stopped or disabled; creation must respect a finite population limit and occur only below that limit. Exact count, scope, and treatment of natural births remain open. |
| 11 (combat) | Full contextual combat: attributes, distance, timing, anatomy, environment, technique, reflexes, experience. |
| 12 | Same ability may manifest differently by individual; shared ability types are rare. |
| 13 | NPCs may independently discover new techniques/combinations, rarely. |
| 14 | Delegated to assistant: experience improves judgment, reaction selection and technique efficiency through relevant practice, independently of general level; no automatic success or time reversal. Numeric formulas pending. |
| 15 | Destructible structures can be repaired. Mark damage; settlements spend resources to repair, or a character with a relevant ability may perform repair. No guaranteed irreversible destruction. |
| 16 | Combine reference prices/wages with dynamic supply/demand, scarcity, production, transportation, competition and business economics. Implement incrementally; no arbitrary infinite funds. |
| 17 | NPC job search, negotiation, resignation, promotion and founding businesses are permitted but rare as changes/events, not forced each review. Frequency pending. |
| 18 | Buying, renting, selling, inheritance and loss of property. |
| 19 | Keep banks simple; preserve approved code-protected storage. No complex loans, investments, interest or insurance required for initial scope. |
| 20 | Multidimensional relationships based on individual history and context. Create interaction row map and prohibit repetitive interaction/narration patterns. Create 10,000 abilities, respective skill trees and hidden conditions (full catalog deliverable pending). |
| 21 | NPCs may form relationships, marry, have children, separate and establish households. |
| 22 | Distinct reputation bars for individual, community, organization, region and public/media scope, with separate balanced limits and evidence-dependent changes. |
| 23 | Different fictional crime types have distinct evidence and enforcement paths. Some require investigation; others may be handled differently based on case. Show player observable warning/evidence/flag indicators, never inaccessible investigative details. |
| 24 | Early-age player starts follow school and high school; university if eligible/possible, then employment or other available paths. Age 18 is a notable awakening milestone; awakened characters may attend a hero university. No automatic universal awakening or admission is inferred. |
| 25 | Qualifications may be required for some roles, with other legitimate approaches possible. |
| 26 | Overtraining risks diminishing returns, fatigue, injuries and lasting consequences; a small chance of permanently active passive ability unlock. Preserve one core ability; passive classification and unlock rules need clarification. |
| 27 | Rifts arise from a combination of random, world-condition and unknown causes. |
| 28 | Lower/middle rifts need not have full civilizations; higher-energy/higher-level rifts may contain complex ecosystems/civilizations. Mark advanced scope COMING SOON. |
| 29 | Creatures can grow, reproduce, migrate and develop independently while rifts remain open. |
| 30 | Stabilized rifts may become permanent, very rarely and later in the game. |
| 31 | Prepared contextual choices only; no free-text/free-style actions. Narrative information and documentation must be developed before implementation continues. |
| 32 | Long novel-style paragraphs when appropriate; distinct chapter/scene content and varied experiences. Routine start/end of day may repeat; abundant diverse context-sensitive activities in between. Chapters organize narrative, not forced paths. |
| 33 | No fixed predetermined conversation sequence or identical repeated output. Conversation outcomes and phrasing depend on NPC profile, alignment, stats and context. Prepare and document dialogue ingredients and resolution beforehand. |
| 34 | Prepare news content/rules before game start; date, game stage, relevance, local NPCs, actual heroes/villains, events and geography determine selection. Distant-world reports can suggest scale beyond built locations without representing those places as playable. Exact map scope and news coverage pending. |
| 35 | Ordinary confirmed loading restores the entire world to its saved state, within the same original world seed; the god watches reload behavior. Supersedes prior no-intentional-rollback recommendation. |
| 36 | Reload-abuse tracking persists outside rewindable state and resets after 15 actions without regression. |
| 37 | Delegated to assistant: use the stuck detection design below; offer optional reset after 18 qualifying rounds. |
| 38 | First playable prototype must support working systems around the player, diverse available actions, and evaluation of narrative quality and experience flow. No fixed choice of A/B/C; scope is a functional local slice. |
| 39 | Owner requests platform options and reasons, not a final platform selection. |
| 40 | No question or answer supplied; no decision inferred. |

## Clarifications and delegated design

### Population
Proposed capacity contract: configure a finite limit on generated/active population, reserve capacity atomically before generation, enforce the disable switch at the creation boundary, and preserve every established identity. No forced deletion, despawn, or killing to free space. Distinguish historical/deceased records from live population. Owner must decide exact cap, whether it is regional/global, and how births/immigration behave at the cap before final implementation. Disable stops creation, not existing NPC life.

### Memory and news
Q6 overrides earlier proposals allowing memory corruption, forgetting and automatically false beliefs. Accurate memory of an observed report does not make its content an authoritative fact: rumor/misinformation may exist as attributed content per Q34, without changing actual events or inventing a memory. Unknown and unverified claims remain unknown; no automatic promotion to fact. Dialogue uses what the actor actually knows. No AI mind-reading or hidden-truth access.

### Experience and passive unlock
Q14 delegated: relevant successfully resolved experience improves judgment and efficiency within skill/condition limits; different task types build distinct proficiency. Failed attempts may teach observed information, not grant arbitrary skill or resource bonuses. Overtraining passive unlock must be rare, condition-based and compatible with the one-core-ability rule. Proposed distinction: a permanent trained passive trait is not a second superhuman core ability; whether a passive can itself be superhuman and its permitted scope remain to be decided. Preserve no new stamina/mana meter. Exact rates are not approved.

### Saves, judgement and stuck detection
Owner Q35 resolves ordinary load scope: three save slots, erase one explicitly before creating a fourth, two confirmations, entire simulation restored to chosen snapshot, including date, NPCs, relationships, economy, objects, RNG and activities. One seed/universe. Technical crash recovery remains separate from intentional Load. Preserve non-rewindable god ledger, slot-management metadata and selected authoritative timeline pointer outside the rewindable simulation. Archived future records may be retained for diagnostics but must not affect restored characters or duplicate assets. Existing journal API currently cannot implement this policy; design separate branch/epoch identity and save-slot snapshot contracts before changing it.

Existing warning at 8 qualifying repetitions of the same reload and death after 20 more (28 total working interpretation) remain. Q36: reset after 15 actions without regression. Recommended technical definition (delegated safeguards, not new balance rule): count successfully committed meaningful forward gameplay actions after the last regression, exclude UI navigation, reading, canceled choices, retries, technical recovery and deliberate no-progress spam; a regression interrupts this streak. Track stable save/encounter identity, not mutable slot number. Judgement death should not be erasable by reloading the penalized character; exact enforcement after death and change of character requires review. No new penalty for routine recovery. No forced process termination.

Q37 delegated: count a committed gameplay round only if the actor is at the same blocked location/encounter and a legitimate attempted action cannot make meaningful progress because of unresolved obstruction, invalid navigation, or lack of a viable path. Reset the streak when progress occurs, the obstruction clears, or encounter changes. Exclude voluntary sleep, reading, study, work, waiting, menus and technical retries. After 18 qualifying rounds offer optional reset to the previous save point; no automatic rewind. Proposed exemption from abuse tracking for a verified stuck-recovery reset, to avoid punishing a genuine blocker. Log cause and checkpoint identity. Exact meaning of repeated but productive actions is covered by variation rules, not stuck detection.

## Documentation and implementation gate

- [Narrative variation and interaction row map](NARRATIVE_VARIATION.md)
- [Ability catalog requirements and skill tree architecture](ABILITY_CATALOG.md)
- [Prototype scope and platform alternatives](PROTOTYPE_PLATFORM.md)

Do not resume gameplay coding until the owner has reviewed the documentation and the remaining blocking design choices are resolved or explicitly delegated. Existing reference work, data and history are preserved. No implementation or runtime testing is claimed by this decision record.
