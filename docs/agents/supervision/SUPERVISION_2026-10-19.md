# GODSEED — Informe de supervisión directa 2026-10-19

**Supervisor de esta inspección:** SUP-GODSEED-01 (auditoría, NO claim de tarea de programación)  
**Hecho en la sesión:** consulta directa a GitHub, revisión de estados, PRs, SHAs, handoffs, reglas de transición y GitHub Actions.  
**Rama de coordinación examinada:** `docs/godseed-agent-task-governance-v1` SHA `ec178b9bc5dfeaaaeffee6940ce4553b36f9d545`.  
**Rama documental de supervisión:** `introduccion-al-proyecto`.  
**NO se modifica:** tasks.json, TASK_BOARD.md, tareas/claims, ramas de programación ni main. No hubo merges, cancelaciones ni retiros remotos de bots.

## Dirección aprobada y separación de hechos

Se prioriza la dirección expresada por el propietario: **3D con estética Pixel Squares, NPC Sims que desarrollan mundo y sociedades autonomamente sin intervención del jugador, dios observador, habilidades divinas por rediseñar**, con compatibilidad Android offline y preservación de saves versión 1. Referencia de origen: [PR #47](https://github.com/jbob-coder/The-idle-open-world-universe/pull/47), [enmienda de visión en issue #43](https://github.com/jbob-coder/The-idle-open-world-universe/issues/43). Los contratos antiguos de cámara 2D cenital son *legacy*, no autorización de continuar solo en 2D. **3D todavía no está implementado como juego real** en las PRs inspeccionadas; falta registrar explícitamente su hito de implementación e integración con la simulación.

## Estado del registro consultado

| Estado | Número |
| --- | ---: |
| planned | 34 |
| ready | 5 |
| claimed | 0 |
| in_progress | 3 |
| blocked | 3 |
| in_review | 6 |
| verified | 19 |
| done | 0 |
| cancelled | 0 |
| **Total** | **70** |

El registro y el TASK_BOARD.md concordaban en conteos. Verificar de nuevo el SHA antes de realizar transiciones.

## Bots, propiedad y supervisión de retiro

| BOT_ID | Tarea | Registro | Entrega consultada | Acción segura |
| --- | --- | --- | --- | --- |
| FORGE-27 | INT-002 | in_progress | `handoffs/INT-002.json`, SHA de rama `a5919223ec9092bb8f2ec4c4a35cc2576021c817` (base sin implementación) | obtener certificado y liberar legalmente a ready si se confirma cese de escritura |
| FORGE-27 | GOD-006 | blocked | `handoffs/GOD-006.json`; código `aead479e55d1f24a545eb69347a816448ab8c2ab`; browser CI fallido | conservar blocked; resolver fallo y publicación segura después de relevo |
| LIFE-26 | GOD-003 | in_progress | `handoffs/GOD-003.json`; código `c06af2bf400de41b7eb5c04162a6db0dce202383`; pruebas específicas NOT_RUN | obtener certificado y liberar legalmente tras verificar cambios preservados |
| LIFE-26 | ART-007 | in_review | `handoffs/ART-007.json`; PR #46 `0a2e82923983111db3ef2b03f34f5364e459235b` | mantener en revisión, recuperar inspección/UX agnóstica a 3D, no volver a ready |
| PATH-34 | WLD-004 | in_progress | PR #48 `4630fc9703f2fa5a7b2575ae838cafbad295976e`; NO handoff WLD-004 visto | exigir cierre QA/revisión y handoff al retirarlo, sin reasignación concurrente |
| CORTEX-19 | SIM-007 | in_review | `handoffs/SIM-007.json`; PR #45 `cff468e5095a6adb602143df403149acb2ffcdd6` | revisor independiente; preservar rama |
| FORGE-27 | WLD-007 | in_review | `handoffs/WLD-007.json`; PR #44 `0f226e4b6730d492b5f129d555138431de0064d9` | revisor/QA API29 nueva; no marcar verified sin pruebas |
| Varios | GOD-002, GOD-004, SIM-011 | verified | handoffs estructurados disponibles | no retroceder estado ni reclamar por retiro |

**Clasificación de retiros:** Se encontraron handoffs con `reason: owner_request` de múltiples bots; eso documenta intención y trabajo guardado, pero **no prueba que una sesión o runner externo esté apagado**, ni constituye por sí solo certificado final. No se autoriza cambio de owner basándose únicamente en la existencia de JSON. Para tareas en review/verified NO liberar a ready. Obtener certificados individuales y comprobar estado remoto al completar retiro.

## PR #48 WLD-004 — controles precisos

- HEAD: `4630fc9703f2fa5a7b2575ae838cafbad295976e`; PR abierta y draft, base `feat/wld-003-life-26-chunk-camera`; registro todavía dice `in_progress` y `pr: null` (desfase informativo; resolver via CLI al entregar).
- Pruebas exact-HEAD PASS: [GitHub Actions 39286125201](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39286125201) (QA), [39286132979](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39286132979) (QA), [39286133140](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39286133140) (Gradle/WebView + trabajo de emulador completado success). **NO** certifican móvil físico bajo RAM.
- Problema funcional identificado al inspeccionar `src/world/chunk_travel.js` de esa rama: para actor `work: null`, `nextGoal` llama `expeditionGoal` en cada tick y el objetivo se calcula desde `actor.x/y` actual. Eso desplaza la meta con cada movimiento y puede replanificar A* innecesariamente. Pruebas actuales de exploración no demuestran que una expedición sin trabajo **llegue** a un destino fijo e incremente el contador. [Comentario técnico previo en PR #48](https://github.com/jbob-coder/The-idle-open-world-universe/issues/48#issuecomment-6272063811). Exigir waypoint estable + regresión de llegada y save/restore sin intervención divina.
- Sigue siendo API `opt-in`; el avatar visible no viaja entre regiones en el gameplay integrado. No declarar navegación global jugable completada.

## Bloqueos y regresiones importantes

1. **GOD-006:** 93/93 tests Node PASS pero el Chromium del mismo SHA falló al pulsar un poder legado desactivado; tests nuevos propuestos nunca se publicaron. No sortear bloqueo de publicación por otras rutas sin autorización.
2. **GOD-003:** rama y seis commits recuperables, CI general 108/108 PASS según handoff; falta prueba dedicada del ciclo sugerencia → hecho observado; no PR.
3. **WLD-007:** API29 exact-HEAD no tiene 6/6 PASS verificado; run de emulador cancelado (previo SHA 3/6 FAIL). Mantener en revisión.
4. **ART-007:** UI móvil Canvas 2D revisable/recuperable, pero NO se puede aceptar como implementación de vista 3D del dueño; diseño de poderes legacy a reemplazar por GOD-006 tras validación.
5. **SIM-007 + SIM-011:** trabajos realizados en ramas apiladas hermanas que tocan archivos compartidos; integración necesita resolución de conflictos y pruebas conjuntas.
6. **Sin certificados de apagado verificables:** el supervisor no puede cerrar chats externos ni desactivar runners. Hay evidencia de handoff; el estado externo permanece no confirmado.

## Selección siguiente y revisión de obsolescencia

**Tareas ready sin dueño:** WLD-008 (memoria/LOD, P0, prioridad siguiente al liberar PATH-34), WLD-009 (atlas de dios; adaptar a 3D), ART-001 (animaciones habitantes; adaptar assets a 3D), ART-004 (biomas/clima; adaptar visualización a 3D), REL-001 (firma/upgrade Android; preservar). No reclamar todas. Si hay un bot sucesor totalmente libre, puede tomar **una** tras comprobar SHA y dependencias.

**Conservar:** WLD-001/002/004/008, SIM-001/002/007/011, sistemas de autonomía, interiores, guardados, IA, QA y economía. **Adaptar:** ART-001, ART-002, ART-007, INT-005, WLD-009 donde se prescriba render exclusivamente 2D. **Proponer nuevo alcance:** arquitectura/rendimiento de cámara y mundo 3D Pixel Squares, un primer mundo 3D mínimo observable con un NPC autónomo, construcción dirigida por decisiones Sims. **Cancelar ahora:** ninguna; antes debe existir revisión de dependencias, reemplazo, aprobación legal y status_history.

## Acciones de supervisión derivadas

1. Solicitar a FORGE-27 y LIFE-26 certificados finales y liberación por la CLI de INT-002 y GOD-003 **si cesó de verdad su ejecución y sus handoffs están validados**. El supervisor no suplanta sus identidades.
2. Pedir a PATH-34 cerrar el defecto de expedición, probar un Sim sin empleo, y registrar PR #48 en estado correcto cuando esté entregada. Mantener claim hasta relevo o en revisión aceptada.
3. No transferir GOD-006 bloqueada, ni INT-003/ART-007/SIM-007/WLD-007 en revisión, a nuevos autores como tareas libres. Continuar revisión independiente según gobernanza.
4. Proponer un hito técnico 3D y la migración de UI 2D a render de POV 3D sin destruir las PRs previas; verificar que no duplique una tarea existente antes de registrarlo.
5. Nueva consulta de GitHub antes de actuar; no prometer una vigilancia de fondo no configurada.

**Estado real del presente informe:** supervisión ejecutada y hallazgos documentados. No se fingieron retiros, transferencias, CI, 3D jugable ni fusiones.