# GODSEED V3 — Referencia visual jugable y criterios de rediseño

**Estado:** documento de diseño y concepto visual, **NO implementación actual ni captura del juego**. Se adjuntó un concepto visual al chat de origen (18 oct 2026); la imagen generada no se considera un archivo integrado en el repositorio. Esta especificación describe una **pantalla de juego** organizada para Android, no la interfaz de un cartel informativo.

**Evitar conflictos:** `GOV-004` está **in_progress** bajo DESIGN-28 y es responsable de la biblia general V3. **No modificar sus archivos ni apropiarse de su tarea**. Este documento únicamente aporta un contrato de composición visual y criterios mensurables; el autor de GOV-004 puede citarlo al concluir. En el registro existente, `ART-007` es el rediseño jugable de UI, `GOD-006` el rediseño de poderes divinos, `SIM-011/012/013` las simulaciones de inteligencia/genética/rendimiento, `CIV-009/010` monarquías/colonias. Estados vigentes deben releerse en `docs/agents/tasks.json`, nunca tomarse de esta fotografía.

## 1. Problema que se quiere corregir

La interfaz actual acumula paneles y botones heterogéneos. Mirar a Nim y hacer clic repetido en `Bless`, `Gift`, `Bloom`, `Storm` o `Guide` no es observar una civilización viva. Las habilidades que fuerzan al sim contradicen el rol de dios: **influir en condiciones y creencias, no dar órdenes de movimiento**. La información de por qué un habitante decidió descansar, asociarse, cultivar, emigrar o rechazar un presagio no se ve fácilmente. Pocos NPCs con ciclos rígidos no constituyen familias, colonias o reinos.

## 2. Pantalla de juego principal, primero el mundo

Pantalla horizontal `640×360` como base de legibilidad y `720×400` como segunda aceptación; proporción cercana a 16:9. El mundo ocupa **al menos ~65 %** del espacio útil en modo observación compacto; paneles mayores se superponen solo al inspeccionar, y se pliegan de nuevo con un toque. UI no debe tapar el mapa persistentemente en un Galaxy A03. Mantener grilla pixelada, nearest-neighbor, bordes rectos y sin texturas descargadas.

- **Banda superior pequeña:** estación/año, velocidad `0× 1× 4×`, región, reino, población y fe cuando exista. No mezclar monedas del sim con fe divina.
- **Área central dominante:** mundo vivo con aldeas, campos, talleres, caminantes, caminos, puertas e interiores por capa, clima y eventos. Posibilidad de tocar personaje o edificio para observar, no controlarlo.
- **Navegación plegable:** `Mundo`, `Habitantes`, `Familias`, `Asentamientos`, `Reinos`, `Crónica`, `Consejo divino`. No diez botones de poder en una barra principal.
- **Panel contextual de un sim:** nombre, hogar, edad, profesión, necesidades, objetivos actuales, seis rasgos visibles/ocultos, razón de su última decisión, relaciones importantes y línea de vida. Lectura bajo demanda.
- **Panel contextual de reino:** mapa político, linaje, gobernante, leyes, economía, relaciones diplomáticas, colonias, recursos y conflictos. Solo mostrar campos que existan en la simulación.
- **Registro de eventos:** cambios significativos, no spam por cada golpe/comida; filtros por persona, familia, aldea y reino.

### Tres estados de UI demostrables
1. **Vista observador:** mundo mayoritario; solo fecha/velocidad/filtro y selección ligera.
2. **Ficha vida:** habitante seleccionado; familia, motivación, memoria y consecuencias sobre panel desplegable.
3. **Mapa de reinos:** regiones y fronteras persistentes, colonias, rutas de comercio y diplomacia. No inventar fronteras en un mapa de 64×48 sin un servicio espacial funcional.

## 3. Poderes del dios: coherencia de simulación

| Interacción divina | Mecánica propuesta | Agencia y coste | Retroalimentación |
|---|---|---|---|
| Observar | Inspección gratuita de entidades y crónicas conocidas | No cambia stats ni tiempo | Datos reales, motivos y incertidumbre |
| Susurrar | Mensaje español/inglés convertido a intención limitada | Sim evalúa creencias, necesidad, prudencia y objetivos; puede negarse | `heard→considered→accepted/declined→acted→result`, con motivos |
| Bendecir territorio | Mejora contextual limitada de fertilidad/seguridad para un sector | Consume fe, no da alimento gratuito infinito | Producción posterior medida en cosechas reales |
| Señal / presagio | Posibilidad de curiosidad o investigación | No fuerza ruta ni teletransporta | Quien interpretó y por qué |
| Inspiración | Incrementa oportunidad de estudiar/aprender o relacionarse | No concede tecnología, matrimonio ni obediencia directa | Tiempo y recursos invertidos, aprendizaje efectivo |
| Protección | Reduce riesgo localizado durante amenaza real | Duración/coste/cooldown; los NPCs siguen tomando decisiones | Heridas/edificios salvados, no evento falso |

Eliminar/relegar poderes de daño instantáneo, `Guide` direccional, niveles por ataques repetidos y la ilusión de crear población con un botón. Cualquier evento extremo (tormenta, plaga, prodigio) debe tener causa, coste, escala y consecuencias consistentes. Debe poder jugarse **sin utilizar poderes**.

## 4. Sim como personaje, no token móvil

