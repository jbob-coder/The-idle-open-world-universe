# Godseed completion cycle 004 — local economic acceptance oracle

Status: independent QA fixture for GS-SLICE-01, not accepted production specification or gameplay. Continuation of CYCLE_003.md; reserved on PR #86 comment 7231092756. Main inspected f75bdd14827bd6ea8555f6ca428132e91cff97c3. PR #81 open; domain drafts #77–80 unchanged at earlier pinned heads. New QA PRs #92–95 cover clock, decision feedback, rewind and provenance; do not duplicate them. Documentation-first and peer review gates remain.

## Source and design scope
- Main docs/LOCAL_LIFE.md blob dd53a8762380708d9e8a209249bb1f90a1f3a101: actual labor earns an obligation, funded payment separate; household and organization balances reference-only. NPC-0003 Eli has 360 CR/30h = 12 CR/h as a reference rate, not a live agreement.
- #79 docs/contracts/npc-life.md at b51c461d05ee2a0b4b3886147f4120f1a8d2e270, blob 50e98c372e479a6f369ffb5cdeb649833eb488e3: proposed integer currency, funded stock transactions, separate obligation, provenance lots and atomic effects.
- #80 data/narrative/local_interaction_draft.json at 04ec522a2ee541a843234f3ea1fa0c01216c42b2, blob 75de31ea580fafaaf5b44f44f3a60899082d66df: I-006 purchase and I-010 work remain inactive. Related GS-SLICE-01 A03/A04 and XS-05/06.
- Clock milliseconds (see #92), 100 subunits/CR, floor plus exact carried remainder, synthetic rates/stock/prices/accounts are review conventions, not approved production rules. No real NPC activated, no player origin chosen, no canonical economy initialized.

## Executable artifact
docs/completion/check_local_economy_oracle.mjs, commit de00447a60de6f13f85f41e0788006ca815f7fd4, blob e5b52503b7e17bd0c9dcd657bddcdb2357dbcfd9.
Run from root: node docs/completion/check_local_economy_oracle.mjs (Node CLI NOT RUN this cycle).
Actual execution: V8 isolate via new Function with exact authored source and captured console; no imports or mocked domain outcomes. First test initially failed due to an incorrect expected fractional remainder. Corrected expectation: 10001 ms * 1200 subunits/hour = 12001200 numerator; floor division by 3600000 = 3 whole subunits and remainder 1201200. Reran all 16 cases successfully before commit; exact committed readback matched and rerun 16/16. These are tests of a synthetic specification model, not the existing engine or V2 implementation.

## Acceptance evidence
1. Same actual labor split into seven irregular intervals yields same accrued wages and remainder as uninterrupted work.
2. Breaks do not generate wages.
3. Unauthorized work and out-of-transaction interval rejected.
4. Overlapping compensable work rejected atomically.
5. Actual labor creates entitlement, not cash.
6. Partial funded payment retains the unpaid entitlement and original lot.
7. Full-only policy rejects partial or unfunded settlement.
8. Funded full settlement clears entitlement.
9. Purchase changes real fixture stock and preserves clean/dirty origin lots.
10. Missing stock, stale price or missing authorization rejects.
11. Unfunded or duplicate-lot payment rejects.
12. Concurrent worker labor, player purchase and wage settlement in one staged transaction commit together with one clock and revision.
13. Late stock rejection discards earlier staged work/payment and clock advancement.
14. Exact command retry after subsequent commit returns unchanged current state; changed payload rejected.
15. Duplicate effect receipt in a new command rejected.
16. Stale revision and clock rejected.
Each negative probe also compares original state bytes for mutation. Tests use one worker, employer, buyer, shop, stock type and fixed agreement; no real-world services or transactions.

## Limits and decisions for review
The oracle is deliberately not a reusable production reducer. It trusts synthetic authorization and effect order, does not authenticate receipts or resolve actual work/service eligibility, and uses one actor-specific lastEnd, one fixed agreement and one stock type. It does not implement separate due dates, multiple agreements, cancellation/rounding of a final residual, external sources/sinks, bank/tax/estate, stock delivery, scope/hidden data filtering, RNG, persistence or epoch/CAS. Exact retry only proves unchanged state, not original scoped result receipt reconstruction. The late-stage failure case is an invalid staged bundle, not proof that a valid independent NPC interval should be rolled back merely because the player legitimately declines or fails an action; 01/02 must distinguish actual unsuccessful outcome from invalid technical stage. Neither full-only nor partial settlement is selected for production. Unit conventions and receipt IDs remain subject to reviewed shared interfaces. No runtime Node/SQLite/Android acceptance, no production performance claim, no paid CI, no peer code modification.

## Next actionable step
01 and 02 review precise money/interval/receipt envelope and obligation handling; 04 review receipt-backed narrative and sanitized purchase/wage previews without revealing private financial provenance. Bind these invariant cases to the actual reviewed reducer and authoritative transaction path, then use approved local initialization and route/eligibility data to execute real multi-day player + NPC gameplay. Keep model and engine results separate. No merge or self-approval.
