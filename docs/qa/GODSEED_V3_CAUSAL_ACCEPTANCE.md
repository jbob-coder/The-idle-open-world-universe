# GODSEED V3 — Matriz causal de aceptación del simulador y de la experiencia divina

**Tarea:** QA-006 · **Estado:** contrato de pruebas y diseño, NO simulación implementada.  
**Origen del pedido:** GODSEED debe dejar de parecer un menú de poderes desconectados y pasar a ser un *simulador medieval visual de civilizaciones*; los sims deben tomar decisiones distinguibles por inteligencia, personalidad, crianza y contexto, crear familias, colonias y reinos y funcionar sin saturar teléfonos Android.  
**Versión de referencia:** PR #21 `integration/godseed-living-society-multitile-architecture`; diseño V3 documentado en PR #39, no fusionado; pantalla de carga ART-006 en PR #32 aparte.

**Este documento no autoriza afirmar que existen** reyes, generaciones, colonias dinámicas, conocimiento avanzado, 500 ciudadanos o el nuevo HUD. Establece cómo **probar** esos sistemas cuando los bots propietarios implementen su tarea. Solo `docs/agents/tasks.json` contiene el estado real de cada ID.

## 1. Contrato de jugabilidad: el dios observa, las personas actúan

| Lo que debe poder hacer el jugador | No se permite | Evidencia exigida |
|---|---|---|
| Observar mundo, árbol de familias, ciudades, memoria y eventos | Teletransportar personas al tocar el retrato | Abrir/cerrar panel no altera `tick`, posición ni inventarios |
| Inspeccionar una necesidad, plan y motivo de decisión | Mostrar descripciones fabricadas desconectadas del estado | Panel referencia IDs y utilidades reales del planificador |
| Enviar consejo, advertencia, inspiración o contexto | Convertir texto del dios en orden obligatoria | `heard → understood/ambiguous → considered → declined/deferred/accepted → attempted → result` |
| Cambiar oportunidades ambientales bajo coste | Crear progreso infinito de fe, cosechas o recursos | Débito y efecto persistentes y auditables, anti-spam |
| Seguir el desarrollo de la sociedad durante años | Requerir clics para que los aldeanos coman, trabajen o envejezcan | Simulación autónoma a 0 intervención del jugador |
| Comparar colonias y reinos | Mostrar reyes, mercados o conquistas como panel sin entidades reales | Relación entre mapa, habitantes, stock, frontera, gobierno e historia |

**Criterio de experiencia visual propuesto:** la vista del mapa ocupa la mayor parte de la pantalla Android; máximo un panel contextual abierto, poderes relevantes a la selección, reloj y pausas siempre visibles. Debe ser comprensible qué hace el sim y qué causó el resultado. Los botones de la versión 2 `inspect, bless, gift, bloom, guide, storm, inspire` se deprecán o reconceptualizan por **GOD-006** y **ART-007**, sin eliminar compatibilidad ni inventar un poder duplicado.

## 2. Matriz de situaciones que deben existir como pruebas repetibles

Los IDs **VAC-01…VAC-14** son IDs de casos de aceptación, **no nuevos IDs del tablero**. Cada bot dueño crea sus propias pruebas reproducibles cuando corresponda; esta matriz define los cruces necesarios.

