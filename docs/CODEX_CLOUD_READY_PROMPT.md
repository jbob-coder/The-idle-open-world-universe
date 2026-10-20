> **SUPERSEDED / DO NOT USE AS A NEW AGENT PROMPT (2026-10-20):** This historical 2D Canvas Codex document is not current product authority. Older bans on 3D and required 16×16/16×24 top-down-only view are scoped to legacy assets; the current goal is 3D Pixel Squares autonomous societies. Consult [authoritative correction](https://github.com/jbob-coder/The-idle-open-world-universe/blob/docs/godseed-agent-task-governance-v1/docs/PROJECT_AUTHORITY_AND_REFERENCE_STATUS.md) and the live task board.

# GODSEED — FINAL COPY/PASTE PROMPT FOR CODEX CLOUD
**Save this prompt and submit it in Codex Cloud when the preparation branch is selected.** You are to implement the unfinished game-visual/Android work, not write another general plan. Read source files and execute the plan with evidence.

## Mandatory square-pixel art rule — no exceptions without owner approval

The owner explicitly requires **PIXEL SQUARES**, including the terrain, buildings, roads, water, creatures, character silhouettes, divine FX and Android UI. Use `docs/PIXEL_WORLD_STYLE_GUIDE.md` as the **binding art bible**, `config/pixel-art-contract.json` for machine-readable constraints and `docs/PIXEL_ART_ACCEPTANCE.md` for visual acceptance evidence. Pixel sources must be native 16×16 terrain and 16×24 actor frames, small controlled original palettes, binary alpha edges, deliberate pixel clusters, and nearest-neighbor no-smoothing Canvas2D scaling. The higher overhead 32×20 default is NOT an isometric or painted background. Build richer medieval areas by arranging more intentionally drawn *square pixels*, not by adding smooth textures, vector assets, high-resolution backgrounds, glossy UI or anti-aliased icon sprites.

Before visual changes run `node scripts/validate_pixel_art_contract.mjs`; keep the validator passing and capture real screenshots of the integrated renderer at all three zooms. Validation of a starter PNG is source evidence only, not a claim that the artwork is live. This art bible applies to all **45** existing F/W/A–E/S tasks without adding duplicate TODO counts.

## Your mission
Work in repository `jbob-coder/The-idle-open-world-universe`, starting from **`prep/codex-skyworld-v0.5`**. Create branch **`feat/godseed-medieval-skyworld-v1`** from that exact preparation branch. Do not implement on `main`; PR chain is v0.2 (#1) → v0.3 (#2) → v0.4 (#3) → preparation (#4). Your new PR should initially target preparation, not bypass the stacked branches.

The goal is a **finished, detailed medieval-fantasy living-world visualization** for an **offline, low-end Android god-simulation** called GODSEED. The camera must feel **high overhead/normal sky POV**, entirely 2D, and show **crisp individual square pixels**. Its default view is **32×20 tiles** (logical tiles remain 16×16), with optional 24×15 close and 16×10 inspection zoom. Make Nim, three NPC professions, wildlife and world locations readable at all scales. Terrain should include deterministic detailed forest, roads, water edges, villages, camps, flowers, fences, runes and ruins using small original sprites, not a painted or 3D background.

The **player is a god**, not Nim. Nim and other inhabitants stay *autonomous, deterministic, offline*, and retain their own goals, survival decisions, encounters, skills, inventory and progression. The god can inspect, bless, gift food, bloom, guide, lightning/storm and inspire travelers using Faith. No direct player movement, no attack joystick, no NPC puppeteering. Divine interactions require visible selection/validity, low-cost pixel FX, text outcomes, correct Faith accounting, and visible world/NPC consequences with no duplicate rewards.

## Added owner requirement: 1 GB core + optional 5 GB

Treat the planned final game as **1 GB core installed content** plus **up to 5 GB extra optional app-managed persistent storage**, nominal **6 GB total**. This is disk, **not RAM**, and is currently NOT implemented. Preserve offline core-only play and do not artificially pad the APK. Optional packs require explicit user consent, free-space margin and safe removal. Complete **S01–S05** in `work-items/storage-tasks.json` as a sixth five-task batch in addition to the original A01–E05. Total planned implementation tasks: **30**. Use `docs/STORAGE_BUDGET_AND_PACKS.md` and `config/storage-budget.json` as source of truth. Validate limits, transactional updates, backups and device storage measurements; label unsupported functions as blocked, never as done.

## Mandatory low-RAM phone compatibility

**Minimum device class: 2 GB TOTAL physical Android RAM; also test a 3 GB device.** This is NOT permission to use 2–3 GB for the game process. The renderer, JavaScript state and WebView host should aim for **128–192 MiB resident memory** with **256 MiB provisional soft ceiling**, measured via PSS/RSS (report metrics and uncertainties). No physical device measurements exist yet. Use `docs/LOW_RAM_HARDWARE_TARGET.md` and `config/hardware-budget.json` as source of truth. Keep decoded pixel atlases small, cache bounded, avoid full-world heavy surfaces and streaming entire 1–6 GB on-disk content into RAM. Record 2 GB and 3 GB device compatibility in tasks E04 and S05; if no device exists, report `PHYSICAL RAM QA: NOT VERIFIED`, not PASS.

## New priority: make the base game function and give each world region a role

Before expanding the size of the world or adding lore-only settlements, implement and verify the **basic autonomous game loop** defined in `docs/GAMEPLAY_FOUNDATION.md`: seeded start → food/wood/stone gathering → eating/resting/shelter/crafting → NPC contact → shrine/ruin progression → optional divine influence → save/resume. No direct character movement. The current simulator includes preliminary versions; audit and fix soft locks rather than cloning these systems.

The world must eventually contain **eight distinct functional regions** defined in `docs/WORLD_REGION_BLUEPRINT.md` and `data/world-regions.v1.json`: Hearthfield Clearing, Briarford Hamlet, Emberwick Hamlet, Mossveil Wildwood, Stormstone Ridge, Crownfall Ruins, Oathkeeper Grove, and Moonwell Fen. Existing two villages **(25,21),(37,27)** and shrine tiles **(20,31),(42,19)** are anchor constraints; preserve their accessibility and old saves. Region metadata must not repurpose current 11 tile IDs. Assign distinct biome visuals, renewable resources, challenges, safe trails, NPC roles and finite discoveries, while keeping only three traveling NPCs and bounded wildlife. Implement/test start ↔ settlements, shrine and ruin walkable connectivity across many seeds.

Read `docs/WORLD_SYSTEM_CONTRACTS.md`, `docs/WORLD_PLAYTEST_MATRIX.md` and `work-items/world-foundation-tasks.json`. Add **F01–F05 and W01–W10 (15 tasks)** to the existing **A01–E05 (25) plus S01–S05 (5): 45 tasks total**, initially all TODO. New work should begin with an **F01–F05 five-task foundation batch**, before expensive world/visual elaboration. Follow with W01–W05, W06–W10 and relevant A–E / S slices as dependencies allow; work in five-task chunks. No area is DONE merely because it has a name, anchor, sprite or documentation. Record code change and test evidence; device testing is separate.

Preflight addition: `node scripts/validate_world_blueprint.mjs` validates the planning schema against the existing simulator and catches accidental tile-ID changes; its PASS is **not proof regional mechanics are implemented**.

## STRICT SQUARE-PIXEL ART CONTRACT — DO NOT SUBSTITUTE ANOTHER STYLE

**This is a mandatory acceptance gate for all visual and world slices, not an optional concept.** GODSEED art must be **true hard-edged square pixels**, not blurry rasterized illustrations, gradient-lit backgrounds, modern vector UI, fake 3D or isometric graphics. Use **16×16 source pixels per terrain tile**, **16×24 sprite frames for Nim/Ira/Toren/Mera**, an original constrained medieval palette, binary-alpha PNGs, integer source coordinates, and **nearest-neighbor Canvas2D rendering** (`imageSmoothingEnabled=false`, CSS `image-rendering:pixelated`). The world remains top-down from a higher sky POV (32×20 default when implemented; 24×15 and 16×10 remain selectable).

Buildings, pines, marsh water, stone ruins, fences, roads, creatures and God-power symbols must all match this **pixel-square language**. Landscape Android controls must also use crisp blocky icon frames and solid pixel borders, while maintaining readable labels and touch targets.

Read and follow `docs/PIXEL_WORLD_STYLE_GUIDE.md`, `config/pixel-art-contract.json`, and `docs/PIXEL_ART_ACCEPTANCE.md`; use `assets/palettes/medieval-fantasy.json` and `assets/asset-manifest.json` as precise art sources. Baseline art-source check: `node scripts/validate_pixel_art_contract.mjs`. Source-validator PASS is **not** evidence that the game renderer has been updated; for each visual task provide actual compiled browser screenshots at **640×360, 720×400, 960×540 × all three zooms**, and manual visual inspection of pixel edges, contrast, road/water consistency and actor visibility. Concepts are not implementation evidence.

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
node scripts/validate_pixel_art_contract.mjs
node scripts/validate_world_blueprint.mjs
node scripts/generate_starter_assets.mjs
git diff --exit-code -- assets/generated/
python build.py
```
Report blockers if a tool is not available. Do not skip evidence and pretend the result passed.

## Architecture decision
**Keep the gameplay engine in JavaScript and Canvas2D inside an HTML/CSS interface.** HTML is the UI; JavaScript is Nim's AI/world logic; Canvas is the pixel map. Android currently packages a self-contained offline HTML document inside a WebView using an **experimental SDK-free DEX/APK builder**. This works as a design approach but existing APK structural tests do not prove phone launch.

Prefer modular, testable Canvas rendering. Implement offline atlas loading from `assets/generated/` and upgraded original artwork; correctly package **all artwork** for both the browser preview and APK. Avoid new runtime network dependencies, huge art textures, GPU-heavy blur, CDN fonts, external SDKs, Unity or a Godot rewrite. Preserve the offline self-contained HTML preview or provide a tested equivalent; respect `build.py`'s existing `/*SIM_SOURCE*/` and `/*UI_SOURCE*/` replacement contract when refactoring.

**Android packaging:** first keep the existing experimental builder functioning through regression checks. Then evaluate a conventional, pinned **Gradle/Android SDK WebView host** as a *separate migration step*, not a surprise untested replacement. Implement that step only if the environment/tooling permits building and verifying it. If it doesn't, report it as deferred/blocker. If adopting `WebViewAssetLoader`, implement/test a way to preserve/export/import existing file-origin localStorage, because the storage origin changes. Restrict WebView to packaged content, keep JS/DOM storage appropriately configured, prevent network access and maintain safe application lifecycle. Do not commit a keystore or claim signed release continuity.

## Implement F/W gameplay foundations and regions (15 tasks) plus A–E visuals (25) and S storage (5) — 45 total
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
