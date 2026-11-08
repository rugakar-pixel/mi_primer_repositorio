# Bitácora del proyecto

## Decisión de marca oficial

**Fecha de aprobación:** 2026-11-06
**Nombre:** COS — Construction Operating System
**Descriptor:** Gerente Administrativo IA para Construcción.

Esta decisión sustituye la propuesta provisional ObraNexa y es la identidad
oficial vigente del producto.

## Perfil del usuario

El usuario es ingeniero civil, sabe usar Revit y le interesa conocer los costos
de producción de las cosas y automatizar procesos. Tener este enfoque presente
al explicar decisiones: usar ejemplos claros de obra, presupuestos y costos,
evitando tecnicismos innecesarios.

## Actualización de Visión Estratégica del Proyecto

Fecha: 2026-11-05

### Cambio Estratégico de Dirección

Después del análisis técnico y funcional del proyecto se redefine oficialmente
el objetivo estratégico del sistema.

El proyecto deja de concebirse como una aplicación de presupuestos de
construcción y pasa a definirse como una plataforma integral de gestión
administrativa para proyectos de ingeniería y construcción impulsada por
Inteligencia Artificial.

### Visión del Producto

Construir un Gerente Administrativo IA especializado en obras civiles, capaz de
analizar documentación técnica, interpretar requisitos de obra, generar
presupuestos profesionales, administrar costos, controlar información
financiera y producir documentación ejecutiva conforme a estándares
internacionales de construcción.

### Misión

Permitir que un usuario entregue información parcial o completa de un proyecto
y que el sistema sea capaz de transformarla en conocimiento estructurado para la
toma de decisiones.

Entradas posibles:

- Planos arquitectónicos
- Planos estructurales
- Planos de instalaciones
- Especificaciones técnicas
- Catálogos de partidas
- Contratos
- Cotizaciones
- Estudios de suelo
- Excel históricos
- Bases de datos de costos
- Fotografías de obra
- Reportes técnicos

### Resultado Esperado

El sistema deberá ser capaz de generar:

- Estructura WBS
- Catálogo de partidas
- APU
- Presupuesto detallado
- Costos directos
- Costos indirectos
- Cronograma base
- Flujo financiero
- Reportes ejecutivos
- Reportes técnicos
- Documentación para licitación
- Memorias de cálculo

### Principio de Evolución

Toda nueva funcionalidad deberá construirse sobre los módulos existentes.

Regla de arquitectura:

- NO reemplazar módulos funcionales.
- NO destruir módulos existentes.
- NO rehacer funcionalidades operativas.
- SI extender capacidades existentes.
- SI reutilizar lógica validada.
- SI mantener compatibilidad hacia atrás.
- SI preservar trazabilidad.
- Cada módulo desarrollado deberá permanecer operativo y convertirse en parte
  del producto final.

### Arquitectura Objetivo

```text
Gerente Administrativo IA
├── Gestión Documental
├── Gestión de Proyectos
├── Catálogo de Partidas
├── APU
├── Mano de Obra
├── Materiales
├── Equipos
├── Subcontratos
├── Presupuesto Maestro
├── Control Financiero
├── Reportes
├── Auditoría
├── Base de Conocimiento
└── Agente IA
```

### Prioridades Estratégicas

#### Prioridad 1 — Persistencia completa de proyectos

**Objetivo:** convertir el sistema en una plataforma real de trabajo donde toda
la información permanezca almacenada y versionada.

#### Prioridad 2 — Motor único de costos y presupuestos

**Objetivo:** integrar todas las fuentes de costos bajo una única estructura
presupuestaria:

- Mano de Obra
- Materiales
- Equipos
- Subcontratos
- Otros Costos

#### Prioridad 3 — Base de conocimiento técnica

**Objetivo:** crear la fuente de conocimiento que utilizará el futuro agente.

#### Prioridad 4 — Agente Administrativo IA

**Objetivo:** transformar los datos operativos y técnicos en inteligencia para
la toma de decisiones.

### Meta Final

El proyecto será considerado exitoso cuando un usuario pueda cargar la
documentación de una obra y el sistema genere automáticamente:

- Presupuesto profesional
- APU completos
- Cronograma base
- Flujo financiero
- Informe ejecutivo
- Informe técnico
- Excel
- Word
- PDF

