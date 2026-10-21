# GODSEED — owner-directed world and kingdom growth order (2026-10-20)

**Owner design requirement**: GODSEED is an expanding open world. A bounded pathfinder lookup is a CPU budget for *one route calculation*, not a hard boundary on an NPC's lifetime movement, community growth, or reachable territory. Do not mistake the current single homesteader, first camp, 20×20 homeland or 224-stop exploratory itinerary for the final world's population/territorial limits.

**Development sequence**:
1. Develop autonomous NPC fundamentals: survival, gather, craft, build, travel, social interaction, and persistent resource accounting.
2. Expand self-governing settlements and communication/trade between them.
3. Build **one fully functional kingdom**, connecting its settlements, leadership, society, resources, institutions and territory, including the kingdom's planned **dimensions**.
4. Only **after** this first kingdom is fleshed out, implement other kingdoms and their interactions.

The owner's use of **dimensions** is intentional but its exact mechanics are not yet specified; do not silently equate it with districts, parallel realms, territory layers, or a particular world coordinate system. Keep the world simulation able to support future dimension/kingdom identities without assigning invented ones to current saves.

**Engineering implications**: travel must support multi-segment, terrain-aware routing with small local searches over the generated world; NPC groups must later move between settlements without spawning free supplies; economy and save ownership must be scalable and migrate explicitly; leadership must be scoped to a settlement and, later, kingdom instead of assuming one universal elected council. Do not retrofit hypothetical kingdom IDs into existing schema-v1/v2 saves without an explicit migration.

**Current prototype is smaller than the goal**: `src/v3/expedition.js` has one independent homesteader Mira and one funded house; `src/v3/world_sim.js` uses a single large-world save key; `src/v3/society.js` retains a separate small founding council. Neither constitutes a kingdom. This file preserves owner intent; it does not claim kingdom code is finished or commissioned for immediate implementation.

**Next development focus**: make NPC planning and routes reusable, then allow additional camp households and role selection, with resource conservation, save restoration and bounded CPU budgets before implementing first-kingdom politics.