| Caso | Estado inicial / intervención | Resultado exigido y rechazo que debe detectar | Tareas propietarias |
|---|---|---|---|
| **VAC-01** Dos mentes, mismo problema | Mismo hambre/energía, terreno y suministros; variar inteligencia, prudencia y conocimiento | Al menos una decisión/estimación difiere por motivos registrados; no solo número mostrado en ficha | SIM-011, SIM-002 |
| **VAC-02** Aprendizaje que cambia acción | Un sim fracasa al intentar fabricar; recibe enseñanza/práctica con materiales | Plan posterior usa habilidad/conocimiento adquirido y registra proceso real; evita XP por golpes irrelevantes | SIM-006, SIM-011 |
| **VAC-03** Rasgos frente a peligro | Un explorador impulsivo y otro prudente conocen distinto nivel de amenaza | Evalúan riesgos diferentes, pero hambre/muerte inmediata permanece filtro duro; no movimiento aleatorio incondicional | SIM-001, SIM-002, SIM-011 |
| **VAC-04** La palabra divina no controla | Se aconseja fundar colonia a un aldeano sin alimento o ruta segura | Puede rechazar o aplazar, sin gasto indebido ni teletransporte; el consejo deja motivo y trazabilidad | GOD-001, GOD-002, GOD-003, GOD-006 |
| **VAC-05** Enredo/negación | Mensaje en español «no quemes la granja» y mensaje ambiguo | No interpreta `quemar` como acción positiva; rechaza significado no soportado o pide claridad | GOD-001, GOD-006 |
| **VAC-06** Dos entornos familiares | Dos personas con capacidades iniciales comparables, pero distinto hogar/educación y cuidadores | Habilidades, valores, oportunidades o conocimientos cambian de manera explicable y persistente; no clones biológicos | SIM-012, SIM-004, SIM-006 |
| **VAC-07** Generaciones y propiedad | Padre/madre o cuidador muere tras años; existe herencia local y tutores | ID personal único, genealogía acíclica, transferencia de bien una vez y sucesión sin duplicación | SIM-008, SIM-012, SIM-003 |
| **VAC-08** Un hogar habitable | Aldeano cansado con vivienda y cama disponible, pero sin control del dios | Va físicamente a puerta, entra, duerme, regresa y recupera energía; save dentro sin teletransporte | INT-002…007, SIM-003 |
| **VAC-09** Trabajo con material real | Forja quiere herramientas; falta hierro o combustible; vecinos pueden comerciar | Fabricación espera stock, transporta/consume insumo verificable; no aparece objeto por temporizador | CIV-002, CIV-004, SIM-005 |
| **VAC-10** Colonia autónoma | Consejo debate colonizar, hay/desaparecen suministros, peligro y frontera de chunk | Expedición viaja, puede abortar; colonia solo surge si llegan sims/materiales; fundadores, edificios y recursos conservados | CIV-010, WLD-004/005, SIM-002 |
| **VAC-11** Rey y sucesión | Rey envejece o pierde legitimidad, heredero tiene relaciones y leyes | Cambio de líder respaldado por actor vivo y política real; nunca dos coronas incompatibles ni sucesión automática sin evento | CIV-009, SIM-008, SIM-012 |
| **VAC-12** Pueblos fuera de pantalla | Dos colonias sobreviven y producen mientras cámara observa reino distante | Evolucionan por lotes según tiempo, necesidad y recursos, no congeladas ni duplicadas al volver | SIM-013, WLD-008, CIV-010 |
| **VAC-13** God HUD limpio | Android 640×360 y 720×400, zoom x3, panel de linaje/reino | Mapa primero; un inspector; sin solaparse con controles, no ticks al abrir panel; estado save intacto | ART-007, GOD-007 |
| **VAC-14** Reabrir mundo completo | Save legado v1 + mundo V3 de décadas con familia/reino/chunks | Migración conservadora, mundo restaurable, IDs, historia y stock estables; errores corruptos no borran el último save | WLD-007, INT-003, SIM-010, QA-001 |

### Regla anti-maquillaje

Una captura con una casa, un rey, un árbol genealógico o un panel “INT 99” no prueba nada por sí sola. Cada caso exige **estado antes**, **evento causal**, **estado después**, **semilla**, **SHA**, **comandos** y **resultado realmente observado**. Si una etapa aún no existe, debe marcarse **NOT_IMPLEMENTED** y permanecer pendiente.

## 3. Cómo probar que inteligencia, personalidad y familia importan

**Variables separadas:** necesidades (cambian rápido); capacidades (razonamiento, memoria, autocontrol, percepción, creatividad, fuerza); temperamento (curiosidad, diligencia, empatía, prudencia, sociabilidad, autonomía, riesgo, fe); habilidades practicadas; información conocida/supuesto erróneo; contexto familiar/cultural; metas propias.

### Prueba factorial mínima por semilla

