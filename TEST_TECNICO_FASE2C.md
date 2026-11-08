# Fase 2C — Pruebas técnicas

## Entorno y comandos

- Backend: Python 3.12 del entorno `backend/.venv`, SQLite temporal para pruebas.
- Frontend: dependencias instaladas del workspace.
- Suite backend: `cd backend; .venv\Scripts\python.exe -m pytest -q`
- Frontend: `cd frontend; npm.cmd run lint` y `npm.cmd run build`
- Higiene: `git diff --check`

## Resultados

| Prueba | Resultado |
|---|---|
| Suite completa de backend | **30 passed** |
| Pruebas nuevas Fase 2C | **6 passed** |
| Type-check frontend | **Correcto** |
| Build de producción frontend | **Correcto** |
| `git diff --check` | **Correcto** |
| Compilación Python | **Correcta** |
| OpenAPI y servidor aislado | **Health OK; rutas Fase 2C cargadas** |

El build reporta advertencias de tamaño de chunks y de `__dirname` en Vite; no
impiden el build y no son fallos de esta fase.

## Casos cubiertos

1. Alta y lectura persistida de material y proveedor.
2. Registro de tres cotizaciones: historial conserva todas; el selector ordena
   los precios vigentes por costo y elige Proveedor B a 11.00 NIO/SACO.
3. Versión APU con cotización referenciada; el servidor calcula costo unitario
   con `Decimal` y el uso conserva el snapshot.
4. Rechazo HTTP 422 cuando proveedor, material y cotización no corresponden.
5. Rechazo de cotizaciones de monedas distintas dentro del mismo APU.
6. Registro de una cotización nueva a 9.50: el precio vigente cambia, mientras
   que versión APU y uso históricos permanecen en 11.00.
7. Auditoría con actor, acción, fecha, motivo y contexto de proyecto/versión.
8. Las pruebas de regresión existentes de APU, precios, WBS y plataforma siguen
   pasando dentro de la suite completa.

## Límite de verificación

La suite automatizada usa SQLite aislado y la migración 006 está diseñada para
PostgreSQL. **No se aplicó ni ejecutó la migración contra la base PostgreSQL
configurada por el proyecto**, para evitar modificar datos compartidos sin un
entorno de staging autorizado. Antes de declarar aprobada la fase en el entorno
objetivo, falta aplicar 006 y verificar columnas, trigger append-only y flujo
API en PostgreSQL.
