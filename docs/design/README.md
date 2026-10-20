# GODSEED V3 — Biblioteca de diseño para bots
**Autoridad de requisitos:** visión actual del propietario (18/oct/2026) + código inspeccionado de PR #21. **Esta rama contiene DOCUMENTACIÓN, no gameplay implementado.** Las imágenes conceptuales generadas en el chat son referencias visuales, no screenshots de aplicación funcional ni pruebas de CI.

## Orden recomendado de lectura
1. [Visión y bucle como dios](GODSEED_V3_VISION_AND_PLAYER_LOOP.md): qué es el juego, qué no funciona aún y sus prioridades.
2. [Interfaz del dios y poderes](GOD_VIEW_AND_DIVINE_POWERS_V3.md): juego observable, mapa mayoritario, controles contextuales, influencia sin control.
3. [IA, inteligencia, personalidad y familias](SIM_INTELLIGENCE_PERSONALITY_FAMILIES_V3.md): necesidades, habilidades, conocimiento, biografía, decisiones y descendencia.
4. [Colonias, reyes, reinos y dinastías](KINGDOMS_COLONIES_DYNASTIES_V3.md): fundaciones reales, recursos, gobiernos, legitimidad, sucesión, tratados.
5. [Escala, guardados, rendimiento y Android](ANDROID_WORLD_SCALE_SAVE_V3.md): LOD por colonia/persona, memoria baja, persistencia por eventos y migración v1.
6. [Ruta verificable de implementación](IMPLEMENTATION_TRACK_V3.md): tareas, dependencias, ejemplos jugables y criterios de aceptación.

## Antes de editar
Consulta `docs/agents/README.md`, `docs/agents/BOT_MASTER_PROMPT.md`, `docs/agents/tasks.json` y `TASK_BOARD.md` **siempre en la rama de coordinación actualizada** `docs/godseed-agent-task-governance-v1`. Confirma claims/owners y PRs abiertos. Esta rama documental parte del registro conocido, pero pueden existir commits posteriores de otros bots; no restablecer ni sobrescribir el registro del coordinador con una copia vieja. La base de ejecución de gameplay sigue `integration/godseed-living-society-multitile-architecture` / PR #21; PR #32 loading screen separado.

**Mapeo principal**: nuevo GOV-004 documenta; GOD-006/007 poderes y cronología; SIM-011/012/013 mente/familias/performance; CIV-009/010 gobernantes/colonias; ART-007 HUD. Otras dependencias están en `tasks.json`; un PR verde no convierte una función en `done`. Ninguna especificación autoriza saltarse Android offline, tamaños físicos de edificios, simulación autónoma o la aceptación de un revisor.
