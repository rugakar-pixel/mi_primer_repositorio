# FASE 1 — Plan de Implementación V1

**Producto oficial vigente:** COS — Construction Operating System  
**Descriptor:** Gerente Administrativo IA para Construcción  
**Nombre al inicio de Fase 1:** Motor de Presupuesto MO y Flujo de Caja Nicaragua 2026 (referencia histórica)  
**Fecha:** 2026-11-05  
**Propósito:** establecer una base persistente y trazable para evolución incremental hacia un Gerente Administrativo IA.  
**Alcance de este documento:** diagnóstico, plan y criterios previos a cambios de código; no crea ni migra entidades.

## Diagnóstico Inicial

### Estructuras existentes

- Frontend React 19 + TypeScript + Vite en `frontend/src`; navegación, acceso de demostración y pantallas de tablero/módulos.
- Backend FastAPI + SQLAlchemy + Pydantic en `backend/app`; PostgreSQL mediante `DATABASE_URL`, con URL local por defecto `costos_obra`.
- Modelos SQLAlchemy centralizados en `backend/app/models/database_models.py`; `Base.metadata.create_all()` se ejecuta en el inicio del backend.
- Migraciones SQL manuales en `backend/migrations`; `001_catalogo_materiales.sql` es transaccional y su ejecutor es `backend/app/apply_migration.py`.
- Pruebas de backend con `unittest`, SQLAlchemy y SQLite en memoria; no hay una suite de pruebas de integración HTTP identificada.
- La app tiene un `RESET_DB_SCHEMA_ON_STARTUP=1` de desarrollo que elimina y recrea el esquema. Debe permanecer deshabilitado: no se utilizará para esta evolución ni para bases con datos.

### Modelos y datos existentes

- Persistidos en PostgreSQL: `Proyecto`/`proyectos`, `Capitulo`/`capitulos`, `Partida`/`partidas`, `AnalisisPrecioUnitario`/`analisis_precios_unitarios` y `MaestroPartidas`/`maestro_partidas`.
- Persistidos por la migración 001: categorías de material, materiales, proveedores y precios históricos inmutables.
- El proyecto actual tiene relaciones de cascada desde Proyecto a Capítulo, Capítulo a Partida y Partida a líneas APU. Estas políticas se deben respetar al ampliar el esquema.
- El registro de bitácora indica que `maestro_partidas` tenía 8,106 filas; no se deben regenerar ni alterar sus identificadores.
- Mano de Obra se calcula en frontend. `Actividad`, `ConfiguracionLaboral` y `CronogramaCalculado` son tipos/cálculos TypeScript y no se persisten.
- `Proyecto` en frontend/Pydantic para Materiales y Costos es un modelo de demo/transporte distinto de la entidad SQLAlchemy Proyecto. No reutilizar el contrato demo como tabla.
- El tablero muestra proyectos de demostración y la pantalla de acceso acepta credenciales fijas de demostración. Ninguno representa identidad o persistencia real.
- Consolidado acepta MO y datos demo de materiales, normaliza valores y devuelve totales; su endpoint no guarda datos. No cambiar este contrato en Fase 1.

### APIs existentes

- `GET /`, `GET /health`.
- `GET /api/v1/catalogo`, lectura paginada de `maestro_partidas`.
- `GET /api/v1/partidas` y `POST /api/v1/partidas`, capítulos/partidas/APU existentes.
- `GET /api/v1/materiales-costos/demo`, `POST .../calcular` y `POST .../renta`, basados en demo/cálculo.
- `POST /api/consolidado` y `POST /api/consolidado/resumen`, sin persistencia.
- No existen APIs de empresas, usuarios, membresías, CRUD de proyectos/versiones, ni de persistencia MO.
- No existen mecanismos actuales de autenticación/autorización para API. CORS no es un control de acceso.

### Dependencias relevantes

- Backend: FastAPI, SQLAlchemy, psycopg2, Pydantic y Uvicorn; no se identificó un framework de autenticación, migrador de esquema o cliente de pruebas HTTP en dependencias.
- Frontend: React, TypeScript, Vite y lucide-react; no se identificó cliente HTTP general ni biblioteca de estado remoto.
- Mantener los gestores y dependencias actuales; no agregar paquetes salvo necesidad demostrada.

### Situación local al inicio

Se observan cambios locales preexistentes en `frontend/BITACORA.md` y archivos no rastreados `ARQUITECTURA_DATOS_V1.md` y `DOCUMENTACION_TECNICA.md`. No se revertirán, sobrescribirán ni incluirán como parte de esta fase.

## Impacto por módulo

