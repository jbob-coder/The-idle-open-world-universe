# GODSEED — Centro de operaciones para bots

**Proyecto:** videojuego medieval 2D cenital de píxeles cuadrados y simulación social autónoma para Android offline.  
**Objetivo del propietario:** un mundo continuamente explorable, personajes con vida parecida a BitLife visual, viviendas y pueblos funcionales, puertas con interiores grandes y seguros, mejoras de civilización guiadas por necesidades y consejos divinos que los habitantes pueden rechazar.

## Archivos obligatorios

| Documento | Propósito | Autoridad |
|---|---|---|
| [Registro de tareas (dinámico)](tasks.json) | ID, prioridad, dependencia, estado, propietario, pruebas, historial | **Única fuente estructurada** |
| [Tablero actualizado](TASK_BOARD.md) | Estado y responsable visibles para todos | **Generado desde JSON**, nunca editar manualmente |
| [Protocolo de los bots](TASK_WORKFLOW.md) | Reclamar antes de editar, cambiar estados, resolver conflictos y cerrar | **Obligatorio** |
| [Prompt maestro](BOT_MASTER_PROMPT.md) | Instrucciones reproducibles para Codex y otros agentes | **Copiar para activar bots** |
| [Modo automático ♾️](INFINITY_AUTOMATION_PROMPT.md) | Continuar tareas sucesivas por sesión con límites y evidencia | **Copiar para bots autónomos** |
| [Relevo de chat / CONTEXTO_AGOTADO](CHAT_RETIRE_AND_RESUME.md) | Prompt doble: bot que se retira y bot sucesor; cómo no perder el trabajo | **Obligatorio al terminar un chat con tarea activa** |
| [Archivo de relevos](handoffs/README.md) | Estado verificable por tarea, ramas, SHA, pruebas, próximos pasos | **Leer al heredar trabajo** |
| [Arquitectura de puertas seguras](SAFE_INTERIOR_ARCHITECTURE.md) | Métricas m², huellas, hogares, puertas, transición y guardados | **Diseño pendiente de aceptación** |
| [Orden de desarrollo](EXECUTION_PLAN.md) | Fases, trabajo paralelo seguro, bloqueos | Guía de planificación |
| [Matriz de aceptación](ACCEPTANCE_MATRIX.md) | Pruebas mínimas por subsistema y evidencia física | Contrato de verificación |

## Estado del código real (no confundir con el objetivo)

