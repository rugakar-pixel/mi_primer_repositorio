# Fase 2D — Arquitectura del Presupuesto Maestro

**Producto:** COS — Construction Operating System  
**Descriptor:** Gerente Administrativo IA para Construcción  
**Estado:** Diseño arquitectónico; no implica implementación, código ni migraciones aplicadas  
**Precondiciones:** Fase 1 aprobada; Fase 2A aprobada; Fase 2B aprobada; Fase 2C aprobada y certificada  
**Definición de negocio rectora:** [ANEXO_FASE2D_DEFINICIONES_NEGOCIO_V1.md](../anexos/ANEXO_FASE2D_DEFINICIONES_NEGOCIO_V1.md)

> Este documento diseña el Presupuesto Maestro. No autoriza todavía su implementación. Las definiciones del anexo aprobado tienen prioridad sobre cualquier decisión técnica descrita aquí.

## 1. Objetivo de negocio

El Presupuesto Maestro será el núcleo financiero del proyecto y la única fuente de verdad financiera para los datos presupuestarios aprobados. Su función no es resumir importes, sino integrar en un mismo corte auditable:

```text
Empresa
  └─ Proyecto
      └─ VersiónProyecto
          └─ WBS
              └─ Capítulos
                  └─ Partidas
                      └─ APU / VersiónAPU
                          └─ Recursos
                              └─ Costos y evidencias
                                  └─ Presupuesto Maestro
```

Debe permitir a COS:

- conocer qué alcance técnico produjo cada importe;
- valorar cada Partida mediante el APU y los recursos efectivamente seleccionados;
- conservar el precio, unidad, moneda, proveedor, cotización, rendimiento y demás supuestos usados;
- comparar cortes del proyecto sin perder información histórica;
- explicar cualquier total desde el nivel de proyecto hasta la línea de recurso;
- servir de base a cronograma, flujo de caja, reportes y futura asistencia del Gerente Administrativo IA;
- detectar diferencias, riesgos, anomalías y oportunidades sin que la IA apruebe cambios por sí misma.

## 2. Definición funcional

### 2.1 Qué es

Una instancia del Presupuesto Maestro es un corte versionado, reproducible y auditable de la realidad económica de una `VersionProyecto`. Incluye el alcance WBS, las Partidas, la cantidad presupuestada, el APU o versión APU aplicada, las líneas de recursos, los costos unitarios y totales, las configuraciones de cálculo, las monedas y tasas, las evidencias y las aprobaciones.

El presupuesto conserva una representación congelada de lo utilizado. Si posteriormente cambia un catálogo, una cotización, un material, un APU o una configuración, el corte histórico no cambia. El cambio se expresa mediante una nueva versión o una nueva propuesta pendiente de aprobación.

### 2.2 Qué no es

- No es una vista agregada que vuelva a calcular datos sin conservar fuentes.
- No es un sustituto de WBS, Partidas, APU, Materiales o VersionProyecto.
- No es un segundo catálogo de recursos ni una segunda lógica de costos.
- No es una copia informal del proyecto.
- No es un mecanismo para sobreescribir presupuestos aprobados.
- No es una autorización automática de compras, contratos o cambios de alcance.

### 2.3 Invariantes funcionales

1. Todo presupuesto pertenece a una Empresa, un Proyecto y una `VersionProyecto`.
2. Toda línea presupuestaria representa una Partida WBS concreta o una justificación explícita de línea especial aprobada por negocio.
3. Una Partida presupuestable debe identificar su Capítulo/WBS, unidad, cantidad y estado.
4. Toda línea con APU debe identificar la `VersionAPU` usada y conservar su snapshot.
5. Todo costo de recurso debe tener fuente, unidad, moneda, vigencia o fecha de referencia y regla de conversión cuando corresponda.
6. Los importes se calculan con precisión decimal y reglas de redondeo declaradas.
7. No se mezclan monedas sin una tasa explícita, con fecha, fuente y dirección.
8. Un corte aprobado es inmutable; una modificación genera una nueva versión.
9. Ningún cambio de catálogo reescribe una versión histórica.
10. Cada operación sensible produce auditoría y conserva actor, motivo y evidencia.

## 3. Entidades requeridas

