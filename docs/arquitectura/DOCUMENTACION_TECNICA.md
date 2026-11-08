# Documentación técnica y funcional

> **Producto oficial:** COS — Construction Operating System  
> **Descriptor:** Gerente Administrativo IA para Construcción  
> **Identidad aprobada:** 2026-11-06. La IA y el análisis documental son parte
> de la visión; su disponibilidad funcional debe verificarse por fase.

> Alcance: inventario del código versionado y de los recursos locales relevantes observados. Los directorios generados (`frontend/node_modules`, `frontend/dist`, `backend/.venv`) no se consideran código fuente. `backend/datos_pdf.db` existe localmente y está ignorado por Git; su contenido no se inspeccionó. Las conclusiones sobre funcionamiento se limitan a lo implementado y validado en el repositorio.

# 1. Resumen Ejecutivo

El sistema es un prototipo web para elaborar y revisar presupuestos de obras de construcción en Nicaragua. Su parte más desarrollada calcula el costo de mano de obra (MO), la duración secuencial de actividades, el flujo semanal, una nómina estimada y la exportación de hojas de cálculo. También incorpora una API para consultar partidas históricas, calcular un ejemplo de materiales y costos y consolidar datos de MO con ese ejemplo.

- **Problema que resuelve:** reunir estimaciones de MO y referencias de costos de construcción y presentar sus importes en vistas tabulares y archivos Excel.
- **Objetivo de negocio:** apoyar la preparación y revisión de presupuestos de obra con parámetros laborales y moneda local, como base para una futura gestión integral.
- **Usuarios objetivo:** personal administrativo, presupuestistas y responsables de costos de proyectos de construcción. No hay roles ni permisos implementados.
- **Flujo principal:** acceso de demostración → tablero estático → abrir EBAR SUR 2 → editar actividades/parámetros de MO o consultar el consolidado → exportar Excel. El catálogo histórico se abre aparte desde el tablero.
- **Límite funcional central:** no existe persistencia del proyecto ni del presupuesto de MO y materiales demo. Al recargar se reinicia el estado de MO. Las partidas de base de datos tienen un endpoint propio, pero no están conectadas a la pantalla APU.

Evidencia principal: [README.md](../../README.md), [frontend/src/app/App.tsx](../../frontend/src/app/App.tsx), [frontend/src/modules/presupuesto-mo/PresupuestoMoModule.tsx](../../frontend/src/modules/presupuesto-mo/PresupuestoMoModule.tsx), [backend/app/main.py](../../backend/app/main.py).

# 2. Arquitectura General

- **Frontend:** SPA en React 19 + TypeScript, servida/desarrollada con Vite 8 y estilos Tailwind CSS 4. No hay router; `App.tsx` controla las pantallas con estado local.
- **Backend:** API REST en FastAPI, con rutas síncronas y SQLAlchemy síncrono.
- **Base de datos:** PostgreSQL mediante `psycopg2`. El backend inicializa tablas SQLAlchemy al arrancar. La migración SQL explícita incorpora el catálogo normalizado de materiales, proveedores y precios.
- **Persistencia funcional actual:** el catálogo histórico se consulta desde PostgreSQL y el POST de partidas escribe entidades APU. Los cálculos de MO, el proyecto demo y la consolidación no se almacenan.
- **Servicios externos:** no se identifican integraciones desplegadas con OpenAI, Azure ni otros proveedores. El backend declara `google-genai`, pero no se encontró uso de ese paquete en el código funcional.
- **IA/agentes:** no identificados como funcionalidad. El tablero muestra una acción de “Configurar Agente IA” que solo presenta un mensaje de fase futura.
- **Exportación:** ExcelJS crea el libro en el navegador; FileSaver inicia la descarga. No hay servicio de Excel en backend.

Flujo textual:

```text
Usuario
↓
Frontend React (estado local + vistas + cálculos MO + exportación Excel)
↓
API FastAPI (JSON: catálogo, demo/materiales, renta, consolidado, partidas)
↓
Servicios Python (consultas y cálculos; consolidación en memoria)
↓
PostgreSQL (catálogo histórico y entidades de proyecto/APU)
```

La flecha a PostgreSQL solo se aplica a operaciones que acceden a la base. Las rutas `/api/consolidado` y `/api/v1/materiales-costos/*` calculan sobre el cuerpo recibido o el JSON demo; no guardan el resultado.

Evidencia: [backend/app/main.py](../../backend/app/main.py), [backend/app/db/session.py](../../backend/app/db/session.py), [backend/app/services/consolidado.py](../../backend/app/services/consolidado.py), [backend/app/services/materiales_costos.py](../../backend/app/services/materiales_costos.py).

# 3. Estructura de Carpetas

Árbol de archivos versionados relevantes:

```text
/
├── .gitignore
├── README.md
├── DOCUMENTACION_TECNICA.md
├── run-dev.bat
├── package-lock.json                 # lockfile en raíz; no hay package.json raíz
├── backend/
│   ├── requirements.txt
│   ├── migrations/
│   │   └── 001_catalogo_materiales.sql
│   ├── app/
│   │   ├── main.py
│   │   ├── apply_migration.py
│   │   ├── api/v1/
│   │   │   ├── catalogo.py
│   │   │   ├── consolidado.py
│   │   │   ├── materiales_costos.py
│   │   │   └── partidas.py
│   │   ├── data/
│   │   │   └── materiales_costos_demo.json
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── session.py
│   │   ├── models/
│   │   │   └── database_models.py
│   │   ├── schemas/
│   │   │   ├── consolidado.py
│   │   │   └── materiales_costos.py
│   │   └── services/
│   │       ├── consolidado.py
│   │       ├── materiales.py
│   │       ├── materiales_costos.py
│   │       └── migrador.py
│   └── tests/
│       ├── test_consolidado.py
│       ├── test_materiales.py
│       └── test_materiales_costos.py
└── frontend/
    ├── BITACORA.md
    ├── examples/
    │   └── Presupuesto_MO_EBAR_SUR_2.xlsx
    ├── index.html
    ├── metadata.json
    ├── package.json
    ├── package-lock.json
    ├── run-dev.bat
    ├── tsconfig.json
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── app/
        │   ├── AccessScreen.tsx
        │   ├── App.tsx
        │   ├── CatalogoMaestroView.tsx
        │   ├── ProjectDashboard.tsx
        │   └── index.css
        └── modules/
            ├── apu/
            │   ├── EstructuraCostosView.tsx
            │   └── types.ts
            ├── consolidado/
            │   ├── BudgetConsolidationService.ts
            │   ├── ConsolidatedProjectView.tsx
            │   └── types.ts
            ├── materiales-costos/
            │   ├── MaterialesCostosModule.tsx
            │   ├── api.ts
            │   └── types.ts
            └── presupuesto-mo/
                ├── PresupuestoMoModule.tsx
                ├── components/
                │   ├── ActivityModal.tsx
                │   ├── BudgetSummaryCards.tsx
                │   ├── ConfigModal.tsx
                │   ├── CronogramaGraficoTable.tsx
                │   ├── MemoriaFlujoTable.tsx
                │   ├── PlanillaNominaTable.tsx
                │   └── PresupuestoMOTable.tsx
                ├── types/
                │   └── budget.ts
                └── utils/
                    ├── calculator.ts
                    └── excelExporter.ts
```

