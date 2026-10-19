# SIM-011 — Individual cognition, planning and learning

Agent: CORTEX-19. Depends on SIM-001 and SIM-002 (both independently verified). PR must remain unmerged until an independent reviewer and integrator authorize it.

## Game behavior

Each of the four existing named village residents has a persistent cognitive profile with five independently seeded 0–100 stats: intelligence, focus, creativity, empathy and patience.

- Intelligence expands planning horizon and increases learning from real, completed experiences. It never grants free food/materials or increases every success outcome.
- Focus affects work preference and sustained planning.
- Creativity influences local exploration.
- Empathy influences actual help and social choice.
- Patience adjusts rest tradeoffs.

Existing hunger, energy, hygiene, safety, social and comfort are survival needs, not personality or cognition. Existing diligence, kindness and independence are personality traits, separate from occupational role, skill and experience. Four knowledge channels (craft, land, community, survival) and four bounded practice counters are distinct from the legacy occupational skill.

Residents only learn from a verified outcome: a completed work product, actual surveyed movement, genuine support, or a performed recovery action. Merely thinking, planning, moving toward a worksite or receiving a divine suggestion earns no learning. Learning styles (practice, observation and reflection) add a modest contextual bonus, not a general score multiplier.

The planning trace names chosen goal, 1–4 planning horizon, confidence and up to three considered alternatives. All four existing utility candidates remain bounded; cognitive preference bonuses cannot overrule urgent safety, hunger or sleep choices.

## Compatibility and architecture

- New src/cognition.js: offline deterministic profile, utility weights, planning, sanitize and observation engine.
- src/choices.js: cognitive scores and bounded thinking in the existing choice record.
- src/living.js: create/restore resident cognition, remember plans and learn from real completed actions.
- build.py: bundle cognition before the choices and living systems for both browser and Android WebView.
- tests/cognition.test.js: nine focused tests, including 16 seeded worlds and long-run profile/history limits.

Profile data is optional plain JSON and retains the outer save format version 1 and existing offline save key. Older saves without cognition reconstruct valid profiles from world seed and resident ID without resetting Nim, inventory, towns, chapter milestones or world time. Invalid values, forged plans and oversized memory arrays are sanitized. Last plan and learned event histories are limited; knowledge and practice are capped.

Test command: node --test tests/*.test.js. Also run python build.py, offline Chromium acceptance and Android API 29 instrumentation for the exact PR commit. A failed CI run is not proof of completion; repeat after any correction.

## Scope limits

Only the four existing town residents run the new cognition loop. No physical phone RAM/heat/20-minute soak was performed (QA-004); emulator success cannot substitute for that. This does not implement full generational AI, social histories (SIM-007), inheritance (SIM-012), low-RAM population LOD (SIM-013), indoor living, cross-chunk planning or online language modeling. No merge to main and no claim of complete autonomous civilization.