Las siguientes entidades son el modelo objetivo. Sus nombres son conceptuales; no constituyen todavía un DDL.

| Entidad | Responsabilidad | Datos mínimos congelados o identificadores |
|---|---|---|
| **PresupuestoMaestro** | Agregado financiero raíz del proyecto | proyecto, empresa, versión de proyecto, estado, moneda base, fecha de corte, versión actual, totales derivados |
| **VersionPresupuestoMaestro** | Corte reproducible del presupuesto | número, versión previa, motivo, autor, fecha, estado, checksum o identificador de contenido, configuración y reglas usadas |
| **LineaPresupuesto** | Valor económico de una Partida | partida, capítulo/WBS, cantidad, unidad, precio unitario, importe, APU usado, snapshot técnico y estado |
| **SnapshotPartidaPresupuesto** | Evidencia del estado técnico usado | código, descripción, unidad, capítulo, jerarquía WBS, cantidad y referencias documentales al momento del corte |
| **SnapshotAPUPresupuesto** | Evidencia del análisis aplicado | APU maestro, `VersionAPU`, rendimiento, líneas, cantidades, factores, precios, moneda y costo unitario |
| **LineaRecursoPresupuesto** | Desglose de recursos de una línea | recurso, tipo, cantidad, unidad, precio, moneda, costo parcial, fuente y snapshot |
| **ReferenciaCosto** | Procedencia verificable del costo | material, proveedor, cotización/precio histórico, fecha, vigencia, documento, tasa y regla de selección |
| **ConfiguracionPresupuesto** | Parámetros y supuestos del cálculo | indirectos, impuestos, cargas, desperdicios, redondeo, moneda, tasas, vigencia, jurisdicción y aprobación |
| **TotalesPresupuesto** | Resultados por nivel | directo, indirecto, impuestos, ajustes, total por capítulo, partida, recurso y moneda normalizada |
| **ComparacionPresupuesto** | Resultado de comparar dos versiones | versión origen/destino, diferencias por nivel, porcentajes, altas, bajas, modificaciones, riesgos y autor |
| **AprobacionPresupuesto** | Decisión formal sobre un corte | actor, rol, fecha, decisión, motivo, alcance, condiciones y evidencia |
| **AuditoriaEvento** | Registro append-only del ciclo de vida | actor, acción, entidad, valores antes/después o diferencia, motivo, fecha, proyecto, versión y correlación |

Se reutilizan, sin duplicar su identidad, `Empresa`, `Proyecto`, `VersionProyecto`, WBS, `Capítulo`, `Partida`, `APUMaestro`, `VersionAPU`, `UsoAPU`, `Material`, `Proveedor`, `MaterialPrecio`/cotización, tasas y auditoría existentes.

## 4. Relaciones

```text
Empresa 1 ── N Proyecto
Proyecto 1 ── N VersionProyecto
VersionProyecto 1 ── N Capítulo/WBS
Capítulo/WBS 1 ── N Partida
Partida 1 ── N UsoAPU ── 1 VersionAPU ── 1 APUMaestro
VersionAPU 1 ── N LíneaAPU ── 1 Recurso
Recurso ── Material ── Proveedor ── Cotización/PrecioHistórico
VersionProyecto 1 ── N VersionPresupuestoMaestro
VersionPresupuestoMaestro 1 ── N LineaPresupuesto
LineaPresupuesto 1 ── N LineaRecursoPresupuesto
VersionPresupuestoMaestro 1 ── 1 ConfiguracionPresupuesto
VersionPresupuestoMaestro 1 ── 1 TotalesPresupuesto
VersionPresupuestoMaestro N ── N ComparacionPresupuesto
Todas las operaciones sensibles ── N AuditoriaEvento
```

Reglas de relación:

