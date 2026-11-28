# Godseed completion cycle 013 — Galaxy A54 target and actual scheduler scale diagnostic

Owner identifies Samsung Galaxy A54 hardware as Android target. Main verified f75bdd14827bd6ea8555f6ca428132e91cff97c3; #77–80 unchanged drafts; #81 open. Platform authority docs/PROTOTYPE_PLATFORM.md blob 4a26052ae8d6fd57e9f495eb4d37c1db43d42ffb: portable JS/TS + Node development then native React Native/Expo with SQLite, no HTML/WebView. #103 comments show #99 Android acceptance proposal and another agent's independent device/index benchmark reservation. This cycle complements them with actual existing scheduler/executor profiling, not a duplicate hardware profile or new simulation engine. No owner gameplay authorization or peer acceptance inferred.

## Device assumptions and environment
Manufacturer references:
- https://news.samsung.com/global/the-samsung-galaxy-a54-5g-and-galaxy-a34-5g-awesome-experiences-for-all
- https://semiconductor.samsung.com/processor/mobile-processor/exynos-1380/
- https://developer.android.com/games/optimize/memory-monitoring
- https://developer.android.com/games/optimize/overview

Exynos 1380 has four Cortex-A78 and four Cortex-A55 CPU cores, Mali-G68 five-core GPU; A54 has 6.4-inch FHD+ display at up to 120 Hz. Plan conservatively for 6 GB model variant; exact owner's SKU, RAM, Android version, available storage and thermal behavior NOT VERIFIED. Do not assume all memory is available to the app. Prefer 60 Hz responsive text/scrolling baseline; no frame-driven fictional clock. Reuse #99 proposed device budget (250 MiB steady/400 MiB peak PSS, ordinary 12-actor Continue p95 <=500 ms), subject to physical device measurement and review; do not claim achievable values. Local environment inspection: Node v22.16.0 Linux x64, java present, adb absent, no SDK in checked ANDROID_HOME/ANDROID_SDK_ROOT/standard directories. No mobile runtime or device measured.

## Native diagnostic
Added docs/completion/check_scheduler_scale.mjs at 0c9b9af7c5993abbe431265c27a62761a130e1c1, blob 628ce74c222671bf4dfd78302dcad15e7bc946de; exact committed readback matches local native-tested source. Run: node docs/completion/check_scheduler_scale.mjs. Uses actual exact source blobs:
- tools/npc_execution_reference.mjs 835fcafba4fb566001b743e1c028c5cb689bcecb
- tools/world_scheduler_reference.mjs 87827592c148078ccf8bed50f32b8d6ce4f2a909
- Persistence source also checked (351280acb8b1ff6bae5deec4133ce3bb658d3894), not used in benchmark.
Synthetic fixed actor population (12 or 128 NPCs plus player), same one-phase work offer, one generic unit per NPC activity, every three uncalibrated reference ticks; 1 or 4 waves. No actual work schedule, motivation, wages, routes, relationship or abilities. Scheduler reads instrumented with forwarding wrapper calling original state() unmodified. Counts represent copies of row instances returned by state(), including setup, not bytes allocated or count of unique events. Host elapsed runMs includes driver view reads; excludes initialization and final checkpoint serialization. No device extrapolation, no p95 estimate (single sample per scenario). Normal exit 0; all 5 fixture runs assert no advance before admission, expected final time/status, terminal count, per-actor completed one-unit receipts and resources. One exact partition-equivalence assertion passed.

| NPCs | Waves | Budget | Run ms | Max slice ms | Slices | state() reads | Event row copies | Terminal event rows | Checkpoint bytes |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|12|1|10000|7.76|6.41|1|80|638|52|20241|
|12|4|10000|30.34|29.88|1|230|16880|196|51860|
|128|1|10000|173.98|171.43|1|660|36250|516|198546|
|128|4|10000|2690.38|2685.60|1|2202|1723936|2052|535709|
|128|4|32|2746.31|312.58|17|2283|1791745|2052|535709|

Both 128/4 cases produce exact same private executor+scheduler checkpoint serialized SHA-256 f1869e52571eef535eade6dc5489559bf2a221f471e9db1690ae9216ea2a70ed. All 513 terminal outcomes including player identical. Partitioning preserves this fixture's full state, but total work does not decrease, and 32-step batch still stalls a thread in this sample. No UI or real device tested. Counts and digest deterministic for fixture; timings host-dependent.

## Root cause and recommended review
Scheduler clock(), activity(), review and public view repeatedly call executor.state(), which copies every actor, active action, outcome and event using JSON serialization. As history accumulates the cost of otherwise small reads grows; one reference run at 128 NPCs copied >1.7 million event rows although terminal history has 2052. Four-wave run at 128 vs 12 NPCs took about 88.7x as long for 10.7x population in this single host comparison. Do not interpret as measured complexity exponent, A54 latency or hardware limit.
1. Proposed 01 review: privileged narrow current-state read interface (clock, actor by ID, active by ID, current boundary) detached or immutable; retain full checkpoint export as separate explicit recovery/diagnostic operation. Do not expose raw executor history to narrative or cognition. Cache/index current data rather than scan/copy all historical rows per review. Preserve versions and exact old replay behavior.
2. Proposed 01/02 review: retain durable append-only causal history, use indexed actor/receipt retrieval, incremental snapshots and bounded processing. No truncation of acquired memories or material outcomes, no forced idle behavior, no artificial actor cap reductions.
3. Proposed 04 review: schedule bounded authoritative work outside synchronous rendering, yield safely between committed boundaries, immutable Continue identity and no duplicate time/paragraphs. Render scoped data only; no technical batch interpreted as player action. On actual A54, use release build and same deterministic fixture, measure p95 user action latency, frame pacing, peak/steady PSS and lifecycle recovery; thermal monitoring. On backgrounding/pressure, preserve confirmed state and suspend technical work safely, not fabricate fictional elapsed time or drop effects. Actual partition equivalence must include whole-world state, NPC knowledge, RNG, receipts and persistence, not just this two-module reference.
4. Verify unchanged reference and new production parity with a versioned narrow-read path. This is a proposal, not authority to edit peer-owned runtime before review.

## Limits / next action
No actual Android/APK build, emulator, A54 benchmark, complete native baseline or real-world gameplay tests. No production changes, saves, force-stop, CI, merge or dependency installation. First attempted tool invocation requested unsupported streaming session; no file was written in that attempt, then executed normal bounded fixture successfully. No source or test dependency availability change (12 missing baseline paths per cycle 012; no full baseline rerun). Next priority: review scheduler narrow-read and durable history boundaries with 01/02/04, then implement after applicable peer and owner gates. Continue transaction coordinator native verification while waiting. Hardware designation is an explicit target, not permission to bypass owner documentation gate or redefine game scope.
