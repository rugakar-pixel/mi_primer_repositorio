# COS — Construction Operating System

**Descriptor oficial:** Gerente Administrativo IA para Construcción.

COS es el sistema operativo de gestión administrativa para construcción. El
prototipo actual incluye empresas y proyectos/versiones, estructura WBS,
presupuesto de mano de obra, costos/APU, consolidado y exportación a Excel. La
visión del producto es evolucionar hacia un Gerente Administrativo IA para
Construcción; la inteligencia artificial y el análisis documental aún no son
funcionalidades disponibles. La denominación inicial del proyecto fue
"Motor de Presupuesto MO y Flujo de Caja Nicaragua 2026"; ObraNexa fue un nombre
de trabajo propuesto y posteriormente sustituido por la decisión oficial COS.

Consulta el [índice documental de COS](docs/README.md) para navegar por arquitectura, fases, reportes, gestión, decisiones, anexos, roadmap y bitácora.

## Estructura principal

- `frontend/src/main.tsx`: punto de arranque de la aplicación.
- `frontend/src/app/`: estructura general de la aplicación y estilos globales.
- `frontend/src/app/AccessScreen.tsx`: pantalla de acceso de demostración.
- `frontend/src/modules/presupuesto-mo/`: Módulo 1, con sus pantallas, componentes, cálculos, tipos y exportación Excel.
- `frontend/examples/`: libro Excel de referencia; no es necesario para iniciar la aplicación.
- [Bitácora](docs/bitacora/BITACORA.md): registro de decisiones, cambios y tareas pendientes.
- `frontend/package.json` y `frontend/package-lock.json`: dependencias y comandos del frontend.
- `backend/app/main.py`: punto de entrada inicial de FastAPI.
- `backend/requirements.txt`: dependencias Python, pendiente de configuración.

## Requisitos

- Node.js LTS
- npm
- Python y PostgreSQL (para consultar el Visor del Catálogo Maestro)

## Desarrollo local

Para iniciar solo la interfaz web:

```powershell
cd frontend
npm install
npm run dev
```

Abre la URL local que muestra Vite en la terminal. Esta opción no inicia el
backend y, por lo tanto, no carga los datos del Visor del Catálogo Maestro.

Para usar el visor, inicia PostgreSQL y asegúrate de configurar
`backend\.env` con `DATABASE_URL`. Si aún no tienes el frontend abierto,
ejecuta `.\run-dev.bat` desde la carpeta principal del proyecto; abrirá el
backend en el puerto `8080` y el frontend en el `3000`. Si el frontend ya está
abierto, inicia únicamente el backend en otra ventana de PowerShell:

```powershell
cd backend
.\.venv\Scripts\uvicorn.exe app.main:app --reload --port 8080
```

## Catálogo de materiales e historial de precios

El modelo incorpora categorías, materiales, proveedores y cotizaciones con
fecha de vigencia. Cada cotización es inmutable; para actualizar un precio se
inserta una nueva fila. `backend\migrations\001_catalogo_materiales.sql` agrega
las tablas e índices y un trigger que rechaza actualizar o borrar cotizaciones.
Las filas históricas de `maestro_partidas` se conservan; el vínculo al material
es opcional y debe asignarse únicamente tras verificar la correspondencia.

La aplicación no aplica este archivo SQL automáticamente. Antes de registrar
precios, desde PowerShell entra al directorio `backend` y ejecuta:

```powershell
.\.venv\Scripts\python.exe -m app.apply_migration
```

El ejecutor usa la conexión configurada en `backend\.env`, aplica la migración
SQL en una transacción y verifica las tablas y el trigger. `create_all()` puede
crear tablas faltantes al iniciar el backend, pero no instala el trigger de
inmutabilidad.

Las consultas de `backend\app\services\materiales.py` calculan el promedio de
la última cotización vigente por proveedor activo (en la moneda indicada) o
devuelven el precio vigente de un proveedor específico. Los precios en monedas
distintas no se mezclan; la moneda predeterminada es NIO.

## Módulo de Materiales y Costos

En el espacio de trabajo, selecciona **Materiales y costos** para abrir el
módulo integrado de demostración. Incluye cálculo de materiales, equipos,
herramientas, transporte y costos indirectos, además de un simulador de renta.
La API FastAPI expone `GET /api/v1/materiales-costos/demo`,
`POST /api/v1/materiales-costos/calcular` y
`POST /api/v1/materiales-costos/renta`.

Los precios y tarifas del ejemplo son datos de referencia en USD: todavía no
se consultan ni guardan en el historial PostgreSQL de materiales. La cotización
de renta no se suma automáticamente para evitar contar un equipo dos veces.
No se agregó ni restauró cálculo de Mano de Obra.

## Consolidado del Proyecto