| Módulo/superficie | Impacto previsto | Garantía de compatibilidad |
|---|---|---|
| Backend de persistencia | Agrega tablas y endpoints para organización, proyectos, versiones, MO y auditoría; amplía opcionalmente Proyecto con empresa. | Migraciones aditivas; conservar tablas, IDs, columnas, enums y rutas actuales. No usar `drop_all` ni renombrar columnas operativas. |
| Mano de Obra | Integra carga y guardado de actividades/configuración a una versión del proyecto; ofrece recuperación, nueva versión y comparación. | Mantener `calcularCronogramaCompleto`, tipos de cálculo, fórmulas y Excel. Persistir entradas, recalcular con el motor actual y contrastar totales. |
| Tablero/flujo de proyecto | Reemplaza únicamente datos de demostración de proyectos con lectura/creación persistente; permite empresa/proyecto/versión. | Conservar navegación, estilos y acceso de demostración existente; no sustituir pantallas de módulos ni Consolidado. Mantener opción clara de volver al demo si backend no está configurado. |
| Consolidado | Sin cambio funcional previsto; se puede proporcionar la MO ya cargada al módulo existente. | Endpoints y tipos de Consolidado permanecen byte/shape compatibles; los datos de materiales continúan etiquetados como demo hasta otra fase. |
| Catálogo Maestro | Sin cambio funcional. | Mantener consulta, filtros, paginación, filas históricas y endpoint. |
| Materiales y Costos | Sin cambio en cálculo ni datos de demo. | Mantener los contratos de demo, cálculo y renta, sin convertir demos en costos persistidos. |
| APU/Partidas | Sin cambios funcionales; el Proyecto persistido nuevo puede convivir con proyectos existentes. | Mantener `TipoAPU`, columnas, rutas, serialización y relaciones existentes. No vincular partidas de forma automática. |
| Exportación Excel | Sin cambio de contenido/fórmulas/exportación. | Seguir pasando al exportador las actividades/configuración recuperadas mediante los mismos tipos usados hoy. |
| Documentación de operación | Añadir guías de migración, ejecución, límites de acceso y reportes por etapa. | No alterar instrucciones existentes fuera de correcciones estrictamente requeridas. |

## Plan de migraciones

Las migraciones se aplicarán explícitamente y en orden contra PostgreSQL. `create_all()` puede seguir creando tablas ausentes en desarrollo, pero no sustituye la aplicación/verificación de migraciones ni agrega columnas a tablas existentes. Cada migración tendrá verificación posterior y no ejecutará borrados.

### Migración 002 — organización y base de proyectos versionados

**Tablas nuevas**

- `empresas`: ID, razón/nombre, identificador fiscal opcional, país, moneda base, estado y marcas de tiempo.
- `usuarios`: ID, nombre, correo normalizado único, estado y marcas de tiempo. No guardar contraseñas en texto claro; la autenticación no está implementada por los módulos actuales.
- `membresias_empresa`: empresa, usuario, rol, estado, fechas y actor de creación; unicidad por empresa/usuario.
- `versiones_proyecto`: proyecto existente, número de versión, estado, motivo, actor, fecha y referencia a versión anterior; unicidad por proyecto/número.
- `auditoria_eventos`: actor/tipo de actor, empresa/proyecto, acción, entidad y clave afectada, fecha UTC, motivo, origen/correlación y JSON de diferencias antes/después; índices por entidad, proyecto y tiempo.

**Ampliaciones**

- `proyectos.empresa_id` nullable durante transición, FK a `empresas` con borrado restringido.
- Agregar metadatos de actualización solo si el modelo/API de proyecto existente requiere esa información y se confirma ausencia de columna equivalente.
- Crear una empresa de migración y asociar proyectos existentes solo mediante una decisión de migración explícita y auditable; no inferir propietarios por nombre.

**Índices, restricciones y claves**

- Unicidad de correo normalizado; unicidad `(empresa_id, usuario_id)` y `(proyecto_id, numero_version)`.
- Índices a las FKs y a `(proyecto_id, creado_en)` de auditoría.
- Checks de cadenas requeridas no vacías, número de versión positivo y estados válidos mediante restricción o enum compatible.
- FKs nuevas con `RESTRICT` para preservar historia; sin cascade delete hacia empresa/usuario/proyecto.

### Migración 003 — persistencia y versionado de Mano de Obra

**Tablas nuevas**

