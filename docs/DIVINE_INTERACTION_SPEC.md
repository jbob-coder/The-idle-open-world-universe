# Divine intervention — mechanical and visual contract

The god changes world conditions. Nim and other agents retain autonomy. UI taps MUST be mapped to world tile using dynamic viewport/letterbox transform, and click failure MUST NOT consume Faith.

## Existing simulator interface
`GodseedSim.power(state, kind, tileX, tileY) -> {ok:boolean, why?:string, cost?:number}`
`const COST={bless:4,gift:5,bloom:6,guide:3,storm:8,inspire:5}`.
Do not modify costs or tile targeting without explicit gameplay tests. Render layer should read event log / marks but should not duplicate `power` calls.

| Power | Legal target / real action | Distinct pixel feedback | Actor response |
| --- | --- | --- | --- |
| Inspect | Any visible tile | crisp tile-corner indicator, info panel | show object/NPC/state; no Faith |
| Bless | valid world tile (affects Nim) | four-point gold/green cross above Nim, 4 frames | heal/energy change visible; Nim stays autonomous |
| Gift | valid tile (affects Nim) | wrapped ration/three pixel sparkle icons | supplies Nim, no forced eating |
| Bloom | valid tile, random nearby grass -> bushes | 3-stage sprouts and herb particles in area | Nim may later forage on own |
| Guide | walkable destination | dashed rune breadcrumb and bright target | Nim may follow omen when needs permit |
| Storm | world tile | 1px dark cloud, jagged bolt, fading ash | eligible nearby enemies dispersed; no direct combat input |
| Inspire | **revealed traveler within 1 tile of tapped point** | role-color sigil, halo then 2 pixel sparks | traveler later executes one occupational favor |

## Interaction states
`Idle` -> `PowerSelected` -> `TargetHover` -> (`Invalid` toast with no Faith loss OR `Applied` -> `EffectPlaying` -> `Settled`). User can switch power at any time; no retained action queuing while app is closed. All powers remain keyboard accessible as presently mapped by UI.

## NPC reactions (v0.3 mechanics already present)
- Apothecary: respond to Inspire through herb activity.
- Squire: respond by warding away nearby danger.
- Rune Scholar: respond by revealing/relating a ruin.
- NPCs keep independent mobility and trust/mood. The god does not teleport or puppet them.
- Each favor is consumed once. Visual FX must be driven by the *same* simulator event, not a timer that grants rewards again.

## Interface API proposed (future, not implemented)
`visualFx.enqueue({kind, x, y, actorId?, eventTick, durationTicks?})`
`visualFx.draw(ctx, camera, simTick)` and `visualFx.clearOnWorldReset()`.
Use `eventTick` as deduplication key; do not persist transient FX in the gameplay save. Effects should survive visible animation pacing, but not require background timers in a paused world. Render distinct invalid-target state before committing power.

## Accessible fallback
Show human-readable one-line text ("Ira feels inspired", "6 Faith spent", "Cannot guide across water"). Effects are never the *only* proof of state change. In reduced-motion settings, show one static symbol plus the chronicle entry rather than motion.

## Acceptance checks
Bless increases Nim HP/energy once; Inspire costs exactly 5 Faith when successful; invalid/unseen NPC costs 0 Faith; Bloom only modifies appropriate tiles; selected power state remains visible; click transform hits correct tile at 640x360, 720x400, 960x540, 3 zoom levels, including letterboxing and device safe areas.