1. Construir escenario base S con estado del mundo y RNG congelables: comida insuficiente, dos caminos hacia recurso y una advertencia divina.
2. Crear A y B idénticos salvo **una dimensión a la vez**: primero razonamiento; luego prudencia; luego experiencia; luego crianza/conocimiento social. Nunca comparar sim con camino diferente si no se ha controlado la variable espacial.
3. Ejecutar planificador hasta una decisión relevante y guardar: `eligibleGoals`, `hardFilters`, `expectedOutcomes`, `utilityTerms`, `chosenGoal`, `reason`, `eventId` y consecuencias.
4. Repetir con al menos 16 semillas y con la misma secuencia, verificando que **idéntica semilla y entradas reproducen el mismo resultado**. La diferencia de rasgo debería cambiar al menos una predicción, objetivo elegible o decisión en uno o más escenarios diseñados para ello; **no exigir que todos los sims con alta inteligencia elijan siempre una tarea fija**.
5. Demostrar aprendizaje: tras observación/mentoría, cambia conocimiento o cálculo posterior con causa registrada, sin regalar éxito por valor estadístico alto.
6. Corregir sesgo: inteligencia NO multiplica obediencia, moralidad, valor humano ni derechos. Familias no fijan el destino del descendiente. La cultura puede dar conocimiento y oportunidades, no superioridad determinista.

**Fallo detectable:** las cifras aparecen en pantalla pero los archivos de decisiones, riesgos, objetivos y consecuencias son idénticos a igualdad de resto de variables, incluso tras escenarios que requieren esa característica. Otro fallo: sim inteligente cruza agua impasable porque “IQ=alto” ignoró ruta o recursos.

### Modelo ilustrativo de datos (no API implementada)

```json
{
  "personId": "person:elin:001",
  "needs": {"hunger": 58, "energy": 42, "social": 70},
  "capacity": {"reasoning": 78, "workingMemory": 63, "creativity": 71},
  "temperament": {"curiosity": 0.86, "prudence": 0.31, "autonomy": 0.92},
  "skills": {"farming": 5, "construction": 2, "navigation": 8},
  "knowledge": [{"factId": "ford:north", "confidence": 0.7, "sourceEventId": "event:100"}],
  "family": {"householdId": "home:2", "guardians": ["person:ira:002"], "familyId": "family:1"},
  "decision": {"goal": "explore_ford", "reasonEventId": "event:104", "nextReviewTick": 380}
}
```

No guardar un LLM separado por persona ni generar un proceso de IA por cada aldeano.

## 4. Dos recursos diferentes: consumo dentro del juego vs. consumo del teléfono

El usuario señala que los sims “consumen mucho”. **No confundir** una economía desequilibrada con un exceso de CPU/RAM: medir ambos como riesgos independientes.

### A. Presupuesto económico de la civilización

Cada bien debe tener fuente/destino contabilizable y unidad definida (por ejemplo raciones, troncos, piedras, herramientas); consumir para comer, cocinar, construir, transportar o reparar **resta cantidades reales**. Ningún flujo de trabajo puede crear riqueza infinita al cargar un save, cambiar de LOD, cerrar interfaz o cambiar chunk.

**Invariante por recurso, por intervalo:**

`balanceFinal = balanceInicial + producción + importaciones + hallazgos explícitos − consumo − exportaciones − deterioro`.

En la suma a escala mundial, importaciones/exportaciones internas se cancelan. Todo evento de consumo/producción lleva `sourceEventId`, actor, lugar, cantidad y justificación.

Pruebas obligatorias:
- Aldea de 10 sims con 3 raciones no debe alimentar a 10 de forma indefinida. Debe elegir racionamiento, cultivo, comercio, migración o consecuencias sociales causales.
- Familia con cosecha y despensa reduce reservas por días; la granja produce por tiempo, clima, trabajo y semillas, no solo abrir un panel.
- Dos poblados intercambian 5 unidades y la suma global se conserva salvo costes de transporte explícitos.
- Crear 3 casas consume material; abortar obra devuelve **solo lo realmente recuperable**, sin duplicarlo.
- Rey recauda impuestos: reducir recursos/hacienda de origen y añadir a tesoro real; doble entrada verificable.
- Cambiar de chunk/guardar/restaurar no vuelve a procesar las transacciones.

**Los valores numéricos de hambre, producción y precios se calibrarán mediante ensayos**, no declarar un consumo arbitrario como canon antes de probar la supervivencia durante varias generaciones.

### B. Coste computacional del sim

Meta: Android offline 2–3 GB de memoria **total del dispositivo**, no memoria disponible para el juego; documento de hardware propone **128–192 MiB residentes como objetivo** y ~256 MiB como techo provisional; **ninguna cifra es una medición certificada**.