- `presupuestos_mo_versiones`: referencia única a `versiones_proyecto`, configuración laboral completa y versionada, versión del esquema/cálculo, total persistido, fecha, autor y estado. Una revisión de proyecto tiene como máximo un snapshot MO.
- `presupuestos_mo_lineas`: líneas ordenadas asociadas al snapshot, ID de origen estable, item, descripción, unidad, cantidad, rendimiento, cuadrilla (oficiales/ayudantes) y ratio; unicidad de orden/ID dentro del snapshot.
- `auditoria_eventos` recibirá eventos de creación de versiones, guardado/cambio de MO, restauración y comparación/decisión cuando corresponda.

**Índices, restricciones y claves**

- FK de snapshot a versión de proyecto y FK de líneas a snapshot, con borrado restringido o borrado lógico controlado.
- Índices por versión de proyecto, snapshot y orden de línea.
- Check de números no negativos y unidades/texto requeridos no vacíos. Los valores decimales deben conservar la precisión suficiente del cálculo actual.
- Guardar la configuración laboral capturada en la versión, no leer valores por defecto actuales al recuperar una versión anterior.

### Política de ejecución y rollback

- Usar scripts idempotentes (`IF NOT EXISTS` cuando sea aplicable), transacción y una tabla de historial de migraciones si no existe mecanismo fiable para evitar reaplicaciones.
- Verificar columnas, tablas, índices, FKs y conteos después de cada script. La aplicación debe fallar explícitamente si un requisito de esquema está incompleto.
- Tomar respaldo antes de aplicar a una base con datos reales. Rollback operativo: desactivar rutas/función nueva y corregir con migración forward; no borrar tablas con historia para revertir.
- Probar en SQLite en memoria la lógica ORM y en PostgreSQL una base de prueba las migraciones, restricciones y tipos específicos. No ejecutar migraciones sobre la base productiva como parte de pruebas.

## Plan de APIs

Todos los endpoints nuevos se montarán bajo `/api/v1`; las APIs existentes no cambian de ruta ni de shape.

### Endpoints nuevos previstos

| Método y ruta | Propósito |
|---|---|
| `GET/POST /api/v1/empresas` | Listar y crear empresas. |
| `GET/POST /api/v1/usuarios` | Listar y crear usuarios de directorio, con correo normalizado. |
| `GET/POST /api/v1/empresas/{empresa_id}/membresias` | Listar y asociar usuario a empresa con rol/estado. |
| `GET/POST /api/v1/proyectos` | Listar proyectos persistidos por empresa y crear proyecto asociado. |
| `GET /api/v1/proyectos/{proyecto_id}/versiones` | Listar versiones del proyecto. |
| `POST /api/v1/proyectos/{proyecto_id}/versiones` | Crear siguiente versión a partir de una versión existente o de una base vacía, indicando motivo/actor. |
| `GET /api/v1/proyectos/{proyecto_id}/versiones/{version_id}` | Recuperar metadatos y datos versionados permitidos. |
| `GET/PUT /api/v1/proyectos/{proyecto_id}/versiones/{version_id}/mano-obra` | Leer/guardar snapshot completo de configuración y actividades de MO de la versión; validar pertenencia proyecto/versión. |
| `GET /api/v1/proyectos/{proyecto_id}/mano-obra/comparar?desde={id}&hasta={id}` | Comparar configuración, líneas agregadas/eliminadas/modificadas y totales derivados. |
| `GET /api/v1/proyectos/{proyecto_id}/auditoria` | Consultar historial paginado y filtrado por entidad/versión/fecha. |

### Reglas de compatibilidad

- Las rutas actuales de catálogo, partidas/APU, materiales/costos y consolidado no se modifican.
- Mantener modelos Pydantic y serialización camelCase/snake_case existentes para clientes actuales; crear schemas nuevos para funcionalidades nuevas.
- Los IDs existentes conservan formato y semántica. Errores HTTP deben distinguir validación (422), inexistencia (404) y conflicto por duplicidad/estado (409).
- El guardado MO es transaccional: snapshot, líneas y auditoría se confirman juntos. Reintento con los mismos datos debe tener comportamiento definido y no crear versiones duplicadas.
- Comparación es de solo lectura y no altera versiones.
- La creación de versión copia datos fuente seleccionados; nunca modifica la versión de origen.

### Identidad y seguridad (riesgo abierto)

La aplicación actual no autentica ni autoriza usuarios. Crear directorio de usuarios y membresías no equivale a login. Para esta implementación, no se debe presentar la membresía como un límite de seguridad efectivo ni exponer datos reales en una instalación pública. Antes de operación multiempresa en producción se requiere decisión e implementación de autenticación, autorización por membresía y migración segura del acceso de demostración. No aceptar una identidad de actor enviada por el navegador como prueba de autenticación; etiquetar eventos de sistema/demo y mantener clara esta limitación.

## Plan Frontend

