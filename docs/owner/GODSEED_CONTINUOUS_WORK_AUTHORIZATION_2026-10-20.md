# GODSEED — mandato operativo del propietario (20-10-2026)

**Origen:** instrucciones directas del propietario durante la sesión del 20 de octubre de 2026. Este archivo es un registro de continuidad, no una transferencia de permisos de cuentas externas ni una modificación automática del control de acceso de GitHub.

## Dirección vigente
- Priorizar **GODSEED V3**: simulador medieval autónomo observado desde 3D, estética Pixel Squares, mundo offline Android y decisiones causales de los Sims.
- La documentación antigua que impone solo 2D no constituye una restricción de producto vigente. Conservarla únicamente cuando sirva para reconstrucción, compatibilidad o referencias históricas.
- Evitar integrar código antiguo conflictivo de forma masiva. Rehacer componentes problemáticos de manera limpia cuando simplifique la arquitectura; comprobar primero el estado real y las dependencias.

## Autorización general expresada por el propietario
- El propietario da permiso continuo para **avanzar sin pedir confirmación por cada pequeño paso** en esta línea de trabajo: leer código, auditar, corregir, escribir pruebas, crear documentación, crear commits y trabajar en ramas separadas cuando la herramienta conectada lo permita.
- Permite sustituir implementación obsoleta o defectuosa **en la rama de reconstrucción propia**, dejando el cambio inspeccionable y comprobable.
- Da prioridad a la eficacia y la progresión real sobre mantener funcionalidades históricas no alineadas con V3.
- No hace falta pedir una nueva aprobación verbal para cada lectura, commit de la rama propia, prueba o corrección ordinaria.

## Límites que la autorización no elimina
1. La autorización no cambia los permisos de aplicaciones/conectores ni evita solicitudes de acceso, revisiones o bloqueos de herramientas/plataformas.
2. No abre acceso a claves, secretos, dispositivo físico, cuentas desconectadas, recursos de pago ni máquinas que no estén accesibles.
3. No permite afirmar pruebas no ejecutadas, merges no realizados, builds inexistentes ni progreso automático fuera de una sesión o tarea realmente programada.
4. No autoriza saltarse medidas de seguridad, hacer force-push, sobrescribir ramas ajenas o interferir con trabajo concurrente sin coordinación.
5. **`main` no debe reemplazarse silenciosamente** con un prototipo. Un merge o lanzamiento requiere verificar el resultado exacto y su compatibilidad; la gobernanza de tareas existente continúa hasta una modificación autorizada y documentada.
6. Proteger datos del usuario: partidas guardadas v1 y V3, credenciales y contenido sensible. Para operaciones destructivas, preparar evidencia de alcance/recuperación y actuar únicamente si se tienen los permisos y la capacidad técnica real.

## Estado registrado (instantánea, verificar de nuevo al reanudar)
- Rama de trabajo: `rebuild/godseed-v3-autonomous-3d-20261020`.
- Código V3: `src/v3/sim.js`, `src/v3/view.js`, `src/v3/app.js`; empaquetado `GODSEED-V3-Play.html`.
- CI específica WebGL V3: [run 39501347215](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39501347215) **SUCCESS** en `95aaec186e8e5a82510bff2cad4641068cd3a0a8`.
- QA general de la rama: [run 39501791771](https://github.com/jbob-coder/The-idle-open-world-universe/actions/runs/39501791771) **SUCCESS** en `62c95356cf70bf565a079c04cf3ac9f51b10ccae`.
- Documento técnico: `docs/V3_REBUILD_VERIFIED_STATE.md`.
- La PR en borrador **no fue creada**: la acción de creación devolvió un bloqueo de la herramienta. No afirmar que está abierta ni eludir ese bloqueo.
- No existe certificación Android 3D real ni evidencia de hardware físico por este mandato.

## Protocolo de continuación
Leer el SHA vivo, el registro de tareas y las decisiones más recientes del propietario antes de editar. Ejecutar y observar pruebas, registrar errores y corregirlos en la rama propia. Publicar resultados verificables con SHA/enlaces. No exigir confirmaciones verbales repetitivas para pasos ordinarios, pero respetar cualquier aprobación, conexión o control que la plataforma requiera.