Responsabilidades:

- `frontend/src/app/`: composición de pantallas, acceso demo, navegación y visor del catálogo.
- `frontend/src/modules/`: módulos funcionales por dominio; evita una estructura genérica de páginas/servicios.
- `presupuesto-mo/components/`: tablas, tarjetas y modales de edición/configuración.
- `presupuesto-mo/utils/`: cálculo laboral y generación de Excel.
- `materiales-costos/api.ts`: cliente HTTP para el módulo demo de materiales y renta.
- `consolidado/`: adaptación de MO y del demo al contrato de consolidación y vista ejecutiva.
- `backend/app/api/v1/`: routers FastAPI. `consolidado.py` se monta bajo `/api`, los demás bajo `/api/v1`.
- `backend/app/models/`: entidades SQLAlchemy.
- `backend/app/schemas/`: modelos de validación/transporte Pydantic.
- `backend/app/services/`: lógica de catálogo/precios, costos, consolidación e importación histórica.
- `backend/app/db/`: Base declarativa, engine, sesión y dependencia `get_db`.
- `backend/migrations/`: migración manual de tablas de materiales/precios y trigger de inmutabilidad.
- `backend/tests/`: pruebas unitarias de cálculo y servicios; no se identifican pruebas de interfaz ni de endpoints HTTP.
- No existen carpetas `pages/`, `hooks/` o `services/` generales en frontend. Tampoco se encontró un hook React personalizado.

Recursos locales no versionados: existen `backend/.env`, `backend/datos_pdf.db`, `backend/.venv`, `frontend/node_modules` y `frontend/dist`. El archivo SQLite es referenciado por el migrador, pero está excluido por `.gitignore`; no asumir su presencia en otros entornos. El `.env` local no se inspeccionó ni se documentan sus valores.

# 4. Inventario de Módulos

| Nombre | Objetivo | Pantallas | Servicios utilizados | Estado |
|---|---|---|---|---|
| Acceso de demostración | Simular ingreso al espacio de trabajo | `AccessScreen` | Estado local de `App`; sin API de autenticación | Parcial |
| Tablero/portafolio | Mostrar proyectos predefinidos y accesos rápidos | `ProjectDashboard` | Total consolidado propagado por estado local | Parcial; datos estáticos |
| Mano de Obra (MO) | Editar cuadrillas, calcular costos, cronograma, flujo y nómina | Memoria/flujo, cronograma, nómina | `calculator.ts`, `excelExporter.ts`; cálculos en navegador | Parcial; cálculos utilizables, sin persistencia |
| Estructura de Costos / APU | Presentar costo de MO y espacios de materiales/equipo | `EstructuraCostosView` | Cálculo MO recibido como props | Parcial; materiales/equipos fijados en cero; no usa API de partidas |
| Materiales y costos | Calcular materiales, equipos, herramientas, transporte e indirectos de un proyecto ejemplo; cotizar renta | `MaterialesCostosModule` | `GET demo`, `POST calcular`, `POST renta` | Parcial; demo, no conectado al catálogo PostgreSQL |
| Consolidado | Convertir y agrupar MO y recursos demo a NIO, presentar resumen/detalle y exportar | `ConsolidatedProjectView` | `BudgetConsolidationService`, API `/api/consolidado`, ExcelJS | Parcial; MO + demo, sin almacenamiento ni fuentes reales completas |
| Visor del Catálogo Maestro | Buscar, filtrar y paginar partidas históricas | `CatalogoMaestroView` | `GET /api/v1/catalogo`, SQLAlchemy/PostgreSQL | Parcial; consulta operativa, sin edición de catálogo desde UI |
| Partidas / APU persistido | Consultar y crear partidas con líneas de APU | No hay pantalla identificada | `GET/POST /api/v1/partidas`, SQLAlchemy | Parcial; API disponible sin integración frontend y sin endpoints de capítulos/proyectos |
| Herramientas y Equipos | Gestión independiente de equipo | Entrada deshabilitada en navegación | Ninguno | Pendiente |
| Reportes | Reportería independiente | Entrada deshabilitada en navegación | Ninguno | Pendiente |
| Agente IA | Asistente presupuestista | Acción placeholder en tablero | `google-genai` declarado pero no usado | Pendiente |
| Subcontratos | Incluir costos de subcontrato en presupuesto | No hay módulo ni pantalla | El contrato de consolidación acepta lista, el frontend envía `[]` | Pendiente |
| Precios de materiales y proveedores | Mantener histórico consultable por vigencia | No hay endpoints CRUD ni pantalla | Modelos y servicio de consulta; migración SQL | Parcial; esquema y consultas, pero sin captura/consulta HTTP integrada |

`PresupuestoMOTable` está implementado como componente, pero no aparece montado por `PresupuestoMoModule`; las pantallas MO actualmente visibles se componen de pestañas y `ConsolidatedProjectView`.

# 5. Inventario de Componentes React

No hay “hooks” reutilizables separados. Los hooks detectados son `useState`, `useEffect` y `useMemo` locales a las pantallas/componentes.

