# Godseed completion cycle 008 — native NPC reference verification

Main inspected f75bdd14827bd6ea8555f6ca428132e91cff97c3; #81 open; domain #77–80 heads unchanged. Read #103 latest comments: other independent peers preparing initialization, social data, choice/receipt and wage-rate proposals. Review gate remains. No duplicate synthetic models or requests for approval posted this cycle.

## Source acquisition and execution
Direct git ls-remote still fails DNS (Could not resolve host: github.com). Used the working GitHub connector to fetch five exact files from pinned main, transcribed into the existing local partial QA source directory, checked all Git blob hashes before execution:
- tools/npc_cognition_reference.mjs fa6fbada18f89efa10f013dccd66f49d226ae697
- tools/npc_perception_reference.mjs 4c88ddae030ef307f0a63c186756c13770762595
- tools/npc_opportunity_reference.mjs 2bb3402fe3f589d53604fd5d99c5c8657ef11ddf
- tools/check_npc_cognition.mjs 4925f6242159e987a7f22c8e43ef38125310a237
- tools/check_npc_opportunity.mjs 9c5bd421bfa7e6b7a9b112562f6da9e810695d50

All five local hashes matched exactly. Actual Node v22.16.0, Linux, standard module loading. Commands:
- node tools/check_npc_cognition.mjs: 48/48 PASS, exit 0.
- node tools/check_npc_opportunity.mjs: 53/53 PASS, exit 0.
Total 101/101 native existing reference cases, now independently verified natively (prior coverage in cycle 001 was V8 isolate). Not new gameplay tests, no new NPCs activated. These suites cover risk/goal preferences, refusal, evidence scoping, contextual opportunity generation, explicit capacity rejection and input immutability.

Cycle 007 runner --baseline preflight rerun: NOT_RUN, exit 2, 20 missing required paths (previously 25), all 17 suites not run in that invocation. Local source set is partial, not a clean checkout. Do not count full baseline as executed.

## QA-K02 isolated native candidate regression
In separate temporary local directory, copied the five verified source files, then changed only perception projection:
as_of_tick:lastTick,revision:list.length
to
as_of_tick:list.at(-1)?.tick??0,revision:list.length
Candidate source blob 23a528bb6efae6b111700b5394279e1684764bd8. No changes to original local baseline or peer runtime.
Native Node cognition 48/48, opportunity generation 53/53, both normal exit success. Three additional targeted assertions via node --input-type=module and node:assert/strict:
1. Two W worlds both ingest same direct observation at tick 10 witnessed by A; only hidden world ingests private direct observation at tick 20 witnessed by B. Assert deep equality of A's actor-bound narrative packets.
2. Assert B's authorized own evidence watermark is 20.
3. Restore standalone perception checkpoint of hidden world; assert A's narrative packet unchanged.
All 3/3 passed, normal exit. Total candidate 104/104, of which 101 repeat existing tests under modified perception projection and three test the isolated candidate directly. The candidate is NOT an approved or applied runtime patch. Standalone restore is not integrated journal compatibility. Cycle 003 demonstrated original same-version journal rejects under candidate; keep versioned compatibility review and do not apply in place. Existing world checkpoint suite has documented conflicting global watermark expectation and is NOT_RUN this cycle. Integrated transaction, SQLite full regression and Android NOT_RUN.

## Result and remaining work
No domain gameplay source, other agents' branches, main, actual saves, CI or production state modified. No forced process termination. No new production design choice authorized. Native test execution reduces the gap between isolate and actual Node evidence; it does not close D3 initialization or #103 review gate. Next: use the verified native partial source set to extend actual planning/execution/checkpoint tests when feasible, and prioritize D1–D6 review/owner documentation acceptance over additional detached models. No full baseline or release claim.