Todo con trazabilidad, justificación técnica y capacidad de auditoría.

## Importante: inicio manual de la aplicación

La interfaz web se ejecuta con Node.js y Vite. Para navegar por las pantallas
que no consultan la base de datos basta con iniciar el frontend; el Visor del
Catálogo Maestro también necesita el backend FastAPI y PostgreSQL. Sigue estos
pasos en PowerShell para iniciar solo el frontend:

```powershell
cd .\frontend
node --version
npm.cmd --version
npm.cmd install
npm.cmd run dev
```

Primero, abre PowerShell en la carpeta principal del proyecto. El comando
`cd .\frontend` te lleva a la carpeta donde está configurada la aplicación.
Comprueba que `node --version` y `npm.cmd --version` muestren sus versiones; si
alguno no se reconoce, instala Node.js LTS y vuelve a abrir PowerShell.
`npm.cmd install` descarga las dependencias necesarias: ejecútalo la primera vez
o después de que cambien las dependencias del proyecto. En los siguientes
inicios normalmente basta con ejecutar `cd .\frontend` y `npm.cmd run dev`. Este
inicio solo levanta la interfaz en el puerto `3000`; no permite consultar el
catálogo de la base de datos.

Cuando Vite muestre que el servidor está listo, abre en el navegador
`http://localhost:3000` (o la dirección que indique la terminal). Deja abierta
la ventana de PowerShell mientras trabajas; para apagar la aplicación, vuelve a
esa ventana y presiona `Ctrl+C`. También puedes iniciar solo el frontend haciendo
doble clic en `frontend\run-dev.bat`; si es la primera vez, el archivo instala
las dependencias antes de arrancar Vite.

Para usar el Visor del Catálogo Maestro, PostgreSQL debe estar iniciado y
`backend\.env` debe tener configurada la variable `DATABASE_URL`. Si ya tienes
el frontend abierto, deja esa ventana activa y abre otra de PowerShell en la
carpeta principal del proyecto; ejecuta:

```powershell
cd .\backend
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8080
```

Mantén también abierta esta segunda ventana. El visor consulta la API en
`http://127.0.0.1:8080`; si el backend se detiene, no podrá mostrar los datos.
Como alternativa, detén el frontend abierto y ejecuta `.\run-dev.bat` desde la
carpeta principal para iniciar el backend y el frontend en ventanas separadas.

Registro de pendientes, decisiones y cambios que se han revisado con el usuario.
Los cambios de código se realizan solo con autorización; la bitácora se actualiza
cuando el usuario solicita **“respaldo bitácora”**.

## Pendientes

| Prioridad | Pendiente | Posible efecto | Estado |
|---|---|---|---|
| Alta | Revisar las dos alertas moderadas de seguridad encontradas en la dependencia `uuid`, usada por ExcelJS, y buscar una actualización compatible. | Seguridad de la función de exportación Excel. | Por investigar; no actualizar automáticamente. |
| Alta | Probar desde el equipo del usuario que el Excel descargado también se abre correctamente. | Confirmar la exportación de principio a fin. | Descarga confirmada por el usuario; apertura del archivo aún no confirmada. |
| Media | Actualizar la configuración de Vite que usa `__dirname` a una forma compatible con versiones futuras. | Evitar incompatibilidades futuras; no bloquea la compilación actual. | Pendiente; requiere aprobación. |
| Baja | Evaluar si se puede reducir el tamaño del módulo de exportación Excel, actualmente cercano a 948 KB. | La exportación podría cargar más rápido; el módulo se carga solo al exportar. | Pendiente de evaluar. |
| Media | Conectar el Consolidado a presupuestos persistidos y a los módulos de Equipo y Subcontratos cuando estén disponibles. | Evitar depender de datos de demostración y permitir actualizar también esas categorías desde sus propios módulos. | Pendiente: hoy solo Mano de Obra permite CRUD y Materiales y Costos usa datos de ejemplo. |
| Media | Crear un commit inicial de Git una vez que el usuario apruebe el estado actual. | Permitir volver a una versión conocida del proyecto. | Repositorio creado, sin commits; requiere aprobación. |

## Cambios realizados

