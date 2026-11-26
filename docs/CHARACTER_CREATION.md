# GODSEED — Character creation

Design baseline 2026-11-26. See [design index](../README.md) for decision precedence and status. The following source sections are preserved verbatim; later approved decisions override earlier candidate wording.

## New Game and character creation — owner direction (2026-11-26)

Before the story begins, present a loading screen, followed by a main menu. Selecting New Game opens a sequence of character creation panels. The player can choose their name, class, intended hero/villain alignment, desired path, relevant field experience, and narrated backstory. Provide predefined backgrounds and the option to write a custom background.

### Field mastery initialization
- Starting field mastery is chosen independently in a separate stage after background selection. A background does not automatically assign any field mastery; the player may choose relevant previous experience independently.
- Relevant field experience can originate from education, practice, work, or personal history, but is selected separately from the background. Field mastery remains independent of class and active employment.
- Professional development still applies only when the player selects a type of work. Selecting prior experience does not automatically assign an active job.
- Proposed safeguard: validate custom backgrounds against world rules, translate them into a reviewable starting profile, and prevent unsupported grants of attributes, ranks, money, or powers. Exact validation, starting limits and progression formulas remain open.

### Step-by-step design agenda
1. Loading screen: presentation and transition.
2. Main menu: available options and navigation.
3. Identity: name and any additional identity fields.
4. Class selection: meaning of class and available options.
5. Alignment: initial hero/villain choice and its effects.
6. Background and desired path: narrated preset or custom text.
7. Prior experience and field mastery: independently select starting disciplines without class or background locks.
8. Review and start: verify starting profile, then begin the story.

This ordering, review step and back navigation are proposed defaults for discussion, not locked decisions. Define each stage with the owner in sequence. No implementation or engine tests performed.

## Character identity — approved concept 03 (2026-11-26)

**Owner approval:** "Perfect" in response to the narrative sentence-completion interface. This is the approved first stage of New Game character creation. Do not revert to a registration form or questionnaire.

