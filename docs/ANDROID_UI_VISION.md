# GODSEED — Visión visual para Android (v0.2 experimental)

> **Importante:** Las imágenes siguientes son **maquetas conceptuales**, no capturas de una APK instalada ni pruebas de rendimiento real. Ilustran la dirección visual que se propone para el juego. El código actual y sus capturas de navegador siguen siendo la referencia sobre las funciones realmente implementadas.

## Objetivo del juego

El jugador es una **deidad observadora**. Nim es un personaje independiente que camina, explora, busca alimento, evita peligros, lucha, aprende habilidades y desarrolla recuerdos siguiendo reglas deterministas. **El jugador no tiene joystick ni botones para ordenar a Nim atacar, caminar, o recoger materiales.** Puede inspeccionar el terreno, alterar circunstancias con poderes divinos, cambiar la velocidad y leer la crónica.

Este es un juego original en 2D de píxeles, no una recreación visual de WYLDHEART. Las mecánicas RPG generales del video son inspiración, no sus modelos, cámaras, personajes o interfaces.

## Maquetas de interfaz Android horizontal

### 1. Exploración autónoma

![Concepto de interfaz Android observando a Nim](../assets/concepts/godseed-android-observacion.svg)

[Ver imagen completa](../assets/concepts/godseed-android-observacion.svg)

La mayor parte de la pantalla es el mundo. Nim hace cosas por su cuenta; un texto breve indica su intención. A la derecha aparecen sus necesidades, conocimientos, pensamientos y la crónica. Abajo se usan poderes divinos o el modo de inspección.

### 2. Intervención del dios

![Concepto Android con el poder Brotar seleccionado](../assets/concepts/godseed-android-intervencion.svg)

[Ver imagen completa](../assets/concepts/godseed-android-intervencion.svg)

El jugador selecciona **Brotar** y toca una casilla del mundo. La zona afectada se destaca. Nim sigue siendo autónomo: el dios cambia su entorno, no controla su mente.

## Cinco decisiones visuales

1. **Un solo mapa cenital protagonista:** terreno dibujado en una cuadrícula de píxeles con zoom visual entero, minimapa y niebla de exploración. Evitar renderizado 3D y efectos costosos.
2. **Información de Nim sin microgestión:** salud, hambre, energía, nivel, intención, habilidades y entradas de historia; panel compacto que pueda replegarse para pantallas estrechas.
3. **Poderes del jugador diferenciados:** Observar, Curar, Comida, Brotar, Guiar y Rayo. Los botones seleccionan el poder; luego se elige el objetivo en el mapa. Sin joystick ni ataque manual.
4. **Tiempo y sucesos comprensibles:** pausa, paso individual y velocidades ya existentes, fecha y clima, notificaciones breves de logros, peligros, hallazgos y decisiones autónomas.
5. **Prioridad absoluta a móviles antiguos:** interfaz horizontal con zonas táctiles suficientemente grandes, sin grandes texturas, animaciones sencillas, uso restringido de memoria y funcionamiento sin red. Mantener las partidas pequeñas y exportables.

## Qué existe y qué aún sería trabajo nuevo

| Componente | Estado |
|---|---|
| Mundo 64 × 48, Nim, bosque/agua/ruinas/refugio, minimapa, estadísticas, crónica, poderes, controles del tiempo | Implementado; la presentación exacta difiere de estas maquetas |
| Cinco mejoras v0.2: orígenes, habilidades por uso, defensa autónoma, trampas, rumores | Implementadas en rama experimental `feat/autonomous-adventure-v0.2`, aún no integradas en `main` |
| Composición visual exacta de estas maquetas, panel derecho flexible y brillo de Brotar | **Concepto propuesto, no implementado** |
| Pueblos completos, NPC conversacionales, dungeons instanciados, magia autónoma avanzada | Pendiente / diseño futuro |
| APK ejecutada satisfactoriamente en teléfono Android y mediciones de FPS/batería | **Sin verificar** |

Las representaciones SVG son imágenes vectoriales ligeras de documentación; **no** se cargan durante el juego y no afectan a la APK.

## Próximo lote de cinco tareas, cuando se apruebe el diseño

1. Crear una rama de interfaz nueva desde v0.2 y reproducir la distribución propuesta con HTML/CSS existente (sin cambiar reglas de simulación).
2. Mostrar las decisiones y el propósito de Nim en una franja legible, reutilizando los valores del simulador.
3. Simplificar el selector de poderes y validar puntería táctil con letterboxing en 640 × 360, 720 × 400 y otras relaciones.
4. Medir redibujados y memoria; reutilizar fondos estáticos si ayuda en Android de gama baja.
5. Ejecutar pruebas de simulación, navegador y empaquetado. **Probar en teléfono Android real** antes de afirmar que el aspecto o rendimiento de la APK coincide con la maqueta.

## Conservación / recuperación

El avance visual se guarda en esta documentación y dos imágenes SVG en `assets/concepts/`. No modifica el Android APK existente, no altera guardados y no integra la PR automáticamente.

Relaciones del proyecto: `docs/ANDROID_UI_VISION.md → especifica → interfaz Android`; `assets/concepts/*.svg → ilustra → experiencia del dios`; `src/ui.js → implementa → interfaz actual`; `src/sim.js → determina → decisiones de Nim`; `tests/ → verifica → comportamiento existente`.
