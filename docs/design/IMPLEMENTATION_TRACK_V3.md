# GODSEED V3 — Ruta de implementación y pruebas
**Estado:** programa de trabajo. Fuente real de tareas/owner/status: [`docs/agents/tasks.json`](../agents/tasks.json), tablero [`TASK_BOARD.md`](../agents/TASK_BOARD.md). **No asignar tareas desde este texto**: bots reclaman en la rama de coordinación y actualizan estados antes del código. No entrar en otra rama owned ni mezclar PR #20 y #21 como motores sociales paralelos.

## Entregables y definición de terminación (no “100% de juego”)
**Etapa A: base comprobable**
1. ART-006 carga/offline y PR #32 ya preparados, **en revisión** (splash, no rediseño jugable).
2. GOD-004 observatorio de lectura y GOD-001 parser intención, inspectar avances actuales y evitar duplicar.
3. SIM-001 necesidades y SIM-002 decisiones causales, verificar SHA real y cómo cambian la personalidad antes de ampliar.
4. WLD-001..004 chunks/navegación, INT-001..005 casas grandes e interiores seguros, CIV-001..003 construcción/planos; trabajar independientemente con contratos de integración.
5. ART-007 nuevo HUD mapa-prioritario; construir tras contrato visual, no usar ImagenGen como screenshot de gameplay.

**Etapa B: vidas creíbles**
6. SIM-011 cognición/inteligencia/rasgos → decisiones reales y aprendizaje (consulta [contrato cognitivo](SIM_INTELLIGENCE_PERSONALITY_FAMILIES_V3.md)).
7. SIM-003/004/012 hogares, relación, familia, herencia, crianza y contextos.
8. SIM-005/006/007/009 trabajos, educación, historias, relaciones y animaciones sociales.
9. INT-006/007/008 casa, cama, comer, taller; el sim usa realmente el lugar y los objetos.
10. SIM-010/013 QA de largo plazo y LOD, evita gasto lineal de recursos por NPC visible.

**Etapa C: civilizaciones**
11. WLD-005 aldeas remotas, CIV-002..008 logística, mercados, profesiones, rutas, servicios y progreso técnico.
12. CIV-009 monarcas/leyes/sucesión/diplomacia y SIM-008 generaciones/fallecimientos.
13. CIV-010 nuevas colonias y rutas de colonizadores, conflictos o independencia.
14. GOD-006 y GOD-007 poderes reorganizados y observación de siglos; aplicar agencia a persona/hogar/consejo/reino.
15. WLD-009 atlas global y ART-001/002/003/004/005 sprites/mundo/hogar; auditar antes de declarar experiencia nueva.

**Etapa D: release verificable**
16. QA-001..005 Node+navegador+Android emulador; QA-004 hardware **real** 2–3 GB RAM y 20min soak.
17. REL-001 firma estable + migración segura, REL-002 contenido útil con presupuesto real de disco, REL-003 integración revisada, release APK.

## Nueva lista de tareas V3 (registradas, estados visibles en GitHub)
| ID | Enfoque | Criterio más importante |
|---|---|---|
| GOV-004 | Biblia de diseño V3 | docs fuente-contrastada y enlaces al tablero; PR y evidencia |
| GOD-006 | Reemplazar poderes arbitrarios | cada influencia tiene coste, contexto, aceptación, resultados causales |
| GOD-007 | Observatorio y calendario de generaciones | cronología inspectable, controles de tiempo seguros |
| SIM-011 | Atributos e inteligencia reales | decisiones y aprendizaje cambian por variables, no solo UI |
| SIM-012 | Rasgos/relaciones de familias | identidad estable, herencia variable + crianza y experiencias |
| SIM-013 | Población remota LOD | simular cientos sin cientos de actualizaciones Canvas |
| CIV-009 | Reyes/monarquías/diplomacia | monarca sim vivo, sucesión y relaciones políticas |
| CIV-010 | Colonias fundadas | grupo fundador viaja, consume suministros, se asienta, crece o fracasa |
| ART-007 | Interfaz del dios | mundo ocupa mayoría, una inspección, móvil y accesible |

## Matriz vertical mínima para una prueba demostrativa completa
**Semilla reproducible:** inicio con dos pueblos (antiguas partidas válidas) y tercer territorio distante. La aldeana Elin tiene distinta inteligencia/rasgos del guardia Toren; una sequía obliga al consejo a debatir fundar colonia. El usuario inspecciona causas, sugiere oportunidad agrícola, pero puede ser rechazada. Algunos hogares emigran mediante una caravana que atraviesa chunks. La colonia construye cama/pozo/granja a escala coherente y negocia con rey vecino. Pasan años; los colonos envejecen, los hijos crecen con mezcla de herencia/escuela y el monarca fallece. El nuevo gobernante decide tratado. Todo se observa en el mapa y en historia **con coordenadas, recursos y IDs reales**, sin omitir acciones simuladas.

**Casos de aceptación que deben existir como tests**, cada uno aportado por su dueño:
- UI mapa-first: 640×360, 720×400; un panel a la vez, consejos no forzados, pausa no avanza estado.
- Cognición: dos individuos misma necesidad toman diferentes decisiones por carácter y conocimiento, y su aprendizaje cambia futuro.
- Familia: dos generaciones + niño adoptado y heredero político, sin clonar personalidad ni IDs.
- Colonias: nueva colonia con fundadores/recursos, ruta física y stock conservado; fracaso auténtico posible.
- Reyes: rey y heredero existieron como sims; sucesión no deja reino sin política ni dos coronas.
- Rendimiento: 16 seeds x 20k ticks + Android emulador y físico; mundo lejano resumido sin romper información.
- Compatibilidad: importar save `version:1` con capítulos, Faith, objetos y aldeas previos preservados.
- Historia: eventos tienen causa/participantes/resultado verificables; no muestre una historia inventada por mero texto.

## Coordinación, conflictos y significado de finalización
- PR #21 base de sociedad con 2×2 aún sin merge, PR #17 previo, PR #20 alternativa no fusionar junto a #21. PR #32 solo splash.
- Tareas heredadas de otros bots tienen dueños: no reclamar `claimed/in_progress/in_review`. Nunca cambiar prioridades o estados a escondidas.
- Revisión correcta: `ready → claimed → in_progress → in_review → verified`; `done` solo tras merge autorizado/evidencia. Documentar fallos y bloqueos sin fingir pruebas.
- En chat que se retira: `docs/agents/CHAT_RETIRE_AND_RESUME.md` obliga guardar handoff con SHA antes de liberar el trabajo.
- Si un bot descubre trabajo indispensable no cubierto, puede proponer uno nuevo desde su entrega bajo la CLI `add`, justificando evidencia y evitando duplicados.

## Referencias internas
[Visión](GODSEED_V3_VISION_AND_PLAYER_LOOP.md) · [Interfaz/poderes](GOD_VIEW_AND_DIVINE_POWERS_V3.md) · [Cognición/familias](SIM_INTELLIGENCE_PERSONALITY_FAMILIES_V3.md) · [Reinos/colonias](KINGDOMS_COLONIES_DYNASTIES_V3.md) · [Rendimiento/saves](ANDROID_WORLD_SCALE_SAVE_V3.md) · [interiores](../agents/INTERIORS_SYSTEM_SPEC.md) · [GODSEED V2 actual](../LIVING_WORLD_V2_ROADMAP.md).
