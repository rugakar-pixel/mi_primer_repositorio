# Fase 2C — Diseño del Motor de Materiales Reales y Cotizaciones

**Producto:** COS — Construction Operating System  
**Descriptor:** Gerente Administrativo IA para Construcción  
**Estado:** Diseño previo a implementación  
**Precondiciones:** Fase 1 y Fase 2A aprobadas; Fase 2B implementada en el repositorio.

## 1. Objetivo y límites

Conectar el catálogo persistido de materiales, proveedores y precios históricos
con versiones APU y partidas WBS de una versión de proyecto. La solución no
implementa IA, Presupuesto Maestro ni Consolidado, y no reemplaza los flujos ni
APIs existentes de APU, WBS, materiales demo o costos.

## 2. Arquitectura existente a reutilizar

- `Material`, `Proveedor`, `MaterialPrecio` y `CategoriaMaterial` son el
  catálogo operativo y el historial de cotizaciones ya persistido.
- `MaterialPrecio` es append-only: la migración 001 impide actualizar o borrar
  precios. Una cotización nueva se representa como una fila nueva.
- `VersionProyecto`, capítulos y partidas WBS delimitan la revisión del
  proyecto.
- `APUMaestro` y `VersionAPU` proporcionan la identidad y versión inmutable del
  análisis; su detalle JSON puede extenderse sin crear otro modelo APU.
- `UsoAPU` guarda la asociación versionada a proyecto/partida y el snapshot de
  uso.
- `AuditoriaEvento` y `registrar_auditoria` capturan actor, acción, fecha,
  motivo, entidad, proyecto y versión.

No se introducen tablas paralelas de materiales, cotizaciones, APU o
consolidación.

## 3. Modelo de datos y decisiones

1. Extender `MaterialPrecio` con origen y referencia externa opcional a
   cotización mediante migración incremental 006. El registro existente sigue
   siendo la cotización, conserva precio, moneda, unidad, proveedor, vigencia y
   fecha de registro. Sus referencias y origen son inmutables junto con el
   precio.
2. Incorporar contratos/API de lectura y alta de categorías, materiales,
   proveedores y cotizaciones; no exponer actualización o eliminación de
   cotizaciones. Material y proveedor se desactivan en vez de borrarse.
3. Reutilizar `VersionAPU.detalle` para cada componente. Las líneas de material
   guardan IDs de material, proveedor y cotización, cantidad APU, moneda y un
   snapshot de descripción, unidad, precio, vigencia, origen y referencia de la
   cotización. Las líneas existentes (`concepto`, unidad, cantidad y costo)
   mantienen su forma y son compatibles.
4. El backend valida que los tres IDs correspondan entre sí, que los registros
   estén activos, que la cotización esté vigente al crear la versión APU, y que
   moneda y unidades sean compatibles. El costo material de la línea se deriva
   de la cotización seleccionada; no se acepta un costo de entrada que suplante
   el precio persistido.
5. `VersionAPU.costo_unitario` se calcula con el detalle versionado y conserva
   el esquema vigente. Al asociar esa versión a una partida, `UsoAPU.snapshot`
   preserva el detalle de costos y snapshots de cotización junto con los datos
   de proyecto, versión, capítulo y partida. Cambios futuros de precio no
   actualizan la versión ni el uso anteriores.
6. La selección de precio vigente es determinista: último precio con vigencia
   no posterior a la fecha de consulta, moneda y unidad coincidentes, proveedor
   activo; ordenar por fecha de vigencia, registro e ID descendentes. Mostrar
   también las cotizaciones históricas para permitir selección explícita.

## 4. Flujo funcional

1. Crear/consultar categoría, material y proveedor persistidos.
2. Registrar cotizaciones consecutivas como filas nuevas y auditar cada alta.
3. Consultar cotizaciones por material y seleccionar una vigente por fecha y
   moneda, con proveedor, precio, vigencia y origen visibles.
