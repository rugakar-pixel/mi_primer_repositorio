# Certificación PostgreSQL — Fase 2C

**Estado: CERTIFICADA**  
**Fecha:** 2026-11-06  
**Entorno:** PostgreSQL local `db_presupuestos`, esquema `public`, PostgreSQL 16.15.

La certificación se ejecutó en la instancia PostgreSQL local autorizada. No se
implementaron funcionalidades nuevas. El backend temporal se inició con el
reinicio de esquema deshabilitado.

## Migraciones

| Migración | Resultado |
|---|---|
| 001 — catálogo de materiales | Aplicada y verificada; reejecución segura |
| 002 — organización y proyectos | Ya constaba aplicada |
| 003 — mano de obra | Ya constaba aplicada |
| 004 — WBS versionada | Aplicada y verificada |
| 005 — APU maestro | Aplicada y verificada |
| 006 — cotizaciones de materiales | Aplicada y verificada; repetición confirmó que ya estaba aplicada |

El ejecutor registra 002–006 en `schema_migrations`. La migración 001 pertenece
al ejecutor heredado y no tiene entrada en ese registro; se ejecutó y sus
objetos se verificaron directamente.

## Validación de esquema

- **20 tablas** presentes en `public`, incluidas categorías, materiales,
  proveedores, precios, proyectos/versiones, WBS, `apus_maestros`,
  `versiones_apu` y `usos_apu`.
- Columnas de Fase 2C presentes en `materiales_precios`: `origen` y
  `referencia_cotizacion`.
- **10 índices requeridos** presentes:
  `ix_proveedores_nombre`, `ix_materiales_categoria_activo`,
  `ix_materiales_precios_material_proveedor_vigencia`,
  `ix_materiales_precios_material_vigencia`,
  `ix_apus_maestros_estado_nombre`, `ix_versiones_apu_maestro_creado`,
  `ix_usos_apu_version_proyecto`, `ix_usos_apu_partida`,
  `ix_usos_apu_version_apu` e `ix_capitulos_version_proyecto`.
- **28/28 claves foráneas validadas**, incluidas las relaciones de precio con
  material y proveedor, y de uso APU con versión de proyecto, partida y versión
  APU.

## Triggers append-only

Se verificaron los triggers `trg_materiales_precios_inmutables`,
`trg_versiones_apu_inmutables` y `trg_usos_apu_inmutables`.

Sobre una cotización de prueba persistida se intentó `UPDATE` y `DELETE` dentro
de transacciones revertidas. PostgreSQL rechazó ambas operaciones con la
excepción de inmutabilidad; al consultar después, la cotización seguía
conservada en 11.00.

## Pruebas técnicas en PostgreSQL

- Suite completa backend: **30/30 pruebas aprobadas** en PostgreSQL 16.15. Cada
  prueba usó un esquema temporal aislado, eliminado al terminar.
- Las **6 pruebas de Fase 2C** están incluidas: persistencia, historial,
  selección de proveedor, cálculo/snapshot APU, rechazo de relaciones inválidas,
  moneda mixta y auditoría.
- El esquema migrado real de `public` se validó por separado, incluyendo
  migraciones, índices, claves foráneas y triggers.

## Prueba funcional PostgreSQL y evidencia visual

El flujo se ejecutó contra las funciones de API y persistió en `public` con el
sufijo QA `19AC0828` para identificar los datos de certificación:

| Elemento | Evidencia |
|---|---|
| Empresa / proyecto | Constructora QA `19AC0828` / Tanque Elevado QA `19AC0828` |
| Versión / WBS | V1 / Cimentaciones / 01.01 Concreto 3000 PSI, unidad M3 |
| Material | Cemento GU, unidad SACO |
| Cotizaciones iniciales | Proveedor A: 12.00; B: 11.00; C: 13.00 NIO/SACO |
| Selección APU | Proveedor B, cotización #2, 11.00 NIO/SACO |
| Resultado APU | Versión APU 1; costo unitario 11.00 NIO/M3 |
| Nueva cotización | Proveedor B, cotización #4, 9.50 NIO/SACO |
| Snapshot histórico | Sigue conservando cotización #2 y 11.00 NIO/SACO |
| Auditoría | 16 eventos del actor de prueba, incluido el uso asociado al proyecto y su versión |

Tras registrar 9.50, la API devolvió cuatro cotizaciones históricas y mostró
9.50 como precio vigente menor; el uso APU continuó en 11.00. La interfaz COS,
conectada al backend PostgreSQL en el puerto configurado, mostró el proyecto,
la partida, las cotizaciones vigentes e historial, el costo actual de 9.50 y la
trazabilidad guardada del APU con costo 11.00 y cotización #2.

Los registros QA se dejaron en la base local para conservar la evidencia y
respetar la regla de no borrar el historial de precios.

## Resultado

Se aplicaron/verificaron las migraciones pendientes, se comprobaron los objetos
relacionales y los triggers append-only, pasaron las pruebas técnicas sobre
PostgreSQL y se verificó visualmente el flujo funcional contra esa misma base.

**FASE 2C CERTIFICADA EN POSTGRESQL LOCAL.**
