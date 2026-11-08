# Arquitectura de Datos Maestra V1

**Producto oficial:** COS — Construction Operating System  
**Descriptor:** Gerente Administrativo IA para Construcción  
**Trazabilidad:** nombre inicial del proyecto: Motor de Presupuesto MO y Flujo de Caja Nicaragua 2026; ObraNexa fue un nombre de trabajo sustituido por COS.  
**Fecha:** 2026-11-05  
**Estado:** Arquitectura objetivo; no implica cambios de código ni migraciones aplicadas.

## 1. Visión General

El modelo de datos es la memoria operativa y verificable del futuro **Gerente Administrativo IA**. Debe relacionar la empresa, sus proyectos, documentos técnicos, partidas, análisis de precios unitarios (APU), recursos, presupuesto, cronograma, flujo financiero, reportes y decisiones.

El sistema conservará una distinción esencial:

1. **Catálogos reutilizables:** partidas maestras, materiales, equipos, mano de obra, proveedores y unidades.
2. **Datos de cada proyecto:** cantidades, especificaciones, recursos seleccionados, costos, programación y decisiones.
3. **Versiones y evidencias:** qué información se utilizó para cada cálculo o documento generado y quién la aprobó.

El modelo no sustituye los módulos actuales. Los envuelve gradualmente en una estructura común, preserva sus identificadores y contratos actuales y agrega relaciones, historial y persistencia cuando cada módulo esté preparado. El agente de IA será un consumidor controlado de datos y un productor de propuestas trazables; no será la fuente maestra ni aprobará cambios administrativos por sí mismo.

### Principios de diseño

- **Evolución compatible:** migraciones aditivas, adaptadores y contratos compatibles con las APIs existentes.
- **Identidad estable:** no renumerar IDs existentes ni volver a importar catálogos como si fueran nuevos.
- **Separación de responsabilidades:** catálogo reutilizable no equivale a partida presupuestada; precio de referencia no equivale a precio contratado.
- **Versiones reproducibles:** cualquier total aprobado debe poder explicarse con los datos, tasas, reglas y versiones que lo produjeron.
- **Historial conservado:** cotizaciones usadas, versiones aprobadas, auditoría y documentos publicados no se sobreescriben.
- **Precisión:** cantidades e importes decimales; no usar coma flotante binaria para persistir costos.
- **Trazabilidad técnica:** cada recomendación o cálculo relevante puede apuntar a sus fuentes y evidencias.
- **Modularidad lógica:** iniciar con PostgreSQL y el backend actuales; separar servicios o bases solo si la carga y operación lo justifican.

### Convenciones recomendadas

- Mantener por ahora las claves enteras existentes. Para entidades nuevas, usar las convenciones del backend y considerar un identificador público UUID sin retirar las claves internas; no es requisito de la primera migración.
- Persistir fechas y horas en UTC con zona horaria; presentar en la zona del usuario.
- Guardar moneda explícita en cada monto y tasa de conversión explícita con fecha, origen y dirección. Nunca sumar monedas distintas sin conversión documentada.
- Usar `NUMERIC`/`Decimal` para valores financieros; definir precisión según el dominio. Conservar valores de entrada y redondear únicamente conforme a reglas declaradas.
- Aplicar baja lógica (`activo`, estado archivado o `deleted_at`) a catálogos y entidades operativas referenciadas; usar restricciones de borrado para preservar historia.
- Toda entidad de negocio debe tener un propietario organizacional/proyecto cuando corresponda, fechas de creación y actualización, estado y, si aplica, usuario responsable.

## 2. Entidades Maestras

La siguiente lista define el modelo objetivo. Los campos son conceptos, no un DDL obligatorio. Las entidades nuevas se implementarán según las fases indicadas en la sección 10.

### 2.1 Organización e identidad

| Entidad | Responsabilidad y datos principales |
|---|---|
| **Usuario** | Identidad, nombre, correo normalizado, estado, autenticación externa o credencial gestionada de forma segura, preferencias y fechas. No almacenar contraseñas en texto claro. |
| **Empresa** | Organización propietaria de proyectos; razón social, RUC, país, zona horaria, moneda base, datos de contacto y estado. |
| **MembresíaEmpresa** | Relación muchos-a-muchos entre Usuario y Empresa, con rol, permisos, vigencia y estado. Evita asignar permisos directamente al proyecto sin contexto empresarial. |
| **Rol/Permiso** | Conjunto de capacidades asignables por empresa/proyecto: consultar, editar, aprobar, administrar y auditar. Aplicar mínimo privilegio. |

### 2.2 Proyecto y estructura técnica

