# Reporte de Etapa 7 — Versionamiento de Mano de Obra

> **Producto oficial:** COS — Construction Operating System · **Descriptor:**
> Gerente Administrativo IA para Construcción.

## Qué se implementó

- Cada versión de proyecto conserva su propio borrador/snapshot de Mano de Obra.
- La creación de una versión derivada copia la configuración y las líneas sin modificar la fuente.
- La comparación entre versiones reporta totales, configuración, líneas agregadas, eliminadas y modificadas.
- Las modificaciones incluyen revisión, valores anteriores/nuevos y motivo en la auditoría.

## Archivos modificados

- `backend/app/models/database_models.py`
- `backend/app/schemas/plataforma.py`
- `backend/app/services/plataforma.py`
- `backend/app/api/v1/plataforma.py`
- `backend/migrations/003_fase1_mano_obra.sql`
- `backend/tests/test_plataforma.py`
- `frontend/src/modules/plataforma/api.ts`
- `frontend/src/app/ProjectDashboard.tsx`
- `frontend/src/modules/presupuesto-mo/PresupuestoMoModule.tsx`

## Migraciones creadas

- Se reutiliza `003_fase1_mano_obra.sql`; no se requieren tablas adicionales frente a la persistencia introducida en la etapa 6. El versionamiento se expresa mediante FK a `versiones_proyecto`.

## APIs agregadas

- `GET /api/v1/proyectos/{proyecto_id}/mano-obra/comparar?desde={id}&hasta={id}`
- Recuperación de auditoría por proyecto: `GET /api/v1/proyectos/{proyecto_id}/auditoria`

## Compatibilidad validada

- Las pruebas cubren creación de V2 desde V1, recuperación, comparación, cambios auditados y conflicto de revisión.
- Suite backend completa: 16 aprobadas. `npm run lint` y `npm run build`: aprobados.
- La prueba HTTP integral previa también validó que el estado persistiera al abrir una sesión nueva.

## Riesgos encontrados

- La comparación cubre Mano de Obra únicamente. No se extiende a presupuesto maestro, materiales, equipos, subcontratos ni cronograma, que quedan fuera de esta Fase 1.

## Estado final

**Completada.** Una versión puede modificarse y compararse sin alterar el snapshot de su predecesora.