### Presentation and interaction
- Remove all multilingual background fragments from character creation. Keep a simple dark background (#100e15), the GODSEED title in light grey (#e6e4ea), a thin angular violet underline (#b38be7), and restrained amber accents (#d4a05b).
- Center the narrative prompts in an open reading column with generous spacing. Show one identity detail at a time, with a plain underlined text entry, no heavy input boxes or report-like tables.
- First screen: small IDENTITY label, "Your story begins here." followed by "Your name is" and a plain name entry.
- Second screen: display the entered name, followed by "At the beginning of your story, you are", numeric age entry, and "years old."
- Third screen: "Beyond your real name, you may also be known as", plain alias entry, and a No alias option. Alias is optional.
- Show the resulting identity summary: name, age, alias if supplied; "Identity established" and "Next — Class".
- CONTINUE (amber text and right arrow) advances the current stage; Back restores the previous stage and preserves existing entries. A subtle three-segment progress indicator tracks identity steps; active segment amber and wider than others. No narrative background symbols, no heavy card borders.
- Proposed validation retained from prototype: nonblank name, positive whole-number age, optional alias. Exact age bounds, name constraints and world rules still need definition. Do not commit a save or initialize the world merely by navigating between panels.

### Verification criteria (pending implementation)
- [ ] New Game opens the approved identity flow; no report-like form or background character overlay.
- [ ] Name, age and optional alias can be entered and reviewed; Back preserves input.
- [ ] Continue cannot advance invalid required fields; No alias works.
- [ ] The resulting identity data is available to class selection and later background/mastery initialization.
- [ ] Responsive presentation remains consistent with the approved mock-up.

No engine code or game assets changed. No runtime tests performed. At the owner's later direction, proceed from identity to background selection. Class meaning, choices and mechanical effects remain open.


## Character background — life circumstances (2026-11-26)

Owner preferred the rewritten background titles and presentation: describe the character's past circumstances rather than a class, occupation or predetermined future path. This stage follows the three identity prompts (name, age, alias), ahead of independent field mastery selection. Class semantics and whether all characters start with Class: None require clarification; do not lock a class system based on this background panel.

### Presentation
Retain the approved identity panel's clean dark background (#100e15), centered GODSEED title, violet underline and restrained amber accents. No multilingual background overlay, report-style form, or heavy cards. Use expandable rows with each title, narrative description and proposed starting general attribute bonuses. Inspection and selection are distinct; one background can be selected, changed before Continue, and carried into the next stage. Include "Write your own story" with an editable custom narrative; evaluate it under the same balance rules before final character creation.

### Background reference options
- Raised around machinery: From an early age, you were surrounded by tools, equipment and machinery. Understanding how things worked became part of your everyday life. Example bonuses: Intelligence +2, Dexterity +2, Reasoning +2, Concentration +2.
- Growing up in hardship: Your early life was marked by uncertainty and limited resources. You learned to recognize danger, remain composed and adapt to changing circumstances. Example: Awareness +2, Adaptability +1, Willpower +1, Composure +2.
- A stable family life: You grew up in an established community, surrounded by familiar people and everyday responsibilities. Example: Social awareness +2, Negotiation +2, Adaptability +2, Memory +2.
- Surrounded by healthcare: Medical facilities and conversations about human health were familiar parts of your upbringing. Example: Awareness +1, Reasoning +2, Dexterity +2, Empathy +2, Concentration +2.
- A life on the move: Your family moved frequently. You became accustomed to unfamiliar streets, neighborhoods and environments. Example: Agility +2, Awareness +1, Coordination +2, Endurance +2.
- Write your own story: free-text custom background.

### Balance and separation
Use equal weighted general-attribute allocation budgets across backgrounds rather than simply equal raw stat totals. Prototype reference: 10 points per background, with Intelligence, Awareness, Adaptability, Willpower and Agility costing 2 per increase and the other listed attributes costing 1. All five reference allocations sum to exactly 10 weighted points. These numerical costs, bonuses, and classifications are provisional; validate against actual mechanical impact and age/background plausibility before implementation. Do not assign superhuman power, class, profession, alignment, or field mastery automatically from a background. Field mastery gets its own later selection stage and proposed separate allocation. Job specialization remains conditional on choosing work. Custom background evaluation and age-specific eligibility remain to be designed.

Next design stage: field mastery selection. No game code or assets modified; no gameplay tests performed.


## Field mastery — approved independent allocation (2026-11-26)

Owner approved the independent field mastery panel and unrestricted multi-discipline progression and requested that the design be saved.

### Core rules
- This stage follows background selection. Class, background, profession, alignment and superhuman ability do not lock or automatically assign field mastery.
- A shared starting allocation can be distributed across multiple disciplines and their individual specialized attributes. Spending points in one discipline never prevents investment in another. Specializing in a single field is also permitted.
- The starting budget determines initial expertise only. Every field and specialized attribute can be developed later through relevant education, training, work and practical experience. No permanent mastery-tree locks. Developing broad expertise should require more time and effort than concentrating on a single discipline.
- Professional development remains separate and applies only after the player selects a type of work.
- Proposed prototype budget: six starting points, one point per specialized attribute increase, all allocated before Continue. These quantities and starting limits are provisional; do not confuse creation allocation points with earned gameplay experience. No final mastery cap, XP curve, age eligibility, or advancement formula is established.

### Approved panel reference
Clean dark character creation style (#100e15), centered GODSEED title and violet underline, no background text overlay. Heading FIELD MASTERY, narrative prompt "What you have learned.", introductory prose and remaining points display with six-segment bar. Expandable discipline rows display their description, allocated subtotal and specialized attributes. Plus/minus controls allow reversible allocation across all disciplines; minus stops at zero and plus stops at total budget. Reset allocation clears the draft. Continue opens an allocation summary; Back retains the draft and permits edits. The prototype uses amber #d4a05b for points, violet #b38be7 for accents, expanded background #1a1522 and dividers #493751/#34283f.

### Reference disciplines and specialized attributes (candidate taxonomy)
- Science and research: scientific knowledge, research, experimentation, data analysis.
- Engineering and technology: technical knowledge, diagnostics, design, repair, fabrication.
- Medicine and healthcare: anatomy, first aid, diagnosis, treatment, pharmacology.
- Combat and martial arts: unarmed combat, weapon proficiency, defensive techniques, combat tactics.
- Investigation: deduction, evidence analysis, observation, interviewing.
- Business and economics: finance, negotiation, trade, management.
- Technology and computing: programming, networking, cybersecurity, systems analysis.
- Survival and exploration: navigation, tracking, resource management, environmental knowledge.

The eight disciplines and their attributes are prototype examples, not an exhaustive final taxonomy. Review overlapping skill definitions and balance before implementation.

### Acceptance criteria (pending)
- [ ] Allocate points across engineering and any other fields without locks.
- [ ] All points may be concentrated in one discipline, within eventual balance rules.
- [ ] Shared budget cannot be exceeded; no negative allocations; reset and Back preserve correct state.
- [ ] Background/class/profession/alignment do not impose field eligibility restrictions.
- [ ] Starting allocation does not prevent later learning of any discipline; progression is driven by relevant experience.
- [ ] Show resulting field mastery and specialized attributes in character status; use authoritative data.
- [ ] Validate age/background plausibility and actual progression rules once defined without converting them into permanent tree locks.

Documentation only. No game code or assets modified; no engine tests performed. Next character creation design decision: alignment and its implications; class mechanics remain unresolved.


### Approved left-side allocation controls (2026-11-26)

Owner approved the revised interactive field mastery layout and explicitly requested saving it. This supersedes the prior right-side allocation controls and the rejected interpretation of moving bottom navigation to the left.

Inside each expanded discipline, display each specialized attribute as one horizontal row in this order, left to right: minus button, current allocated value, plus button, attribute name. Keep the control cluster on the left, with the attribute label taking the remaining width. Use consistent touch targets and aligned numeric values. Keep Continue centered at the bottom, with Reset allocation and the existing Back behavior unchanged. Label the remaining budget "Available allocation points" to distinguish it from earned gameplay experience.

Preserve unrestricted multi-field allocation, the provisional six-point shared budget, reversible allocations, expandable disciplines, and the summary. Minus cannot reduce an allocation below zero; plus cannot exceed the shared budget. This is the approved interface reference, not an engine implementation.

Pending acceptance check: on mobile, verify that left-side controls are readable and usable in every dropdown, that the budget updates immediately, and that allocations survive opening other disciplines. No game code or assets modified; no engine tests performed.


## Alignment — approved starting circumstances (2026-11-26)

Owner approved the Hero, Villain and Undefined starting paths, with different initial relationships and opportunities for later development.

### Starting paths
- **Hero:** More stable starting circumstances, stronger initial relationships with heroic characters, legitimate opportunities and potential community or mentor support. This does not automatically grant a hero license, rank, or universal trust.
- **Villain:** Stronger initial connections to villain characters and underground networks, with opportunities and access unavailable to an ordinary outsider where justified by the starting relationships. Greater legal and personal risks may accompany those circumstances. Contacts are not a guarantee of cooperation.
- **Undefined:** A mixture of both environments, with shallow acquaintances on both sides, no deep initial relationships or established loyalty, and no automatic privileged access to either network. In particular, knowing a villainous character must not automatically unlock villain-network trading. Such access must be earned later through appropriate relationships, trust, circumstances, and NPC decisions.

### Development and constraints
Initial alignment shapes starting circumstances and social access, not a permanent restriction on future behavior. Keep initial intent distinct from actual public standing and NPC-specific knowledge. NPCs retain independent decisions about trust, cooperation, and trade. Background, class, profession, field mastery, and superhuman attributes remain separate systems. Proposed balancing direction: differentiate starting relationships, resources and opportunities rather than granting unequal raw attribute bonuses solely for alignment. Exact starting locations, contacts, relationship values, resources, access thresholds and progression formulas remain to be designed.

### Panel reference
Use the clean character-creation style already approved: dark background without multilingual overlays, centered narrative prompt, selectable Hero / Villain / Undefined options with short descriptions of starting circumstances, reversible selection and centered Continue. The final revised panel appearance remains to be reviewed if needed.

### Acceptance checks (pending implementation)
- [ ] Each alignment initializes its distinct starting circumstances without granting unjustified ranks or access.
- [ ] Undefined has acquaintances on both sides without deep initial relationships or automatic villain-network trading.
- [ ] Future relationship development can unlock access based on NPC decisions and world state rather than a permanent alignment lock.
- [ ] Preserve unrestricted field mastery and all previously approved character-creation requirements.

Documentation only. No game code, assets, or saves modified; no runtime tests performed.



## Ability acquisition reference comparison — 2026-11-26

The owner directed use of both references for the ability system. This authorizes reference-based design, not automatic adoption of all mechanics or story canon.

- [Hero or Villain: Genesis — official publisher description](https://www.choiceofgames.com/2019/09/new-hosted-game-hero-or-villain-genesis-by-adrao-and-tokyo-wizard-is-on-steam/): offers player selection among many powers. Use the general concept of customizable ability choices, not its prose, characters, exact power catalog, prices, or story.
- [Living Superhuman World — canon at inspected revision](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/blob/019175c6463ff31807a0f7013d91299add94913c/docs/CANON.md) and [decisions](https://github.com/jbob-coder/Novel-story-rpg-game-chat-gpt/blob/019175c6463ff31807a0f7013d91299add94913c/docs/DECISIONS.md): immediate, delayed and absent human awakening are approved there. Its specific Day -30 opening, Day 0 cosmic shockwave, protagonist and events belong to that separate project. Its current narrative does not use RPG attributes, XP or ranks; do not import that exclusion into GODSEED.

Proposed synthesis for GODSEED: offer meaningful player power customization while allowing unequal awakening timing among characters and the possibility of remaining unpowered. Separate selection of potential from actual possession and mastery. An unawakened character cannot use an unmanifested ability. Whether initial power selection defines an already active ability, a latent potential, or a choice at awakening remains an owner decision. The timing/origin of GODSEED's awakening phenomenon, allocation budget, ability count, and exact NPC distribution are open. No canon from another world is imported and no code is implemented.

## Cosmic shockwave and meteorite acquisition — owner-approved direction (2026-11-26)

GODSEED has its own cosmic event. A shockwave reaches the game's alternate Earth and causes early superhuman changes in some people. The event also sends rocks through the universe; meteorites associated with the event cross Earth's sky like shooting stars and fall to the surface. Fallen meteorites are glowing rocks.

Two distinct ability acquisition paths are established:
- Natural awakening: some people develop abilities as a consequence of the shockwave; not everyone awakens naturally. The exact timing and distribution remain open.
- Meteorite interaction: interacting with a fallen glowing meteorite presents the player with a selection of abilities determined by that meteorite's type. The character can select from the available abilities rather than receiving an arbitrary power from an unrestricted catalog. This provides an acquisition route for people who do not awaken naturally.

The meteorite type determines the available selection. Specific types, powers, number of choices, selection limits, activation requirements, repeat interactions, depletion and compatibility with existing abilities are not yet defined. Whether naturally awakened characters can use meteorites, and whether NPCs use an analogous selection mechanism, are open decisions. The interface is not yet specified. Do not infer instant mastery or additional power grants, guaranteed access to meteorites, exact impact dates, the other project's Day -30 opening, or alternative acquisition methods such as artifacts or experiments from earlier discussion.

This owner direction supersedes the earlier unresolved proposal about the source of abilities to the extent described above. Starting powered versus unpowered, the playable start relative to the shockwave, and whether natural awakening allows power selection remain open. No code or runtime tests performed.

## One-ability limit — owner-approved (2026-11-26)

Each character is limited to one superhuman ability, regardless of whether it is acquired through natural awakening or a meteorite. A character with an existing ability cannot acquire an additional ability from another meteorite. Apply the same limit to player characters and NPCs. This supersedes the earlier open question about stacking abilities across acquisition paths. Distinguish an ability from its mastery, applications, and related techniques; the detailed definition of those boundaries remains open. Ability replacement, loss, and repeat interaction behavior are not yet decided. No game code was implemented.

## Technique development, combination and evolution — owner-approved (2026-11-26)

A character may develop multiple techniques and applications of their one superhuman ability through training, experimentation and experience. Techniques can be combined and can evolve. Preserve the one-ability limit for players and NPCs; learning new applications does not itself grant an unrelated second ability.

Illustrative example (not a finalized power catalog): a character with one heat-manipulation ability might develop concentrated heating and controlled heat dispersal, combine those techniques, and improve or evolve them through mastery. The exact mechanics of combinations, whether combinations may involve other characters, whether the core ability itself can evolve, limits, costs, prerequisites and progression formulas remain open. Do not assume automatic evolution, guaranteed success, instant mastery or independent additional powers. Keep the superhuman profile and field mastery distinct as documented in CHARACTER_STATUS.md.

Documentation only; no game code or runtime tests performed.

## Spatial rifts and experience — owner direction (2026-11-26)

The cosmic shockwave can also create rifts in space. These rifts provide access to places where superheroes can enter and earn experience (XP). This is a progression opportunity, distinct from fallen meteorites, which offer ability acquisition according to meteorite type. Preserve the one-superhuman-ability limit and the approved ability-specific capabilities, technique development, combinations and evolution.

The preceding discussion proposed ability-specific XP and mastery as separate from general character progression. The owner explicitly established XP opportunities through rifts; the exact XP destination (general, ability-specific, or both), award conditions, thresholds, and automatic versus learned technique unlocks remain open. The contents of rifts, access eligibility (including villains, civilians and unpowered characters), entry and exit mechanics, hazards, frequency, duration, rewards and consequences also remain undecided. Do not assume monsters, mandatory combat, a dungeon structure, or guaranteed XP merely for entering. No game code or runtime tests performed.

## Rift destinations — owner-approved (2026-11-26)

Spatial rifts created by the cosmic shockwave connect the game's alternate Earth to other dimensions containing their own creatures and environments. They are dimensional passages, not merely isolated spaces generated by the shockwave. Characters can enter these destinations to earn XP as previously established. The existence of creatures does not itself require combat or establish hostility. Persistence of destinations, whether multiple rifts can connect to the same dimension, inhabitants, ecology, entry and exit rules, access, time relationships and XP award conditions remain open. No specific dimension, creature, encounter, or reward is established by this decision. No code or runtime tests performed.

## Rift completion conditions and time limits — owner-approved (2026-11-26)

Rifts do not all follow the same closure or completion rules. Some have conditions that must be fulfilled. Others have a time limit; when it expires, affected occupants may be forcibly expelled from the rift or incur a penalty, depending on the rift's rules. Do not assume every timed rift expels occupants, every condition-based rift has a deadline, or every rift closes immediately upon completion. Specific conditions, penalties, destinations after forced expulsion, closure timing and whether these rules can coexist remain to be defined. Rifts can be higher level, but the owner's description of higher-level rifts is not yet complete; do not infer their special mechanics. The shared fictional clock and paused decision-reading rule remain in effect; no real-world countdown is authorized. No game code or runtime tests performed.

## Rift diversity and difficulty — owner-approved (2026-11-26)

Rifts vary substantially in scale, danger, environment and mission requirements. Higher-level rifts may lead to larger places, contain more dangerous creatures or other hazards, or present more complex problems. Difficulty is not exclusively combat strength or physical size.

Some destinations resemble other historical eras, with settlements, inhabitants and social circumstances. A mission may require understanding the local situation, finding a solution and fulfilling completion conditions rather than defeating creatures. Multiple mission types and solutions are possible; do not force every rift into a monster-clearing dungeon or a fixed solution. Inhabitants retain independent agency and knowledge boundaries. This does not establish literal time travel to Earth's past.

The owner also introduced a system that informs characters; the exact information it communicates and when remains to be clarified. Preserve existing condition-based and timed rift rules. Ranking scale, mission generation, rewards, failure consequences, accessibility and persistence remain open. No game code or runtime tests performed.

## Rift discovery and classification — owner-approved (2026-11-26)

The system does not automatically disclose rift difficulty, mission objectives, clearing conditions, deadlines or rewards before or after entry. In the early stage of the cosmic phenomenon, characters lack a reliable way to determine rift categories or difficulty. Later, people may discover or develop technology that enables rift categorization. Do not initialize this technology as already available or equate classification with complete knowledge of a destination.

Characters must discover relevant conditions and possible solutions through exploration, observation, communication, investigation and other available in-world evidence. Information can be incomplete or uncertain. The owner suggested that a Scout class might eventually develop for reconnaissance missions; this is a candidate class, not a finalized profession, ability, mandatory party role or automatic source of objective information. Its mechanics, qualification and relationship to the class system remain open.

This decision supersedes the earlier unresolved reference to system-supplied rift information. Preserve individual knowledge boundaries, meaningful consequence warnings based on what the character reasonably knows, the paused fictional clock, and established rift conditions and penalties. The actual classification technology, its accuracy, what it can measure, how mission completion is recognized, and how the system communicates a completed outcome remain undecided. No game code or runtime tests performed.

## Rift clearance notification — owner-approved (2026-11-26)

When a rift's actual clearance conditions have been fulfilled, the system notifies the characters involved with a message stating that the rift has been cleared. Example wording: "Rift cleared." The notification confirms an achieved outcome; it does not disclose hidden objectives, conditions, difficulty, deadlines or rewards in advance. Preserve discovery-based reconnaissance and the authoritative fictional timeline. Do not issue clearance merely because a character believes the mission is finished. Exact recipients, notification presentation, reward settlement, post-clearance exit and closure behavior remain open. No game code or runtime tests performed.

## Post-clearance choice and automatic closure timer — owner-approved (2026-11-26)

After the system confirms that a rift has been cleared, characters have the option to return to Earth or remain inside. Characters who remain are given a countdown before the rift automatically closes. This post-clearance countdown is distinct from any time limit governing the original mission and is disclosed to the affected characters. It does not reveal hidden mission conditions before clearance.

The countdown follows fictional game time, not real-world time spent reading, reviewing decisions or checking status. Preserve the approved action-duration and interruption rules. When the post-clearance countdown reaches zero, characters from Earth who remain inside are forcibly returned to Earth and the rift automatically closes. They cannot become trapped in the dimension merely by exceeding this countdown. This applies to the post-clearance timer, not to every original mission deadline. Under the owner's delegated design decision, the post-clearance countdown varies by rift. Its duration is determined from the individual passage's stability and characteristics, with size and difficulty informing the design only where relevant; a higher level does not guarantee more time. Establish one authoritative closure deadline at clearance, show the remaining fictional time to affected characters, and do not reset or extend it merely because a character reads, selects an action, or changes their mind. All occupants subject to forced return share the same deadline. A committed action that would cross the deadline must resolve only up to closure before forced return; do not grant work or loot that requires time after closure. Exact duration ranges and calculation, voluntary exit mechanics, re-entry, exact return location, handling of carried resources and any additional closure consequences remain open. Do not assume native inhabitants are transported to Earth. This decision supersedes the earlier open question about whether remaining after clearance is permitted. No game code or runtime tests performed.