| Entidad | Responsabilidad y datos principales |
|---|---|
| **Proyecto** | Unidad de trabajo y agregado raíz: empresa, nombre, ubicación, cliente/contratante, moneda base, fechas, estado, responsable y configuración. Conserva los campos actuales `id`, `nombre`, `ubicacion`, `estado`, `fecha_creacion` y `costo_total_mo` mientras se migran sus consumidores. |
| **VersiónProyecto** | Corte reproducible del alcance y configuración del proyecto; número, estado (borrador, revisión, aprobado, cerrado), autor, fechas, motivo y referencia a la versión anterior. |
| **Capítulo** | Nodo de estructura de desglose del trabajo (WBS), orden, código, nombre y padre opcional para permitir niveles anidados. En su primera etapa mantiene el vínculo existente al proyecto. |
| **Partida** | Actividad presupuestable del proyecto: código, descripción, unidad, cantidad, rendimiento, orden, estado y referencias al catálogo maestro y a la versión del proyecto. No confundirla con una definición reutilizable del catálogo. |
| **CatálogoPartidas / PartidaMaestra** | Definición reutilizable y versionable: código, descripción, unidad, categoría, fuente y vigencia. `maestro_partidas` actual sigue siendo el origen y conserva sus 8,106 filas; no se reemplaza ni se vincula automáticamente por similitud de texto. |
| **EspecificaciónTécnica** | Requisito técnico estructurado o texto controlado, código, disciplina, norma/revisión, unidad/valores y vigencia. Puede derivarse de documentos, pero conserva fuente y estado de validación humana. |
| **Documento** | Metadatos de archivo: proyecto, tipo, nombre, MIME, ubicación en almacenamiento de objetos, tamaño, hash/checksum, emisor, fecha, confidencialidad, estado, versión y autor. El binario no debe almacenarse como campo grande en tablas operativas salvo decisión técnica futura. |
| **Plano** | Especialización o clasificación de Documento: disciplina, número de lámina, revisión, escala, sistema de coordenadas opcional, estado (preliminar/aprobado/obsoleto) y referencias cruzadas. El archivo y sus revisiones se conservan como documentos versionados. |
| **DocumentoPartida / DocumentoEspecificación** | Relaciones de asociación para vincular documentos y planos con una o varias partidas/requisitos, incluyendo página, lámina, ubicación, nota y estado de verificación. |

### 2.3 Costos, recursos y compras

| Entidad | Responsabilidad y datos principales |
|---|---|
| **Recurso** | Identidad común de un insumo de costo: código, nombre, unidad base, tipo, estado, fuente y fechas. Tipos iniciales: material, equipo, mano de obra, subcontrato y otros. Es la referencia común desde las líneas de APU; no fuerza que todas las categorías tengan los mismos atributos. |
| **Material** | Detalle especializado de Recurso: categoría, especificación, unidad y vínculo opcional verificado con catálogo histórico. Mantiene `materiales` y sus restricciones actuales. |
| **Equipo** | Detalle especializado de Recurso: clase, capacidad, unidad de tarifa, modalidad de alquiler/propiedad, productividad y atributos técnicos. Distinguir tarifa de alquiler, costo operativo y propiedad. |
| **ManoObra** | Detalle especializado de Recurso/perfil laboral: oficio, categoría, unidad de pago, salario de referencia y fuente. Las tasas legales y laborales deben ser parámetros versionados, no valores implícitos en una fórmula. Los datos personales de colaboradores, si se necesitan, pertenecen a un módulo de nómina separado y con controles de acceso reforzados. |
| **Subcontrato** | Recurso/categoría para valorar paquetes subcontratados y, cuando exista adjudicación, contrato asociado: alcance, unidad, exclusiones, moneda, vigencia, contratista, estado y referencias contractuales. Distinguir precio de oferta, presupuesto y valor contractual. |
| **Proveedor** | Organización proveedora existente: nombre, RUC, datos de contacto, estado y origen. Mantener el ID y los campos existentes; agregar datos solo cuando sean necesarios. |
| **Cotización** | Oferta recibida de un proveedor: número, fecha de emisión/recepción, vigencia, moneda, condiciones, documento fuente, estado y quién la registró/revisó. |
| **LíneaCotización** | Recurso ofrecido, descripción original, unidad y factor de conversión, precio, impuestos/cargos si aplican, entrega, plazo y referencia. Permite cotizar recursos distintos y comparar ofertas equivalentes. |
| **PrecioHistóricoMaterial** | Precio unitario observado para material/proveedor, moneda, unidad de precio, vigencia, fecha de registro, observación y cotización de origen opcional. Corresponde conceptualmente a `materiales_precios`; es inmutable y una corrección se registra como nueva observación. |
| **TasaCambio** | Moneda origen/destino, valor, fecha/hora de vigencia, fuente, tipo (referencial, oferta, contrato) y responsable. Guardar la tasa usada en cada cálculo para poder reproducirlo. |

### 2.4 APU y planeación económica

