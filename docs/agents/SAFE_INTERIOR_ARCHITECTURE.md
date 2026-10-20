# GODSEED — Contrato de interiores, puertas y metros cuadrados (P0)

**Ámbito:** `INT-001` (contrato), `INT-002..INT-010` (implementación posterior), `CIV-001` (planos) y `SIM-003` (hogares).  
**Estado de implementación:** **ESPECIFICADO / NO IMPLEMENTADO** en PR #21. Los edificios actuales de 2×2 son reales en el exterior, pero **aún no se puede cruzar una puerta hacia un interior jugable**.  
**Autoridad:** `docs/agents/tasks.json`; no confundir este diseño con código existente.

## I. Experiencia obligatoria

El jugador es un **dios observador**: puede elegir inspeccionar un hogar y enviar una sugerencia, pero **no mueve directamente** a Nim ni a los sims. El habitante decide ir a casa, entrar, dormir, reunirse, trabajar, salir o rechazar una sugerencia.

La casa debe ser un edificio medieval visible sobre el terreno, con cuatro paredes, techo, puerta y ocupantes. Una puerta es una transición funcional entre el mundo exterior y una **capa interior independiente y segura**, no un icono que anuncia “Inside”. Al volver, Nim aparece junto a **la misma puerta física**, la sociedad exterior conserva su reloj y el mapa no se reinicia.

## II. Modelo de medidas cuadriculadas y escalas

Para evitar interiores mágicamente enormes sin explicación, el contrato usa **dos escalas métricas coherentes**:

| Dominio | Píxel fuente | Cuadrícula física de simulación | Área por celda |
|---|---:|---:|---:|
| Mundo exterior | 16×16 px | **2 m × 2 m** | **4 m²** |
| Interior | 16×16 px | **1 m × 1 m** | **1 m²** |

Los 16 píxeles constituyen una unidad artística *diferente* en cada dominio; la cámara conserva píxeles cuadrados y proporción 1:1 en pantalla. Las dimensiones físicas están definidas por los metros lógicos, no por cuántos píxeles aparece una cama.

`area_m2 = physicalWidth_m * physicalHeight_m`.  
Para una huella exterior `wTiles × hTiles`: `area_m2 = wTiles*hTiles*4`.  
Para un interior `wCells × hCells`: `area_m2 = wCells*hCells`.  
La superficie interior total **no supera** arbitrariamente el área bruta de la construcción (paredes/restos reducen superficie útil).

| Construcción medieval | Exterior (tiles) | Tamaño real exterior | Área bruta | Cuadrícula interior |
|---|---:|---|---:|---:|
| Cabaña | 3×3 | 6×6 m | 36 m² | 6×6 celdas (paredes dejan 4×4 transitables) |
| Casa familiar | 4×4 | 8×8 m | 64 m² | 8×8 (6×6 transitables) |
| Herrería / taller | 5×5 | 10×10 m | 100 m² | 10×10 |
| Taberna | 6×5 | 12×10 m | 120 m² | 12×10 |
| Almacén | 5×5 | 10×10 m | 100 m² | 10×10 |
| Capilla / santuario | 6×6 | 12×12 m | 144 m² | 12×12 |
| Salón comunal | 6×6 | 12×12 m | 144 m² | 12×12 |

El edificio actual de **2×2** sigue siendo compatible como **vivienda temporal de 4×4 m, 16 m²**, apta para una sala 4×4 austera, o puede renovarse a 3×3 o 4×4 en una acción de construcción verificada; nunca se aumenta una huella dentro de un terreno ocupado sin validar.

**Puerta exterior**: ancho de una celda exterior (=2 m), orientada N/S/E/O, anclada a una celda transitable junto al edificio.  
**Puerta interior**: paso de dos celdas interiores contiguas (=2 m), con celda de llegada segura y obstáculo libre.  
**Paredes**: celdas interiores con `walkable:false`; pisos y mobiliario tienen colisión real; techo no forma parte de la colisión en piso.

## III. Entidades y contratos propuestos

