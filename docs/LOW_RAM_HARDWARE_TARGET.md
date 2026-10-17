# GODSEED — Low-RAM Android Hardware Target

**Requirement received:** target Android devices with **2–3 GB total physical RAM**. This is the RAM **installed in the phone**, not permission for GODSEED to consume 2–3 GB itself. Distinct from the persistent disk target of 1 GB core and up to 5 GB optional extra. **Not yet measured or verified on a physical Android device.**

## Required device compatibility
- **Minimum target tier:** Android phone with **2 GB device RAM**, Android 8+ where feasible; WebView system components and Android services also need memory.
- **Common target tier:** Android phone with **3 GB device RAM**; this is the upper target for **low-end compatibility testing**, not a restriction that prevents the game from running on 4–12 GB phones.
- **Approximate app budget (engineering target, not a measured guarantee):** prefer **128–192 MiB** total app-process resident memory during ordinary play, with **256 MiB** as a soft ceiling under demanding scenes. This includes WebView and Android hosting overhead where accounted by process RSS/PSS. Measurement tools and phones decide if this is realistic. Do not confuse JavaScript heap bytes or compressed APK bytes with total process RSS/PSS.
- **Rationale:** a 2 GB phone cannot sustainably dedicate its entire RAM to a game because the OS, WebView, launcher and background services also require RAM.
- **Frame budget:** measure frame pacing and simulation correctness on representative 2 GB and 3 GB phones. Current prototype renders at limited cadence and has no physical FPS baseline. Do not promise 30 FPS without hardware evidence.

## Practical renderer and data rules
- Continue using small 16×16 tiles and a compact 2D Canvas texture atlas.
- Keep decoded sprite atlases **≤4 MiB combined where possible**, plus bounded temporary canvas buffers.
- Only load the sprites and optional packs required by the current scene; keep on-disk packs compressed/streamable, and unload/release references when no longer used.
- No allocations proportional to the optional 5 GB disk allowance. **Never read 5 GB into JavaScript heap, WebView memory or bitmap cache.**
- The world is 64×48 cells; keep three NPC and bounded enemy count in the first release. Draw at three camera zoom levels with caches and no large offscreen world bitmaps.
- Make process-lifetime memory bounded: monitor memory before and after 20 minutes, opening menus, applying divine FX, pausing/resuming, save/export/import and switching zoom.
- Define emergency behavior under memory pressure: stop decorative FX, evict unused atlases, release caches, save world safely, avoid crash/restart loops, and keep UI controls readable.
- Use local, offline resources. No heavy game engine/LLM required.

## Acceptance and measurement
1. **2 GB Android phone:** successful install, first launch, 20-minute autonomous simulation; pause/resume and JSON backup/restore. Record device model, OS, WebView version, measured peak/steady PSS and RSS, JS heap (when available), frame time p50/p10, crash/low-memory outcomes.
2. **3 GB Android phone:** same checks plus zoom switching, village/NPC encounter, divine powers, save handling and optional-content removal under memory pressure.
3. **Stability:** optional large assets remain on disk until needed; process memory must not scale with 1–6 GB storage allocation.
4. **Budget guidance:** preferred 128–192 MiB resident, soft limit 256 MiB; if measurements exceed target, investigate and propose evidence-based adjustments. Do not claim failure is solved solely by CSS or changing an arbitrary cap.
5. **No hardware available:** mark **PHYSICAL DEVICE RAM QA: BLOCKED / NOT VERIFIED**. Emulator or desktop Chromium results are supplemental, not proof of low-end Android performance.

## Persistent storage is different
Storage requirements remain **1 GB intended core installed content + optional maximum 5 GB app-managed persistent data (nominal 6 GB)**. A large disk budget does **not** imply large memory allocation. Device **RAM 2–3 GB** and application **RAM target 128–256 MiB** are separate from disk capacity.

## Codex task mapping
Do not create artificial gameplay tasks: incorporate measurements into **E04** (hardware QA) and **S05** (storage + device compatibility). Modify acceptance tests, performance reporting and eventual Android device evidence accordingly. See `config/hardware-budget.json`, `docs/PERFORMANCE_BUDGET.md`, `docs/STORAGE_BUDGET_AND_PACKS.md`, and `docs/CODEX_CLOUD_READY_PROMPT.md`.
