# FASE 2A — Diseño de estructura WBS

> **Identidad oficial vigente:** COS — Construction Operating System.  
> **Descriptor:** Gerente Administrativo IA para Construcción.

## Alcance

Persistir y editar la estructura de trabajo del presupuesto:

```text
Empresa
└── Proyecto
    └── VersionProyecto
        └── Capitulo
            └── Partida
```

La empresa se obtiene del proyecto; cada capítulo queda asociado tanto al
proyecto como a una versión del mismo. Las partidas pertenecen a un capítulo.
El código de capítulo es único por versión y el código de partida es único por
capítulo.

Esta fase solo guarda código, nombre/descripción, unidad, cantidad y
rendimiento. No implementa ni persiste análisis de precios unitarios,
materiales, equipos, totales ni consolidado.

## Versionado e integridad

- `capitulos.version_proyecto_id` referencia `versiones_proyecto.id`.
- Se conserva `capitulos.proyecto_id` para compatibilidad con datos y APIs
  anteriores; la API WBS verifica que la versión pertenezca a ese proyecto.
- La columna de versión admite `NULL` únicamente para capítulos heredados que
  existían antes de FASE 2A. No se muestran como estructura de una versión ni
  se copian al crear versiones nuevas.
- Al crear una versión derivada, se copian capítulos y campos estructurales de
  sus partidas a filas nuevas. Los identificadores y cambios posteriores son
  independientes entre versiones.
- La copia no incluye análisis de precios unitarios ni costos. Las partidas
  nuevas quedan con costo unitario cero en la estructura heredada, que no forma
  parte de la respuesta WBS.
- Las modificaciones estructurales quedan registradas en `auditoria_eventos`.

## Persistencia y migración

La migración `backend/migrations/004_fase2a_wbs.sql` agrega la referencia a
versión, reemplaza la restricción de código por una restricción versionada y
crea un índice. No elimina ni reasigna capítulos históricos.

Aplicar en PostgreSQL, después de las migraciones 001–003:

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.apply_migration 004
```

La migración es registrada en `schema_migrations`; el ejecutor verifica la
columna. Como con las fases anteriores, `create_all()` no sustituye la
migración explícita de una base existente.

## API FASE 2A

Todas las rutas están bajo `/api/v1` y reciben proyecto y versión para impedir
que una operación se aplique a una versión de otro proyecto.

| Método | Ruta | Operación |
|---|---|---|
| `GET` | `/proyectos/{proyecto_id}/versiones/{version_id}/wbs` | Consultar árbol de capítulos y partidas |
| `POST` | `/proyectos/{proyecto_id}/versiones/{version_id}/capitulos` | Crear capítulo |
| `PUT` | `/proyectos/{proyecto_id}/versiones/{version_id}/capitulos/{capitulo_id}` | Actualizar capítulo |
| `DELETE` | `/proyectos/{proyecto_id}/versiones/{version_id}/capitulos/{capitulo_id}` | Eliminar capítulo y sus partidas |
| `POST` | `/proyectos/{proyecto_id}/versiones/{version_id}/capitulos/{capitulo_id}/partidas` | Crear partida |
| `PUT` | `/proyectos/{proyecto_id}/versiones/{version_id}/capitulos/{capitulo_id}/partidas/{partida_id}` | Actualizar partida |
| `DELETE` | `/proyectos/{proyecto_id}/versiones/{version_id}/capitulos/{capitulo_id}/partidas/{partida_id}` | Eliminar partida |

Las claves duplicadas y conflictos de integridad se reportan como HTTP 409; los
recursos que no pertenecen al contexto de ruta responden HTTP 404. La API sigue
el modelo de identidad de demostración de FASE 1 y no provee autenticación real.

## Interfaz

Al abrir un proyecto y una versión persistidos, **Estructura WBS** permite:

- Consultar los capítulos y sus partidas.
- Crear, editar y eliminar capítulos y partidas.
- Editar únicamente la versión abierta; abrir otra versión muestra su propio
  árbol.

La pantalla no presenta recursos ni cálculos fuera del alcance de FASE 2A.

## Pruebas de aceptación

1. Crear empresa/proyecto/versión, capítulo y partida; cerrar la sesión de base
   de datos, abrir una nueva y comprobar que el árbol permanece.
2. Crear una versión derivada, comprobar la copia con nuevos identificadores,
   modificar capítulo y partida en la versión nueva, y verificar que la versión
   fuente conserva sus valores.