```js
// Contrato esperado, no afirmación de módulos existentes.
building = {
  id: "briarford-home-0001", version: 1, type: "home",
  world: { regionId: "R01", chunkX: 0, chunkY: 0 },
  footprint: { x: 24, y: 21, w: 4, h: 4, metersPerTile: 2 },
  entrance: {
    orientation: "south",
    thresholdWorld: { x: 25, y: 24 },
    approachWorld: { x: 25, y: 25 },
    interiorId: "interior:briarford-home-0001",
    thresholdInside: { x: 3, y: 7 },
    safeArrivalInside: { x: 3, y: 6 }
  },
  ownerHouseholdId: "household:0001",
  workers: [], style: "timber", constructionState: "complete",
  interiorTemplateId: "home-family-v1"
};
interior = {
  version: 1, id: "interior:briarford-home-0001",
  buildingId: "briarford-home-0001", safeZone: true,
  grid: { width: 8, height: 8, metersPerCell: 1 },
  tiles: "compact-tile-layer-or-template+diffs", furniture: [],
  roomUses: ["sleep", "eat", "socialize"], occupants: [],
  revision: 0
};
actor.location = {
  layer: "exterior", // or "interior"
  buildingId: null, interiorId: null, x: 25, y: 25
};
observer.camera = {
  layer: "exterior", interiorId: null, x: 24, y: 20,
  width: 24, height: 15, followActorId: "nim"
};
```

No reutilizar `actor.x/actor.y` en interiores sin una capa identificadora: dos pares idénticos de coordenadas pueden corresponder a espacios distintos. `observer.camera` es solo representación y NO mueve al actor.

En el primer hito usar `interior-template+small-diffs`, no guardar mapas de 1 GB ni imágenes RGBA en JSON; mantener 1 interior activo y persistencia compacta para los demás.

## IV. Máquina de estados de la puerta y recuperación

```text
OUTSIDE (actor safe approach cell)
  -> requesting_entry (validated door/building/intent)
  -> transition_pending (idempotency key; entrance remembered)
  -> INSIDE (safe spawn, one-time persisted switch)
  -> indoor_activity (sleep/eat/work/socialize; NPC decisions)
  -> requesting_exit (valid threshold and reachable exit)
  -> transition_pending (same transaction protocol)
  -> OUTSIDE (original approach cell or nearest bounded safe fallback)
```

**Requisitos atómicos:**
1. Solo el planificador del **personaje** puede solicitar cruce. El observador puede cambiar la cámara al interior para inspeccionar, sin trasladar al sim.
2. Antes de entrar validar `buildingId`, puerta, fase de construcción, `approachWorld`, destino y permiso del hogar/trabajo. La entrada jamás puede estar bajo agua o enemigo atrapando al personaje.
3. Reservar `transitionId` y `returnAnchor`; durante el cambio no ejecutar movimiento ni combate de ese actor; otros sims continúan con frecuencia acotada.
4. Escribir destino y ubicación del actor juntos; guardado/restauración interpreta `transition_pending` una sola vez; **nunca duplicar un sim, cama, inventario o recompensa**.
5. Si el interior no carga, la puerta está bloqueada o el save está corrupto: restaurar exterior junto al `returnAnchor` válido o a una celda segura determinada por búsqueda local de radio máximo 5; mostrar evento de error, nunca colocar dentro de paredes o en `(0,0)` arbitrario.
6. La capa interior es **segura frente a spawns hostiles normales**, no invulnerabilidad eterna ni puente para saltar caminos/peligro externos. Incendios/amenazas interiores solo en futuros sistemas validados.
7. Al salir, reaparecer por la puerta correcta sin cambiar `worldSeed`, reloj, loot, edad, región descubierta ni misión. La visibilidad del dios no activa acciones del residente.
8. Cambiar zoom y cámara durante el cruce no altera colisiones; el Canvas puede redibujar mientras la simulación queda ordenada.
9. La pausa permanece tras recarga. Al detenerse la app no transcurre simulación en segundo plano y no puede haber transición a medias sin mecanismo de recuperación.

## V. Planos, seguridad, hogares y roles

Al elegir dónde construir:
- Reservar **toda la huella exterior** y al menos una celda transitable de acceso frente a la puerta.
- Comprobar desniveles, agua, carretera, ruinas consumidas e intactas, santuarios, casas ajenas, espacio de evacuación y conexión con el centro.
- Colocar granjas en terreno fértil cercano, almacenes cerca del trabajo, herrerías fuera de viviendas densas, taberna y salón comunal junto a rutas, capillas en zonas autorizadas por la cultura.
- El sim/cabildo puede elegir estilo timber/stone/moss, orientación, plano alternativo o posponer la obra por falta de recursos. Es una **decisión documentada**, no un botón que construye instantáneamente.
- Mapa exterior y escenario interior comparten `buildingId`, población, hogar y stock real; ningún mueble aparece sin persistencia si tiene consecuencias de juego.
- Hogar: dueños/ocupantes, número de camas, reserva de alimentos y privacidad. El sueño mejora energía únicamente si ocupa una cama disponible; no curación de casa a distancia.
- Lugares de trabajo: herrería hace herramientas consumiendo materiales; taberna sirve alimentos y relaciones; granero almacena; capilla ritualiza; el salón alberga consejo. Las rutinas permanecen autónomas.

