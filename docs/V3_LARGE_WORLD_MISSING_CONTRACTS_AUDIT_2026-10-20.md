# GODSEED V3 — auditoría complementaria del Gran Mundo: contratos omitidos y pruebas pendientes

**Fecha:** 2026-10-20 (zona del propietario). **Tipo:** documentación y auditoría de lectura; **NO modifica mecánicas ni corrige errores**.

**Procedencia:** PR [#60](https://github.com/jbob-coder/The-idle-open-world-universe/pull/60), rama `feat/godseed-v3-large-world-20261020`, SHA observado **`aedcb28d93dde1c6096c4df7da971f32f030c5c2`**. Base: PR [#57](https://github.com/jbob-coder/The-idle-open-world-universe/pull/57), SHA `75bcf267891eb1d84d7e2797b3a67aa46f0570e9`. Esta auditoría vive en una **rama documental independiente** derivada de #60, sin sobrescribir la rama de implementación y sin autorización para fusionar.

Leer primero [`V3_LARGE_WORLD_2026-10-20.md`](V3_LARGE_WORLD_2026-10-20.md): allí están el resumen del autor, la escala, las principales funcionalidades, el procedimiento de arranque y sus límites declarados. Este documento registra **detalles contractuales comprobables que faltaban o merecían mayor precisión**, sin presentar trabajo planeado como ya implementado.

## 1. Matriz de identidad, persistencia y propiedad

| Entidad | Dueño de estado | Qué se serializa realmente | Qué NO queda guardado |
| --- | --- | --- | --- |
| Modo Aria sola | `src/v3/sim.js`, `godseed-v3-prototype-v1` | Estado del simulador individual anterior | Atlas y explorador global |
| Aldea y puesto oriental | `src/v3/society.js` + `frontier.js`, `godseed-v3-society-v1` | Esquema social 3: ciudadanos, almacenes, consejo y colonia local | Progreso del cartógrafo global |
| Gran mundo | `src/v3/world_sim.js`, `godseed-v3-large-world-v1` | JSON de `schemaVersion:1`, `seed`, `homeland` (copia de guardado social), `wilderness` y `expedition` | Caché LRU de terreno, geometría WebGL, ubicación/zoom de cámara, selección del atlas, estado de controles |
| Terreno procedimental | `src/v3/world.js` | `generatorVersion:1`, árboles cortados `removed[]` y bayas agotadas `berries[]` | El millón de casillas: se regeneran según coordenadas y semilla |
| Taren | `src/v3/expedition.js` | Datos del explorador, descubrimientos, campamentos, eventos, chunks conocidos, madera/comida recogida y consumida | Una red de pueblos, comercio o familias nuevas |

**Semántica al abrir:** `?mode=world` busca primero su clave propia. Si falta, `app.js` intenta importar por **copia** el guardado social válido; si no hay ninguno, inicia un mundo nuevo con semilla 14. El modo importado arranca pausado. Si un guardado encontrado es inválido, `load()` indica error y no lo elimina automáticamente; el usuario debe restablecerlo de forma explícita. Cambiar entre modos guarda el modo saliente pero **no sincroniza** después los cambios del Gran Mundo con el original.

**Punto de integración:** en `world_sim.js`, el reloj de la colonia y el del explorador avanzan **uno por uno** (`homeland.advance(1)` antes de `Expedition.advance(...)`). Al cerrar la pestaña, la simulación no continúa en segundo plano. Cambiar la cámara o abrir el atlas solo observa: no da órdenes, no añade población ni avanza tiempo. Una partida en el Gran Mundo no modifica `main` ni el guardado histórico de Nim.

**Validación existente:** `world_sim.restore` comprueba versión, semilla coincidente, estado de la colonia con `Society.restore`, ecología a través de `World.create` y coherencia de la expedición con `Expedition.validate`. Los datos no están firmados criptográficamente: son controles de consistencia, no prueba irrefutable de autoría. La incidencia heredada [#59](https://github.com/jbob-coder/The-idle-open-world-universe/issues/59) explica que transacciones coordinadamente falsificadas pueden eludir comprobaciones de contabilidad del puesto; el nuevo modo reutiliza esa colonia.

## 2. Terreno mundial: reglas de generación no explicitadas

- Las coordenadas globales son enteros **−512…511**, en X y Z; los chunks son **16×16**, sus índices se calculan con `Math.floor`, incluidos X/Z negativos, y cada región mide **64×64**. `World.terrain` devuelve `null` fuera del mundo.
- La semilla de mundo `uint32` y un hash derivado de X, Z y una sal determinan elevación, humedad, calor, decoración y bioma. Existen **seis biomas terrestres y agua**. La línea de carretera global es `(x-24) mod 32 == 0` o `(z-24) mod 32 == 0`. Sobre agua las carreteras se convierten en **puentes transitables**; el agua sin puente y las rocas impiden el paso. Los árboles no son actualmente colisionadores.
- El entorno de la aldea (apron `−3…22` en ambos ejes) y las plazas de monumentos tienen reglas para no introducir relieve/obstrucciones incompatibles con las escenas V3 locales. La aldea social **sigue simulándose sobre su 20×20 original**: el atlas de 1.024×1.024 no sustituye sus contratos de construcción.
- Las muestras de terreno se crean por demanda, no cargando `1,048,576` objetos en memoria. `World.create` usa **LRU de 48 chunks × 256 = 12.288 muestras nominales**. Su ventana de lectura permite radio de 12 a 32 casillas y la escena limita/agrupa la cámara a radios 16…32. El cacheado de geometría WebGL es una implementación adicional del renderizador, no memoria de simulación persistente.
- El atlas pinta una previsualización a **128×128 muestras** (una cada ocho casillas, fuera del eje de carretera) y la amplía a 256×256 píxeles. Un mapa visible **no equivale** a instanciar físicamente todos sus árboles o aldeas. **255 monumentos** son geografía generada; por sí solos no tienen población.

**Contrato ecológico:**
`World.harvest(x,z)` acepta solo un árbol de terreno existente que no esté en la ventana de la aldea, registra su eliminación una vez y no lo regenera. `World.forage(x,z,tick)` descuenta una baya de un arbusto generado; recupera una unidad por cada **40 ticks**, hasta el máximo de tres, aunque la cámara esté lejos. Al guardar, un arbusto totalmente recuperado deja de necesitar una edición dispersa. La suma de registros `removed + berries` no puede superar **8.192**; alcanzada la cuota, algunas operaciones nuevas de recolección fallan en lugar de inventar recursos. El límite de texto del guardado del Gran Mundo es **1.500.000 caracteres**, no una medición de almacenamiento real de Android.

## 3. Explorador Taren: condiciones, economía y rutas reales

- **Nacimiento condicionado:** solo aparece un actor nuevo con identidad `world_taren` a partir del tick **600**, cuando ya existe un taller en la colonia. No aparecen aldeas procedimentales ni docenas de NPC por el mero hecho de tener 256 regiones. La colonia anterior sigue teniendo sus propios habitantes.
- **Supervivencia:** hambre disminuye cada 4 ticks; cuando no dispone de comida se activa búsqueda local. Come una ración de su **mochila** (restituye 36 de hambre), descansa recuperando hasta ocho de energía al bajar de cuatro y pierde salud si llega a hambre cero. Fallecer termina sus acciones; no hay resurrección.
- **Búsqueda y movimiento:** `world_travel.js` limita búsquedas locales BFS a **768 posiciones**, radio **12** para comida/madera y **24** para regresar a objetivos cercanos. Para viajes interregionales `roadStep` intenta una casilla por tick, priorizando la coordenada X y después Z, por carreteras transitables; no modela pendientes, monturas, transporte ni salto instantáneo entre regiones.
- **Itinerario:** la ruta predefinida contiene **224 hitos** dentro del cuadrado interior de regiones `−7…7`; se registra un descubrimiento al **llegar realmente** al monumento de la región. Los monumentos del resto del mundo existen, pero no todos forman parte de este itinerario. `knownChunks[]` almacena índices que visitó el **explorador**, no regiones reveladas mediante la cámara del dios.
- **Refugios:** un campamento requiere **cuatro unidades de madera recolectada** por Taren, con posición `anchor + (2,2)`. La regla de creación actual actúa sobre los hitos **1, 5, 9, …, 221**, hasta **56** refugios; ni colonos nuevos ni producción económica aparecen por levantar un campamento. Los contadores verifican `woodGathered − woodSpent == explorer.wood`, `woodSpent == camps × 4` y `foodGathered − foodEaten == explorer.food`.
- **Escala de cómputo:** el mundo se simula por tick y el motor local hace una operación de avance de la colonia en cada tick. Esto mantiene causalidad sin cámara activa, pero todavía debe perfilarse en Android; el número de casillas **no demuestra** automáticamente capacidad para miles de agentes simultáneos.

## 4. Fronteras de visualización y controles

`world_sim.snapshot()` reúne colonia, Taren y refugios solo para observación; `scene(x,z,half)` añade los tiles, árboles, bayas y monumentos cercanos y filtra ciudadanos y edificios fuera del campo de visión. `view.js` usa WebGL1 con niebla, geometría local y simplificación de árboles lejanos; `fallback.js` dibuja el mismo estado por proyección Canvas2D. Los renderizadores no deben mutar inventarios ni la semilla.

`app.js` ofrece `Gran mundo`, `Aldea local`, `Modo Aria sola`, atlas, seguimiento del explorador, retorno a la aldea, paneo y órbita opcional. El modo Canvas se solicita con `renderer=2d`. El zoom, la selección de atlas, la cámara y el seguimiento son **estado de interfaz no persistente**, y la observación no concede al jugador control directo de la IA.

## 5. Evidencia realmente disponible (sin atribuir pruebas a otro bot)

| Evidencia | Qué demuestra | Qué NO demuestra |
| --- | --- | --- |
| Fuente de PR #60, SHA `aedcb28d...` | Implementación y referencias de módulos descritos arriba | Corrección completa de una ruta de 224 regiones |
| [CI V3 en el mismo SHA](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39524199195) — **SUCCESS** | El pipeline V3 heredado compila/sintetiza HTML y supera sus pruebas existentes de solo/sociedad y navegador | El workflow **no ejecuta** `node --check` de los nuevos cinco módulos ni pruebas de `mode=world`; ver `.github/workflows/v3-3d-proof.yml` |
| [CI nativa Android](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39524199293) — **SUCCESS**; [APK V3](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39524161980) — **SUCCESS** | Compilación de host y lanzamiento en emulador para sus escenarios instrumentados | FPS, RAM, batería, viaje por mapa de 1.024² en un dispositivo físico de gama baja |
| Auditoría de lectura de esta documentación | Se cargaron los módulos desde GitHub en un evaluador JS y se ejecutaron **dos semillas (14 y 42) hasta 650 ticks**. En ambas Taren apareció, no murió y `WorldSim.restore(WorldSim.serialize())` reprodujo el estado. | Navegador real, ruta completa, guardado persistente del WebView, cientos de semillas o mediciones de performance |
| Comprobación ecológica directa, semilla 14 | `World.harvest(25,28)` eliminó un árbol; `forage(28,25,0)` pasó de tres a dos bayas; en tick 40 volvió a tres. Tras visitar más de 48 chunks el caché se mantuvo en 48; al serializar/restaurar permaneció la tala y se comprimió la baya restablecida. También se inspeccionaron límites `−512,511` y `512` fuera de rango. | Que todas las combinaciones de semilla/terreno y rutas se mantengan correctas durante días de juego |

**Corrección de procedencia documental:** el autor de PR #60 declaró correctamente **NOT_RUN** porque no ejecutó personalmente gameplay QA en su tarea. Posteriormente el repositorio ejecutó pipelines automáticos verdes en su SHA, pero **sus casos de prueba todavía no cubren la nueva funcionalidad**. Ambos hechos deben conservarse, sin convertir ese verde en certificación mundial.

## 6. Matriz de aceptación pendiente y ownership

| Prioridad | Prueba o decisión faltante | Criterio mínimo | Archivo/módulo de referencia |
| --- | --- | --- | --- |
| P0 | Registrar módulos nuevos en CI | `node --check` y tests propios para `world.js`, `world_travel.js`, `expedition.js`, `world_sim.js`; navegador `?mode=world` | `.github/workflows/v3-3d-proof.yml` |
| P0 | Identidad en bordes y chunks negativos | Hash estable para seed+X/Z, seam de chunks y restauración al evictar LRU | `world.js` |
| P0 | Migración y aislamiento | Primera copia de guardado social v1/2/3 validado; world↔society↔solo sin sobrescribir claves ajenas; rechazo de JSON corrupto, snapshots muy grandes y `generatorVersion` incorrecta | `world_sim.js`, `app.js` |
| P0 | Contabilidad Taren y territorio | Ningún campamento sin 4 maderas, árbol no reaparece, bayas no se clonan tras serializar y el actor no consume despensa ajena | `world.js`, `expedition.js` |
| P0 | Fallos sociales heredados | Revisar y reproducir [#59](https://github.com/jbob-coder/The-idle-open-world-universe/issues/59) antes de afirmar restauración libre de falsificaciones | `society.js`, `frontier.js` |
| P1 | Camino completo de 224 hitos | Taren recorre la ruta, se conserva el orden, no queda atrapado por agua/roca, refugios 1,5,9… y resultado determinista tras guardar/cargar | `world_travel.js`, `expedition.js` |
| P1 | Mundo en WebGL y Canvas2D | Atlas remoto, paneo a coordenadas negativas, cámara y fallback muestran lo mismo; controles no alteran `tick` | `view.js`, `fallback.js`, `atlas.js`, `app.js` |
| P1 | Rendimiento con hardware real | Memoria, FPS, temperatura, batería y estabilidad de WebView durante viajes prolongados en **Android de 2–3 GB** | `android/v3/`, escenario de emulador y dispositivo físico |
| P2 | Civilización fuera de la aldea | Decidir contratos para colonizar/reforzar refugios, logística entre regiones, residentes y economía propia; no confundir monumentos con asentamientos | módulos de simulación; nueva PR supervisada |

**Siguientes cambios recomendados (no ejecutados aquí):** crear `tests/v3_world.test.js` con pruebas de semilla, seam, recursos y viaje; extender `tests/v3_browser_acceptance.py` y actualizar el workflow y artefactos a una captura auténtica del Gran Mundo; crear aceptación de emulador específica para desplazamiento de cámara y restauración. Cualquier corrección de jugabilidad pertenece a la rama propietaria de la PR #60 o a una rama de fix coordinada, **no a esta auditoría documental**.

## 7. Riesgos y decisiones que no deben perderse en el traspaso

1. **No cambiar `generatorVersion:1` sin migración formal:** mutar hash, ruido, ríos, carreteras o colocación de recursos rompería el significado de `removed[]` y `berries[]` de partidas existentes.
2. **No hacer que la cámara cree estado autoritativo:** el mundo lejano es generado al observarse; nuevos NPCs o colonias requieren reglas de spawn persistentes y un presupuesto, nunca aparición accidental al hacer zoom.
3. **La cuota de recursos puede bloquear progreso:** al llegar a 8.192 ediciones o a 1,5 millones de caracteres, debe haber política explícita de recuperación/conservación. No se ha verificado ese extremo.
4. **Pruebas verdes heredadas no son cobertura del mundo:** actualizar CI antes de presentar la rama como validada. El éxito del emulador de pantalla inicial no equivale a horas recorriendo regiones.
5. **Integración V3 multirrama:** #60 se basa en #57. La línea de ciclo diurno de Aria (PR #58) no está integrada y no debe atribuirse al Gran Mundo. No fusionar #57/#60 con `main` sin resolver el orden y las responsabilidades.
6. **El usuario es un dios observador, no joystick:** mantener autonomía, contenido offline y estilo Pixel Squares 3D. El mundo contiene un cartógrafo extra, **no una inteligencia civilizatoria equivalente a todas las regiones**.

**FIN DEL AUDIT:** documentación añadida de forma independiente, con evidencia y límites separados; sin cambios de runtime, APK, saves, PRs ajenas ni claims de pruebas físicas.