| Entidad | Responsabilidad y datos principales |
|---|---|
| **APU** | Análisis de una partida y una versión: unidad de análisis, rendimiento, moneda base, reglas de cálculo, estado y totales derivados. Se vincula a una Partida de proyecto; puede reutilizar una plantilla de APU, pero el presupuesto guarda una instantánea de lo utilizado. |
| **VersiónAPU** | Revisión inmutable de los parámetros y líneas del APU, su origen, fecha, autor, motivo y estado de aprobación. Una edición crea una revisión; no cambia un APU publicado en un presupuesto aprobado. |
| **LíneaAPU** | Recurso, tipo/categoría, cantidad por unidad de obra, unidad, rendimiento, merma/factor, precio y moneda usados, costo parcial y orden. Mantiene una descripción y precio capturados como instantánea aun cuando referencia un recurso del catálogo. |
| **Presupuesto** | Documento de cálculo por proyecto y versión: moneda, alcance, subtotales directos/indirectos, AIU/impuestos según regla local, tasa de cambio, estado y totales derivados. |
| **VersiónPresupuesto** | Corte inmutable de partidas, cantidades, APU, precios, factores, reglas y tasas. Identifica la versión previa, motivo y aprobadores. Un presupuesto revisado se guarda como nueva versión. |
| **LíneaPresupuesto** | Partida incluida en una versión de presupuesto, cantidad considerada, precio unitario, importe, vínculo a APU y snapshot de descripción/unidad. |
| **ConfiguraciónCosto** | Parámetros de cálculo identificados y versionados: jornada, cargas laborales, indirectos, impuestos, desperdicio, redondeo y supuestos. Deben incluir jurisdicción, vigencia, fuente y aprobación. |
| **Cronograma** | Plan de ejecución por versión del proyecto/presupuesto: calendario, fecha base, unidad de tiempo, estado, método y restricciones. |
| **ActividadCronograma** | Actividad/WBS, duración, fechas planeadas, dependencias, recursos asignados, rendimiento y avance. Puede referir a una Partida, sin exigir correspondencia uno-a-uno. |
| **AsignaciónRecurso** | Recurso/cantidad/costo asignado a actividad y período, con disponibilidad, unidad, calendario y procedencia del costo. |
| **FlujoCaja** | Proyección financiera por versión, moneda, período y método; conserva supuestos de desembolso, tasa y vínculo al cronograma/presupuesto. |
| **LíneaFlujoCaja** | Período, fecha, ingreso/egreso proyectado, moneda, categoría, importe original, tasa aplicada e importe normalizado; los valores ejecutados se distinguen de los proyectados. |

### 2.5 Salidas, IA y control

| Entidad | Responsabilidad y datos principales |
|---|---|
| **Reporte** | Metadatos de salida: tipo, proyecto, parámetros, plantilla, versión de datos usada, estado, autor/generador, fechas y ubicación/hash del archivo. Cada exportación relevante puede regenerarse o identificarse como artefacto histórico. |
| **AgenteIA** | Definición/versionado del agente: proveedor/modelo lógico, versión de instrucciones, herramientas permitidas, alcance y políticas. No guardar secretos de proveedores en esta entidad. |
| **Conversación** | Sesión del usuario con el agente, proyecto/empresa, participantes, estado, fechas y configuración/versiones del agente. |
| **MensajeConversación** | Mensaje, rol (usuario/agente/herramienta), fecha, referencias a resultados y metadatos de ejecución; aplicar retención y protección de datos. |
| **ContextoProyecto** | Contexto estructurado ensamblado para una solicitud: versión de proyecto, documentos, partidas, presupuesto, reglas, fecha de corte y IDs/checksums de evidencias. No duplica el origen autoritativo: registra qué se leyó y cuándo. |
| **MemoriaIA** | Memoria acotada y versionada, vinculada a empresa/proyecto/conversación, con contenido, fuente, nivel de confianza, vigencia, sensibilidad y consentimiento cuando aplique. La memoria no prevalece sobre datos aprobados. |
| **HallazgoTécnico** | Observación de la IA o de un profesional: tipo, descripción, severidad, confianza, evidencia citada, documento/ubicación, estado y revisor. |
| **Recomendación** | Propuesta accionable basada en hallazgos y fuentes; impacto estimado, supuestos, confianza, agente/versiones, estado (propuesta, aceptada, rechazada, aplicada) y responsable de decisión. No cambia datos de negocio por sí sola. |
| **DecisiónAdministrativa** | Resolución tomada por una persona autorizada: decisión, justificación, responsable, fecha, alcance, recomendación relacionada y cambios/artefactos resultantes. |
| **Auditoría** | Registro append-only de actor, fecha, acción, entidad/ID, empresa/proyecto, valores anteriores y nuevos (o diferencias), motivo, origen, correlación y contexto técnico. Protege integridad y acceso. |

## 3. Relaciones

Diagrama lógico (las relaciones opcionales se indican como tales; una entidad puede ampliarse con tablas de asociación):

