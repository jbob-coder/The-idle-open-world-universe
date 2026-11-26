# GODSEED — Character status and capabilities

Design baseline 2026-11-26. See [design index](../README.md) for decision precedence and status. The following source sections are preserved verbatim; later approved decisions override earlier candidate wording.

## Character status panel — owner-approved direction (2026-11-26)

The three-dot bubble opens a full, scrollable character status panel. Keep the text-only presentation. A Return to story button at the bottom closes the panel and restores the narration and pending action selection without submitting a decision. Status display reads authoritative character data; example values are not canon. Do not display a stamina resource or attribute in this panel. No mana resource is required by this design.

### Identity and health
Display character name, level, species, health (current/max), alias, title, class, affiliation, alignment, occupation if applicable, and condition. Allow the player to choose an initial intended alignment (hero or villain) during character creation; do not force an alignment. Distinguish chosen intent from public standing. Titles and classifications must reflect actual character state.

### Attributes
Keep general human capabilities distinct from superhuman capabilities so the player can clearly understand human limits versus superhuman limits. Categories and candidate attributes from the approved prototype (46 illustrative general/superhuman entries; validate exact definitions and avoid overlap before implementation):
- Physical: strength, agility, endurance, movement speed, durability, dexterity, flexibility, coordination, balance, recovery.
- Mental: intelligence, perception, willpower, awareness, composure, memory, concentration, reasoning, creativity, adaptability.
- Social: charisma, persuasion, empathy, leadership, deception, intimidation, negotiation, social awareness.
- Combat: attack power, defense, reaction speed, accuracy, evasion, combat proficiency, combat awareness, weapon handling, precision, tactical reasoning.
- Superhuman: power output, control, resistance, efficiency, capacity, precision, potential; the prototype also listed luck here (proposed; review whether it belongs in general attributes).

Do not silently combine normal physical stats and superhuman stats. Proposed implementation: distinguish ordinary baseline, superhuman modifiers and effective values; show meaningful human and superhuman reference ranges once the actual mechanics are defined. Exact caps, scales, formulas, and field taxonomy remain open.

### Superhuman profile (retain)
Ability, power classification, power rank, mastery.

### Public standing (retain)
Hero rank, threat classification, public reputation, criminal status, fame, infamy. These are separate concepts and need not be equivalent to morality or actual combat strength.

### Professional development (conditional)
Only applies once the player selects a type of work they want to pursue. Before that selection, no active professional development track should be presented or advanced. Once selected, show the applicable job, specialization and qualifications. The mechanism for selecting/changing jobs and exact progression rules remain to be specified.

### Field mastery (independent; retain)
Field mastery remains available independently of employment. Show learned disciplines with mastery level, experience, and expandable specialized attributes. Relevant education, training, practice and experience should develop the associated field rather than grant unrelated mastery. Examples: engineering (technical knowledge, design, diagnostics, repair, fabrication, innovation); medicine (anatomy, diagnosis, treatment, first aid, medical precision, pharmacology); investigation (evidence analysis, deduction, research, surveillance, interviewing, tracking). These are illustrative, not fixed starting professions or stats. Job selection must not erase existing field mastery.

### Progression
Display character level, general experience and money. Keep general, superhuman and field development distinct. Do not assume character level automatically grants expertise in unrelated disciplines.

### Additional acceptance criteria (pending implementation)
- [ ] Bubble opens full status panel; Return to story preserves narrative and unsubmitted selection.
- [ ] General physical and superhuman attributes are visually and semantically separated; stamina is absent from the status panel.
- [ ] Superhuman profile and public standing retain their approved fields.
- [ ] No active professional track before work selection; after selection the correct specialization is shown.
- [ ] Field mastery remains independently accessible with field-specific experience and attributes even before employment.
- [ ] Status fields reflect real game state; no demonstration values are imported as canon.
- [ ] NPC use of this same progression model was suggested but not explicitly finalized in this discussion; preserve existing NPC autonomy and do not change NPC mechanics solely from this UI specification.

Documentation only; no implementation or engine tests performed.


## Financial status — 2026-11-26

Display the character's clean and dirty Credit balances separately. NPCs cannot read private provenance or balances automatically. See [ECONOMY.md](ECONOMY.md) for evidence-based knowledge and proposed perception interaction.

## Employment integration — 2026-11-26

See [POPULATION_AND_EMPLOYMENT.md](POPULATION_AND_EMPLOYMENT.md) for the proposed agreement and professional development lifecycle. Track only actual employment and experience; preserve independent field mastery and the player's choice of work.
