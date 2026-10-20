# GODSEED WLD-008: bounded offscreen autonomy proof

Status: isolated implementation candidate, not Android gameplay or 3D completion.
Owner: SENTRY-58. Base: WLD-003 -> WLD-002 -> WLD-001.
This is a no-player-input Node simulation proof using the existing seeded chunk store.

Two small citizen records move to real forest cells, remove trees as they harvest,
accumulate one wood per harvested tree, and spend four wood to establish a hamlet and
shelter. Their site IDs persist in WLD-002 sparse state. An observer farther than 32
tiles causes simulation decisions every 24 logical ticks instead of every 4 ticks;
time does not pass when the application is closed.

Memory boundaries: chunk store LRU maxActive option (1..16), 48 event records,
2 citizens, up to 250KB serialized state. State is cloned for external inspection.
A separate save record is used; existing legacy v1 game saves are never overwritten.

Acceptance: node --test tests/offscreen_society.test.js
Full test: node --test tests/*.test.js
CI verifies exact branch commit. Physical 2GB/3GB hardware and Android rendering
are NOT tested by this opt-in module. Population scale, true resource transport,
survival, genuine family founding, and 3D rendering remain future integration gates.
