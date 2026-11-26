# GODSEED — Human attributes and age development

Design baseline 2026-11-26. See [design index](../README.md) for decision precedence and status. The following source sections are preserved verbatim; later approved decisions override earlier candidate wording.

## Human attribute scale — approved reference and variation (2026-11-26)

Owner accepted the reduced natural human ceiling and confirmed that individual stats should vary rather than all being initialized to eight.

- Natural human attribute reference: 0 = absent specific capability; 1–3 very limited; 4–6 below average; 7–9 average reference band; 10–13 developed; 14–17 exceptional; 18–19 elite; 20 peak natural human. Effective performance above 20 represents performance beyond the natural reference, not necessarily an increase in the underlying natural attribute.
- Eight is an ordinary healthy adult reference point, not a universal default or mandatory character-wide average. Generate independent but plausibly related attributes based on individual biology, age, upbringing, lifestyle, education and training. Ordinary individuals may have attributes below or above the 7–9 reference band. Do not use occupation as a fixed stat template or force all averages to eight.
- Maintain separate natural, temporary/effective and superhuman values; field mastery, training progress and permanent attributes are distinct. Exact modifier formulas and measurable benchmarks remain pending.
- Current age-development direction from owner: younger starts should have age-appropriate lower capabilities and room to develop; approximately age 40 should mark a natural progression plateau, with further growth requiring a different route. Detailed age bands, per-attribute ranges, plateau rules and exceptions require design review. Do not implement an automatic birthday-based reset, universal decline or finalized age gate from this note.
- Apply the age/variation principle to player and NPC baseline generation as the proposed consistent model, without changing existing NPC autonomy.

Documentation only. No game code, save data or assets modified; no runtime tests performed.


## Age-based attribute development — approved (2026-11-26)

Owner approved the detailed age-development proposal and requested saving. This supplements the approved 0–20 natural human scale; eight is a reference, not a uniform starting value.

### Life stages
- 0–5: early childhood; foundational physical and cognitive development.
- 6–12: childhood; rapid development through education, play and experience.
- 13–17: adolescence; physical maturation and increasing independence.
- 18–24: early adulthood; approaching full natural maturity.
- 25–39: adulthood; refinement through training and specialization.
- 40+: individual natural attribute development plateau; ordinary training primarily maintains existing attributes. Alternative development routes can enable further growth.

### Expected baseline ranges by age
These are approved game-design reference ranges for ordinary healthy characters without exceptional training, not scientific age norms, hard caps, fixed birth values or guaranteed outcomes. Individual values may lie outside the typical bands, subject to the natural ceiling and character history.

| Physical attribute | 6–9 | 10–12 | 13–17 | 18–24 | 25–39 |
|---|---|---|---|---|---|
| Strength | 2–4 | 4–7 | 6–10 | 6–11 | 6–12 |
| Agility | 3–6 | 5–9 | 6–11 | 6–11 | 6–11 |
| Endurance | 2–5 | 4–8 | 5–10 | 6–11 | 6–12 |
| Movement speed | 3–5 | 4–8 | 6–11 | 6–11 | 6–11 |
| Durability | 2–4 | 3–6 | 5–8 | 6–10 | 6–11 |
| Dexterity | 2–5 | 4–8 | 5–10 | 6–11 | 6–12 |
| Flexibility | 6–10 | 7–11 | 6–11 | 5–10 | 4–10 |
| Coordination | 2–5 | 4–8 | 5–10 | 6–11 | 6–12 |
| Balance | 3–6 | 5–8 | 6–10 | 6–11 | 6–11 |
| Recovery | 5–9 | 6–10 | 7–12 | 7–11 | 6–10 |

| Mental attribute | 6–9 | 10–12 | 13–17 | 18–24 | 25–39 |
|---|---|---|---|---|---|
| Intelligence | 2–5 | 4–7 | 5–10 | 6–11 | 6–12 |
| Perception | 3–6 | 4–8 | 5–10 | 6–11 | 6–12 |
| Willpower | 1–4 | 3–6 | 4–9 | 6–11 | 6–12 |
| Awareness | 2–5 | 4–7 | 5–10 | 6–11 | 6–12 |
| Composure | 1–4 | 3–6 | 4–8 | 5–10 | 6–12 |
| Memory | 3–6 | 4–9 | 6–11 | 6–12 | 6–12 |
| Concentration | 1–4 | 3–7 | 5–9 | 6–11 | 6–12 |
| Reasoning | 1–4 | 3–7 | 5–10 | 6–11 | 6–12 |
| Creativity | 4–8 | 5–10 | 6–11 | 6–11 | 6–12 |
| Adaptability | 4–8 | 5–9 | 6–10 | 6–11 | 6–12 |

| Social attribute | 6–9 | 10–12 | 13–17 | 18–24 | 25–39 |
|---|---|---|---|---|---|
| Charisma | 2–6 | 3–8 | 4–10 | 5–11 | 5–12 |
| Persuasion | 1–3 | 2–6 | 4–8 | 5–10 | 6–12 |
| Empathy | 2–5 | 3–7 | 5–10 | 6–11 | 6–12 |
| Leadership | 1–3 | 2–5 | 3–8 | 4–10 | 5–12 |
| Deception | 1–3 | 2–6 | 4–8 | 5–10 | 5–12 |
| Intimidation | 0–2 | 1–4 | 3–7 | 4–10 | 4–11 |
| Negotiation | 1–3 | 2–5 | 4–8 | 5–10 | 6–12 |
| Social awareness | 2–4 | 3–7 | 5–9 | 6–11 | 6–12 |

### Progression and plateau
- Apply age-appropriate development to player and NPC histories. Younger characters generally begin with lower developed capabilities and more remaining maturation; older characters can have more developed initial capabilities and accumulated experience. Neither age is universally superior.
- Generate variation from age, biology, individual potential, upbringing, education, lifestyle and training. Do not assign all attributes eight or force a particular average. Age bands are reference ranges, not automatic birthday-based stat grants or resets.
- Natural maturation stops by the proposed age-40 plateau; ordinary attribute training primarily maintains the character's attained values. No automatic stat decrease on turning 40. Field mastery, learned skills and knowledge remain able to develop.
- Alternative routes may allow additional growth after the plateau, including advanced specialized training, technology, medical treatment and superhuman transformation. These are candidate routes; eligibility, costs, risks, limits and whether the effect is natural or enhanced must be defined before implementation. Natural attributes retain the ceiling of 20; enhanced performance is tracked separately.
- Exact growth curves, per-attribute progression requirements, maintenance/decline mechanics, treatment of pre-40 accrued progress, age-related exceptions and combat performance formulas remain open. The illustrative strength growth graph is not a fixed formula.
- Minimum and maximum playable starting ages remain undecided; no detailed 0–5 baseline table was proposed, and 40+ characters retain their individual history rather than receiving a new uniform age-band allocation.

### Acceptance checks (pending implementation)
- [ ] Generate plausible varied age-appropriate starting profiles without forcing equal stats or means.
- [ ] Preserve accumulated attributes across birthdays and age band transitions.
- [ ] Separate maturation, training progress, maintenance, field mastery and enhancement.
- [ ] Verify age-40 plateau without automatic reduction or blocking continued skill learning.
- [ ] Verify natural ceiling and enhanced-value separation; preserve NPC autonomy.
- [ ] Test younger and older starts, plateau boundaries and alternative routes when their rules are defined.

Documentation only; no game code, assets or saves modified; no engine tests performed.