```text
Empresa
 ├─< MembresíaEmpresa >─ Usuario
 └─< Proyecto
      ├─< VersiónProyecto
      │    ├─< Capítulo (WBS, admite padre/subcapítulos)
      │    │    └─< Partida de proyecto >─ PartidaMaestra (opcional)
      │    │         ├─< APU ─< VersiónAPU
      │    │         │             └─< LíneaAPU >─ Recurso
      │    │         │                                ├─ Material
      │    │         │                                ├─ Equipo
      │    │         │                                ├─ ManoObra
      │    │         │                                └─ Subcontrato
      │    │         └─< LíneaPresupuesto >─ VersiónPresupuesto
      │    ├─< Documento ─< RevisiónDocumento
      │    │    ├─ Plano
      │    │    ├─ EspecificaciónTécnica
      │    │    └─< DocumentoPartida / DocumentoEspecificación >─ Partida
      │    ├─< Presupuesto ─< VersiónPresupuesto
      │    │                    ├─< LíneaPresupuesto
      │    │                    └─> Cronograma ─< ActividadCronograma
      │    │                                  └─< AsignaciónRecurso >─ Recurso
      │    ├─< FlujoCaja ─< LíneaFlujoCaja
      │    ├─< Reporte
      │    ├─< Conversación ─< MensajeConversación
      │    │    ├─< ContextoProyecto
      │    │    ├─< MemoriaIA
      │    │    ├─< HallazgoTécnico ─< Recomendación
      │    │    │                            └─> DecisiónAdministrativa
      │    │    └─> AgenteIA (versión utilizada)
      │    └─< Auditoría
      └─< Cotización (puede ser global a empresa o específica al proyecto)

Proveedor
 └─< Cotización ─< LíneaCotización >─ Recurso
                    └─> PrecioHistóricoMaterial (cuando corresponda)
Recurso (Material)
 └─< PrecioHistóricoMaterial >─ Proveedor
TasaCambio ─ referenciada por Cotización, APU, Presupuesto, FlujoCaja y Reporte
Usuario ─ actor de cambios, mensajes, revisiones y aprobaciones
```

### Reglas de relación y consistencia

- Proyecto pertenece a una Empresa. `MembresíaEmpresa` controla quién puede operarlo; los proyectos no se hacen globalmente visibles por defecto.
- La WBS puede ser jerárquica. Una partida presupuestada pertenece a un capítulo de una versión del proyecto, mientras que la partida maestra es una referencia reutilizable separada.
- Un APU tiene líneas heterogéneas que apuntan a Recurso; cada línea captura la unidad, descripción, precio, moneda, fuente y factores usados. Así, cambios posteriores en el catálogo no alteran presupuestos históricos.
- Una cotización tiene una o varias líneas y proveedor. Un recurso puede tener varias cotizaciones; solo una oferta aceptada o precio seleccionado pasa al presupuesto bajo una regla explícita.
- Cronograma y flujo de caja referencian la misma versión económica aprobada o declaran sus diferencias. No se debe inferir ejecución real a partir de proyecciones.
- Documentos, especificaciones y planos pueden vincularse con múltiples capítulos/partidas; conservar la localización de evidencia y la revisión del archivo.
- Cada acción administrativa sensible produce auditoría. Cada aceptación/rechazo de una recomendación produce DecisiónAdministrativa y su evento de auditoría.

## 4. Modelo Evolutivo

### Qué se reutiliza

- PostgreSQL y SQLAlchemy/FastAPI como persistencia y acceso actuales; no se plantea otro motor de datos para iniciar.
- Las tablas `proyectos`, `capitulos`, `partidas` y `analisis_precios_unitarios`, además de sus IDs, datos, restricciones y rutas existentes.
- `maestro_partidas` como catálogo histórico vigente; sus registros se conservan y cualquier asociación a material/partida maestra es explícita y verificada.
- `categorias_materiales`, `materiales`, `proveedores` y `materiales_precios`, incluido el historial inmutable de precios y sus reglas.
- La lógica comprobada del cálculo MO, Consolidado, costos y exportación Excel; sus contratos se alimentan desde adaptadores hasta que el nuevo modelo pueda servirles directamente.

### Qué se amplía

- Proyecto: empresa, moneda/zona horaria, fechas, responsable, relaciones con documentos y estructura de versiones. Se mantienen los campos actuales, incluido `costo_total_mo`, mientras existan consumidores; los nuevos totales generales se calculan desde el presupuesto.
- Partida y APU: recurso tipado y snapshots de precios/unidades, estado, versión, procedencia, moneda y vínculos a presupuesto, catálogo, documentos y auditoría.
- Materiales/proveedores/precios: relación con cotización, fuente de precio, vigencia, unidad de compra/conversión y asociaciones con presupuesto/APU.
- Mano de Obra: parámetros laborales versionados y persistibles; las actividades que hoy solo viven en React se guardan bajo el proyecto/versión cuando se implemente persistencia.
- Consolidado: inicialmente sigue transformando fuentes existentes; más adelante consulta líneas persistidas de presupuesto sin cambiar el formato de respuesta usado por frontend/Excel.
- Documentación: almacenamiento de archivo externo con metadatos, revisiones y vínculos técnicos; las referencias se añaden sin requerir un repositorio documental nuevo desde el día uno.
- Auditoría/versiones: inicialmente para cambios de alto valor y aprobaciones; crecer a todas las mutaciones persistidas conforme se incorporan endpoints de escritura.

