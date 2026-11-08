# Fase 2B — Diseño e implementación del APU Maestro

## 1. Arquitectura general

Fase 2B agrega una biblioteca global de análisis de precios unitarios sin sustituir el APU heredado ni modificar los contratos existentes:

```text
APU Maestro (global, independiente de empresa y proyecto)
└── Version APU (revisión inmutable)
    └── Uso APU (snapshot inmutable por presupuesto y partida)
        ├── Proyecto
        ├── VersionProyecto
        ├── Capítulo WBS
        └── Partida WBS
```

- El maestro conserva identidad y metadatos editables.
- Cada versión congela nombre, descripción, unidad, costo, detalle, autor, fecha y motivo. Editar el maestro no reescribe versiones.
- Versionar significa insertar la siguiente revisión; no se permite editar ni borrar una versión existente.
- Cada uso conserva la revisión APU y un snapshot de sus datos, del presupuesto y de la partida en el momento de la asociación.
- Consultar los usos del maestro responde qué versión se usó, en qué proyecto, versión de presupuesto y partida.
- Los componentes del detalle son valores JSON embebidos en la versión. No crean registros de materiales, cotizaciones, equipos ni subcontratos.

## 2. Modelo de datos

### `apus_maestros`

Identidad estratégica global: `id`, `nombre`, `descripcion`, `unidad`, `estado`, `creado_por_id`, `creado_en` y `actualizado_en`. No tiene FK a empresa o proyecto.

### `versiones_apu`

Revisión congelada: `id`, `apu_maestro_id`, `numero`, `nombre`, `descripcion`, `unidad`, `costo_unitario`, `detalle` JSON, `motivo`, `creado_por_id` y `creado_en`. La pareja maestro/número es única. Los cambios se hacen creando una nueva versión.

### `usos_apu`

Asociación histórica entre `version_apu_id`, `version_proyecto_id` y `partida_id`, con autor, motivo y fecha. Guarda además códigos/nombres legibles y un `snapshot` JSON que incluye los datos congelados del APU, el proyecto, la versión de presupuesto, el capítulo y la partida. Si una partida WBS se elimina, su FK se desvincula y el snapshot histórico permanece.

`version_apu_id` y `version_proyecto_id` son restrictivos para impedir la eliminación de revisiones referenciadas. `partida_id` permite desvinculación al borrar una partida, preservando la evidencia.

## 3. Relaciones

- `APUMaestro 1:N VersionAPU`.
- `VersionAPU 1:N UsoAPU`.
- `VersionProyecto 1:N UsoAPU`.
- `Partida 1:N UsoAPU` mientras exista la partida.
- El servicio comprueba que la partida pertenece al proyecto y a la versión de presupuesto solicitada.
- La base de datos impone unicidad de número de versión y claves foráneas. Las versiones APU y los usos tienen triggers de inmutabilidad en PostgreSQL.
- Al crear una nueva `VersionProyecto` desde otra, se copian sus usos APU hacia las partidas WBS recién copiadas; el uso apunta a la misma versión APU y conserva una nueva referencia al presupuesto derivado.

La tabla heredada `analisis_precios_unitarios` y sus líneas no se convierten ni se eliminan. La asociación con la nueva biblioteca es una superficie paralela.

## 4. Migraciones

Se agrega `backend/migrations/005_fase2b_apu_maestro.sql` y el registro de versión `005` en el ejecutor existente.

La migración crea las tres tablas, restricciones e índices, y los triggers `trg_versiones_apu_inmutables` y `trg_usos_apu_inmutables`. El trigger de usos admite únicamente la desvinculación de `partida_id` causada por el borrado WBS; el resto de actualizaciones y borrados se rechaza.

Prerrequisitos: migraciones 002 y 003 de Fase 1 y 004 de Fase 2A. Aplicación desde `backend`:

```powershell
.\.venv\Scripts\python.exe app\apply_migration.py 005
```

La migración es aditiva y no transforma datos heredados. Se recomienda respaldo previo y aplicación primero en staging. No se incluye migración automática de las líneas APU antiguas porque no existe una correspondencia inequívoca entre esas líneas y un maestro/versionado reutilizable.

## 5. APIs

Las rutas nuevas se montan bajo `/api/v1`; las rutas existentes permanecen intactas.

