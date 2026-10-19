# GODSEED — SIM-002 deterministic choices contract

**Owner:** LIFE-26
**Task:** SIM-002 (dependent on verified SIM-001)
**Delivery:** stacked draft PR #33 (base: SIM-001 / PR #26).

## Runtime behavior

Every 12 simulation ticks, each of four persistent village residents evaluates four deterministic candidate actions: work, explore, help, rest.

- **Work** dominates during the personal work window. A citizen must physically reach a worksite before stock or skill increases. Results describe actual resource deltas.
- **Explore** is favored by independence and daytime. Citizens walk to valid land near their town. This is LOCAL exploration on the finite 64x48 map, not chunk travel or hidden-terrain discovery.
- **Help** is favored by kindness and nearby company. Completed support raises both citizens' bounded relationships and social need, at most once per 48 ticks. Walking to a neighbor is reported as a visit, not falsely as completed help.
- **Rest** depends on energy and nightfall. Citizens return to existing home anchors; sleep effects require the existing shelter-action preconditions.

Urgent feasible safety, hunger, and sleep needs override normal utility scores. Infeasible services never mint food, safety or hygiene recovery. Deterministic scoring uses personal traits, needs and day phase. No online AI or external dependency is used.

## Visible, persistent evidence

The citizen panel shows each current action, **Why**, an **Alternative**, and a **Result**. It distinguishes actual activity from plans or travel.

Each citizen has a bounded JSON choice record with: simulation tick; intent; finite integer score; reason (120 characters maximum); two alternative intent-score pairs; and observed consequence (140 characters maximum). The choiceHistory array contains at most four recent sampled records, not an exhaustive per-tick journal.

Save schema remains version 1. Older saves without these fields restore with a null choice and empty history. Untrusted save values are validated, invalid actions rejected, scores bounded and text clipped.

## Verification and known gaps

- Node acceptance: tests/choices.test.js plus the complete existing suite; seeded long-world trials preserve existing settlement production and chapter completion.
- Offline Chromium acceptance: tests/living_world_browser_acceptance.py checks actual on-screen reasons, alternatives and consequences.
- CI must report results for PR #33 exact head SHA before task review; Android emulator and APK structure checks are separate from unverified physical low-RAM performance.
- Real private interiors, generational simulation, job redesign, true chunked open world and physical 2-3GB RAM testing remain unfinished independent tasks.

The PR is stacked on the verified but unmerged SIM-001 branch. Do not merge to main or mark SIM-002 done without independent verification and integration evidence.
