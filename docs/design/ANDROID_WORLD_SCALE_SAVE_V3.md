# GODSEED V3 — Escala de población, rendimiento Android y persistencia
**Estado:** diseño propuesto. Referencias actuales: `docs/PERFORMANCE_BUDGET.md`, `docs/LOW_RAM_HARDWARE_TARGET.md`, `build.py`, `src/living.js`, `src/sim.js`, `docs/agents/tasks.json`. Objetivo: **teléfonos con 2–3 GB de RAM total**; no se puede asumir que una app disponga libremente de 2–3 GB.

## Por qué la inteligencia no debe consumir todo el dispositivo
No crear un LLM por personaje; tampoco un `setInterval`, objeto DOM, textura Canvas o pathfinder global para cada aldeano. Inteligencia sim es **reglas, objetivos, memoria escasa, conocimiento situado, una pequeña política de decisión y eventos causales**. Se actualiza por eventos y cadencias, no en cada frame. Un habitante tiene vida persistente aunque no se renderice.

### Niveles de detalle de simulación (separados de render)
| LOD | Quién | Tick esperado (propuesta) | Comportamiento conservado |
|---|---|---|---|
| L0 activo | Sims en cámara/interior o involucrados en evento inmediato | cada tick sim, animación RAF limitada | movimiento físico, colisiones, necesidades/diálogo, objetivo, decisión observable |
| L1 local | barrio/colonia cercana fuera de cámara | por lotes cada ~10–30 ticks | profesión, vivienda, inventario, relaciones/eventos relevantes; cálculo de caminos solo si cambia destino |
| L2 remoto | pueblo/reino a varias regiones | por lotes ~1–4 horas de mundo con cronología | producciones agregadas, natalidad, mortalidad, escasez, política, migraciones; no simular 120 personajes caminando celda a celda |
| L3 histórico | personajes fallecidos o hechos archivados | sin tick | eventos, genealogía y legado consultables, resúmenes compactos |

Frecuencias propuestas para prototipado, **no rendimiento medido**. Para reconciliar L2→L1/L0, transformar balances agregados en entidades coherentes SIN recursos creados de la nada, duplicar comerciantes, saltar enfermedades o teletransportar ejércitos. Las decisiones con impacto global deben tener un orden determinista por evento/ID de entidad/tiempo.

## Arquitectura de estado
- Mundo: `worldSeed`, `worldClock`, estado de chunks cargados, *sparse deltas* por modificaciones permanentes (árbol talado, edificio, carretera, tumba, parcela).
- Personas: entidades de IDs estables, estado ligero/traits/needs/skills, hogar/town/reino, `currentGoal`, `nextDecisionTick`, memoria compacta de *referencias*.
- Familias: pares padres/cuidadores/hijos, un registro canónico por persona, parentesco derivable y relaciones actualizadas con eventos; nunca duplicar árboles extensos en cada miembro.
- Reinos/colonias: índice de membresía con lugar actual + asentamiento/hogar/nacionalidad distintos, economía y diplomacia; eventos historizados.
- Eventos: `{eventId,tick,regionId,actorIds,type,payloadVersion,causes[]}` agregados por lotes; 1 evento no puede ejecutarse otra vez al restaurar.
- Render: atlas compartido de píxeles, sprites por estado/layer, *Canvas caches* por sector visible, sin assets duplicados por personaje.

## Presupuestos explícitos
La documentación existente propone un ideal de memoria residente **128–192 MiB** y techo provisional **~256 MiB** para el proceso del juego/WebView; son *targets*, no un resultado de medición. El total de 2–3 GB corresponde al teléfono entero. El contenido útil de 1 GB core y opcional hasta 5 GB se refiere a **disco**, no RAM y no justifica archivos ficticios.

