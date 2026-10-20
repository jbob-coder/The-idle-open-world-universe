# GODSEED V3 — Colonias, reyes, casas dinásticas y evolución medieval
**Estado:** especificación futura, NO funciones existentes. Alcance CIV-009, CIV-010 y CIV-002…008, WLD-001…010, SIM-004/008/011/012/013.
**Diferencia con V2:** Briarford y Emberwick son pueblos fijos del mapa 64×48. No implican reinos con gobernantes, colonias fundadas, fronteras nacionales persistentes ni diplomacia funcional.

## Escala de mundo
**Habitante** pertenece a uno o varios grupos (hogar, oficio, gremio, fe, cultura) y vive en un edificio real.
**Asentamiento** tiene habitantes, parcelas, fuentes de agua, carreteras, vivienda, talleres, alimento, almacenes, gobierno local y memoria de eventos.
**Colonia** es un asentamiento fundador al que una comunidad decidió viajar, con origen, líderes, relación con la patria, línea de suministro, derechos y posibilidad de autonomía.
**Reino** agrupa asentamientos bajo ley/instituciones y rey/reina/consejo; frontera emerge de control territorial real. Una ciudad puede cambiar soberanía. Una comunidad puede no querer monarca (consejo, ciudad libre, clan).
**Continente/mundo** es un espacio continuo de chunks y biomas, sin teletransportar mágicamente de reino a reino por abrir un menú.

## Generación de más de dos sociedades
Inicio de campaña: 2 aldeas cercanas + semillas de poblados/tribus remotos aún no conocidos, sin crear todas las mallas al instante. A medida que los sims exploran y abren rutas fundan comunidades persistentes con distancias, recursos distintos, idiomas/culturas opcionales, oficios especiales. Para pruebas mínimas: 3 territorios con líderes diferentes y 3+ colonias eventualmente. No crear un solo icono por “reino” sin habitantes/caminos.

### Fundar colonia, de verdad
1. Consejo/persona formula proyecto: necesidad de tierras, guerra, alimento, refugio, fe, expulsión, comercio o ambición; ninguna colonia se funda simplemente porque transcurrieron N ticks.
2. Evaluación autónoma: liderazgo, conocimiento de ruta, terrenos, agua, amenazas, costes, herramientas, capacidad de reproducción social, alimentos para viaje y voluntad individual.
3. Grupo fundador decide si unirse; hogares pueden quedarse, cambiar de opinión o volver; evento cronológico persistente.
4. Caravana real cruza chunks, consume suministros y negocia amenazas; ruta y mapa con coordenadas mundiales. Si falla viaje: consecuencia, no teletransporte.
5. Llegada: marcar parcela segura, crear campamento, refugio, pozo, granja y almacén según planos y medios reales. Habilitar necesidades del grupo desde el primer tick.
6. Nueva comunidad guarda `colonyId`, `founderIds`, `originSettlementId`, `parentRealmId?`, `supplyRouteIds`, `allegiance`, `foundedTick`, leyes/tasas y diario.
7. Camino de crecimiento: colonia dependiente → municipio con consejo → ciudad comercial o independencia; puede fallar por enfermedades, migración, rebelión, sequía, guerra o deuda. La escasez afecta decisiones y construcción reales.

## Reyes y monarquías con personalidad
Un gobernante es un **sim con necesidades, edad, historia, inteligencia limitada, familia, facción y ambiciones**, no un icono de corona con bonificador fijo. Consejos, nobleza, gremios y comunes tienen intereses; las leyes y decretos requieren información, legitimidad, recursos y oposición.

`realm = {id, name, cultureId, rulerId?, government:'monarchy'|'council'|'clan'|'republic', successionLawId?, treasury, settlements[], relations{}, laws{}, stability, legitimacy, military{}, eventLedger}`.

Leyes propuestas: impuestos, protección comercial, reparto de tierra, obligaciones militares, libertad de asentarse, investigación pública y privilegios de gremios; todas repercuten en recursos, lealtad y agentes. El rey puede escuchar consejo divino pero no tiene obediencia garantizada. Inteligencia/diplomacia alteran información/planes, carácter y familia alteran prioridades. Evitar tiranos preprogramados o reyes omniscientes.