### Qué se mantiene

- La operación actual del Catálogo Maestro y su identidad; no se convierten automáticamente sus 8,106 registros en materiales ni se alteran sus precios.
- Los contratos actuales de las APIs, respuestas y tipos del frontend. Si una evolución exige campos nuevos, serán aditivos u opcionales con valores compatibles.
- Las categorías MO, material y equipo del APU actual; la taxonomía de recursos las normaliza internamente sin invalidar `TipoAPU` (`Material`, `Mano de Obra`, `Equipo/Maquinaria`).
- El cálculo y la exportación existentes mientras se migra su fuente de datos. Los datos de demo permanecen claramente identificados como demo y no se confunden con registros persistidos.
- Los IDs enteros históricos y el significado actual de cada columna. No cambiar el tipo/semántica de una columna activa para lograr una normalización teórica.

### Estrategia de migración sin interrupción

1. **Expandir:** añadir tablas/columnas nuevas opcionales, índices y relaciones; no quitar ni renombrar columnas usadas.
2. **Mapear:** definir equivalencias y reglas de conversión documentadas; cargar datos existentes en transacciones idempotentes, preservando IDs o guardando una tabla de correspondencia.
3. **Adaptar:** crear servicios/repositorios que traduzcan entre el modelo objetivo y las respuestas/modelos de transporte existentes. Evitar doble escritura independiente desde frontend y backend.
4. **Validar:** comparar conteos, totales por categoría/moneda y resultados de cálculo entre el módulo actual y el nuevo para proyectos piloto.
5. **Cambiar lectura por módulo:** activar lectura persistida detrás del contrato existente y mantener una ruta de reversión. No activar escrituras paralelas sin reconciliación transaccional.
6. **Retirar solo tras evidencia:** considerar columnas duplicadas o datos de demo obsoletos únicamente cuando ningún consumidor los use, exista respaldo, pruebas de regresión y aprobación.

## 5. Mapeo del Sistema Actual

| Modelo/superficie actual | Modelo objetivo | Tratamiento compatible |
|---|---|---|
| SQLAlchemy `Proyecto` / tabla `proyectos`: `id`, `nombre`, `ubicacion`, `estado`, `fecha_creacion`, `costo_total_mo` | Proyecto, luego Empresa y VersiónProyecto | Reutilizar la tabla e ID. `costo_total_mo` sigue siendo subtotal MO heredado, no total maestro; añadir empresa/configuración/versión de forma aditiva. |
| SQLAlchemy `Capitulo` / `capitulos` | Capítulo/WBS | Conservar FK `proyecto_id`, código/nombre y unicidad actual; introducir versión de proyecto y padre opcional en una ampliación posterior. |
| SQLAlchemy `Partida` / `partidas` | Partida de proyecto | Mantener cantidad, unidad, rendimiento, código y relación al capítulo; ampliar con versión, referencia opcional a partida maestra, estado/orden si se necesitan. |
| `MaestroPartidas` / `maestro_partidas` (8,106 entradas confirmadas por bitácora) | CatálogoPartidas / PartidaMaestra | Reutilizar sin reemplazar. Una correspondencia con recursos/materiales debe ser revisada; no confundir con partidas cargadas al presupuesto. |
| `AnalisisPrecioUnitario` / `analisis_precios_unitarios` y enum `TipoAPU` | APU, VersiónAPU, LíneaAPU | Reutilizar líneas existentes y preservar enum/API. Añadir referencia opcional a recurso y snapshots/versiones; mantener `descripcion` cuando no exista vínculo a catálogo. |
| `CategoriaMaterial` / `categorias_materiales` | Categoría de recursos / categoría de material | Reutilizar. No forzar que todas las categorías de recursos sean categorías de material. |
| `Material` / `materiales` | Recurso + detalle Material | Reutilizar tabla y código; incorporar identidad común solo con FK opcional/mapeo gradual, sin recrear materiales. Mantener vínculo opcional único a `maestro_partidas`. |
| `Proveedor` / `proveedores` | Proveedor | Reutilizar IDs y datos actuales; cotización como nueva entidad, no cambiar el concepto de proveedor. |
| `MaterialPrecio` / `materiales_precios` | PrecioHistóricoMaterial / cotización de origen | Reutilizar filas inmutables. Cotización podrá enlazarse opcionalmente; precios antiguos seguirán consultables aunque no se conozca el documento original. |
| `ConfiguracionLaboral`, `Actividad`, `CronogramaCalculado`, `ColaboradorNomina` en TypeScript | ConfiguraciónCosto, Partida, APU MO, ActividadCronograma, LíneaFlujoCaja (según uso) | Son modelos de aplicación/cálculo, no tablas. Persistir entradas editables y parámetros versionados; totales derivados se recalculan y se comparan con el cálculo actual. La salida calculada no debe confundirse con una planilla real de personas. |
| `Project`, `Activity`, `CostLine`, `OtherCost`, `EquipmentBenchmark` en `materiales-costos/types.ts` y JSON demo | Proyecto/VersiónProyecto, Partida, LíneaAPU, Recurso Equipo y datos demo | El `Project` Pydantic/TypeScript es contrato de transporte y demo, no la tabla `proyectos`. Usar adaptador; etiquetar origen demo y no importar tarifas como cotizaciones vigentes. |
| `ConsolidatedItem`, `ConsolidationSummary`, servicio API/React | Presupuesto, LíneaPresupuesto y vista/consulta de consolidación | Mantener respuesta y cálculos actuales; cambiar fuente gradualmente a líneas persistidas. Guardar moneda y tasa usada al persistir, no confiar en la tasa fija del demo para obra real. |
| Exportador Excel / archivo descargado | Reporte y artefacto de salida | Mantener hojas y comportamiento. Registrar metadatos/hash, versión de presupuesto y fecha cuando se genere desde información persistida; las exportaciones actuales pueden seguir sin registro hasta integrar esa fase. |
| `backend/app/data/materiales_costos_demo.json` | Fixtures/datos de demostración | Mantener separado de catálogos y cotizaciones reales. No promover datos demo silenciosamente a datos operativos. |
| `backend/datos_pdf.db` / otras fuentes de importación | Fuente de migración/documento, si se confirma su uso | Investigar esquema y procedencia antes de mapear. No asumir que sea la fuente autoritativa ni modificarla como parte de esta arquitectura. |
| Acceso de demostración en frontend | Usuario, Empresa, MembresíaEmpresa | No constituye autenticación persistente. Añadir identidad y autorización antes de exponer proyectos reales a múltiples usuarios. |

