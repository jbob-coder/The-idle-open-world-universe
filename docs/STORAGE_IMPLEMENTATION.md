# Optional local lore and conventional Android host

Implemented on `feat/godseed-medieval-skyworld-v1`; PR [#5](https://github.com/jbob-coder/The-idle-open-world-universe/pull/5). Physical Android execution is **NOT VERIFIED**.

## Two independent packaging outputs

The SDK-free `android/build_apk.py` remains supported and produces `dist/GODSEED-v1-experimental.apk`. The separate `android/gradle/` project produces `dist/GODSEED-v1-gradle-experimental.apk`. Both embed the exact generated offline HTML; neither requests Internet or broad storage permissions. Only the Gradle host implements native optional storage and explicit lifecycle callbacks.

The Gradle experiment requires Android 8/API 26 or later and targets API 28. It is an evaluation build, not a current Play Store release configuration. Lint retains `ExpiredTargetSdkVersion` as a visible warning instead of an error for this experiment; other errors remain enforced. Landscape, required local JavaScript, conservative usable-space accounting and the missing launcher icon also remain visible warnings. Its Gradle debug signing identity differs from the SDK-free builder's local debug identity. Android cannot install one over the other without matching signing keys. **Export the JSON save before switching builds; uninstalling erases app-private data.** No automatic uninstall, signing migration, or replacement is performed. Production signing remains an owner decision.

Both hosts retain application ID `io.godseed.one`, origin `file:///android_asset/index.html`, save key `godseed-one-small-life-v1`, simulation version 1 and terrain IDs 0–10. Browser restoration and migration tests pass; an actual Android upgrade/migration remains unverified.

## Accounting and capacity

`PackBridge` reports APK file bytes, mutable app-private data, optional files, cache (already included in mutable data), and destination filesystem usable bytes. OS/shared WebView overhead and extracted installation overhead outside app-private data are excluded; Android Settings and `dumpsys` measurements must be collected on a device. Counters are implemented with filesystem APIs, not claimed device measurements.

`StoragePolicy` enforces decimal limits of 5,000,000,000 optional bytes and 6,000,000,000 managed bytes when importing. It reserves at least the larger of 500,000,000 bytes and 10% of available space. Staging requires room for the complete incoming file while retaining the old file. Free space is checked again during each write. Arithmetic overflow is refused. The 1 GB core figure is a future meaningful-content target; these small APKs are not padded.

The initial supported format is deliberately smaller: **up to 1 MiB per lore pack, at most 64 installed packs**. The 5 GB policy is an upper bound, not a promise of 5 GB of content or supported individual archives. There is no download, automatic allocation, decompression or executable content. Accounting processes packs one file at a time to validate their titles; displaying full lore is an explicit request. Physical process memory scaling is not yet measured.

## Import, use and removal

The storage panel is below the world controls. In a browser or SDK-free APK, it explains that native pack support is unavailable and disables import. Core gameplay and saves remain available without any pack.

In the Gradle host, Import opens Android's Storage Access Framework document picker. A native confirmation displays the title and actual bytes before installation. `PackManifest` validates ID, schema, minimum game version, content type, size, payload SHA256, dependencies and removal semantics. `PackStore` writes an app-private staging file, verifies its complete length/hash, syncs it, retains the old copy during replacement and recovers interrupted swaps at startup. No save path is exposed to the bridge. Removal is explicitly confirmed and refuses dependencies of valid installed packs that would be broken. Damaged packs remain visible and removable; invalid packs cannot hold other removals hostage.

The included `content-packs/borderland-echoes.godseed.json` contains original lore for all eight regions. It is a separate local-import example, not bundled or installed by either APK. Lore is revealed only for discovered regions; it changes no autonomous decisions, mechanics or rewards. Text uses DOM `textContent` and cannot inject code.

The JSON envelope includes `pack_id`, `schema_version`, `game_min_version`, `content_type`, `compressed_bytes`, `installed_bytes`, `sha256`, `dependencies`, `optional`, `uninstall` and a UTF-8 JSON string `payload`. In this uncompressed format, both byte fields equal the entire file length; SHA256 covers the exact UTF-8 payload string. `python scripts/build_lore_pack.py` reproduces the example.

## Verification and remaining gate

- Five JUnit tests pass, including 23 real temporary-filesystem checks: quota/reserve boundaries, corruption, oversize, interrupted input, falling free space during a write, replacement/recovery and save-isolated removal. These execute on the desktop JVM, not Android.
- The browser bridge-contract test passes using a clearly identified fake native host: no automatic actions, decimal units, discovery filtering and explicit import/remove requests.
- APK verification checks exact HTML bytes, compiled host classes, application identity, API levels, no permissions and the Android debug signature. It does not establish install/launch correctness.
- E04 and S05 remain blocked on physical 2 GB/3 GB Android devices: install/upgrade, picker consent, pause/resume/process death, actual low-storage behavior, 20-minute survival, FPS, RSS/PSS and installed footprint. No emulator or physical-device result is claimed.