- La `VersionProyecto` es el límite de alcance. No se incorporan Partidas de otra versión sin una operación explícita de derivación.
- WBS y Partidas siguen siendo la estructura técnica; el Presupuesto Maestro únicamente agrega su dimensión económica y sus snapshots.
- `UsoAPU` es la asociación versionada existente. El presupuesto debe reutilizarla y no crear una relación paralela APU-Partida.
- Las líneas de recursos deben referir al recurso y conservar el valor usado. La referencia viva permite trazabilidad; el snapshot garantiza reproducibilidad.
- Un material puede tener varios proveedores y precios históricos. La selección usada en un presupuesto se identifica de forma inequívoca.
- La suma de líneas de recurso forma el costo directo del APU; los indirectos, impuestos y demás ajustes se aplican conforme a una configuración versionada y visible.
- El presupuesto puede tener varias versiones, pero solo una versión puede estar vigente para el estado operativo definido por negocio.

## 5. Flujo de cálculo

### 5.1 Preparación y validación

1. Seleccionar Empresa, Proyecto y `VersionProyecto`.
2. Seleccionar el corte o iniciar una nueva versión presupuestaria derivada.
3. Validar que la versión del proyecto tenga WBS, Capítulos y Partidas consistentes.
4. Confirmar unidad, moneda base, calendario de precios y configuración de costos.
5. Identificar Partidas sin APU, APU obsoletos, recursos sin precio vigente, unidades incompatibles o datos incompletos.

Una inconsistencia bloqueante impide aprobar el presupuesto; no se corrige silenciosamente.

### 5.2 Valorización por Partida

Para cada Partida incluida:

1. Leer la cantidad y unidad desde la Partida de la `VersionProyecto`.
2. Resolver el `UsoAPU` y la `VersionAPU` seleccionada.
3. Tomar el rendimiento, factores y líneas de recursos de la versión APU.
4. Resolver cada precio conforme a la fuente elegida: material, proveedor, cotización o precio histórico, conservando fecha y vigencia.
5. Validar compatibilidad de unidad y moneda.
6. Convertir únicamente cuando exista una tasa autorizada y registrar la tasa aplicada.
7. Calcular el costo unitario del APU con precisión decimal.
8. Multiplicar costo unitario por cantidad de la Partida.
9. Persistir el importe, los snapshots y los identificadores de origen.

Conceptualmente:

```text
costo_recurso = cantidad_recurso × precio_unitario × factores_de línea
costo_directo_unitario = Σ costo_recurso / unidad_de_APU
importe_partida = cantidad_partida × costo_directo_unitario
```

La fórmula exacta, rendimientos, mermas y factores deben quedar definidos por la configuración y el APU; no se deben inferir valores faltantes.

### 5.3 Consolidación

- Agrupar importes por Partida, Capítulo, nivel WBS, APU, tipo de recurso y moneda.
- Aplicar indirectos, impuestos, cargas u otros componentes según `ConfiguracionPresupuesto` versionada.
- Presentar subtotal directo, ajustes, subtotal indirecto, impuestos y total, distinguiendo importe original y normalizado.
- Verificar que el total superior sea la suma explicable de sus hijos.
- Generar advertencias para redondeos, exclusiones, valores estimados y fuentes vencidas.

La consolidación debe reutilizar los servicios y contratos existentes cuando sean compatibles. El Presupuesto Maestro se convierte en su fuente persistida progresivamente, sin romper respuestas heredadas.

### 5.4 Aprobación y publicación

1. Guardar el cálculo como borrador.
2. Ejecutar validaciones técnicas y funcionales.
3. Registrar revisión, observaciones y responsables.
4. Aprobar o rechazar explícitamente.
5. Al aprobar, congelar la versión, crear la evidencia de aprobación y registrar auditoría.
6. Cualquier ajuste posterior deriva una nueva versión y conserva la anterior.

## 6. Integración con módulos existentes

### 6.1 WBS

- Consumir la jerarquía existente de `VersionProyecto`, Capítulos y Partidas.
- Mantener la identidad y el orden de WBS.
- Guardar en cada línea el camino jerárquico visible al momento del corte.
- Reflejar altas, bajas, movimientos o cambios de cantidad como diferencias entre versiones.
- No crear un árbol presupuestario alterno.

### 6.2 APU

- Reutilizar `APUMaestro`, `VersionAPU` y `UsoAPU`.
- Una línea presupuestaria debe identificar qué versión APU se usó.
- Congelar detalle, rendimiento, factores, líneas de recursos y costo unitario.
- Un cambio en APU no actualiza un presupuesto aprobado; crea una nueva versión presupuestaria o una propuesta que luego se aprueba.
- Las líneas heredadas que no tengan estructura suficiente deben marcarse como legado o no elegibles para aprobación, nunca reinterpretarse automáticamente.

