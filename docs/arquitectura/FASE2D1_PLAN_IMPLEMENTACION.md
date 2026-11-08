# Fase 2D.1 — Plan de Implementación del Presupuesto Maestro Mínimo Operativo

**Producto:** COS — Construction Operating System  
**Fase:** 2D.1  
**Estado:** Plan previo a implementación  
**Alcance:** Presupuesto Maestro mínimo operativo, persistente y visible extremo a extremo  
**Fuera de alcance:** comparación avanzada, cronograma financiero, flujo de caja, reportes ejecutivos, IA, consolidado final, equipos, subcontratos y otros costos  
**Base de negocio obligatoria:** [ANEXO_FASE2D_DEFINICIONES_NEGOCIO_V1.md](../anexos/ANEXO_FASE2D_DEFINICIONES_NEGOCIO_V1.md)

> Este plan precede al código. La implementación debe respetar las fases aprobadas y preservar los módulos existentes.

## 1. Objetivo técnico

Implementar el primer corte operativo del Presupuesto Maestro para una `VersionProyecto`, reutilizando WBS, Capítulos, Partidas, APU, Materiales, costos persistidos y auditoría.

El resultado mínimo será:

```text
Proyecto → Versión → Capítulo → Partida → Costo → Total capítulo → Total proyecto
```

Los importes deben persistir y recuperarse después de cerrar y reabrir la sesión.

## 2. Decisiones de alcance

- Un `PresupuestoMaestro` corresponde a una `VersionProyecto`.
- El costo unitario fuente de una Partida será el último `UsoAPU` válido asociado a esa Partida; si no existe, se podrá utilizar el costo persistido existente en `Partida.costo_unitario`, identificado como legado/persistido.
- El importe de la Partida se calcula como `cantidad × costo_unitario` con `Decimal`.
- El total de Capítulo es la suma de los importes persistidos de sus Partidas.
- El total general es la suma de los totales de Capítulo.
- No se agregan indirectos, impuestos, equipos, subcontratos, otros costos ni moneda extranjera en esta subfase.
- No se reemplaza `consolidado`, `PresupuestoMOBorrador`, `AnalisisPrecioUnitario`, `VersionAPU`, `UsoAPU` ni la estructura WBS.
- Una modificación de Partida o Capítulo recalcula el presupuesto de la versión mediante un único servicio de dominio.

## 3. Entidades nuevas

### 3.1 PresupuestoMaestro

Agregado raíz persistido para una versión de proyecto.

Campos conceptuales:

- `id`;
- `proyecto_id`;
- `version_proyecto_id`;
- `estado`;
- `moneda` tomada de la Empresa;
- `total_general`;
- `revision` para detectar recálculos;
- `algoritmo_version`;
- `creado_en`, `actualizado_en`;
- actor y motivo de la última operación cuando corresponda.

Restricción: un registro por `version_proyecto_id` en Fase 2D.1.

### 3.2 PresupuestoMaestroPartida

Snapshot operativo de cada Partida incluida en el cálculo.

Campos conceptuales:

- `id`;
- `presupuesto_maestro_id`;
- `partida_id`;
- `capitulo_id`;
- código, descripción y unidad snapshot;
- cantidad snapshot;
- costo unitario snapshot;
- importe total;
- origen del costo: `uso_apu` o `partida_persistida`;
- `version_apu_id` opcional cuando proviene de APU;
- `uso_apu_id` opcional para trazabilidad;
- fecha de cálculo.

Restricción: una línea por Partida dentro del Presupuesto Maestro.

### 3.3 PresupuestoMaestroCapitulo

Snapshot agregado de cada Capítulo.

Campos conceptuales:

- `id`;
- `presupuesto_maestro_id`;
- `capitulo_id`;
- código y nombre snapshot;
- total del Capítulo;
- número de Partidas incluidas;
- fecha de cálculo.

Restricción: una línea por Capítulo dentro del Presupuesto Maestro.

No se crea una tabla de costos nueva. Los costos se leen de `UsoAPU`/`VersionAPU` o de `Partida.costo_unitario`; las tablas nuevas congelan el resultado mínimo necesario para persistencia y trazabilidad.

## 4. Relaciones

```text
Empresa 1 ── N Proyecto
Proyecto 1 ── N VersionProyecto
VersionProyecto 1 ── N Capitulo
Capitulo 1 ── N Partida
Partida 1 ── N UsoAPU ── 1 VersionAPU
VersionProyecto 1 ── 1 PresupuestoMaestro
PresupuestoMaestro 1 ── N PresupuestoMaestroCapitulo
PresupuestoMaestro 1 ── N PresupuestoMaestroPartida
PresupuestoMaestroPartida N ── 1 Partida
PresupuestoMaestroCapitulo N ── 1 Capitulo
```

