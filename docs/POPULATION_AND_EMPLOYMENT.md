# GODSEED — Local population and employment

2026-11-26 | Delegated first design increment around Apartment B2. The owner authorized proceeding with population and employment. Names, ages, organizational identities, pay and goals below are new design choices, reviewable and subject to correction; no runtime population has been generated. This is a small named seed roster, not a census, complete staffing plan, or fixed schedule.

## 1. Establishments

Use the existing geography in [WORLD.md](WORLD.md). No locations, routes, coordinates or detailed maps are added. Each organization has a workplace anchor, not an entitlement to every room or service at that site.

| Organization ID | Organization | Workplace | Function |
|---|---|---|---|
| ORG-0001 | Residential building management | LOC-0003 | Building maintenance and administration |
| ORG-0002 | Local grocery | LOC-0008 | Food and household supplies |
| ORG-0003 | Community clinic | LOC-0009 | Outpatient healthcare |
| ORG-0004 | Repair workshop | LOC-0010 | Equipment repair |
| ORG-0005 | Local school | LOC-0011 | Education |
| ORG-0006 | Fishing harbor cooperative | LOC-0013 | Fishing and dock operations |

The housing management office is not a new physical room; its caretaker uses the lobby as an administrative/maintenance reference. The harbor cooperative is a new organizational choice at the existing harbor. Ownership, public/private funding, staffing requirements, employer reserves, stock, hours, licenses and actual availability remain undefined. The bus stop has no local employer or scheduled vehicle yet; the clinic is not a hospital.

## 2. Named starting population

| NPC ID | Name | Age | Employer | Current occupation | Gross reference pay (CR/h) | Personal goal | Independent decision considerations |
|---|---|---:|---|---|---:|---|---|
| NPC-0001 | Mara Ellison | 44 | ORG-0001 | Caretaker | 18 | Maintain the building and manage family commitments | Values privacy; can decline nonurgent work |
| NPC-0002 | Tessa Marin | 36 | ORG-0002 | Store manager | 25 | Keep the shop solvent and stocked | Balances costs and customer needs |
| NPC-0003 | Eli Mercer | 21 | ORG-0002 | Store clerk | 12 | Save for further education | May seek a better job or reduce hours |
| NPC-0004 | Dr. Leena Farrow | 42 | ORG-0003 | Clinician | 45 | Provide reliable care within available resources | Protects confidentiality and takes time off |
| NPC-0005 | Adrian Bell | 28 | ORG-0003 | Clinic assistant | 20 | Build healthcare experience | May pursue training or change employers |
| NPC-0006 | Jonas Reed | 39 | ORG-0004 | Workshop lead | 25 | Complete quality repairs and retain customers | Rejects unsafe or unprofitable work |
| NPC-0007 | Nia Solis | 23 | ORG-0004 | Repair technician | 18 | Develop diagnostics expertise | Wants increasingly challenging work |
| NPC-0008 | Sera Hale | 33 | ORG-0005 | Teacher | 24 | Support students and plan lessons | Has independent obligations outside school |
| NPC-0009 | Owen Voss | 46 | ORG-0005 | School administrator | 25 | Keep school operations reliable | Must allocate limited resources |
| NPC-0010 | Cal Rivas | 38 | ORG-0006 | Fishing crew member | 20 | Earn stable income despite weather uncertainty | May refuse work in unsafe conditions |
| NPC-0011 | Iris Dane | 31 | ORG-0006 | Dock operations worker | 18 | Maintain safe dock operations and develop logistics skills | Coordinates work but does not control other actors |
| NPC-0012 | Noel Vega | 19 | — | Seeking work | — | Find suitable paid work and continue learning | Can compete for jobs or reject unsuitable offers |

Eleven named incumbent workers and one job seeker are seeded. These are intended resident/worker roles in the area, not an assertion that all actors are present at work at game start or live in Apartment B2. Home addresses, family composition, detailed attribute values, qualifications, financial balances, personal histories, relationships and current locations must be initialized coherently before runtime. Do not assign a new actor to the player's household without a compatible character start. No NPC is automatically a hero, villain, quest giver, friend or enemy. No superhuman status is assumed. The roster is adult-only for this first work-focused slice; children, dependents, other residents and additional shifts remain to be designed. Age eligibility for player employment is not yet finalized.

## 3. Candidate employment opportunities

| Role ID | Employer | Role | Reference gross CR/h | Relevant prerequisites |
|---|---|---|---:|---|
| JOB-0001 | ORG-0002 | Stock assistant | 12 | Basic numeracy, stock handling and safe lifting; training available |
| JOB-0002 | ORG-0004 | Workshop trainee | 12 | Safe tool use under supervision; diagnostics learning |
| JOB-0003 | ORG-0006 | Dock support assistant | 12 | Site safety and age/role eligibility; training and supervision |
| JOB-0004 | ORG-0001 | Maintenance assistant | 12 | Basic maintenance; supervision and access authorization |

