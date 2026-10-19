# GODSEED — Archivo de relevos de bots entre chats

Esta carpeta contiene el **último relevo persistente por ID de tarea**. Cada bot que deba cerrar su chat (límite útil de contexto, pedido del usuario, fin de sesión o bloqueo) guarda `<TASK_ID>.json` aquí. Los cambios anteriores siguen disponibles mediante el historial Git.

## Lectura obligatoria de un bot nuevo

1. **[Inicio del proyecto](../README.md)** para localizar el mapa de documentos.
2. **[Prompt inicial](../BOT_MASTER_PROMPT.md)** para conocer visión, ramas, fuentes y seguridad.
3. **[Protocolo de tareas](../TASK_WORKFLOW.md)**, después `../tasks.json` y `../TASK_BOARD.md` de la rama de coordinación.
4. **[Prompt retirar/reanudar](../CHAT_RETIRE_AND_RESUME.md)** para la secuencia exacta.
5. Si se asigna o solicita continuar `WLD-001`, leer `./WLD-001.json`; para `SIM-001`, `./SIM-001.json`, etc. Verificar **SHA actual** de rama, PR, estado y claim antes de editar.
6. El reporte previo es evidencia útil, **no una autorización**. El registro prevalece.

## Guardar un relevo real (ejemplo, SUSTITUIR los valores)

Con los cambios útiles ya enviados a GitHub, desde un checkout de la **rama de coordinación actual**:

```bash
python tools/godseed_handoff.py write \
  --task WLD-001 --actor BOT-WORLD-01 --reason context_limit \
  --coordination-sha <SHA_REAL_DE_LA_RAMA_DE_COORDINACIÓN> \
  --work-branch feat/wld-001-BOT-WORLD-01-chunks \
  --work-sha <SHA_REAL_PUBLICADO_DEL_CÓDIGO> \
  --pr https://github.com/jbob-coder/The-idle-open-world-universe/pull/23 \
  --summary "Implementé el generador de chunks; queda probar fronteras." \
  --file src/world/chunks.js \
  --test "PASS: node --test tests/chunks.test.js at SHA ..." \
  --test "NOT_RUN: Android; el generador aún no fue integrado en la APK" \
  --save-notes "No cambié la versión 1 ni el formato de guardado." \
  --risk "Los cambios de UI en otro PR todavía no están integrados." \
  --next "Verificar paso entre cuatro chunks con coordenadas negativas." \
  --next "Agregar persistencia de modificaciones antes de integrar."
python tools/godseed_handoff.py check --task WLD-001
python tools/godseed_tasks.py validate
git add docs/agents/handoffs/WLD-001.json
git commit -m "docs(handoff): BOT-WORLD-01 retires from WLD-001"
git push origin HEAD:docs/godseed-agent-task-governance-v1
```

**Aviso:** los comandos anteriores son un **ejemplo**, no constancia de que ese PR o los tests existan ahora. No copiar SHAs ficticios. El test debe indicar `PASS:`, `FAIL:` o `NOT_RUN:` y distinguir lo comprobado de lo pendiente.

Si `--work-sha` aún no existe porque hay trabajo no publicado, usar `--unpublished` y documentar qué falta; **no liberar la tarea** hasta guardar los cambios o entregar el bloqueo explícito. `write` **NO cambia el dueño**, ni el estado, ni crea PR. La ruta JSON tiene el historial verificable dentro de Git; nunca almacena contraseñas, sesiones, claves, nombres privados ni la transcripción entera del chat.

## Liberar tarea después de publicar el relevo

Para la tarea todavía `claimed` o `in_progress` y con **código respaldado**:

```bash
python tools/godseed_tasks.py transition WLD-001 ready \
  --expect in_progress --actor BOT-WORLD-01 \
  --note "Chat agotado: relevo guardado en docs/agents/handoffs/WLD-001.json; ver SHA de código en handoff"
python tools/godseed_tasks.py validate
git add docs/agents/tasks.json docs/agents/TASK_BOARD.md
git commit -m "docs(tasks): release WLD-001 for successor after saved handoff"
git push origin HEAD:docs/godseed-agent-task-governance-v1
```

Sustituir `--expect claimed` si ése es su estado. **Si está `in_review`, NO liberar como `ready` ni cambiar `done`**: hace falta un revisor independiente. Si está `blocked`, conservar el bloqueo y documentar cuándo se resolverá. Si GitHub rechaza el push porque hay cambios concurrentes, refetch y recalcular; **no force push**.

## Formato JSON v1, valores reales

```json
{
  "schema_version": 1,
  "task_id": "WLD-001",
  "retiring_bot": "BOT-WORLD-01",
  "reason": "context_limit",
  "created_utc": "2026-10-18T23:00:00+00:00",
  "last_known_status": "in_progress",
  "owner_at_handoff": "BOT-WORLD-01",
  "coordination_branch": "docs/godseed-agent-task-governance-v1",
  "coordination_sha": "0123456789abcdef0123456789abcdef01234567",
  "work_branch": "feat/wld-001-BOT-WORLD-01-chunks",
  "work_sha": "0123456789abcdef0123456789abcdef01234567",
  "pr_url": null,
  "summary": "Ejemplo no publicado: descripción clara de lo hecho.",
  "changed_files": ["src/world/chunks.js"],
  "tests": ["NOT_RUN: ejemplo, sin evidencia real"],
  "blockers": [],
  "risks": ["Ejemplo: revisar formato de guardado antes de integrar."],
  "save_notes": "No se conoce impacto sobre los guardados hasta inspeccionar el cambio.",
  "next_actions": ["Inspeccionar la rama y comprobar el estado real de las pruebas."],
  "do_not_repeat": ["No volver a cambiar el generador sin revisar su diff."],
  "unpublished_changes": false,
  "starting_documents": [
    "docs/agents/README.md",
    "docs/agents/BOT_MASTER_PROMPT.md",
    "docs/agents/TASK_WORKFLOW.md",
    "docs/agents/tasks.json",
    "docs/agents/TASK_BOARD.md"
  ],
  "continuity_rule": "Re-read live registry. Only claim if ready/unowned. Keep prior branch intact."
}
```

El JSON mostrado aquí **es exclusivamente una plantilla ilustrativa**; la CLI escribe automáticamente las fechas y versiones de los campos. No crear `WLD-001.json` con estos datos de ejemplo ni anunciarlo como entrega real.

## Comprobar todos los handoffs

```bash
python tools/godseed_handoff.py check
python -m unittest discover -s tests -p 'test_task_*.py' -v
```

Todo archivo `*.json` de esta carpeta debe tener una tarea válida en `tasks.json`. Un bot nuevo no debe reusar la identidad del bot retirado; reclama como individuo nuevo siguiendo el protocolo.