- [PR #16](https://github.com/jbob-coder/The-idle-open-world-universe/pull/16): historia de tres capítulos completa como *vertical slice*.
- [PR #17](https://github.com/jbob-coder/The-idle-open-world-universe/pull/17): personajes con profesiones, relaciones, comercio y mensajes al consejo, aún no es un simulador profundo de vida.
- [PR #21](https://github.com/jbob-coder/The-idle-open-world-universe/pull/21): integra arquitectura visual de edificios 2×2, dos pueblos y ocho personajes visibles. **82 pruebas Node y seis pruebas instrumentadas Android en emulador aprobadas sobre el HEAD comprobado**. PR abierto, no equivale a fusión en `main`.
- [PR #20](https://github.com/jbob-coder/The-idle-open-world-universe/pull/20): alternativa experimental de sociedad más pequeña; NO fusionar en paralelo con #17/#21 como otro motor de simulación.
- [Issue #18](https://github.com/jbob-coder/The-idle-open-world-universe/issues/18): el mundo real debe superar 64×48 por chunks.
- [Issue #19](https://github.com/jbob-coder/The-idle-open-world-universe/issues/19): civilización y vidas personales más profundas.
- [Issue #13](https://github.com/jbob-coder/The-idle-open-world-universe/issues/13): pruebas físicas 2–3 GB RAM, **bloqueadas** hasta conseguir evidencia.

**Aún no existe** navegación exterior/interior, casas realmente habitables, puertas utilizables, un mapa continuo por chunks, generaciones sociales completas ni certificación de un APK comercial. Documentar el diseño no implementa esas funciones.

## Modo ♾️ para bots autónomos

El [prompt de automatización ♾️](./INFINITY_AUTOMATION_PROMPT.md) describe cómo repetir ciclos de ejecución durante una sesión activa: elegir tarea `ready`, reclamar, desarrollar, probar, entregar PR, actualizar estado y pasar a otra. Se admite **una tarea activa** por bot y un máximo de dos PRs propios en revisión; a partir de ese límite, detener el ciclo para revisión. Si la sesión termina, se reanuda únicamente mediante una nueva invocación o un ejecutor externo explícitamente configurado.

## Relevo entre chats — contexto agotado

Cuando un bot no puede continuar por agotamiento del contexto de su chat, use [`CHAT_RETIRE_AND_RESUME.md`](./CHAT_RETIRE_AND_RESUME.md) **MODO A** para guardar el estado real en `docs/agents/handoffs/<TASK_ID>.json`, validarlo, publicar commit y liberar la tarea `claimed/in_progress → ready` **solo si el trabajo se preservó**. Su mensaje final declara honestamente que ya no puede continuar esa conversación y entrega ID, commits y ruta. **En un chat nuevo**, pegar el **MODO B**, que empieza leyendo el [README](./README.md), el [prompt inicial](./BOT_MASTER_PROMPT.md) y el registro antes de reclamar. Relevos no conceden propiedad automáticamente, no hacen merges ni configuran ejecución en segundo plano.

## Rediseño GODSEED V3: referencias del propietario

**Nuevo contrato de producto:** [`docs/design/README.md`](../design/README.md) y seis documentos enlazados explican el juego como dios, la reorganización de interfaz, las capacidades de inteligencia/persona y conocimiento, familias intergeneracionales, colonias y reyes, gestión de miles de agentes con LOD y migración de guardados. Es una **especificación futura**, no un cambio de código ya terminado.

Las tareas **GOV-004, GOD-006/007, SIM-011/012/013, CIV-009/010, ART-007** se registraron en `tasks.json`. El bot debe consultar el **HEAD de la rama de coordinación** y comprobar la propiedad actual antes de reclamar; no trabajar dos tareas a la vez ni sustituir el progreso de otro bot.

## Comienza aquí si eres un bot

1. Anuncia `AI NAME`, rol y rama actual leída de GitHub.
2. Ejecuta `python tools/godseed_tasks.py validate`. Si falla, corrige/sincroniza registro y vista antes de reclamar otra tarea; nunca ignores el resultado.
3. Consulta la tarea que realmente figura `ready` en `TASK_BOARD.md`. No tomes `GOV-001` o `INT-001` si están asignadas, aunque el prompt de ejemplo las mencione.
4. Reclámala con `python tools/godseed_tasks.py transition ... claimed --expect ready`, añade propietario/rama y **commitea** estado. Debe publicarse ANTES de trabajar. Luego `claimed → in_progress`.
5. Código, tests, CI y PR en rama aislada. Al acabar `in_review` con evidencia, no `done` sin fusionar.
6. Documenta cambios, bloqueos, aprendizajes y la próxima tarea realmente libre.

## Crecimiento controlado del tablero tras cada tarea

Cada bot **puede crear una tarea nueva después de entregar la suya**, si detecta trabajo necesario no documentado. La entrega debe figurar `in_review`, `verified` o `done`, con evidencia; la nueva tarea se crea usando `python tools/godseed_tasks.py add --after ...`, genera ID único y estado inicial `planned` o `ready` según sus dependencias. Se registra el vínculo con la tarea de origen, el bot autor y la justificación.

La tarea de seguimiento no se reclama automáticamente. En modo ♾️ se permite una tarea en desarrollo y hasta dos PRs propios en revisión; nunca dos tareas `claimed/in_progress`. Solo se admite una propuesta nueva por entrega de origen; duplicados e ideas sin criterios verificables se rechazan. Ver `TASK_WORKFLOW.md` para comandos, reglas de concurrencia y publicación de ambos documentos.

Para comprobar sin modificar:
```bash
python tools/godseed_tasks.py validate
python -m unittest discover -s tests -p 'test_task_governance.py' -v
```

El flujo de CI [task-governance.yml](../../.github/workflows/task-governance.yml) verifica que ningún bot cambie estado o índice sin conservar la consistencia.

## Reglamentos técnicos existentes

Leer según el trabajo: [producto](../GODSEED_INTENDED_GAME.md), [mundo vivo V2](../LIVING_WORLD_V2_ROADMAP.md), [integración social/arquitectónica](../LIVING_WORLD_ARCHITECTURE_INTEGRATION.md), [guardados](../SAVE_SYSTEM.md), [límite RAM](../LOW_RAM_HARDWARE_TARGET.md), [estilo de píxeles](../PIXEL_WORLD_STYLE_GUIDE.md), [pipeline](../ASSET_PIPELINE.md) y [lore](../WORLD_LORE_BIBLE.md).

## Estado vs realidad

El tablero puede registrar `in_review` o `verified` por tarea. Solo `done` tras aceptar el código realmente integrado. **No sumar porcentajes de capítulos completados para declarar terminado el simulador de vida.** El hito de historia del PR #16 era acotado, no el producto completo. Cambiar el estado siempre incluye evidencia y responsable, nunca solo una frase de chat.
