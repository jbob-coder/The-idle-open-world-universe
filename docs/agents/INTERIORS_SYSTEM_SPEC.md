# INT-001 — Contrato técnico de edificios medievales habitables y capas interiores seguras
**Estado de este archivo:** anexo técnico de implementación, **NO función implementada**. Para catálogo y medidas definitivas prevalece `docs/agents/SAFE_INTERIOR_ARCHITECTURE.md` (contrato normativo); las dimensiones alternativas aquí son ideas futuras y no sustituyen ese contrato. El prototipo del PR #21 tiene edificios exteriores 2×2 con arquitectura pixelada; no hay puertas atravesables, espacios interiores, hogares funcionales ni cambio real de capa. Documento asociado a **INT-001** del registro `docs/agents/tasks.json`. Toda afirmación de implementación requiere pruebas de código y cambio de estado aparte.

## A. Reglas no negociables
- GODSEED es un **simulador de vida de fantasía medieval**, 2D top-down, pixel art de cuadrados enteros, sin joystick para Nim, habitantes autónomos, juego Android offline.
- «Capa segura» significa **espacio interior tipado**, separado del terreno exterior pero dentro de la misma simulación. No es abrir HTML nuevo, dibujar una ventana fingida, copiar el mapa exterior ni detener arbitrariamente el reloj.
- El dios **observa, inspecciona y sugiere**; cada sim puede negarse. Un mensaje divino no puede forzar `enterDoor`, teletransportar al personaje o completar construcción.
- **Conservar** capítulos I–III, saves anteriores, `version:1`, `godseed-one-small-life-v1`, world seed, NPCs, recursos y mundo exterior existente. Las futuras ampliaciones de mundo por chunks son WLD-001…WLD-010, NO parte de este contrato completado.
- El render mantiene tiles de **16 píxeles nativos**, `imageSmoothingEnabled=false` y cámara con tres zooms, sin lógica de gameplay en funciones de dibujo.

## B. Métricas cuadráticas: dos grillas físicas explícitas
**Metros conceptuales** = unidades de diseño consistentes (NO afirmación de precisión geográfica real). El sistema guarda tiles enteros, nunca metros flotantes para la colisión.

| Grilla | Medida física de diseño | Pixel art nativo | Uso |
|---|---|---|---|
| Exterior | **1 tile = 2 m × 2 m = 4 m²** | 16×16 px | parcelas, carreteras, edificios, distancia del mundo |
| Interior | **1 celda = 1 m × 1 m = 1 m²** | 16×16 px | puertas, paredes, camas, muebles, rutas y trabajo doméstico |

Un edificio rectangular exterior de `w × h` tiles ocupa `(2w) × (2h) metros` y `4wh m²`. La malla interior se define por `outerW=2w` y `outerH=2h` celdas, con un anillo típico de paredes de 1 metro. El área útil máxima estándar será `(2w−2)×(2h−2) m²`, salvo divisiones internas. Esto preserva coherencia física: **no permitir interiores mayores que la envolvente exterior** salvo un portal mágico explícitamente marcado en el lore (nunca por defecto).

### Catálogo mínimo de planos
| Tipo medieval | Exterior (tiles) | Exterior (m) | Área exterior | Interior útil de referencia | Equipamiento |
|---|---|---|---:|---:|---|
| Choza humilde | 3×3 | 6×6 m | 36 m² | 4×4 celdas = 16 m² | cama, fogón, cofre |
| Casa familiar | 4×4 | 8×8 m | 64 m² | 6×6 = 36 m² | 2 camas, mesa, despensa |
| Casa amplia | 5×4 | 10×8 m | 80 m² | 8×6 = 48 m² | 3 camas, sala, cocina |
| Herrería/taller | 5×4 | 10×8 m | 80 m² | 8×6 = 48 m² | horno, yunque, almacenaje |
| Taberna | 6×5 | 12×10 m | 120 m² | 10×8 = 80 m² | cocina, barra, mesas |
| Granero/almacén | 5×4 | 10×8 m | 80 m² | 8×6 = 48 m² | sacos, estantes, almacén |
| Capilla | 5×6 | 10×12 m | 120 m² | 8×10 = 80 m² | altar, bancos, reliquia |
| Salón comunal | 6×6 | 12×12 m | 144 m² | 10×10 = 100 m² | consejo, tablón, reuniones |
| Torre de vigilancia | 3×3 | 6×6 m | 36 m² | 4×4 = 16 m²/piso | guardia y escaleras |
| Granja | zona exterior 5×5 o mayor | 10×10 m | 100 m² | **No necesariamente interior** | cultivos, cobertizo separado |

La versión de dos casillas 2×2 del PR #21 se mantiene sin alteración en partidas existentes, como `legacyFootprint` de 4m×4m hasta que el asentamiento elija expandirla mediante obra real y validación de espacio. No convertir edificios automáticamente sobre otros tiles, carreteras o ruinas. Los nuevos planos de 3×3–6×6 dependen de **CIV-001/INT-002**.

