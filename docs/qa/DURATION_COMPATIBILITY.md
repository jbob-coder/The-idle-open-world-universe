# D1/D2/D4 — Duration compatibility review
Status: independent review proposal, inactive. Baseline main f75bdd14827bd6ea8555f6ca428132e91cff97c3; #82, #92, #103, #99, #96. No shared registry change, domain approval or gameplay authorization. Legacy V1 ticks are abstract, NOT established seconds; paired tests explicitly assume one tick = one second for comparison only.

## Verified findings
Actual V1 executor blob 835fcafba4fb566001b743e1c028c5cb689bcecb: 10-tick activity interrupted at 5 grants 5 units at rate 1. Naive 10000-tick activity interrupted at 5000 grants 5000. Fractional per-tick rate 0.001 rejected; phase duration >1000000 rejected, so 1800000ms half hour cannot be represented under that cap. The latter is a representational limit, not a measured performance limit. Restored checkpoints reproduce both credit values. Actual opportunity/cognition blobs 2bb3402fe3f589d53604fd5d99c5c8657ef11ddf/fa6fbada18f89efa10f013dccd66f49d226ae697: +10 tick freshness changes a work decision at equal hypothetical physical age after naive migration. See #82 comment 7231431144. No shipped gameplay defect is claimed.

## Candidate shared duration contract
Use private versioned Gregorian millisecond instant (0..315537897599999) if accepted by 01/02/03/04. Duration is nonnegative safe integer milliseconds; recurrence/review delays positive, elapsed interval ordered and bounded. Instants and durations are different types. Reject overflow/future observation and unknown versions. No second clock and no per-millisecond loop. Boundary queue remains event driven. All persisted fields and definitions carry a versioned unit via schema/envelope, not per-call guesses. No universal interpretation of old tick data.

| Consumer | Current V1 behavior | Required reviewed definition |
|---|---|---|
| Opportunity generator | newest+10, inclusive expiry | explicit evidence/action-specific freshness duration, distinct from actual availability and permission; history is retained |
| Cognition | wait hint now+1 | positive configured review hint; not forced polling |
| Planner | nextReview=receipt.tick+1 | configured retry/review delay with material-change policy; preserve actual receipt and eligible credit |
| Scheduler | due.interval recurrence | explicit physical cadence and event triggers, busy actor handling and bounded work; V1 does not directly consume cognition wait hint |
| Execution | integer duration <=1000000, credit_per_tick | reviewed physical phase limits separate from technical budgets; exact rational domain rate and remaining work cap; no arbitrary phase splitting or repeated side effects |
| Travel | draft mm/s | elapsed milliseconds, checked carry tied to route/leg/activity, exact arrival, no teleport |
| Wages | #96 candidate minor units/hour | denominator 3600000 for ms; carry owned by approved agreement/accrual stream, not UI or generic execution; actual payable distinct from payment |
| Thermal transfer | draft mJ/s | exact rate with 1000 denominator, contact/equilibrium/cap checks, separate physical state |
| Perception | observed/acquired ticks | preserve chronology and evidence scope; convert only when source unit defined; freshness does not delete history |
| Persistence | adapter_version exact, V1 journal replay | never reinterpret V1 bytes; new versioned adapter + reviewed migration or separate isolated fixture |

Use BigInt intermediates for integer rational rates, checked JSON-safe outputs and stored remainder. In companion fixture, credit rate is integer units per second, denominator 1000; remainder discarded at a finished activity cap only. This is a synthetic activity credit policy, NOT a wage settlement policy. General rates require explicit numerator, denominator, dimension, scope, eligible elapsed interval and terminal remainder policy per domain. Actual progress depends on committed eligible work, not generic elapsed time. No credit in unavailable or interrupted intervals after the boundary. Keep accrual and terminal cumulative totals distinct. Changing a unit cannot change event ordering, costs, causality, earned totals or evidence age at the same physical instant. Do not add unreviewed gameplay constants; 10s TTL and 1s review delay are paired test values only.

## Migration and acceptance
1. Record actual source unit and semantic mapping per field; if legacy source unit unknown, fail closed for physical conversion and preserve V1 read/replay. Never multiply all numeric fields; IDs, revisions, counters, costs, caps, progress and RNG indices are not time.
2. Version new schemas/adapter and definition rates. Verify historical source under original adapter, then convert a separately staged snapshot only when mapping known. Convert all absolute times, relative durations, queued/active boundaries and provenance times coherently. Validate causal order, carry/credit conservation, expiry endpoint and source identity. Keep original bytes intact. Do not silently switch adapter or regenerate seed.
3. Compare equivalent physical instants and interval partitions, exact retry/reopen, stale/foreign scope, final calendar overflow, scheduler recurrence count, event order, same-boundary interruption and cost/credit invariance. Verify native Node/SQLite and later Android parity. Existing test companion runs actual pinned V1 functions plus synthetic arithmetic/cadence oracle; 20/20 V8 isolate checks before commit and exact committed readback. Node CLI NOT RUN this cycle. No actual scheduler migration, V2 checkpoint, native store, domain receipt or production clock implementation.
4. M1-A uses only reviewed duration values and typed rates. No named NPC activation, canon change, owner review waiver or merging. 01 proposed designated clock editor; 02 life/knowledge/plan, 03 phase/progression, 04 prepared-choice validity and scoped display must accept or counterpropose before adoption. D1/D2/D4 remain OPEN.

Companion: docs/qa/check_duration_compatibility.mjs, commit 0b10a9413c8b78834400f1bd319fd9d2ccb1cb0d, blob 72838ce117320447f33e538c5cb5046fad527bf7.