## 6. Entidades para IA

La IA opera sobre datos autorizados y una instantánea identificable. Estructura lógica mínima:

```text
AgenteIA (identificador + versión de instrucciones/políticas)
 └─ Conversación (usuario, empresa, proyecto?, estado)
      ├─ MensajeConversación (usuario/agente/herramienta, contenido, fecha)
      ├─ ContextoProyecto
      │    ├─ versión de proyecto/presupuesto de corte
      │    ├─ lista de documentos y revisiones consultados (ID + hash)
      │    ├─ recursos/reglas/tasas consultadas (IDs/versiones)
      │    └─ permisos, fecha de corte y correlación de ejecución
      ├─ MemoriaIA (fuente, vigencia, alcance y confidencialidad)
      └─ HallazgoTécnico (evidencias y ubicación)
           └─ Recomendación (supuestos, impacto, confianza, estado)
                └─ DecisiónAdministrativa (responsable humano, motivo, resultado)
```

### Reglas de seguridad y calidad

- Filtrar contexto por membresía y permiso del usuario antes de recuperar documentos, memorias o datos de costos. No incluir contenido de otra empresa/proyecto.
- Registrar proveedor/modelo lógico, versión de instrucciones, herramientas invocadas y referencias de datos; mantener secretos fuera de tablas y logs.
- Separar hechos confirmados, estimaciones e inferencias. Un hallazgo conserva citas a documento/revisión/página/partida o a una versión estructurada y su nivel de confianza.
- Cada recomendación declara supuestos, impacto y datos usados. La aceptación/rechazo pertenece a un usuario con permisos y genera decisión y auditoría.
- Aplicar límites de retención y controles de acceso a conversaciones y memoria. No incluir datos personales o contractuales sensibles en memoria general sin justificación.
- Ninguna salida del agente modifica directamente cantidades, APUs, presupuesto aprobado o contratación; la aplicación de cambios requiere validación y una nueva versión de los datos afectados.

## 7. Versionamiento

Versionar no significa copiar todo el proyecto en cada edición; significa que toda publicación financiera/técnica pueda reconstruirse a partir de revisiones identificadas y snapshots necesarios.

