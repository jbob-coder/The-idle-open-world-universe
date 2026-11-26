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

The countdown follows fictional game time, not real-world time spent reading, reviewing decisions or checking status. Preserve the approved action-duration and interruption rules. When the post-clearance countdown reaches zero, characters from Earth who remain inside are forcibly returned to Earth and the rift automatically closes. They cannot become trapped in the dimension merely by exceeding this countdown. This applies to the post-clearance timer, not to every original mission deadline. Under the owner's delegated design decision, the post-clearance countdown varies by rift. Its duration is determined from the individual passage's stability and characteristics, with size and difficulty informing the design only where relevant; a higher level does not guarantee more time. Establish one authoritative closure deadline at clearance, show the remaining fictional time to affected characters, and do not reset or extend it merely because a character reads, selects an action, or changes their mind. All occupants subject to forced return share the same deadline. A committed action that would cross the deadline must resolve only up to closure before forced return; do not grant work or loot that requires time after closure. Exact duration ranges and calculation, voluntary exit mechanics, re-entry, exact return location, detailed item-transfer mechanics and any additional closure consequences remain open. Do not assume native inhabitants are transported to Earth. This decision supersedes the earlier open question about whether remaining after clearance is permitted. No game code or runtime tests performed.

## Rift resource and item transfer — owner-approved (2026-11-26)

Characters may bring resources, equipment and artifacts obtained inside rifts back to Earth. This permission applies to player characters and NPCs, including voluntary return and forced return at the post-clearance deadline. Preserve the single-ability limit: obtaining an artifact does not automatically grant a second superhuman ability.

Proposed consistency safeguards: only transfer items actually acquired and carried or otherwise transported by a valid method at departure; preserve item identity and quantity without duplication; do not award unfinished gathering or extraction after closure. The permission to transport items does not establish ownership, unlimited carrying capacity, guaranteed sale, unrestricted use, or any particular item effect. Exact inventory and transport limits, item compatibility, ownership disputes, and market integration remain open.

Owner clarification: only nonliving material may be brought back from a rift. Living creatures, including animals, monsters and intelligent native inhabitants, cannot be brought to Earth by characters as cargo or through the character-return mechanism. Independent creature escape through an uncleared rift is a separate phenomenon, as specified below. In context, this excludes living beings from the previously approved transfer of resources, equipment and artifacts; those nonliving items remain permitted. Apply the restriction to voluntary and forced return alike. Treatment of viable seeds, eggs, microorganisms and other borderline biological material remains open; do not assume an exception to the living-being restriction. Documentation only; no game code or runtime tests performed.

## Rift materials and technological development — owner-approved (2026-11-26)

Materials recovered from rifts may possess unique properties that enable the development of new technologies, weapons, medicines and equipment on Earth. Preserve the restriction on transporting living beings and the one-superhuman-ability limit. Material properties do not automatically confer new innate abilities.

Proposed implementation direction: researchers, engineers, medical specialists and other qualified characters (including NPCs) can investigate material properties, develop applications, and test prototypes over fictional time. Discoveries require relevant expertise, available samples and facilities; do not automatically grant universal knowledge or technological progress on extraction. Specific materials, properties, research requirements, manufacturing processes, safety risks, costs, and ownership and distribution of discoveries remain undecided. Documentation only; no game code or runtime tests performed.

## Rift emergence and geographic distribution — delegated design decision (2026-11-26)

The owner delegated the choice of rift distribution. Use a hybrid probabilistic model: rifts can emerge across Earth, but local residual cosmic energy and spatial instability influence their probability. Geography affects where a rift manifests and the consequences of its appearance; do not require a particular terrain, population density, meteorite impact, or player proximity. Rare appearances outside high-probability regions remain possible.

Generate rift emergence as independent world events on the authoritative fictional clock. An event may occur in inhabited, remote or inaccessible places, whether or not the player is nearby. Store each event's identity, location, emergence time and lifecycle state; use reproducible randomness and persist resolved events across save/load. Player discovery and NPC discovery are separate from actual existence. No automatic global notification or early classification ability is granted; later research may identify statistical patterns without guaranteeing individual predictions. Do not correlate meteorites and rifts automatically merely because both originate from the cosmic event.

