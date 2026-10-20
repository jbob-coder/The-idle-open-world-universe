# GODSEED V3 — Visión del juego, límites y bucle del dios
**Estado:** diseño de producto / contrato deseado, NO contenido jugable ya implementado. **Fecha:** 2026-10-18. **Responsable:** DESIGN-28, tarea GOV-004.
**Fuente de implementación actual:** rama `integration/godseed-living-society-multitile-architecture` PR #21, código `src/sim.js`, `src/living.js`, `src/ui.js`. El PR #32 agrega una pantalla de carga; no modifica la jugabilidad. No editar `main` ni fusionar automáticamente ramas.

## Qué es GODSEED (intención definitiva)
Un **simulador medieval de vidas y civilizaciones visto desde los ojos de un dios**, con pixel art 2D cuadrado y mundo abierto por chunks; juego original, offline en Android de 2–3 GB RAM física. El usuario **observa, investiga, aconseja, inspira o crea oportunidades**; no mueve habitantes como unidades RTS y no decide por ellos. La fantasía es observar cómo un pequeño asentamiento de personas reales, con virtudes, fallos y relaciones, se convierte —o fracasa en convertirse— en ciudades, reinos, colonias y dinastías a lo largo de siglos.

Referencia funcional: profundidad de decisiones biográficas evocada por BitLife, **pero visual e independiente de marcas, textos, interfaz o contenidos ajenos**. Entorno con causa/efecto observable, no solo estadísticas creciendo por repetir golpes o capítulos guionizados.

## Lo que el usuario considera fallos reales de V2
1. El mapa visible y la cámara no parecen mundo abierto: sigue el **64×48** en la rama de integración, aunque WLD-001 tiene un PR independiente.
2. Los personajes hacen bucles de ruta, recolectar y descansar; hay pocos NPC, escasa variedad, diálogo/acciones poco convincentes.
3. Los edificios de 2×2 sprites no son casas habitables; faltan puertas, suelo interior, mobiliario, camas, talleres, hogar y navegación coherente.
4. Atributos cognitivos, personalidad y experiencias familiares apenas afectan las decisiones. Sus vidas no producen historias profundas.
5. Pocas aldeas predeterminadas; no hay verdaderas colonias colonizadoras, reyes, casas dinásticas, comercio político ni guerras diplomáticas sistémicas.
6. UI desordenada, poderes de dios arbitrarios, acciones sin contexto ni consecuencias suficientemente visibles.
7. Crecer a cientos o miles de habitantes sin simulación por niveles de detalle saturaría el teléfono.

## Cuatro bucles, sin control directo
**Instante a instante:** cámara/mundo en primer plano → inspeccionar evento o persona → comprender necesidad/intención → sugerir inspiración/advertencia/oportunidad → sim acepta, pospone, adapta o rechaza → mundo cambia → registrar causa y resultado.

**Vida individual:** nacimiento/crianza/educación → necesidades y rasgos → relaciones, oficio, reputación y pérdidas → proyectos personales → hijos o legados → fallecimiento/recuerdo de impacto (no todos forman familia, ni la descendencia es obligatoria).

**Sociedad:** campamento → poblado → aldea → mercado/escuela → ciudad → reino, según comida, vivienda, logística, conocimiento, seguridad y decisiones colectivas. El progreso puede detenerse, retroceder, separarse o entrar en crisis.

**Mundo:** varios territorios persistentes, naturaleza/recursos, colonias lejanas, comercio/migración, alianzas, conflictos, descubrimientos y evolución de la época mediante investigación y acceso real a tecnología, no puntos mágicos.

## Identidad de jugador: dios observador
- **Observar y conocer** son gratuitos: mundo, aldeas, hogares, parentescos, historia, objetivos, riesgos, contradicciones y recuerdos.
- **Consejo:** mensaje semántico limitado y comprobable enviado a una persona/círculo; se guarda la interpretación y aceptación/rechazo, NO una orden de mover.
- **Inspirar:** aumenta por un periodo la voluntad o creatividad ante una oportunidad; la persona decide.
- **Oportunidad:** afecta el mundo (semillas, recursos escasos, hallazgo o evento) bajo coste/riesgo y límites anti-exploit.
- **Advertir / proteger:** información o mitigación, no invulnerabilidad gratuita; el sim puede ignorar aviso.
- **Visión:** muestra una evidencia útil, ruta o predicción con grado explícito de incertidumbre, no acceso automático a todo conocimiento secreto.
- **Milagros:** excepcionales, costosos, con consecuencias culturales, morales, ecológicas y políticas; sin barra de “Lightning para matar enemigos por XP”.
- **No hacer nada** debe ser una elección válida y disfrutable. La sociedad no debe necesitar clics del jugador para sobrevivir.

## Historia sin guion fijo
Los capítulos existentes pueden preservarse como **relatos locales o introducción**, pero no bloquear la vida simulada. La nueva progresión mide cultura, infraestructura, bienestar, historia colectiva, sucesión y descubrimientos; ningún final de capítulo certifica el juego completo. Eventos emergentes: una aldeana hereda la herrería; el rey necesita aldea para provisiones; un colono desobedece y funda territorio; una enfermedad cambia la política y provoca migración.

## Lo que realmente existe (comprobado en fuente base)
- Código actual crea Briarford y Emberwick, cuatro ciudadanos adicionales y tres viajeros; Nim es observado.
- `src/living.js` guarda diligencia, amabilidad e independencia, relaciones mínimas, edades/oficios/XP y progreso de 4 etapas; la búsqueda de terrenos opera sobre 64×48 y 2×2.
- `index.template.html` presenta inspect, bless, gift, bloom, guide, storm e inspire; `src/ui.js` maneja mapa y poderes, con carga offline via build.py.
- PR #21 conserva tres capítulos, guardado v1, render pixelado y pruebas emulador; **no** es el juego V3.
- PR #32 (separado) implementa la pantalla de carga, también **no** equivale a un rediseño funcional de gameplay.

## Restricciones y criterios de salida del rediseño
- Siempre offline, deterministic-seeded, Android touch, pixel art sin smoothing, guardado v1 migrable, sin promesas de IA grande en dispositivo de pocos recursos.
- La representación visual de una aldea, persona o batalla corresponde a entidades, inventarios, eventos y posiciones reales.
- Cada intervención divina produce `intent → interpretation → opinion → choice → action → consequence`; registrar negativa y costes.
- Un sim puede vivir todo un ciclo y dejar huella sin atacar monstruos.
- Al menos tres culturas/reinos o territorios diferentes en ensayo, una colonia fundada de verdad, dos generaciones con parentesco estable y una sucesión política verificada.
- Entregar pruebas de vida prolongada, simulación seed determinista, navegador sin red y Android emulador. Hardware físico 2–3 GB **pendiente** hasta medición (QA-004).
- Cada subtarea referencia `docs/agents/tasks.json` y los contratos V3; una imagen ilustrativa es **CONCEPTO, no screenshot del juego actual**.

**Índice:** [God UX](GOD_VIEW_AND_DIVINE_POWERS_V3.md) · [Sims cognición/familia](SIM_INTELLIGENCE_PERSONALITY_FAMILIES_V3.md) · [Reinos y colonias](KINGDOMS_COLONIES_DYNASTIES_V3.md) · [Rendimiento y saves](ANDROID_WORLD_SCALE_SAVE_V3.md) · [Tareas y acceptance](IMPLEMENTATION_TRACK_V3.md).
