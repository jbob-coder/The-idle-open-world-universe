# GODSEED v0.4 — Registro histórico: cámara cenital y personaje 2D ampliado

**REFERENCIA HISTÓRICA (2026-10-20):** Esta cámara Canvas 2D era una etapa antigua; la dirección final aprobada es **3D Pixel Squares**. Consultar [autoridad y correcciones del proyecto](PROJECT_AUTHORITY_AND_REFERENCE_STATUS.md); conservar compatibilidad y pruebas existentes.

**Estado: primera etapa implementada en la rama experimental `feat/skyview-zoom-v0.4`.** Esta entrega no cambia cómo decide Nim; cambia el punto de observación del jugador/dios. La dirección artística continúa siendo fantasía medieval en píxeles, no una cámara 3D ni la estética de otro juego.

## Cinco tareas ejecutadas

1. **Cámara top-down directa.** Ninguna perspectiva inclinada, falso 3D ni seguimiento cinematográfico. El enfoque sigue al personaje con coordenadas enteras para evitar píxeles borrosos o vibraciones subpíxel.
2. **Zoom inicial real.** La zona visible pasó de 36×22 a **24×15 casillas**; la textura del suelo y el personaje ocupan un área mayor del panel. El modo ampliado es el valor predeterminado al abrir el juego, sin reescribir partidas.
3. **Tres niveles de zoom.** `Cerca (24×15)` → `Muy cerca (16×10)` → `Panorama (32×20)`. El botón `Zoom` también aparece en el dock táctil horizontal. En escritorio se puede usar la tecla **Z**. El mapa no cambia de resolución mundial: siempre son 64×48 casillas.
4. **Siluetas 2D legibles.** Nim recibe cabello, capa, cara, morral y animación mínima de dos pasos; los habitantes conservan profesiones reconocibles mediante escudo, runa o bolsa de boticaria. Todos se dibujan por CPU con rectángulos del Canvas 2D existente; no se descargan texturas.
5. **UI Android y coordenadas correctas.** La cámara y los bordes del minimapa usan el tamaño visible actual, los toques se traducen con el tamaño real del lienzo incluso si hay barras laterales, y se amplió de 9 a **10 controles** la barra horizontal del dios.

## Rendimiento y compatibilidad

- Solo se redibuja la capa de terreno cuando cambia el encuadre, se descubre el terreno o cambian sus casillas. El zoom redimensiona e invalida esa caché de forma controlada.
- En modo predeterminado se representan **360 casillas** (24×15), frente a las **792** anteriores (36×22). En Panorama se ven 640 casillas y Muy cerca 160. El mundo físico sigue siendo 64×48.
- Ningún recurso gráfico nuevo pesa en memoria: los sprites son código de primitivas 2D.
- No cambia `src/sim.js`, el planificador autónomo de Nim, las acciones del dios, `localStorage` ni el esquema de partidas `version:1`.
- No se simula el mundo en segundo plano con la app cerrada.

## Pruebas

Se probaron los tres zooms, un dock de diez botones y pantallas horizontales 640×360, 720×400 y 960×540 en Chromium con el archivo HTML ejecutable. Se adaptaron `tests/mobile_acceptance.py` y `tests/capture_android_layouts.py` al nuevo encuadre y se verificó el toque sobre viajeros inspirables. El flujo de CI compila un nuevo **APK v0.4 de depuración** y comprueba su empaquetado, guardados y firma de prueba. No hay instalación de esta APK comprobada en teléfono físico.

**Capturas en GitHub Actions:** ver las evidencias de `GODSEED sky view Android landscape captures` en el historial de workflows de esta rama. Esas capturas son del navegador de escritorio en tamaños Android; **no son capturas de un emulador ni de hardware real**.

## Próximos cinco trabajos (pendientes)

1. Ampliar aldeas y caminos a esta escala, sin aumentar el coste de cada casilla.
2. Refinar animaciones de caminar y la orientación del personaje según decisiones autónomas.
3. Diferenciar iconos visuales de áreas divinas y reacciones de NPC, sin órdenes directas.
4. Mejorar el acceso a crónica, inventario y lista de NPC con el teléfono horizontal de poca altura.
5. Instalar un APK con firma coherente en Android antiguo y medir FPS, memoria, respuesta táctil y guardados.

## Relación de archivos

`src/ui.js` → cámara y render 2D · `index.template.html` → zoom y HUD · `tests/capture_android_layouts.py` → screenshots e intervención divina · `tests/mobile_acceptance.py` → controles y guardados · `android/build_apk.py` → APK experimental con `versionCode=4` · `PROJECT_STATE.md` → estado de trabajo.

**Advertencia de distribución:** el APK es un prototipo. La firma de CI es temporal, por lo que no se garantiza que instale encima de otra versión. Exportar la partida antes de desinstalar. La versión estable de Android requiere clave protegida y validación de hardware.