| Fecha | Cambio | Resultado |
|---|---|---|
| 2026-10-29 | Instalado Node.js LTS y creado un repositorio Git local. | Node.js `v26.13.0`, npm `11.20.0` y Git `2.56.0.windows.3` verificados. No se creó commit inicial. |
| 2026-10-29 | Instaladas dependencias npm; ajustada la versión de esbuild para resolver incompatibilidad con Vite. | Dependencias instaladas y árbol de paquetes verificado. |
| 2026-10-29 | Añadido `.venv/` a `.gitignore` y creado un entorno Python temporal para evaluar el motor Python. | Git excluía correctamente el entorno. El entorno se eliminó al retirar el motor Python. |
| 2026-10-29 | Retirada la pestaña “Código Python POO” y su código de visualización. | La interfaz quedó con cuatro pestañas. |
| 2026-10-29 | Retirados `presupuesto_mo_engine.py`, `.venv`, `bun.lock` y `.env.example`, que ya no eran necesarios para esta aplicación web. | El proyecto se centra en React/TypeScript y npm; no requiere Python ni clave Gemini. |
| 2026-10-29 | Eliminadas dependencias declaradas que no se usaban y clasificadas las herramientas de compilación como dependencias de desarrollo. | Quedaron cinco dependencias de ejecución; npm reporta dos alertas moderadas en la cadena de ExcelJS/uuid. |
| 2026-10-29 | Configurada la carga diferida del exportador Excel y corregidas referencias a openpyxl. | El JavaScript inicial de producción bajó de unos 1.24 MB a unos 295 KB (84 KB gzip); Excel se carga al solicitar la exportación. |
| 2026-10-29 | Actualizado el README y hecho compatible con Windows el comando `clean`. | Documentación alineada con la ejecución local actual. |
| 2026-10-29 | Agregados acceso de demostración, menú lateral con cuatro módulos y vista inicial Consolidado alimentada con las partidas de Mano de Obra. | Acceso y navegación verificados; los otros tres módulos siguen en preparación. |
| 2026-10-29 | Quitada la pestaña de Presupuesto MO de la navegación del Módulo de Mano de Obra y renombradas las tres vistas restantes. | Se conserva la tabla y los cálculos para el Consolidado; se deja pendiente revisar esta separación en el futuro. |
| 2026-11-04 | Revisada la base PostgreSQL antes de ampliar el catálogo. | Se confirmó que `maestro_partidas` tenía 8,106 registros y que los proyectos, capítulos, partidas y análisis guardados estaban vacíos. La base SQLite de origen se dejó intacta. |
| 2026-11-04 | Preparadas las tablas nuevas para categorías, materiales, proveedores e historial de precios. | Se agregaron sin quitar ni reemplazar tablas anteriores. Los materiales pueden enlazarse opcionalmente con una partida histórica que haya sido verificada. |
| 2026-11-04 | Añadidas consultas para los precios de materiales. | El sistema puede promediar el precio vigente más reciente de cada proveedor activo o consultar el precio vigente de un proveedor específico. Los precios anteriores se conservan; no se mezclan monedas distintas. |
| 2026-11-04 | Aplicada la migración aprobada en PostgreSQL y levantada la aplicación para revisar la base de datos. | Se crearon las cuatro tablas nuevas, inicialmente vacías; el catálogo anterior conservó sus 8,106 registros y el visor siguió mostrando las partidas. |
| 2026-11-04 | Probadas las consultas y la migración del historial de precios. | Las tres pruebas del catálogo pasaron. También se confirmó que la base impide modificar o borrar un precio guardado: para actualizarlo se registra un precio nuevo. |
| 2026-11-04 | Integrado `para_migrar` como un nuevo módulo de Materiales y Costos. | Se conectó al menú, a la API FastAPI existente y a los cálculos de materiales, equipos, herramientas, transporte, renta e indirectos, sin restaurar Mano de Obra. |
| 2026-11-04 | Conectado el Consolidado a los datos disponibles de Mano de Obra y Materiales y Costos. | Los costos se normalizan en NIO, se identifican por origen y se resumen desde un servicio FastAPI compartido. |

### Detalle de la integración de Materiales y Costos

