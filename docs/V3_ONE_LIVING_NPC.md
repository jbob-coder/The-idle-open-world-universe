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
