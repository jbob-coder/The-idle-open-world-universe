# GODSEED — Android Storage & Expansion Budget
**Status:** proposed product requirement, documented 2026-10-17. **Not implemented or measured in the current APK.**

## User requirement and interpretation
The user specifies **1 GB minimum for the game plus at most 5 GB of extra free space available for optional game use**. Until clarified otherwise, treat these as **phone persistent storage** (disk), not RAM, graphics memory or network bandwidth. The game must never assume the phone actually has this space.

| Component | Intended limit / meaning |
| --- | --- |
| Core game | **1.0 GB installed-data content budget/target**, inclusive of APK and its unpacked/managed core files. Build meaningful content, not dummy filler; do not require a download merely to inflate file size. |
| Optional extra data | **Up to 5.0 GB additional app-managed content** if the user opts in and the device has enough free space. Not automatically preallocated or mandatory to play. |
| Combined managed footprint | **Up to 6.0 GB total core + optional content** (nominal planning limit); system WebView/cache/OS overhead may vary and must be separately observed. |
| Playable offline baseline | Must run using **core-only installation** after initial content is present; the game must not become unplayable without optional data. |
| Memory (RAM) | Entirely **separate** from GB disk allocation; large asset packs are **not** to be decoded all at once. Actual RAM limits must come from device profiling. |

**Units:** GB here is decimal (`1 GB = 1,000,000,000 bytes`); `6 GB = 6,000,000,000 bytes`. Distinguish from binary GiB in Android diagnostics. The 1 GB figure is a **content capacity target**, not a requirement to pad the APK or keep the process using 1 GB of RAM. It should not be mislabeled as a measured current build size.

## Storage model and user experience
1. **Core (required):** locally available code, sprites, UI, minimal world data and gameplay. Keep the Android APK technically reasonable. A core content pack can account for most of the 1 GB target if content warrants it. The present tiny prototype remains tiny; do not bulk it up with empty files.
2. **Optional (0–5 GB):** higher-detail terrain variants, additional original biome atlases, lore/audio packs, larger authored exploration regions or future content collections. User-installed optional bundles, if implemented, must have explicit install/remove controls and size disclosure. Some options may not yet be supported by the simulator: labeling something planned does not make it playable.
3. **Mutable data:** local save backups, generated world records, thumbnails, image cache, replay logs. Count app-managed mutable content toward whichever bucket it actually consumes; provide a cap and cleanup so repeated autoplay cannot grow storage indefinitely.
4. **User-visible screen:** show `Core installed`, `Optional used / 5.0 GB`, `Phone space available`, `Space required before adding pack`, and `Delete optional data`. No claim of access to other apps' or entire filesystem data.
5. **Consent:** **never reserve, preallocate, download, import or fill optional space silently**. Ask user before installing optional packs. Deleting optional content must not delete a game save. A backup/export is a separate explicit user choice.

## Free-space and safety policy
- On every pack import, validate the **actual available bytes on the destination storage volume** using an Android-native host method (or a reliable tested equivalent); do not trust a stale cached number or a hardcoded number.
- Refuse or postpone writes when the projected total app-managed data exceeds 6.0 GB, optional managed content exceeds 5.0 GB, or free space after the operation would be less than **max(500 MB, 10% of currently available storage)**. This margin is a default policy that may be made more conservative after device testing.
- Budget **temporary installation and unpacking overhead**, peak disk usage, and rollback space. Installation from compressed packs may temporarily require both compressed and expanded data; never start if space for the peak is unavailable. Always recalculate actual post-operation usage.
- If storage gets low, suspend optional content additions, suggest deleting optional packs, and preserve the last known valid save. The core game continues if possible.
- Update content via staging + integrity/hash check + atomic rename/swap where filesystem semantics permit. On incomplete update, revert to the previous valid data; never overwrite the only save with unverified bytes.
- Do not assume access to arbitrary external storage paths or use broad storage permissions. Prefer app-private storage, explicit Android Storage Access Framework import/export for user files, and scoped APIs.
- Cached/OS-managed data cannot be guaranteed within a strict byte-level global cap from the web code alone. Report accurately that quotas cover **measured app-managed content**; account for packaging/extraction and actual OS storage measurements separately.
- The optional 5 GB is **an upper bound** available only if the phone has it. The app is never permitted to consume all remaining device storage.

## Offline-first asset distribution
- The game should be playable offline once its required core content is installed.
- Codex must **not introduce an internet requirement** simply because optional content is large. Extra packs can be imported locally by the user via an Android document picker (or delivered in an optional external distribution channel only if the owner explicitly approves future network features). The current no-network-permission objective remains.
- Pack manifest should include `pack_id`, `schema_version`, `game_min_version`, `content_type`, `compressed_bytes`, `installed_bytes`, `sha256`, `dependencies`, optional/required flag, and uninstall behavior.
- Keep runtime sprite atlases small, load on demand and evict/cache bounded resources. A 1–6 GB disk budget **does not justify 1–6 GB runtime memory**.

## Existing WebView / save origin constraints
The current SDK-free APK embeds local HTML under `file:///android_asset/index.html` and stores state under `godseed-one-small-life-v1`. Do not store gigabytes of sprites in `localStorage`. It is designed for small save JSON and has browser-dependent quotas. Large packs need an Android app-private file storage layer, with a safe, narrowly scoped WebView-to-host mechanism or an audited asset-serving mechanism. If an HTTPS-style `WebViewAssetLoader` origin is used, explicitly migrate/export existing file-origin saves as documented in `docs/ANDROID_HTML_APK_SPEC.md`. Never change game save schema silently.

## Suggested allocation breakdown (illustrative, not current output)
**Core up to 1 GB target:** engine/UI/simulation 10–50 MB; original pixel environments/characters/UI art 100–250 MB; local lore/audio/scenarios up to remainder **only when real content exists**. Values are planning ranges, not asset requirements or evidence that the starter package needs 1 GB.
**Optional up to 5 GB:** biome/world expansions, optional local languages/voice/audio, alternative skins, future region packs and controlled generated-history caches. Each pack must actually function before counting it as released.

## Acceptance requirements
1. Correctly display GB decimal vs GiB binary; persisted/core/optional size counters verified by a real filesystem API.
2. With **0 GB optional data**, the core plays offline with no prompts to install DLC.
3. Test boundary cases: 0 bytes free, 300 MB free, exactly enough plus reserve, 5 GB optional cap, 6 GB combined cap, oversized/corrupt pack, disk-full mid-write, update rollback, uninstall pack with existing saves.
4. After 10,000+ simulation ticks, resource allocation stays bounded and the JSON save remains a reasonable size.
5. On target low-end Android, show install/storage-size reports, package vs data footprint, RAM consumption, and whether the 1 GB core is practical. Never claim 1 GB is required when the installed artifact is still tiny.
6. No hidden download or unexpected INTERNET/storage permission; explicit user confirmation for optional content.
7. Gate R requires a device install/update/migration, not just ZIP and signing checks.

## Work tracking
See `work-items/storage-tasks.json` for five additional **S01–S05** implementation tasks; they are **not done** in this documentation handoff. The original `work-items/codex-tasks.json` retains 25 A01–E05 visual/core tasks. Thus Codex has **25 existing + 5 new = 30 work items**, with storage changes implemented as a separate tested slice after architecture/code review (or earlier if packaging decisions make them prerequisite).

**Reference:** `docs/ANDROID_HTML_APK_SPEC.md`, `docs/PERFORMANCE_BUDGET.md`, `docs/SAVE_SYSTEM.md`, `docs/HANDOFF_READINESS.md`.