### Sucesión e historia dinástica
- Identificar cargo independiente de la persona `realm.rulerId` y mantener generaciones con `familyHouseId` + `parents[]`.
- Leyes de sucesión explícitas por cultura: primogenitura ficticia, elección del consejo, designación, regencia; no asumir un único sistema histórico universal.
- Muerte/abdicación/incapacidad convoca `succession_event` con candidatos reales, legitimidad, apoyos, vínculos y recursos. Pueden surgir regencia, guerra sucesoria, reino fragmentado o reforma institucional.
- Heredero **no** hereda automáticamente inteligencia, habilidad política, bondad, experiencia o reputación del anterior; familia transmite oportunidades, cultura, recursos y tendencias con variación.
- Un golpe de estado o independencia necesita facciones/agentes y condiciones verificables, no una tirada narrativa decorativa.

## Diplomacia y conflicto material
**Relaciones bilaterales**: confianza, agravios, comercio, fronteras, cultura, tratados y obligaciones; entradas causales `sourceEventId`.
**Opciones reales**: comerciar, abrir paso, alianza, matrimonio diplomático opcional, protectorados, disputa territorial, tregua, guerra, exilio, independencia.
**Guerra**: no reproducir solo `Kingdom A vs B`; soldados reclutados de hogares, comida, distancia, moral, enfermedad, murallas reales, pérdidas y recuperación. Los civiles reaccionan: huyen, reparan, negocian o reclaman paz. Mostrar victorias con sus costes.
**Economía**: producción, empleo, impuestos, precios regionales, rutas, bienes intercambiados; conservar stocks durante cada transferencia y viaje (anti-duplicación).
**Conocimiento político:** rumores, embajadores y espías limitan lo que sabe cada rey; “información imperfecta” cambia decisiones de invasión/diplomacia.

## Época medieval y progreso
Fundación → Agricultura → Artesanos → Comercio → Ciudad fortificada → Reinos y diplomacia → investigación posterior según **tecnología disponible, maestros, rutas, herramientas, energía, minerales, población y producción**, no contador de edificios. El usuario pidió época medieval como estética/identidad de inicio; el avance a otras edades **no está implementado** y deberá decidirse con canon. No introducir armas de fuego/cyberpunk de pronto. Mantener coherencia de transporte, tiempos, clima, tamaño físico y materiales.

## Datos y coste
Guardar `kingdoms`, `colonies`, `cultures`, `families`, `settlements`, `treaties` y `history` en registros globales por IDs estables; el mapa mantiene referencias espaciales/chunks. Un miembro no debe aparecer en dos colonias activas por errores de mapa. Reinos pueden persistir aunque su capital quede fuera de cámara; el procesamiento remoto puede agregarse por intervalos sin inventar nacimientos muertos ni guerras intermitentes al reabrir chunk.

## Aceptación demostrable
- Tres reinos/culturas identificables, dos sistemas de gobierno distintos, un monarca con historia y consejo, un territorio que se independiza o pasa de dueño por un proceso simulado y documentado.
- Colonia fundada por **sims que recorren ruta** y consumen recursos; bajo hambre/peligro se cancela/migra de forma coherente.
- Al morir rey, sucesión regida por ley/relaciones y no duplicar coronas ni personas.
- Comercio y guerra alteran stocks, rutas, seguridad, prosperidad y decisiones; todos los eventos poseen `causeEventId`.
- Ningún reino teletransporta tropas/recursos a chunks desconocidos; tests multisemilla y restauración de saved game en cada paso.
- UI de observación del dios muestra gobernante, aliados/enemigos, heredero, orden de sucesión, motivo de guerra y cronología, sin entregar joystick de tropas al usuario.
- Perf móviles con varios reinos/colonias/300+ ciudadanos distantes calculados de modo agregado, sin actualizar cada personaje a 60 FPS.

### Dependencias por fases
`WLD-001/002/004/005` mundo + colonias remotas; `INT-002/003/004` hogares reales; `SIM-011/012` inteligencia/familia; `CIV-002/003/004/005` logística y economía; luego `CIV-009` reyes, `CIV-010` colonias. Dependencias verificadas en registro mandan (no auto-reclamar).
