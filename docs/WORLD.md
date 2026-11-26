# GODSEED — World geography and Apartment B2

Design baseline 2026-11-26. See [design index](../README.md) for decision precedence and status. The following source sections are preserved verbatim; later approved decisions override earlier candidate wording.

## World geography — approved location records (2026-11-26)

Owner approved a contemporary alternate Earth, familiar Earth-like geographical characteristics with original geography, and a rural coastal bay as the initial regional direction. The owner cited GTA VI as environmental inspiration, not as a source of copied characters, geography, story or assets. Meridian Bay in jbob-coder/Novel-story-rpg-game-chat-gpt (main) was inspected as a structural reference, not imported canon.

### Location record standard
- Do not create a detailed geographical map, exhaustive building plans or fixed geometry for each area. Establish basic location information and a brief scene description; develop detail progressively when required by gameplay.
- Each area has a stable unique ID, name, type, parent region, short description and basic functions/facilities where relevant.
- Represent travel as explicit point-to-point links (A to B), with a route ID, endpoint IDs, distance, distance units, direction/access and available travel modes as appropriate. Distances describe the actual route, not an inferred straight-line measurement. Mark unknown distances as unknown until established; do not invent them during narration as fixed facts.
- Keep distinct peer areas separate in the location registry. Avoid duplicate IDs, contradictory ownership or overlapping peer-area definitions. A contained location (e.g. shop inside a village) is a legitimate parent-child relationship, not an overlapping peer area.
- A junction or shared road is represented once and referenced by connected areas rather than duplicated. Do not infer adjacency, shortcuts or access from similar names or narrative proximity.
- Travel time derives from route distance, travel mode, conditions and interruptions; no universal fixed speed. Track the actor's actual location, or in-transit route and progress, without simultaneous presence at distinct locations.
- Places exist independently of player discovery. Keep established geography separate from player knowledge, current access and mutable conditions.
- The no-overlap rule is a logical/topological consistency requirement. Without spatial boundaries or coordinates, actual geometric non-overlap cannot be proven; introduce only minimal boundary references where a real ambiguity requires resolution, not a full map.

### Example (illustrative only)
A = fishing village; B = coastal town; C = farmland.
A–B = 8 km; A–C = 3 km. B–C has no established direct route. If the only authorized route is B–A–C, its distance is 11 km. No automatic B–C shortcut. Values and locations are examples, not canon.

### Pending implementation checks
- [ ] Unique location and route IDs, valid endpoints, no duplicate conflicting definitions.
- [ ] Parent-child containment is acyclic and distinguishable from peer-area membership.
- [ ] Routes, direction and access are explicit; no undocumented shortcuts.
- [ ] Distances and multi-leg travel reconcile; location and in-transit states remain consistent for player and NPCs.
- [ ] Progressive descriptions preserve established facts without unnecessary map creation.
- [ ] Starting region names, actual distances, climate, facilities and world boundaries require later design.

Documentation only. No engine code, assets, or other repository files changed; no runtime tests performed.


## Apartment B2 — first location baseline (2026-11-26)

Owner approved Apartment B2 as the first developed location and authorized outward development until basic needs are covered. The following is the delegated initial design baseline, subject to later owner corrections; it is not a runtime save or an exhaustive island map.

- Island planning envelope: 180 × 65 km, origin at southwest of the envelope, X east and Y north. This is a bounding rectangle, not a measured land area or real-world coastline. The rest of the island remains undefined at this stage.
- Anchor: LOC-0001, Apartment B2, at island X=145 km, Y=12 km. Local offsets in meters use the apartment doorway's horizontal position as (0,0), and local ground level as Z=0. Chosen design assumption: B2 is one floor above ground at Z=3 m; the identifier itself does not imply a floor.
- Region hierarchy: original unnamed island → unnamed southeastern rural coastal bay → unnamed small coastal settlement → distinct areas (residential building, residential street, town center, inland neighborhood, coastal corridor, waterfront). Area names are functional placeholders. These are logical containers, not travel nodes; individual interiors, municipal boundaries, coastline and building footprints are deferred.
- Development follows explicit connections, not a fixed-radius fill. The apartment's rooms are descriptive components for now; add room-level anchors only when useful. Ownership, household members, furnishings, money and rent depend on the character's starting circumstances. Do not force every alignment or age to start in this unit.
- Sites exist before discovery, but no named NPCs, shop opening hours, prices, inventory, transit timetable, guaranteed job, school placement, or guaranteed healthcare access are assigned. Access is contextual. No imported Meridian Bay canon.