| Componente | Ubicación | Propósito | Props | Dependencias y servicios | Pantallas donde se usa |
|---|---|---|---|---|---|
| `App` | `frontend/src/app/App.tsx` | Controla acceso, sección activa, tablero, catálogo y espacio de proyecto | Sin props | `AccessScreen`, `ProjectDashboard`, `CatalogoMaestroView`, módulos MO y materiales; estado local | Raíz de toda la SPA |
| `AccessScreen` | `frontend/src/app/AccessScreen.tsx` | Formulario de ingreso demo | `onLogin(username,password)`, `error` | React `useState`, Lucide | Acceso |
| `ProjectDashboard` | `frontend/src/app/ProjectDashboard.tsx` | Portafolio fijo, total y accesos rápidos | `username`, `consolidatedTotal`, `onOpenProject`, `onOpenCatalog`, `onLogout` | `useState`, Lucide; sin API | Tablero |
| `CatalogoMaestroView` | `frontend/src/app/CatalogoMaestroView.tsx` | Tabla con búsqueda, filtros, paginación y reintento | `onBack` | `useEffect`, `useState`, `fetch /api/v1/catalogo`, `AbortController` | Visor del catálogo |
| `PresupuestoMoModule` | `frontend/src/modules/presupuesto-mo/PresupuestoMoModule.tsx` | Estado y cálculo MO; expone vistas de MO, APU o consolidado según `mode` | `mode?: module/consolidated/apu`, `onConsolidatedTotalChange?` | `calculator.ts`, componentes MO/APU/consolidado, exportador | MO, APU y consolidado |
| `BudgetSummaryCards` | `.../presupuesto-mo/components/BudgetSummaryCards.tsx` | Tarjetas de costo, duración, semanas y FSR | `cronograma` | `CronogramaCalculado`, Lucide | Cabecera del modo MO |
| `MemoriaFlujoTable` | `.../presupuesto-mo/components/MemoriaFlujoTable.tsx` | Matriz semanal de costo y controles de personal/rendimiento | `cronograma`, `onModifyPersonal`, `onEditActivity`, `onUpdateRendimientoBase?` | Estado local de fórmulas, tipos laborales | Pestaña Memoria y Flujo |
| `CronogramaGraficoTable` | `.../presupuesto-mo/components/CronogramaGraficoTable.tsx` | Representa la secuencia Fin-Inicio por semana | `cronograma` | Estado local de fórmulas, Lucide | Pestaña Cronograma |
| `PlanillaNominaTable` | `.../presupuesto-mo/components/PlanillaNominaTable.tsx` | Desglosa colaboradores, deducciones y cargas estimadas | `actividades`, `config`, `nombreProyecto` | `generarPlanillaNomina`, `calcularSalarios`, estado local | Pestaña Planilla y Nómina |
| `ActivityModal` | `.../presupuesto-mo/components/ActivityModal.tsx` | Crear/editar actividad de obra | `isOpen`, `onClose`, `onSave`, `actividadEditar?`, `siguienteItem` | React `useState/useEffect`, tipos MO | Modal desde MO y consolidado |
| `ConfigModal` | `.../presupuesto-mo/components/ConfigModal.tsx` | Ajustar y restablecer parámetros laborales | `isOpen`, `onClose`, `config`, `onSaveConfig`, `onResetDefault` | `calcularSalarios`, configuración default | Modal en modo MO |
| `PresupuestoMOTable` | `.../presupuesto-mo/components/PresupuestoMOTable.tsx` | Tabla de partidas MO con acciones y fórmulas | `cronograma`, callbacks de editar/eliminar/agregar, `nombreProyecto`, `presentation?` | React, tipos MO, Lucide | No se encontró uso en el árbol actual |
| `EstructuraCostosView` | `frontend/src/modules/apu/EstructuraCostosView.tsx` | Resumen APU que presenta MO y ceros para materiales/equipos | `actividades`, `cronograma` | Tipos MO, Lucide; no consume API APU | Modo APU |
| `ConsolidatedProjectView` | `frontend/src/modules/consolidado/ConsolidatedProjectView.tsx` | Resumen, filtrado, acciones MO y exportación consolidada | `actividades`, `config`, `cronograma`, `nombreProyecto`, callbacks de total/CRUD | API demo de materiales, `BudgetConsolidationService`, carga diferida Excel | Modo consolidado |
| `MaterialesCostosModule` | `frontend/src/modules/materiales-costos/MaterialesCostosModule.tsx` | Resumen de costos, materiales consolidados y simulador de renta | `onBackToDashboard` | `api.ts` (GET demo, POST calcular/renta), React | Módulo Materiales y Costos |

Los componentes muestran las pantallas de MO incorporadas bajo `PresupuestoMoModule`. El catálogo es una pantalla aparte, no un tab del módulo de costos.

# 6. Inventario de APIs

Todas las rutas identificadas están montadas en `backend/app/main.py`. Los errores de validación Pydantic/FastAPI producen respuestas HTTP de validación; se señalan además los errores explícitos de cada handler.

| Método y ruta | Entrada | Salida | Descripción | Módulo relacionado |
|---|---|---|---|---|
| `GET /` | Ninguna | `{status, message}` | Estado y texto de backend activo | Diagnóstico |
| `GET /health` | Ninguna | `{status}` | Health check básico; no verifica conexión DB | Diagnóstico |
| `GET /api/v1/catalogo` | Query: `page` (≥1, default 1), `limit` (1–100, default 20), `search` (≤120), `categoria` (≤80) | `{items:[{id,codigo,descripcion,unidad,costo_unitario,categoria}],total,page,limit,total_pages,categorias}` | Filtra, ordena por código y pagina `maestro_partidas` | Catálogo Maestro |
| `GET /api/v1/partidas` | Query opcional `capitulo_id` > 0 | Lista de partidas con `id`, `capitulo_id`, código, descripción, unidad, cantidad, rendimiento, subtotales MO/material/equipo, `costo_total` y líneas `analisis_unitarios` | Lee partidas y líneas APU; cálculo parcial = cantidad × costo unitario | Partidas/APU |
| `POST /api/v1/partidas` | `capitulo_id`, `codigo`, `descripcion`, `unidad`, `cantidad` (default 1), `rendimiento?`, `analisis_unitarios[]` (`tipo`, descripción, unidad, cantidad, costo unitario, rendimiento?) | `PartidaResponse` como arriba; HTTP 201 | Comprueba que exista capítulo, calcula costo unitario agregado, guarda partida y líneas en transacción SQLAlchemy. Capítulo inexistente → 404 | Partidas/APU |
| `GET /api/v1/materiales-costos/demo` | Ninguna | `Project` con `meta`, actividades, tarifas de equipo; JSON usa aliases camelCase | Lee y valida `backend/app/data/materiales_costos_demo.json` | Materiales y costos |
| `POST /api/v1/materiales-costos/calcular` | Objeto `Project` (metadatos/tasa/AIU, actividades con APU y costos varios) | Moneda USD; subtotales materiales/equipos/herramientas/transporte/otros, directo, administración, imprevistos, utilidad, IVA utilidad, indirectos, gran total, materiales consolidados y detalles de actividad | Calcula importes en Python; no escribe datos | Materiales y costos |
| `POST /api/v1/materiales-costos/renta` | `{equipoId, modalidad: dia\|semana\|mes, periodos>0, unidades>0, tasaCambioNio>0}` | `{equipo,modalidad,total_usd,total_nio}` | Cotiza con el promedio de tarifa del JSON demo. Equipo inexistente → 404 | Simulador de renta |
| `POST /api/consolidado` | `{manoObra:[BudgetSourceLine], proyectoMateriales:Project, subcontratos?:[BudgetSourceLine]}`. Cada línea incluye id, categoría, descripción, unidad, cantidad, costo unitario, moneda y referencia opcional | `{items:[{id,origen,categoria,descripcion,unidadMedida,cantidad,costoUnitario,costoTotal,referencias}], resumen:{moneda,tasaCambio,manoObra,materiales,equipos,subcontratos,otros,totalGeneral}}` | Normaliza a NIO, agrupa recursos equivalentes y calcula totales. No persiste. `ValueError` → 422 | Consolidado |
| `POST /api/consolidado/resumen` | Igual al POST de consolidación | Solo objeto `resumen` del consolidado | Calcula el consolidado completo y devuelve subtotales/total | Consolidado |

