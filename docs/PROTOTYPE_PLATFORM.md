# GODSEED — Playable prototype and platform options

Status: Q38 owner direction; Q39 platform choice delegated in follow-up. Development direction selected below; release versions and native integration not yet verified. Existing game direction is original text-only novel-style contemporary alternate Earth. No HTML/WebView game medium. Existing JavaScript reference code and Node SQLite are development-only, not a shipped Android app.

## Prototype acceptance scope (proposed)

Build a functional vertical slice around the player, not a single static story. Start from the documented 26 local anchors, 25 route references and first 12 reference NPCs, with complete profiles and histories before activation. The player need not always live in Apartment B2; origin follows age/background. Connect character creation, player movement, home/needs, shop purchases, relationships, conversation, school or employment as age appropriate, health, basic training and applicable conflict. Include status header, prepared choices, Continue once, long original narrative passages, and news relevant to actual world state. Include visible alternatives and meaningful outcomes even when the player refuses an activity. Track time, observations, NPC independent activity, assets, resource budgets, and environmental changes. Use the owner-approved save/rewind policy only after separate design validation. Early prototype may use a small reviewed ability subset, but the full 10,000-catalog requirement remains; owner must approve any staged content release. Advanced high-energy rift civilizations and rare permanent stabilization are COMING SOON.

A passing slice requires actual integrated local gameplay across several fictional days, at least two plausible paths through daily life, evidence of offscreen NPC consequences, varied non-routine interactions, and review of prose quality. No arbitrary fixed completion percentage. The first 12 NPCs are reference drafts, not active residents. Prepare required domains and data before activation. No mandatory story railroading.

## Platform alternatives

| Option | Advantages | Tradeoffs |
|---|---|---|
| A. TypeScript/JavaScript simulation core + React Native/Expo native UI + expo-sqlite | Closest language fit to current JS references; native text, touch and scroll views; Android support; no HTML game medium. | Node-specific database, filesystem and process APIs must be replaced by mobile adapters; benchmark JS engine, scrolling and database transactions. |
| B. Kotlin + Jetpack Compose + Room/SQLite | Android-first native UI and strong platform lifecycle/database tooling; good fit for long-text interaction. | Port/reimplement JS reference logic in Kotlin and rerun equivalence tests; higher initial migration effort. |
| C. Godot with Control/RichTextLabel UI | Game-oriented editor and Android export; useful if graphical gameplay is added later. | Text-only focus does not need 3D/game-loop rendering; port or bridge JS logic and verify database integration; engine version must be pinned and checked. |
| D. Node.js terminal prototype first, then A or B | Fastest isolated use of current reference logic for narrative and simulation testing; inexpensive local testing. | Terminal is not final mobile UI and cannot demonstrate Android touch/lifecycle; must avoid permanent Node-only architecture. |

Recommendation: D followed by A after a small native proof-of-concept, unless owner chooses Android-native Kotlin for long-term platform control. Use platform-independent state/actions/domain logic and a narrow storage/clock/UI contract. No cloud inference or paid build services required by design; actual tooling/build costs and device compatibility must be verified. Pin supported SDK/engine versions only after environment inspection. Test same scripted fixture on desktop and target Android (normal close/reopen only in automated development). Owner retains exclusive force-stop device testing. No SDK installed, no native build or port performed.

Official platform references for implementation-time verification:
- React Native native components and APIs: https://reactnative.dev/docs/components-and-apis
- React Native scroll performance: https://reactnative.dev/docs/scrollview
- Expo SQLite: https://docs.expo.dev/versions/latest/sdk/sqlite/
- Android Jetpack Compose: https://developer.android.com/compose/
- Android Jetpack/Room: https://developer.android.com/jetpack/androidx/explorer
- Godot Android export: https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_android.html

## Next decision gate

See the follow-up in [OWNER_DECISIONS.md](OWNER_DECISIONS.md) for pregame biological options, provisional NPC generation budgets and passive classification. Agree on documentation completeness and staged ability creation. Then prioritize actual domain mechanics and narrative vertical slice alongside necessary save-policy architecture; defer additional storage optimization that does not block the slice. No existing runtime or save modified.

## Delegated platform decision

Selected D then A: Node.js reference prototype, platform-neutral JavaScript/TypeScript simulation, native React Native/Expo Android UI and mobile SQLite adapter. Existing Node-specific APIs are confined to adapters and test tooling. This is a technical direction, not an installed SDK, proven mobile build, fixed release version or guaranteed performance. Preserve the existing repository and test equivalence during porting. No HTML/WebView and no automated force-stop tests.
