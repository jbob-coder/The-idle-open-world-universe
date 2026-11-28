# Fictional calendar and cosmic chronology — v0.1 review specification

Agent 01 cycle 002. Baseline f75bdd14827bd6ea8555f6ca428132e91cff97c3. Companion to [world integration contract](world.md). All dates below are synthetic QA data, NOT canon. Owner documentation gate and Agent 04 ring review remain pending. No runtime implementation, seed, NPC or save created.

## 1. Pure calendar boundary

Proposed calendar version gregorian-seconds-v1. Proleptic Gregorian civil calendar, fixed 86,400-second days, year 1–9999 inclusive, no leap seconds or DST in initial slice. Civil date is a strict six-integer record {year,month,day,hour,minute,second}, not locale text or OS Date. Tick is safe integer 0..315537897599 inclusive. Reject fractions, NaN, infinity, coercion, missing/extra fields, impossible dates and range overflow. Every date argument includes a time; no hidden default. A display formatter can render date without time but cannot discard the underlying instant. Weekday Monday=1 through Sunday=7, calculated as floor(tick/86400) mod 7 + 1; weekday schedules require this common convention. Date selection and current fictional time are independent of device timezone and clock. No canonical opening year selected.

Leap year: divisible by 4 except centuries not divisible by 400. Let a = year-1; D(year) = 365a + floor(a/4) - floor(a/100) + floor(a/400). Let P be sum of actual month lengths before selected month. Tick = (D + P + day-1)*86400 + hour*3600 + minute*60 + second. Inverse: integer divide by 86400, find largest year with D(year) <= day index via bounded binary search, subtract month lengths until remaining day fits, decode time remainder. Maximum 14 binary search iterations and 12 month steps; no unbounded loop. Reject rather than clamp overflow. Duration = integer tick difference; only authoritative coordinator may advance; a read-only date conversion never writes.

Proposed pure interfaces: toTick(civil), fromTick(tick), weekday(tick), anniversary(birthCivil, years), ageAt(birthCivil,tick), addSeconds(tick,nonnegativeDuration). Functions reject invalid input without mutation. Anniversary uses original birth date, not prior clamped anniversary; Feb 29 -> Feb 28 in a non-leap target year (engineering proposal). Preserve original birth hour/minute/second. At later leap anniversary Feb 29 returns. Age increments exactly at anniversary tick; before birth rejected. Reject anniversary beyond year 9999. Age validation 5–18 inclusive only for new playable starting character; NPC and subsequent life not restricted by this range. Initial ages do not imply invented date of birth: 02 supplies coherent reviewed date or tagged unresolved draft. No actor activation while required dates are unknown.

## 2. Golden calendar vectors

| Civil timestamp | Tick | Weekday |
|---|---:|---|
| 0001-01-01T00:00:00 | 0 | Monday |
| 0001-01-02T00:00:00 | 86400 | Tuesday |
| 1900-03-01T00:00:00 | 59931705600 | Thursday |
| 2000-02-29T00:00:00 | 63087379200 | Tuesday |
| 2000-03-01T00:00:00 | 63087465600 | Wednesday |
| 2005-06-15T08:00:00 | 63254419200 | Wednesday |
| 2017-06-15T08:00:00 | 63633110400 | Thursday |
| 2018-06-15T08:00:00 | 63664646400 | Friday |
| 2022-06-15T08:00:00 | 63790876800 | Wednesday |
| 2023-06-15T08:00:00 | 63822412800 | Thursday |
| 9999-12-31T23:59:59 | 315537897599 | Friday |

## 3. Milestone schedule and initialization

Proposed world record: calendar_version, opening_tick, first_character_id, first_birth_civil, cosmic_tick (anniversary 17), cosmic_origin_key, chronology_version. The immutable first-character chronology is outside the rewindable state; event occurrence/status and effects are inside it. Active snapshot carries only actual timeline history, future scheduled milestones, private RNG state and receipts. The cosmic event is universe-global and never scheduled again for a successor. An ordinary confirmed rewind before it restores pending event status, not a changed cosmic date. Identity/prehistory materialization is explicit and atomic; normal recovery never performs initialization or draws new randomness.

Milestone records: stable origin key (derived from world, actor or world scope, milestone kind, immutable anniversary tick and generation version), due_tick, actor_id nullable for universe-global event, status pending/resolved, resolution_ref nullable, causal refs. Origin key is stable across epoch replay; per-epoch event receipt ID unique, with canonical source identity retained. No duplicate pending record or resolved receipt for the same milestone in an active timeline. Resolved statuses include applied, failed chance, ineligible, already acquired, or prehistory-equivalent actual documented result; 03 determines natural awakening eligibility and outcomes. Never invent success, redraw or auto-awaken all eligible actors. No distribution/probability defined here. For older NPCs already past 18 when cosmic occurs, natural awakening eligibility remains explicitly unresolved; do not retroactively invent pre-phenomenon powers or grant them at cosmic date. Resolve with 03 before activation.