### Pantallas/componentes que cambian

- Tablero central: listar proyectos persistidos, crear empresa/proyecto según el flujo y abrir una versión de proyecto; indicar estados de carga y error del backend.
- Nueva interfaz de administración inicial: creación de usuario y asociación con empresa, con validación de campos y errores devueltos por API.
- Contenedor de Mano de Obra: aceptar proyecto/versión seleccionados, cargar snapshot cuando exista y guardar cambios explícitamente.
- Controles de versiones: listar, crear V2 desde V1, cambiar versión activa y abrir comparación sin editar V1.
- Comparador de MO: presentar cambios por partida, configuración laboral y total; no reemplazar las tablas/vistas existentes de MO.

### Pantallas que permanecen iguales

- Tablas y fórmulas de Mano de Obra, cronograma, planilla calculada y exportación Excel.
- Catálogo Maestro, Materiales y Costos, APU/estructura de costos y Consolidado.
- Pantalla de acceso de demostración hasta que autenticación sea un alcance aprobado; mostrar explícitamente que es demo y no usarla para control de acceso.

### Comportamiento fuera de línea/backend no disponible

- Reportar fallo de persistencia con claridad; no mostrar “guardado” ni sustituir silenciosamente una versión persistida por datos locales.
- Mantener la navegación y el uso de demo actual cuando corresponda, separado del flujo persistente.
- Evitar que la recarga de página borre datos que el usuario esperaba guardar; solicitar guardar o indicar el estado sin persistir.

## Riesgos

| Riesgo | Nivel | Mitigación/condición |
|---|---|---|
| La API carece de autenticación/autorización; CORS no protege datos. | Crítico para producción multiempresa | Limitar entorno de Fase 1; actor técnico explícito y evidencia de demo; exigir diseño/aprobación de autenticación antes de datos sensibles o exposición pública. |
| `create_all()` no migra tablas existentes y `RESET_DB_SCHEMA_ON_STARTUP` puede borrar el esquema. | Alto | Migraciones SQL explícitas, chequeos de versión y salvaguarda para no permitir reset fuera de desarrollo aislado. |
| Proyecto existente no posee empresa ni versiones, y los proyectos actuales pueden tener datos. | Alto | Empresa de transición identificada; FK nullable durante corte; no asignación por inferencia ni borrado de datos. |
| Cambiar el Tablero/estado de MO puede desalinear los cálculos/Excel existentes. | Alto | Persistir entradas y recalcular con función existente; pruebas de caracterización; conservar tipos de exportador. |
| Copiar una versión y persistir MO parcialmente puede perder configuración o producir una versión no reproducible. | Alto | Snapshot transaccional de config + líneas + versión del algoritmo; pruebas de round-trip y transacción. |
| Dos usuarios modifican la misma versión en concurrencia. | Medio/alto | Agregar control de revisión/`updated_at` y responder 409 ante escritura basada en estado obsoleto; nunca sobrescribir sin detección. |
| SQLite no replica semántica de PostgreSQL, JSONB, constraints o migraciones. | Medio | Pruebas rápidas en SQLite y suite de integración PostgreSQL antes de declararlo compatible en producción. |
| Datos de demo se confunden con registros reales. | Alto | Proveniencia/etiquetas visibles; no migrar automáticamente demo a persistencia. |
| Datos personales o auditoría se retienen sin política. | Medio | Minimización, autorización futura, no guardar credenciales/secretos, definir retención antes de uso real. |

## Validaciones

### Compatibilidad existente

- Ejecutar toda la suite de backend antes/después; comparar conteos, endpoints y cálculos actuales.
- Ejecutar `npm run lint` y `npm run build` en frontend.
- Probar con `TestClient` los códigos, payloads, errores y shape de rutas existentes y nuevas, respaldado por PostgreSQL de prueba.
- Verificar que migraciones no cambien filas/IDs de `maestro_partidas`, materiales, precios, proyectos/capítulos/partidas/APU existentes.
- Comparar las fórmulas MO antes/después para una misma actividad/configuración; validar hojas/valores base de exportación Excel.

### Persistencia y auditoría

- Guardar empresa, usuario, membresía, proyecto, V1 y snapshot MO; cerrar/recrear sesión de base y recuperar valores iguales.
- Crear V2 desde V1; modificar una actividad y una configuración; comprobar que V1 no cambia, V2 sí cambia y la comparación identifica exactamente las diferencias.
- Rechazar correo/versión duplicados y referencias cruzadas a otra empresa/proyecto según la regla definida.
- Probar atomicidad: si falla una línea, no quedan snapshot/versión parcial ni evento de éxito falso.
- Verificar actor/fecha/acción/entidad/motivo y cambios antes/después para cada mutación relevante.
- Reiniciar backend sobre la base de prueba y verificar conservación de todos los datos.