## VI. Capas visuales pixel-art

Orden exterior: suelo → calle → fundación/pared trasera → puertas/muebles exteriores → agentes → techo frontal/oclusiones → FX → HUD.

Interior: suelo (1m grid) → paredes → muebles/recursos interactivos → sims → iluminación ambiental discreta → FX → HUD del observador.

Escenas con 16×16 píxeles nativos, `imageSmoothingEnabled=false`, cámara proporcional, anclas enteras; nunca estirar arbitrariamente casas 2×2 para fingir que son 6×6. Puerta abierta/cerrada muestra visualmente su estado. Una casa debe distinguirse de granja, herrería, taberna, almacén, capilla y salón por estructura y distribución, no solo texto.

## VII. Compatibilidad, seguridad y memoria

- **Contrato actual:** `src/sim.js` / `src/living.js`, `src/ui.js`, `build.py` y host Android. Guardado `version:1` / `godseed-one-small-life-v1`.
- Campos futuros opcionales: `spaces.version=1`, `spaces.interiors`, `spaces.activeOccupants`, `spaces.transitions`. Serializar snapshots compactos; migrar ausencia a `layer:exterior` sin vaciar inventario, capítulos, aldeas ni memorias.
- **No confiar** en IDs, tamaños o posiciones de un JSON importado. Validar límites, cantidad de espacios/muebles, propietario, alias y recorrido de puerta; rechazar casos malignos.
- Objetivo: Android con **2–3 GB de RAM TOTAL**, app preferiblemente 128–192 MiB de memoria residente y techo provisional 256 MiB **no medidos en dispositivo físico**. Conservar cache pequeño de interiores, liberar buffers al salir, un solo mapa interior activo; no cargar todo el mundo simultáneamente.
- Objetivos en disco (1 GB de contenido útil + hasta 5 GB opcional) no son permisos para reservar RAM ni producir datos ficticios.
- Sin internet, anuncios, registro obligatorio ni IA remota; sistema de intención divina puede ampliarse offline solo si se comprueba en hardware.

## VIII. Pruebas mínimas de aceptación

| Prueba | Condición |
|---|---|
| Entrada | Nim decide entrar en una casa, puerta válida y celda de spawn transitable |
| Salida | Vuelve a la MISMA puerta exterior; identidad, día, inventario y vida intactos |
| Seguridad | No aparecen enemigos normales en dormitorios ni hay colisión con camas/paredes |
| Autonomía | El dios ve interior y da consejo, pero no teletransporta ni obliga al residente |
| Medidas | 4×4 tiles exteriores = 8×8 m = 64 m²; 8×8 interior = 64 m² brutos |
| Edificios | Cabaña/casa/herrería/taberna tienen planos, puertas y superficies verificables |
| Ocupación | 4 habitantes asignan hogar, cama y tarea y realizan rutina casa→trabajo→casa |
| Guardado | Durante cruce, dentro y tras salida: `serialize→restore` conserva la ubicación |
| Migración | Importar save anterior a interiores deja a todos afuera con sus progresos |
| Malformado | Puerta ID inválido, datos corruptos o salida bloqueada no crashean ni colocan en agua |
| Escala | Cambio de zoom no modifica medidas/collision ni eventos |
| Rendimiento | 100 entradas/salidas sin fuga obvia en browser; medir PSS/FPS en Android real aparte |
| Historia | Los capítulos I–III y edificios del PR #21 no pierden sus logros |

**Desbloqueo:** `INT-001` solo puede pasar a `verified` cuando el propietario/revisor acepta el contrato. `INT-002` y `INT-003` pasan de `planned` a `ready` tras esa verificación, no antes.

**No se considera entregado un interior solo porque el documento anterior exista.** Implementación real por tareas y pruebas es obligatoria.
