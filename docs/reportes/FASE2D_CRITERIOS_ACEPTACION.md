# Fase 2D — Criterios de Aceptación del Presupuesto Maestro

**Producto:** COS — Construction Operating System  
**Fase:** 2D  
**Estado:** Criterios para futura implementación y certificación; no son evidencia de ejecución  
**Documento de arquitectura:** [FASE2D_ARQUITECTURA_PRESUPUESTO_MAESTRO.md](../arquitectura/FASE2D_ARQUITECTURA_PRESUPUESTO_MAESTRO.md)  
**Definiciones obligatorias:** [ANEXO_FASE2D_DEFINICIONES_NEGOCIO_V1.md](../anexos/ANEXO_FASE2D_DEFINICIONES_NEGOCIO_V1.md)

> Este documento define cómo se aprobará la futura implementación. No contiene código, migraciones ni resultados de pruebas ejecutadas.

## 1. Propósito

Comprobar que el Presupuesto Maestro funciona como núcleo financiero del proyecto y no como un resumen financiero aislado. La aceptación debe demostrar integración, reproducibilidad, comparación, versionamiento, trazabilidad y preservación histórica.

## 2. Reglas generales de aceptación

La Fase 2D solo podrá aprobarse cuando:

- las pruebas técnicas y funcionales estén ejecutadas y documentadas;
- los módulos de Fase 1, 2A, 2B y 2C continúen funcionando sin regresión;
- cada total pueda explicarse hasta Partida, APU, recurso y fuente de costo;
- una versión aprobada sea reproducible e inmutable;
- las comparaciones incluyan más que totales;
- la auditoría cubra todo cambio sensible;
- no se hayan creado catálogos, lógica o módulos paralelos sin justificación aprobada;
- no existan pérdidas de historial ni conversiones silenciosas;
- la aprobación final sea explícita y esté respaldada por evidencia técnica y funcional.

## 3. Pruebas técnicas

### T-01 — Integridad de pertenencia

Crear o consultar un presupuesto vinculado a Empresa, Proyecto y `VersionProyecto`. Verificar que no sea posible asociar una Partida, APU o recurso de otro proyecto o versión sin una operación explícita de derivación.

**Aceptación:** todas las relaciones son válidas, se rechazan referencias cruzadas inválidas y el error queda registrado.

### T-02 — Reproducibilidad del cálculo

Ejecutar dos veces el cálculo con los mismos snapshots, configuración, tasas, cantidades y versiones de dependencia.

**Aceptación:** el resultado es idéntico dentro de las reglas de precisión y redondeo declaradas; se identifican versión y fuentes usadas.

### T-03 — Precisión financiera

Probar cantidades, precios, rendimientos, mermas, indirectos e impuestos con valores decimales y casos de redondeo.

**Aceptación:** no se usan aproximaciones binarias para persistir costos; las diferencias de redondeo son explicables y no se acumulan silenciosamente.

### T-04 — Unidad y moneda

Intentar calcular con unidades incompatibles y con monedas distintas sin tasa. Repetir con tasa válida, fecha, fuente y dirección.

**Aceptación:** el primer caso se bloquea; el segundo calcula y conserva la evidencia de conversión.

### T-05 — Inmutabilidad histórica

Modificar una cotización, material, APU, configuración o catálogo después de aprobar un presupuesto.

**Aceptación:** la versión aprobada permanece igual; el cambio solo puede expresarse mediante una nueva versión o propuesta.

### T-06 — Derivación de versiones

Crear una nueva versión de proyecto y una nueva versión presupuestaria derivada.

**Aceptación:** se conservan origen, motivo y relaciones; la nueva versión puede cambiar sin alterar la fuente.

### T-07 — Integridad de snapshots

Consultar una línea aprobada después de cambiar nombres, precios o datos activos de sus catálogos.

**Aceptación:** la línea muestra los valores usados originalmente y también permite navegar a la fuente histórica identificada.

### T-08 — Auditoría append-only

Ejecutar cada transición sensible: crear, calcular, editar borrador, enviar a revisión, aprobar, rechazar, superseder y cerrar.