**No prometer IA conversacional**: emplear decisiones explicables por necesidades, personalidad, inteligencia, recuerdos y oportunidades. Cada persona tiene identidad persistente, familia, edad, aptitudes/educación, profesión, metas, creencias, afectos y experiencias. Inteligencia no es un porcentaje universal de éxito: afecta anticipación, planificación, aprendizaje, resolución de problemas y creatividad junto a conocimientos previos, trabajo disponible, fatiga y riesgo.

### Vector de comportamiento propuesto
`utility(action)=need_urgency + trait_fit + learned_skill + expected_outcome + social_obligation + opportunity − cost − perceived_risk`.
Distinguir **capacidad intelectual** de **rasgos de personalidad**, educación, salud y motivación. El sistema elige una acción solo si es factible en mundo real y puede explicar las alternativas rechazadas. Una persona inteligente puede cometer errores, seguir valores distintos o desobedecer al dios. No usar “inteligencia” para clasificar personas como valiosas/inútiles.

**Herencia familiar:** parentesco y entorno influyen en el desarrollo sin determinar rígidamente personalidad/éxito. Linaje, crianza, vínculos, posición económica, educación, conflictos y acontecimientos dejan historia. Crianza/educación modifican habilidades, no solo números heredados. Reglas de población y mortalidad evitan crecimiento infinito de memoria.

### Rendimiento
El juego es Android offline para 2–3 GB de **RAM física del dispositivo**. Solo pocos sims visibles reciben simulación detallada de movimiento/animación por frame; fuera de pantalla se avanza vida mediante eventos/schedules con tiempos persistentes, sin crear objetos, rutas o recuerdos ilimitados. Mantener IDs estables y snapshots/deltas. No aceptar una demo con 1000 NPCs ficticios en un teléfono sin mediciones reales. Conservar historial agregado y mostrar biografías relevantes bajo demanda.

## 5. Colonias, reyes, conflictos y épocas

- Múltiples colonias deben surgir por necesidad concreta (población, recursos, comercio, seguridad, fe), salir de un asentamiento de origen y mantener rutas/costes logísticos, no aparecer mágicamente.
- Cada aldea necesita viviendas habitadas, trabajadores, campos, almacenes, plano de caminos y servicios. Crecimiento consumiendo tiempo y materiales; decisiones de ubicación modificables por sus responsables.
- Monarquía: gobernante con identidad y familia, legitimidad, sucesión, administración, leyes, facciones y diplomacia. El rey **es un sim** con intereses y límites, no un marcador en UI.
- Evolución de era exige descubrimiento, difusión del conocimiento, oficios, infraestructura y recursos. Un pueblo puede estancarse, decaer o especializarse; no todos deben seguir la misma ruta.
- Guerra/paz, tratados, migración y colonización generan consecuencias registradas en crónicas. Mantener tono de fantasía medieval consistente: no introducir edificios industriales/cyberpunk hasta existir avance tecnológico sustentado.

## 6. Jerarquía de implementación, sin confundir documento con feature

| Paquete | Dependencia y responsable documental |
|---|---|
| Modelo Dios/UX | `GOD-004` verified / `GOD-006` in_progress / `ART-007` ready |
| Sims de inteligencia y personalidad | `SIM-001`, `SIM-002` verified; `SIM-011` planned |
| Familia y transmisión social | `SIM-004`, `SIM-008`, `SIM-012` planned |
| Capacidad Android y simulación distante | `SIM-013` y `QA-004`, pendiente de dispositivo real |
| Construcción medieval y evolución | `CIV-001` en revisión, `CIV-002`, `CIV-005` planned |
| Colonias y gobernanza | `CIV-009` reyes y sucesión; `CIV-010` colonias, planned |
| Mundo abierto real | `WLD-001` y sucesores; documentar límites finitos actuales |

**Regla de bots:** antes de implementar leer `docs/agents/BOT_MASTER_PROMPT.md`, el contrato `TASK_WORKFLOW.md`, `tasks.json`, PRs del área y tareas propietarias. Reclamar antes de editar; registrar tests SHA exacto, PR y revisión independiente. No fusionar ni apropiarse del trabajo de DESIGN-28, FORGE-27 u otros agentes.

## 7. Aceptación visual y mecánica

- Tres capturas **del juego real**: modo observación, ficha del aldeano, vista política, resolución 640×360 y 720×400; no usar arte conceptual como evidencia de juego implementado.
- Un sim decide su día durante 240 ticks; la interfaz describe al menos cinco decisiones y un rechazo voluntario sin juego de clics compulsivos.
- Demostrar diferencias entre dos sim de inteligencia/rasgos/educación distintos **con mismo seed y contexto comparable**, sin manipular el resultado solo para prueba.
- Dos hogares persistentes, una familia con relación significativa y un servicio de trabajo/recursos real; sucesión/colonia en escenarios de pruebas deterministas cuando sus tareas terminen.
- Gráficos legibles, iconos definidos, paneles plegables, sin texto a 6px, entrada táctil y cámara pixel-perfect. Pausa debe mantener animaciones eficientes y nunca avanzar calendario por abrir panel.
- Guardado/restauración v1, cero solicitudes de red, memoria medida en hardware adecuado y accesibilidad de controles en Android.

**Este documento sirve para alinear arte y UX con la simulación social existente y futura. No da por completado GODSEED V3, sus colonias, IA, poderes o pantalla de juego final.**
