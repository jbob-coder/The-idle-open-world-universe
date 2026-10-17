# Exact handoff state (2026-10-17)

Repo: `jbob-coder/The-idle-open-world-universe`.
Authority: `feat/skyview-zoom-v0.4` is last running code baseline, atop `feat/living-world-divine-v0.3` and `feat/autonomous-adventure-v0.2`. This prep branch is **documentation + source asset preparation**, not gameplay integration.
Open PR stack when prepared: v0.2 PR #1 into main; v0.3 PR #2 into v0.2; v0.4 PR #3 into v0.3. Create new implementation PR based on this prep branch; avoid cross-branch cherry-pick duplication or merge to main without review.

**Observed functional baseline:** world 64x48, canvas cell 16 px, terrain IDs 0–10, three NPCs and their roles, divine powers and Faith economy, v0.4 24x15 default / 16x10 / 32x20 camera, save identity `godseed-one-small-life-v1` and schema `version:1`. Existing debug APK build is experimental; Android device installation not confirmed.

**User's most recent art direction:** "Higher and more detail better detail with pixel squares". Accordingly shift the default to a **higher 32x20** sky view with richer **individually square pixel tiles**, leaving close-inspection modes. No isometric perspective, no low-resolution wash without features, and no smoothing.

**New prep materials:** root `AGENTS.md` instruction for Codex; specifications, work list, palette, pixel starter atlases, concept illustrations and asset manifest. Starter PNGs are *not wired to the existing renderer yet*. Do not claim implementation done merely because they are committed.

**New owner storage directive:** planned 1 GB meaningful installed core content, plus up to 5 GB extra opt-in managed persistent storage (nominal 6 GB total), **not RAM**; current APK remains tiny and quota isn't implemented. See `docs/STORAGE_BUDGET_AND_PACKS.md` / `config/storage-budget.json` and five additional S01–S05 tasks, raising work to 30 total.

**World foundation extension:** Eight named regions are now specified in `data/world-regions.v1.json` and `docs/WORLD_REGION_BLUEPRINT.md`; these are future metadata and activities rather than current playable areas. `docs/GAMEPLAY_FOUNDATION.md` specifies the core vertical slice. `work-items/world-foundation-tasks.json` adds 15 TODO items (F01–F05 and W01–W10), for **45 total** planned tasks. The current map remains 64×48 and the existing two village/shrine sites must be preserved.

**First five steps for Codex:** verify baseline; plan camera semantics; implement high-sky default and transforms; verify landscape touch/screenshots; commit evidence. Then perform subsequent 5-task slices per plan.

**Known release blockers:** No stable production keystore in repository; CI debug signing is ephemeral; no confirmed device tests for new rendering. Keep QA reporting honest.

**Expected user deliverable:** browser screenshots at specified viewports, tested source and optional debug APK CI artifact. Do not call screenshots Android screenshots unless from actual Android capture.