- **Archivos nuevos del frontend:** `frontend/src/modules/materiales-costos/MaterialesCostosModule.tsx`, `api.ts` y `types.ts`.
- **Archivos nuevos del backend:** `backend/app/api/v1/materiales_costos.py`, `backend/app/schemas/materiales_costos.py`, `backend/app/services/materiales_costos.py`, `backend/app/data/materiales_costos_demo.json` y `backend/tests/test_materiales_costos.py`.
- **Archivos existentes modificados:** `frontend/src/app/App.tsx` (acceso al módulo), `frontend/src/modules/apu/EstructuraCostosView.tsx` (aclaración de que aún no está vinculado a este APU), `backend/app/main.py` (registro de rutas), `README.md` y esta bitácora.
- **Pasos realizados:** se revisó el paquete de 21 archivos; se copiaron los tipos, datos de ejemplo, esquemas, cálculos y pruebas; se adaptaron las rutas e imports a la estructura existente; se añadió la pantalla; y se validaron TypeScript, compilación y pruebas de backend.
- **Dependencias agregadas:** ninguna. El proyecto ya cuenta con React, TypeScript, Vite, FastAPI y Pydantic.
- **Riesgos y pendientes:** los precios y tarifas son de demostración en USD, no precios actuales de proveedores. El módulo no guarda proyectos ni consulta el historial PostgreSQL. La cotización de renta se mantiene aparte de los costos de equipo para evitar duplicados. Para usar costos reales habrá que enlazar los materiales con registros verificados y decidir cómo conservar el precio utilizado en cada presupuesto.

### Integración del Consolidado del Proyecto

- **Archivos nuevos del frontend:** `frontend/src/modules/consolidado/types.ts`, `BudgetConsolidationService.ts` y `ConsolidatedProjectView.tsx`.
- **Archivos nuevos del backend:** `backend/app/api/v1/consolidado.py`, `backend/app/schemas/consolidado.py`, `backend/app/services/consolidado.py` y `backend/tests/test_consolidado.py`.
- **Archivos modificados:** `frontend/src/app/App.tsx`, `frontend/src/app/ProjectDashboard.tsx`, `frontend/src/modules/presupuesto-mo/PresupuestoMoModule.tsx`, `frontend/src/modules/presupuesto-mo/utils/excelExporter.ts`, `backend/app/main.py`, `README.md` y esta bitácora.
- **Servicio y endpoints:** `BudgetConsolidationService` normaliza, agrupa y calcula las líneas; `POST /api/consolidado` devuelve detalle más resumen y `POST /api/consolidado/resumen` devuelve solo los totales.
- **Flujo de datos:** el cronograma calculado de Mano de Obra y el proyecto de demostración de Materiales y Costos se envían a FastAPI; el backend convierte los precios USD usando la tasa del ejemplo, agrega herramientas, transporte, otros costos e indirectos como “Otros”, y devuelve renglones con referencias a su origen. La vista y el total del Tablero usan ese resultado.
- **Duplicados y trazabilidad:** no se suman simultáneamente el costo total de la actividad y sus recursos APU. Los recursos repetidos se agrupan por origen, descripción, unidad y precio; Mano de Obra y subcontratos mantienen sus líneas independientes. Se conservan las referencias de las actividades fuente.
- **Exportación:** al exportar desde Consolidado se agregan primero las siete hojas ejecutivas solicitadas (Resumen, Mano de Obra, Materiales, Equipos, Subcontratos, Otros y Consolidado General); se mantienen además las cuatro hojas existentes de detalle laboral.
- **Riesgos detectados:** la moneda de salida es NIO y el tipo de cambio del ejemplo es solo referencial, no una cotización de mercado. Subcontratos aún no tiene módulo, registros ni API propia y por ello totaliza cero. Equipos procede del APU de ejemplo; el módulo de Equipos independiente sigue deshabilitado. Materiales no tiene CRUD y los datos de muestra no provienen del historial PostgreSQL; la consolidación es de lectura y no persiste el presupuesto.
- **Dependencias agregadas:** ninguna.
- **Resultado esperado:** al agregar, editar o eliminar Mano de Obra, el cronograma vuelve a enviarse y se recalcula el Consolidado; los filtros actualizan la tabla sin recargar la página. Las otras categorías reflejan las fuentes disponibles, pero no pueden reaccionar a cambios que sus módulos aún no permiten hacer.