## Criterios de aceptación

1. Los siete pasos definidos (Empresa, Usuario/Membresía, Proyecto, VersionProyecto, Auditoría, persistencia MO, versionamiento MO) tienen cambios y reporte documentados.
2. Es posible crear una empresa, usuario y membresía; crear proyecto y V1; guardar MO, detener/reiniciar backend y recuperar exactamente entradas y configuración.
3. Es posible crear V2 derivada de V1, editar MO en V2 y comparar; V1 queda inalterada y el diferencial describe las modificaciones efectivas.
4. Toda escritura de negocio aceptada deja evento de auditoría correlacionable, con fecha, acción, objeto, motivo y diferencias; el actor se registra cuando se proporciona. La identidad aún no está autenticada.
5. Migraciones son aditivas, ordenadas y verificables; no se pierde ni modifica ningún registro histórico por inferencia.
6. APIs actuales de catálogo, partidas/APU, demo de materiales/costos y consolidado conservan rutas y formas de respuesta.
7. El cálculo MO y Excel continúan usando los mismos modelos y resultados para entradas equivalentes.
8. Backend, lint y build de frontend pasan; pruebas de integración PostgreSQL demuestran migraciones y persistencia de extremo a extremo.
9. Los riesgos de acceso sin autenticación y alcance de producción se declaran claramente; no se afirma seguridad multiempresa que todavía no existe.

## Secuencia de ejecución prevista

1. Congelar diagnóstico y pruebas base; registrar contratos de compatibilidad.
2. Implementar y validar Etapa 1: Empresa.
3. Implementar y validar Etapa 2: Usuario y MembresíaEmpresa.
4. Implementar y validar Etapa 3: Proyecto.
5. Implementar y validar Etapa 4: VersionProyecto.
6. Implementar y validar Etapa 5: Auditoría.
7. Implementar y validar Etapa 6: persistencia y recuperación MO.
8. Implementar y validar Etapa 7: versionamiento y comparación MO.
9. Generar `REPORTE_ETAPA_1.md` a `REPORTE_ETAPA_7.md` con archivos, migraciones, APIs, evidencia, riesgos y estado de cada etapa.
10. Emitir `FASE1_RESULTADO_FINAL.md` únicamente al cumplir los criterios de aceptación; si un requisito queda bloqueado (por ejemplo, PostgreSQL no disponible), identificarlo como pendiente y no declarar la fase completa.

**Límite de alcance:** esta fase no implementa presupuesto maestro, catálogo unificado de recursos, autenticación de producción, materiales/equipos/subcontratos persistentes, integración IA ni reemplazo de módulos actuales. Deja sus vínculos y extensión preparados sin simular que ya están operativos.

## Resultado de la ejecución

Las siete etapas se implementaron de forma aditiva. Las migraciones compartidas fueron `002_fase1_organizacion_proyectos.sql` para organización/proyectos/versiones/auditoría y `003_fase1_mano_obra.sql` para persistencia/versionamiento de Mano de Obra. No se creó una migración por etapa cuando eso habría separado objetos del mismo cambio coherente.

| Etapa | Reporte | Estado |
|---|---|---|
| 1. Empresa | [REPORTE_ETAPA_1.md](./REPORTE_ETAPA_1.md) | Completada |
| 2. Usuario y MembresíaEmpresa | [REPORTE_ETAPA_2.md](./REPORTE_ETAPA_2.md) | Completada con limitación de seguridad |
| 3. Proyecto | [REPORTE_ETAPA_3.md](./REPORTE_ETAPA_3.md) | Completada |
| 4. VersionProyecto | [REPORTE_ETAPA_4.md](./REPORTE_ETAPA_4.md) | Completada |
| 5. Auditoría | [REPORTE_ETAPA_5.md](./REPORTE_ETAPA_5.md) | Completada con deuda de gobierno |
| 6. Persistencia de Mano de Obra | [REPORTE_ETAPA_6.md](./REPORTE_ETAPA_6.md) | Completada |
| 7. Versionamiento de Mano de Obra | [REPORTE_ETAPA_7.md](./REPORTE_ETAPA_7.md) | Completada |

La verificación final ejecutada después de los últimos cambios reportó 16 pruebas backend aprobadas, lint TypeScript aprobado y build de producción aprobado. La evidencia de integración PostgreSQL y el estado de seguridad se detallan en [FASE1_RESULTADO_FINAL.md](./FASE1_RESULTADO_FINAL.md).
