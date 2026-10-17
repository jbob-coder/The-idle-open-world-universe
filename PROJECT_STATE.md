## GODSEED v0.4 — cámara cenital / zoom 2D — 2026-10-17

CURRENT_OBJECTIVE: Primer lote de zoom para el juego autónomo medieval de Android. Implementado en `feat/skyview-zoom-v0.4`, sobre `feat/living-world-divine-v0.3`, sin cambios en `main`.

COMPLETED: (1) cámara top-down y seguimiento en coordenadas enteras, (2) por defecto 24×15 casillas con 3 zooms 24×15 / 16×10 / 32×20, (3) Nim y NPC con siluetas 2D más legibles, (4) render y minimapa adaptados al viewport activo, (5) diez botones de dock Android y puntería de poderes actualizada. Sin cambios en `src/sim.js`, autonomía ni esquema save v1.

TEST EVIDENCE: Chromium local a 640×360, 720×400 y 960×540, tres niveles por resolución, 10 controles visibles, 0 errores JavaScript. GitHub Actions `GODSEED offline QA` y `GODSEED sky view Android landscape captures` pasaron en el commit eb6cea11. La rama versiona el APK de depuración como v0.4, versionCode 4.

ARTIFACTS: `docs/SKYVIEW_CAMERA_V04.md`, CI con PNG reales del navegador, APK experimental de depuración en artefactos de Actions, y HTML offline generado desde `src/ui.js` + `src/sim.js`.

NEXT_ACTION: Completar 5 trabajos de sprites ambientales, animaciones por orientación, feedback divino, paneles compactos y prueba física Android. Antes de un lanzamiento estable: validar instalación de APK, FPS, consumo de memoria, persistencia WebView, firma compatible y restauración.

RISK: Los PNG en tamaño Android son capturas de Chromium, no emulador. La APK no ha sido probada sobre hardware real y utiliza clave temporal de desarrollo. Exportar datos antes de sustituir versiones. `main` no se sustituye hasta revisión.

GRAPH: `src/ui.js` → implementa → viewport y zoom · `index.template.html` → aloja → control táctil `Zoom` · `tests/mobile_acceptance.py` → verifica → targeting y guardado · `tests/capture_android_layouts.py` → genera → evidencias navegador · `android/build_apk.py` → empaqueta → APK v0.4 · `docs/SKYVIEW_CAMERA_V04.md` → explica → límites y backlog.

---

## GODSEED v0.3 — 17 octubre 2026 — fantasía medieval (PR #2)

CURRENT_OBJECTIVE: Integrar fantasía medieval en la simulación automática de Nim, los NPC y la interacción del dios. Rama `feat/living-world-divine-v0.3`, PR https://github.com/jbob-coder/The-idle-open-world-universe/pull/2 contra v0.2, sin tocar main.

COMPLETED: Caminos, dos aldeas, santuarios rúnicos, gráficos Canvas detallados, tres viajeros de gremio, Inspira con respuestas distintas, diario de peregrinación, pruebas específicas y documento `docs/MEDIEVAL_FANTASY_V03.md`.

VERIFIED_STATE: El simulador sigue offline y con esquema de guardado v1. CI ejecuta ahora `node --test tests/*.test.js`. Una primera ejecución detectó que Nim podía abandonar un santuario; se corrigió, y la ejecución asociada pasó. No hay pruebas físicas del APK v0.3.

NEXT_ACTION: Revisar la PR, comprobar interfaz horizontal en navegador y Android real, reconstruir APK con firma de prueba y medir rendimiento antes de integrar o publicar; después desarrollar relaciones sociales y más escenarios, en bloques de cinco.

RISKS: Maquetas no equivalen a capturas de Android real; la clave de firma CI es temporal. No prometer actualización APK compatible ni FPS sin verificar hardware.

FILES_CHANGED: `src/sim.js`, `src/ui.js`, `index.template.html`, `tests/sim.test.js`, `tests/mobile_acceptance.py`, `tests/medieval_world.test.js`, `.github/workflows/qa.yml`, `docs/MEDIEVAL_FANTASY_V03.md`, además de documentación visual.

GRAPH: `sim.js` → calcula → NPC/santuarios/recompensas; `ui.js` → dibuja → mundo medieval; `tests/*.test.js` → verifica → determinismo y guardados; PR #2 → propone integrar → v0.2.

---

## Actualización 2026-10-17 — documentación visual Android (sin cambio de APK)

CURRENT_OBJECTIVE: Documentar en español la visión del juego y proponer vistas Android horizontales coherentes con el rol de dios observador.

COMPLETED: Sección de README con descripción del juego, dos maquetas SVG de observación / poder Brotar, y `docs/ANDROID_UI_VISION.md` con cinco decisiones visuales, diferencias entre el estado real y el concepto, y siguientes cinco tareas.

VERIFIED_STATE: Los cuatro archivos de documentación/arte gráfico se publicaron en la rama experimental `feat/autonomous-adventure-v0.2`; la PR #1 sigue siendo el punto de revisión. Las maquetas no forman parte del renderizado de la APK y no prueban funcionamiento en Android real.

NEXT_ACTION: Revisar la propuesta con el usuario; implementar por lotes de cinco solo tras elegir dirección, sin añadir controles manuales a Nim; verificar APK en dispositivo real.

RISKS: Algunas imágenes promocionales pueden sugerir componentes aún no existentes. En README se etiquetan explícitamente los SVG como maquetas de concepto, no capturas de juego ni de Android.

