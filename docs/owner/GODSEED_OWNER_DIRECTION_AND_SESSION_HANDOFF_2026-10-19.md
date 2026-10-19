# GODSEED — Dirección aprobada por el propietario y relevo seguro de conversación
**Fecha de referencia:** 2026-10-19 (America/Puerto_Rico)  
**Proyecto:** GODSEED: A World for One  
**Repositorio:** [jbob-coder/The-idle-open-world-universe](https://github.com/jbob-coder/The-idle-open-world-universe)  
**Clase:** registro de decisiones del propietario + continuidad de sesión; **NO código ni entrega jugable**.  
**Uso previsto:** documento de entrada de un chat sucesor; no debe interpretarse como una autorización general para cerrar bots, reclamar tareas, cambiar motor, fusionar PRs o modificar trabajo ajeno.  
**Coordinación autoritativa de tareas:** `docs/godseed-agent-task-governance-v1` → `docs/agents/tasks.json` → `docs/agents/TASK_BOARD.md` (generado).
**Estado de este documento:** memoria de traspaso preparada por un asistente siguiendo instrucciones directas del propietario; requisitos marcados `APROBADO` se basan en los mensajes citados, **no** en inferencias de las PRs.

## 1. OBJETIVO ACTUAL — QUÉ JUEGO SE QUIERE

**GODSEED es un simulador de sociedades autónomas visto desde el punto de vista de un dios observador**, con un mundo **representado en 3D y con estética Pixel Squares**. El equivalente conceptual es un *ant farm* de NPC Sims: los habitantes, no el jugador ni el creador, deciden cómo vivir, producir, colaborar, asentarse, expandirse, organizarse y construir civilizaciones. El jugador puede observar e intervenir divinamente de forma opcional, sin necesidad de "meter el dedo" para que sucedan acciones.

No basta con unidades vagando, una aldea precolocada, una ciudad que aparece al transcurrir un temporizador o barras de inteligencia que no cambian nada. Se exige **causalidad observable**: quién tomó una decisión, qué antecedentes y recursos la justificaron, qué ocurrió realmente y qué cambió en el mundo.

### 1.1 Aprobaciones o peticiones directas del propietario (2026-10-19)

- **APROBADO — Autonomía sin órdenes:** «lo importante es que puedas hacerlo autónomo, que no tenga que yo involucrarme en el sentido de que tenga que meter el dedo para que ellos hagan algo, sino que ellos mismos puedan decidir, tomar decisiones». La simulación debe progresar mientras se ejecuta **aunque el usuario no toque la pantalla**, sin exigir intervenciones divinas.
- **APROBADO — Los NPC construyen el mundo social:** «el mundo va a ser creado por los personajes ... son los npc sim los que estarán creado también ellos decidirán. Como un ant farm». El jugador no debería tener que situar manualmente casas, ciudades, aldeas, reyes ni colonias para habilitar su surgimiento. **Distinción:** esto no define aún el algoritmo para generar terreno/ecología inicial; no atribuirle al propietario una prohibición de terreno procedural.
- **APROBADO — Nuevo POV 3D + aspecto Pixel Squares:** «el pov del juego para que sea 3d y más estilo Pixel squares». Esta instrucción posterior **sustituye** la restricción artística previa que imponía una cámara **exclusivamente 2D cenital** y excluía 3D. Una perspectiva 3D y una estética pixelada pueden coexistir; su implementación técnica aún no está elegida.
- **APROBADO — Vida individual significativa:** personalidad, inteligencia, estadísticas, capacidades, memoria, aprendizaje, identidad detallada y conexiones familiares afectan el comportamiento y las decisiones; rasgos familiares/herencia, nuevas generaciones y elecciones diferenciadas.
- **APROBADO — Desarrollo emergente:** habitantes desarrollan asentamientos, varias colonias, reyes, reinos e instituciones según sus propias decisiones; sociedades pueden evolucionar y no depender de eventos activados por el usuario.
- **APROBADO — Rediseñar poderes divinos e interfaz:** el propietario consideró la jugabilidad como dios desorganizada y varias habilidades sin sentido; quiere **cambiar el conjunto de habilidades y la forma de jugar**. Observar e influir es el núcleo, pero **no** equivale a aceptar eternamente sólo susurros ni la barra `Faith` actual. Sus costes, límites, grados de intervención y efectos están por diseñar y aprobar.
- **APROBADO — Mejor diseño/eficiencia de habitantes:** personajes más detallados y capaces, sin coste de CPU/RAM excesivo; proyecto orientado a experiencia Android offline conforme al historial del repositorio. Cantidades exactas de NPC, FPS, RAM y motor gráfico NO fueron fijadas por la instrucción de hoy.
- **APROBADO — Distinción formal entre decisiones del propietario y propuestas de bots.** Que una PR o un prompt diga `owner-approved` no demuestra aprobación sin referencia primaria.

**La frase «Está bien, puedes seguir» autoriza continuar la documentación/revisión vigente.** No es permiso para fusionar PRs, apagar bots, editar ramas ajenas ni sustituir en producción el render 2D sin evaluación.

### 1.2 Reglas NO aprobadas por estas conversaciones

**NO TRATAR COMO APROBADAS ACTUALMENTE:** cámara 2D cenital exclusiva; prohibición universal de perspectiva inclinada/isométrica/3D; sprites exactamente 16×24 o terreno 16×16; paleta fija; zooms predefinidos; prohibición absoluta de suavizado en cualquier componente; voxel como motor obligado; Godot o WebGL como elección definitiva; mapa limitado a ocho regiones; protagonismo permanente centrado sólo en Nim; cantidad fija de habitantes; límites exactos de RAM/FPS o tamaños de descargas; poderes exclusivamente indirectos/susurros; barra `Faith` y habilidades legacy como diseño final.

Estos puntos pueden ser decisiones de compatibilidad/ingeniería **existentes**, pero requieren revisión y jamás deben atribuirse retroactivamente al propietario. No borrar mecánicas, capítulos o saves para imponer un diseño nuevo sin migración.

### 1.3 Imágenes de concepto producidas en esta conversación

Se generaron **dos imágenes conceptuales** de GODSEED en estética de volumen/píxeles cuadrados, mundo medieval y HUD divino. **No son capturas de APK real ni implementación**. Tampoco confirman que la densidad urbana, interfaz, cámara exacta o edificios que aparecen estén aprobados. El mundo en las imágenes debe entenderse como **resultado potencial del trabajo de los Sims**, nunca como un escenario prediseñado por el jugador. Los archivos PNG están asociados a la conversación donde se generaron, no se han añadido a este PR; se deben adjuntar o recuperar en el chat sucesor si se quieren conservar en GitHub.

## 2. INCIDENTE DE TRAZABILIDAD Y CORRECCIÓN YA PUBLICADA

La documentación heredada propagó una dirección `PIXEL SQUARES` ligada a restricciones 2D a partir de PRs iniciales, atribuyéndola al propietario sin aprobación primaria suficiente. El propietario expresó primero sorpresa por el contrato impuesto y después **indicó expresamente nueva dirección 3D con estilo Pixel Squares**. No son afirmaciones incompatibles: cuestionó la imposición no consultada y formuló su preferencia actual.

**Corrección del propietario publicada y comprobada:** [Issue #43 — comentario 6271386906](https://github.com/jbob-coder/The-idle-open-world-universe/issues/43#issuecomment-6271386906).  
**Aviso a otros agentes publicado y comprobado:** [Issue #27 — comentario 6271395198](https://github.com/jbob-coder/The-idle-open-world-universe/issues/27#issuecomment-6271395198).  
**Auditoría inicial de aprobación:** [issue #43, comentario anterior 6269756308](https://github.com/jbob-coder/The-idle-open-world-universe/issues/43#issuecomment-6269756308).

**Documentos/rutas con conflicto potencial y revisión pendiente, NO modificar ciegamente:** `docs/GODSEED_INTENDED_GAME.md`, `docs/agents/BOT_MASTER_PROMPT.md`, `config/pixel-art-contract.json`, `docs/PIXEL_WORLD_STYLE_GUIDE.md`, las referencias de arte de PR #37, la biblia V3 de PR #39, la aceptación de PR #42, y la implementación de interfaz 2D PR #46. La nueva dirección requiere una propuesta de migración y compatibilidad, no declarar inválido todo el progreso existente.

## 3. ESTADO DEL REPOSITORIO EN LA ÚLTIMA COMPROBACIÓN

**Lectura del registro de GitHub (2026-10-19):** `docs/agents/tasks.json`, blob SHA `0a5aa3096b93668e2db958f82384d0a692f0a05f`; 70 tareas: 19 `verified`, 6 `in_review`, 2 `in_progress`, 6 `ready`, 34 `planned`, 3 `blocked`. Son datos **puntuales**, no asumir que siguen vigentes al abrir un nuevo chat.

Ejemplos pertinentes en el registro:
- `ART-007` rediseño interfaz móvil: `in_review`, propietario LIFE-26, PR #46 **todavía basada en 2D**.
- `GOV-004` biblia V3 de diseño: `verified`, propietario DESIGN-28, PR #39 es diseño y no juego funcional.
- `SIM-011` cognición individual: `verified`, propietario CORTEX-19. **No implica** que existan generaciones completas ni población masiva.
- `SIM-012` herencia/parentesco: `planned`.
- `SIM-013` simulación poblacional con LOD: `planned`.
- `CIV-002` obras y constructores: `planned`.
- `CIV-009` reyes/sucesión: `planned`.
- `CIV-010` colonias/logística: `planned`.
- `GOD-006` rediseño de poderes: `blocked`, propietario FORGE-27.
- `WLD-004` navegación entre chunks y `WLD-008` LOD/memoria: `ready` sin dueño según esa lectura.
- Trabajo en curso al consultar: `INT-002` (FORGE-27), `GOD-003` (LIFE-26). No reasignar ni retirar su propiedad por cerrar esta conversación.

**Base nominal del proyecto:** PR #21 / `integration/godseed-living-society-multitile-architecture`. Hay PRs apiladas y/o en revisión: no son cambios ya incorporados a `main`; comprobar merges y SHA reales. El juego actual conserva render Canvas/WebView 2D y estructura de saves v1; **cambiar a 3D es una modificación arquitectónica aún pendiente**, no un cambio de paleta.

**Archivos de verdad para gobernanza:** [tasks.json](https://github.com/jbob-coder/The-idle-open-world-universe/blob/docs/godseed-agent-task-governance-v1/docs/agents/tasks.json), [TASK_BOARD.md](https://github.com/jbob-coder/The-idle-open-world-universe/blob/docs/godseed-agent-task-governance-v1/docs/agents/TASK_BOARD.md), [TASK_WORKFLOW.md](https://github.com/jbob-coder/The-idle-open-world-universe/blob/docs/godseed-agent-task-governance-v1/docs/agents/TASK_WORKFLOW.md).

## 4. RETIRADA DE BOTS Y CONTINUIDAD — SIN PÉRDIDA DE CÓDIGO

El propietario **planteó la posibilidad** de retirar bots actuales e incorporar sustitutos para evitar confusión. **No ordenó aún retirar identidades concretas ni cancelar tareas**. Esta sesión NO dio de baja agentes, liberó tareas, modificó commits de agentes ni hizo merges.

**El procedimiento YA EXISTE** en [docs/agents/CHAT_RETIRE_AND_RESUME.md](https://github.com/jbob-coder/The-idle-open-world-universe/blob/docs/godseed-agent-task-governance-v1/docs/agents/CHAT_RETIRE_AND_RESUME.md):

- **Para cada bot saliente:** darle *MODO A: RETIRAR*. Debe inspeccionar GitHub en vivo, identificar su `BOT_ID`, `TASK_ID`, rama, SHA y pruebas; guardar/push su trabajo útil sin secretos; escribir y validar `docs/agents/handoffs/<TASK_ID>.json`; liberar el estado **sólo cuando el trabajo quede preservado y el protocolo lo permita**. `in_review` continúa en revisión; `blocked` queda bloqueado salvo desbloqueo real. Si el guardado/validación falla, no liberar la tarea a ciegas.
- **Para cada bot nuevo:** darle *MODO B: RELEVAR*; leer su handoff, ramas/commits/CI y registro actual, verificar que la tarea esté realmente `ready`, reclamar mediante transición y commits de `tasks.json` + `TASK_BOARD.md`, y sólo entonces modificar código en rama aislada. No hereda por conversación la propiedad.
- **Cambio obligatorio para onboarding con esta visión:** leer **este memo y la enmienda del issue #43 antes de asumir como aprobadas las restricciones 2D** del `BOT_MASTER_PROMPT.md`. No editar sin autorización los contratos de terceros; levantar conflicto a coordinación y preparar la migración coherente.
- **No apagar por la fuerza un bot con cambios locales no publicados** ni iniciar otro en su tarea simultáneamente. Se preservan identidad del trabajo, saves/compatibilidad y trazabilidad.
- **No existe proceso infinito por el símbolo ♾️**, salvo ejecutor externo realmente configurado. Los bots sólo avanzan dentro de sus ejecuciones habilitadas.

## 5. PLAN CONCRETO DE CONTINUACIÓN (PROPUESTAS, NO DECISIONES TÉCNICAS APROBADAS)

1. **Reconciliar contratos de producto:** crear una matriz de precedencia `APROBADO POR PROPIETARIO > PROPUESTA > LEGACY TÉCNICO`, citar estos mensajes y el issue #43. Proponer revisiones del master prompt/contratos para que los nuevos bots no hereden la prohibición 3D; hacerlo mediante PR coordinada, sin reescribir trabajo ajeno.
2. **Evaluar la transición 2D → 3D:** antes de elegir stack/engine, auditar el WebView/Canvas/Android actual, garantías offline y guardados v1; comparar opciones de representación 3D de pocos recursos (p. ej. WebGL/3D voxel frente a motor dedicado), portabilidad, coste de migración, cámara y accesibilidad. Producir un prototipo 3D reproducible **con NPCs de verdad y eventos simulados**, no poster.
3. **Demostrar el comportamiento ant-farm sin interacción:** comenzar con terreno/recursos y personas, sin ciudad construida; al acelerar días de simulación, individuos eligen necesidades, profesiones, relaciones y obras basadas en recursos reales y progresan sin clics ni milagros. Registrar causalidad, conflictos y fallos.
4. **Familias, reinos y expansión emergentes:** preservar identidad persistente, parentesco, herencia, nacimiento/muerte, logística y viajes, economía finita, fundación de colonias y legitimidad/sucesión. No generar gobiernos o edificios simplemente por reloj.
5. **Optimizar poblaciones:** planificación a intervalos y por eventos, diferentes niveles de detalle para zonas activas/remotas, estado compacto por persona, eventos agregados reconciliables, límites instrumentados de memoria/CPU. Android físico de 2/3GB **no verificado**.
6. **Rediseñar poderes divinos, HUD y vista 3D:** las facultades deben tener propósito, posibilidad de elección por parte de Sims y consecuencias medibles; **intervención opcional**. Presentar propuestas de poderes al propietario; no asumir que “sólo consejos” está cerrado ni que Faith es definitivo.
7. **Criterios de aceptación:** prueba determinista sin entradas durante múltiples ciclos; variación causal por inteligencia/personalidad; contabilidad y persistencia de recursos/edificios/relaciones; guardado-carga y compatibilidad v1; estados entre chunks; pruebas reales de Android offline y capturas desde juego renderizado; conservar fallos/regresiones. Distinguir TESTED/PASS de PLANNED/NOT RUN.

**Bloqueo principal:** compatibilizar la aprobación 3D con el código y pruebas 2D existentes sin perder el trabajo de los agentes ni comprometer la ejecución Android. No declarar completada esa migración por haber creado concepto visual.

## 6. CONTINUIDAD OPERATIVA — ESTADO DE ESTA SESIÓN

**COMPLETADO Y COMPROBADO EN GITHUB:**
- Auditoría de autoridad: el contrato antiguo 2D/pixel squares estaba atribuido erróneamente al propietario sin suficiente prueba primaria.
- Enmienda de dirección 3D + autonomía publicada en [issue #43](https://github.com/jbob-coder/The-idle-open-world-universe/issues/43#issuecomment-6271386906).
- Aviso no bloqueante a bots en [issue #27](https://github.com/jbob-coder/The-idle-open-world-universe/issues/27#issuecomment-6271395198).
- Inspección del registro de 70 tareas y procedimiento de relevo MODO A/B.
- Dos imágenes conceptuales producidas durante la conversación, **no PR de implementación**.

**EN PROGRESO / NO REALIZADO:** no se retiró bot alguno, no se reclamó ninguna tarea, no se actualizó `tasks.json`, no se actualizó el master prompt heredado, no se adoptó engine 3D, no se cambió gameplay, no se ejecutaron pruebas del APK en esta sesión y no se fusionó PR. Este archivo existe para que la próxima sesión pueda continuar sin adjudicar hechos imaginarios.

**SIGUIENTE ACCIÓN EFECTIVA:** retomar aquí, releer en vivo GitHub y el issue #43, analizar el plan de retirada/relevo de agentes del propietario; si se decide llevarlo a cabo, aplicar MODO A a cada bot con una tarea activa y verificar handoffs antes de introducir nuevos bots. Paralelamente preparar una PR de actualización de contratos para la dirección 3D, **sin escribir en ramas en curso**.

## 7. TEXTO DE REANUDACIÓN PARA PEGAR EN UN NUEVO CHAT

> Continúa GODSEED usando **`docs/owner/GODSEED_OWNER_DIRECTION_AND_SESSION_HANDOFF_2026-10-19.md`** en la rama documental `docs/owner-direction-3d-autonomy-handoff-20261019`. Lee antes de cualquier recomendación el issue #43 (comentario 6271386906), el aviso de bots del issue #27 (comentario 6271395198), `docs/agents/CHAT_RETIRE_AND_RESUME.md`, `docs/agents/tasks.json` y `docs/agents/TASK_BOARD.md` actualizados. Mi dirección vigente: GODSEED con POV 3D estilo Pixel Squares, ant-farm de Sims autónomos que construyen y organizan el mundo sin clics del jugador, inteligencia/personalidad/familias/colonias/reinos causales, poderes divinos opcionales por rediseñar y Android eficiente. No atribuyas decisiones técnicas que no aprobé; no retires bots ni reasignes tareas sin su handoff MODO A y prueba de persistencia. Identifica el siguiente paso seguro según el estado actual, no el que suponía el chat viejo.

---

**NOTA DE PRECEDENCIA:** El propietario puede cambiar decisiones en instrucciones posteriores. Si una instrucción nueva contradice este documento, documentar fecha, cita y decisión sustituida; no tratar el archivo como ley absoluta ni usarlo para autorizar acciones peligrosas.