## C. Esquema persistente mínimo (propuesto)
```json
{
  "spaces": {
    "schema": 1,
    "activeView": { "kind": "overworld", "spaceId": "world:root" },
    "interiors": {
      "interior:briarford-house-001": {
        "buildingId": "briarford-house-001",
        "template": "medieval/cottage/v1",
        "width": 8,
        "height": 8,
        "tileMeters": 1,
        "furnishings": [
          { "id": "bed-1", "kind": "bed", "x": 2, "y": 3, "w": 2, "h": 1 }
        ],
        "doorInside": { "x": 4, "y": 6 },
        "revision": 1
      }
    }
  }
}
```
El ejemplo de 8×8 celdas representa una casa 4×4 exterior (8m×8m); 6×6 útiles quedan tras las paredes. `spaces` es **opcional** en saves viejos y se rellena desde `buildingId` y semilla al entrar por primera vez. El campo de estado por habitante debe tener `location: {kind:"overworld"|"interior",spaceId,x,y}` y conservar para salida su `returnOutside` validado. Este schema es ilustrativo del contrato, **no código de producción**.

### Identificadores y coordenadas
- `buildingId` permanente y único a nivel mundial; no usar índice de array, que cambia tras demoliciones.
- `spaceId = "interior:"+buildingId`; no regenerar otra casa al reabrirla.
- `doorOutside` = tile caminable adyacente a la fachada exterior; `doorInside` = celda libre interior adyacente al umbral.
- Persistir orientación N/E/S/O, planta/floor, dueño/household, capacidad, servicios y tipo.
- Evitar `x,y` de interiores en un mismo espacio global que pisa coordenadas del exterior. Los espacios usan su propio `spaceId`.
- `returnOutside` se deriva/verifica contra puerta; jamás usar coordenada arbitraria proporcionada desde la UI.
- Puertas y mobiliario no comparten colisión. Las camas reservan su huella en celdas interiores; al dormir el sim puede ocupar una postura/sitio de uso válido, no una pared.

## D. Máquina de estados de una puerta
`OUTSIDE → APPROACH_DOOR → VERIFY_ENTRY → INSIDE → LEAVE_INTENT → VERIFY_EXIT → OUTSIDE`.

1. **Approach:** el planificador autónomo reserva una tarea que justifica entrar (dormir, comer, fabricar, refugiarse, estudiar, socializar) y calcula ruta a la celda caminable al lado de la puerta.
2. **Verify entry:** edificio sigue existiendo, acceso válido, espacio no corrompido, no hay bloqueo, ocupación/capacidad segura y `doorInside` transitable.
3. **Commit atómico:** cambiar `actor.location` y `spaceId` en **un único tick**, guardar `returnOutside` para salida y emitir exactamente un evento `entered_building`. No dejar al actor duplicado en exterior/interior.
4. **Inside:** sim sigue tomando decisiones según necesidades, profesión, personalidad y horas. El reloj exterior avanza, pero sin dibujar todo el exterior. Los habitantes no visibles pueden usar un tick remoto de baja frecuencia manteniendo consecuencias.
5. **Verify exit:** puertas válidas, destino exterior libre; si está bloqueado, colocar al sim en el primer tile caminable vecino por búsqueda acotada y registrar motivo. Si no hay uno, **aplazar salida** en lugar de teletransportar a un tile peligroso o fuera del mapa.
6. **Return:** en un único tick asignar `kind:"overworld"`, `spaceId:"world:root"` y `x,y` exterior; disparar evento `left_building` una sola vez.
7. **Persistencia:** save/restore durante cualquier fase tiene resultado definido. Si se guarda en transición pendiente, al cargar se revalida/reanuda sin duplicar ni borrar el actor.

**No** efectuar transiciones en el renderer, en el método `draw()`, en hover de la puerta o al hacer scroll; la simulación es autoridad exclusiva. `God view` puede **inspeccionar** el espacio sin mover a Nim.

## E. Seguridad, interiores habitables y excepciones
- Por defecto no crear enemigos ordinarios ni reiniciar combate al cruzar la puerta. Un evento de asedio/incendio necesita bandera explícita en lógica de sociedad, condiciones de escape y pruebas; `safe` no es invulnerabilidad arbitraria.
- Casa: dormir para recuperar energía, comer alimento disponible, guardar/retirar inventario **sin multiplicar recursos**; hablar con convivientes cercanos; mantenimiento si falta.
- Taller: trabajo requiere materiales, mano de obra y tiempo; resultados se registran en stock real.
- Taberna: comer/socializar consumen comida; puede mejorar relación y ánimo. No contar visitas repetidas instantáneas como progreso gratuito.
- Capilla: oración vinculada a fe, con coste/beneficio limitado; no regeneración infinita por abrir una puerta.
- Refugio: frente al peligro el sim puede decidir entrar, pero enemigos no se borran del exterior por ello.
- Habitantes sin hogar: asignar refugio comunitario o tarea para conseguir vivienda; no materializar un hogar inexistente.
- Las condiciones ambientales del exterior no modifican mobiliario y pisos interiores por confusión de índices.
- La pausa y el paso individual no avanzan el mundo al abrir/visualizar paneles; modo 0× persiste.

