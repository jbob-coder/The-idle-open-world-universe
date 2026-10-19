# GODSEED — Solicitud del propietario: relevo de bots y limpieza de alcance

**Fecha:** 2026-10-19 (America/Puerto_Rico)  
**Estado:** plan de coordinación pedido directamente por el propietario. No equivale a tareas reasignadas, canceladas o PRs fusionadas.  
**Orden recibido:** «Toma las tareas de los otros bots y hazlas tú, y haz lo que ya no sea necesario».  
**Fuente de diseño:** [PR #47](https://github.com/jbob-coder/The-idle-open-world-universe/pull/47), [intro del proyecto](./INTRODUCCION_AL_PROYECTO_PROMPT.md) y [corrección owner #43](https://github.com/jbob-coder/The-idle-open-world-universe/issues/43#issuecomment-6271386906).  
**Coordinación publicada:** [issue #27 / comment 6271995553](https://github.com/jbob-coder/The-idle-open-world-universe/issues/27#issuecomment-6271995553).

## Interpretación segura de la orden

El propietario autoriza **preparar y realizar un relevo de tareas**. Esto no permite afirmar que un bot ha guardado cambios locales que no podemos observar, sobrescribir ramas ajenas, aprobar pruebas pendientes o borrar funcionalidad útil. A cada tarea debe aplicarse el protocolo documentado en `docs/agents/CHAT_RETIRE_AND_RESUME.md` (MODO A → MODO B) según el estado real de GitHub actualizado.

Un único agente no puede reclamar simultáneamente múltiples tareas: primero debe concluir, bloquear con evidencia o entregar a revisión su tarea activa. Una PR `in_review` permanece a disposición de revisión independiente, y no debe recodificarse desde cero.

## Instantánea leída del registro de tareas

**Referencia:** rama `docs/godseed-agent-task-governance-v1`, `docs/agents/tasks.json` blob SHA `56d09bb2d73282a4b9a03213234d4e1c94f4b3db`. Es una instantánea, NO usarla para reclamar sin volver a leer el registro.

| Tarea | Estado de ese registro | Bot | Acción segura propuesta |
| --- | --- | --- | --- |
| INT-002 | in_progress | FORGE-27 | Pedir MODO A; preservar rama `feat/int-002-forge-27-metric-buildings`, pruebas y commits antes de liberar. |
| GOD-003 | in_progress | LIFE-26 | Pedir MODO A; preservar rama `feat/god-003-life-26-consequence-ledger` y semántica de aceptación/rechazo de los Sims. |
| WLD-004 | in_progress | PATH-34 | Trabajo propio: navegación autónoma entre chunks. [PR draft #48](https://github.com/jbob-coder/The-idle-open-world-universe/pull/48). Aún NO aceptado para juego real. |
| INT-003 | in_review | GDS-KESTREL-1810 | Revisar PR #36; no reclamar de nuevo ni alterar su rama. |
| WLD-007 | in_review | FORGE-27 | Revisar PR #44; dependencia importante para conectar guardados v1 con viajeros globales. |
| SIM-007 | in_review | CORTEX-19 | Revisar PR #45; conservar historial individual para Sims emergentes. |
| CIV-001 | in_review | TERRAIN-01 | Revisar PR #35; conservar lógica de ocupación/huellas aunque su representación pase a 3D. |
| ART-007 | in_review | LIFE-26 | Revisar PR #46; implementación 2D previa: conservar funcionalidad útil, proponer sustitución visual 3D sin atribuir 2D al propietario. |
| QA-006 | in_review | SCOPE-31 | Revisar PR #42 y ajustar criterios de aceptación a 3D cuando se coordine. |

## Clasificación preliminar de requisitos heredados — no cancelación ejecutada

**Conservar y adaptar:** necesidades, elecciones propias, trazas de decisiones, guardados, simulación offline, mundo de chunks, navegación, economía, casas habitables, seguridad de interiores, familias, linajes, colonias y reinos. El nuevo 3D no invalida su lógica de simulación.

**Marcar para revisión / posible sustitución:** arte obligado a sprites minúsculos 16×24, vista 2D cenital como único modo, reglas que prohíben 3D, HUD y poderes sin sentido, restricciones gráficas antiguas atribuidas al propietario. La sustitución requiere revisar impactos y dependencias; no es autorización para borrar código legacy o cancelar PRs unilateralmente.

**Aún no elegido por el propietario:** motor 3D, sistema voxel específico, medidas exactas de sprites, presupuesto de memoria FPS aprobado, política final de Faith/poderes o arquitectura definitiva de la cámara. Preparar propuestas y prototipos medibles, no inventar aprobación.

## Puertas de transferencia de una tarea

1. Leer registro y PRs frescos; verificar que no existe otro agente ya reclamando la tarea.
2. Para cada bot saliente, solicitar MODO A; garantizar push de cambios útiles, SHA, PR y archivo `docs/agents/handoffs/<TASK_ID>.json`; validar el handoff.
3. No liberar `in_progress` si faltan evidencia, archivos o cambios locales que puedan perderse. Si el bot ya no responde, reconstruir sólo a partir de Git verificable, registrar limitaciones y escalar decisión de transferencia.
4. Sólo tras disponibilidad `ready` real, reclamar mediante CLI `tools/godseed_tasks.py transition ... --expect ready`, y publicar `tasks.json` y `TASK_BOARD.md` juntos en la rama de coordinación.
5. El bot entrante usa MODO B y su rama independiente. Máximo una tarea propia activa y dos PRs propios por revisar.
6. Sólo cancelar una tarea obsoleta si su sustitución tiene criterio de aceptación equivalente, dependencia y evidencia del alcance que ya no hace falta. Registrar la transición legal y preservar historial.
7. Mantener PRs `verified/in_review` hasta integración o revisión; nada pasa automáticamente a `done`.

## Estado producido durante esta sesión

- Nuevo prompt de introducción creado: `docs/agents/INTRODUCCION_AL_PROYECTO_PROMPT.md`, rama `introduccion-al-proyecto`.
- PATH-34 reclamó WLD-004 con commits de coordinación `f4dcfdac` y `2f8d00a6`; rama de código `feat/wld-004-path-34-autonomous-travel`.
- PR de trabajo [#48](https://github.com/jbob-coder/The-idle-open-world-universe/pull/48) **draft**: módulo independiente con 10 pruebas que pasaron en harness V8 aislado; CI Node/Chromium/Android exact-HEAD pendiente. No cumple aún aceptación integral de Nim/citizen gameplay.
- Aviso de transferencia registrado en issue #27. Ninguna identidad de otro bot fue retirada, ninguna tarea ajena reclamada ni cancelada, ninguna PR fusionada.

## Punto de reanudación

Leer este documento; luego GitHub actual: PR #47, PR #48, issue #27 y `docs/agents/tasks.json` / `TASK_BOARD.md`; comprobar trabajo activo y handoffs. Priorizar completar la integración real de WLD-004 o preservar/transferir INT-002 y GOD-003 mediante MODO A. Si los propietarios no tienen handoff disponible, no tomar su rama por la fuerza. Mantener la dirección aprobada 3D Pixel Squares + Sims ant-farm autónomos, sin atribuir más especificaciones al usuario.