Detalles de contrato:

- `TipoAPU` permite `Material`, `Mano de Obra` y `Equipo/Maquinaria`.
- El modelo `Project` de `/materiales-costos` es un esquema Pydantic de entrada/demo, no la entidad SQLAlchemy `Proyecto`.
- La pantalla APU no llama a `/api/v1/partidas`; tampoco hay endpoints HTTP de creación de proyectos/capítulos, registro de cotizaciones, proveedores o materiales.
- `backend/app/services/materiales.py` ofrece funciones de consulta de precios, pero no tiene router/endpoints asociados.

# 7. Modelos de Datos

## Entidades persistidas (SQLAlchemy/PostgreSQL)

| Entidad / tabla | Campos y tipos principales | Relaciones |
|---|---|---|
| `Proyecto` / `proyectos` | `id:int`, `nombre:str(200)`, `ubicacion:str?`, `estado:str(50)` default Borrador, `fecha_creacion:datetime tz`, `costo_total_mo:Numeric(18,2)` | Uno-a-muchos con `Capitulo`; borrado en cascada configurado |
| `Capitulo` / `capitulos` | `id:int`, `proyecto_id:int FK`, `codigo:str(30)`, `nombre:str(200)`; único `(proyecto_id,codigo)` | Muchos-a-uno con `Proyecto`; uno-a-muchos con `Partida` |
| `Partida` / `partidas` | `id:int`, `capitulo_id:int FK`, `codigo:str(50)`, `descripcion:str(500)`, `unidad:str(30)`, `cantidad:Numeric(18,4)`, `costo_unitario:Numeric(18,4)`, `rendimiento:Numeric(18,4)?` | Muchos-a-uno con `Capitulo`; uno-a-muchos con `AnalisisPrecioUnitario` |
| `AnalisisPrecioUnitario` / `analisis_precios_unitarios` | `id:int`, `partida_id:int FK`, `tipo:enum TipoAPU`, `descripcion:str(300)`, `unidad:str(30)`, `cantidad:Numeric(18,4)`, `costo_unitario:Numeric(18,4)`, `rendimiento:Numeric(18,4)?` | Muchos-a-uno con `Partida` |
| `MaestroPartidas` / `maestro_partidas` | `id:int`, `codigo:str(50)` único, `descripcion:str(500)`, `unidad:str(30)`, `costo_unitario:Numeric(18,4)`, `categoria:str(80)`, `fecha_actualizacion:datetime tz` | Relación opcional uno-a-uno con `Material` |
| `CategoriaMaterial` / `categorias_materiales` | `id:int`, `codigo:str(50)` único, `nombre:str(120)` único, `descripcion:text?`, `activo:bool`, `creado_en:datetime tz` | Uno-a-muchos con `Material` |
| `Proveedor` / `proveedores` | `id:int`, `nombre:str(200)`, `ruc:str(20)?` único, `telefono:str(40)?`, `correo:str(254)?`, `activo:bool`, `creado_en:datetime tz` | Uno-a-muchos con `MaterialPrecio` |
| `Material` / `materiales` | `id:int`, `codigo:str(50)` único, `descripcion:str(500)`, `unidad:str(30)`, `categoria_id:int FK`, `maestro_partida_id:int FK?` único, `activo:bool`, `creado_en` y `actualizado_en:datetime tz` | Muchos-a-uno con categoría; vínculo opcional a una partida maestra; uno-a-muchos con precios |
| `MaterialPrecio` / `materiales_precios` | `id:int`, `material_id:int FK`, `proveedor_id:int FK`, `costo_unitario:Numeric(18,4)`, `moneda:str(3)` default NIO, `unidad_precio:str(30)`, `fecha_vigencia:datetime tz`, `registrado_en:datetime tz`, `observacion:text?` | Muchos-a-uno con `Material` y `Proveedor`. La migración instala trigger que prohíbe `UPDATE`/`DELETE` |

Las relaciones de capítulos, partidas y APUs usan cascadas configuradas en ORM/foreign keys. Material y precios aplican restricciones `RESTRICT` para evitar eliminar referencias históricas.

## Modelos de transporte/demo (no equivalen a tablas)

- `Project` Pydantic demo: `ProjectMeta` (nombre, moneda USD/NIO, tasa NIO/USD, AIU), lista de `Activity` y tarifas `EquipmentBenchmark`.
- `Activity`: id, item, código, descripción, unidad, cantidad > 0, dimensiones opcionales, APU y costos varios. APU demo incluye listas de materiales/equipos/herramientas, no MO.
- `CostLine`: nombre, unidad, cantidad no negativa y precio unitario no negativo. `OtherCost`: categoría `transporte` o `otro`.
- `BudgetSourceLine`: origen del consolidado, categoría, descripción, unidad, cantidad, costo unitario, moneda NIO/USD y referencia.
- `ConsolidatedItem`/`ConsolidationSummary`: proyección calculada de la consolidación; no son entidades ORM.
- `Actividad`, `ConfiguracionLaboral`, `CronogramaCalculado`, `ColaboradorNomina`: interfaces TypeScript usadas para cálculo cliente de MO; no se guardan en la base.
- No se identifican entidades persistidas específicas de subcontratos, tarifa de equipo o presupuesto completo.

No hay relaciones persistidas que vinculen `Proyecto` a materiales/precios de forma que el flujo demo pueda cargar automáticamente precios por proveedor.

# 8. Flujo de Negocio