Exact emergence rates, regional weights, energy distribution, limits on simultaneous rifts and how long uncleared rifts persist remain open for balancing and design. These are delegated design rules, not implemented systems. Future checks: emergence independent of the player, unchanged during paused reading, no event duplication on reload, consistent location references, and no premature disclosure of hidden rift information. No game code or runtime tests performed.

## Creature escape from uncleared rifts — owner-approved (2026-11-26)

Creatures can escape from an uncleared rift into Earth, potentially creating emergencies and threats to nearby settlements. This is distinct from characters transporting living beings, which remains prohibited. Forced return after clearance does not automatically bring native creatures with the returning characters.

Proposed consistency rules: creature escape is an independent world event that can occur without player involvement. Escaped creatures have actual locations and persistent identities; their behavior depends on their nature and circumstances rather than assuming every escape causes an attack. Local NPCs and institutions can discover and respond to the incident according to their knowledge, capabilities and priorities. Preserve the fictional clock and discovery boundaries; no automatic global warning is implied. Owner timing direction: use a one-to-two-week window for uncleared rifts capable of creature escape. Working interpretation: assign a deadline 7–14 fictional days after emergence, after which an uncleared rift can release creatures into Earth. This interpretation concerns the pre-clearance escape deadline, not the separate post-clearance closure countdown or an internal mission deadline. Clearance before the escape deadline prevents a new escape under this rule; creatures already escaped are not automatically removed. The deadline follows the authoritative fictional clock and is not automatically disclosed to characters at the early stage; later detection or prediction may be possible through research. Owner-approved outbreak rule: when the 7–14 fictional-day escape deadline expires for a creature-escape-capable rift that remains uncleared, a large-scale outbreak occurs immediately, rather than a gradual release. The outbreak begins at the rift location and can affect the surrounding world independently of the player. This supersedes the earlier uncertainty about whether an outbreak occurs at expiry; it does not mean all rifts are escape-capable or that every escaped creature is hostile. Proposed consistency safeguard: resolve the outbreak onset once per rift and preserve its state across save/load; if clearance and expiry coincide, resolve against authoritative event ordering without duplicate or contradictory outcomes. Exact outbreak population, scale, subsequent migration, containment, deadline distribution, tie-breaking policy and what happens to escaped creatures after rift closure remain open. No game code or runtime tests performed.

## Post-outbreak rift lifecycle — delegated design decision (2026-11-26)

The owner delegated the decision about whether a rift collapses after an outbreak. An outbreak does not itself close the rift or count as clearance. The rift remains open and uncleared, subject to any separately established rift-specific closure rules. Characters, including NPCs, can still attempt to fulfill its actual clearance conditions. Successful clearance triggers the established notification, optional continued exploration, shared post-clearance countdown and forced Earth return at closure.

Track the outbreak and the rift's clearance independently. Closing the rift stops further escape through that passage but does not automatically remove creatures already on Earth. Do not replay the initial large-scale outbreak simply because the rift remains open or a save is loaded. Additional escape waves, special closure exceptions and the ultimate fate of escaped creatures require separate rules. This decision preserves a meaningful opportunity to resolve a failed containment situation without erasing its consequences. Documentation only; no game code or runtime tests performed.

## Escaped creatures and Earth ecology — delegated design decision (2026-11-26)

The owner delegated the decision about survival and reproduction of escaped creatures. Escaped creatures may survive, migrate, reproduce and establish populations on Earth when their biology and local environmental conditions permit. This is species-dependent, not guaranteed: incompatible species may decline or die, while compatible species may adapt, establish habitats, compete with native life or create persistent ecological threats. Not all escaped creatures are hostile. Intelligent inhabitants retain independent agency where applicable.

Population development follows fictional time and depends on viable founders, reproduction requirements, resources, habitat, mortality, competition and human or NPC intervention. Preserve existing individuals and population history after the originating rift closes; closure prevents new arrivals through that passage but does not erase existing populations. Native reproduction on Earth is distinct from transporting living beings through a rift, which remains prohibited. Do not force every outbreak to establish a population or scale reproduction to the player. For scalability, propose regional population cohorts for unobserved wildlife, preserving individual identity for tracked creatures and preventing double-counting when changing simulation detail.