FILES_CHANGED: `README.md`, `PROJECT_STATE.md`, `docs/ANDROID_UI_VISION.md`, `assets/concepts/godseed-android-observacion.svg`, `assets/concepts/godseed-android-intervencion.svg`.

TESTS_RUN: No se modificó código; verificación documental y de archivos GitHub únicamente. Las pruebas de simulación y APK no se reejecutaron en este lote.

GRAPH: `README.md` → explica → `GODSEED`; `docs/ANDROID_UI_VISION.md` → especifica → futura interfaz; `assets/concepts/*.svg` → ilustra → vista Android hipotética; `src/ui.js` → implementa → interfaz funcional actual.

---

# GODSEED project state — experimental v0.2

CURRENT_OBJECTIVE: Adapt selected generic RPG features from user-provided WYLDHEART gameplay clip without copying visual style. Offline, low-end Android, rule-based autonomous Nim; god player only directs environment.

FIRST FIVE FEATURE SLICE (LOCAL IMPLEMENTATION): Distinct seeded origins, five use-based proficiencies, automatic dodge/parry choices, ruin traps and scouting checks, legend/rumor leads to other ruins. New RPG systems show in the character panel and chronicle; saves from v0.1 receive defaults via restore().

VISUAL DECISION: Keep the low-resolution 2D god-view interface. Do not implement 3D realism, third-person camera or copied WYLDHEART assets. User explicitly requested gameplay content, not that game's appearance.

BOUNDARY: This is v0.2 experimental. No physical Android installation or performance test yet. Do not claim production release. CI signs with a temporary key; a new APK may not update an existing APK in place. Back up saves before uninstalling.

NEXT FIVE (PLANNED): Procedural tiny dungeons, autonomous magic, stealth/lockpicking, upgraded camps, lightweight NPC rumors/trade. Multi-agent co-op/shared XP only after profiling memory and performance.

# GODSEED project state — 2026-10-17

CURRENT_OBJECTIVE: Establish `jbob-coder/The-idle-open-world-universe` as the source of truth for GODSEED, a lightweight offline Android god-observation game. Player influences one autonomous character (Nim) through divine powers, not manual controls.

VERIFIED_STATE: Android debug APK v0.1 built and structurally verified; Java/JAR v1 signing passes; Node simulator has 10 passing tests; browser smoke and landscape-touch acceptance passed at the tested viewports. There is NO confirmed physical Android installation, performance benchmark, or production-ready APK. The native Android bootstrap uses hand-generated AXML/DEX and must be tested on an actual device.

COMPLETED:
- 64 × 48 seeded world with fog, resources, weather, day/night, ruins, and wildlife.
- Autonomous rule-based Nim: exploring, foraging, shelter, crafting, defending, experience/leveling, memories, and basic personality shifts.
- Player god powers: Heal/Bless, Food Gift, Bloom, Guide, Lightning; Faith economy; pause, 1×, 3×, 8×, step.
- Offline Canvas UI with landscape touch toolbar and save JSON copy/paste backup.
- Browser HTML preview, debug APK, source modules, tests, screenshots, design/QA documents.

IN_PROGRESS: Hardware QA, long-run stability, more legible AI explanations, skills, and richer ecosystem behaviors.

NEXT_ACTION (choose at most 5 tasks per slice):
1. Install the exact debug APK on Android 8+ device; collect install/launch result and screen recording.
2. Test cold start, save persistence, export/import, app resume and orientation.
3. Collect low-end device FPS, CPU, memory, and battery measurements over a 20-minute session.
4. Improve Nim's decision explanations and prevent impossible-goal loops, with deterministic tests.
5. Extend gathering/survival/combat/study/construction skills and verify save migrations.

BLOCKERS: No physical Android device or emulator was used in this source transfer. Public debug signing material is deliberately NOT committed; CI generates temporary debug signing keys, which means those CI-built APKs cannot replace previous installations without uninstall/export/import.

ASSUMPTIONS: No external services, cloud AI, or network permissions. Offline world simulation runs when the game is open; there is no autonomous background work while closed. This is an autonomous agent represented by deterministic code, not consciousness or an LLM.

RISKS: Handcrafted DEX/AXML may not load on every Android version despite structural tests. WebView file-origin localStorage behavior and touch/system insets differ by device. CI debug signing identity changes per runner. Public GitHub source ZIP must never include keystores or long-lived signing secrets.

DECISIONS: First release is a small, source-auditable offline prototype. No 3D, no costly AI model, no login, no heavy engine. Five system decisions per planning batch are recorded in `docs/DESIGN.md`.

FILES_CHANGED (handoff): Original prototype imported in full except local signing key, intermediate files and redundant binaries. Repository documentation, .gitignore and QA workflow added. The checked-in debug APK is `dist/GODSEED-v0.1-debug.apk`.

TESTS_RUN: See `docs/QA_REPORT.md` and validate against CI. The 10 Node tests, browser smoke, mobile touch browser tests, and package signature/structure were executed in the source transfer environment. Hardware testing NOT run.

GRAPH CONTINUITY:
- `src/sim.js` → implements → seeded world, Nim planner, progression, god actions.
- `src/ui.js` → renders → Canvas world, god controls, stats, chronicle, backup.
- `index.template.html` + `build.py` → produce → `GODSEED-Play.html`.
- `android/build_apk.py` + `GODSEED-Play.html` → produce → debug APK.
- `tests/sim.test.js` → verifies → deterministic simulation rules.
- `tests/test_android_package.py` → verifies → APK headers, embedded assets, JAR signature.
- `docs/DESIGN.md` → governs → 5-decision design batches.