1. **Creación del proyecto:** no está implementada. El tablero muestra dos proyectos codificados de forma estática: EBAR SUR 2 y Edificio Terrazas Central. El segundo no tiene presupuesto; la acción “Crear Nuevo Proyecto” solo comunica que llegará después.
2. **Registro de costos:** MO se edita en el navegador con actividades de ejemplo y parámetros laborales. Materiales, equipo, herramientas, transporte e indirectos provienen del JSON de demostración, no de cotizaciones guardadas. Se puede consultar el catálogo histórico desde otra pantalla. No hay alta de costos mediante UI.
3. **Consolidación:** al mostrar la vista, el frontend carga el proyecto demo, serializa las actividades calculadas de MO y envía el payload a `POST /api/consolidado`. El backend transforma USD a NIO con la tasa del demo, agrupa filas y separa los orígenes MO, material, equipo, subcontrato y otros. La lista de subcontratos llega vacía desde la pantalla.
4. **Cálculo de presupuesto:** la rutina MO secuencia actividades Fin-Inicio, calcula días por rendimiento y costo diario de cuadrilla usando el FSR. El backend de materiales calcula costo directo, AIU e IVA sobre utilidad según porcentajes del JSON. El consolidado presenta los importes disponibles; no incluye la cotización de renta de forma automática.
5. **Exportación:** desde MO se descarga un libro Excel de cuatro hojas; desde el consolidado se añaden siete hojas ejecutivas (resumen, cinco hojas por origen y consolidado general) y se conservan las cuatro hojas MO. La exportación corre en el navegador y no se archiva en servidor.

# 9. Flujo Técnico

## Cambios locales de MO

1. El usuario abre el modal de actividad o parámetros.
2. El callback actualiza `actividades` o `config` en `PresupuestoMoModule`.
3. React vuelve a renderizar; `useMemo` llama `calcularCronogramaCompleto(actividades, config)`.
4. Las tablas y tarjetas reciben los resultados como props. No hay solicitud a backend ni escritura en base de datos.
5. La exportación importa `excelExporter.ts` bajo demanda, genera el `.xlsx` con ExcelJS y lo entrega al navegador mediante FileSaver.

## Materiales demo y consolidado

1. `MaterialesCostosModule` solicita `GET /api/v1/materiales-costos/demo`.
2. El handler carga el JSON demo, Pydantic lo valida y se devuelve a React.
3. React solicita `POST /api/v1/materiales-costos/calcular`; la API calcula sobre el proyecto recibido. La renta envía otro POST que selecciona tarifa del JSON.
4. `ConsolidatedProjectView` combina el proyecto demo con el cronograma local y `BudgetConsolidationService` envía `POST /api/consolidado`.
5. FastAPI valida el body; el servicio Python convierte costos y suma/agrupe líneas en memoria. Devuelve detalle/resumen a la vista.
6. El total se notifica a `App` y se presenta en el tablero. No hay escritura de consolidado en PostgreSQL.

## Catálogo y partidas persistidas

1. El visor de catálogo construye query params y hace `GET /api/v1/catalogo`.
2. FastAPI resuelve `get_db`; SQLAlchemy consulta `maestro_partidas` y devuelve filas, conteo y categorías.
3. En `POST /api/v1/partidas`, el API valida el capítulo, inserta partida y líneas APU, confirma transacción y serializa subtotales.
4. Los endpoints de partidas no están vinculados a una pantalla actual.

Al iniciar el backend, el lifespan puede ejecutar `drop_all` solo si `APP_ENV=development` y `RESET_DB_SCHEMA_ON_STARTUP=1`, luego ejecuta `create_all` y agrega `rendimiento` si falta en `partidas`. La migración SQL 001 que añade el esquema de materiales y el trigger es manual; `create_all` no crea ese trigger.

# 10. Dependencias Críticas

## Frontend

| Dependencia | Uso |
|---|---|
| `react`, `react-dom` (`^19.0.1`) | UI SPA |
| `vite` (`^8.3.5`), `@vitejs/plugin-react` (`^6.1.2`) | Servidor y build |
| `typescript` (`^7.0.2`) | Tipos y comando lint (`tsc --noEmit`) |
| `tailwindcss` (`^4.3.3`), `@tailwindcss/vite` (`^4.3.3`) | Estilos |
| `exceljs` (`^4.4.0`), `file-saver` (`^2.0.5`) | Generación y descarga de libros |
| `lucide-react` (`^0.546.0`) | Iconografía |

## Backend

`fastapi`, `uvicorn[standard]`, `sqlalchemy`, `psycopg2-binary`, `pydantic`, `google-genai` están declaradas sin versiones fijadas en `backend/requirements.txt`.

## Dependencias externas y riesgos tecnológicos

- Requiere PostgreSQL para catálogo y persistencia de partidas; el frontend por sí solo no habilita esas funciones.
- El demo usa un JSON local versionado y no sincroniza precios históricos.
- `python-dotenv` se importa en `backend/app/db/session.py`, pero no está declarado explícitamente en `requirements.txt`; puede fallar en una instalación limpia si no llega como dependencia transitiva.
- `google-genai` agrega instalación pero no tiene un flujo de producto asociado.
- No hay suite frontend de pruebas ni pruebas de contrato HTTP identificadas; las 12 pruebas del backend son unitarias.
- El exportador tiene chunk minificado por encima de 500 kB. El build también reporta uso de `__dirname` incompatible con el futuro loader nativo de configuración de Vite.
- Dependencias backend sin pins hacen que una instalación futura no sea necesariamente reproducible.
- La configuración de reinicio de schema puede borrar tablas/datos al arrancar si se habilita junto con `APP_ENV=development`; su uso requiere control de entorno.

# 11. Variables de Entorno

No se encontró `.env.example`. `backend/.env` existe localmente, pero sus valores no se inspeccionaron y no se reproducen aquí.

## Frontend

| Variable | Uso | Default / comportamiento |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL en visor de catálogo, materiales y consolidación | `http://127.0.0.1:8080`; elimina `/` final |
| `DISABLE_HMR` | Configuración de Vite: si es `"true"`, deshabilita HMR y watchers | HMR activo salvo que se establezca exactamente en `"true"` |

## Backend

| Variable | Uso | Default / comportamiento |
|---|---|---|
| `DATABASE_URL` | Conexión SQLAlchemy/PostgreSQL | `postgresql+psycopg2://postgres@localhost:5432/costos_obra`; normaliza URL `postgresql://` a driver psycopg2 |
| `APP_ENV` | Habilita la condición de reset del esquema en entorno `development` | No tiene default funcional |
| `RESET_DB_SCHEMA_ON_STARTUP` | Si vale `"1"` junto con `APP_ENV=development`, el lifespan ejecuta `drop_all` antes de `create_all` | No se habilita por defecto; potencialmente destructiva |