### Location registry

| ID | Location | Local X (m) | Local Y (m) | Z (m) | Area | Brief information |
|---|---|---:|---:|---:|---|---|
| LOC-0001 | Apartment B2 | 0 | 0 | 3 | Residential building | Private dwelling; bedroom, bathroom, kitchen and living area; basic utilities. Tenure, furnishings and occupants depend on the character. |
| LOC-0002 | Upper-floor landing | 6 | 0 | 3 | Residential building | Shared corridor and stair access. |
| LOC-0003 | Building lobby | 6 | 4 | 0 | Residential building | Shared ground-floor entrance hall; no assumed staff. |
| LOC-0004 | Building entrance | 6 | 12 | 0 | Residential street | Exterior entrance and sidewalk access. |
| LOC-0005 | Residential street junction | 106 | 12 | 0 | Residential street | Local road connection to services and residential properties. |
| LOC-0006 | Town services junction | 306 | 12 | 0 | Town center | Small commercial street connecting everyday services. |
| LOC-0007 | Local bus stop | 106 | -58 | 0 | Residential street | Roadside transit stop; destinations, service and schedules not yet defined. |
| LOC-0008 | Grocery store | 306 | 42 | 0 | Town center | Food and household supplies; inventory and prices unspecified. |
| LOC-0009 | Community clinic | 356 | 62 | 0 | Town center | Basic outpatient care; staff, hours and availability unspecified. |
| LOC-0010 | Repair workshop | 306 | -48 | 0 | Town center | Vehicle or equipment maintenance; potential employment, no guaranteed vacancies. |
| LOC-0011 | Local school | 146 | 312 | 0 | Inland neighborhood | Education facility; grades, admissions and schedule to be defined. |
| LOC-0012 | Coastal road junction | 506 | 12 | 0 | Coastal corridor | Road access toward other settlements; no onward route yet established. |
| LOC-0013 | Fishing harbor | 506 | -188 | 0 | Waterfront | Small working harbor with fishing and boat maintenance; access and jobs depend on conditions. |
| LOC-0014 | Community recreation area | 16 | 132 | 0 | Inland neighborhood | Public outdoor area suitable for walking and ordinary exercise. |

### Point-to-point route registry

All initial links are bidirectional design connections subject to actual access, closures and actor permissions. Road-vehicle links connect public approach points, not private interiors; specific parking and vehicle access remain to be established. Distances are authored route lengths in meters, not surveyed measurements. Travel time is resolved later by travel mode, conditions, interruptions and access.

| Route | From | To | Distance (m) | Mode |
|---|---|---|---:|---|
| RTE-0001 | LOC-0001 | LOC-0002 | 6 | walk |
| RTE-0002 | LOC-0002 | LOC-0003 | 9 | walk/stairs |
| RTE-0003 | LOC-0003 | LOC-0004 | 8 | walk |
| RTE-0004 | LOC-0004 | LOC-0005 | 100 | walk |
| RTE-0005 | LOC-0005 | LOC-0006 | 200 | walk/road vehicle |
| RTE-0006 | LOC-0005 | LOC-0007 | 70 | walk |
| RTE-0007 | LOC-0006 | LOC-0008 | 30 | walk |
| RTE-0008 | LOC-0006 | LOC-0009 | 80 | walk |
| RTE-0009 | LOC-0006 | LOC-0010 | 60 | walk |
| RTE-0010 | LOC-0005 | LOC-0011 | 330 | walk/road vehicle |
| RTE-0011 | LOC-0006 | LOC-0012 | 210 | walk/road vehicle |
| RTE-0012 | LOC-0012 | LOC-0013 | 220 | walk/road vehicle |
| RTE-0013 | LOC-0005 | LOC-0014 | 160 | walk |