| Operación | Ruta | Comportamiento |
|---|---|---|
| Listar maestros | `GET /apu-maestro` | Lista global; acepta filtro `estado`. |
| Crear maestro | `POST /apu-maestro` | Persiste un activo global y registra auditoría. |
| Editar metadatos | `PUT /apu-maestro/{id}` | Edita nombre, descripción, unidad o estado; requiere motivo y audita antes/después. |
| Listar versiones | `GET /apu-maestro/{id}/versiones` | Devuelve revisiones en orden. |
| Crear revisión | `POST /apu-maestro/{id}/versiones` | Inserta número siguiente y congela costo/detalle/autor/motivo. |
| Asociar versión a partida | `POST /apu-maestro/proyectos/{proyecto_id}/versiones/{version_id}/partidas/{partida_id}/usos` | Valida pertenencia y crea el snapshot histórico. |
| Consultar usos | `GET /apu-maestro/{id}/usos` | Lista proyectos, versiones de presupuesto, revisiones APU, partidas y snapshots. |
| Consultar usos de una partida | `GET /apu-maestro/proyectos/{proyecto_id}/versiones/{version_id}/partidas/{partida_id}/usos` | Devuelve el historial de asociaciones de esa partida. |
| Consultar auditoría | `GET /apu-maestro/{id}/auditoria` | Lista eventos del maestro, incluyendo creación, edición, versionado y uso. |

El historial se obtiene por IDs explícitos: cada uso incluye `version_apu_id`, `version_proyecto_id`, `proyecto_id`, `partida_id` (si sigue vigente), fecha y snapshot.

## 6. Compatibilidad

- No se cambia ni se sustituye `AnalisisPrecioUnitario`, `Partida`, Mano de Obra, WBS o `VersionProyecto`.
- Las respuestas de WBS y de los endpoints heredados de partidas no reciben campos nuevos.
- No se altera el contrato API de Fase 1/2A ni se recalculan presupuestos/consolidados.
- Los usos se consultan mediante las nuevas rutas. Un consumidor heredado no necesita conocer la biblioteca.
- Borrar una partida usada mantiene el comportamiento de borrado WBS y conserva el registro histórico con `partida_id` desvinculado y los datos identificativos en el snapshot.
- Una revisión de presupuesto derivada conserva las asociaciones APU de la versión fuente, apuntando a las partidas WBS copiadas.

## 7. Riesgos

- La identidad es opcional, siguiendo el patrón existente: si no se envía autor, el evento se registra como no autenticado. La autenticación/autorización global sigue fuera de este alcance.
- El contenido detallado es JSON embebido y no un catálogo normalizado; validaciones de precios, moneda, cotizaciones y componentes tipados quedan para fases futuras.
- Las líneas APU heredadas no se migran automáticamente y coexistirán con la biblioteca nueva.
- El costo unitario se almacena como decimal, pero no se conecta aún al consolidado ni recalcula el costo de la partida.
- La migración 005 se verificó en PostgreSQL desechable; cada entorno debe ejecutarla antes de servir estas rutas.

## 8. Estrategia de migración

1. Respaldar la base de datos del entorno.
2. Confirmar que 002, 003 y 004 constan como aplicadas.
3. Aplicar 005 con el ejecutor de migraciones.
4. Verificar las tablas y triggers mediante el propio ejecutor.
5. Desplegar el backend con las rutas aditivas.
6. Crear maestros/versiones nuevos o cargar legado mediante un proceso futuro revisado y explícito.
7. Validar consultas de historial y la creación de versiones derivadas antes de usarlo operativamente.

No se eliminan ni transforman los registros actuales de APU, partidas, Mano de Obra, WBS o presupuestos.

## Evidencia de pruebas de Fase 2B

- `backend/tests/test_apu_maestro.py`: persistencia del maestro, coexistencia de versiones, usos v1/v2 en proyectos distintos, aislamiento frente a una revisión posterior, copia de usos al derivar `VersionProyecto` y auditoría de creación/edición/versionado/uso.
- Suite backend: `python -m unittest discover -s tests -v` — 24 pruebas aprobadas, incluidas las pruebas existentes de Mano de Obra y WBS.
- Migración PostgreSQL: aplicada en base desechable; ambos triggers rechazaron cambios a versiones/usos. También se verificó que borrar una partida desvincula la FK sin perder el snapshot.
- Diagnósticos Pylance en los archivos nuevos de API, esquema y pruebas: sin diagnósticos.
