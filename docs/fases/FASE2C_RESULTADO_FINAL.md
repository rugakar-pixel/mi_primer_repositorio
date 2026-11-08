# Fase 2C — Resultado final

**Estado de aprobación: NO APROBADA OPERATIVAMENTE**  
La implementación y el flujo funcional están completos y fueron verificados
visualmente en un entorno temporal aislado. La fase no se declara aprobada para
el entorno COS porque todavía no se ha aplicado ni validado la migración 006 en
PostgreSQL.

## Entregables y cambios de Fase 2C

- [FASE2C_DISENO_MATERIALES.md](../arquitectura/FASE2C_DISENO_MATERIALES.md): arquitectura, modelo, flujos, impactos y
  criterios previos a implementación.
- `backend/migrations/006_fase2c_cotizaciones_materiales.sql`: agrega origen y
  referencia de cotización sin alterar ni borrar historial.
- `backend/app/models/database_models.py`: mapea los nuevos metadatos de
  `MaterialPrecio`.
- `backend/app/apply_migration.py`: registra/verifica 006 y corrige la
  verificación de tabla del trigger de la migración 005, necesaria para poder
  encadenar la migración nueva.
- `backend/app/api/v1/materiales.py` y
  `backend/app/schemas/materiales_reales.py`: API de altas/consulta de
  categorías, materiales, proveedores y cotizaciones; consulta de historial,
  precios vigentes por proveedor y mejor precio vigente.
- `backend/app/api/v1/apu_maestro.py` y
  `backend/app/schemas/plataforma.py`: extienden el detalle de versión APU con
  referencias a material/proveedor/cotización, validación de vigencia,
  unidades/moneda y cálculo autoritativo del costo.
- `frontend/src/modules/materiales-costos/MaterialesAPUWorkflow.tsx`,
  `frontend/src/modules/plataforma/api.ts`,
  `frontend/src/app/App.tsx` y
  `frontend/src/modules/apu/EstructuraCostosView.tsx`: interfaz operativa para
  crear/consultar el catálogo y cotizaciones, seleccionar precio e integrar
  APU en una partida versionada; el uso presenta los datos del snapshot.
- `backend/tests/test_fase2c_materiales.py`,
[TEST_TECNICO_FASE2C.md](../reportes/TEST_TECNICO_FASE2C.md) y [TEST_FUNCIONAL_FASE2C.md](../reportes/TEST_FUNCIONAL_FASE2C.md): pruebas y evidencia.

Las rutas demo existentes y los contratos APU/WBS previos se conservan.

## APIs

- `GET/POST /api/v1/materiales/categorias`
- `GET/POST /api/v1/materiales`
- `GET/POST /api/v1/materiales/proveedores`
- `GET/POST /api/v1/materiales/{material_id}/cotizaciones`
- `GET /api/v1/materiales/{material_id}/precios-vigentes`
- `GET /api/v1/materiales/{material_id}/precio-vigente`
- Extensión compatible de `POST /api/v1/apu-maestro/{id}/versiones`.
- Reutilización de asociación/consulta de `usos_apu` por proyecto, versión y
  partida.

No existe API de actualización/eliminación de precios. En PostgreSQL, el
trigger append-only existente también impide cambiar o borrar filas.

## Evidencia

- Suite completa backend: **30 passed**.
- Frontend `npm.cmd run lint`: **correcto**.
- Frontend `npm.cmd run build`: **correcto**.
- Browser UI con proyecto Tanque Elevado / V1 / Cimentaciones / Concreto 3000
  PSI: B=11.00 fue seleccionado y el costo APU persistido fue 11.00/M3.
- Al registrar B=9.50, el catálogo cambió a 9.50 y la tarjeta del uso anterior
  siguió mostrando material Cemento GU, Proveedor B, cotización #5 y 11.00.
- Auditoría automatizada verificó actor, acción, fecha, motivo y contexto de
  proyecto/versión.
- Entorno visual y suite técnica usaron SQLite temporal; no se modificó ni se
  accedió a la base PostgreSQL de usuario.

## Riesgos y deuda técnica

1. **Bloqueante de aprobación:** migración 006 todavía no aplicada ni probada
   contra PostgreSQL; el trigger, el esquema real y la ejecución del APU deben
   confirmarse en staging.
2. El APU guarda referencias y snapshot material en JSON de `VersionAPU.detalle`;
   la consistencia de las referencias se valida en API, no mediante FKs
   independientes para cada línea.
3. El acceso visual existente es un prototipo y el actor se transmite en el
   contrato. La identidad no equivale a autenticación/claims de producción.
4. No hay conversión de unidades o monedas; se rechazan unidades incompatibles
   y monedas mezcladas.
5. El costo calculado se guarda en versión/uso APU; esta fase no crea un
   Presupuesto Maestro ni consolida automáticamente valores de todas las
   partidas.
6. El módulo demo de costos y equipos se mantiene por compatibilidad y no debe
   confundirse con las cotizaciones persistidas del flujo de proyecto.

## Recomendaciones para Fase 2D

1. Aplicar 006 en PostgreSQL de staging sobre respaldo y verificar los metadatos,
   que el trigger rechaza `UPDATE/DELETE`, y que altas/consultas/APU funcionan
   con la base relacional objetivo.
2. Agregar pruebas de integración PostgreSQL y pruebas Playwright repetibles
   con fixtures aislados, incluyendo cotización futura, expiración,
   concurrencia y cambio de moneda.
3. Definir identidad y autorización de producción desde sesión/claims y
   membresías; no confiar en un `creado_por_id` enviado por el cliente.
4. Diseñar antes de codificar la integración futura de snapshots APU con el
   Presupuesto Maestro: alcance de cantidades/rendimientos, versiones,
   aprobaciones y trazabilidad, sin crear consolidación paralela.
5. Evaluar normalización futura de componentes APU y captura de evidencia
   documental de cotizaciones, manteniendo snapshots históricos inmutables.

## Criterio final

La implementación cumple el flujo visible y los casos automatizados en un
entorno aislado. Se declara **NO APROBADA** hasta completar y documentar la
validación de PostgreSQL en un entorno autorizado; al terminarla, actualizar
este resultado con la evidencia de migración y smoke test.
