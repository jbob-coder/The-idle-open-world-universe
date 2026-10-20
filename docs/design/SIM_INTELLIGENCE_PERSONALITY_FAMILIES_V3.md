# GODSEED V3 — Inteligencia, personalidad, familia y vidas autónomas
**Estado:** contrato propuesto para SIM-011, SIM-012, SIM-013 + SIM-002/003/004/006/007/008/009/010; no afirmar que el código actual lo haga.
**Base verificada:** `src/living.js` crea cuatro ciudadanos con `kindness,diligence,independence,skill,relationships,age` y ciclos de tareas simples, límite 4 ciudadanos nuevos. No hay genética, IQ funcional, árbol de parentesco ni simulación de generaciones completas aún. Evitar etiquetas clínicas en el juego o inferencias sobre personas reales.

## Regla central: atributos determinan decisiones, NO solo números en una tarjeta
Una inteligencia alta no significa obedecer más ni ser “mejor humano”: modifica qué información puede integrar un sim, la cantidad de hipótesis que contempla, velocidad de aprendizaje en dominios pertinentes y búsqueda de soluciones. Inteligencia alta con prudencia baja y experiencia cero puede fracasar; inteligencia ordinaria con conocimiento local, colaboración y buenos recursos puede triunfar.

**Cinco capas independientes, versionadas:**
1. **Necesidades dinámicas** (0..100): hambre, energía, salud, seguridad, comodidad, higiene, social, propósito. Los peligros extremos anulan objetivos de baja prioridad.
2. **Capacidades relativamente estables** (0..100): razonamiento, memoria de trabajo, percepción, autocontrol, creatividad, fuerza, destreza, resistencia. Escalas lúdicas ficticias, no pruebas de IQ clínico.
3. **Temperamento/persona** (0..1): curiosidad, diligencia, empatía, prudencia, sociabilidad, autonomía, ambición, aversión al riesgo, paciencia, fe/cultura. Cambios lentos por trauma, educación, edad y experiencias.
4. **Habilidades aprendidas** (0..20): agricultura, carpintería, minería, albañilería, comercio, curación, diplomacia, investigación, combate, crianza, cocina y navegación; progresan por intentos con resultado, guía, práctica y educación, NO solo daño/hits.
5. **Conocimiento y creencias situadas:** sabe/no sabe dónde hay agua, qué vecino miente, cómo construir pozo, precio del hierro, amenaza política; con fuente, confianza, última observación y posibilidad de error o información falsa.

## Modelo de decisión reproducible
No reemplazar toda la mente por una llamada a un LLM remoto. El planificador enumera objetivos factibles (comer, descansar, cuidar familia, obtener madera, inventar herramienta, trabajar, enseñar, negociar, apoyar rey, emigrar, ignorar consejo). Primero filtros DUROS: vida, hambre extrema, capacidad física, recursos, ruta/puerta, calendario, ley y lo que el sim sabe. Después evaluación de utilidad por objetivo (g):

`utility(g) = needs(g) + values(g) + relationships(g) + expected_outcome(g) + current_commitments(g) - risk(g) - costs(g) - switching_cost(g)`.

Cada término normalizado, limitado, respaldado por variables reales y registrado cuando el usuario lo inspecciona. Decisión cambia con inteligencia por **calidad/calibración de expected_outcome, objetivos disponibles y horizonte del plan**, no multiplicando indiscriminadamente el utility final. Rasgos afectan valoración: alta prudencia aumenta coste de riesgo, empatía aumenta rescate, curiosidad favorece explorar, paciencia reduce cambios de tarea. Compromisos en marcha evitan indecisiones por tick; reevaluar solo en eventos importantes o cadencia limitada. Permitir exploración estocástica **seeded**, no ruta idéntica garantizada de cada sim.

### Caso que debe funcionar en gameplay
Elin (razonamiento 77, curiosidad 70, prudencia 20, conocimiento forestal 2) descubre río: plantea atajo experimental, pero puede asumir riesgo grande; Toren (razonamiento 49, prudencia 85, navegación 13) prefiere ruta estable y la conoce mejor. Al recibir “fundad colonia”, Elin evalúa posibilidades técnicas, Toren evalúa escolta y comida; ambos pueden discrepar. Tras aprender meteorología o sufrir crecida cambian el juicio. **Los resultados reales** quedan registrados (camino, recurso, fracaso, amistad). No definir éxito por atributo aislado.

