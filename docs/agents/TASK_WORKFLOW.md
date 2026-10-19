# GODSEED — Protocolo obligatorio de coordinación entre bots

**Versión:** 1.0 · 18 de octubre de 2026  
**Registro autoritativo:** `docs/agents/tasks.json` · **Vista generada:** `docs/agents/TASK_BOARD.md`  
**Rama de coordinación:** `docs/godseed-agent-task-governance-v1`  
**Base técnica revisada:** PR [#21](https://github.com/jbob-coder/The-idle-open-world-universe/pull/21) / `integration/godseed-living-society-multitile-architecture`, todavía sin fusionar en `main`.

## Regla principal: primero estado, luego código

Un bot **NO PUEDE** empezar a editar el juego por iniciativa propia sin registrar la tarea que ha escogido. Debe comprobar dependencias y escribir el cambio de estado en el registro **antes de trabajar**. Al detenerse o entregar, debe registrar otro cambio y la evidencia. Los mensajes de chat no son registros de estado.

La secuencia normal es:

`planned → ready → claimed → in_progress → in_review → verified → done`.

- **planned:** documentada pero aún depende de contratos o tareas previas.
- **ready:** disponible; sus dependencias ya están verificadas o la tarea no tiene dependencias.
- **claimed:** un bot específico la reservó; registra ID de bot, rama y motivo. Prohibido reclamarla en paralelo.
- **in_progress:** el bot inició su ejecución; registra qué archivo/sistema está modificando.
- **blocked:** falta un requisito verificable, permiso, hardware, revisión o existe conflicto. Registra bloqueo exacto y cómo resolverlo; no inventes progreso.
- **in_review:** código/documentación presentados en un PR o commit verificable, pero todavía sin aprobación definitiva.
- **verified:** pruebas de aceptación completas y documentación revisada contra el commit exacto; integración aún pendiente.
- **done:** PR efectivamente fusionado en la rama de integración aceptada por el propietario/coordinador, con CI del resultado y registro final. **Un PR verde y abierto jamás equivale a done.**
- **cancelled:** tarea retirada o sustituida, dejando motivo y referencia de sustitución.

Las transiciones legales están codificadas en `tools/godseed_tasks.py`; no se cambia el JSON manualmente para saltarlas. Si alguien encuentra un estado incorrecto, solicita rectificación documentada: jamás reescribas la historia.

## Procedimiento de cada bot — 12 pasos

1. **Identifícate:** escoge un nombre corto y estable de agente, por ejemplo `ARCH-01`, `WORLD-02`, `SIM-03`, `QA-04`. Escribe ese nombre literalmente en cada registro.
2. **Consulta GitHub en vivo:** lee `README`, `docs/agents/README.md`, `tasks.json`, `TASK_BOARD.md`, los issues/PR existentes y los contratos del subsistema. Nunca elijas por recuerdos vagos.
3. **Comprueba estado y dependencia:** acepta `ready`, ninguna tarea ya asignada y ninguna dependencia sin verificar. Si falta algo, marca `blocked` con causa; elige otra tarea disponible.
4. **Reclama atómicamente:** en una copia ACTUALIZADA de la rama de coordinación, ejecuta:
   ```bash
   python tools/godseed_tasks.py transition INT-001 claimed --expect ready \
     --actor ARCH-01 --branch feat/godseed-arch-01-interiors \
     --note "Definiendo unidades cuadradas y transiciones entre capas"
   python tools/godseed_tasks.py validate
   git add docs/agents/tasks.json docs/agents/TASK_BOARD.md
   git commit -m "task(INT-001): claimed by ARCH-01"
   ```
   Publica ese commit en la rama de coordinación **antes de tocar código**. Si el commit es rechazado por rama o SHA anticuado, **refetch + revalidación**. Si otra entidad reclamó la tarea, no la tomes.
5. **Registra inicio:** transición `claimed → in_progress` (con `--expect claimed`) y explica el alcance; commit separado. El campo `owner` no puede cambiar arbitrariamente.
6. **Prepara rama aislada:** parte de la rama que realmente contiene sus dependencias verificadas; **nunca de `main` por conveniencia**. No modifiques ramas del usuario, Codex ni de otros bots. Un dueño por tarea; si son dos tareas acopladas, coordínalas primero.
7. **Implementa por vertical slices:** lógica de estado → serialización y migración → NPC/autonomía → render/UX → Node/Chromium/Android, según aplique. No crees documentos fingiendo que se ejecuta código no escrito.
8. **Prueba y registra:** ejecuta tests adecuados y guarda el comando, exit code, commit exacto, enlace de GitHub Actions, archivo/captura y cualquier fallo. Un test heredado que pasa no demuestra una función nueva si no hay nueva aceptación.
9. **Ante bloqueo o fallo:** transición `in_progress → blocked` y detalla evidencia, reanudación y dependencias. Nunca declares un test bloqueado como aprobado. Si surge un riesgo, detén el cambio destructivo.
10. **Prepara revisión:** abre PR contra la rama correcta e incluye tarea, cambios, migración, capturas, rendimiento estimado vs medido, pruebas, riesgos, enlaces y exclusiones. Actualiza `in_progress → in_review` con `--evidence "PR #NN | SHA | Actions run URL"`.
11. **Verificación:** un verificador diferente compara evidencia con el **HEAD exacto**, ejecuta regresiones, comprueba UX y marca `verified`; si falla vuelve a `in_progress` con causa.
12. **Cierre:** solo `OWNER` o `INTEGRATOR`, después de fusionar la rama de integración apropiada y sus pruebas, marca `done` con evidencia explícita del PR **merged**, CI y SHA finales. Registra desbloqueo de tareas dependientes. Los proyectos abiertos NO se cuentan como 100%.

### Uso de la herramienta local

```bash
python tools/godseed_tasks.py validate
python tools/godseed_tasks.py board --write
python tools/godseed_tasks.py transition INT-001 claimed --expect ready --actor ARCH-01 --branch feat/godseed-interiors --note "Inicio"
python tools/godseed_tasks.py transition INT-001 in_progress --expect claimed --actor ARCH-01 --note "Diseñando contratos"
python tools/godseed_tasks.py transition INT-001 in_review --expect in_progress --actor ARCH-01 --note "Revisión pendiente" --evidence "PR #NN; commit completo; run Actions"
```

**Importante:** nunca uses el ejemplo literalmente sobre `INT-001` si ya figura reclamado; sustituye por una tarea `ready` realmente libre. No hagas `--force` ni restablezcas manualmente `owner`.

## Concurrencia, prioridad y conflictos

La rama de coordinación y los archivos de estado son **un recurso compartido**. Para evitar escrituras simultáneas:
- Todo bot debe hacer `fetch` del contenido y conocer su SHA antes de actualizarlo; la API de GitHub Contents acepta el SHA previo y rechaza versiones obsoletas. Actualizar por la fuerza o reintentar sin leer abre un conflicto.
- Si hay varios bots a la vez, designar **un solo coordinador/escritor** de `tasks.json` y `TASK_BOARD.md`, o serializar las solicitudes de `claim` a través de ese coordinador. Una simple rama Git no es un bloqueo distribuido perfecto.
- Las ramas de implementación nunca deben reescribir la copia autoritativa del registro de otro bot. El integrador reevalúa dependencias después de merges y rebase.
- Antes de reclamar comprobar tanto el registro como PRs/issues abiertos para no duplicar el trabajo de #17, #20 o #21.
- Si un PR cambia de HEAD, repite el CI del nuevo HEAD antes de conservar `verified`.
- Conflicto en save schema, rutas, cámara, Android o arquitectura: marca `blocked`, describe alternativas y solicita revisión coordinada.

## Nueva tarea al terminar cada entrega — regla permanente

Tras completar su propia entrega con evidencia, **cualquier bot puede registrar una nueva tarea necesaria**. El origen debe estar en `in_review`, `verified` o `done`, con propietario y evidencia reales. No es obligatorio añadir una nueva si no hay trabajo justificable: evita duplicados y tareas triviales. La entrega inicial sigue las reglas de cambio de estado; la creación de otra tarea **no significa** que la primera ya fue integrada.

**Solo una nueva tarea por entrega de origen**, salvo coordinación explícita para iniciativas adicionales. Debe explicar el hallazgo, prioridad, área, dependencias y aceptación verificable. La herramienta asigna el siguiente ID de esa área y registra `origin_task`, `created_by`, `new_task_reason` y la historia de estado.

Ejemplo ilustrativo, sustituir todos los IDs/actores por tareas actuales y dueño real:

```bash
python tools/godseed_tasks.py add --after SIM-001 --actor LIFE-01 --area people --priority P1 --title "Sim occupational fatigue and recuperation" --acceptance "Measured exhaustion changes work decisions and remains correct after v1 save/reload." --depends SIM-001 --reason "Repeated work caused preventable exhaustion in seeded citizen acceptance tests."
python tools/godseed_tasks.py validate
git add docs/agents/tasks.json docs/agents/TASK_BOARD.md
git commit -m "docs(tasks): propose follow-up after SIM-001"
git push origin HEAD:docs/godseed-agent-task-governance-v1
```

El estado inicial es `ready` solamente si **todas** las dependencias están `verified` o `done`; de lo contrario queda `planned`. Si no hay dependencias, puede quedar `ready`. La tarea nueva **no se autoasigna**; el bot debe entregar su tarea anterior a revisión y respetar el límite de dos PRs propios pendientes antes de reclamar otra. Si otra entidad creó trabajo equivalente, no crearlo nuevamente. Si la rama de coordinación cambió, refetch + comprobar SHA, nunca sobrescribir registros ajenos. El tablero es generado por CLI, nunca editado a mano.

En cada reporte final: `NEW_TASK_CREATED: <ID/estado/razón/commit>` o `none: no justified follow-up`.

## Modo ♾️ — continuidad responsable dentro de la sesión

**Fuente para bots:** [`INFINITY_AUTOMATION_PROMPT.md`](./INFINITY_AUTOMATION_PROMPT.md). El mensaje `♾️` activa el ciclo `consultar → seleccionar → reclamar → implementar → probar → entregar → registrar → siguiente`. No instala una automatización programada ni permite actuar fuera de una sesión activa.

Una tarea `in_review` con PR y evidencia ha sido entregada a un **revisor independiente**. El bot puede iniciar otra tarea `ready` independiente si:

- No posee otra tarea `claimed` ni `in_progress`.
- Tiene **menos de dos** tareas propias pendientes en `in_review`; si alcanza dos, debe detener nuevos reclamos y solicitar revisión.
- Todas las dependencias de la nueva tarea están `verified` o `done`.
- Registra y publica `tasks.json` y `TASK_BOARD.md` en cada transición; nunca usurpa tareas ajenas.
- No se autopromueve a `verified` ni fusione el trabajo sin autorización.

La CLI valida el límite, con tests en `tests/test_task_infinity.py`. Un bot puede entregar varios PRs en una sesión activa; no puede prometer trabajo después de que esa sesión termine. Debe dejar un handoff reproducible para otro bot cuando alcance límites o no existan tareas disponibles.

## Selección automática de la siguiente tarea

Elegir por este orden: **P0 desbloqueada** → dependencias importantes → reducción de riesgo para Android/guardados → P1 → P2. Dentro de una misma prioridad, elegir la tarea que permita una entrega **jugable y comprobable** más pequeña.

Las primeras líneas recomendadas (en paralelo solo con ownership independiente) son:
- `INT-001` especificación de capas/interiores (documentada como trabajo real, no implementación);
- `GOV-001` gobierno del registro y prompt;
- `WLD-001` mapa continuo por chunks, enlazado a [issue #18](https://github.com/jbob-coder/The-idle-open-world-universe/issues/18);
- `SIM-001` necesidades del habitante, enlazado a [issue #19](https://github.com/jbob-coder/The-idle-open-world-universe/issues/19);
- `GOD-001` interpretación limitada del lenguaje, sin presentarla como IA conversacional.

No intentar `INT-004` puertas funcionales hasta que `INT-002` e `INT-003` superen sus verificaciones.

## Definición común de terminado (DoD)

1. Implementación REAL en repositorio, no solo texto.
2. Pruebas nuevas que FALLARÍAN sin la funcionalidad nueva, más regresiones antiguas.
3. Guardado v1 `godseed-one-small-life-v1` compatible (o contrato explícito de migración aprobado).
4. Offline Android WebView sin permisos de Internet ni modelos descargados.
5. Arte 16×16 píxeles cuadrados y cámara 32×20 / 24×15 / 16×10 respetados.
6. El dios observa e influye; NO controla con joystick a los sims.
7. Rendimiento y memoria acotados: teléfonos 2–3 GB de RAM total, objetivo interno 128–192 MiB PSS (techo provisional 256 MiB) **sin suponer que está logrado**.
8. Evidencia enlazada al SHA exacto y PR integrado según estado `done`.
9. Documentación de contratos, tareas dependientes, limitaciones conocidas y traspaso actualizado.
10. Si no hay hardware, marcar `QA-004 blocked`: no esconderlo dentro de “todas las pruebas pasan”.

## Formato mínimo de reporte

```text
BOT: ARCH-01
TASK: INT-001
STATUS: in_review
CLAIM COMMIT: <sha del registro>
WORK BRANCH / SHA: feat/... / <sha>
FILES CHANGED: ...
ACCEPTANCE: ...
TESTS: command, passed/failed, Actions URL
SAVE/MIGRATION: ...
RAM/BATTERY PHYSICAL: NOT VERIFIED
DEPENDENCIES UNBLOCKED: ...
LIMITATIONS: ...
NEXT ACTION: ...
```

El propietario puede reasignar tareas deliberadamente, pero cualquier reasignación debe generar nueva entrada de historial con causa; no se admite ocultar una asignación anterior.
