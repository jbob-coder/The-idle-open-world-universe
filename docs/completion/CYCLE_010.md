# Godseed completion cycle 010 — verified NPC regression group

Main inspected f75bdd14827bd6ea8555f6ca428132e91cff97c3; domain drafts #77–80 unchanged, #81 open. #103 latest reviews show proposed #104 injury effects and #99 private choice revision amendments, not approval. Existing owner documentation and peer gates remain.

## Result
Improved existing QA-only docs/completion/run_reference_checks.mjs in commit 91a93dcb0f298a244a40624d2a24779f185d3c0b, blob af46d5e8dbf2918a1c349e3700220e6e37fd5281. Exact committed readback equals locally tested Git blob. Added --npc-reference mode covering existing cognition, opportunity generation, planning and world checkpoint tests, with all eight required source inputs. Added explicit expected-case counts for these four tests and the two storage suites. Old runner would accept a shortened suite with a positive equal count and exit zero; now rejects a count different from its pinned expectation where configured. The remaining baseline suite counts are not pinned by this change. No change to original test bodies or game/reference logic.

## Actual native execution
Node v22.16.0, local partial source directory (not a full git checkout).
- --self-test: 10/10 PASS; original eight classification controls plus shortened count rejection and exact count acceptance.
- --npc-reference: 4/4 suites, 185/185 cases PASS, normal exit 0. Cognition 48, opportunity 53, planning 51, checkpoints 33. All eight input hashes matched the pinned main tree and no source change reported.
- --storage: 2/2 suites, 28/28 cases PASS, normal exit 0. Original durable store 20 and independent segmented adapter boundary 8. Five input hashes matched earlier verified blobs; no source change reported.
- --baseline: NOT_RUN, exit 2, 17 missing required paths, all 17 suites explicitly NOT_RUN.
Total current native run: 223 passing assertions across 10 runner controls and 213 existing reference/adapter cases. Only two new runner controls; 221 repeated tests, not new gameplay features. Counts are not a coverage metric. No native execution or scheduler suite added this cycle.

## Attempted source transfer and recovery
Fetched pinned executor and scheduler sources/tests through connector. Attempted compressed manual source transfer into container, but base64 decoding failed with excess padding before any executor source was written. Discarded failed transfer and did not execute unverified bytes. No claim that compressed transfer worked, no new missing paths resolved. Local runner updated instead, allowing repeatable partial verification with a single command. No remote data sent to external services.

## Limitations / next action
The runner does not prove that a count-matching suite contains correct assertions; it checks summary/exit and records pre/post source hashes, not trusted provenance on its own. Count pins need deliberate updates after reviewed test changes. NPC group excludes perception-only, knowledge validator, executor, scheduler and full integrated transaction tests. Storage is adapter verification, not whole-world rewind. No gameplay, Android, production save, peer branch, paid CI, forced termination or merge. Next: obtain complete verified local source set through legitimate authorized checkout or hash-verified transfer; execute remaining native reference suites. Do not repeat passing partial suites as progress unless a relevant change requires regression. Actual implementation still requires resolved D1–D8 and owner/affected peer review. No additional competing synthetic gameplay model created.