### 6.3 Materiales

- Consumir `Material`, `Proveedor`, cotizaciones y precios históricos existentes.
- Mantener el historial append-only.
- Resolver precios con regla determinista por fecha, moneda, unidad, proveedor y vigencia.
- Guardar material, proveedor, cotización, precio, fecha, origen y snapshot usados en cada línea.
- Una nueva cotización no muta APU ni presupuestos anteriores.
- No convertir un material en una nueva entidad presupuestaria paralela.

### 6.4 VersionProyecto

- Cada presupuesto se ancla a una sola `VersionProyecto`.
- La versión del proyecto define alcance, WBS y Partidas disponibles.
- La derivación de una `VersionProyecto` debe permitir derivar un nuevo corte presupuestario conservando la relación con la versión fuente.
- Estados sugeridos: borrador, en revisión, aprobado, vigente, supersedido, cerrado y rechazado; los nombres finales deben alinearse con el vocabulario de negocio existente.
- La reproducibilidad exige guardar la configuración, fuentes y reglas, no solo el total.

## 7. Auditoría requerida

La auditoría debe cubrir como mínimo:

- creación, derivación, modificación de borrador, envío a revisión, aprobación, rechazo, publicación, supersesión y cierre;
- inclusión, exclusión o sustitución de Partidas;
- asociación, cambio o retiro de `VersionAPU`;
- selección o cambio de material, proveedor, cotización, precio histórico, unidad, moneda o tasa;
- cambios en configuración de costos, supuestos, factores, redondeo e impuestos;
- cambios de cantidad, rendimiento o clasificación WBS;
- exportaciones, comparaciones, restauraciones de vista y accesos a información sensible;
- validaciones fallidas y motivos de bloqueo;
- decisiones humanas relacionadas con recomendaciones de IA.

Cada evento debe incluir actor real o indicador explícito de ausencia de autenticación, fecha/hora UTC, empresa, proyecto, `VersionProyecto`, versión presupuestaria, acción, entidad e ID, motivo, origen de la operación, valores anteriores/nuevos o diff, correlación y resultado. La auditoría es append-only, consultable y protegida contra edición ordinaria.

## 8. Versionamiento requerido

### 8.1 Versiones del presupuesto

- Numeración secuencial dentro del `PresupuestoMaestro`.
- Referencia obligatoria a la versión anterior cuando sea una derivación.
- Motivo de creación: licitación, oferta, contrato, construcción, actualización, cierre u otro aprobado.
- Estados y transiciones explícitos.
- Versiones aprobadas inmutables.
- Snapshot de todas las entradas que afecten el cálculo.
- Identificador de contenido o evidencia equivalente para demostrar que el corte no fue alterado.

### 8.2 Versiones de dependencias

La versión presupuestaria debe registrar los identificadores de `VersionProyecto`, `VersionAPU`, cotizaciones/precios, configuraciones, tasas y documentos utilizados. No se debe copiar todo el catálogo; se congelan los valores pertinentes y se mantienen referencias a las fuentes.

### 8.3 Versiones de configuración

Cada conjunto de tasas, impuestos, indirectos, cargas laborales, desperdicios y reglas de redondeo debe tener vigencia, jurisdicción, fuente, responsable y aprobación. Aplicar una configuración distinta produce un nuevo corte o propuesta.

## 9. Comparación entre versiones

La comparación debe ser integral y explicable, no limitarse al total.

| Nivel | Comparaciones mínimas |
|---|---|
| Proyecto/versión | alcance, estado, moneda, fecha de corte, configuración y supuestos |
| WBS/capítulo | altas, bajas, movimientos, orden, nombre y subtotales |
| Partida | cantidad, unidad, precio unitario, importe, APU, estado y documentos |
| APU | versión, rendimiento, líneas, factores, costo unitario y cambios de estructura |
| Recurso | tipo, cantidad, precio, proveedor, cotización, moneda y vigencia |
| Costos | directo, indirecto, impuesto, redondeo, tasa y total normalizado |
| Riesgo | fuentes vencidas, datos faltantes, variaciones relevantes, anomalías y exposición |

