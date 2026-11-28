# Android target: Samsung Galaxy A54 5G

Status: owner device target from current request; engineering budgets proposed, no device measurements, no approved implementation or release. Current project is the novel-style GODSEED, not legacy 3D Godseed. Main f75bdd14827bd6ea8555f6ca428132e91cff97c3. Platform source blob 4a26052ae8d6fd57e9f495eb4d37c1db43d42ffb; coordination source blob 5aa7bf30be270756812368318f9d1eed4edc452a. Related #103 D1-D8, #84, #99, #101, #105, #106.

## Hardware baseline

Samsung Galaxy A54 5G: Exynos 1380 (5 nm), four Cortex-A78 up to 2.4 GHz and four Cortex-A55 up to 2 GHz, Mali-G68 MP5, 6/8 GB RAM configurations, 128/256 GB storage, 2340x1080 6.4-inch AMOLED up to 120 Hz, typical 5000 mAh battery. Use 6 GB variant as conservative baseline; installed physical RAM, model SKU, free space, OS/API, ABI, refresh mode and thermal state of owner's actual phone NOT VERIFIED. RAM Plus is not physical RAM. Do not collect device serial or unrelated personal data.

Manufacturer sources (accessed 2026-11-27):
- https://semiconductor.samsung.com/processor/mobile-processor/exynos-1380/
- https://news.samsung.com/global/the-samsung-galaxy-a54-5g-and-galaxy-a34-5g-awesome-experiences-for-all
- https://image-us.samsung.com/SamsungUS/samsungbusiness/pdf/spec-sheets/HHP-A545G-DATA-GENERIC-MAR23-FINAL.pdf
- https://www.samsung.com/uk/business/smartphones/galaxy-a/galaxy-a54-5g-green-128gb-sm-a546blgceub/

## Architecture constraints

Keep selected platform: portable JS/TS domain core, Node prototype, native React Native/Expo Android UI, mobile SQLite adapter. No WebView, 3D renderer or cloud inference needed. Select SDK/Hermes versions only after compatibility check and a reviewed build. Use event-driven calendar/scheduler and bounded technical work continuation; no millisecond polling or wall-clock world advancement. UI refresh is independent of fictional time. Use one simulation writer and an atomic durable commit; stage work, yield between safe boundaries, publish scoped immutable results only after commit. Native UI remains interactive during work; show honest pending state, never resolve an action at a work-budget boundary. Prevent repeated Continue by durable dedup, not debounce alone. Index and lazily fetch actor evidence, journal/archive and catalog; virtualize long narrative lists; unload presentation cache without deleting authoritative records. Keep full-history correctness and replay/migration intact. Do not alter NPC decisions, RNG, ability rules, hidden facts or actual causal outcomes to meet a performance budget. Reduced-detail distant NPC processing must reconcile with full-detail material outcomes. Do not treat existing V1 caps as approved long-term limits or assume app can use all 6 GB.

## Provisional budgets (NOT MEASURED)

- Physical 6 GB A54 baseline; release/profile build rather than dev JS debugger; typical steady foreground total app PSS <=250 MiB, observed peak <=400 MiB across representative workload. Report swap PSS separately, native/JS allocation trends, and post-warmup retained memory; cache eviction cannot lose canon. These are engineering starting targets, revise with measured evidence.
- Smooth 60 Hz baseline scrolling, 16.67 ms/frame nominal budget. At 120 Hz measure against actual display mode (8.33 ms frame period); no promise of constant 120 FPS. Measure frame deadline misses/jank, not average FPS alone. Aim >=95% on-time frames in long prose scroll at baseline.
- Ordinary Continue p95 <=500 ms tap-to-durable-result for 12-actor local fixture, separate compute/SQL/render times; no visible UI stall from technical continuation. Cold launch and normal reopen target <=3 s p95 on representative small save; full-history growth measured separately. Long actions may take more real time, preserve truthful pending/progress and deterministic semantics. Do not cap fictional time to meet latency.
- No gameplay polling while reading/paused/backgrounded; no network requirement. 30-minute representative active session records thermal status, elapsed time, battery percentage delta and charge/display/network conditions; no invented battery lifetime. Report median and p95 latencies, p99 if sample size supports it, sample count, min/max and actual workload. No arbitrary battery pass without baseline.

## Required physical-device acceptance (all NOT RUN)

A54-01: install signed test build on authorized phone; record model family, physical RAM, OS/API, ABI, app commit/version, SDK/runtime versions, available app storage and display refresh. No actual package ID selected here.
A54-02: same reviewed M1-A walk/rest seed fixture as desktop, identical canonical domain results except explicitly platform metadata; independent NPC work/rest, 9s/60s conditional arithmetic, same RNG vectors, exact retry, normal close/reopen, no time while reading. Inactive proposals are not valid gameplay.
A54-03: 12 validated active NPCs across several fictional days; 128-living and 32-regional budget stress with approved synthetic data, actual independent decisions, no starvation, no lost observations, no cap-induced silent clock freeze. Distant summary/full detail comparison, no creation or removal of NPCs simply to improve FPS.
A54-04: long history (>=10,000 actual test operations/observations where applicable), 10,000 definition catalog load/index/query; cold versus warm view and scroll; memory, database size, transaction latency, deterministic replay/recovery. Stress test catalog may use labeled synthetic definitions; does not fulfill authored distinct-ability requirement. Do not claim V1 256 journal or 64-opportunity limitations solved.
A54-05: user selects then Continue, repeated taps and normal foreground/background transitions, interrupted activity, normal app close/reopen, scoped history and ordered receipt reconstruction. Later reviewed three-slot rewind and external judgement; only owner may perform force-stop/device termination. No automated adb force-stop, kill or destructive clearing.
A54-06: 30-minute sustained session, 60 Hz and supported 120 Hz modes; scroll + decision workload, larger text/font scaling, TalkBack, status/choice controls and readable layout. Log PSS, swap PSS, jank, battery/thermal and database growth without private actor evidence. Repeat conditions and compare previous build; failure is a performance defect, not permission to weaken simulation.

## Measurement workflow

When actual device connection and user permission are available: use adb devices -l locally without saving serial in shared reports; adb shell getprop ro.product.model / ro.build.version.sdk / ro.product.cpu.abilist; adb shell cat /proc/meminfo (record MemTotal only); adb shell dumpsys meminfo <package>; adb shell dumpsys gfxinfo <package> framestats (validate supported output); Perfetto/System Trace or native profiler for jank and thread spans; release test harness timestamps around input/commit/render. Use ordinary lifecycle transitions, explicit normal close and synthetic fixture databases. Do not run destructive commands or use real saves. Android references: https://developer.android.com/tools/dumpsys and https://developer.android.com/topic/performance/memory/guide/tools-overview . Actual device traces require explicit access; no package/install commands issued this cycle.

## Gate

Environment inspection: Node v22.16.0 present; command -v adb returned no executable, no Android SDK path found in checked environment locations. No connected device inspection, Android build, APK, benchmark, app install or test run. Main and four domain draft PRs unchanged at inspection. Owner selected A54 target only, not blanket gameplay approval. Request 04 review UI/measurement and 01/02/03 simulation parity and storage budgets; D8 and applicable peer gates remain. After authorization, implement M1-A on portable core, then build minimal native adapter/UI proof and measure A54 before extending full roster. No new dependencies, canon, gameplay files or paid CI.