NPCs and institutions may independently investigate, contain, coexist with or respond to established populations based on knowledge and capabilities. Species profiles, reproduction rates, habitat capacity, adaptation times, ecological effects and population simulation thresholds remain undefined. Documentation only; no game code or runtime tests performed.

## Rift response organizations and exceptional preparedness — delegated design decision (2026-11-26)

The owner delegated the institutional response model and requested allowance for exceptional preparedness at the beginning. Initially, existing emergency services, military, police, scientific institutions and other relevant public or private organizations respond using their available knowledge, resources and authority. Specialized rift exploration, containment, research and creature-control organizations may emerge independently over fictional time as needs, funding, expertise and institutional decisions justify them. Do not automatically establish a universal organization or assume all regions progress at the same rate.

Working interpretation of the owner's preparedness exception: some organizations may already have relevant personnel, equipment, emergency plans or contingency capabilities when the phenomenon begins, including an exceptional pre-existing specialized response group where its history supports such readiness. This is permitted, not mandatory. General preparedness does not establish prior knowledge of the shockwave, hidden rift conditions or reliable early rift classification; preserve the approved discovery and technology progression rules. Any exceptional prior knowledge would require a separately established source and timeline. No named organization or guaranteed response is introduced by this decision.

Organizations act independently of the player; track their jurisdiction, staffing, resources, knowledge, objectives, response capacity and development history. Specific organizations, establishment dates, authority, licensing, funding, jurisdictional conflicts and the extent of initial preparedness remain open. Documentation only; no game code or runtime tests performed.

## Hero licensing and rift access — delegated design decision (2026-11-26)

The owner delegated licensing policy. At the beginning of the cosmic phenomenon, existing laws and institutional authority apply; do not assume a universal hero license or mature rift-access regime already exists. Jurisdictions can subsequently establish licensing or equivalent recognized authorization for professional superhero operations and restricted rift missions. Exceptionally prepared organizations may possess relevant pre-existing legal authority where justified by their history. Licensing rules, effective dates and enforcement must reflect the actual jurisdiction and institution.

Distinguish possession of a superhuman ability, intended alignment, public standing, hero rank, professional license and mission-specific authorization. Possessing an ability or choosing Hero alignment does not automatically grant a license. Authorized nonpowered specialists, researchers and emergency personnel may also participate in rift operations where permitted. Ordinary lawful activity, self-defense and emergency rescue are not automatically treated as unauthorized professional hero work. Formal exceptions and local legal boundaries must be defined by applicable rules.

Licensing is a legal and social constraint, not a hard gameplay lock: characters can attempt unauthorized operations or rift entry where physically possible, subject to actual access controls, foreseeable consequence warnings, evidence, and independent NPC or institutional responses. Do not automatically detect or punish every violation. Track jurisdiction, authorization scope, validity and actual knowledge separately; apply equivalent rules to players and NPCs. Exact qualification requirements, licensing authority, examination, fees, penalties, reciprocity and renewal remain open. Documentation only; no game code or runtime tests performed.

## Official hero ranking — delegated design decision (2026-11-26)

The owner delegated the official hero ranking decision. Establish professional hero ranks as institutions develop the necessary assessment and licensing systems. Rank reflects verified operational competence, mission performance, qualifications, reliability, teamwork and demonstrated control of relevant capabilities, rather than raw combat power or general character level alone. Rescue, support and reconnaissance specialists must have viable assessment paths. Do not require destructive combat capabilities for professional advancement.

Keep official hero rank separate from ability level, power rank, public reputation, threat classification, license validity and mission authorization. A powerful but inexperienced or unregistered character may be unranked; a skilled specialist may hold a high professional rank without comparable destructive power. Rank is assigned by an authorized institution using evidence available to it; assessments can be incomplete or mistaken. No automatic rank promotion from XP, player alignment or hidden character statistics. Advancement and reassessment may occur through documented achievements, examinations and observed performance; sanctions or demonstrated loss of competence may lead to demotion under applicable institutional rules. Apply the same principles to NPCs. Jurisdiction-specific ranks and recognition may develop unevenly; a rank is not guaranteed universal access to missions.

