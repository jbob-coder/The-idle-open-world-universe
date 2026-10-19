# GODSEED — Matriz de aceptación / evidencia por bot

La aceptación se evalúa por tarea y por commit exacto; no existe una prueba global que demuestre, por sí sola, “juego terminado”. El registro `docs/agents/tasks.json` contiene el criterio obligatorio de cada ID. Esta matriz define cómo aportar las pruebas.

| Requisito | Tests nuevos que deben existir | Evidencia adicional | IDs principales |
|---|---|---|---|
| Registro y estados | `python tools/godseed_tasks.py validate`, `python -m unittest discover -s tests -p 'test_task_governance.py'` | Historial y links de commits, rechazo de conflictos | GOV-001 |
| Áreas de edificios en m² | Node: grid exterior 2×2 m, interior 1×1 m, huellas reales, accesos | Fotos de casa 3×3/4×4/herrería 5×5 | INT-001/002, CIV-001 |
| Entrada/salida segura | Node: máquina de estados, 100 entradas/salidas, fallos de carga, puerta incorrecta, celda bloqueada | Captura de Chromium exterior/interior y estado | INT-003/004/005/010 |
| Dormir, comer y trabajar en interior | Simular 4 habitantes distintos y al menos un ciclo día/noche con decisiones propias | Registro con nombre, motivo, resultado | INT-006/007/008, SIM-001/005 |
| Persistencia de interiores | Importar saves v1 antiguos y guardar durante cruce/scene switch | Archivo de save anon. de prueba, test de idempotencia | INT-003/004/010 |
| Geometría real de mundo | Pathfinding + camera entre 4 chunks, sin menú de teleport y con bordes negativos | GIF/video o capturas desde varias coordenadas | WLD-001/003/004/010 |
| Persistencia tras alejarse | Modificar bosque/aldea en chunk A, viajar fuera cache, volver y recargar | Save con diffs/snapshot y tests reproducibles | WLD-002/005/007 |
| Sin fuga de memoria por sectores | 1,000+ casillas de viaje, número de chunks residentes acotado | Reporte de heap y datos, **no inferir PSS real** | WLD-008/010 |
| Sims con elecciones | Estados de necesidades, meta y alternativa elegida, repetibilidad por semilla, rechazo de consejo inseguro | Cronología de sucesos, sin acciones inventadas | SIM-001/002/007, GOD-002 |
| Familias y ciclos vitales | Enlaces persistentes, generaciones acotadas y efectos reales de herencia | Múltiples generaciones simuladas con snapshots | SIM-004/008/010 |
| Economía y ciudad | Stocks conservados, recursos reales consumidos, obra por etapas, estilos de construcción elegidos | Antes/después de ciudad, trabajos nombrados y activos | CIV-001..008 |
| Eras medievales | Precondiciones reales de tecnologías, ocupación y recursos; no solo un timer | Cambio visual/funcional desbloqueado por investigación | CIV-005 |
| Lenguaje divino | Frases ES/EN, negación, ambigüedad y texto no reconocido sin efectos | Interfaz muestra oído/decidido/actuado/rechazado | GOD-001/002/003 |
| Visual 2D pixel | Capturas Chromium a 32×20/24×15/16×10, 640×360, 720×400, 960×540 | Render sin suavizado, lectura de puerta, NPC y mobiliario | ART-001..005 |
| Android offline | APK Gradle instalado en emulador, 6+ pruebas nativas, save/pause/exit | SHA del APK, CI run, screenshot/logcat | QA-001/002/003 |
| 2/3GB físicos | **20 minutos REALES** en cada modelo, PSS/RSS con procesos WebView, FPS, calor, suspensión, guardado | Modelo, build Android, WebView, comandos ADB, capturas/video | QA-004 |
| Firma y actualización segura | Firma reproducible, upgrade desde versión previa, export/restore sin pérdida | Certificados/identidades sin publicar llave privada | REL-001/003 |
| Contenido offline útil | Comprobar contenido instalable, límites en disco, no empaquetado vacío artificial | Reporte de tamaños y tiempos; heap desligado de 5GB opcionales | REL-002 |

## Resultados permitidos

- **PASS:** test realmente ejecutado contra el SHA actual, salida 0, screenshot/datos donde corresponda.
- **FAIL:** error reproducible; obliga a `in_progress` o `blocked`, nunca se oculta.
- **BLOCKED:** herramientas, firmware, hardware, credenciales o propiedad ausentes; registrar la causa.
- **NOT TESTED:** no intentar transformarlo en PASS porque otra suite aprobó.
- **HARDWARE NOT VERIFIED:** por definición no se puede pasar QA-004 en GitHub Actions o en emulador.

## Contrato estándar de documentación de evidencia

Guardar un bloque en el PR:

```text
TASK: INT-004
BOT OWNER: ARCH-01
SOURCE HEAD: <SHA exacto>
TEST: node --test tests/doors.test.js — 14/14 PASS
TEST: python tests/interior_browser_acceptance.py — PASS
TEST: Android emulator instrumentation — PASS / NOT RUN / BLOCKED
SNAPSHOT: <artifact URL>
SAVE SCHEMA: version 1; migration tested old/new
MEDIEVAL PIXEL METRICS: exterior 2m tiles; interior 1m cells
LOW-END DEVICE 2GB/3GB PSS: NOT VERIFIED, issue #13
BUGS/REGRESSIONS: ...
PR: ...
STATUS TRANSITION COMMIT: ...
```

## Prohibiciones de verificación

No citar un APK de una rama antigua como evidencia del HEAD nuevo. No declararse verificador de su propio trabajo sin una segunda comprobación. No publicar como `done` un documento de diseño cuando todavía falta implementar la mecánica. No declarar la IA conversacional funcional si solo clasifica palabras por regex. No llamar *open world* a un mapa único de 64×48. No alegar 30 FPS, 2 GB de consumo o estabilidad térmica sin medidas físicas.

Toda ampliación de tareas necesita nuevo ID, dependencias, aceptación, historial y cambio generado en `TASK_BOARD.md`. Revisar/rebasar la rama de coordinación ante conflictos; no sobrescribirla.
