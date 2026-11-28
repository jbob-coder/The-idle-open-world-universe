# Critical fields and branch boundaries

Initial observed snapshot 2026-11-27; recheck heads each cycle. This is a routing register, not a claim of acceptance or implementation.

| Domain | Development PR | Cross-domain sensitive fields | Consumers |
|---|---|---|---|
| 01-world | #77 | Clock units, actor/route IDs, world/epoch/revision, atomic commits, RNG, population admission, save/rewind and external judgement. D1/D2/D7. | 02, 03, 04 |
| 02-npcs | #79 | Actor/profile IDs, biology, memory provenance, scoped knowledge, relationships, funded economy and reservations. D3/D4. | 01, 03, 04 |
| 03-abilities | #78 | Ability IDs, hidden-condition boundaries, acquisition eligibility, effect primitives, RNG/clock, health/progression interfaces. D5. | 01, 02, 04 |
| 04-narrative | #80 | Prepared choice IDs, Continue idempotency, scoped views, preview/receipt fields, second-person output and native UI contracts. D6. | 01, 02, 03 |

Source: main `docs/AGENT_COORDINATION.md` at aa94828b21bf77e33b5db43f1d0fd93a3eb01f99; [readiness #103](https://github.com/jbob-coder/The-idle-open-world-universe/issues/103). D8 routine human approval removed. D1–D7 require current technical verification; no blockers are closed by creating this exchange.

Notify affected peers before incompatible changes to IDs, units, schemas, serialization, command/receipt semantics, authorization, visibility, effect order, invariants, migration or ownership. Report compatible additions when consumers need to know. Report actual path/symbol and old/new contract version, affected callers, migration/rollback, tests and owner. Do not expose secrets.