Track the issuing institution, rank, assessment basis, effective date and relevant history; display the established hero rank under public standing as already specified in CHARACTER_STATUS.md. Exact rank labels, thresholds, assessment methods, promotion and appeal procedures remain open. No game code or runtime tests performed.

## Villain threat classification — owner-approved (2026-11-26)

The owner approved a separate threat classification system for villains, based on capabilities, criminal activities and potential danger to society. Keep this classification separate from official hero rank, actual ability level, power rank, alignment, criminal status, fame and infamy.

Proposed assessment rules: authorities and relevant institutions classify threats using available evidence of demonstrated capabilities, harmful conduct, intent where supported, resources, associates, operational reach and potential impact. Threat classifications may be unknown, provisional, inaccurate or revised when new evidence emerges. Choosing Villain alignment or possessing a powerful ability does not automatically establish criminal guilt or a threat designation. Apply the same principles to player characters and NPCs. Keep private or undiscovered capabilities outside institutional knowledge unless acquired through legitimate in-world evidence. Classification can inform resource allocation and response decisions without guaranteeing detection, pursuit or punishment. Display known classifications in the existing public-standing status field; undisclosed assessments remain outside player knowledge.

Exact classification tiers, criteria, issuing authorities, review procedures and responses remain open. Documentation only; no game code or runtime tests performed.

## Common F-to-S power classification scale — owner-approved (2026-11-26)

The owner approved the shared F-to-S power classification scale for heroes, villains and rifts, separate from official hero rank and villain threat classification. Use seven ordered grades: F, E, D, C, B, A, S (lowest to highest). Unclassified or unknown is a separate assessment state, not F rank. Character power grades represent capabilities rather than alignment, reputation, legal authorization or professional performance. For rifts, the shared labels express assessed challenge and hazards, which may include noncombat complexity; matching grades do not guarantee that a character can clear a rift alone. Exact calibration, attribute thresholds, assessment methods and the treatment of abilities outside established ranges remain open.

Maintain the existing knowledge boundaries: characters and institutions do not automatically know hidden power grades or rift conditions. Early rift classification remains unavailable until suitable technology or assessment methods develop. Preserve distinct actual capability and observed assessment records. The seven-grade ordering and unknown state are implementation conventions accompanying the approved common scale; no additional tiers or numerical cutoffs are established. No game code or runtime tests performed.

## Monster kills, general XP and attribute progression — owner-approved (2026-11-26)

Killing monsters awards general character experience (XP). Accumulating sufficient general XP increases character level, and character level advancement improves character attributes. This establishes the progression chain: monster kill → general XP → character level → improved attributes. It supersedes the earlier uncertainty about whether monster-kill XP contributes to general level. Do not assume that every kill immediately produces a level or that entering or clearing a rift alone grants XP.

Keep ability mastery and field mastery distinct from general character progression. Preserve the one-ability limit, the natural human attribute ceiling of 20 and separation of natural versus enhanced attributes described in ATTRIBUTES.md. Level-based growth must be reconciled with those rules before implementation. The owner approved player-directed allocation: on leveling, the character receives one or more stat points and a recommended attribute to improve. The recommendation is advisory; the character decides how to spend the available points among eligible attributes. No automatic spending or mandatory recommended allocation is implied. Proposed design safeguards: explain the recommendation using relevant character capabilities and needs, validate available points and attribute eligibility, and commit each allocation only once. Apply the same decision principle to NPCs through their autonomous preferences and circumstances, rather than player control. The owner approved a fixed number of stat points per level gained; the award does not increase merely because the character reaches a higher level. The fixed award is two stat points per level gained, selected under the owner's delegated balancing decision. The owner approved saving unspent stat points for later allocation. Unspent points accumulate across level-ups; there is no requirement to spend them immediately. Preserve the balance in character state and across save/load. Example: gaining three levels grants six points; spending two leaves four available for later. Recommendations do not spend points. Proposed safeguards: reject overspending and duplicate allocation; maintain separate balances for general stat points and other progression systems. The owner approved permanent stat-point allocation. Once spending is confirmed, points cannot be refunded, reset or redistributed to another attribute. Unspent points may still be saved indefinitely subject to any future storage rules. Proposed safeguard: allow review and revision of the proposed allocation before confirmation; clearly warn that confirmed spending is irreversible. Permanent allocation does not imply immunity to injury, temporary modifiers or other independently established changes in effective performance. For eligible attributes using the approved natural-human 0–20 reference scale, apply the progressive allocation cost defined below. Eligibility, conversion for other scales, recommendation logic, any storage ceiling, and whether any separate automatic growth also occurs remain open. Proposed consistency safeguard: grant the fixed award once for each level gained, including when a single XP award crosses multiple level thresholds. General XP thresholds, reward amounts, kill attribution, group participation, eligibility (including unpowered characters), kills outside rifts, noncombat XP sources and any separate ability-mastery reward remain open. Proposed safeguard: record each eligible kill and its XP allocation once to prevent duplicate awards, including on save/load. Documentation only; no game code or runtime tests performed.