## Familias, generaciones y herencia — diseño sin determinismo biológico
`person.id` estable; `householdId` (quién vive junto), `parents[]` (parentesco genealógico), `guardians[]` (cuidadores), `partners[]`, `children[]`, `originTownId`, `birthYear`, `deathYear?`, `familyHouseId?` y `cultureId`. Un huérfano o familia adoptiva puede progresar igual; los vínculos familiares son dinámicos, no roles obligatorios. El apellido, apellido compuesto o nombre dinástico **no** es identificador estable.

Capacidades iniciales ficticias: `traitStart = clamp(0.25*parentA + 0.25*parentB + 0.5*individualSeedVariance + contextAdjustment, 0,100)` como **parámetro de diseño ilustrativo** (no ley de genética real). La dispersión individual y entorno (alimentación, educación, oportunidades, enfermedad, mentoring, cultura) impiden hijos-clon. Para distintos tipos de rasgo/rasgos fuertes usar pesos individuales calibrados con tests. Personalidad se construye principalmente mediante temperamento, vínculos, crianza, ambiente y acontecimientos; no “heredar obediencia” ni “rebelión familiar” automáticamente. La “inteligencia” no debe determinar casta, privilegio, moralidad o derechos sociales.

Poderes familiares persistentes: memoria cultural, negocios heredados, casas, juramentos, secretos, rivalidades y reputación, pero cada descendiente decide si acepta. Parejas, matrimonios, amistad y hogares consensuados; envejecimiento, natalidad, mortalidad e herencia se manejan sin crecimiento exponencial infinito. Historias dolorosas representadas con cuidado y sin contenido adulto explícito.

## Esquema conceptual v2 (adaptador a saves v1, no implementado)
```json
{
  "id": "person:v3:042",
  "identity": {"name": "Elin", "ageYears": 24, "cultureId": "culture:briar"},
  "family": {"householdId": "home:briar:21", "parents": ["person:v3:009","person:v3:011"], "guardians": [], "partnerIds": [], "children": []},
  "needs": {"hunger": 64, "energy": 57, "safety": 80, "social": 41},
  "abilities": {"reasoning": 73, "memory": 56, "creativity": 82, "dexterity": 46},
  "personality": {"curiosity": 0.87, "caution": 0.23, "empathy": 0.68, "autonomy": 0.89},
  "skills": {"farming": 3, "carpentry": 7, "trade": 1},
  "knowledge": [{"factId": "ford:river", "confidence": 0.7, "source": "saw", "lastVerifiedTick": 411}],
  "goal": {"kind": "repair_bridge", "targetId": "bridge:river:8", "reasonIds": ["need:safety","memory:flood:12"]},
  "social": {"person:v3:059": {"trust": 38, "bond": 66, "rivalry": 3}},
  "journalRef": "journal:person:v3:042"
}
```
Persistir por grupos de longitud acotada, fechas y enlaces a hechos, no un diario de 500 KB por sim. Historias antiguas se resumen en eventos archivados con procedencia. Nunca duplicar estado de familia en todos los hijos sin control.

## Acciones visibles y apariencia coherente
Sprites con variación física basada en edad/ropa/oficio/herencia *estilizada*; el peinado o color no equivale a inteligencia/ética. Caminar hacia trabajo real, buscar comida, sentarse, hablar, leer, huir, cargar recursos, construir por etapas, descansar dentro del hogar y morir/dejar legado. Animaciones por estados, no render de NPC “pensando” en cada frame. Inspección revela motivo y circunstancias sin herramientas de control.

## Pruebas que deben fallar si la simulación es cosmética
- Igual seed/inputs → mismas decisiones; modificar inteligencia altera planeación/aprendizaje observables en ensayos sin imponer mayor utilidad universal.
- Diferente personalidad con mismas necesidades conduce a prioridades distintas en casos controlados.
- Falta de información produce decisiones erróneas plausibles; adquirir una pista corrige política de decisión.
- Dos hijos de los mismos padres, distintas semillas/ambientes → rasgos no idénticos; afecto/guardians y vida alteran resultados.
- Árbol familiar de al menos tres generaciones sin ciclos de ascendencia, sin IDs duplicados ni relaciones fantasma; test de sucesión/herencia.
- 16 seeds x 20k ticks; nadie se “congela” por cambiar objetivos cada tick; hambre grave tiene salida o reporte de imposibilidad.
- Bounded memory + save/restore + 1000+ habitantes simulados por LOD sin cada NPC activo por frame, y métricas físicas Android antes de declarar rendimiento.
- Mostrar explicaciones tipo “porque faltó comida y su hermana enfermó”, **derivadas del estado real**, no texto aleatorio de generador.

**Tareas existentes:** SIM-001…010, INT-006/007. **Nuevas:** SIM-011, SIM-012, SIM-013. Las tareas en `tasks.json` mandan sobre este documento.
