# GODSEED v0.3 — Reino medieval fantástico (rama experimental)

## Objetivo

GODSEED es una simulación **offline** en Android de un mundo medieval fantástico visto desde arriba. El jugador es un dios. Nim **vive por su cuenta** mediante un planificador local determinista, no una IA conversacional, y se relaciona con hasta tres viajeros independientes. La deidad observa y modifica condiciones: no tiene joystick para conducir a Nim.

## Cinco decisiones de diseño implementadas

1. **Caminos del antiguo reino.** Dos pequeñas aldeas se conectan con caminos de tierra sobre la cuadrícula existente de 64×48. Se distinguen en el minimapa. Se mantienen accesibles a través del sistema de navegación actual.
2. **Terreno pixel-art más expresivo.** Los árboles, praderas, rocas y ruinas tienen patrones de varios tonos; se dibujan cabañas con techos medievales y santuarios de piedra rúnica. El escenario sigue usando rectángulos Canvas 2D de 16 píxeles, sin descargar sprites grandes ni utilizar GPU 3D.
3. **Tres habitantes de gremio.** Ira (boticaria), Toren (escudero) y Mera (estudiosa de runas) recorren áreas pequeñas de manera autónoma. Guardan confianza, estado de ánimo y actividad. Los encuentros con Nim surgen del comportamiento de ambos, no de órdenes directas del jugador.
4. **Influencia divina con consecuencias distintas.** **Inspirar** consume Fe y exige seleccionar a un viajero descubierto. Tras recibir una inspiración, la boticaria puede cultivar hierbas, el escudero ahuyentar bestias y la estudiosa revelar una ruina. Cada bendición se procesa una sola vez; la deidad no controla al NPC.
5. **Peregrinación y recuerdos.** Nim identifica y estudia santuarios, gana conocimiento y registra en la crónica cuándo los visitó. Una ubicación no puede conceder recompensas repetidas. Las partidas antiguas conservan el esquema de guardado v1; se inicializan datos ausentes de NPC y santuarios al cargar.

## Interfaz

La vista horizontal conserva el mapa principal, controles inferiores para poderes y tiempo, panel de Nim, crónica y minimapa. Se añade representación visual de carreteras, aldeas y santuarios, identificación de profesiones, los estados de los viajeros y la opción **Inspirar**. Las maquetas SVG de `assets/concepts/` siguen siendo conceptos y **no sustituyen capturas reales de la app**.

## Rendimiento en Android antiguo

- No usar Unity, texturas HD, partículas complejas, shaders o modelo LLM en el dispositivo.
- Simular máximo **3 NPC** y hasta 5 enemigos de forma periódica.
- Dibujar en Canvas 2D, con textura estática guardada entre cuadros y ventana visible de 36×22 celdas.
- Priorizar guardados fiables, botones legibles a 640×360 y lectura offline sin permisos de internet.
- No simular el mundo con la app cerrada. Cualquier trabajo en segundo plano será un requisito separado con análisis de batería.

## Evidencia y límites

Se añadieron pruebas `tests/medieval_world.test.js` para generación reproducible, itinerancia de NPC, inspiración de un solo uso, santuarios y compatibilidad de partidas. La CI se amplió para ejecutar `node --test tests/*.test.js`. Una prueba detectó que Nim podía abandonar un santuario sin estudiarlo; se corrigió priorizando la interacción al llegar. La ejecución de GitHub Actions correspondiente al arreglo pasó.

**No se ha probado la APK de esta rama en un teléfono Android real.** La APK v0.2 existente no recibe automáticamente estas características. Para una nueva APK es necesario generar el HTML consolidado, reconstruir con firma de desarrollo, verificar estructura/firma e instalarla en hardware para validar rendimiento y guardados. La clave temporal de CI no es una clave estable de actualización.

## Próximo lote de cinco (no implementado en este lote)

1. Animación discreta para puertas, fogatas y señales climáticas, con opción de reducir movimiento.
2. Más situaciones sociales (intercambio, promesas, sospechas) con memoria y consecuencias de largo plazo.
3. Santuarios con consecuencias regionales, evitando recompensas infinitas.
4. Primeros interiores de ruinas de 8×8 sin aumentar significativamente la memoria.
5. Pruebas reales en teléfonos Android antiguos y medición de cuadros por segundo, memoria y batería.

## Continuidad del repositorio

`src/sim.js` → rige → autonomía/relaciones/santuarios
`src/ui.js` → dibuja → aldeas/caminos/ruinas/estados
`index.template.html` → expone → poderes e interfaz Android horizontal
`tests/medieval_world.test.js` → comprueba → reglas medievales
`.github/workflows/qa.yml` → ejecuta → pruebas de regresión
`PROJECT_STATE.md` → registra → estado y decisiones verificadas
