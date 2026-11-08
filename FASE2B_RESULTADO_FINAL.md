# Resultado final — Fase 2B

## APROBADA

### Pruebas ejecutadas

| Prueba | Resultado | Evidencia |
|---|---|---|
| 1. Crear y persistir APU Maestro | APROBADA | `test_master_and_multiple_versions_are_persisted` |
| 2. Crear versiones 1 y 2 coexistentes | APROBADA | `test_master_and_multiple_versions_are_persisted` |
| 3. Proyecto A usa v1; Proyecto B usa v2; historial consultable | APROBADA | `test_two_projects_use_distinct_frozen_versions_and_master_usage_is_queryable` |
| 4. Revisar v2 sin alterar presupuestos previos | APROBADA | `test_new_revision_does_not_change_prior_project_snapshot`: v2 permanece congelada, se crea v3 y los snapshots de A/v1 y B/v2 no cambian |
| 5. Consultar proyectos, versiones y partidas de uso | APROBADA | Consulta del maestro devuelve ambos proyectos, números de versión, partidas y snapshots |
| 6. Auditar crear, editar, versionar y usar | APROBADA | `test_create_edit_version_and_use_are_audited` |
| 7. Compatibilidad con Mano de Obra, WBS y VersionProyecto | APROBADA | Suite existente y nueva: `python -m unittest discover -s tests -v`, 24 pruebas aprobadas |

### Evidencia adicional

- Migración 005 aplicada en una base PostgreSQL 16 desechable y aislada; se verificaron las tablas y ambos triggers de inmutabilidad.
- PostgreSQL rechazó las actualizaciones directas a versiones y usos APU.
- Al borrar una partida WBS, el uso histórico y su snapshot permanecieron; la FK a la partida quedó desvinculada.
- Los archivos nuevos de API, esquema y pruebas no reportaron diagnósticos Pylance.

### Riesgos

- La migración debe aplicarse en cada entorno antes del despliegue; no se modificó la base configurada del usuario.
- El actor sigue siendo opcional, de acuerdo con el patrón actual del sistema.
- El detalle de costos se guarda como snapshot JSON y no alimenta aún el consolidado.
- Los APUs heredados permanecen intactos; no se importan automáticamente a la biblioteca nueva.

### Deuda técnica restante

- Incorporar autenticación/autorización central y hacer obligatorio el autor cuando esa capa esté disponible.
- Definir moneda, reglas de cálculo y normalización de componentes para fases futuras.
- Diseñar y aprobar una migración asistida del APU heredado, con revisión humana de equivalencias.
- Integrar costos APU al presupuesto/consolidado únicamente en una fase posterior aprobada.
