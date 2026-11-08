# Reporte de Etapa 3 — Proyecto

> **Producto oficial:** COS — Construction Operating System · **Descriptor:**
> Gerente Administrativo IA para Construcción.

## Qué se implementó

- Alta y consulta de proyectos asociados a una empresa.
- Se amplió el modelo `Proyecto` existente con `empresa_id` nullable para mantener compatibles los registros previos y permitir asociación gradual.
- El tablero permite seleccionar empresa y administrar proyectos sin reemplazar el flujo actual de presupuesto.

## Archivos modificados

- `backend/app/models/database_models.py`
- `backend/app/schemas/plataforma.py`
- `backend/app/api/v1/plataforma.py`
- `backend/migrations/002_fase1_organizacion_proyectos.sql`
- `frontend/src/app/App.tsx`
- `frontend/src/app/ProjectDashboard.tsx`
- `frontend/src/modules/plataforma/api.ts`

## Migraciones creadas

- `002_fase1_organizacion_proyectos.sql` agrega `proyectos.empresa_id` como nullable, su FK con borrado restrictivo e índice.

## APIs agregadas

- `GET /api/v1/proyectos`
- `POST /api/v1/proyectos`

## Compatibilidad validada

- La columna nullable evita exigir una empresa a proyectos legados durante la migración.
- Las rutas existentes de catálogo, partidas/APU, materiales/costos y consolidado permanecen operativas.
- La prueba de integración aislada previamente recorrió la creación de proyecto y leyó APIs legadas; suite backend y frontend exitosos.

## Riesgos encontrados

- Proyecto sin empresa puede seguir existiendo por compatibilidad. La asignación de esos datos legados debe ser una operación explícita, no una migración automática basada en supuestos.

## Estado final

**Completada.** Los proyectos nuevos se asocian a empresa; los anteriores permanecen válidos.