El resultado debe mostrar valor origen, valor destino, variación absoluta, variación porcentual cuando sea válida, causa identificada, severidad y evidencia. Las eliminaciones deben distinguirse de las líneas no comparables. La comparación no muta ninguna de las dos versiones.

## 10. Pantalla principal

La pantalla principal debe ser un espacio de control del Presupuesto Maestro, no solo una tarjeta de total.

### Encabezado

- Empresa, Proyecto y `VersionProyecto` activa.
- Versión presupuestaria y estado.
- Moneda base, fecha de corte, autor y última aprobación.
- Acciones según permiso: crear derivación, revisar, comparar, aprobar, exportar y consultar auditoría.

### Resumen ejecutivo

- total directo, indirecto, impuestos y total;
- variación frente a versión anterior;
- porcentaje de Partidas con APU válido;
- porcentaje de costos con fuente vigente;
- alertas bloqueantes, riesgos y datos incompletos;
- distribución por Capítulo y tipo de recurso.

### Explorador presupuestario

Árbol WBS expandible con columnas de código, Partida, unidad, cantidad, APU/versión, costo unitario, importe, fuente y estado. Cada fila permite abrir el detalle de recursos, evidencias, documentos, auditoría y uso histórico.

### Paneles de trabajo

- detalle técnico y económico de la Partida;
- composición APU y recursos;
- historial de precios y proveedores;
- comparación de versiones;
- validaciones y excepciones;
- cronograma/flujo de caja cuando existan integraciones aprobadas;
- aprobación y bitácora.

La interfaz debe distinguir claramente datos aprobados, borradores, estimaciones y recomendaciones de IA. La IA puede explicar o sugerir; la decisión final permanece en el usuario autorizado.

## 11. APIs requeridas

Las APIs deben ser aditivas, bajo `/api/v1`, conservar contratos existentes y aplicar autorización por Empresa/Proyecto.

| Capacidad | Contrato conceptual |
|---|---|
| Consultar presupuesto | listar y obtener presupuesto por proyecto, versión de proyecto y estado |
| Crear derivación | crear borrador desde una versión fuente con motivo y trazabilidad |
| Calcular/validar | ejecutar validaciones y cálculo reproducible; devolver errores, advertencias y evidencias |
| Consultar líneas | listar por WBS, capítulo, partida, APU, recurso, proveedor o estado |
| Consultar detalle | expandir una Partida hasta recursos, precios, documentos y auditoría |
| Gestionar ciclo de vida | enviar a revisión, aprobar, rechazar, publicar, superseder y cerrar con permisos |
| Comparar | comparar dos versiones y devolver diferencias por todos los niveles |
| Auditoría | consultar eventos filtrados por presupuesto, versión, entidad, actor y fecha |
| Exportar | generar artefacto identificado por la versión, parámetros, plantilla y hash |
| Salud/consistencia | informar faltantes, fuentes vencidas, inconsistencias de unidades/monedas y bloqueos |

Cada respuesta debe identificar proyecto, versión de proyecto, versión presupuestaria, estado, moneda y fecha de corte. Las operaciones de escritura deben exigir motivo idempotente cuando aplique, devolver el identificador de auditoría y no aceptar importes calculados por el cliente como autoridad.

## 12. Migraciones requeridas

Esta sección define necesidades de evolución, no entrega SQL ni ejecuta migraciones.

1. Inventariar las tablas y contratos existentes de Empresa, Proyecto, `VersionProyecto`, WBS, Partidas, APU, materiales, precios y auditoría.
2. Agregar de forma aditiva la identidad de Presupuesto Maestro, sus versiones, líneas, snapshots, configuración, estados y aprobaciones.
3. Agregar referencias a las entidades existentes sin renombrarlas, eliminarlas ni duplicarlas.
4. Incorporar restricciones para consistencia de pertenencia a Proyecto/`VersionProyecto`, unicidad de versión y estados válidos.
5. Incorporar precisión decimal, moneda explícita, vigencia y fuentes sin convertir silenciosamente datos antiguos.
6. Diseñar backfill solo para datos con correspondencia inequívoca. Lo ambiguo debe quedar como legado pendiente de revisión.
7. Incorporar protección de inmutabilidad para versiones aprobadas, snapshots y auditoría.
8. Mantener compatibilidad de lectura con APIs y módulos existentes mediante adaptadores o vistas de transición.
9. Verificar respaldo, reversibilidad operativa, índices, rendimiento y aislamiento por empresa/proyecto antes de aplicar cambios.
10. Aplicar por etapas: esquema, lectura, cálculo paralelo controlado, validación, escritura, aprobación y retirada gradual de fuentes transitorias.

