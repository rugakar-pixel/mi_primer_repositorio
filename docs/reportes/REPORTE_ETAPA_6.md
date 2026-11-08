# Reporte de Etapa 6 — Persistencia de Mano de Obra

> **Producto oficial:** COS — Construction Operating System · **Descriptor:**
> Gerente Administrativo IA para Construcción.

## Qué se implementó

- Guardado y recuperación del snapshot de Mano de Obra asociado a una versión de proyecto.
- Persistencia de configuración, líneas, revisión, total calculado y versión del algoritmo.
- Escritura transaccional, control de revisión esperada para detectar actualizaciones concurrentes y registro auditable de cambios.
- Integración del módulo existente con carga/guardado remoto, conservando el cálculo, la experiencia demo y exportación Excel existentes.
- El módulo permite registrar un motivo opcional del cambio junto con el guardado.

## Archivos modificados

- `backend/app/models/database_models.py`
- `backend/app/schemas/plataforma.py`
- `backend/app/services/plataforma.py`
- `backend/app/api/v1/plataforma.py`
- `backend/migrations/003_fase1_mano_obra.sql`
- `backend/tests/test_plataforma.py`
- `frontend/src/modules/presupuesto-mo/PresupuestoMoModule.tsx`
- `frontend/src/modules/plataforma/api.ts`
- `frontend/src/app/App.tsx`

## Migraciones creadas

- `003_fase1_mano_obra.sql` crea `presupuestos_mo_versiones` y `presupuestos_mo_lineas` con claves foráneas, índices, controles de unicidad y validaciones de cantidades.
- La migración requiere que `002_fase1_organizacion_proyectos.sql` esté aplicada.

## APIs agregadas

- `GET /api/v1/proyectos/{proyecto_id}/versiones/{version_id}/mano-obra`
- `PUT /api/v1/proyectos/{proyecto_id}/versiones/{version_id}/mano-obra`

## Compatibilidad validada

- El motor de cálculo de frontend y las exportaciones previas se preservaron.
- Se validó guardar y recuperar el snapshot en sesiones nuevas, detección de revisión obsoleta y lectura de endpoints heredados.
- Suite backend: 16 pruebas aprobadas; lint y build frontend aprobados.

## Riesgos encontrados

- El backend registra el total y la etiqueta de algoritmo para trazabilidad, pero la evolución futura del motor debe mantener pruebas de paridad con los cálculos del frontend.

## Estado final

**Completada.** Mano de Obra puede guardarse y recuperarse por versión del proyecto.
