# GODSEED V3 — Dos comunidades y logística autónoma (fase 3)

Fecha: 2026-10-20. Alcance: una **aldea matriz** y un **puesto avanzado** en el mismo mapa 3D de 20×20, en la rama aislada de PR #57. No equivale a dos reinos ni a un motor multichunk.

## Cadena causal verificable
1. Aria crea la primera aldea, llegan Bran y Elen y el consejo elige un líder.
2. Tras estabilizar la primera comunidad, el líder aprueba un puesto avanzado en una segunda zona *concretamente localizada*: colina oriental (15,13). Deben existir un líder, los tres edificios fundacionales, inventario y un trabajador nombrado.
3. Se separan **cuatro unidades reales de madera y dos raciones**, deduciéndolas de la despensa matriz; quedan asociadas a una expedición en tránsito. Se registra una decisión explicable, no aparece un edificio gratuito.
4. Un colono nombrado recorre el mapa hasta su solar, despeja árboles de la huella del edificio conservando el balance global y construye físicamente una cabaña; cambia de comunidad de residencia.
5. El puesto tiene reservas alimentarias propias. Las transferencias posteriores requieren un mensajero real de la aldea original que lleve recursos por el mapa. Los bienes transferidos nunca se duplican.
6. Las dos comunidades y sus respectivos habitantes y eventos son visibles en WebGL y Canvas2D. El consejo principal sigue siendo el único cuerpo electoral en esta versión; el puesto avanzado tiene un fundador asignado, **no una elección ficticia**.

## Estado y compatibilidad
- El guardado de la simulación social pasa a esquema 3, conservando la clave aislada `godseed-v3-society-v1`. Migración validada desde esquemas sociales 1 y 2; las partidas solo-V3 y V1 quedan intactas.
- Historial de aldeas limitado a dos registros, población máxima tres. Los recursos finitos continúan sujetos a ecuaciones de conservación, ahora sumando las reservas de expedición, puesto y mensajero en ruta. No se fabrican ciudadanos ni madera.
- No modificar `main` ni fusionar con la otra rama V3 sin una revisión independiente de propiedad/PRs.

## Evidencia de aceptación
- 100 semillas: los habitantes fundan los tres edificios iniciales, eligen líder y —después— fundan el puesto con un colono que se desplaza físicamente. Sin órdenes del jugador.
- La ubicación de la cabaña no puede solapar árboles persistentes; la madera recolectada durante limpieza pertenece al libro global.
- La suma de madera/comida por cuentas cumple exactamente la contabilidad derivada de cosecha, consumo y construcción. Validar además la historia de aprobación/traslado del puesto.
- Suministro: entrega real del mensajero en la segunda comunidad; la despensa matriz pierde exactamente lo que recibe la expedición, sin teleportación contable ni envíos dobles.
- Guardado/migración: esquema 2 real restaurado idéntico antes del primer avance; esquema 1 real también. Schema 3 mantiene itinerarios/almacenes.
- Determinismo a 20.000 ciclos y tamaños de guardado limitados. Capturas del mapa con las dos cabañas y controles en navegador.
- Ejecución: `node --test tests/v3_sim.test.js tests/v3_society.test.js`, `python build_v3.py`, aceptación Playwright y validación APK en GitHub Actions.

## Límites
El puesto es una segunda comunidad mínima con un fundador y reabastecimiento; todavía no tiene población propia independiente, familias, elecciones locales, sistema territorial completo, comercio con precios, viajes multichunk ni políticas diferenciadas. Su líder es designado por el consejo matriz. No se declara producción final ni dispositivo físico Android probado.

## Implementación verificada y límites técnicos

La fase 3 se ha dividido en dos módulos: `src/v3/society.js` sigue siendo la autoridad sobre habitantes, política, reloj y economía; `src/v3/frontier.js` implementa exclusivamente la expedición, su contabilidad y la conducta del colono/mensajero. Ambos se empaquetan sin red en `GODSEED-V3-Play.html`.

El libro del puesto guarda `cargoWood`, `wood`, `food`, `deliveries`, `shipmentsDispatched`, `foodConsumed` y la entrega en tránsito. Las invariantes son:

```
madera_matriz + madera_expedición + madera_puesto = madera_recolectada - madera_fabricada - madera_construida
comida_matriz + comida_puesto + comida_en_ruta = comida_recolectada - comida_consumida
envíos_despachados = envíos_entregados + (hay_envío_en_ruta ? 1 : 0)
comida_puesto + comida_en_ruta + comida_consumida_en_puesto = 2 + 2 * envíos_despachados
```

Antes de autorizar la expedición el libro del puesto está a cero. El coste de construcción (4 madera) se descuenta de la carga una sola vez cuando el colono concluye el despeje del solar. Los alimentos enviados no vuelven a registrarse como recolectados. La migración social 1→2→3 y 2→3 preserva el estado histórico original, sin convertir datos de otros juegos.

Las pruebas incluyen el recorrido real hasta el solar y la distancia de entrega, 100 semillas completas, guardado de esquema 2 auténtico, 20.000 ciclos deterministas, rechazo de manipulación del inventario y dos representaciones observables del puesto avanzado (WebGL/Canvas).

**Límites:** La simulación aún comparte un único mapa de 20×20; la segunda comunidad alberga a un fundador, no una sociedad de varios NPC con votación propia. El mensajero representa el abastecimiento entre zonas, no una red comercial general. El valor de una entrega es fijo (2 alimentos); todavía no hay optimización inteligente de rutas ni precios. No se ha fusionado con `main`.
