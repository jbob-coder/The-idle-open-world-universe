# GODSEED — Loading screen and main menu

Design baseline 2026-11-26. See [design index](../README.md) for decision precedence and status. The following source sections are preserved verbatim; later approved decisions override earlier candidate wording.

## Loading screen — approved concept 06 (2026-11-26)

**Owner approval:** "Perfect" after the violet-and-amber cyberpunk redesign. This is the visual baseline for step 1, not an implemented screen.

- Dark near-black background with a subtle purple/navy gradient (#100b18 to #090b12).
- Multilingual words, characters, and digital fragments flow upward across the entire screen, including behind the title. No blank center, uniform columns, or evenly spaced grid.
- Vary text sizes, weights, typefaces, positions, opacity and accent colors. Use violet (#6552b6, #b78ee8), amber (#d19a48), muted grey-violet (#8f879f) and slate (#51576f). Avoid the previous green/teal palette.
- Central GODSEED wordmark: bold industrial sans-serif, light grey (#e6e4ea), tightly spaced, with a small dark outline and an offset angular violet underline (#b38be7).
- Single angular amber ENTER control (#d4a05b), dark lettering. No physical box, ornate frames, extra menu controls or ceremonial decoration. ENTER transitions directly to the main menu when initialization is ready.
- Restrained cyberpunk style; sparse fine interface accents at the edges only.

### Reproducible static reference
Reference viewport: 340 x 580; scale responsively without stretching text. Coordinates are in reference viewport units. Draw the gradient first, then the text layer, sparse edge accents, title and button. The static prototype used the following deterministic layout for 85 background fragments (JavaScript notation):
```js
const words = ["存在","ORIGIN","世界","011010","Χρόνος","生命","ÉVOLUTION","源","واقع","VOID","未来","存在する","意识","DESTINO","01","神","無限","MEMORY"];
const colors = ["#6552b6","#d19a48","#8f879f","#51576f","#b78ee8"];
for (let i=0; i<85; i++) {
  drawText(words[(i*7)%18], {
    x:(i*83+17)%370-15, y:(i*47+12)%590,
    fontFamily:i%3===0?"serif":"monospace",
    fontSize:i%13===0?29:i%7===0?19:7+(i*3)%8,
    fontWeight:i%5===0?"bold":"normal",
    color:colors[(i*7)%5], opacity:.12+(i%9)*.075
  });
}
```
Title: centered at (170,270), size 46, weight 900, letter spacing -2, fill #e6e4ea, stroke #0b0b10 width 1.5. Underline path: M47 282 H203 L216 279 H294, violet stroke width 2. Button path: M106 342 H247 V376 H94 V354 Z, amber fill opacity .94. ENTER centered at (170,364), bold monospace size 13, letter spacing 4, fill #151017. Fine amber accent line M99 384 H167. Edge accent paths M12 510 V412 M318 65 V172 M64 0 V83 M273 580 V494 and M21 114 H57 M291 471 H328, #9572c5 opacity .35 width .8.

### Implementation checks (pending)
- [ ] Upward text motion is continuous and nonuniform; no empty central mask.
- [ ] Title and button remain legible and responsive on mobile.
- [ ] ENTER navigates directly to the main menu after readiness; no physical box or additional confirmation.
- [ ] Recommended: use efficient rendering, avoid excessive text nodes, and provide reduced-motion support.
- [ ] Verify against the approved static reference.

Animation speed, timing, and implementation technology remain undecided. No source code or game assets changed. Next design stage: main menu.


## Main menu — approved concept 06 (2026-11-26)

**Owner approval:** "Perfect" in response to the open, centered menu with New Game, Continue, Saved Characters, Settings, and Return to Title. This replaces the earlier rejected card, dashboard, asymmetric and database-menu proposals.

### Visual baseline
- Keep the approved loading-screen violet-and-amber cyberpunk background with irregular multilingual fragments across the entire screen. Use the same 340 × 580 reference viewport, gradient and deterministic 85-fragment layout described above; the main-menu reference uses fragment opacity .12+(i%9)*.065. Background text flows upward in the intended implementation.
- No large panels, cards, heavy button outlines or blank center. Center the title and navigation. New Game is the largest and amber-highlighted option; Continue is light grey; secondary options are muted lavender. Preserve the open vertical spacing.
- Reference layout: GODSEED centered at (170,119), sans-serif weight 900, size 49, letter spacing -2, fill #e6e4ea, dark stroke #0b0b10 width 1.3. Violet underline M38 131 H203 L216 128 H302, stroke #b38be7 width 2.
- Horizontal separators M55 201 H285 and M55 339 H285, #9572c5 opacity .5 width .7.
- NEW GAME centered at (170,250), size 33, weight 900, letter spacing 1, amber #d4a05b, dark stroke #100b18 width .6. Amber side indicators M27 241 H39 L44 247 L39 253 H27 and M313 241 H301 L296 247 L301 253 H313, width 1.5.
- CONTINUE centered at (170,311), size 27, weight 700, fill #e6e4ea, dark stroke #100b18 width .5.
- SAVED CHARACTERS at (170,383) and SETTINGS at (170,428), centered sans-serif size 17, letter spacing 2, fill #d4c7e2.
- Amber accent M160 467 H180 width 1.5. RETURN TO TITLE centered at (170,534), monospace size 10, letter spacing 2, fill #a592bd. Subtle corner paths M15 550 V522 M15 550 H43 M325 30 V58 M325 30 H297, #9572c5 opacity .5.

### Navigation (proposed functional interpretation of approved labels)
- New Game → character creation, beginning with identity.
- Continue → resume the most recent valid character save; unavailable if none exists.
- Saved Characters → browse and select existing character saves; detailed save-slot UI and behavior to be defined.
- Settings → game preferences; exact settings to be defined.
- Return to Title → approved loading/title screen.

### Acceptance checks (not yet run)
- [ ] Match the approved visual reference without reintroducing rejected layout elements.
- [ ] All controls are readable, touch-accessible and functional; handle missing or invalid saves safely.
- [ ] New Game does not overwrite an existing character without explicit authorization.
- [ ] Preserve approved loading-screen and gameplay presentation requirements.

The appearance and menu labels are approved. Detailed save management and settings are not yet approved. No code or assets changed; no engine tests run. Next design stage: character identity / New Game first panel.

## Persistent-world save and load navigation — owner-approved (2026-11-26)

The owner approved one persistent universe and one active player-controlled character at a time, with new characters created within the same world. The owner requires a maximum of three save slots; when all are occupied, an existing slot must be explicitly overwritten to save into it. Committed actions are automatically saved; backups are for technical recovery, not intentional rollback. Load requires two-step verification. New Game creates a character in the existing world (initializes the world only on first launch); Continue resumes the valid active character. Preserve the approved visual menu direction. Saved Characters remains a character roster/history concept, not permission for separate worlds.

Proposed UI interpretation: the first Load step selects and reviews a slot, showing character, fictional date/time and validity; the second explicitly confirms loading. Make occupied-slot replacement deliberate and identify the selected slot. Cancellation makes no changes. This two-step Load safeguard is distinct from ordinary gameplay Continue, which still submits once without extra confirmation. Do not silently replace a seed or erase persistent history on load or overwrite.

Open conflict to resolve: whether older slots are intended to restore older game state despite the approved prohibition on intentional rollback. Recommended default is three slots referencing one authoritative timeline with safe recovery/reconciliation, not three independent timelines. Exact slot contents, autosave rotation/overwrite policy, Load entry placement, and voluntary character switching remain open. See [GAMEPLAY.md](GAMEPLAY.md). Documentation only; no implementation or tests performed.

## Save-slot deletion, Divine Judgement and stuck recovery — latest owner clarification (2026-11-26)

The latest rules in [GAMEPLAY.md](GAMEPLAY.md) supersede the preceding explicit-overwrite wording: there are three save slots; if all are occupied, the player must explicitly erase one before creating another save. Do not silently overwrite. Preserve the same world seed. Loading requires two confirmation steps.

After eight consecutive repetitions of the same reload, display the system notification: "The god is not pleased with your actions. Stop doing it or prepare for Divine Judgement." Twenty more qualifying repetitions result in character death (working interpretation: 28 total). After 18 rounds stuck in the same place, offer the optional reset to the previous save point. These are in-game system messages; no extra confirmations are added to ordinary gameplay Continue. Use the approved simple narrative-first presentation. Exact reload identity, rewind scope, penalty persistence, stuck detection and recovery exemptions remain pending as documented in GAMEPLAY.md. The prior no-intentional-rollback recommendation does not prohibit the explicitly approved stuck-recovery exception. No implementation or runtime tests performed.
