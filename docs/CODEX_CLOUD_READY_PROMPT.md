# GODSEED — FINAL COPY/PASTE PROMPT FOR CODEX CLOUD
**Save this prompt and submit it in Codex Cloud when the preparation branch is selected.** You are to implement the unfinished game-visual/Android work, not write another general plan. Read source files and execute the plan with evidence.

## Your mission
Work in repository `jbob-coder/The-idle-open-world-universe`, starting from **`prep/codex-skyworld-v0.5`**. Create branch **`feat/godseed-medieval-skyworld-v1`** from that exact preparation branch. Do not implement on `main`; PR chain is v0.2 (#1) → v0.3 (#2) → v0.4 (#3) → preparation (#4). Your new PR should initially target preparation, not bypass the stacked branches.

The goal is a **finished, detailed medieval-fantasy living-world visualization** for an **offline, low-end Android god-simulation** called GODSEED. The camera must feel **high overhead/normal sky POV**, entirely 2D, and show **crisp individual square pixels**. Its default view is **32×20 tiles** (logical tiles remain 16×16), with optional 24×15 close and 16×10 inspection zoom. Make Nim, three NPC professions, wildlife and world locations readable at all scales. Terrain should include deterministic detailed forest, roads, water edges, villages, camps, flowers, fences, runes and ruins using small original sprites, not a painted or 3D background.

The **player is a god**, not Nim. Nim and other inhabitants stay *autonomous, deterministic, offline*, and retain their own goals, survival decisions, encounters, skills, inventory and progression. The god can inspect, bless, gift food, bloom, guide, lightning/storm and inspire travelers using Faith. No direct player movement, no attack joystick, no NPC puppeteering. Divine interactions require visible selection/validity, low-cost pixel FX, text outcomes, correct Faith accounting, and visible world/NPC consequences with no duplicate rewards.

## Added owner requirement: 1 GB core + optional 5 GB

Treat the planned final game as **1 GB core installed content** plus **up to 5 GB extra optional app-managed persistent storage**, nominal **6 GB total**. This is disk, **not RAM**, and is currently NOT implemented. Preserve offline core-only play and do not artificially pad the APK. Optional packs require explicit user consent, free-space margin and safe removal. Complete **S01–S05** in `work-items/storage-tasks.json` as a sixth five-task batch in addition to the original A01–E05. Total planned implementation tasks: **30**. Use `docs/STORAGE_BUDGET_AND_PACKS.md` and `config/storage-budget.json` as source of truth. Validate limits, transactional updates, backups and device storage measurements; label unsupported functions as blocked, never as done.

## First: understand and verify
Read, in this order:
1. `AGENTS.md`
2. `docs/CODEX_HANDOFF.md`, `docs/HANDOFF_READINESS.md`
3. `docs/GODSEED_INTENDED_GAME.md`
4. `docs/ANDROID_HTML_APK_SPEC.md`
5. `docs/SKYVIEW_VISION.md`, `docs/PIXEL_WORLD_STYLE_GUIDE.md`
6. `docs/ARCHITECTURE_CONTRACTS.md`, `docs/DIVINE_INTERACTION_SPEC.md`
7. `docs/ASSET_PIPELINE.md`, `assets/asset-manifest.json`, `assets/PROVENANCE.md`
8. `docs/IMPLEMENTATION_SLICES.md`, `work-items/codex-tasks.json`, `docs/PERFORMANCE_BUDGET.md`, `docs/TEST_PLAN.md`
9. `src/sim.js`, `src/ui.js`, `index.template.html`, `build.py`, `android/build_apk.py`, existing tests and workflows.

**Run the baseline before editing:**
```bash
node --test tests/*.test.js
node scripts/validate_asset_manifest.mjs
node scripts/generate_starter_assets.mjs
git diff --exit-code -- assets/generated/
python build.py
```
Report blockers if a tool is not available. Do not skip evidence and pretend the result passed.

## Architecture decision
**Keep the gameplay engine in JavaScript and Canvas2D inside an HTML/CSS interface.** HTML is the UI; JavaScript is Nim's AI/world logic; Canvas is the pixel map. Android currently packages a self-contained offline HTML document inside a WebView using an **experimental SDK-free DEX/APK builder**. This works as a design approach but existing APK structural tests do not prove phone launch.

Prefer modular, testable Canvas rendering. Implement offline atlas loading from `assets/generated/` and upgraded original artwork; correctly package **all artwork** for both the browser preview and APK. Avoid new runtime network dependencies, huge art textures, GPU-heavy blur, CDN fonts, external SDKs, Unity or a Godot rewrite. Preserve the offline self-contained HTML preview or provide a tested equivalent; respect `build.py`'s existing `/*SIM_SOURCE*/` and `/*UI_SOURCE*/` replacement contract when refactoring.

**Android packaging:** first keep the existing experimental builder functioning through regression checks. Then evaluate a conventional, pinned **Gradle/Android SDK WebView host** as a *separate migration step*, not a surprise untested replacement. Implement that step only if the environment/tooling permits building and verifying it. If it doesn't, report it as deferred/blocker. If adopting `WebViewAssetLoader`, implement/test a way to preserve/export/import existing file-origin localStorage, because the storage origin changes. Restrict WebView to packaged content, keep JS/DOM storage appropriately configured, prevent network access and maintain safe application lifecycle. Do not commit a keystore or claim signed release continuity.

## Implement 25 original tasks in five visual/core slices, then 5 additional storage tasks (30 total)
**A — Camera:** 32×20 higher default, near/inspection modes, integer transforms and follow, crisp scaling, tests/screenshots.

**B — Detailed square-pixel world:** use the original 11×3 terrain starter atlas, deterministic roads/shore edges, layered props, villages/shrines/ruins/camps, cached invalidation and bounds. Improve assets where the starter is insufficient; record changes in the manifest.

**C — Characters:** 2D Nim animation in four directions, visible occupation equipment for Ira/Toren/Mera, wolves/boars as actually simulated, foot-Y sorting/occlusion and autonomous goal feedback.

**D — Divine interactions:** targeting validation and high-contrast highlights, inexpensive animated symbols for powers, one-time Inspire reaction per NPC role, no duplicate effects, accessible/reduced-motion alternatives.

**E — Android & release evidence:** compact safe-area HUD, browser and save regression, build + signature/manifest QA, actual Android QA when device access exists, PR, screenshots, APK artifact SHA and work ledger. **Do not silently mark hardware testing complete when only running Chromium.**

For precise A01–E05 task acceptance read `work-items/codex-tasks.json`. Change a task from `todo` to `done` only with a committed code change and reproducible test/screenshots.

## Invariants to preserve
- `src/sim.js` is authoritative for state transitions, not the renderer.
- 64×48 world, tile IDs 0–10 and walkability semantics unchanged unless explicitly migration-tested.
- Existing save localStorage key `godseed-one-small-life-v1`, `version:1` and JSON import/export preserved across browser and Android builds.
- God influences rather than controls inhabitants.
- Offline app, no permissions beyond what is required, no hidden network/telemetry.
- Maximum 3 baseline travelers and bounded wildlife unless old-device benchmarks justify scale increase.
- No publishing or merging `main` without the owner's approval. No exposed signing material.
- Treat reference SVG concepts as artwork, **not actual game screenshots**.

## Tests and proof
Run and report exact outputs:
```bash
node --test tests/*.test.js
node scripts/validate_asset_manifest.mjs
python build.py
python tests/browser_smoke.py
python tests/mobile_acceptance.py
python tests/capture_android_layouts.py
python android/build_apk.py
python tests/test_android_package.py
```
Adjust zoom-dependent acceptance fixtures for the deliberate 32×20 default. Add rendering/atlas/touch and save-compatibility coverage; simulate >=10,000 ticks, ensure no Faith exploits or unbounded loops; confirm no runtime network fetches. Test at 640×360, 720×400 and 960×540 in *all three zoom levels*. Prefer Android device/ADB verification if available, record model/version/FPS/memory/battery and 20-minute unattended simulation. When unavailable explicitly say `PHYSICAL ANDROID QA: NOT VERIFIED`; an APK ZIP test or browser screenshot cannot prove physical launch.

## Output contract: do not stop at planning
1. **Code:** integrated high-sky pixel world, sprites, FX and compact Android UI, running from repository sources.
2. **Assets:** updated original atlas PNGs and machine-readable manifest, generator repeatable.
3. **Evidence:** actual Chromium screenshots with exact viewport sizes and, separately if tested, *real Android* screenshots. No conceptual art misrepresented.
4. **Build:** offline HTML, experimental verified debug APK; optionally a separate verified maintained Android Gradle build if tooling supports. APK SHA256, manifest/signature, CI artifact links.
5. **Quality:** existing and new tests, before/after perf measurements or explicitly unknowns, save migration and network-free check.
6. **Documentation:** PR, task ledger updated with evidence, known limitations, outstanding hardware checks, new 5-task follow-up.
7. **Report:** branch/commit, what passed, what did not, exact links and whether installation on an Android device is verified.

Finish by creating a reviewable PR into `prep/codex-skyworld-v0.5` (or the correct new agreed base if PR #4 was already merged). **Never claim that the full game has been implemented just because the preparation documents/assets exist.**

## Prioritization when tradeoffs arise
Stable offline gameplay > save continuity > autonomous decision-making > legible terrain/characters > divine clarity > decoration. Optimize first; avoid switching engines without evidence. Do not request repeated approval for small documented decisions. Mark external hardware or credentials as blocked rather than inventing them.

Start with baseline verification and Slice A, then continue through each tested slice until finished or a concrete blocker requires owner action.