**Aceptación:** cada evento incluye actor o ausencia explícita, fecha UTC, entidad, proyecto, versión, motivo, diff y resultado; no se puede editar ni borrar por el flujo ordinario.

### T-09 — Reconciliación jerárquica

Sumar recursos, APU, Partidas, Capítulos y total general.

**Aceptación:** cada nivel coincide con sus hijos, con ajustes y redondeos documentados.

### T-10 — Compatibilidad regresiva

Ejecutar la suite existente de WBS, APU, materiales, costos, consolidado y versiones de proyecto.

**Aceptación:** no se rompen contratos, datos ni rutas existentes; cualquier adaptación es compatible y está documentada.

### T-11 — Seguridad y permisos

Probar consulta y edición con roles sin permisos, permisos de lectura, edición y aprobación, y usuarios de empresas distintas.

**Aceptación:** se aplica mínimo privilegio y no hay fuga de presupuestos entre empresas/proyectos.

### T-12 — Rendimiento y consistencia

Usar una WBS grande con múltiples capítulos, Partidas, recursos y versiones.

**Aceptación:** paginación, filtros, agregados y cálculo cumplen los objetivos de rendimiento definidos por producto sin omitir líneas ni duplicar importes.

## 4. Pruebas funcionales

### F-01 — Crear un presupuesto desde una versión de proyecto

Seleccionar Empresa, Proyecto y `VersionProyecto`; crear borrador y verificar WBS, Capítulos y Partidas disponibles.

**Aceptación:** la pantalla muestra el contexto correcto y no crea una estructura WBS paralela.

### F-02 — Valorizar una Partida con APU

Seleccionar una Partida con `UsoAPU`, resolver su `VersionAPU`, mostrar recursos y calcular importe.

**Aceptación:** la línea identifica APU, versión, cantidad, unidad, costo unitario, importe y fuentes.

### F-03 — Valorizar materiales con historial

Seleccionar material, proveedor y cotización/precio histórico vigente; registrar el costo en el presupuesto.

**Aceptación:** el historial permanece disponible y el presupuesto conserva la selección exacta.

### F-04 — Validar faltantes

Presentar Partidas sin APU, recursos sin precio, cotizaciones vencidas, unidades incompatibles o monedas sin tasa.

**Aceptación:** el sistema identifica el problema, explica el impacto y bloquea aprobación cuando corresponda.

### F-05 — Revisar y aprobar

Enviar un borrador a revisión, registrar observación y aprobar con usuario autorizado.

**Aceptación:** cambia el estado, se registra la decisión y la versión aprobada queda protegida.

### F-06 — Rechazar y corregir

Rechazar una versión con motivo, derivar una nueva y corregir solo el borrador.

**Aceptación:** la rechazada permanece consultable y la nueva conserva su relación de origen.

### F-07 — Comparar versiones

Comparar dos versiones con cambios en cantidad, APU, material, proveedor, precio, WBS y configuración.

**Aceptación:** se muestran diferencias por capítulo, Partida, APU, recurso, costo y riesgo, no solo el total.

### F-08 — Consultar trazabilidad

Desde el total, abrir capítulo, Partida, APU, línea de recurso, precio/proveedor y auditoría.

**Aceptación:** el recorrido es completo y no contiene datos sin fuente identificable.

### F-09 — Exportar una versión

Exportar un presupuesto aprobado y consultar sus metadatos.

**Aceptación:** el artefacto identifica versión, parámetros, plantilla, fecha y evidencia; una exportación no modifica el presupuesto.

### F-10 — IA como asistente

Solicitar explicación de una variación o recomendación de optimización.

**Aceptación:** la respuesta cita datos y supuestos, distingue recomendación de decisión y no cambia ni aprueba el presupuesto automáticamente.

## 5. Casos reales mínimos

### R-01 — Presupuesto de licitación

Una `VersionProyecto` contiene WBS, capítulos, partidas y APU con materiales cotizados por varios proveedores. Deben compararse opciones y aprobarse una versión de licitación.

