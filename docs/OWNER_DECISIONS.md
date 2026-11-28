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

## Follow-up owner decisions — delegated design

The owner requests biological-need options before starting the game and delegates the population limit, permanent passive classification and development platform. The numbered "10." in the follow-up is interpreted as the next question number, not a maximum population of ten; the owner may correct this interpretation.

- Q8: provide a pregame simulation settings screen for biological needs. Proposed options: hunger, thirst, sleep, fatigue, hygiene and mental-health simulation. Illness, localized injuries, age development and death retain previously approved core mechanics. Present clear explanations and sensible defaults. No requirement to expose a new stamina/mana resource. Whether optional settings apply to the player alone or the entire simulated world remains a follow-up question; do not implement until resolved. Store the chosen settings with the world/character configuration as appropriate, not in disposable cache.
- Population (delegated initial engineering choice): start with the 12 documented NPC reference profiles after they pass activation checks. Use a configurable global living-NPC creation cap of 128 and a per-region generation budget of 32 for the first prototype. These are provisional engineering limits, not canon population figures or measured performance limits. Count living NPC identities, including offscreen living NPCs, separately from the player and deceased history. Reserve capacity for scheduled births or arrivals before committing them; creation disable and global/region generation checks apply to new admissions. Existing NPC travel and activity are not blocked by the generation budget; never delete established actors or force deaths to make room. Defer new creation at the limit; protect accepted birth commitments from later settings changes. Existing reference executor has a separate 256-actor implementation ceiling and cannot yet dynamically add actors. Benchmark and revise before larger-world release.
- Permanent passives (delegated): allow both natural trained traits and permanent modifiers of the actor's own acquired core ability. Natural traits remain within natural attribute limits; superhuman modifiers remain bound to the one existing core ability. Passive unlocks are rare, evidence-based, nonrepeatable for the same milestone, and cannot grant an unrelated second core ability. No numeric chance or guaranteed reward for harmful overtraining. Exact balance needs tests.
- Platform (delegated): choose a platform-neutral JavaScript/TypeScript simulation core, Node.js development prototype first, followed by native React Native/Expo Android UI with SQLite adapter. No HTML/WebView game medium. Verify SDK compatibility, actual device performance and native storage behavior before finalizing release dependencies; use Kotlin as fallback only if evidence warrants a change. No paid services assumed. Owner-only Android force-stop testing remains mandatory.

The remaining questionnaire is limited to at most ten high-impact questions per owner request. Gameplay coding remains paused for the documentation-first gate; delegated decisions are not implemented in this update.

## Final questionnaire — partial owner answers 1–4

1. Playable starting age: inclusive 5–18 years. This limits character creation, not subsequent aging or the age of NPCs.
2. First playthrough begins before the cosmic phenomenon, with the timing dependent on selected starting age. For a character starting at age 5, play begins before the phenomenon; at age 17 the phenomenon begins. Treat this as the first-character world timeline, not a phenomenon that repeats at each successor's 17th birthday. Exact starting-date/birthday alignment for intermediate ages and the treatment of an initial age-18 start remain unresolved. Do not regenerate or move a previously committed cosmic event when a successor is created.
3. Before starting the game, the player selects the intended ability. Selection does not grant usable power. The cosmic phenomenon is a prerequisite for unlocking it. After the phenomenon, the character may be lucky and acquire the ability at age 18, or acquire a glowing meteorite by chance discovery, other acquisition, or theft within the fictional game. No guaranteed age-18 awakening, automatic possession of a meteorite, or second core ability. Whether a meteorite always unlocks the preselected ability or can confer its own type instead, and the exact awakening probability/eligibility, remain open. Preserve existing type-specific meteorite and one-core-ability rules pending reconciliation.
4. Separate pregame biological-need settings for player and NPC simulation (option C). Preserve mandatory injury, aging and death rules, and previously approved optional-needs direction. Exact settings/defaults remain implementation design; no new stamina/mana bar.
5. Character background: answer not supplied. Questions 6–10 also remain unanswered; no defaults inferred.

Documentation-only update. No runtime code or actual save changed. Existing universe identity and successor continuity remain authoritative. Resume the remaining questionnaire at question 5.

## Final questionnaire — owner answers 5–10

The owner supplied the remaining answers in the same questionnaire. The previous partial-answer section is retained as history; its statement that answers 5–10 were missing is superseded here.

5. Character background: all three methods available (random generation, player-selected background, or selected background with randomized details). Each method must produce coherent age-appropriate family, residence, financial and personal histories. No guaranteed wealth, employment, or power merely because a background is selected.
6. Difficulty: natural world difficulty independent of player strength (option C). Real local conditions, threats and opportunities determine challenge. Do not secretly scale enemies, rewards, events or NPC capabilities to player level. Natural change from actual world events is allowed.
7. Dialogue consequences: option B (no hidden relationship consequences of the kind described in the question); the owner also says some things are decided beforehand. Preserve preauthored response and consequence rules, rather than arbitrary generated relationship changes. The exact player-facing representation of those consequences (numeric delta versus qualitative preview, and which consequences are predetermined) is not specified. Do not lock numerical presentation or guarantee an NPC response until clarified. Maintain existing knowledge boundaries and contextual response selection.
8. Narrative perspective: owner requests examples before selecting. First-person, second-person, third-person and selectable perspective remain alternatives, not approved options. See NARRATIVE_VARIATION.md for illustrative examples.
9. Ability catalog: develop the complete 10,000 abilities and associated trees in verified batches alongside gameplay (option B). No requirement to finish every record before the first prototype. Each batch must pass catalog validation and semantic review. Final count requirement remains 10,000 distinct core abilities, not variants or levels.
10. Distant NPC simulation: reduced detail while retaining history (option B). Interpret the owner's "for stuff in relevant just the result save" as saving outcome summaries for irrelevant/routine offscreen activity. Preserve persistent identity, actual elapsed time, commitments, acquired information, significant events, material changes, provenance, causal dependencies and relevant interaction history. Do not erase memories or skip consequential actions. A routine summary must represent actual resolved effects, not fabricate progress. Exact detail thresholds are delegated implementation design, pending verification; if the intended meaning of "in relevant" differs, the owner may correct it.