| Nivel | Simulación | Render / costo |
|---|---|---|
| L0 visible | Necesidades/acción/colisión, decisiones por eventos y ticks | Sprites compartidos visibles, no crear Canvas por sim |
| L1 barrio | Trabajos/relaciones por lotes | No animar fuera de cámara |
| L2 colonia remota | Producción, natalidad, comercio, política y migración agregados | No usar A* individual fuera de pantalla |
| L3 historia | Registro de personas muertas y hechos, solo consulta | No tick de entidades retiradas |

**Contrato de rendimiento:** `peopleCount`, `activeL0`, `simSteps`, `decisionsEvaluated`, `pathSearches`, `eventQueueLength`, `saveBytes`, `renderedSprites`, `heapBytes` (si medible) y PSS/RSS en hardware físico. Medir tiempo de juego y real sin confundirlos; alarmas de crecimiento de memoria a más de 20 minutos y 1000+ tiles recorridos. Una persona que existe fuera de cámara no necesita 60 evaluaciones cognitivas ni 60 nodos DOM por segundo.

**Fallo detectable:** duplicación de personas al pasar L2→L0, nacimientos dobles, balances distintos con velocidad 1× y 8× para el mismo número de ticks, pathfinding O(población × mundo) en cada frame, cierre WebView por picos de memoria.

## 5. Familias, reinos, colonias y política verificables

### Matrícula histórica compartida

Todos los registros durables deben usar IDs estables `person:`, `family:`, `household:`, `settlement:`, `colony:`, `realm:`, `building:`, `event:`. Apellidos, títulos o referencias numéricas de arrays **no** son IDs. Un niño puede tener tutores distintos de padres biológicos; el hogar, ciudadanía, cultura y vasallaje son ejes distintos y pueden cambiar.

**Familia:** parentesco sin ciclos temporales, variación personal no clonada, edad/nacimiento/fallecimiento, herencia de propiedad con deuda/historia, cuidadores, educación y relación afectiva cambiante. El heredero político puede no ser hijo del rey; ley sucesoria y legitimidad son variables del reino, no “primogénito siempre” universal.

**Fundar colonia:** decisión del consejo/personas → objetivos/temores → reclutamiento/voluntad → raciones/herramientas inventariadas → camino real por chunks → exploración y sitio legal → primera casa/agua/campo → producción local → gobierno/tensión con reino de origen. **Puede fracasar** por hambre, clima, falta de herramientas, problemas de seguridad o negativa de colonos.

**Rey y reino:** cada monarca es persona que envejece y tiene necesidades, habilidades, aliados, familia, conocimientos limitados y legitimidad. Reinos conservan capital, fronteras, población, rutas, ley, tesoro y tratados. La sucesión ocurre por evento de pérdida/cambio de mando, con herederos factibles; no crear rey instantáneo al cruzar un umbral de “nivel”.

**La época debe empezar medieval.** Tecnologías nuevas nacen de conocimiento, investigación, maestros, herramientas, producción y recursos; no se salta automáticamente a armas de fuego o ciencia ficción por acumular experiencia.

## 6. Puntos de integración exigidos a los bots

1. El backend de eventos debe generar `eventId` único, `causeEventId` y actor IDs cuando corresponda; la vista del dios usa exactamente esos datos.
2. El sistema familiar y el político comparten el mismo registro de persona; no crear un “rey decorativo” duplicado.
3. Las rutas de expedición y construcción consultan el mismo servicio de chunks y colisiones que Nim; no teletransportar la colonia.
4. Las necesidades y oficios realmente consumen los bienes locales; el modo L2 agregado respeta la misma contabilidad.
5. El parser divino genera intención/hint, el planificador decide, los resultados se incorporan al diario solo cuando ocurrió acción material; no etiquetar un intento como éxito.
6. Toda migración desde `version:1` y `godseed-one-small-life-v1` conserva partida anterior e incorpora datos nuevos opcionales/idempotentes; ningún cambio de interfaz obliga a resetear mundo.
7. La UI debe permitir observar sin avanzar ticks y presentar **por qué** un sim, rey o consejo tomó la decisión.
8. Fotos conceptuales no son capturas QA. Solo screenshots con app corriendo + SHA probado.

## 7. Plan de pruebas automáticas para los futuros dueños

### Desencadenadores