These are job templates, not live vacancies. A position becomes available only if an employer has a real need, authority, funds, suitable work and capacity to supervise where relevant. Other NPCs can compete for it, accept or decline it, leave it, or fill it before the player applies. Do not treat a role ID as a promised offer. No mandatory profession or alignment-based employment restriction is implied; access depends on age/eligibility, qualifications, evidence, actual social conditions and NPC decisions. Formal regulated occupations require their eventual qualification rules.

## 4. Employment lifecycle

1. Employer evaluates staffing needs and available resources. A vacancy can be created, changed, filled, or withdrawn.
2. Candidate discovers an opportunity through an available source; private vacancies are not automatically player knowledge.
3. Candidate applies, negotiates, or declines. Employer independently evaluates suitability, resources and competing candidates. Avoid guaranteed acceptance based on stats alone.
4. A mutually accepted agreement records employer, worker, role, location, pay basis, agreed hours, duties, start time, pay interval and status. The initial wage references are not guaranteed contract terms.
5. Work is a time-bounded activity, dependent on route/access, materials, health, skills, actual attendance and available tasks. Long activities can be interrupted; partial completion must be retained without inventing finished work.
6. Record actual compensable work and any entitlement under the agreed terms, then settle from the employer's available funds or record an outstanding payable. Debit and credit must reconcile; do not create currency simply because a shift ended. Separate clean/dirty provenance according to actual sources, not character alignment.
7. Relevant learning and professional progress accrue from actual tasks and experience; permanent attributes use the approved age and natural-limit rules. Field mastery remains independent. A worker can change or leave an occupation; learned skills are retained.

Candidate record states: proposed, open, filled, withdrawn. Agreement states: offered, active, suspended, ended. These are design candidates, not implemented state machines. No numerical hiring score, tax rule, shift lengths or progression formula is finalized.

## 5. NPC autonomy and memory

- NPCs have individual goals, needs, available resources, knowledge, relationships and commitments. Work is one possible activity, not a universal forced schedule. They can rest, study, maintain relationships, seek alternative work, refuse requests and respond to new events.
- During a player activity, NPCs can pursue their own activities within the same elapsed world time. An actor cannot be simultaneously present in separate locations or spend a time interval twice. Travel, work and rest share the actor's time budget. No real-time background execution is implied.
- Use actual movement routes and locations; home anchors and shifts must be established before scheduling commutes. Unknown addresses do not authorize teleportation. A location's existence does not guarantee attendance or access.
- Keep observations and remembered events actor-specific; only actual observed or communicated information changes knowledge. NPCs do not see player choices, private attributes, balances or fund provenance automatically. Perception can help notice accessible clues, not reveal inaccessible information.
- A player's relationship with an NPC develops through actual interactions. Hero, Villain and Undefined starting connections remain subject to their approved relationship and access rules. Do not assign deep ties solely from this roster.
- The narrative describes resolved events and known information. It must not fabricate NPC intentions as player-visible facts, guarantee outcomes, or grant unearned wages or mastery.

## 6. Initial checks and open dependencies

Design-data checks executed for this increment: uniqueNPC=PASS, uniqueOrg=PASS, uniqueRoles=PASS, validLocations=PASS, validEmployer=PASS, wages=PASS, adultRoster=PASS, employmentCoherent=PASS. These checks validate the authored reference rows, not a working engine.

Pending implementation checks:
- [ ] NPCs can independently apply, accept, reject, work, rest, resign and seek new roles; no forced player cooperation.
- [ ] Vacancies and pay obligations respect employer funding and actual staffing needs; no double hiring or duplicate pay.
- [ ] Work and travel consume one consistent actor time budget; interruptions preserve partial results.
- [ ] Wages reconcile against employer funds/obligations and worker balances; no hidden provenance leak.
- [ ] Age, qualification, access and relevant skill checks are applied without arbitrary permanent class locks.
- [ ] Save/reload preserves employment, goals, work history, outstanding payments, memory and location.
- [ ] Professional tracks activate only after the player chooses work; field mastery continues independently.
- [ ] Player and NPC initialization reconciles households, location, attributes, resources and history before the first turn.

Next design increment: establish household/residence anchors as needed, actual staffing/shift and opening-state policy, initial resource budgets and economic flows for these organizations. Then specify time/activity resolution and progression. Do not expand geography unnecessarily or treat the initial named roster as the entire settlement.

No engine code, save data or runtime tests are included.