### Remaining gate

Narrative perspective awaits the requested comparison; the exact age-18 initial-world alignment, preselected ability versus meteorite-type acquisition, and dialogue consequence disclosure details remain open. No new runtime implementation or tests were performed. Preserve the documentation-first requirement and no automated forced-process-termination restriction.

## Final clarifications — owner answers 2026-11-27

The four remaining questionnaire clarifications are now resolved in direction. This section supersedes the earlier unresolved wording.

1. Narrative viewpoint: second person ("you"), including novel-style gameplay narration. Do not invent the player's unselected intentions or private thoughts. Prepared choices remain the only action input.
2. Initial age-18 world chronology: delegated to assistant. Use the initial character's 17th birthday as the first universe's cosmic-phenomenon date. At an age-18 start it is already established world history, approximately one year earlier. For younger starts the phenomenon is future history until its actual date; an age-17 start can begin at that event boundary. Generate coherent prehistory rather than replaying an already occurred phenomenon. Treat the age-18 awakening chance as a once-only milestone; if the selected opening date is the 18th birthday, resolve that milestone once at entry, otherwise account for it in verified prehistory. Exact probabilities and calendar implementation remain engineering work. Never guarantee awakening, reset the seed, move the phenomenon for successors, or reroll a resolved milestone merely because the player reopens character creation or technically recovers a save. Ordinary confirmed world rewind follows the approved save rules and external Divine Judgement tracking.
3. Meteorites: owner confirms that an unawakened character can acquire a core ability different from the intended preselected ability through a glowing meteorite. Meteorite type determines its own actual power; the preselected ability is the candidate for natural awakening, not an already owned power. Finding, acquiring or stealing a meteorite is not by itself the successful unlock; apply the eventual defined acquisition conditions. Once a core ability is acquired, the one-core-ability limit applies: no second independent power or automatic replacement is authorized. Preserve learned progression and actual acquisition history. Hidden conditions and acquisition eligibility remain implementation work.
4. Dialogue: owner answered Yes to showing exact relationship changes beforehand versus only descriptive consequences. Interpret this as approval to show numeric changes (for example, Trust +5) where the prepared option has a determinable consequence. The example is not an approved balance constant. If a response depends on unresolved circumstances, display an honest conditional/range preview rather than falsely promising a fixed result or exposing private NPC facts. A choice still requires confirmation and actual resolution before changes commit. Distinct reputation scopes, context-sensitive responses and existing knowledge boundaries remain.

Questionnaire closed at the design-direction level. No further owner questionnaire is necessary before preparing the detailed implementation specifications; numeric balance, complete world data, actual calendar, birth/awakening algorithms, storage/rewind architecture, narrative content, ability batches and native platform verification remain outstanding. The existing documentation-first gate remains: prepare and review the necessary design/data before gameplay implementation. No runtime code, game save or tests changed by this record.

## Latest owner directive — autonomous development without routine human oversight (2026-11-27)

Authority: the owner clarified in the project conversation that the agents have full permission to work automatically without the owner acting as overseer. This section supersedes earlier requirements for separate human documentation approval, owner approval of routine design choices, or per-slice implementation/merge permission in this file, AGENT_COORDINATION.md, the autonomous completion directive (#81), existing handoffs, and issue #103 D8. Earlier questionnaire answers and gameplay requirements remain authoritative.

- Routine development is authorized on an ongoing basis within existing access and safety constraints: decide priorities, resolve unspecified technical and gameplay details consistent with established requirements, design/data preparation, implement, test, fix, and integrate reviewed work. Do not wait for the owner to approve each slice, numerical balance decision, or compatible PR. Record delegated design choices and evidence; never represent them as previously explicit owner choices.
- Keep the documentation-first sequence, but replace human signoff with actual independent peer review of the applicable design/data and interfaces. The assigned reviewers may resolve ordinary ambiguities and approve scoped work; use another qualified independent peer if a reviewer is unavailable, coordinating with affected domain owners. No self-approval, fabricated approvals, or bypass of required GitHub checks/protection. Re-review material changes and verify combined behavior before integration. Standing owner authorization covers ordinary compatible merges meeting these gates.
- D8 human-signoff blocker is removed; D1–D7 technical dependencies and independent peer acceptance remain. Prioritize a working integrated M1-A daily-life slice, then expand; do not wait for the complete ability catalog or unrelated optional features. Document agreed contracts, close reviewed blockers, implement the smallest coherent slice, run real tests, and proceed with other independent work when a technical blocker remains. Avoid repeated isolated QA solely to accumulate activity.
- Preserve explicit game requirements, other agents' work, existing saves and seed, privacy, budget and safety restrictions, including no forced process termination. Escalate only when an action exceeds available permissions, requires material spending/destructive or irreversible action, or genuinely cannot be resolved without changing an explicit owner requirement. Physical device tests needing the owner's actual Galaxy A54 remain a separate release-verification limitation, not a blocker to portable core development. No continuous background execution or new tool permissions are implied; each agent executes within its available session and tools.

This directive is a governance change, not a claim that draft designs are technically approved, gameplay is implemented, tests have passed, or any PR is merged.