### Fixed stat-point award — balancing calculation (2026-11-26)

The owner requested calculation and delegated the final award quantity instead of accepting the initial five-point suggestion. Adopt 2 points per level as the design baseline, subject to balance validation once XP pacing and attribute effects exist.

Reference: ATTRIBUTES.md defines 8 as an ordinary adult reference and 20 as peak natural human performance, giving a 12-unit gap. CHARACTER_STATUS.md lists 28 candidate physical, mental and social attributes (10 + 10 + 8), excluding combat and superhuman attributes whose definitions and scales are not finalized. For sensitivity analysis only, assume one point buys one attribute unit, a reference start of 8, and no other growth. These assumptions are not new canon or a finalized conversion rule.

| Points per level | Levels gained to close one 12-unit gap | Points after 10 levels gained | Levels gained for 28 hypothetical 12-unit gaps |
|---:|---:|---:|---:|
| 1 | 12 | 10 | 336 |
| 2 | 6 | 20 | 168 |
| 3 | 4 | 30 | 112 |
| 5 | 3 | 50 | 68 |

Two points preserves allocation choices every level while reducing rapid single-attribute escalation relative to three or five points. After ten levels gained, an evenly distributed hypothetical award averages 20/28 = approximately 0.71 units per reference attribute. Actual starting values vary; natural training, caps, enhanced performance and ability mastery remain separate. Do not assume that XP directly raises natural attributes or that the natural ceiling limits superhuman performance. The calculations are sensitivity checks, not runtime tests or evidence of final balance. XP curves, expected play time per level, level cap, attribute effects and allocation eligibility require future calibration. No game code modified.

### Progressive attribute allocation cost — delegated design decision (2026-11-26)

The owner delegated the choice between flat and increasing costs. Adopt progressive costs for eligible attributes on the 0–20 natural-human reference scale. Each purchased increase of one unit costs points according to its destination value:

| Target attribute value | Stat points for +1 |
|---|---:|
| 1–10 | 1 |
| 11–15 | 2 |
| 16–20 | 3 |

For example, 10 to 11 costs two points; 15 to 16 costs three points. Starting at the illustrative reference value of 8, reaching 20 costs 2 + 10 + 15 = 27 points, equivalent to 14 level-ups at two points each with one point left over, assuming no other growth and no initial saved points. A flat one-point cost would require 12 points or six level-ups. The progressive cost makes specialization slower near peak human performance while preserving affordable early improvements. This supersedes the flat-cost assumption used solely for the earlier award sensitivity calculation, not the approved fixed award of two points per level.

Calculate cost using the persistent allocation-eligible attribute value, excluding temporary buffs or debuffs. Validate each sequential increase in a multi-unit purchase, and show the total cost and remaining balance before irreversible confirmation. Do not purchase beyond 20 under this natural-reference schedule. This is a cost schedule, not authorization to bypass age, eligibility or natural-versus-enhanced progression rules; superhuman attributes and other scales require their own calibration. No implementation or runtime tests performed. Validate pacing against XP thresholds, attribute effects, and NPC progression before production balancing.

