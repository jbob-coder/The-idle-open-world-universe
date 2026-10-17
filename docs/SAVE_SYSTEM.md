# Save compatibility & Android installation safety

**Source of truth:** `src/sim.js` serialize/restore; `src/ui.js` saves under `godseed-one-small-life-v1`. State `version:1`. Render-only changes should not modify these values or require an invasive migration.

`create(seed)` → `tick(state)` → `serialize(state)` → `restore(raw)` should preserve the simulation's player/NPC/world semantics, with transient paths and visual effects excluded appropriately.

**Required roundtrip tests:** pre-NPC saves without `npcs`; pre-shrine saves without `shrinesVisited`; modern v0.4 state; one character near a village; active divine NPC favor; damaged or oversized backup; import into a new world without leaking previous FX.

**Debug signing:** Earlier APKs were signed with temporary keys. An APK built by a new CI run may not upgrade the previous installation in place. Export save text to a safe place before uninstalling. A real release requires a stable protected keystore, package identity management and launch verification on an actual Android device.

**Data privacy:** offline, no requested Internet permission, no account sync. Stop claiming background simulation while app closed. Backups include game choices and logs stored locally.
