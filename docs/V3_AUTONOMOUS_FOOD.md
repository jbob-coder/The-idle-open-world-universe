# GODSEED V3 — autonomous food and hunger (2026-10-20)

This gameplay slice adds actual, deterministic **food work** to the isolated
20×20 Pixel Squares world. It does **not** yet implement farming, marriage,
population growth, hunger deaths, cities or kingdom development.

## Implemented

- Eight seeded berry bushes per world; bushes never overlap historical trees.
  Each starts with two edible units and can hold at most two.
- Natural growth occurs once per 48 simulation ticks per bush with space.
  Each new unit is counted in `grown` and never appears unaccounted.
- Once two settlers independently construct the original shelter and accumulate
  four spare lumber, they decide to forage when the communal food inventory is
  below three units. They travel to a real bush, harvest one unit, and return
  to settlement work as needs change. No divine command is needed.
- Every 32 ticks citizens become hungry. They eat from shared food inventory,
  with a consumption event; severe lack of food lowers their energy. This is an
  early need model, **not** a complete mortality or family simulation.
- Berry bushes, hunger, food storage, natural production, foraging and eating
  are now inspectable through the WebGL world, Canvas fallback, stats and
  recent-event chronology.

## Save compatibility and accounting

The V3 simulation save schema advances **from 1 to 2**, retaining the same
isolated `godseed-v3-prototype-v1` storage key. Loading a schema-1 **V3**
save migrates its food state without rewriting the historical tick, seed,
citizens, positions, harvested forest, wood, shelter or event history.
The separate older GODSEED V1 Android game's save identity is untouched.

The validator enforces these equations for every persisted snapshot:

```
food = foraged - eaten
sum(berryBush.stock) + foraged = (2 * bushCount) + grown
wood = harvested - spent
forestRemaining + harvested = originalSeedForestCount
```

`grown` is also bounded by the number of regrowth cycles elapsed, and each
plant must use its original seeded coordinates and bounded capacity. Invalid
saves fail closed, rather than silently producing fictitious stock.

## Verification required

- `node --test tests/v3_sim.test.js` includes 100 seeds of deterministic
  autonomous foraging/consumption, no stock fabrication, old-V3 migration,
  tampering rejection and the existing lumber conservation tests.
- `python build_v3.py` must reproduce `GODSEED-V3-Play.html` byte-for-byte.
- `python tests/v3_browser_acceptance.py` must still pass WebGL and fallback
  rendering, stats, self-founded home and save/reload.
- Android builds and API29 emulator tests remain independent acceptance gates;
  neither browser green CI nor this document proves low-RAM physical hardware.

See the precise GitHub Actions results at the **implementation SHA**. A
documentation-only commit does not by itself qualify a game build.