- Node unitarios por subsistema en cada commit de sim.
- Integración multisistema por semilla para una simulación de **20 000 ticks** en al menos 16 semillas cuando la arquitectura lo soporte; números son **objetivos de aceptación futura**, no resultados ejecutados ahora.
- Playwright offline con `newWorld(seed)`, pausas, cámara, poderes, inspección, save/reload y árbol genealógico.
- Emulador Android API29 / Gradle y pruebas de ciclo de vida/save; hardware **real** de 2 GB y 3 GB RAM bajo QA-004 pendiente.
- Capturas UI Android 640×360 / 720×400 / 960×540, tres zooms, interfaz de observador sin cortes.

### Formato mínimo de evidencia por caso

```json
{
  "caseId": "VAC-04",
  "branch": "feat/god-006-example",
  "commitSha": "FULL_40_HEX_VERIFIED_WHEN_TEST_EXECUTES",
  "worldSeed": 41,
  "tickBefore": 300,
  "tickAfter": 322,
  "given": "colony proposal while village food is critically low",
  "expected": "decline or defer safely, no forced travel, supplies unchanged",
  "observed": "NOT_RUN",
  "result": "NOT_IMPLEMENTED",
  "evidence": []
}
```

Los valores de `commitSha` y `observed` son **marcadores de ejemplo**. No guardarlos como pruebas completadas. Cada reporte real debe usar SHA exacto y adjuntar logs/screenshot o aserciones. Los autores de casos deben ser **bots propietarios** de tareas correspondientes.

### Criterio de certificación de cada VAC

- **NOT_IMPLEMENTED:** diseño documentado sin código.
- **IMPLEMENTED_UNTESTED:** código disponible pero escenario no comprobado.
- **FAILED:** prueba ejecutada falla o contradice invariante.
- **PASS_EMULATED:** Node/Chromium/emulador certificado para HEAD, no físico.
- **PASS_PHYSICAL:** evidencia realmente medida en teléfono físico, únicamente casos aplicables.

No convertir `PASS_EMULATED` en `PASS_PHYSICAL`. No declarar 100% del juego porque los 3 capítulos terminen.

## 8. Orden de documentación y responsabilidades

| Subdominio | Contrato del dueño ya existente | Casos de integración |
|---|---|---|
| Bucle de dios y mapa | [Visión V3](../design/GODSEED_V3_VISION_AND_PLAYER_LOOP.md) | VAC-04/05/13 |
| Interfaz y poderes | [God view](../design/GOD_VIEW_AND_DIVINE_POWERS_V3.md) | VAC-04/05/13 |
| Inteligencia/familias | [Mente y familias](../design/SIM_INTELLIGENCE_PERSONALITY_FAMILIES_V3.md) | VAC-01/02/03/06/07 |
| Reinos y colonias | [Política](../design/KINGDOMS_COLONIES_DYNASTIES_V3.md) | VAC-09/10/11/12 |
| Escala/saves Android | [Rendimiento](../design/ANDROID_WORLD_SCALE_SAVE_V3.md) | VAC-12/14 |
| Planos/interiores | [Arquitectura métrica](../agents/SAFE_INTERIOR_ARCHITECTURE.md) | VAC-08/09 |
| Implementación y owners | [Tareas V3](../design/IMPLEMENTATION_TRACK_V3.md) y [registro](../agents/tasks.json) | Todos |

**Alcance QA-006:** certificar que estos **criterios están documentados, enlazados y asignables a pruebas**; no apropiarse de implementaciones ajenas. Un documento `QA-006 in_review` no significa que VAC-01…14 pasen. El responsable de cada implementación enlaza resultados después de introducir código real y pasar revisiones.

## 9. Qué debe ver el usuario como resultado final (criterios observables)

En vez de “Nim golpeó monstruo y subió 1 nivel”, el dios observa cómo una niña criada por carpinteros aprende a construir, discrepa con el consejo, participa en el levantamiento de una colonia, cambia de estrategia tras una pérdida, funda una escuela y llega a ser consejera o gobernante mientras el mundo sigue vivo. **Esto es un escenario esperado**, no un guion obligatorio ni un evento existente ya.

El jugador debe descubrir la historia porque las necesidades, vínculos, conocimientos, características, recursos y relaciones políticas han cambiado la trayectoria del personaje. Si todo se reduce a avanzar el reloj y mostrar una lista de eventos preescritos sin efectos sobre posiciones, recursos y decisiones, el rediseño aún no cumple el objetivo.
