# GODSEED V3 — un habitante vivo (experimento aislado)

**Rama:** `feat/godseed-v3-one-living-npc-20261020` basada en V3 (2026-10-20).
**Alcance:** una sola habitante activa, Aria; no se crean poblaciones ni niveles de personaje.

- Simulación autoritativa: hambre (0–100), salud (0–100), energía (0–20), estado vivo, propósito y acciones causales.
- Supervivencia: Aria busca y recolecta bayas, mantiene la despensa, come, descansa, tala los árboles realmente disponibles, construye un refugio y reserva madera. Los arbustos generan recursos de forma determinista, con registro explícito del crecimiento, recolección y consumo; sin recursos mágicos.
- Cámara WebGL 3D y alternativa Canvas2D muestran los mismos arbustos según el snapshot. La UI muestra hambre, salud, alimento y crónica; el jugador observa, no controla a Aria.
- Schema V3 v3, con personalidad persistente (curiosidad y prudencia derivadas de semilla), ánimo, estrés, experiencia adquirida en recolección y tala, hasta 20 recuerdos y mapa de lugares visitados. El historial influye en elecciones de explorar vs. reservar comida o refugiarse; el descanso en casa reduce el estrés. Sin modelos externos, sin simulación fuera de pantalla, determinista y verificable.
- Migra también guardados V3 v2 de Aria con inventarios, mundo, hambre, salud, eventos y recursos intactos; añade solo el estado mental inicial derivado de lo ya sucedido.
- Schema V3 v1 y v2 compatibles; **mantiene la clave de almacenamiento V3** `godseed-v3-prototype-v1` y migra las partidas experimentales V3 v1 de dos habitantes únicamente si pasan la validación anterior. Aria conserva sus propios recursos, el aporte pasado de Bran permanece en `legacyHarvested`, su historial queda documentado, pero Bran ya no está vivo ni activo.
- La app V1 y sus partidas `godseed-one-small-life-v1` quedan totalmente aisladas. La carga de save inválido nunca lo borra silenciosamente.
- La simulación no depende del renderizador ni del reloj; cada tick avanza determinísticamente. Se conservan pausa, paso, velocidad y guardados offline.

## Comprobaciones requeridas

```sh
node --test tests/v3_sim.test.js
python build_v3.py
git diff --exit-code -- GODSEED-V3-Play.html
python tests/v3_browser_acceptance.py
```

Verificar en GitHub Actions antes de afirmar aprobación del commit exacto. Antes de distribuir, ejecutar APK nativo y pruebas en Android físico con GPU real, memoria baja y guardados V3 anteriores. La personalidad, los recuerdos acotados, las emociones calculadas y el aprendizaje instrumental están implementados. No son conciencia, libre albedrío ni inteligencia general. Aún faltan animación corporal, objetivos de largo plazo y vida social; el prototipo tiene un solo personaje.

## Vida diurna y nocturna de Aria — fase visual y funcional

Implementación aislada en rama `feat/godseed-v3-aria-diurnal-life-20261020`, basada en el commit cognitivo V3 `884a01272b6c899c70f9f9c01d7b50f3c9652e51`.

- El tiempo del mundo se deriva **exclusivamente** de `state.tick`: 160 ciclos por día. Amanecer 0–23, día 24–103, atardecer 104–119, noche 120–159. `Sim.dayInfo(tick)` informa sin guardar nuevos campos ni consultar la hora física.
- Durante la noche, después de construir un refugio y asegurar alimento y hambre tolerable, Aria decide regresar a casa y dormir. Recupera energía. **La alimentación tiene preferencia**: no se duerme si no hay alimento de reserva o si su hambre exige atención.
- La decisión tiene consecuencias observables: `goal="regresar a dormir"` durante el camino; `goal="dormir"` en casa; eventos `sleep` periódicos en el registro limitado. Se evita crear miles de eventos por cada ciclo de sueño.
- El mundo WebGL 3D ahora cambia su iluminación ambiental según la hora simulada. La representación de Aria tiene cabeza, torso, brazos, piernas, zancada alternante al moverse y postura horizontal al dormir. El respaldo Canvas2D conserva señales equivalentes. Son **poses procedurales por ciclo**, no animación interpolada a 60 FPS ni simulación meteorológica.
- HUD: Día y Momento, sin controles directos sobre la voluntad de Aria. Un solo habitante vivo y un único refugio siguen siendo límites intencionales.
- **Persistencia:** no cambia el esquema V3 actual (v3), el formato de datos persistidos ni la clave `godseed-v3-prototype-v1`. Se amplía la validación del historial para el nuevo tipo de evento `sleep`. Los guardados experimentales V3 v1, v2 y v3 anteriores mantienen su ruta de carga.
- **Pruebas:** `node --test tests/v3_sim.test.js` comprueba la transición temporal y que Aria duerme, conserva su supervivencia y toma decisiones reproducibles en varias semillas. `tests/v3_browser_acceptance.py` valida HUD y renderizadores, y la CI Android comprueba arranque offline en emulador si pasa para el commit concreto.
- **Límites:** nada de envejecimiento, temporadas climáticas, interacción con otros NPC ni una IA generativa de diálogo. El ritmo temporal y las poses son parámetros de prototipo, no características finales aprobadas.

Estado de aceptación: consultar GitHub Actions para el SHA exacto. No certificar dispositivo físico por superar el emulador.