Chronology states:
- opening < cosmic_tick: schedule phenomenon; no phenomenon-derived effects or ability acquisitions in prehistory.
- opening == cosmic_tick: process milestone exactly once in atomic world initialization before first player-facing choice; no fictional elapsed time added for initialization.
- opening > cosmic_tick: require coherent authored or simulated prehistory record and actual effects at original date, not a delayed event at opening. Same applies to age-18 natural awakening when due before opening; provenance distinguishes authored initialization vs observed information.
- If opening equals actor's eligible 18th anniversary, resolve once at entry. If before, schedule; if after, require prehistory eligibility/outcome. If already has a core ability, record skipped/ineligible result, not a second grant. If 03's required rules are not reviewed, block affected activation rather than assuming probability or result.
- Succession keeps immutable cosmic date and world seed; no character-creation wall time. New character birth chronology must be coherent with existing world; successor may not change historic event. Exact successor activation rules are separately reviewed.

At a due tick, settle elapsed phases, then process event prerequisites and domain effects atomically with scheduler/knowledge. Pending same-tick events are drained before offering new player decisions; a technical processing budget may retain an admitted session, but must not expose a new choice against half-settled state. Events at tick equal to current clock must be handled once through approved initialization or already-admitted session, never from read-only view. Natural milestone depends on established phenomenon and 03 eligibility. Stable RNG origin for milestone, resolved receipt and draw evidence committed atomically; failure or stale CAS does not consume draw. On rewind, same logical milestone and restored causal state use same origin and deterministic draw, not epoch ID. Other domains may change eligibility by real prior actions; no forced identical outcome if inputs genuinely differ.

## 4. Synthetic chronology scenarios

Fixture first birth: 2005-06-15 08:00:00, cosmic at 2022-06-15 08:00:00 (63790876800); natural age-18 boundary 2023-06-15 08:00:00 (63822412800). Distinct hypothetical opening cases for the SAME fixture timeline; never create multiple live worlds. A start one second before 17th birthday is age 16.

| Case | Opening tick | Age | Cosmic requirement | Natural milestone requirement |
|---|---:|---:|---|---|
| C01 | 63412185600 | 5 | pending | pending |
| C02 | 63790876799 | 16 | pending, due +1s | pending |
| C03 | 63790876800 | 17 | resolve at entry | pending |
| C04 | 63790876801 | 17 | prehistory | pending |
| C05 | 63822412799 | 17 | prehistory | pending, due +1s |
| C06 | 63822412800 | 18 | prehistory | resolve once if eligible |
| C07 | 63822412801 | 18 | prehistory | prehistory result |
| C08 | 63854035200 | 19 | prehistory | reject as first-character starting age |

C09: leap birth 2004-02-29 08:00:00 -> proposed age-17 anniversary 2021-02-28 08:00:00, age-18 2022-02-28 08:00:00, age-20 2024-02-29 08:00:00. No annual clamping drift. C10: successor creation must preserve cosmic origin and tick regardless of successor birth. C11: same-tick event, partial travel and NPC work commit exactly once; technical recovery and canceled UI leave clock unchanged. C12: snapshot immediately before cosmic -> cross milestone -> confirmed rewind -> same origin and preserved external judgement; exact retry of committed rewind never increments counter twice. C13: opening after cosmic with missing prehistory fails closed. C14: age-18 evaluation already resolved, reopening must not reroll. C15: actor acquired meteorite core before age 18 -> no second core; receipt records eligibility outcome. C16: aged NPC whose 18th birthday preceded phenomenon requires explicit reviewed 03 rule, cannot assume awakening at any date. C17: invalid birthday or age-range overflow blocks initialization. C18: same-tick technical budget exhaustion does not allow early player choice or duplicate effect. C19: failed domain validation or storage CAS leaves RNG and milestone pending status unchanged. C20: date formatting and weekday scheduling are invariant across OS timezone.

## 5. Verification and implementation gate

Design arithmetic executed in Python 3 standard-library environment, not repository JS runtime. Independent integer formula compared to datetime over all 146,097 days in Gregorian cycle 1600-01-01 through 1999-12-31 at midnight; all matched. Separate inverse binary-search model round-tripped all 146,097 days at 23:59:59, compared to Python date ordinal arithmetic; all matched. Eleven golden date/tick/weekday vectors generated and checked for tick parity. Ten invalid integer cases rejected (years 0/10000, invalid 1900 leap day, April 31, month 13, hour 24, minute 60, second 60, ticks -1 and max+1). Eight opening tick numbers computed with same formula. This is mathematical fixture validation, not production API tests or verified milestone scheduling. The Python experiments were ephemeral; exact formula, limits and golden vectors recorded here for reproducible implementation tests. Type-shape rejection and C01–C20 gameplay/chronology acceptance are NOT RUN. No historical Node or Android test rerun.

Required peers: 02 birthday data/weekday schedules/age-derived conditions; 03 eligibility and once-only milestone receipts, including older-at-phenomenon actors; 04 initial age/chronology projection, no premature choices, no hidden result disclosure. Agent 04 ring review and applicable owner documentation approval precede gameplay implementation. Next: pure JS calendar module/test fixture after gate; independent domain schema work if gate remains pending. No source implementation in this change.