## Validaciones

- `npm.cmd run lint` y `npm.cmd run build`: pasaron después de la integración del Consolidado; quedan avisos conocidos de tamaño del módulo Excel y de uso de `__dirname` en Vite.
- `npm run clean`: correcto.
- La aplicación respondió en `http://127.0.0.1:3000` y se verificó que aparecen cuatro pestañas.
- Las cuatro vistas del Módulo de Mano de Obra se abrieron; parámetros y formulario de actividad abrieron y cerraron sin guardar cambios.
- El usuario confirmó que la descarga del Excel funciona correctamente; la apertura del archivo aún no se ha confirmado.
- Tras agregar el Consolidado, se comprobó que las partidas y el total coinciden con la vista de presupuesto del Módulo de Mano de Obra.
- La migración de materiales se probó en un esquema PostgreSQL temporal y luego se aplicó a la base configurada; las tablas nuevas quedaron vacías, sin importar ni cambiar registros históricos.
- El visor del Catálogo Maestro respondió correctamente con 8,106 partidas, mostrando 20 registros por página.
- `npm.cmd run lint` y `npm.cmd run build` pasaron después de integrar Materiales y Costos; se mantienen los avisos de Vite sobre `__dirname` y el tamaño del exportador Excel.
- Las 8 pruebas anteriores de backend pasaron: 3 del historial de precios y 5 del cálculo de materiales, equipos, dimensiones, costos indirectos, renta y exclusión de Mano de Obra.
- Se probaron `POST /api/consolidado` y `POST /api/consolidado/resumen`: devolvieron Mano de Obra, Materiales, Equipos y Otros, con Subcontratos en cero y total coherente.
- En el navegador, el Consolidado mostró 56 renglones iniciales y los seis subtotales. Agregar una actividad elevó Mano de Obra de C$31,824.51 a C$41,499.63 y el total de C$228,336.86 a C$238,011.98; eliminarla restableció ambos totales.
- El filtro de Materiales mostró 37 renglones y el de Subcontratos indicó que no hay partidas. El filtro funciona sin recargar la página.
- Las 12 pruebas de backend pasaron: 4 nuevas de consolidación y las 8 pruebas previas. ExcelJS verificó los nombres y el orden de las siete hojas ejecutivas antes de las cuatro hojas laborales existentes; el navegador de prueba no confirmó el evento de descarga, por lo que la descarga/apertura final debe revisarse manualmente.

## Puesta en marcha local del API y PostgreSQL

### 2026-11-08 — Inicio automático del backend

- **Base de datos:** el usuario confirmó que creó la base PostgreSQL local `constructions_system_db`, configuró `backend/.env` y aplicó correctamente las siete migraciones de `backend/migrations/`.
- **Entorno Python:** se detectó el entorno virtual `.venv` en la raíz del repositorio.
- **Comando recomendado desde la raíz del repositorio:**

  ```powershell
  .\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt python-dotenv
  Set-Location .\backend
  $env:PYTHONPATH = (Get-Location).Path
  ..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
  ```

- **Activación de PowerShell:** `Activate.ps1` fue bloqueado por la política de ejecución del sistema. Para evitar cambiar una política global, se utilizó directamente `..\.venv\Scripts\python.exe -m uvicorn`, que ejecuta Uvicorn dentro del entorno virtual.
- **Servidor:** Uvicorn quedó ejecutándose con recarga automática en `http://127.0.0.1:8000`, observando la carpeta `backend`.
- **Verificación interna:** `GET http://127.0.0.1:8000/` devolvió `status: ok` y el mensaje `Backend Presupuestista Activo`.
- **Verificación OpenAPI:** `GET http://127.0.0.1:8000/openapi.json` devolvió HTTP 200 con una respuesta de 85,664 bytes.
- **Flujo completo para futuras sesiones:** iniciar PostgreSQL; confirmar `backend/.env`; activar o invocar el intérprete de `.venv`; situarse en `backend`; establecer `PYTHONPATH` al directorio actual; iniciar `uvicorn app.main:app --reload`; comprobar `/` y `/openapi.json`; abrir el frontend en `http://127.0.0.1:3000` cuando Vite también esté ejecutándose.
