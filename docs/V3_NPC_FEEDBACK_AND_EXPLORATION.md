# GODSEED V3 — terrain-aware NPC roaming (2026-10-21)

## Why
The frontier resident's prior exploration action targeted only a 5-by-5 square near her home. Even when survival and construction worked, she circled the same tiny patch, giving the appearance of a scripted, stuck character.

## Implemented
- Replace five-tile fixed patrol with a deterministic, terrain-aware destination planner. Radius expands with individual curiosity, and available targets change with simulation time and security preference.
- NPC navigation uses the existing bounded `Nav.local` search and moves exactly one adjacent free tile per simulation tick. Tree occupancy is checked; negative chunk coordinates are valid. No camera dependence or teleporting.
- Keep the already implemented `Agency.observe` real-world feedback for gathering, building and exploration; throttle repetitive exploration *failure* updates to one per eight ticks to avoid saturating learned penalties from a single obstacle.
- At most two local route searches are performed per exploration decision, protecting offline low-memory Android performance. No save schema change; all movement and adaptation remain inside existing state.
- Regenerate `GODSEED-V3-Play.html` from all V3 sources so upstream learning and chunk improvements reach the standalone Android WebView bundle.

## Verification
`tests/v3_live_npc_learning.test.js` covers live construction outcome persistence, multiple reachable exploration targets, and signed chunk seam obstacle avoidance. Execute `node --test tests/*.test.js`, `python build_v3.py` and `git diff --exit-code -- GODSEED-V3-Play.html`, and exact-head browser/Android CI before releasing an APK.

## Limits
Only the existing frontier resident and traveler are in scope. Multiple independent settlement founders, realistic social institutions, large-scale economies and survival simulation for many off-screen NPCs are still unimplemented. No new APK or physical Android result is claimed here.