### Human character level cap — owner-approved (2026-11-26)

The owner established level 20 as the maximum general character level for a human without superhuman progression. This is distinct from the natural-human attribute ceiling of 20; reaching character level 20 does not automatically maximize any attribute. Preserve the fixed award of two stat points per level gained, the progressive allocation costs, saved unspent points and irreversible confirmed spending. Example only: if starting at level 1 with no prior earned points, reaching level 20 yields 19 level-ups and 38 stat points. At the illustrative attribute value of 8, one increase to 20 costs 27 points, leaving 11 points from that budget, assuming no other expenditures or growth.

The superhuman character level cap is defined in the delegated decision below. XP handling at the human cap and exact starting level remain open. Documentation only; no game code or runtime tests performed.

### Superhuman character level cap — delegated balancing decision (2026-11-26)

The owner requested calculation based on the approved human level cap and F–S power scale and delegated the decision. Adopt a maximum general character level of 160 for superhumans as the design baseline. Use the human cap of 20 as a progression-budget reference and seven power grades (F, E, D, C, B, A, S) as a measure of the intended breadth of superhuman development. The chosen extension is seven blocks of 20 levels: 20 + 7 × 20 = 160. These are planning units, not rank unlocks or required level bands. The block size is a deliberate design choice, not a measured relationship between level and power.

Sensitivity comparison assuming a level-1 start, zero initial points and two points per level gained:

| Extension per grade (planning units) | Superhuman cap | Total earned points at cap | Extra points above human cap |
|---:|---:|---:|---:|
| 10 | 90 | 178 | 140 |
| 15 | 125 | 248 | 210 |
| 20 | 160 | 318 | 280 |

The human cap yields 38 points under the same assumptions. The selected cap gives a wider long-term specialization budget across ordinary and enhanced capabilities; it is not a promise of specific combat strength. For comparison, raising all 28 illustrative natural physical, mental and social attributes from 8 to 20 using the current natural-reference cost schedule would cost 28 × 27 = 756 points, assuming all were eligible and no other development. This is a sensitivity example, not a rule that all attributes must be purchasable or maxed. Superhuman-specific point costs and eligibility require separate calibration.

On awakening through an approved acquisition path, retain the character's existing level, earned and spent points, attributes, mastery and history; unlock the higher general level cap without granting free levels or forcing the character to reach human level 20 first. Preserve the natural attribute ceiling of 20, the two-point award, permanent confirmed allocations and banked unspent points. Character level and F–S power classification remain independent: a level-160 character is not automatically S rank, and an S-ranked capability need not require level 160. Official hero rank, villain threat classification and ability mastery remain separate. No new grade, automatic awakening, or universal monster level cap is established. XP curve, pacing, cap overflow, superhuman attribute limits and conversion, and power-grade assessment require future calibration. No runtime implementation or tests performed.

### Ability-specific superhuman attribute limits — delegated design decision (2026-11-26)

The owner delegated the choice of universal numerical caps versus ability-specific limits. Adopt finite, ability-specific attribute limits rather than one universal superhuman maximum. Each ability definition specifies its relevant capabilities, eligible enhancements, current attainable ceilings, conditions, and possible mastery or evolution prerequisites. Individual potential may further constrain or expand attainable ceilings within the ability definition. Unrelated attributes do not automatically gain superhuman potential. For instance, a strength-focused ability may increase effective lifting capacity beyond the natural human range, whereas a perception-focused ability may increase sensory range without granting comparable strength. Examples are illustrative, not approved powers or fixed numbers.

Keep natural attributes capped at 20 and record supernatural enhancements separately. The superhuman general level cap remains 160, with two stat points per level gained and permanent confirmed allocation. Leveling, spending points or increasing rank alone cannot bypass an ability's current limits; mastery or valid evolution may extend them only according to the ability's documented rules, preserving the one-ability constraint. No automatic increase of all ceilings, universal numerical superhuman maximum, or unlimited growth is implied. An ability may have different limits for output, range, precision, control, efficiency or other relevant dimensions. Define measurable units where appropriate; do not compare unrelated quantities merely because their numbers match. F–S classification continues to reflect assessed capabilities rather than raw level or any single attribute.

