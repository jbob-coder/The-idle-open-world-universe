# GODSEED Living World — 2×2 architectural integration

This branch is **based on PR #17** so the richer society simulation is preserved:
- Nim, 3 original travelers, 4 active village workers (8 visible people total);
- learned occupations, relationships, trades, settlements, distinct tech ages, independent God whispers and room for refusal;
- 3 prior story chapters and v1 save compatibility.

It integrates the strongest tested parts of a separate PR #20 prototype **without replacing** that richer society:
1. Every **new building** is a multi-tile 2×2 footprint with distinct native-pixel house, farm, workshop, market, well and watchtower art. Roof variations remain town-owned choices.
2. The actual blueprint placer checks *all four tiles* are suitable and near roads, not just a single origin tile. It rejects overlap, rare landmarks, shrine, roads, non-buildable terrain, villagers' homes and *persistent historic ruin sites* even after Nim consumes a ruin.
3. Existing saves with pre-upgrade 1×1 structures keep those old footprints exactly and render correctly. Future constructed homes use 2×2.
4. The autonomous ecology does not spawn resources inside built structures. Minimap reflects the actual building size.
5. Node regression suite checks four seeds, both village upgrades, heritage, collisions, legacy saves, pixel renderer, bounded memory and full prior-story regression. Offline browser/Android regression suites must still pass on the exact head commit.

**Important limitations:** The original map remains 64×48; true continuous open-world chunks are still not built. Interior interaction, collision-aware entrance pathfinding, urban districts, house maintenance and full BitLife-level biographies are still future milestones. PR #17 itself is a tested, unmerged branch and PR #20 remains a separate working experimental alternative; do not merge both alternate implementations or assume they compose automatically.

**Release safety:** No automatic merge to main; no claims about physical-device performance. Native Android on 2–3 GB actual RAM requires evidence in issue #13.