| Ámbito | Estrategia |
|---|---|
| **Proyecto** | `VersiónProyecto` ordenada, con estado, autor, fecha y motivo. Vincula/captura la estructura WBS, alcance y configuración que deben ser reproducibles. Las revisiones aprobadas son inmutables; crear la siguiente para editar. |
| **Presupuesto** | `VersiónPresupuesto` inmutable con líneas, cantidades, APU/precios seleccionados, unidades/factores, moneda, tasas, parámetros laborales e indirectos, impuestos, reglas y totales redondeados. Cada revisión indica diferencias contra la anterior. |
| **APU** | `VersiónAPU` por partida, con renglones y supuestos congelados. Una nueva cotización no cambia el APU ya aprobado; una actualización explícita produce una nueva versión. |
| **Recursos y cotizaciones** | Catálogo con vigencia y cambios auditados; cotizaciones y precios observados inmutables. Los presupuestos referencian la cotización seleccionada y guardan snapshot de precio/unidad/moneda/conversión aplicada. |
| **Cronograma y flujo de caja** | Versiones base y revisiones ligadas al presupuesto/proyecto que las originó. Diferenciar línea base aprobada, proyección vigente y valores reales conforme existan. |
| **Documentos/planos** | Revisiones independientes con hash, fecha, estado de aprobación y vínculo de reemplazo. Un archivo reemplazado se marca obsoleto; no se borra si es evidencia de una versión aprobada. |
| **Reportes** | Guardar tipo, plantilla, versión de proyecto/presupuesto, parámetros, fecha, generador y hash/ubicación del archivo. Si se regeneró con una plantilla distinta, registrar otra salida. |

### Identidad y estados de publicación

- Distinguir estados `borrador`, `en revisión`, `aprobado`, `publicado` y `obsoleto/cerrado` según el flujo real.
- Guardar `version_anterior_id`, `creado_por`, `creado_en`, `motivo`, `aprobado_por` y `aprobado_en` donde aplique.
- No usar un número de versión editable como única identidad; cada revisión conserva una clave propia y relación explícita con su raíz.
- Los snapshots en presupuestos preservan valores usados incluso si la descripción o el precio del catálogo cambia después.
- Definir reglas de redondeo y momento de aplicación; los componentes y el total deben permitir reconciliarse sin depender del redondeo visual del frontend.

## 8. Auditoría

La auditoría se diseña para reconstruir cambios de negocio, no únicamente registrar errores técnicos.

Cada evento debe capturar como mínimo:

- **Quién:** ID de usuario, agente/servicio o proceso programado; rol y empresa vigentes.
- **Cuándo:** instante UTC, con orden correlacionable.
- **Qué:** acción (crear, editar, aprobar, rechazar, importar, exportar, archivar), tipo de entidad e ID estable.
- **Qué cambió:** campos anteriores/nuevos o parche estructurado; excluir contraseñas, tokens y secretos.
- **Por qué:** motivo declarado, decisión, ticket/importación o recomendación relacionada; permitir distinguir motivo no provisto.
- **Dónde y contexto:** proyecto/versión, origen (API, interfaz, importador, agente), request/correlation ID y versiones de aplicación/reglas relevantes.
- **Resultado:** éxito/fallo y referencia al evento de dominio relacionado cuando corresponda.

### Reglas operativas

- Insertar auditoría en la misma transacción de la mutación para operaciones críticas. Evitar que una modificación se confirme sin su evento.
- El historial es append-only para roles de aplicación; correcciones se registran como eventos nuevos. Proteger acceso administrativo a la base y respaldos.
- Registrar explícitamente aprobaciones, exportaciones publicadas, cambios de precio, conversiones de moneda, importaciones y decisiones de IA.
- Definir retención, acceso y minimización de datos personales/contractuales; separar logs técnicos de eventos de negocio.
- La auditoría no reemplaza snapshots/versiones: la auditoría explica el cambio; la versión conserva el estado aprobado reproducible.
- Incorporar controles de integridad, respaldo y restauración probada. Un hash de evento puede considerarse para evidencia reforzada, pero no es requisito inicial ni sustituye controles de acceso.

## 9. Escalabilidad

El diseño soporta 10, 100 o 1,000 proyectos sin rediseñar el dominio: todas las entidades operativas se filtran por empresa y proyecto/versiones, y las claves/relaciones permiten crecer sin tablas separadas por obra.

### 10 proyectos

- Seguir con la base PostgreSQL y el backend actuales.
- Hacer persistentes Proyecto/Empresa y las líneas de presupuesto de forma aditiva.
- Añadir índices a claves foráneas y consultas de uso frecuente, como proyecto/estado, proyecto/versión/capítulo, material/cotización/vigencia y entidad/fecha de auditoría.
- Medir y optimizar las consultas del consolidado; paginar catálogos/documentos y no descargar historiales completos por defecto.

### 100 proyectos

- Asegurar aislamiento por empresa/proyecto en la capa de autorización y consultas; evaluar políticas de seguridad por fila de PostgreSQL si la operación/multicliente lo requiere.
- Revisar índices compuestos según planes de consulta y cardinalidad real; usar transacciones y límites de concurrencia para importaciones y cálculos.
- Mover archivos a almacenamiento de objetos con metadatos, hash y política de respaldo; mantener PostgreSQL para referencias y datos estructurados.
- Instrumentar latencia, errores, volumen, jobs de cálculo y costo de almacenamiento. Generar reportes pesados como tareas asíncronas si la medición lo justifica.

### 1,000 proyectos

