# GODSEED V3 — Rediseño de cómo se juega como dios
**Estado:** contrato UX propuesto, no UI implementada. Principal: GOD-006 / GOD-007 / ART-007. Código actual contrastado: `index.template.html`, `src/ui.js`, `src/sim.js`.
**Problema:** muchas tarjetas/botones y acciones directas sin relación clara con vida y civilizaciones.

## Principio de información
**70–80% de la pantalla para mundo visible**, salvo inspección deliberada. El usuario no necesita consultar 9 paneles permanentemente. Dejar controles divinos contextuales al seleccionar persona, familia, edificio o reino. Todas las vistas respetan posición de cámara, zoom, fog de descubrimiento y escala física. Imagen conceptual generada en ChatGPT el 18/oct/2026: **referencia estética, no evidencia de implementación**.

### Distribución Android horizontal, 640×360 y 720×400
- Fila superior (~32px): hora/año/estación, play/pause/1×/4×/8×, cultura/fama divina, avisos discretos. No diez monedas irrelevantes para el dios.
- Menú lateral retráctil (~48px): **Mundo, Vidas, Hogares, Colonias, Reinos, Historia** (un solo modo activo). Ocultable para usar todo el mapa.
- Mapa principal libre (~80% del espacio útil): aldeas/edificios con sentido, sprites de sims, caminos, obras en progreso, cultivos, clima, situaciones, fronteras y mini-eventos.
- Panel de inspección **uno a la vez** (máximo 30–38% del ancho en horizontal): “Elin, carpintera, 23”, ánimo, peligro, objetivo, razón, habilidades, relaciones y acceso a ficha completa. Cerrarlo jamás altera el sim.
- Zona inferior / botón flotante: **Consejo divino** y 1–3 acciones contextuales. Nada de 7 poderes indiscriminados superpuestos.
- Diarios y árbol genealógico como **pantallas dedicadas** detrás de pestañas: no se cargan/renderizan si están cerradas.

### Navegación de un ejemplo real
1. Seleccionar a Elin en mapa → muestra **quién es, dónde vive y qué intenta**.
2. Pulsar “¿Por qué?” → `goal: ayudar a su madre`, necesidad de alimento, miedo, confianza, juicio personal, fuentes de evidencia.
3. Elegir “Sugerir: mejora el granero” → mostrar alcance, destinatarios, interpretación y probabilidad/reacción incierta (si existe cálculo respaldado).
4. Confirmar consejo → aparece “Oído; bajo consideración”; Elin decide después de priorizar seguridad/familia.
5. Diario registra “Rechazó la idea porque la ciudad carece de madera” o “Aceptó, pidió ayuda a su hermano”, seguido por resultados materiales **solamente si sucedieron**.
6. Pulsar “Ver vida” → línea de acontecimientos, lazos y decisiones de varios años; no requiere otro menú modal en pantalla principal.

## Tabla de poderes propuesta y contrato
| Poder | Alcance y coste | Nunca debe hacer | Respuesta verificable |
|---|---|---|---|
| Observación | mundo descubierto, gratuito | revelar secretos no observados | muestra estado respaldado por sim |
| Inspiración | sim/grupo, fe y enfriamiento | fijar objetivo o éxito garantizado | modifica motivación temporal, sim elige |
| Consejo | persona/hogar/consejo, gratuito o fe baja | ordenar caminar/construir | heard → interpreted → accepted/refused → acted/result |
| Visión | evidencia limitada, fe o evento | inventar profecía perfecta | conocimiento atribuible, incertidumbre |
| Advertencia | amenaza específica, fe baja | causar huida forzosa | sim escucha, calcula riesgo, puede ignorar |
| Oportunidad | recurso/hallazgo/contexto, fe alta | generar recursos infinitos | impacto mundial medido y equilibrado |
| Protección | comunidad/evento, fe alta | eliminar toda la guerra o muerte | mitiga un daño definido y trae consecuencias |
| Milagro mayor | desbloqueo tardío, recurso raro, cooldown largo | saltar edades o reinar en lugar del rey | caso narrativo sistémico con reputación y efectos |

**Deprecar o reconceptualizar la botonera actual:** Heal Nim → protección contextual con causa; Gift Food → bendición/oportunidad agrícola local con límite; Bloom → restauración ecológica estacional; Guide → mensaje no vinculante; Lightning → protección/juicio raro con consecuencias; Inspire → motivación/fe real; Inspect → vista global gratuita. No eliminar características sin migrar guardado/configuración/tests. La lista es **diseño propuesto**, no comportamiento ya codificado.

## Reglas de percepción y confianza
- Usuario puede conocer lo que el sistema puede justificar; pasado oculto/falso rumor debe etiquetarse como rumor o fuente, no certeza.
- La fe y confianza del habitante alteran **atención**, no obediencia automática. Inteligencia altera **interpretación**, experiencia práctica altera **factibilidad**, carácter altera **voluntad**.
- Negación (“no quemes la granja”) se respeta de forma conservadora; ante ambigüedad pedir aclaración dentro de UI o decir “no comprendido”, nunca ejecutar lo contrario.
- Evitar texto fabricado tipo chatbot offline sin comprensión verificable; clasificación por gramática auditable sirve para v1, futuro motor semántico opcional solo tras medir hardware.
- Eventos y tooltips explican límites “Influencia, no control directo” / “Puede ignorar el consejo”.

## Claridad visual y móvil
- Pixel art cuadrado, pictogramas coherentes por dominio, texto 12px o más donde quepa, mínimos de toque 44×44 CSS px, contraste y foco accesible.
- No desactivar scrollbar accesible ni usar tooltip hover como único medio; tap mantiene selección.
- Cámara centrada y herramientas independientes; apertura/cierre de panel no causa ticks, gasto ni teletransporte.
- Ancho corto reduce a una sola tarjeta deslizable. A 640×360 jamás más de 1 panel sobre el mundo.
- Renderizar mediante sprites/canvas medidos y virtualización de tablas/historia: no mostrar miles de tarjetas DOM a la vez.

## Pruebas de aceptación
ART-007: 640×360 y 720×400, 3 zooms, 0 campos cortados, mapa centrado, un panel contextual máximo; screenshots de **aplicación funcional**, no ImageGen.
GOD-006: cada poder tiene alcance/coste/tipo, se consumen recursos una sola vez, las decisiones pertenecen al sim, hay efectos negativos posibles, registro completo y anti-spam.
GOD-007: cronología por generaciones, filtros por familia/reino, guardado/restore, sin duplicar eventos ni saltar tiempo al navegar.
Testear offline Chromium, Android emulador, teclado/touch, pausa y regresiones de `save v1`.