## F. Planificador de sims: qué significa autonomía
El planificador produce propuestas ordenadas por urgencia: **supervivencia → refugio → hambre/energía → casa → trabajo → relaciones → aprendizaje/curiosidad → consejo divino**. Cada una tiene `reason`, `utility`, `targetSpace`, `expectedCost`, `expectedOutcome`. El sim puede rechazar sugerencia si falta material, no hay camino o contradice un objetivo personal. La ejecución real conserva el estado `heard → considered → accepted/declined → scheduled → action → outcome`, sin declarar `acted` antes de actuar. Mostrar en el diario: *qué quería*, *qué hizo*, *por qué*, *qué cambió*, *si hubo desacuerdo*. No confundir las rutinas actuales de PR #17 con una IA conversacional.

## G. API y límites por módulo
- `src/world/interiors.js`: generador puro `generateInterior(seed,buildingId,template)`, `validateInterior`, `insideWalkable`, y catálogo. Evitar crear salas por frame.
- `src/sim.js` o `src/sim/doors.js`: única API autorizada de transición `requestEnter(actorId,buildingId)`, `commitEnter(...)`, `requestLeave(...)`, `commitLeave(...)`.
- `src/sim/households.js`: ocupación, hogares, capacidades, cama asignada, necesidades compartidas.
- `src/sim/sim-needs.js` y `src/sim/sim-scheduler.js`: decisiones independientes deterministas; no llamadas remotas.
- `src/render/interior-renderer.js`: capa de suelo, paredes, mobiliario, actores, overlays seguros. No altera sim, faith, reloj o recursos.
- `src/ui/building-inspector.js`: mostrar puertas, habitaciones y cronología; controles como dios, sin joystick.
- `data/building-templates.v1.json`, `data/interior-templates.v1.json`, `data/sim-routines.v1.json`: definiciones auditables con versiones e IDs estables.
- `build.py`: incluir nuevos scripts UMD en orden de dependencia dentro de HTML offline; Android WebView debe usar el mismo paquete sin red.
- `serialize/restore`: cambios opcionales compatibles con `version:1`, límite de estructuras activas y JSON acotado. No persistir texturas Canvas.

## H. Pruebas mínimas para aprobar INT-002…INT-010
1. Cuatro semillas y varios tipos de edificio; todos los footprints de 3×3–6×6 respetan los **cuatro bordes completos**, caminos, agua, pueblo, santuario, ruina histórica y casas contiguas.
2. 100 entradas y salidas repetidas por actor y puerta; 0 duplicaciones, 0 pérdidas de materiales; misma ubicación exterior al salir.
3. Guardar/reabrir dentro del edificio; pausa permanece 0×; archivos v1 anteriores sin `spaces` migran correctamente; backup corrupto se rechaza.
4. Múltiples sims dentro de una casa ocupada; capacidad/camas razonables y colisiones sin atravesar paredes, huecos ni enemigos.
5. Un sim realmente vuelve a casa, se acuesta y recupera energía; otro usa taller; tercer sim rechaza mensaje divino no viable; diario y recursos muestran resultados.
6. Repetición con `s.tick` determinista: mismo seed + misma secuencia de acciones = mismo inventario, rutas y acontecimientos.
7. Cromium offline en 640×360, 720×400 y 960×540; puerta visible y botones de salir accesibles en los tres zooms, sin arte borroso o texturas externas.
8. Emulador Android API29: abrir/cerrar el APK dentro, pausa, minimizar/restaurar, guardar y volver a entrar; instrumentación verde.
9. No declarar 2–3 GB RAM compatible hasta completar QA-004 con teléfonos reales, PSS/RSS y sesión de ≥20 minutos.

## I. Orden y responsabilidades: dependencias (no inventar porcentajes)
`INT-001` contrato → `CIV-001/INT-002` planos grandes y suelo → `INT-003` estado persistente → `INT-004` transiciones atómicas → `INT-005` visual interior → `SIM-001/INT-006` hogares → `INT-007` sueño/comida/social → `INT-008` servicios → `INT-009` inspección divina → `INT-010` regresiones. `ART-002` aporta sprites/tiles. `WLD-001` y tareas siguientes llevan al mundo realmente abierto, pero no se dan por completadas por crear interiores.

**Entrega de INT-001:** este contrato, documentación y revisión; su existencia habilita revisión, **no implica** puertas ejecutables. El dueño debe actualizar `tasks.json` / `TASK_BOARD.md` y adjuntar PR/test; sólo el integrador marca `done` tras fusión.
