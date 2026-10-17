# Handoff completion criteria

## Prepared in this branch
- [x] Codex instructions in `AGENTS.md`
- [x] Vision, art bible, architecture, interaction spec and 5×5 implementation plan
- [x] Explicit autonomy/NPC rules, world lore, save safety and old-Android budgets
- [x] Four pixel PNG starter sheets in repository, with deterministic generator
- [x] Manifest / palette / sprite rect coordinates and prep concepts
- [x] 25 machine-readable Codex work items with statuses
- [x] Automated integrity workflow and validator — GitHub Actions verified exact atlas reproduction (successful run 39071055421)
- [x] Dedicated [PR #4](https://github.com/jbob-coder/The-idle-open-world-universe/pull/4) targets the v0.4 camera branch for review; not merged

## NOT yet implemented by the handoff
- [ ] 32x20 default high-sky camera (v0.4 currently 24x15)
- [ ] Runtime atlas renderer (present game draws Canvas rectangles)
- [ ] Finished walk cycles, autotiling and all described structures
- [ ] Finished power animation and activity feedback
- [ ] Final compact Android HUD refresh
- [ ] Real phone installation, FPS/memory/battery measurements
- [ ] Production APK with stable release signing

Use `work-items/codex-tasks.json` as implementation ledger. Do not count documentation prep as completed gameplay.
