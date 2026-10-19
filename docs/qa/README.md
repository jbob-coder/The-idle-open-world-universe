# GODSEED — QA de causalidad y diseño V3

La biblioteca de diseño V3 se encuentra en [`docs/design/README.md`](../design/README.md). Esta carpeta complementa sus contratos con **pruebas de aceptación verificables** que deberán implementar los equipos responsables a medida que cada sistema exista.

- **[`GODSEED_V3_CAUSAL_ACCEPTANCE.md`](GODSEED_V3_CAUSAL_ACCEPTANCE.md)**: casos VAC-01…14 para dios observador, mente/inteligencia, familias, presupuesto económico, consumo computacional, colonias, reinos, interfaz Android y guardado.
- **[`tests/test_task_v3_causal_acceptance.py`](../../tests/test_task_v3_causal_acceptance.py)**: valida que el diseño mantiene casos, vínculos y referencias al tablero. **Este test NO certifica que los casos VAC pasen ni que las funciones estén implementadas.**

**Autoridad de estados:** `docs/agents/tasks.json` en `docs/godseed-agent-task-governance-v1`; las tareas ya registradas `GOD-006`, `SIM-011/012/013`, `CIV-009/010`, `ART-007` mantienen sus propios dueños. QA-006 documenta y conecta sus pruebas, sin reclamar los subsistemas ajenos.

**Estado real:** se trata de diseño/pruebas futuras y no de una segunda versión de la aplicación. Nunca confundir mockup de imagen con captura del juego, emulador con hardware físico, o PR verde con característica fusionada en `main`.