`load_dotenv` busca `backend/.env`. No se identificaron variables para OpenAI, Google Gemini, Azure ni credenciales de otro proveedor de IA.

# 12. Integraciones Detectadas

| Integración | Evidencia y uso |
|---|---|
| PostgreSQL | Persistencia de catálogo histórico y tablas de proyecto/APU/materiales. URL configurable por `DATABASE_URL`. |
| SQLite local | `backend/app/services/migrador.py` lee `backend/datos_pdf.db` en modo lectura para previsualizar/importar el catálogo hacia PostgreSQL. El archivo está localmente presente pero no versionado; no se verificó esquema ni cantidad de datos. |
| Excel | ExcelJS + FileSaver construyen y descargan libros desde frontend. Hay workbook de referencia en `frontend/examples/Presupuesto_MO_EBAR_SUR_2.xlsx`. |
| OpenAI | No identificado en dependencias o código funcional. |
| Azure | No identificado. |
| Google GenAI | `google-genai` aparece en `backend/requirements.txt`, pero no se encontró importación, cliente, variable de clave ni llamada de API. No constituye una integración activa. |
| HTTP interno | `fetch` desde la SPA al backend local. No se identifican proveedores externos HTTP. |
| Catálogo histórico | El visor lee `maestro_partidas`; el migrador usa la base SQLite opcional para poblarla. |

# 13. Estado Actual del Proyecto

| Área | Clasificación | Evidencia de alcance |
|---|---|---|
| Cálculos, cronograma, flujo semanal y nómina MO | Funcional como prototipo | Entradas editables, cálculo cliente y visualización; no guarda cambios |
| Exportación Excel MO | Funcional | Cuatro hojas producidas en frontend |
| Visor del catálogo | Parcial | Consulta/paginación implementada; depende de PostgreSQL y no permite administrar |
| API de consulta/creación de partidas | Parcial | GET/POST presentes, sin CRUD completo ni pantalla cliente |
| Materiales y costos | Parcial | Cálculo y datos demo API; sin conexión a precio vigente persistido |
| Consolidado | Parcial | MO y proyecto demo consolidados; sin persistencia ni todos los orígenes reales |
| Proyectos, subcontratos, equipo independiente, reportes | Sin implementar o placeholder | No hay modelos/API/pantalla funcional completa |
| Autenticación real y permisos | Sin implementar | Credenciales de demostración verificadas únicamente en frontend |
| Pruebas | Parcial | 12 pruebas unitarias backend; no se identificaron tests UI/API end-to-end |

**Avance estimado: 45%** del objetivo de un motor presupuestario listo para operación. Es una estimación funcional, no una métrica del repositorio: MO, cálculos, demo de materiales, catálogo y exportación aportan un flujo demostrable; faltan persistencia del presupuesto, administración de datos, conexión APU↔materiales y gestión real de proyectos/usuarios, además de cobertura integral.

Validación observada en esta revisión: `npm.cmd run lint` y `npm.cmd run build` finalizan correctamente desde `frontend`; `python -m unittest discover -s tests -v` finaliza con 12 tests exitosos desde `backend`. Build con advertencias de configuración/chunk descritas en §10.

# 14. Deuda Técnica Detectada

## Alta

- **Presupuesto no persistente:** actividades, parámetros, nombre, consolidado y cambios se pierden al recargar; impide operar múltiples proyectos.
- **Autenticación simulada:** el control de ingreso se realiza enteramente en React y no crea sesión/token ni consulta identidad de servidor.
- **Fuentes de costos desconectadas:** el APU visual presenta materiales/equipos en cero; las partidas guardadas no se consumen desde el frontend y el catálogo de precios no alimenta el demo.
- **Migración PostgreSQL manual:** `create_all()` no crea restricciones/trigger de la migración 001. El estado de producción depende de ejecutar la migración y el importador en orden correcto.
- **Reset de esquema potencialmente destructivo:** existe `drop_all` condicionado a variables de entorno; debe aislarse/confirmarse y protegerse antes de desplegar.
- **Validación de parámetros y cálculos laborales:** las tasas legales se definen en cliente como valores predeterminados editables; no existe fuente/versionado de vigencia normativa ni revisión funcional independiente visible en el código.

## Media

- **Proyectos/portafolio fijos:** tablero reporta “2 proyectos”, pero son fixtures de UI; no consulta `Proyecto`.
- **Módulos parciales y vacíos:** Subcontratos, Equipos y Reportes no tienen flujos; renta es una simulación aparte.
- **Carga de precios por proveedor incompleta:** esquema y consultas helper existen, pero no hay endpoints para registrar/listar cotizaciones ni interfaz.
- **Reproducibilidad:** dependencias backend sin pins; `python-dotenv` importado pero no declarado directamente.
- **Errores de exportación MO:** el handler hace `console.error` y no ofrece notificación visible al usuario, a diferencia del export consolidado.
- **Sin pruebas frontend/contrato API:** cambios de UI, aliases y CORS no se validan en una suite automática.
- **Riesgo de configuración Vite:** advertencia por `__dirname`; revisar compatibilidad en upgrades del loader.

## Baja

- `PresupuestoMOTable.tsx` no aparece utilizado por la aplicación actual.
- `backend/app/services/migrador.py` incluye rutina de actualización masiva de precios, pero no tiene comando dedicado/endpoint claramente conectado al flujo de negocio y no se encontró uso.
- Lockfile en raíz sin `package.json` raíz; el proyecto npm real está en `frontend/`.
- Chunk del exportador Excel supera el umbral de 500 kB; puede aumentar tiempo de descarga al abrir esa función.

# 15. Roadmap Recomendado

## Fase 1 — Base operativa segura y persistencia

- Definir alcance de autenticación, usuarios, roles y sesiones en backend.
- Diseñar endpoints y persistencia para proyectos, configuración laboral, actividades, fuentes de costo y presupuestos versionados.
- Incorporar validación de datos y migraciones versionadas reproducibles; retirar/aislar cualquier reset destructivo en entornos compartidos.
- Declarar y fijar dependencias backend; agregar configuración documentada de `.env.example`.
- Añadir tests de API y flujo de persistencia.

## Fase 2 — Integración catálogo, APU y materiales

- Completar API CRUD (o alcance mínimo de negocio) de capítulos, partidas, materiales, proveedores y cotizaciones.
- Implementar UI de APU para consultar/editar partidas y conectar `EstructuraCostosView` con `/api/v1/partidas`.
- Seleccionar cotización vigente por moneda/proveedor e integrar precios en cálculos, conservando trazabilidad, fecha y unidad.
- Definir cómo se normalizan moneda, unidades y vínculo partida maestra↔material.

