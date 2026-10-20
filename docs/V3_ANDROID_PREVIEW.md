# GODSEED V3 — único empaquetado Android vigente

El APK experimental de V3 se genera con Gradle a partir de android/v3.
No reemplaza la aplicación 2D y utiliza el paquete separado
io.godseed.v3preview.

- Fuente 3D offline: GODSEED-V3-Play.html, copiada como assets/index.html
- Proyecto nativo: android/v3/app/build.gradle
- Actividad: android/v3/app/src/main/java/io/godseed/v3preview/MainActivity.java
- Compilación: gradle -p android/v3 :app:assembleDebug --no-daemon
- APK generado: android/v3/app/build/outputs/apk/debug/app-debug.apk
- CI: .github/workflows/v3-android-preview.yml
- Validación del emulador: tests/native/v3_emulator_acceptance.sh
- Validación binaria independiente: tests/v3_apk_static_acceptance.py

El empaquetador alternativo SDK-free añadido de forma concurrente se ha
retirado para no crear dos APK con el mismo ID y diferentes firmas. Se ha
conservado su historial Git y restaurado el empaquetador anterior de V1.

**Pendiente:** certificar en dispositivo Android físico el arranque WebGL, guardado y rendimiento en un
dispositivo Android físico de memoria baja. Una prueba en emulador no
demuestra compatibilidad en todos los teléfonos. La firma debug automática
no garantiza actualizaciones in-place entre ejecuciones de CI; una clave
estable bajo custodia del propietario y pruebas de upgrade serán necesarias
antes de distribuir una versión permanente.

## Resultado real del emulador Android — 2026-10-20

[Acciones #39503775961](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39503775961) en el commit `ffd00057379078a3130ddc5b45912c254a043c02` terminó **FAILURE**.

- **PASS:** compilación Gradle, contenido exacto del HTML offline, identidad V3 separada, cero permisos, firma APK v2, instalación y apertura de Activity en API29.
- **FAIL:** Android WebView reportó `WEBGL_CONTEXT=false` en logcat `GODSEED_V3` después de abrir la página. La prueba exigía `true`, guardó screenshot y logcat, y rechazó correctamente la aceptación nativa.
- **UNKNOWN:** si el problema proviene del GPU por software del emulador, del WebView específico, de inicialización de shaders/contexto o de otra limitación. No se puede afirmar todavía cuál.
- **NOT_RUN:** GPU WebGL en Android físico, estabilidad de guardado en recreación de Activity, perfiles de RAM 2/3GB, y actualizaciones firmadas de V3.

[Artefacto APK de ese SHA](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39503775961/artifacts/12302077809) y [captura/log del fallo](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39503775961/artifacts/12302718077). El APK no es una versión 3D nativa validada. El siguiente trabajo es diagnosticar GPU/WebView y ofrecer un fallback sin vulnerar CSP ni habilitar flags inseguros en producción. [Evidencia y seguimiento: issue #50](https://github.com/jbob-coder/The-idle-open-world-universe/issues/50).


## Continuidad visual sin WebGL — prototipo del 20-10-2026

En la rama V3 se añadió `src/v3/fallback.js`, un renderizador de **proyección 2.5D por Canvas2D**. No es WebGL, no demuestra 3D nativo y no modifica la simulación autoritativa: usa las mismas instantáneas inmutables de árboles, habitantes y refugios. La selección de renderizador sigue siendo automática (WebGL primero; Canvas2D si falla). `?renderer=2d` permite comprobar el modo alternativo en el HTML offline. `GodseedV3Debug.rendererMode()` expone `webgl-3d`, `canvas-2d-fallback` o `unavailable` para diagnóstico. Se conserva la identidad Android y la clave de guardado separada de V1.

**Evidencia real:** [GitHub Actions V3 WebGL + Canvas2D #39508147385](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39508147385) en SHA `62172b4e5d3c8739061e64c94b8c21f3a9e33708` terminó **SUCCESS**: seis pruebas Node, empaquetado HTML reproducible, Chromium WebGL en 960×540 y 640×360, Canvas2D 640×360 con píxeles no uniformes, refugio autónomo y guardado/carga. El artefacto conserva tres capturas y el HTML. La prueba Android API29 y el estado del GPU deben consultarse por separado; no afirmar que una captura Chromium certifica Android físico ni WebGL nativo.

**Criterio Android:** `tests/native/v3_emulator_acceptance.sh` diferencia `PASS` por WebGL de `PASS DEGRADED` por Canvas2D. Los dos requieren arranque de Activity y conservación de estado a través de reinicio; un modo degradado nunca se reportará como GPU 3D. Las pruebas físicas de 2–3 GB RAM, rendimiento sostenido y firma estable siguen sin certificación.


## Resultado posterior: emulador API29 aprobado (20-10-2026)

La evidencia previa de fallo en `#39503775961` permanece como antecedente y no debe confundirse con el estado nuevo. Después de incorporar el respaldo visual de Canvas2D, registrar el modo real de renderizado y conservar la prueba de Activity lifecycle, la ejecución [#39508121551](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39508121551) en SHA **`c623d8b7f8008e3d83f655cfb040ca8a3e4e489b`** terminó con tres jobs **SUCCESS**: `build-v3-debug`, `v3-apk-static-independent` y `v3-emulator-webgl-launch`. El log nativo dice expresamente **`PASS: native V3 APK installed with real WebGL GPU context`** y **`PASS: Android lifecycle preserved seed,tick,harvest,spent,wood,shelters`**. No se usó la aceptación degradada en esta ejecución.

- [APK de depuración generado por ese SHA](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39508121551/artifacts/12303958450)
- [Evidencia del emulador (captura y logcat)](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39508121551/artifacts/12303244437)
- La prueba Chromium de WebGL y del respaldo 2.5D también aprobó en [#39508147385](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39508147385), SHA `62172b4e5d3c8739061e64c94b8c21f3a9e33708`, después de la sincronización del HTML.

**No verificado:** dispositivos Android físicos de 2 y 3 GB de RAM, estrés de 20 minutos, temperatura, energía, almacenamiento entre versiones firmadas y experiencia gráfica de producción. Un APK debug firmado por CI puede usar una clave no estable, por lo que no debe prometerse actualización sin reinstalar. La implementación permanece aislada de `main` y de V1.