Before implementation, specify ability profiles with explicit ceilings, eligibility, conversion costs and evolution conditions, then validate those rules for both player and autonomous NPC progression. Reject allocations beyond eligible limits before irreversible confirmation; retain unspent points. Exact numerical ceilings, superhuman point costs, potential generation and cross-ability power-grade calibration remain open until the first ability blueprints are designed. Documentation only; no runtime code or tests performed.

### Individual potential and early-world power limits — owner-approved (2026-11-26)

The owner approved different individual maximum potentials among characters possessing the same ability and emphasized that GODSEED begins in the early stage of the cosmic phenomenon. High theoretical potential does not mean high initial power. At the beginning, people have newly manifested or newly acquired abilities, not the extreme mature capabilities used in illustrative long-term examples (such as large firestorms). Do not initialize fully developed high-end powers, advanced techniques or mastery merely because an ability could eventually reach them. Preserve the possibility of different starting capabilities within the early-stage baseline without assigning arbitrary identical stats.

Keep initial actual capability, current mastery, individual attainable potential and observed classification distinct. Development must occur through the established progression, relevant experience and valid technique or ability evolution. The F–S scale and level-160 cap describe the long-term design space, not starting character power or guaranteed progression. Exact initial ability bounds, potential distribution, pacing, and any exceptional initial cases require separate design; no exception to the early-stage constraint is assumed. No game code or runtime tests performed.

### Ability learning and attribute prerequisites — owner-approved (2026-11-26)

The owner approved practice and learning as the means of developing usable abilities. Awakening or unlocking an ability does not automatically grant practical proficiency or the capability to perform every application. Some abilities or techniques require minimum relevant attributes, such as physical strength, before the character can perform them. Requirements depend on the ability and application; do not apply a universal strength requirement.

Working interpretation: distinguish acquisition or awakening, discovery, learned technique, eligibility to execute, and actual mastery. A character may possess an unlocked ability but be unable to perform some or all of its applications until the relevant requirements are met. Practice and experimentation develop knowledge and control over fictional time; meeting a stat threshold alone does not grant automatic mastery. Preserve early-world limitations, individual potential, the single-ability limit and independent general, ability and field progression.

Proposed blueprint rules: define each application’s attribute prerequisites, the applicable natural or enhanced value, learning requirements and safe execution conditions. Apply the same principles to autonomous NPCs. The owner approved context-dependent outcomes for attempts below attribute requirements: a technique may work partially or cause injury, depending on the character's current condition. An injury is not an automatic consequence of every deficient attempt. Proposed resolution rules: evaluate the relevant attribute shortfall, health, existing injuries, fatigue or other applicable condition, mastery and technique demands at execution time; do not introduce a new stamina resource from this rule. Show foreseeable risks before confirmation where the character has sufficient knowledge. Partial execution must not bypass an ability's actual limits or guarantee successful completion. Physically impossible actions remain impossible. Apply the same rules to autonomous NPCs. Exact partial-effect formulas, injury probabilities, conditions for complete failure, whether requirements must be maintained after learning, and precise training and discovery mechanics remain open. No game code or runtime tests performed.

### Learning from success and failure — owner-approved (2026-11-26)

The owner approved mastery development through both successful and unsuccessful attempts, with the possibility of developing something different through experimentation. Working interpretation: an unexpected or partial result may reveal a new application or technique of the character's existing ability. Preserve the one-ability limit and the ability's valid capability boundaries; failure does not grant unrelated powers or guarantee a discovery.

Proposed safeguards: evaluate the relevance and learning value of each attempt rather than granting identical mastery for all repetitions. Meaningful practice, feedback and experimentation can improve understanding and control, while repetitive attempts that provide no new learning need not grant equivalent progress. Injury and other actual consequences remain in effect. Apply equivalent learning rules to autonomous NPCs. Exact mastery awards, discovery conditions, diminishing returns and the distinction between technique discovery and core ability evolution remain open. Documentation only; no game code or runtime tests performed.