Las claves foráneas deben restringir el borrado de un presupuesto con historial. La pertenencia de Partida y Capítulo a la misma `VersionProyecto` se valida en el servicio antes de calcular.

## 5. Backend y servicio de cálculo

Crear un servicio único `PresupuestoMaestroService` con estas responsabilidades:

1. Resolver Proyecto y `VersionProyecto`.
2. Cargar WBS de la versión.
3. Resolver el costo fuente por Partida:
   - último `UsoAPU` de la versión y su `VersionAPU.costo_unitario`;
   - fallback explícito a `Partida.costo_unitario` cuando sea mayor o igual a cero y no exista uso APU.
4. Calcular importes con `Decimal`.
5. Reemplazar de forma transaccional los snapshots del presupuesto para la revisión actual.
6. Calcular totales por Partida, Capítulo y proyecto.
7. Registrar la auditoría mínima con origen, actor, motivo y valores nuevos.

El servicio no debe llamar al consolidado final ni duplicar fórmulas de Mano de Obra o Materiales. Los precios APU/materiales permanecen en sus módulos existentes.

## 6. APIs requeridas

Todas bajo `/api/v1` y con el contexto `proyectos/{proyecto_id}/versiones/{version_id}`.

| Operación | Ruta conceptual | Resultado |
|---|---|---|
| Obtener presupuesto | `GET /proyectos/{proyecto}/versiones/{version}/presupuesto-maestro` | agregado con totales, capítulos y partidas |
| Calcular/guardar | `POST /proyectos/{proyecto}/versiones/{version}/presupuesto-maestro/calcular` | crea o recalcula y persiste el agregado |
| Actualizar costo persistido | `PUT /proyectos/{proyecto}/versiones/{version}/capitulos/{capitulo}/partidas/{partida}/costo` | actualiza el costo existente de la Partida y recalcula |
| Auditoría | `GET /proyectos/{proyecto}/versiones/{version}/presupuesto-maestro/auditoria` | eventos del agregado y sus recalculaciones |

El API no acepta un total general enviado por frontend como fuente de verdad. El backend calcula, persiste y devuelve el resultado.

## 7. Cambios frontend

Agregar una sección **Presupuesto Maestro** en el contexto de una versión persistida:

- encabezado con Proyecto, Versión y estado;
- tarjetas de Total General y cantidad de Capítulos/Partidas;
- tabla o árbol de Capítulos con total;
- tabla expandible de Partidas con cantidad, costo unitario, origen e importe;
- edición del costo persistido de una Partida para pruebas operativas;
- botón **Calcular y guardar**;
- mensajes de error y confirmación;
- recuperación automática al abrir la versión.

La pantalla debe mostrar que el costo proviene de APU o de un costo persistido. No debe mostrar módulos fuera de Fase 2D.1 ni mezclar el consolidado de demostración con el Presupuesto Maestro.

## 8. Migración

La migración será aditiva y deberá:

1. crear las tres tablas nuevas;
2. agregar claves foráneas, índices y restricciones de unicidad;
3. usar tipos decimales para cantidades e importes;
4. preservar tablas y datos existentes;
5. registrar su versión en el ejecutor actual;
6. permitir creación automática del esquema en los entornos de prueba existentes;
7. no transformar ni borrar APU, materiales, WBS, Partidas, versiones ni auditoría.

La aplicación debe funcionar con bases nuevas y con bases existentes después de aplicar la migración. No se incluirá un backfill destructivo; los presupuestos se crean al solicitar el primer cálculo.

## 9. Auditoría mínima

Registrar como mínimo:

- creación del Presupuesto Maestro;
- cálculo o recálculo;
- cambio de costo persistido de Partida;
- usuario, proyecto, `VersionProyecto`, presupuesto y motivo;
- totales anteriores y nuevos cuando exista recálculo;
- origen de los costos usados.

Se reutilizará `registrar_auditoria` y `AuditoriaEvento` existentes.

## 10. Secuencia de implementación

1. Crear este plan y obtener autorización de implementación.
2. Agregar modelos, relaciones y schemas.
3. Agregar migración aditiva.
4. Implementar servicio único de cálculo.
5. Implementar APIs y auditoría.
6. Implementar sección frontend.
7. Ejecutar pruebas técnicas y regresión backend.
8. Ejecutar build/lint frontend.
9. Ejecutar prueba funcional visual con Tanque Elevado / V1 / Cimentaciones.
10. Documentar evidencia, riesgos, deuda técnica y recomendación 2D.2.

## 11. Criterio de salida

Fase 2D.1 solo puede declararse aprobada si el recorrido visual y persistente demuestra:

```text
Proyecto
  → Versión
    → Capítulo
      → Partida
        → Costo
          → Total Capítulo
            → Total Proyecto
```

No basta con crear tablas o pasar pruebas unitarias aisladas.