### Route-distance references from B2

- Grocery store: 353 m through the listed links.
- Community clinic: 403 m through the listed links.
- Repair workshop: 383 m through the listed links.
- Local school: 453 m through the listed links.
- Coastal road junction: 533 m through the listed links.
- Fishing harbor: 753 m through the listed links.
- Community recreation area: 283 m through the listed links.

### Validation and remaining scope

The design data was checked for unique location IDs and coordinate triples, unique undirected route pairs, connectivity from B2, inclusion within the planning envelope, and route lengths no shorter than the corresponding 3D straight-line endpoint separation. All checks passed on these authored records. This establishes logical connectivity, not surveyed shoreline or geometric area non-overlap; no polygon boundaries or detailed map were created. All 14 anchors and 13 links are reachable within the proposed graph.

Initial daily-life coverage: shelter, groceries, basic outpatient care, education, transport access, potential civilian employment, exercise and waterfront access. Actual availability and affordability are not guaranteed. Emergency hospital, larger institutions, utility network, detailed residences, road extensions, bus destinations, NPC population and economic data remain future work. No game code, assets or saves modified; no runtime tests performed.

## Local population extension — 2026-11-26

See [POPULATION_AND_EMPLOYMENT.md](POPULATION_AND_EMPLOYMENT.md) for the delegated first roster and organizations at existing anchors. This supersedes the earlier absence of named staff as a design reference only; current presence, access and hours remain unknown. The 14 anchors and 13 links remain unchanged.

## Local residence anchors — 2026-11-26

Twelve minimal dwelling anchors extend the existing 14 locations. The public/approach links below are authored bidirectional walking connections; private entry requires permission. Coordinates use the existing B2 local frame. The school and harbor approach references are not permission to cross restricted interiors. No prior coordinate or route is changed. See [LOCAL_LIFE.md](LOCAL_LIFE.md) for household assignments.

| ID | Location | X m | Y m | Z m | Connection | Route ID | Distance m |
|---|---|---:|---:|---:|---|---|---:|
| LOC-0015 | Apartment B1 | -7 | 0 | 3 | LOC-0002 | RTE-0014 | 14 |
| LOC-0016 | Residential dwelling 01 | 138 | 42 | 0 | LOC-0005 | RTE-0015 | 50 |
| LOC-0017 | Residential dwelling 02 | 126 | 52 | 0 | LOC-0005 | RTE-0016 | 50 |
| LOC-0018 | Residential dwelling 03 | 160 | 82 | 0 | LOC-0005 | RTE-0017 | 100 |
| LOC-0019 | Residential dwelling 04 | 136 | 92 | 0 | LOC-0005 | RTE-0018 | 95 |
| LOC-0020 | Town dwelling 01 | 266 | -18 | 0 | LOC-0006 | RTE-0019 | 55 |
| LOC-0021 | Town dwelling 02 | 276 | -28 | 0 | LOC-0006 | RTE-0020 | 55 |
| LOC-0022 | Inland dwelling 01 | 116 | 272 | 0 | LOC-0011 | RTE-0021 | 55 |
| LOC-0023 | Inland dwelling 02 | 176 | 272 | 0 | LOC-0011 | RTE-0022 | 55 |
| LOC-0024 | Waterfront dwelling 01 | 466 | -158 | 0 | LOC-0013 | RTE-0023 | 60 |
| LOC-0025 | Waterfront dwelling 02 | 456 | -148 | 0 | LOC-0013 | RTE-0024 | 70 |
| LOC-0026 | Residential dwelling 05 | 86 | 62 | 0 | LOC-0005 | RTE-0025 | 60 |

Current baseline: 26 location anchors and 25 links; every new residence connects to the previously connected network. Unique positions and feasible route lengths were checked. Geometric non-overlap is not proven; no map or footprints created.