Propuesta de plan de ensayo (ajustar tras medir):
- 60 FPS *objetivo visual*, con fallback 30 FPS en gama baja. IA sim desacoplada del RAF; no prometer 60 FPS medidos.
- Aceptación en teléfono real 2 GB y 3 GB: ≥20 min, varios reinos, 3+ colonias, 200–500 habitantes agregados + 20–40 activos en una escena de estrés, sin cierre/ANR por memoria, partida reanudable.
- Medir PSS/RSS WebView y host, GPU textura, *heap* JS, 95th-percentile frame time, ticks/segundo, picos de guardado y latencia de entrada/retorno a interiores. Envolver cada test en semilla y SHA, mostrar diferencias del baseline.
- Poner límites duros en historia/UI: secciones paginadas; 25 decisiones personales recientes, años anteriores en bloques comprimidos; catálogo de sprites de paleta y textura común.
- Cálculo de rutas: cache por objetivo/topología y búsqueda jerárquica a chunk/sector antes de búsqueda local; evitar A* mundial para cada sim/tick.

## Persistencia, migraciones y seguridad
**Compatibilidad obligatoria:** saves de `version:1` bajo `godseed-one-small-life-v1`. No reescribir silenciosamente `version:1` para que aparente que soporta entidades nuevas. Un adaptador v2/v3 debe ser opcional, reversible a copia de seguridad cuando sea posible y nunca borrar la partida antigua sin exportarla.

1. Registrar `save.schemaVersion` y `migrationVersion` sin suplantar la firma antigua; migración idempotente de 1×1/2×2 edificios a plantilla nueva sin crecer sobre caminos.
2. `worldSeed` y coordenadas antiguas conservan región legado (0,0), capítulos I–III, Faith, inventarios, relaciones, NPC y progresión; entidades nuevas solo se crean si realmente no existen.
3. Migrar IDs nuevos como namespaces; `person:` / `settlement:` / `realm:` / `building:`. No usar índices de array para vínculos durables. Validar referencias al restaurar.
4. Guardar de modo transaccional: escribir temporal, comprobar integridad/CRC o hash, confirmar, conservar backup; no sobrescribir último slot válido tras error.
5. En transición de puerta/interior, el actor tiene un `spaceId` activo y único; entrar/salir una vez por tick, y el retorno no crea copias.
6. Para chunks/sociedades remotas, tener snapshots y deltas verificables con numeración de revisión. Restaurar hasta frontera del evento sin ejecutarlo de nuevo.
7. Semillas y RNG separados por subsistema/actor/evento para no cambiar genealogía de otra región al dibujar la cámara.
8. Datos corruptos: rechazar/tolerar conservadoramente y explicar; no inventar reinado, familiar o historia a partir de basura. Backups recuperables offline.

## Riesgos y pruebas de calidad
**Riesgos:** crecimiento exponencial de NPC, tablas de relaciones O(N²), historial infinito, loops de pathfinding, condiciones de carrera entre simulaciones remotas y la UI, duplicado de mercancía, migración destructiva, serialización > límite actual (~1 MB).

**Pruebas requeridas:**
- Núcleo de decisión: 16 seeds deterministas × 20k ticks, 0 IDs duplicados, límites de memoria/tiempo y sin bloqueos por hambre irrecuperable.
- Historia 3 generaciones: genealogía sin ciclos, reclamaciones de sucesión auditables, familias y reinos migran al cerrar/abrir partida.
- Varios chunk edge: viaje de colonia a otro reino, salida/regreso con carreteras, casa, agricultura y muertos/patrimonio sin desapariciones.
- Android offline API29 y dispositivo físico cuando esté disponible, sin llamadas de red; pausa/reanudación, mover la app a segundo plano mientras entra por una puerta, guardar de 20+ años simulado.
- Archivo histórico con cientos de eventos: tamaño acotado y consultas rápidas; conservar evidencia de decisiones importantes y procedencia.
- No reportar “probado 2 GB real” ni “APK release” sin dispositivos/firmas verificables.

**Ownership:** SIM-013 población LOD, WLD-008 cache, QA-004 físico, INT-010 transiciones, REL-001 firma/upgrade, SIM-010 ensayo de vidas. Sus dueños/estados se verifican en `tasks.json` antes de reclamar.