**Debe demostrar:** estructura completa, costos trazables, selección de cotizaciones, moneda, comparación y aprobación.

### R-02 — Cambio de precio durante construcción

Después de aprobar, un proveedor registra un nuevo precio de material.

**Debe demostrar:** historial conservado, presupuesto aprobado sin cambios y nueva versión con variación explicada.

### R-03 — Cambio de alcance

Se agrega, elimina o modifica una Partida dentro de una nueva `VersionProyecto`.

**Debe demostrar:** derivación, diferencias WBS/Partida, impacto económico y trazabilidad del motivo.

### R-04 — Actualización de APU

Se corrige rendimiento o se sustituye un recurso de una versión APU.

**Debe demostrar:** nueva `VersionAPU`, uso nuevo, presupuesto derivado y conservación del costo anterior.

### R-05 — Monedas y proveedores

Una cotización está en moneda distinta a la moneda base y requiere tasa histórica.

**Debe demostrar:** tasa fechada y fuente, valor original, valor normalizado y comparación sin mezcla silenciosa.

### R-06 — Datos heredados incompletos

Se carga una Partida histórica sin correspondencia inequívoca con APU o recurso.

**Debe demostrar:** clasificación como legado/pendiente, advertencia y ausencia de transformación inventada.

### R-07 — Auditoría y responsabilidad

Un usuario edita un borrador y otro usuario aprueba la versión.

**Debe demostrar:** separación de responsabilidades, actor, motivo, eventos y decisión final.

## 6. Criterios de no aceptación

La fase se rechaza o queda pendiente si ocurre cualquiera de estos casos:

- el Presupuesto Maestro recalcula o duplica de forma independiente WBS, APU, materiales o precios;
- un presupuesto aprobado cambia por editar un catálogo o cotización;
- no se puede reproducir un total desde sus entradas;
- se mezclan unidades o monedas sin validación y evidencia;
- la comparación solo muestra el total;
- faltan auditoría, actor, motivo o versión de dependencia;
- se pierde historial o se borran datos referenciados;
- se rompe un módulo o contrato previamente aprobado;
- una recomendación de IA modifica o aprueba datos sin decisión humana;
- se presentan datos demo como si fueran persistencia operativa;
- se implementan migraciones o código sin autorización de la fase correspondiente.

## 7. Evidencia requerida para certificar

La futura entrega debe adjuntar:

- matriz de pruebas con identificador, fecha, ambiente, resultado y responsable;
- capturas o recorrido de la pantalla principal y detalle de trazabilidad;
- resultados de pruebas técnicas, funcionales y regresión;
- evidencia de cálculo reproducible y reconciliación jerárquica;
- evidencia de inmutabilidad y auditoría;
- evidencia de comparación multinivel;
- inventario de APIs y compatibilidad de contratos;
- inventario de migraciones aplicadas, respaldo y verificación;
- casos reales con datos anonimizados o autorizados;
- listado de riesgos abiertos, decisiones y excepciones aceptadas;
- firma o aprobación de Dirección/Product Owner y responsables técnico, financiero y de auditoría.

## 8. Criterio final de aprobación de Fase 2D

Fase 2D se aprueba únicamente cuando el comité responsable confirme que el Presupuesto Maestro:

1. es el núcleo y la única fuente de verdad financiera del proyecto;
2. integra `VersionProyecto`, WBS, Capítulos, Partidas, APU, Recursos y Costos;
3. conserva historial, snapshots, trazabilidad y auditoría;
4. calcula con reglas, unidades, monedas y versiones reproducibles;
5. compara integralmente dos o más versiones;
6. mantiene compatibilidad con los módulos aprobados;
7. permite una decisión humana informada y no automatiza aprobaciones;
8. supera todas las pruebas críticas y no tiene criterios de no aceptación abiertos;
9. cuenta con evidencia suficiente para que un tercero pueda reconstruir y explicar cualquier total.

La aprobación de estos criterios no autoriza por sí sola código, migraciones o despliegue. Es la puerta de control para iniciar una fase de implementación expresamente aprobada.