## Fase 3 — Consolidación integral de proyecto

- Enviar MO persistida y costos seleccionados a consolidación; desarrollar gestión de subcontratos, equipo y otros costos.
- Acordar reglas para duplicados, AIU, impuestos, cambio de moneda y granularidad; compartir reglas entre cálculo y exportación.
- Reemplazar datos estáticos del tablero por proyectos reales y agregar filtros/estados/versiones.
- Validar que el total consolidado coincida con subtotales y libro exportado en escenarios representativos.

## Fase 4 — Reportes, IA opcional y puesta en producción

- Crear reportes/aprobaciones con permisos, auditoría de cambios y exportaciones versionadas.
- Decidir si se necesita IA; solo entonces diseñar proveedor, tratamiento de datos, secretos, validaciones y UX. No asumir que `google-genai` ya presta ese servicio.
- Automatizar tests de UI/API, evaluación de cálculos, accesibilidad y migraciones en CI.
- Reducir warnings de Vite/chunk, medir rendimiento y preparar despliegue, backups, observabilidad y recuperación.

# 16. Casos de Prueba Recomendados

| Módulo | Objetivo de prueba | Datos de entrada | Resultado esperado |
|---|---|---|---|
| Acceso | Confirmar comportamiento demo y su límite de sesión | Usuario/contraseña válidos e inválidos; recargar después de ingresar | Válidos abren tablero, inválidos muestran error; documentar que no hay sesión de backend ni control de autorización |
| Tablero/proyectos | Evitar mostrar fixtures como persistidos | Proyecto inexistente, abrir ficha y “Crear Nuevo Proyecto” | La interfaz comunica estado no implementado; fase futura no debe crear falsos registros |
| MO | Verificar costo/tiempo frente a una solución conocida | Una actividad: cantidad 10, rendimiento 2/día, 1 oficial, 1 ayudante; configuración default | 5 días; costo diario igual a salarios reales configurados; costo total consistente con la suma semanal |
| MO | Cubrir límites y recálculo | Cantidad cero/negativa, rendimiento cero, cuadrilla sin ayudante, editar/eliminar/restablecer actividad | Rechazo o normalización definida, sin `NaN`/Infinity; sumas recalculadas; confirmación al borrar/restablecer |
| Nómina | Verificar conciliación de colaboradores y costos | Dos actividades con cuadrillas y jornadas diferentes; configuración de deducciones | Bruto, INSS laboral, IR, neto y costo patronal por colaborador concilian con subtotales MO |
| APU | Verificar contrato backend y enlazado futuro | GET con/sin `capitulo_id`; POST capítulo inexistente y partida con líneas de tres tipos | Filtrado esperado; 404 para capítulo inválido; subtotales y costo total iguales a suma de líneas |
| Materiales demo | Repetir pruebas unitarias existentes y probar contrato HTTP | JSON demo; cantidades y precios con decimales; campos inesperados | Totales, AIU, unidades y alias camelCase correctos; inválidos no producen éxito falso |
| Renta | Verificar periodos, unidades y moneda | Equipo válido, cada modalidad, tasa conocida; equipo desconocido y valores no positivos | USD/NIO iguales a tarifa promedio × períodos × unidades × tasa; validación y 404 coherentes |
| Catálogo | Verificar búsqueda y paginación con DB de prueba | Códigos/descripciones/unidades con coincidencias, categoría y límites page/limit | Conteo y resultados consistentes, ordenados por código; filtros no alteran categorías disponibles |
| Precios históricos | Verificar vigencia y aislamiento por moneda | Proveedor activo/inactivo, múltiples fechas, NIO/USD, unidad discrepante | Devuelve la última cotización aplicable por proveedor; promedio solo de las vigentes de moneda/unidad correcta |
| Consolidado | Verificar cambio de moneda y deduplicación | Líneas MO NIO, materiales USD, tasa conocida, IDs repetidos y costos por categoría | Totales NIO correctos, agrupación estable, referencias conservadas; ID repetido conflictivo da 422 |
| Excel | Asegurar conciliación, hojas y archivo | Presupuesto con MO/material/equipo/subcontrato/otros y proyecto vacío | Libro MO de 4 hojas o consolidado de 11; total y detalle concilian, hoja vacía válida, descarga notifica errores |
| Integración/persistencia | Confirmar ciclo recarga | Crear/editar proyecto y costos (cuando exista API), guardar y recargar | Datos y versión sobreviven recarga; aislamiento por proyecto/usuario, auditoría y no doble contabilización |

# 17. Resumen para Director Administrativo

- **Estado general:** prototipo navegable de cálculo y consulta; no es aún un sistema de gestión presupuestaria persistente.
- **Qué ya funciona:** cálculo demostrativo de MO, secuencia de obra y flujo semanal, nómina estimada, catálogo histórico consultable con PostgreSQL, cálculo demo de costos, consolidado MO+demo y descarga Excel.
- **Qué falta:** crear/guardar proyectos, usuarios y permisos, integrar precios actuales al APU, completar subcontratos/equipos/reportes y hacer que el presupuesto sobreviva al cierre/recarga.
- **Riesgos:** información local no persistida; tarifas/demo pueden no representar una obra real; tablas/trigger dependen de migración manual; valores laborales deben validarse y mantenerse vigentes; no existe autenticación de servidor.
- **Prioridad inmediata:** acordar el modelo persistente del proyecto y las reglas de cálculo/moneda; construir API y migraciones antes de extender más pantallas.
- **Próximo hito recomendado:** crear un proyecto real, guardar sus parámetros/actividades y reabrirlo sin pérdida; el criterio de aceptación es que totales y Excel reproduzcan los datos persistidos.

# 18. Matriz de Trazabilidad

