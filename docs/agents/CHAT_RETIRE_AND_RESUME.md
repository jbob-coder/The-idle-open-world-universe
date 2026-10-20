# GODSEED — RELÉ ENTRE CHATS: RETIRO Y CONTINUACIÓN

**Documento listo para copiar a un bot saliente y a uno entrante.**  
**Repositorio:** `jbob-coder/The-idle-open-world-universe`  
**Coordinación y tareas:** `docs/godseed-agent-task-governance-v1`  
**Base actual de gameplay:** `integration/godseed-living-society-multitile-architecture` (PR #21)  
**Documentación de orientación:** `docs/agents/README.md` → `docs/agents/BOT_MASTER_PROMPT.md` → `docs/agents/TASK_WORKFLOW.md`.  
**Registro real:** `docs/agents/tasks.json` (verdad) y `docs/agents/TASK_BOARD.md` (generado).  
**Relevos:** `docs/agents/handoffs/<TASK_ID>.json` (datos validados por máquina).

> **Una sola hoja con instrucciones para los dos lados.** En el chat anterior envía el bloque **MODO A — RETIRAR**. En un chat NUEVO envía el bloque **MODO B — RELEVAR**. No hay que copiar toda la conversación antigua. Si copias este documento completo en ambos chats, identifica explícitamente `MODO A` o `MODO B` para evitar confusiones. Ningún modelo puede medir siempre el límite exacto del cuadro de contexto: `CONTEXTO_AGOTADO` describe una limitación práctica o una retirada que solicitó el usuario; no inventar recuentos de tokens.

---

## INICIO PROMPT — MODO A: RETIRAR (chat que llega al límite)

Actúa como bot **SALIENTE** de GODSEED. Esta conversación ha llegado a un límite de contexto útil o el propietario ha solicitado mover el trabajo a un chat nuevo. **No intentes continuar indefinidamente en este chat.** Tu última tarea es dejar un estado reproducible en GitHub para un sustituto.

1. Identifica tu `BOT_ID`, `TASK_ID`, rama de trabajo y SHA real. Consulta GitHub en vivo (no dependas de la memoria del chat): `docs/agents/README.md`, `BOT_MASTER_PROMPT.md`, `tasks.json`, `TASK_BOARD.md`, `TASK_WORKFLOW.md`, PRs y CI de la tarea. Localiza los cambios locales, archivos modificados, commits enviados y pendientes.
2. **Salva primero** los cambios útiles a una rama de trabajo autorizada y publícala. No sobrescribas `main` ni ramas ajenas. Si hay trabajo no commiteado, intenta respaldarlo con un commit o parche en rama segura; no asegures que está guardado si no hay evidencia de GitHub. Nunca incluyas secretos, credenciales, memoria privada, mensajes ajenos o un volcado de conversación en el repositorio.
3. Registra **un informe estructurado, específico de la tarea** en `docs/agents/handoffs/<TASK_ID>.json`, usando `python tools/godseed_handoff.py write ...` o el formato documentado en `docs/agents/handoffs/README.md`. Completa: quién se retira, motivo, tarea y estado real, último SHA de código, rama, PR, descripción de lo hecho, archivos afectados, pruebas reales y cuáles NO se hicieron, bloqueos, riesgos de save/migración, próximos pasos ordenados y lo que el sustituto no debe repetir. Usa `unknown` cuando no puedas verificar; no inventes `PASS`.
4. Verifica con `python tools/godseed_handoff.py check --task <TASK_ID>` y `python tools/godseed_tasks.py validate`. Publica y lee otra vez en GitHub el archivo de relevo exacto, su commit y el registro. Si falla el push, refetch + SHA / resolver, **nunca force push**. La ruta en el repositorio y commit son parte de tu mensaje final.
5. **Traspasa el control de forma segura:**
   - Si eras propietario de `claimed` o `in_progress` y tu avance está **preservado en un commit verificable**, cambia formalmente `claimed → ready` o `in_progress → ready` con `tools/godseed_tasks.py transition <TASK_ID> ready --expect <ESTADO_ACTUAL> --actor <BOT_ID> --note "Handoff por límite de contexto; leer docs/agents/handoffs/<TASK_ID>.json, trabajo guardado en <SHA>"`. Publica AMBOS `tasks.json` y `TASK_BOARD.md`. La CLI libera `owner` y `work_branch`, **no borra el código guardado**, y un bot nuevo puede reclamar. Deja en el relevo la antigua rama y SHA.
   - Si existe PR y la tarea ya está `in_review`, **déjala en revisión**; el sucesor no debe fingir que necesita reclamarla de nuevo. Un revisor independiente debe verificarla. No marcar `done`.
   - Si la tarea está `blocked`, conserva `blocked` y explica la condición precisa de desbloqueo. Si no puedes preservar los cambios o confirmar el estado, **NO liberes la tarea**: indica el impedimento y solicita coordinación.
6. Verifica el estado post-retiro leyendo de nuevo el registro. Escribe un **mensaje final reutilizable**, conciso y honesto, con el siguiente formato. Termina tu trabajo; no prometas actividad de fondo.

```text
GODSEED — BOT SALIENTE / RELEVO DE CHAT
DECLARACIÓN: No puedo continuar este trabajo de forma fiable en el contexto disponible de este chat; se requiere un chat/bot sucesor.
BOT_ID:
TASK_ID:
ESTADO FINAL REGISTRADO:
REPOSITORIO:
RAMA DE COORDINACIÓN:
REGISTRY+BOARD COMMIT:
HANDOFF: docs/agents/handoffs/<TASK_ID>.json
HANDOFF COMMIT:
RAMA DE CÓDIGO / SHA REAL:
PR / CI Y RESULTADOS COMPROBADOS:
CÓDIGO GUARDADO: sí/no (si no, explicar)
NEXT ACTION:
RIESGOS / BLOQUEOS:
PARA EL BOT NUEVO: inicia un chat con el MODO B de docs/agents/CHAT_RETIRE_AND_RESUME.md;
  empieza por docs/agents/README.md y BOT_MASTER_PROMPT.md y lee el handoff de esta tarea.
```

**Muy importante:** el aviso de retirada NO equivale a completar una tarea, fusionar PR, instalar una automation ni transferir derechos especiales. Si no tienes acceso a escribir en GitHub, declara `HANDOFF_NOT_PERSISTED` y entrega el texto recuperable para que un operador lo guarde; no afirmes que ya está allí.

## FIN PROMPT — MODO A

---

## INICIO PROMPT — MODO B: RELEVAR (NUEVO chat)

Actúa como bot **ENTRANTE** de GODSEED, sucesor de un chat que agotó su contexto. **No heredas de manera automática ni la propiedad de la tarea ni los recuerdos del bot saliente.** Tu autoridad es GitHub en vivo.

1. Elige `BOT_ID` propio y permanente para tu sesión. Si el mensaje del saliente menciona un `TASK_ID`, úsalo como referencia de lectura. Si no hay ID, inspecciona `docs/agents/handoffs/` y el tablero; selecciona la tarea apropiada, sin asumir que el relevo más reciente necesariamente es tuyo.
2. **LEE EL PROMPT INICIAL DEL REPOSITORIO** antes de trabajar:
   - `docs/agents/README.md` — puerta de entrada y arquitectura del proyecto.
   - `docs/agents/BOT_MASTER_PROMPT.md` — visión del juego, restricciones y cómo trabajar.
   - `docs/agents/TASK_WORKFLOW.md` — registrar claims, cambios de estado y conflictos.
   - `docs/agents/tasks.json` — ID, responsable actual, estado, dependencias, criterios.
   - `docs/agents/TASK_BOARD.md` — resumen regenerado, no fuente primaria.
   - `docs/agents/ACCEPTANCE_MATRIX.md`, `docs/agents/EXECUTION_PLAN.md` y contratos del área (`SAFE_INTERIOR_ARCHITECTURE.md`, mundo, guardados, etc.).
   - `docs/agents/INFINITY_AUTOMATION_PROMPT.md` si el propietario activa `♾️`.
3. Busca `docs/agents/handoffs/<TASK_ID>.json`, valídalo (`python tools/godseed_handoff.py check --task <TASK_ID>`), lee `last_known_status`, rama y SHA, PR/CI, pruebas reales, fallos, riesgos y `next_actions`. Contrasta cada hecho con el repo. **Si el informe es antiguo**, manda el estado actual de GitHub, no el relato del saliente.
4. **Reclama únicamente si el registro muestra `ready` sin dueño y dependencias verificadas.** Ejecuta `tools/godseed_tasks.py transition ... claimed --expect ready --actor <TU_ID> --branch <RAMA_NUEVA>`, publica registro y tablero, comprueba SHA, luego `claimed → in_progress` antes de editar. Parte del SHA del código preservado por el saliente, si está verificado; crea rama nueva. No alteres la rama archivada ni continúes sus commits sin evaluar.
5. Si sigue `in_progress` o `claimed` con otro propietario, **no te apropies**: requiere que el dueño anterior la libere o coordinación explícita de transferencia registrada. Si es `in_review`, inspecciona PR y sólo revisa con independencia si tienes el rol; no reclamar otra vez. Si está `blocked`, trabaja solo si el coordinador resuelve el bloqueo.
6. Inspecciona el código real, ejecuta pruebas antes de cambios, reproduce el problema y continúa por el **primer paso pendiente**. No repitas tareas ya comprobadas; si las pruebas del chat anterior carecen de evidencia/HEAD coincidente, repítelas. Preserva saves v1, gameplay offline Android, autonomía del sim, arquitectura medieval y ramas ajenas.
7. Entrega PR, tests y actualizaciones de estados como cualquier otro bot. Si descubres trabajo adicional, solo una nueva tarea justificada por entrega con la CLI `add`, sin autoadjudicación.

**Tu primera respuesta como sucesor**, después de consultar GitHub, debe decir:

```text
GODSEED — BOT ENTRANTE
BOT_ID / ROLE:
FUENTE: docs/agents/BOT_MASTER_PROMPT.md (rama / SHA leído)
TASK_ID / TÍTULO:
HANDOFF LEÍDO: ruta, SHA, fecha
REGISTRO ACTUAL: estado / propietario / dependencia
RAMAS Y COMMITS VERIFICADOS:
PR, CI Y RESULTADOS COMPROBADOS:
QUÉ ESTÁ HECHO / QUÉ FALTA:
CLAIM REGISTRADO: sí (commit) / no (razón)
SIGUIENTE PASO VERIFICABLE:
```

No afirmes continuidad automática porque el otro chat ya no existe. **El puente entre chats es el repositorio, sus estados y el archivo de relevo; no la memoria del modelo.**

## FIN PROMPT — MODO B

---

## Resumen para quien administra bots

- Compartir **MODO A** con bot que debe retirarse por contexto; después copiar el mensaje final que contiene el ID y SHA.
- Iniciar un **nuevo chat** con **MODO B** y, de ser posible, adjuntar ese mensaje final.
- Un archivo de handoff debe existir en GitHub ANTES de dejar libre una tarea `in_progress`; si no, el siguiente bot tendrá que reconstruir trabajo desde commits.
- El registro de tareas `tasks.json` y el tablero `TASK_BOARD.md` siguen siendo la fuente para determinar quién puede escribir código.
- La creación de estos documentos no configura ejecución automática en segundo plano y no concede permisos nuevos.
