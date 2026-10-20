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

**Pendiente:** certificar el arranque WebGL, guardado y rendimiento en un
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
