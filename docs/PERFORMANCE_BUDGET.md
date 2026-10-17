# Android old-hardware performance and memory contract

**Storage is not RAM.** New full-game target: 1 GB core installed content + a maximum of 5 GB optional extra app-managed disk storage (6 GB nominal total). The present APK is far smaller. No dummy padding or forced 5 GB preallocation. Runtime decoded textures still obey the small-memory budgets below, regardless of optional packs. See `docs/STORAGE_BUDGET_AND_PACKS.md` and `config/storage-budget.json`.

**Target:** offline Android 8+ landscape, constrained phones with modest RAM/GPU. No FPS/energy measurements have yet been taken on physical Android for the handoff branch, so the following are engineering budgets, not achieved numbers.

- Target 30 FPS for rendering on low-end phone; acceptable degradation to 20 FPS while preserving simulation accuracy. Existing UI frame loop redraw cap is ~85 ms (~12 FPS): Codex should measure and adjust according to energy/performance **instead of claiming 30 FPS now**. Step logic remains fixed and bounded.
- World is 64x48=3072 cells. Target visible scene max 32x20=640 cells in high sky mode, 24x15=360 near, 16x10=160 inspect. Terrain caching must invalidate on tile edits, fog reveal, camera shift, zoom, or adjacent border topology change.
- Main atlas textures should be <=512x512 each and total decoded RGBA sprite/terrain atlas memory <=4 MiB. Art packages combined compressed ideally <=1 MiB. Keep image count small.
- Limit agents at runtime to three NPC plus current five enemies unless a documented profiling pass raises it.
- Every-frame JS object allocations: avoid new arrays in hot per-tile inner loops and avoid rebuilding DOM status more than the existing ~450 ms cadence. Reuse canvas buffers.
- No per-tile filters, shadowBlur, gradients or text measurement. FX at most 32 simple primitives in view and 4–8 frames per effect; cap active simultaneous effects.
- Autosave approximately every 16 s (existing behavior) and when page loses visibility; never serialise screen textures or transient FX.
- Browser screenshots: test 640x360, 720x400, 960x540 and 3 zoom levels; assert 10 god/time/zoom dock controls remain reachable. Use browser deviceScaleFactor 1 plus 2 as separate exploratory test.
- Physical Android QA later: cold start <=5 s *goal* on older device, memory use recorded in MB, fps p50/p10, 20 min simulation stability, wake/suspend persistence, battery delta; no claims before running.
- Do not add permissions, trackers, ads, cloud calls, fonts from CDN, LLM downloads, or asset fetching.

Failure path: if budget exceeded, reduce simultaneous particles and ambient decorations before dropping gameplay fidelity or shrinking text/button hit targets.
