# GODSEED — Living World Rebuild (V2)

## Product correction
The prior three-chapter game passed tests but was **not a living open-world
simulation**. NPCs mostly wandered around random steps; villages were symbolic
tiles, and the god selected scripted powers rather than expressing intent.
Combat and XP did not add up to an observable lifetime. Successful CI did NOT
mean the requested game experience was complete.

We will preserve the previous story-arc checkpoint as a known working build
while building **Living World V2** on a separate stacked PR.

## Target experience
GODSEED is an offline **visual life simulator**, closer in intent to a
visualized BitLife than a hack-and-slash quest game.

- The player is an observing god, not the Sims' controller.
- Each person has life history, personality, competencies, relationships,
  needs, occupation and individually chosen goals.
- Settlements are populations with homes, storage, food, work, local rules,
  architecture, roads, diplomacy, age/technology and generational changes.
- Plans are **suggestions and building constraints**, not a guaranteed script.
  Citizens choose if, when and where to build or redesign structures.
- A free-text God Whisper panel expresses intentions. Residents interpret and
  **may refuse**; survival can outrank any divine suggestion.
- The world must be spatially open: continuous neighboring map chunks without
  menu-only stages and without forcing Nim through one predetermined path.

## Implemented foundation in PR #17
- **Two rendered hamlets** Briarford and Emberwick at the existing genuine
  map anchors; start with houses/farms, grow with 1-tile rooftops, wells,
  workshops, markets and defenses (max 12 buildings per town).
- Buildings use terrain-aware blueprint site selection; they cannot overwrite
  water, roads, ruins, shrines or non-buildable forest/stone tiles. Wood and
  stone costs, food needs and bounded village trade apply.
- Four new persistent simulated citizens (Builder, Forager, Mason, Farmer).
  Alongside 3 existing travelers and Nim, there are **8 people** in the world.
  Citizens have distinct jobs, work routines, skills and earned connections.
  Existing 3 travelers follow daytime activities rather than pseudorandom
  one-step wandering.
- Town age labels Outpost → Hamlet → Village → Township. Buildings receive a
  town-chosen oak, reed or stone roof. Mature citizens may renovate homes
  without a god command.
- The god gets a text field, short offline English/Spanish keyword recognition
  for housing, farming, defense, craft, trade, exploring, rest and remodeling,
  visible acceptance/rejection, and no direct Nim teleport/movement. Negated
  instructions are conservatively refused. This is **not** open-ended natural
  language understanding or an offline neural model.
- Nim now keeps a simple career, age, earned friendships and life-event log;
  work, study, discovery and relationships matter alongside combat.
- Existing three story chapters, v1 save key, old import/exports, power limits,
  offline Android WebView, pixel-square art and safe Android exit are retained.
- Real Chromium acceptance tests and Node tests cover buildings, work,
  individual skill growth, God messages and post-reload persistence.

## Explicitly NOT completed by this PR

### P0 — True continuous open world
The baseline physical world is still **64×48 tiles**, not an open world.
Implement a separate chunk-oriented map engine, e.g. bounded loaded
32×32 chunks with deterministic seeded world generation plus sparse persisted
deltas. Camera/AI navigation/world coordinates must work across chunk edges.
Only keep nearby chunks active on 2GB Android while offscreen settlements tick
at reduced fidelity. Regions cannot remain hard-coded to 64×48 arrays.
Provide a versioned migration adapter for the original finite map and v1 save
files. Test seamless walks across edges and save/reload after crossing.
This work is **not** to be faked with a larger flat image or a teleport menu.

### P0 — Full settlement architecture and development
Present houses are **16×16 tile markers**, not complete multi-cell interiors.
Move to configurable 2×2/3×3 blueprint footprints with entrance,
collision/pathing, adjacency/terrain/purpose constraints, road and district
generation, build stages, work orders, shared material stockpiles and
architectural styles per culture. Citizen disagreements, vote/preferences,
remodeling and abandoning damaged buildings should change real structures.
Model technology/age advancement from production and discoveries, NOT from a
timer or number of prefabricated tiles alone.

### P0 — Person-centric visual life decisions
Life biographies, friendship, jobs, age and work XP need to evolve into
families, marriage, births, deaths, inheritance, education, illnesses,
personal values, memory of actions, independent relationship arcs, career
choices and meaningful events. Show choice→action→consequence in a readable
timeline with player-inspectable reasons for accepting or declining guidance.
Avoid one-line repeated attacks as the sole progression mechanic.

### P1 — Real offline God intent understanding
The current interpreter is a **small explicit ruleset**, not semantic AI. It
can only interpret listed types and rejects unknown and negated instructions.
For broader user phrasing, add an auditable on-device intent grammar or an
optional model if actual low-RAM profiling proves it feasible. Separate
understanding, citizen agreement, scheduling, execution, and outcome. Never
label a guess as understanding or fabricate an action that did not happen.

### P1 — Rebuild visual world and interaction
Multi-tile buildings with real readable styles, NPC animations/states and
environment props; optional inside-building inspections, a gods-eye world
overview, settlement ledger, life-event feed and more legible zoom levels.
Keep nearest-neighbor square pixel style and 2–3 GB TOTAL RAM target.

### P1 — Real-device release evidence
20-minute autoplay on physical 2GB and 3GB Android, proper native signing,
data-safe upgrades, 1GB installed content **target** (only when actual useful
content exists), optional app storage capped at 5GB, frame pacing/PSS/RSS
and offline save restore. See issue #13.

## Acceptance approach
Each future slice must produce real branch commits, deterministic simulation
tests with multiple seeds, offline Chromium screenshots and an Android emulator
run. Claim physical performance only from measured physical evidence.
Never merge into `main` or overwrite Codex's work without review.

**No artificial APK padding, fake AI/NPC actions or visual mock-ups passed off
as gameplay.** This document describes work completed AND known gaps so that
the requested experience is not misreported as 100% done.
