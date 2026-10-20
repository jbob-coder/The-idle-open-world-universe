# GODSEED V3 rebuild — verified state and next integration gates

**Evidence date:** 2026-10-20. **This is a checkpoint, not automatic live status.** Re-read branch HEAD and GitHub Actions before claiming that anything below remains current. No engine replacement, old-save migration, PR merge or physical-device test is authorized by this document.

## Current active direction and provenance
- The owner's approved target is a **3D Pixel Squares observer** over an offline autonomous medieval society. Read the [product authority and reference correction register](https://github.com/jbob-coder/The-idle-open-world-universe/blob/docs/godseed-agent-task-governance-v1/docs/PROJECT_AUTHORITY_AND_REFERENCE_STATUS.md) and subsequent owner instructions.
- The old 2D Canvas app, three-chapter story, Android WebView package and `godseed-one-small-life-v1` saves are **separate compatibility assets**, not the final 3D camera specification.
- This branch is an **isolated V3 proof**, not a completed Android release. Its new save identity is `godseed-v3-prototype-v1`, and it does not migrate or overwrite the legacy save.

## Implementation — exact files
| Layer | Published source | Implemented and directly inspectable | Not implied |
|---|---|---|---|
| Authoritative state | `src/v3/sim.js` | Seeded 20×20 terrain, two named citizens, actual finite tree consumption, wood conservation, once-only shelter, save/restore and snapshot isolation | Town economy, children, families, jobs, remote chunks, settlement growth or connected v1 citizens |
| 3D rendering | `src/v3/view.js` | WebGL1 3D geometry for ground, trees, two citizens and shelter, finite buffer drawn from snapshots | Android GPU qualification, full character models, animations, weather, textures or 3D map streaming |
| Interaction / persistence | `src/v3/app.js`, `v3/index.template.html` | Camera orbit/zoom, pause/step/speed, local save and recovery, read-only counters | A complete God-power UI, verified production Android APK, cross-device save migrations |
| Packaging | `build_v3.py`, `GODSEED-V3-Play.html` | Self-contained offline HTML with no CDN, controlled script injection and restrictive CSP | An APK automatically containing this V3 page |
| Acceptance | `tests/v3_sim.test.js`, `tests/v3_browser_acceptance.py`, `.github/workflows/v3-3d-proof.yml` | 100 seeded autonomous foundation tests, browser WebGL test at 960×540 and 640×360 with controls and save/reload | Any performance measurements on a 2–3 GB physical Android device |

## Exact commit evidence and blocker resolution
1. `4491bf0153c10ccf079b29f1a4acd190ae19fe36`: offline V3 3D proof [run #39500924504](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39500924504) **FAILED** because Playwright `page.wait_for_function()` used CSP-blocked JavaScript evaluation; this was a *test harness error*, not proof of incorrect autonomous building.
2. `95aaec186e8e5a82510bff2cad4641068cd3a0a8`: [run #39501347215](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39501347215) **SUCCESS** after converting browser polling to `page.evaluate` with a JavaScript function expression. Do not add `unsafe-eval` to bypass the restriction.
3. Subsequent documentation-only commits update `AGENTS.md` and `README.md`. They do not modify the WebGL engine, simulation, Android host or save format. Verify their new exact-HEAD CI independently.
4. `027ff2680465f0dcac6a974b48e1fd9719fb8a98`: [V3 proof run #39502615133](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39502615133) **SUCCESS** after conserving finite forests. Across 100 seeds, settlers collect eight total wood, spend four building the first shelter and keep four in reserve, then return to their home. Six Node tests passed; real offline Chromium WebGL passed at 960×540 and 640×360.
5. `cac2f8b164240d1f3354b52a881d5f37546faa73`: [V3 proof run #39503953891](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39503953891) **SUCCESS** after removing a concurrent duplicate SDK-free APK wrapper. The authoritative V3 Android packaging is the separate Gradle project, not both methods. The [native API29 workflow #39503775961](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39503775961) at a prior SHA was in progress when this entry was authored; its result must be checked separately.


## Next smallest meaningful development steps
1. **Android V3 preview now exists:** the separate Gradle project at `android/v3` packages `GODSEED-V3-Play.html` under application ID `io.godseed.v3preview`. Its [native APK workflow](https://github.com/jbob-coder/The-idle-open-world-universe/actions/workflows/v3-android-preview.yml) builds an Android package with no Internet permission, validates its exact asset and binary signature, and tests API29 WebGL launch independently. This does **not** establish a physical-device pass, a production signer, guaranteed upgrade safety or completed lifecycle tests. See [canonical preview documentation](V3_ANDROID_PREVIEW.md).
2. **Behavioral evolution:** move from one shelter/two people to finite food, persistent shelters/roles, autonomous reproduction or migration, one feature at a time with seeded conservation tests. Do not claim the existing 100-seed shelter demonstration is a full civilization.
3. **Rendering acceptance:** genuine screenshot/performance evidence from supported Android GPUs. Browser software WebGL passing with SwiftShader does not guarantee native hardware compatibility.
4. **Integration governance:** coordinate work with the live `docs/godseed-agent-task-governance-v1` registry, protect other agents' PRs, and only merge a verified exact-head change. Never use outdated “Canvas 2D only” mandates to block the owner-approved V3 architecture.

## Verification commands
```bash
node --test tests/v3_sim.test.js
python build_v3.py
python tests/v3_browser_acceptance.py
```
Test claims require the observed output of an actual run at a known SHA. V3's GitHub workflow also checks that running the builder does not change the committed single-file HTML.