No se debe crear una migración que reemplace WBS, Partidas, APU, Materiales, `VersionProyecto` o auditoría, ni que borre historial.

## 13. Riesgos

| Riesgo | Impacto | Mitigación arquitectónica |
|---|---|---|
| Duplicar lógica de cálculo | Totales divergentes | servicio de cálculo único, contratos compartidos y pruebas de reconciliación |
| Cambiar datos históricos | pérdida de trazabilidad | snapshots, inmutabilidad y derivación de versiones |
| APU/material sin fuente suficiente | presupuesto no reproducible | validaciones bloqueantes y estado legado/estimado explícito |
| Mezcla de unidades o monedas | importes incorrectos | unidad base, conversiones explícitas y errores no silenciosos |
| Catálogos cambiantes | versiones históricas inestables | referencias más snapshots y precios append-only |
| Migración ambigua del legado | corrupción semántica | no automatizar correspondencias dudosas; revisión humana |
| Sobrecarga de la pantalla | decisiones difíciles | vista ejecutiva más exploración progresiva y filtros |
| Falta de permisos | cambios no autorizados | autorización por empresa/proyecto y aprobación segregada |
| Rendimiento por grandes WBS | tiempos de respuesta altos | agregados calculados, índices, paginación y cálculo asíncrono controlado |
| IA presentada como autoridad | decisiones incorrectas | recomendaciones con evidencia, confianza y aprobación humana |
| Dependencia de datos demo | falsa operación | separar explícitamente demo de persistencia operativa |

## 14. Estrategia de implementación

La implementación futura debe ser incremental y cada etapa debe conservar operación existente.

1. **Contrato y gobierno:** aprobar este diseño, estados, permisos, moneda, redondeo, criterios de bloqueo y responsabilidades.
2. **Mapa de integración:** documentar cada tabla, API, servicio y pantalla existente que será fuente o consumidor.
3. **Esquema aditivo:** agregar entidades y restricciones sin modificar la semántica de módulos aprobados.
4. **Lectura y snapshots:** construir consultas de detalle y evidencia antes de habilitar escritura operativa.
5. **Cálculo controlado:** reutilizar la lógica validada, comparar resultados con fuentes actuales y resolver diferencias antes de publicar.
6. **Ciclo de revisión:** habilitar borradores, validaciones, auditoría, comparación y aprobación.
7. **Adopción progresiva:** comenzar con proyectos seleccionados, medir reconciliación y ampliar por empresa/proyecto.
8. **Integraciones posteriores:** conectar cronograma, flujo de caja, reportes e inteligencia asistida únicamente después de estabilizar el núcleo.
9. **Certificación:** ejecutar los criterios de aceptación, documentar evidencia técnica y funcional y declarar la fase aprobada solo con resultados verificables.

### Fuera de alcance de esta fase

- código de backend o frontend;
- SQL, scripts o ejecución de migraciones;
- reemplazo de módulos aprobados;
- automatización de aprobaciones;
- IA que modifique o apruebe presupuestos;
- integración operativa con compras, contratos o ejecución física;
- transformación automática de datos ambiguos.

## 15. Decisión arquitectónica de cierre

El Presupuesto Maestro se diseña como una capa financiera versionada sobre `VersionProyecto`, WBS, Partidas, APU, Recursos y Costos existentes. Su valor está en integrar, congelar, explicar, comparar y auditar; no en apropiarse de las responsabilidades de esos módulos.

La arquitectura queda lista para implementación futura únicamente cuando se respeten estas condiciones: una fuente de cálculo, una identidad reutilizada por módulo, snapshots de los valores usados, historial conservado, comparaciones multinivel, aprobación humana y evolución aditiva.

