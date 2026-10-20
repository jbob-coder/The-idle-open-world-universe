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