### Technique instruction and knowledge transfer — owner-approved (2026-11-26)

The owner approved characters teaching discovered techniques to other characters with compatible abilities. Teaching transfers knowledge, not the underlying superhuman ability or the teacher's mastery. The recipient must practice and develop the relevant control, satisfy applicable prerequisites, and remain within their own ability limits and individual potential. Preserve the one-ability limit.

Proposed design rules: instruction requires an available teacher who knows the technique, a willing learner, and sufficient fictional time. NPCs may independently offer, request, accept or refuse instruction based on their goals, knowledge, relationships and circumstances. Lessons and demonstrations can improve learning without guaranteeing immediate proficiency. Preserve early-world knowledge limitations and the established risks of attempting techniques without adequate capabilities. Compatibility criteria, teaching effectiveness, lesson durations and knowledge-sharing arrangements remain open. Documentation only; no game code or runtime tests performed.

### Cooperative ability combinations and contextual outcomes — owner-approved (2026-11-26)

The owner approved combining abilities from different characters when their elements or other relevant capabilities align and the situation is appropriate. Resolve the resulting effect from the interaction of the participating abilities and the actual circumstances, rather than granting a guaranteed result or a permanent additional ability. A combination may produce an effect that neither participant can achieve alone. Preserve each character's single underlying ability, individual limits, mastery, and current condition.

Proposed design rules: evaluate compatibility, intensity, timing, coordination, range, target, environment and relevant prerequisites. Interactions may reinforce, transform, interfere with or cancel each other; partial execution, failure and injury remain possible under established rules. For example, compatible water and cold manipulation could freeze water into a barrier when the necessary material, temperature change and control are present. This is illustrative, not an approved power catalog or guaranteed recipe. A meaningful result may lead participants to discover and practice a repeatable cooperative technique, without automatically acquiring the other participant's ability. NPC participation remains autonomous; do not assume agreement or successful coordination. Preserve early-world knowledge limits and communicate foreseeable risks based on available character knowledge.

Exact interaction rules, combination formulas, participation and timing mechanics, discovery conditions and mastery rewards remain open. Documentation only; no game code or runtime tests performed.

### Predefined technique catalog and discovery boundaries — owner-approved (2026-11-26)

The owner rejected unrestricted invention of techniques beyond predefined techniques. Characters may discover, learn, practice, combine and evolve techniques within the authored ability and technique definitions. Experimentation, successful and unsuccessful attempts, and instruction may reveal predefined techniques that a character did not previously know; they do not create arbitrary new technique definitions at runtime. This clarifies the scope of the earlier learning, discovery and cooperative combination rules.

Context-dependent ability interactions may still produce situational outcomes under the approved interaction rules. An unexpected outcome does not automatically become a new permanent learned technique; a repeatable technique must correspond to a predefined valid definition. Preserve individual potential, attribute prerequisites, knowledge boundaries, early-world limitations and the one-ability limit. Apply the same restriction to players and NPCs. Proposed implementation safeguard: use stable technique identifiers and authored discovery, compatibility and evolution conditions. The initial catalog and exact discovery requirements remain open. Documentation only; no game code or runtime tests performed.

### Individual technique mastery and use-based development — owner-approved (2026-11-26)

The owner approved separate mastery progression for each technique within a character's single underlying superhuman ability. Development depends on the character's own practice and experience: a frequently and meaningfully practiced technique can advance faster than another technique belonging to the same ability. Overall ability mastery remains distinct from technique mastery; proficiency in one technique does not automatically establish equal proficiency in another.

Proposed design rules: record mastery progress per character and stable technique identifier. Attribute learning to the technique actually practiced, including meaningful successful, partial and unsuccessful attempts under existing learning rules. Maintain overall ability mastery as a separate record of broader understanding and control; its relationship to technique progress requires calibration. Do not grant additional underlying abilities, automatic mastery of newly discovered techniques, or arbitrary techniques outside the predefined catalog. Preserve individual potential, prerequisites, fictional action duration, and autonomous NPC practice. Exact mastery scales, progress rates, shared learning effects and any loss of proficiency through disuse remain open. Documentation only; no game code or runtime tests performed.
