# GODSEED — Android Offline Playable Vertical Slice (Native Evaluation)

**Milestone:** v1 Android/WebView host with original square-pixel GODSEED world, persistent saves and **optional offline region-lore packs**. This does not complete all future world content or certify production release.

## What exists in the running evaluation build

The separate Gradle Android application loads the offline HTML compiled by `build.py`, which contains the 2D 32×20 high-sky pixel renderer, Nim's autonomous 64×48 world, eight region definitions, three traveling NPCs, creatures, divine powers and Godseed's in-game HUD. It retains the origin `file:///android_asset/index.html` and key `godseed-one-small-life-v1` to avoid unnecessarily changing existing browser WebView save storage. The Java/Kotlin game engine was **not** substituted for the tested JavaScript simulation.

The separate native host adds safe Android file selection for existing JSON backup imports, Activity pause/resume callbacks, offline-only local asset navigation, and a small pack manager. Users explicitly choose optional `.gspack` lore packs; the host validates exactly two ZIP entries and SHA-256, enforces staged atomic storage, blocks unsafe entries and malformed region IDs, and confirms before removing. The app does not request INTERNET or broad external-storage permission. Installed optional packs live in app-private files separate from Nim's saved world.

The numeric **1 GB core + up to 5 GB optional** limits are persistent-storage *design budgets*, not a 6 GB APK or RAM allocation. Current lore packs are deliberately capped to 8 MiB ZIP / 2 MiB decoded text. The target device has 2–3 GB TOTAL physical RAM, but the app's RAM usage must be measured separately.

## Automated baseline evidence (actual CI, not simulated success)

- Native **Gradle APK compile, asset equality and no-permissions check:** passed in [GitHub Actions run 39119312080](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39119312080).
- Android **API 29 Google APIs x86_64 emulator**, APK installation, app launch, five instrumentation tests and screenshot/log capture: passed in the same run.
- Emulator tests include valid pack import/read/delete, invalid hash, untrusted ZIP entry and invalid region rejection, duplicated import rejection, and offline WebView startup with visible 32×20 canvas and native bridge.
- Original browser/simulation/PNG validators are continuously checked by the `GODSEED offline QA` workflow; their success is NOT Android hardware evidence.
- **Five native Android instrumentation tests passed**, including restoration of a saved Nim world across Activity/WebView recreation, in [run 39119312080](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39119312080) (commit `7e52a1bbaa3a`). The emulator still does not substitute for a real 2 GB/3 GB RAM phone.

Reference artifact URLs for **the first emulator-tested checkpoint**:
- APK + test APK: https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39119312080/artifacts/12133262674
- Emulator screenshot, instrumentation output, Android logcat and process memory snapshot: https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39119312080/artifacts/12133722030

## Repeatable local tests

```sh
python build.py
sh tests/native/run-storage-checks.sh
gradle -p android/gradle :app:assembleDebug :app:assembleAndroidTest --no-daemon
bash tests/native/run-emulator-acceptance.sh
```

The final command **requires an already running Android emulator or connected device via adb**. On CI, `.github/workflows/native-android.yml` provisions API 29 and executes the script. The script installs both debug APKs, invokes the test runner, starts GODSEED and preserves screenshot/meminfo/logcat evidence. No real Android handset was connected in these tests.

## User acceptance: safe Android evaluation

1. Download the Gradle **evaluation** APK from an Actions artifact and install it on a TEST device, after backing up any existing GODSEED save. The debug signer may not match your previously installed version; do not uninstall before exporting your backup JSON.
2. Observe Nim autonomously for several minutes. Pause/resume, change camera zooms, trigger a Faith power, then save/export and restore the world.
3. In `Local packs`, select an optional locally generated `.gspack` example, approve the native confirmation, and confirm the pack appears. Lore for undiscovered regions should not be exposed.
4. Remove the optional pack; game progress and older backups must remain unchanged.
5. Measure FPS, WebView PSS/RSS and 20-minute stability on 2 GB and 3 GB physical Android phones. Record real device OS/System WebView versions and any crashes. This **release gate remains NOT VERIFIED**.

## Explicit out-of-scope items

No permanent update signing identity, Play Store release guarantee, measured low-end FPS/battery, streaming 5 GB asset packs, general economy/large city scale, or full 1 GB installed-content library. Physical Android lifecycle and save continuity must be rechecked on target handsets even after emulator tests pass.

**Branch:** `feat/godseed-android-storage-host`, PR #6 targets `feat/godseed-medieval-skyworld-v1` (PR #5). The review stack remains unmerged to `main`.
