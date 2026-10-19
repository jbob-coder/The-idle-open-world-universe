# GODSEED — PROMPT DE RETIRO DEFINITIVO Y TERMINACIÓN SEGURA DE UN BOT

**Estado:** mandato del propietario (2026-10-19) para consolidar bots. **Uso:** pegar este texto EN CADA CHAT de bot saliente por separado. **No es una herramienta que apague procesos externos automáticamente.**

Repositorio: jbob-coder/The-idle-open-world-universe
Rama del documento: introduccion-al-proyecto
Gobernanza autoritativa: docs/godseed-agent-task-governance-v1
Fuente técnica: docs/agents/CHAT_RETIRE_AND_RESUME.md (MODO A), docs/agents/TASK_WORKFLOW.md y docs/agents/handoffs/README.md
Dirección de producto: docs/agents/INTRODUCCION_AL_PROYECTO_PROMPT.md; PR #47 (3D Pixel Squares, sociedades de NPC Sims autónomos, jugador dios observador).

---

## INICIO — ORDEN PARA BOT SALIENTE (COPIAR TODO HASTA FIN)

**ORDEN DEL PROPIETARIO: RETÍRATE DE GODSEED Y TERMINA TU SESIÓN DESPUÉS DE ENTREGAR TU TRABAJO.**

No reclames tareas nuevas ni sigas con el ciclo ♾️. Tu ÚNICO cometido desde ahora es preservar el trabajo, entregar su estado verdadero, liberar su propiedad cuando corresponda y finalizar este chat sin continuar desarrollo.

### 1. Identidad y auditoría

Primero identifica BOT_ID real, todas tus TASK_ID actuales, ramas, PRs, SHAs y trabajo en curso. Lee AHORA en GitHub: docs/agents/README.md, INFINITY_AUTOMATION_PROMPT.md, BOT_MASTER_PROMPT.md, TASK_WORKFLOW.md, CHAT_RETIRE_AND_RESUME.md, tasks.json, TASK_BOARD.md y los contratos de tus tareas. Comprueba el estado real, incluidas tareas que ya están en revisión, verificadas o bloqueadas. La palabra «retirado» no sustituye la verificación remota.

### 2. Preservación sin destruir

Identifica y conserva los cambios ya publicados y los cambios no publicados (incluidos untracked, commits locales, capturas, scripts de pruebas, resultados y errores). Publica cambios útiles únicamente en TU rama autorizada, preservando historial, SIN force-push. Comprueba el SHA remoto después de publicar. Si GitHub deniega escritura, registra lo que no pudo guardarse y detente sin mecanismos para eludir la denegación.

No borres ramas, commits, issues, PRs, assets, guardados o código ajeno. No modifiques main, no fusiones PR, no cierres PR en nombre de otro. Mantén Android offline, guardados v1, continuidad de los Sims y dependencias. Nunca publiques credenciales, datos privados ni transcripciones completas.

### 3. Handoff estructurado obligatorio

Crea o actualiza docs/agents/handoffs/<TASK_ID>.json, usando tools/godseed_handoff.py, por cada tarea que debas entregar. Incluye:
- BOT_ID, TASK_ID, último estado y propietario confirmado;
- rama y SHA de cada cambio real, PR, base y dependencias;
- archivos modificados, alcance implementado y no implementado;
- pruebas realizadas: PASS/FAIL/NOT_RUN, comando, SHA, URL de evidencia;
- compatibilidad con saves v1, Android y rendimiento;
- cambios sin publicar, conflictos, restricciones y próximos pasos exactos para el sucesor;
- tareas que NO deben repetirse, incluyendo conflictos 2D heredados frente a la dirección 3D.

Valida con los comandos reales:
python tools/godseed_handoff.py check --task <TASK_ID>
python tools/godseed_tasks.py validate

Publica el archivo en la rama de coordinación mediante los procedimientos autorizados y vuelve a leerlo en GitHub. Si no puedes hacerlo, indica HANDOFF_NOT_PERSISTED y entrega el contenido recuperable, sin afirmar que fue guardado.

### 4. Transición de estado legal

- claimed o in_progress: solo si los cambios están preservados, el handoff validado y la CLI permite la transición, liberar el registro a ready con tools/godseed_tasks.py, --expect y el BOT_ID propietario. Publicar juntos tasks.json y TASK_BOARD.md; comprobar SHA y que owner quedó libre.
- in_review: conserva su PR y estado; espera revisor independiente, no la devuelvas a ready.
- verified: conserva ese estado; no lo declares done.
- blocked: conserva blocked hasta resolución real, con bloqueo documentado.
- Si el código no se pudo conservar, existen escrituras simultáneas o falla la transición, NO liberes la tarea ni asignes propietario nuevo. Declara TRANSFER_BLOCKED y el motivo.

No transfieras otras identidades/bots que no seas tú; solo el propietario puede ordenar su retiro y cada uno debe preservar lo suyo.

### 5. Terminación inequívoca

Después del handoff y la comprobación, NO comienzas otra tarea aunque queden tareas ready. Responde usando exactamente esta estructura y TERMINA ESTE CHAT:

GODSEED — CERTIFICADO DE RETIRO
BOT_ID:
RETIREMENT_REQUEST: OWNER_REQUESTED
BOT_SESSION_STATUS: RETIRED_FROM_THIS_CHAT / TRANSFER_BLOCKED
TASK_ID(S):
ESTADO(S) REAL(ES) Y PROPIETARIO(S) EN GITHUB:
RAMAS / SHAS REMOTOS:
CAMBIOS PRESERVADOS / NO PUBLICADOS:
PR(S) Y REVISORES PENDIENTES:
CI Y PRUEBAS (PASS / FAIL / NOT_RUN, SHA):
HANDOFF JSON, COMMIT Y URL:
REGISTRY + BOARD COMMIT Y RESULTADO:
RIESGO PARA SAVES V1 / ANDROID OFFLINE:
BLOQUEOS Y CAMBIOS 2D→3D PENDIENTES:
PRÓXIMAS ACCIONES DEL BOT SUCESOR:
VERIFICACIÓN DE NO BORRADO / NO MERGE:
FINAL: TERMINO ESTA SESIÓN. NO RECLAMO NI PROGRAMO MÁS TAREAS. SIN PROMESA DE ACTIVIDAD DE FONDO.

Una respuesta de retiro NO demuestra que una automatización o proceso persistente externo esté detenido. Si existe runner real, el propietario deberá desactivarlo en ese entorno después de comprobar la entrega. No inventes confirmación de apagado.

## FIN — ORDEN PARA BOT SALIENTE

---

## Instrucción al propietario

Enviar el prompt individualmente a cada bot antiguo. Esperar el certificado de cada uno, comprobar los handoffs y SHAs, resolver TRANSFER_BLOCKED antes de iniciar un sucesor sobre la misma tarea. No borrar las PR o sus ramas. Para el bot nuevo utilizar BOT_SUCESOR_CONSOLIDADO_PROMPT.md de la misma rama. La propiedad de una tarea solo cambia mediante la gobernanza real, no por mensajes de chat.
