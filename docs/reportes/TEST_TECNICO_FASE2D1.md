# Fase 2D.1 — Test Técnico

**Estado:** APROBADO  
**Fecha:** 2026-11-08  
**Suite:** `backend/tests/test_presupuesto_maestro.py`

## 1. Resultado global

| Ejecución | Resultado |
|---|---:|
| Suite backend completa | 35/35 aprobadas |
| Pruebas específicas Fase 2D.1 | 5/5 aprobadas |
| TypeScript frontend | Aprobado |
| Build frontend | Aprobado |

Comando backend ejecutado:

```text
C:/Python315/python.exe -m unittest discover -s tests -v
```

## 2. Pruebas obligatorias

### TEST 1 — Persistencia de estructura

Se creó Empresa, Proyecto, Versión, Capítulo y tres Partidas. Se calculó el Presupuesto Maestro y se verificaron las filas persistidas de agregado, Capítulo y Partidas.

**Resultado:** aprobado.

### TEST 2 — Asignación de costos

Se asignaron costos unitarios persistidos de 100, 200 y 50 a cantidades 10, 20 y 30.

```text
Excavación: 10 × 100 = 1,000
Concreto:    20 × 200 = 4,000
Acero:       30 ×  50 = 1,500
Total:                    6,500
```

**Resultado:** aprobado.

### TEST 3 — Modificación de Partida

Se modificó la cantidad de una Partida y se ejecutó el recálculo.

**Resultado:** el total del Capítulo se actualizó correctamente.

### TEST 4 — Modificación de Capítulo

Se modificó el nombre del Capítulo y se recalculó el agregado.

**Resultado:** el total general se conservó correctamente y la revisión aumentó.

### TEST 5 — Cerrar, reabrir y recuperar

Se guardó el agregado, se cerró la sesión SQLAlchemy, se reabrió la base temporal y se consultó nuevamente el Presupuesto Maestro.

**Resultado:** total, Capítulo, Partidas y auditoría fueron recuperados.

## 3. Regresión

Las pruebas existentes de plataforma, WBS, APU Maestro, materiales, costos y consolidado continuaron aprobadas. No se reemplazaron sus tablas, servicios ni contratos.

## 4. Frontend

- `npm.cmd run lint`: aprobado.
- `npm.cmd run build`: aprobado.
- Advertencias no bloqueantes: chunks grandes de Vite y advertencias de configuración/dependencias heredadas.

## 5. Limitaciones de esta evidencia

- La prueba automatizada usa SQLite temporal para aislar el ciclo de pruebas.
- La certificación PostgreSQL de la migración 007 queda como actividad de despliegue/control para la siguiente etapa.
- No se probaron capacidades excluidas de Fase 2D.1.

