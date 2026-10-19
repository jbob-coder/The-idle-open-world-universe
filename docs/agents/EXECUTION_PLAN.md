# GODSEED — Plan de ejecución integrado y dependencias

**Horizonte de producto:** simulador medieval visual de vida, poblaciones y civilizaciones con mundo espacialmente continuo. **No es solo un RPG de combates y capítulos.**  
**Regla:** este archivo explica orden y por qué; el estado verdadero siempre está en `tasks.json` y `TASK_BOARD.md`.

## Base y restricciones de trabajo

La base más robusta es PR #21, apilada sobre #17 (ocho personas visibles, economía/profesiones básicas, aldeas 2×2 y lenguaje guiado por reglas). Se conserva sin alterar `main`, su ciclo narrativo I–III, Android offline, guardado `version:1` y el presupuesto de hardware. No fusionar PR #20 en paralelo como motor incompatible.

**Entrega global:** no declarada completa. Lo existente es una demostración jugable pequeña. Interiores, mundo chunked y vidas generacionales todavía requieren implementación.

## Etapa 0 — Gobierno y contratos (primero)

- `GOV-001` registro fuente, máquina de estados, CI, bot prompt y handoff.
- `INT-001` contrato de superficies reales en m², puertas y capas seguras: [SAFE_INTERIOR_ARCHITECTURE.md](SAFE_INTERIOR_ARCHITECTURE.md).
- Trabajo paralelo *seguro si se reclama por separado*: `WLD-001` núcleo chunk, `SIM-001` necesidades, `GOD-001` lenguaje, `GOD-004` observatorio, `QA-001` infraestructura de pruebas. Ninguna requiere editar el mismo archivo sin coordinación previa.
- Bloqueo permanente hasta evidencia: `QA-004`, pruebas físicas de 2–3 GB (issue #13).

## Etapa 1 — Primera casa medieval habitable

**Dependencia:** `INT-001` verificada por revisor.  
**Orden estricto:** `INT-002` dimensiones visibles 3×3–6×6 + `INT-003` datos seguros en save → `INT-004` entrada/salida atómica → `INT-005` escena/collisions/arte → `INT-010` regresión.

**Vertical slice mínimo y reproducible:** una casa familiar 4×4 tiles exteriores (=8×8 m), interior 8×8 celdas (=64 m²), puerta sur de 2 m, cama y mesa persistentes; Nim *decide* entrar para descansar y sale sin que se pierdan inventario, ruta y tiempo. El dios puede observar interior, no hacer que Nim cruce con un botón.

No marcar la etapa como terminada si lo único añadido es una puerta dibujada o modal “estás dentro”.

## Etapa 2 — Hogares, hábitos y simulación de persona

- `SIM-001 → SIM-002`: supervivencia y utilidad de metas por personalidad con motivos visibles.
- `INT-003 + SIM-001 → SIM-003`: hogar, miembros y llaves/ocupación.
- `INT-003 + SIM-001 → INT-006`: camas y acceso; `INT-004 + INT-006 → INT-007` rutina dormir/comer/visitar y seguridad real.
- `GOD-001 + SIM-001 → GOD-002`; `GOD-002 + SIM-002 → GOD-003`: intención interpretada, aceptación o rechazo personal, replanificación y resultado.
- `SIM-002 → SIM-007`: biografía visual, causas y consecuencias; `SIM-003 → SIM-004` vínculos/familias; `SIM-004 + SIM-007 → SIM-008` generaciones.

**Demo de aceptación:** cuatro sims autónomos despiertan, desayunan, van a lugares de trabajo, construyen amistades, obedecen o rechazan una sugerencia razonada y vuelven a su casa sin comandos del jugador. La historia no es una lista de golpes + XP.

## Etapa 3 — Mundo abierto auténtico (puede comenzar en paralelo)

- `WLD-001` coordenadas/chunks 32×32.
- `WLD-002` diferencias persistentes y snapshots.
- `WLD-003` cámara/fog/sprites entre sectores.
- `WLD-004` desplazamiento autónomo entre bordes.
- `WLD-007` importación de mapa base 64×48 con semántica anterior.
- `WLD-008` límites de cache y simulación offscreen.
- `WLD-010` prueba real de recorrer 4+ chunks y volver a un pueblo construido sin pérdida.

**Aceptación:** caminata autónoma de Nim de ≥128 casillas consecutivas sin pantallas de carga que simulen un mundo; guardar/reabrir la partida en otro sector; volver a un lugar modificado y encontrar el mismo edificio y sus trabajadores. Ningún motor debe alocar todas las casillas de un mundo sin límites.

**Advertencia:** si `WLD-001` afecta `src/sim.js` o `src/ui.js` al mismo tiempo que `INT-004`, negociar primero adaptadores y límites API, o bloquear una de las tareas. No fusionar ambas a ciegas.

## Etapa 4 — Sociedad medieval y expansión de eras

- `CIV-001` catálogo de planos y zonificación con puertas/medidas coherentes.
- `SIM-005` trabajos/productividad reales → `CIV-002` sitios de obra, costo y personas que transportan.
- `CIV-003` caminos/distritos conectados a puertas; `CIV-004` mercados/cadenas de suministros.
- `SIM-006 + CIV-002 → CIV-005` eras ganadas por conocimiento y producción, no “sube al nivel 2 porque dio 3 golpes”.
- `CIV-006` alcalde/consejo, cambios de plano por personalidad; `CIV-007` reparaciones/refugio; `INT-008 + CIV-001 → CIV-008` taberna, herrería, capilla, almacén y salón con interiores útiles.

**Demo:** fundación → aldea agrícola → villa artesana → centro de comercio, con cambios en calles, edificios, personas y economía; actores pueden preferir reformar la casa en lugar de construir otra.

## Etapa 5 — Visión de dios, arte y conducta emergente

- `GOD-004` observación por habitante/casa con motivos/historia sin control directo.
- `INT-009` inspector interior y cambio de escena de la cámara del dios.
- `ART-002` puertas/techos interiores en píxel 16×16; `ART-001` animaciones de edad/oficio y gestos; `ART-003` usabilidad Android; `ART-005` capturas de regresión.
- `GOD-005` modelo local opcional solo después de `QA-004` y medición física, y nunca requisito para jugar.

## Etapa 6 — QA, certificación de hardware y lanzamiento

- `QA-001/002/003` Node, Chromium offline y Android nativo API29.
- `QA-004` [issue #13](https://github.com/jbob-coder/The-idle-open-world-universe/issues/13): **BLOCKED** hasta teléfono físico de 2 GB Y 3 GB, 20 minutos, PSS/RSS WebView, frame timing, energía, calor, pausa/salida, export/import y escenarios indoor/outdoor. Emulador no lo reemplaza.
- `REL-001` keystore permanente protegido, firma/upgrade y backups.
- `REL-002` empaquetado real de contenido útil y packs de disco, sin relleno artificial hasta 1 GB.
- `REL-003` candidato beta con PR integrados, release notes, APK ligado a SHA, evidencias y revisión del propietario.

## Reparto recomendado (un escritor por contrato sensible)

| Bot | Campo preferido | Archivos principales | No tocar sin coordinación |
|---|---|---|---|
| ARCH | `INT-001/002/003/004` | `src/world/interiors.js`, contratos, saves | `src/sim.js` compartido |
| SOCIETY | `SIM-001/002/003/005` | `src/living.js`, modelos persona | Migraciones de interiores |
| TERRAIN | `WLD-001/002/003` | `src/world/chunks.js`, cámara | Esquema del mundo y saves |
| CIVIC | `CIV-001/002/005` | planos, stock, trabajos, eras | Reserva de parcelas/puertas |
| DIVINE | `GOD-001/002/003/004` | parser, estado y UI divina | Interacciones y permisos |
| ART | `ART-001/002/003` | atlases, dibujado, CSS | Física de colisiones |
| QA | `QA-001/002/003/004` | tests y scripts de aceptación | Estados que aún no pasaron |
| INTEGRATOR | conflictos y merges aprobados | branches/CI/registry | No declarar `done` sin merge |

**No reservar tareas para bots no conectados**: la tabla recomienda funciones, NO equivale a asignación. Cada bot debe reclamar una tarea `ready` y crear su historial en registro antes de modificar código.
