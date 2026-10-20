> **REGISTRO HISTÓRICO (2026-10-20):** Las identidades/tareas sugeridas aquí no representan propietarios ni disponibilidad actuales. No activar bots directamente desde esta tabla; leer [autoridad de producto y referencias](https://github.com/jbob-coder/The-idle-open-world-universe/blob/docs/godseed-agent-task-governance-v1/docs/PROJECT_AUTHORITY_AND_REFERENCE_STATUS.md) y el registro vivo de tareas.

# GODSEED — Primera tanda de bots y tareas paralelizables
**Estado:** propuesta de lanzamiento, no reserva. Las tareas `ready` deben reclamarse en `tasks.json` antes de modificar código; una sugerencia aquí **NO** asigna propietario. Consultar [TASK_BOARD.md](./TASK_BOARD.md) en GitHub en vivo.

**Ejecución ♾️:** usa el [prompt de automatización continua](./INFINITY_AUTOMATION_PROMPT.md) para que cada bot actualice tareas, entregue resultados y continúe con otra tarea independiente dentro de su sesión activa. Este documento es solo una propuesta inicial de tareas y no un registro de propiedad.

**Para una nueva conversación sucesora:** usar el **MODO B** de [`CHAT_RETIRE_AND_RESUME.md`](./CHAT_RETIRE_AND_RESUME.md), leyendo el [índice de relevos](./handoffs/README.md) y la tarea actualmente asignable. No reutilizar el nombre ni los permisos de propiedad del bot saliente.

## Recomendación para cinco bots independientes

| Identificador propuesto | Tarea disponible actualmente | Primera entrega comprobable | Aislamiento sugerido |
|---|---|---|---|
| `WORLD-01` | **WLD-001** — Chunk generator | `src/world/chunks.js` puro: 32×32, semillas, coordenadas negativas y millares de tiles, Node tests; **sin reemplazar cámara todavía** | Mundo/chunks; no tocar `src/ui.js` |
| `LIFE-01` | **SIM-001** — Necesidades | Componente de hambre, energía, seguridad, higiene, comodidad y social, con migración opcional y prioridades simulables | Vida/needs; coordinar cambios de `src/sim.js` con WORLD |
| `GOD-01` | **GOD-001** — Lenguaje limitado auditable | Parser español/inglés con negación, objetivos, ambigüedad, rechazo razonado, tests de frases desconocidas | `src/divine/intent.js` o nuevo módulo; no alterar resultados sin pruebas |
| `OBS-01` | **GOD-004** — Vista de observador | Inspector de habitante/pueblo/edificio y diario de decisiones, solo lectura, navegador offline probado | UI y renderer; coordinar con otras personas que toquen `src/ui.js` |
| `QA-01` | **QA-001** — Regression harness | Seeded roundtrips y chequeos de capas/sociedad/saves; CI con evidencia exacta y tests que fallen ante corrupción | Tests y workflow; no alterar gameplay para que un test pase |

### Rama y estado de cada bot
Cada bot elige nombre estable propio; los IDs anteriores son **sugerencias**, no registros efectivos. Debe ejecutar:

```bash
python3 tools/godseed_tasks.py validate
python3 tools/godseed_tasks.py transition WLD-001 claimed --expect ready \
  --actor WORLD-01 --branch feat/wld-001-deterministic-chunks \
  --note "Reservo generador espacial determinista y sus pruebas"
git add docs/agents/tasks.json docs/agents/TASK_BOARD.md
git commit -m "task(WLD-001): claimed by WORLD-01"
git push origin HEAD:docs/godseed-agent-task-governance-v1

# Después de confirmar la reserva en GitHub:
python3 tools/godseed_tasks.py transition WLD-001 in_progress \
  --expect claimed --actor WORLD-01 \
  --note "Implemento chunk 32x32 sin modificar mapa actual"
```

Cada bot debe ejecutar el mismo protocolo con su tarea y nombre, además de publicar el segundo cambio de estado. Si alguna de esas tareas deja de estar `ready`, **no seguir el ejemplo a ciegas**.

## Tareas que no deben tomar todavía
- `GOV-001` y `INT-001` están en revisión en [PR #22](https://github.com/jbob-coder/The-idle-open-world-universe/pull/22). No duplicar ni usurpar. Hasta la verificación, `INT-002` (edificios grandes), `INT-003` (interiores persistentes), `CIV-001` (planos grandes) y `ART-002` (arte de interiores) siguen bloqueadas por **dependencias de trabajo** en estado `planned`, no se consideran tareas libres.
- `WLD-002…WLD-010` no pueden asumirse completas por empezar WLD-001. Un generador de chunks por sí solo **no vuelve abierto** al juego.
- `QA-004` está explícitamente `blocked` en [issue #13](https://github.com/jbob-coder/The-idle-open-world-universe/issues/13): hacen falta teléfonos físicos de 2 y 3 GB RAM y mediciones.
- PR #20 es otro motor social experimental: no integrar el mismo cambio por dos ramas distintas.

## Qué pedir a cada bot cuando regrese
1. `TASK_ID` y `BOT_ID`, transición del estado, **commits del registro publicados**.
2. Rama y SHA del gameplay; PR enlazado a la base correcta; conflictos detectados.
3. Funcionalidad que **funciona en runtime**, no solo un documento.
4. Pruebas Node, Chromium/Playwright offline, Android/Gradle/emulador si aplica, con resultado y enlace exacto del run.
5. Guardado v1/migraciones, consumo de recursos, protección de terreno, memoria y límites conocidos.
6. Siguiente tarea libre sugerida, sin reclamarla hasta que el propietario lo autorice.

**Primera meta real:** conseguir que Nim y aldeanos formen una vida autónoma más rica, construyan edificios con puertas reales y puedan entrar a un interior cuadrado medido en m²; a continuación, que esa sociedad pueda viajar por mundo de chunks. Documentación terminada ≠ juego terminado.