| Módulo | Pantalla | API | Modelo | Estado |
|---|---|---|---|---|
| Acceso demo | `AccessScreen` | No identificada | Estado `user` local; sin modelo de usuario | Parcial |
| Tablero | `ProjectDashboard` | No identificada | Proyectos codificados en UI; `Proyecto` no conectado | Parcial |
| Mano de Obra | Pestañas de `PresupuestoMoModule` | No identificada | Interfaces TypeScript `Actividad`, `ConfiguracionLaboral`, `CronogramaCalculado` | Parcial, cliente |
| APU | `EstructuraCostosView` | `GET/POST /api/v1/partidas` existen pero no se invocan desde la pantalla | `Partida`, `AnalisisPrecioUnitario`, `TipoAPU` | Parcial |
| Materiales/costos | `MaterialesCostosModule` | `GET/POST /api/v1/materiales-costos/*` | Pydantic `Project`, `Activity`, `Apu`; fuente JSON, no tabla presupuesto | Parcial, demo |
| Consolidado | `ConsolidatedProjectView` | `POST /api/consolidado` | Pydantic `BudgetSourceLine`, `ConsolidatedItem`, `ConsolidationSummary` | Parcial, no persistido |
| Catálogo Maestro | `CatalogoMaestroView` | `GET /api/v1/catalogo` | `MaestroPartidas` | Parcial |
| Materiales y proveedores | Sin pantalla | No identificada | `CategoriaMaterial`, `Material`, `Proveedor`, `MaterialPrecio` | Parcial, esquema/helper |
| Exportación | Botones de MO/consolidado | No aplica, se genera en navegador | Tipos MO + respuesta de consolidado | Funcional |
| Equipos | Navegación deshabilitada/simulador de renta dentro de Materiales | `POST /api/v1/materiales-costos/renta` | `EquipmentBenchmark` demo, sin entidad SQL | Parcial/pendiente |
| Subcontratos | Filtro de Consolidado | Entrada del POST consolidado; frontend pasa lista vacía | `BudgetSourceLine`, sin entidad propia | Pendiente |
| Reportes/IA | Placeholders del tablero y navegación deshabilitada | No identificada | No identificado | Pendiente |

# 19. Recomendaciones para IA

Un agente externo debería seguir este orden y no asumir capacidades por el nombre del módulo:

1. Leer [README.md](../../README.md), [BITACORA.md](../bitacora/BITACORA.md), este documento, `frontend/package.json` y `backend/requirements.txt`.
2. Trazar pantallas desde `frontend/src/app/App.tsx`; ubicar el estado y las callbacks en `PresupuestoMoModule.tsx`; distinguir cálculos cliente de peticiones HTTP.
3. Para cambios de API revisar router, schema, service, modelo y pruebas como una misma unidad. Confirmar el prefijo efectivo en `backend/app/main.py`.
4. No confundir `Project` Pydantic demo con la entidad SQLAlchemy `Proyecto`, ni asumir que el payload del demo se persiste.
5. Mantener contratos de alias/moneda/unidades y reglas de redondeo coherentes entre TypeScript, Pydantic, servicios y Excel.
6. Antes de agregar un CRUD, verificar si ya hay modelos/servicios pero falta ruta o pantalla; no duplicar `MaterialPrecio` ni el cálculo de consolidación.
7. Para corregir errores, agregar primero una prueba de regresión en `backend/tests/` o una suite frontend/API si el cambio toca UI/HTTP. Ejecutar al menos `python -m unittest discover -s tests -v` desde `backend` y `npm run lint`/`npm run build` desde `frontend`.
8. No habilitar `RESET_DB_SCHEMA_ON_STARTUP=1` salvo entorno desechable y autorizado; no leer ni imprimir secretos del `.env`.
9. Si se propone IA, confirmar requisito y proveedor: `google-genai` está listado pero no integrado.
10. Documentar explícitamente si una función solo es demo, si escribe PostgreSQL o si modifica únicamente el estado de sesión; conservar los patrones de componentes y servicios por dominio.

# 20. Entregable Final

```json
{
  "objetivo_negocio": "Apoyar la preparación y revisión de presupuestos de obras en Nicaragua mediante cálculo de mano de obra, consulta de costos de referencia, consolidación y exportación a Excel.",
  "arquitectura": {
    "frontend": "React 19, TypeScript, Vite 8 y Tailwind CSS 4; SPA con estado local, sin router.",
    "backend": "FastAPI síncrono con SQLAlchemy y Pydantic.",
    "base_datos": "PostgreSQL; catálogo y entidades base persistibles. Presupuestos demo/MO/consolidado no se guardan.",
    "integraciones": ["REST frontend-backend", "ExcelJS/FileSaver", "SQLite local opcional como origen de importación histórica"],
    "ia": "No identificada como integración activa."
  },
  "modulos": [
    {"nombre": "Mano de Obra", "estado": "Parcial; cálculo cliente funcional sin persistencia"},
    {"nombre": "Materiales y costos", "estado": "Parcial; demo JSON y API de cálculo"},
    {"nombre": "Consolidado", "estado": "Parcial; MO más demo, sin almacenamiento"},
    {"nombre": "Catálogo Maestro", "estado": "Parcial; consulta PostgreSQL"},
    {"nombre": "Partidas/APU", "estado": "Parcial; API sin pantalla integrada"},
    {"nombre": "Proyectos, subcontratos, equipos independientes y reportes", "estado": "Pendiente"}
  ],
  "apis": [
    "GET /health",
    "GET /api/v1/catalogo",
    "GET /api/v1/partidas",
    "POST /api/v1/partidas",
    "GET /api/v1/materiales-costos/demo",
    "POST /api/v1/materiales-costos/calcular",
    "POST /api/v1/materiales-costos/renta",
    "POST /api/consolidado",
    "POST /api/consolidado/resumen"
  ],
  "modelos": [
    "Proyecto",
    "Capitulo",
    "Partida",
    "AnalisisPrecioUnitario",
    "MaestroPartidas",
    "CategoriaMaterial",
    "Material",
    "Proveedor",
    "MaterialPrecio",
    "Project/Activity/Apu (Pydantic demo)",
    "BudgetSourceLine/ConsolidatedItem/ConsolidationSummary (Pydantic)",
    "Actividad/ConfiguracionLaboral/CronogramaCalculado (TypeScript)"
  ],
  "estado_general": "Prototipo con flujos demostrativos y APIs parciales; no listo para operación con presupuestos reales persistentes.",
  "avance_estimado": "45%",
  "riesgos": [
    "Presupuestos y cambios MO no persisten.",
    "Autenticación solo demo en frontend.",
    "Costos del demo no provienen de cotizaciones PostgreSQL.",
    "Migración de materiales y trigger deben ejecutarse manualmente.",
    "Reset de schema puede borrar datos si se habilita.",
    "No hay pruebas frontend ni contract tests."
  ],
  "proximos_pasos": [
    "Definir e implementar persistencia de proyectos, configuración y presupuestos versionados.",
    "Completar autenticación/roles y migraciones reproducibles.",
    "Conectar partidas, catálogo y precios vigentes al APU.",
    "Completar fuentes del consolidado, validar reglas de moneda/AIU y conciliar Excel.",
    "Agregar pruebas frontend/API e instrumentar el despliegue."
  ]
}
```