4. Desde una partida WBS de una versión concreta, crear una versión APU con
   componentes y cotizaciones seleccionadas. Validar IDs y calcular el costo
   unitario en backend.
5. Asociar la versión inmutable del APU a la partida. Registrar uso auditado y
   snapshot de materiales/precios para identificar precio, proveedor,
   cotización, proyecto, versión del proyecto y versión APU.
6. Consultar el uso persistido y presentarlo en la interfaz, sin usar datos de
   demostración como fuente del costo del proyecto.

## 5. Contratos y superficies

- API nueva bajo `/api/v1/materiales` para catálogo, proveedores, cotizaciones,
  historial y precio vigente.
- Extensión compatible de creación de versiones en `/api/v1/apu-maestro` para
  aceptar líneas referenciadas a material/cotización; las líneas de costo
  existentes siguen válidas.
- Reutilización de asociación/consulta de usos APU existentes. Agregar una
  consulta centrada en proyecto/versión/partida sólo si el contrato actual no
  permite recuperar el contexto necesario.
- Interfaz del módulo de materiales enlazada al proyecto y versión activos;
  mantener las pantallas demo existentes, pero separar claramente su condición
  referencial de los datos persistidos del APU.

## 6. Auditoría y versionamiento

Cada alta de categoría, material, proveedor o cotización debe registrar actor
(si está disponible), qué cambió, cuándo, motivo y origen. Las operaciones de
APU deben asociar empresa/proyecto/versión y actor en la auditoría. El detalle
de `VersionAPU` es inmutable y cada asociación a partida crea un `UsoAPU`
inmutable; un cambio de precio exige crear una nueva cotización y una nueva
versión APU/uso, sin reescribir el historial.

## 7. Impacto, riesgos y mitigaciones

- **Persistencia PostgreSQL:** migración 006 sólo agrega columnas nullable o con
  default seguro; no elimina ni renombra objetos. El ejecutor de migraciones
  debe registrar y verificar 006, respetando el orden 001–005.
- **Compatibilidad de APU:** el detalle JSON conserva los campos del contrato
  anterior; las líneas nuevas añaden datos opcionales/referencias. Pruebas de
  regresión cubren APU legado.
- **Precisión:** almacenar/calcular con `Decimal`; no convertir importes a
  `float` en backend.
- **Unidad/moneda:** no convertir automáticamente precios ni mezclar unidades;
  responder error explícito ante incompatibilidad. Mostrar moneda original.
- **Autenticación:** los flujos existentes reciben actor opcional y no tienen
  autenticación de sesión real. Registrar `no_autenticado` cuando falte actor y
  documentar el límite, sin inventar una identidad.
- **Evidencia visual:** la aprobación funcional requiere levantar la UI y
  comprobar el recorrido desde proyecto/versión y partida hasta material,
  proveedor, cotización y costo, además de pruebas persistidas automatizadas.

## 8. Criterios de validación

- Crear y recuperar material y proveedor desde persistencia.
- Registrar tres cotizaciones y comprobar que las tres permanecen disponibles.
- Seleccionar la cotización vigente esperada con proveedor, fecha, moneda y
  origen correctos.
- Versionar un APU de partida con un material; costo calculado en backend.
- Registrar otra cotización y probar que el APU/uso previo no cambió.
- Verificar auditoría y consultas de trazabilidad hasta proyecto, versión WBS y
  versión APU.
- Ejecutar la aplicación frontend y verificar visualmente el flujo funcional.
- Ejecutar pruebas de regresión backend y lint/build frontend.

La implementación y los resultados se documentarán en
[FASE2C_RESULTADO_FINAL.md](../fases/FASE2C_RESULTADO_FINAL.md),
[TEST_TECNICO_FASE2C.md](../reportes/TEST_TECNICO_FASE2C.md) y
[TEST_FUNCIONAL_FASE2C.md](../reportes/TEST_FUNCIONAL_FASE2C.md).