La vista **Consolidado** combina las actividades de Mano de Obra con los
recursos del proyecto de demostración de Materiales y Costos. Sus importes se
muestran en córdobas (NIO); los precios del ejemplo en USD se convierten con la
tasa referencial incluida en ese proyecto. Los cambios de Mano de Obra vuelven
a calcular el total. La lista agrupa recursos repetidos conservando referencias
a las actividades de origen y no suma el costo total de la actividad junto con
sus componentes APU.

FastAPI expone `POST /api/consolidado` para las líneas y el detalle consolidado,
y `POST /api/consolidado/resumen` para los subtotales y el total general. El
frontend consulta el primer endpoint al cargar el consolidado y cuando cambia
la Mano de Obra. El archivo Excel exportado desde esa vista incluye las siete
hojas ejecutivas solicitadas y conserva las cuatro hojas de detalle anteriores
de Mano de Obra.

Subcontratos aparece en cero porque aún no hay un módulo ni registros de ese
origen. El módulo independiente de Equipos está en preparación; los costos de
equipo disponibles provienen del APU de demostración. La información del demo y
la consolidación no se guardan en PostgreSQL. Para presupuestar una obra real,
hay que conectar fuentes persistentes y verificar la tasa de cambio vigente.

## Validación

```powershell
cd frontend
npm run lint
npm run build
```

La interfaz básica no requiere Python ni una clave de Gemini. El Visor del
Catálogo Maestro y la vista Consolidado sí requieren el backend. Después del
acceso de demostración, el Tablero muestra el total informado por el
Consolidado.

## Persistencia de empresas, proyectos y Mano de Obra (Fase 1)

La Fase 1 agrega empresas, usuarios de directorio, membresías, proyectos y
versiones, auditoría y snapshots versionados de Mano de Obra. Las tablas
existentes de proyectos, capítulos, partidas, APU y catálogo se conservan; las
migraciones no eliminan ni renombran datos.

Antes de habilitar estos flujos en una base PostgreSQL, configura
`backend\.env` con `DATABASE_URL`, toma el respaldo operacional habitual y
ejecuta las migraciones, en orden, desde `backend`:

```powershell
.\.venv\Scripts\python.exe -m app.apply_migration 001
.\.venv\Scripts\python.exe -m app.apply_migration 002
.\.venv\Scripts\python.exe -m app.apply_migration 003
.\.venv\Scripts\python.exe -m app.apply_migration 004
```

El ejecutor crea únicamente objetos faltantes, registra las migraciones 002–004
y verifica tablas/columnas. Ejecuta las migraciones una vez por base; el
ejecutor valida y reporta si una migración numerada ya estaba aplicada. Reinicia
el backend después de aplicarlas. La migración 001 continúa siendo compatible
con el comando anterior sin argumento.

Desde el Tablero Central puedes crear una empresa, registrar usuarios,
asociarlos a una empresa y crear proyectos. Selecciona un proyecto para crear
su Versión 1; desde allí puedes guardar la Mano de Obra. Crear una versión
posterior copia su snapshot de Mano de Obra, de modo que los cambios en Versión
2 no alteren la Versión 1. El tablero permite comparar líneas y totales de MO.
Los cambios guardados sobreviven al reinicio del backend.

Las rutas nuevas se encuentran bajo `/api/v1`; las APIs anteriores permanecen
sin cambios. La Mano de Obra guardada conserva la configuración y entradas, y
usa el motor de cálculo existente en el frontend. El backend calcula y guarda
el total auditable de MO; no sustituye el consolidado ni convierte los datos
demo de Materiales y Costos en precios reales.

**Límite importante:** el acceso actual continúa siendo de demostración. Los
usuarios y membresías de esta fase son registros de directorio, no credenciales
ni una barrera de autorización. La selección de un usuario como actor permite
atribuir cambios, pero no verifica su identidad. No expongas la API ni guardes
información sensible o de clientes en un entorno multiempresa hasta añadir
autenticación y autorización reales.

## Estructura WBS por versión (Fase 2A)

La migración 004 asocia los capítulos existentes con versiones de proyecto sin
reasignar ni eliminar filas históricas. La nueva **Estructura WBS** permite
administrar capítulos y partidas en la versión persistida abierta. Al crear una
versión desde otra, se copia su árbol estructural con registros nuevos; editar
la versión destino no modifica la versión de origen. En esta fase las partidas
solo guardan código, descripción, unidad, cantidad y rendimiento. No se
implementan materiales, equipos ni consolidado.

Consulta [FASE2A_DISENO_WBS.md](./docs/fases/FASE2A_DISENO_WBS.md) para el modelo y las
rutas API, y [FASE2A_RESULTADO_FINAL.md](./docs/fases/FASE2A_RESULTADO_FINAL.md) para la
validación realizada.
