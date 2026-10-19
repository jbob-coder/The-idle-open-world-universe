# SIM-007 — Personal journals, long goals and factual outcomes

BOT: CORTEX-19. Depends on verified SIM-002 (PR #33). Implementation is isolated from main and from the unmerged SIM-011 cognition PR #41.

## Visible gameplay

The offline Android GODSEED God-view now provides a touch-accessible Personal Journal selector below the named village residents. The player can inspect Elin, Rowan, Sera or Bram, including each resident's durable goal, ethical priorities, choice, reason, alternative, consequence and numerical impact. Selecting a resident never steps simulation time, moves a resident, grants an item or commands a character.

Each journal contains version 1, a personally derived goal with progress 0–5, three trait-based ethical values (care, duty, curiosity) and up to 12 recent observed life events. Ethical values modestly influence voluntary choices while urgent safety, hunger and sleep retain priority. Goals are skillful work, community relationships or surveying nearby land. Progress requires actual observed production/skill advancement, improved relationships, or exploration movement. No journal entry grants experience, materials or achievements by itself.

## Verified outcomes, not invented behavior

The independent pure module src/chronicles.js captures the resident's position, six relevant state/resource fields, skill and the selected relationship immediately before and after the existing simulated action. It stores signed before/after changes in the memory. Travel with no completed work never produces a fictional stock increase; attempted friendship without contact creates no fictional trust. If no tracked value changed, the impact explicitly says No verified change.

Human God suggestions never write memories of completed outcomes. The God can inspect and influence circumstances only. New learning and actual autonomous decisions remain governed by existing game rules.

## Save safety, CPU and memory

The game still stores save format version 1 under godseed-one-small-life-v1. An old save without journals receives empty but valid personal histories and retains Nim, the world seed, clock, story chapters, town stock, skills and relationships. An untrusted save is sanitized to 12 events per person, valid intents/moral labels, limited reason/consequence text, fixed numeric impact keys and bounded goal progress. No giant world array, network access, background timer or LLM is added.

The new module loads before choices and living in build.py and is used by Node tests and offline Android WebView alike. Rendering is via textContent to prevent saved text from injecting HTML or game commands. The selector has a minimum 44 px touch target.

## Evidence requirements

New tests: tests/chronicles.test.js — ten tests including 16 seeded worlds, immutable observation, v1 migration, bounded forged-data recovery, urgent-needs precedence and real versus imagined consequences. Browser: tests/living_world_browser_acceptance.py checks the journal, Rowan selection, save/reload and no time/person movement on inspection. Full regression: node --test tests/*.test.js; python build.py; offline Chromium; Gradle Android API29. Cite actual exact-SHA GitHub Actions and APK artifacts only after success.

This is not a complete generational social AI, mobile UI redesign or model-powered language system. Four village people have journals; the three lightweight travelers are not yet covered. SIM-011 (individual cognition) remains a separate in-review stacked PR and requires independent combined integration testing. Physical 2–3 GB Android PSS, battery, temperature and 20-minute soak remain NOT VERIFIED under QA-004. No main edits or unauthorized merges.