- Mantener el mismo modelo lógico; escalar verticalmente PostgreSQL, ajustar pools y capacidad, respaldos/PITR, observabilidad y procesos de archivado según métricas.
- Considerar partición por fecha/empresa para tablas realmente voluminosas y append-only (auditoría, mensajes o eventos), solo tras medir crecimiento y consultas. Definir estrategia de índices y mantenimiento para cada partición.
- Separar colas de trabajos, búsqueda documental/índice semántico o servicios de IA cuando sus patrones de carga y operación lo justifiquen; las claves de referencia continúan apuntando al sistema fuente autoritativo.
- Separar lectura/reportes o réplicas cuando haya evidencia de contención; evitar lecturas desactualizadas para aprobaciones y operaciones financieras.
- Aplicar retención/archivo por política, mantener snapshots de presupuesto y documentos aprobados y probar restauración. Escalar horizontalmente la API como servicio sin sesiones en memoria.

El número de proyectos por sí solo no dicta particionamiento ni microservicios. La distribución, tamaño de documentos, cantidad de revisiones, concurrencia, frecuencia de reportes y retención determinarán umbrales concretos.

## 10. Recomendación Final

Implementar en esta secuencia, validando cada etapa con datos de prueba y conservando operación existente:

1. **Inventario y contratos de compatibilidad.** Documentar PK/FK, APIs, consumidores, catálogos y totales actuales. Crear pruebas de caracterización del cálculo MO, APU, consolidado, materiales e Excel. Confirmar esquema y procedencia de `datos_pdf.db` antes de usarlo.
2. **Identidad organizacional y control de acceso.** Añadir Empresa, Usuario y MembresíaEmpresa; vincular proyectos existentes a una empresa de migración explícita. No habilitar datos reales a través del acceso de demostración.
3. **Versiones de proyecto y estructura WBS.** Crear versiones de proyecto y ampliar Capítulo/Partida de forma opcional, preservando IDs y endpoints. Poder abrir y comparar la estructura actual antes de habilitar edición versionada.
4. **Catálogo común y recursos.** Formalizar Recurso y sus tipos/detalles de Material, Equipo, ManoObra y Subcontrato. Vincular con relaciones opcionales y tablas de correspondencia; preservar `maestro_partidas`, materiales, proveedores y enum `TipoAPU`.
5. **Cotizaciones y costos con procedencia.** Añadir Cotización/LíneaCotización, fuentes, vigencia, conversiones y tasas. Conectar precios históricos existentes sin modificar su inmutabilidad; marcar claramente datos de demostración.
6. **APU versionado y snapshot de líneas.** Extender la lectura/escritura APU existente en forma compatible. Persistir recurso y snapshot de precio/unidad, y comparar subtotales con los cálculos actuales.
7. **Presupuesto y consolidado persistidos.** Crear presupuesto/versiones/líneas, adoptar cálculo MO y costos existente detrás de adaptadores, y preservar contrato del Consolidado y exportador. Migrar un proyecto piloto primero.
8. **Cronograma y flujo de caja versionados.** Persistir entradas, dependencias, asignaciones y supuestos; reconciliar MO con flujo semanal actual. Mantener proyección separada de ejecución real.
9. **Gestión documental y especificaciones.** Añadir metadatos/revisiones y vínculos con WBS/APU; comenzar con documentos y planos sin extracción automática autoritativa.
10. **Reportes y auditoría transversal.** Registrar versiones y evidencia de exportaciones; auditar cambios y aprobaciones en la misma transacción. Probar restauración y trazabilidad punta a punta.
11. **IA asistiva y memoria controlada.** Incorporar AgenteIA, conversación, contexto, hallazgos y recomendaciones con evidencia; habilitar memoria de alcance limitado y aprobaciones humanas antes de aplicar cambios.
12. **Escalar por métricas.** Revisar índices, retención, particiones, colas, búsqueda y réplicas con datos observados, sin anticipar una reescritura ni duplicar fuentes autoritativas.

### Criterio de aceptación de cada fase

- Las funcionalidades anteriores continúan operando y las APIs/exports conservan contratos existentes.
- IDs, conteos y sumas de origen se concilian; no hay asignaciones automáticas dudosas entre catálogos.
- Un presupuesto aprobado se puede reconstruir con las mismas cantidades, precios, monedas, tasas y reglas.
- Los cambios se atribuyen a actor y motivo, y el historial de precios/versiones no se sobrescribe.
- Hay pruebas de migración hacia delante, validación de datos y recuperación/rollback conforme al patrón aprobado por el equipo.

**Conclusión:** el núcleo recomendado es un proyecto multiversión, una WBS propia del proyecto, un catálogo de recursos compartido con tipos especializados y snapshots de costo por APU/presupuesto. Esta estructura permite integrar los módulos actuales gradualmente y soporta documentación, finanzas, auditoría e IA sin reemplazar las capacidades ya funcionales.
