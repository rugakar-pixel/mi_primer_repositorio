# COS — Estado Operativo V1

## Clasificación funcional para validación manual

**Fecha:** 8 de noviembre de 2026  
**Web observada:** `http://127.0.0.1:3000/`  
**Backend esperado:** `http://127.0.0.1:8080/api/v1`

---

## Resumen ejecutivo

La interfaz web está accesible y muestra el flujo administrativo principal. Sin embargo, durante la revisión las llamadas al backend fallaron con `net::ERR_CONNECTION_REFUSED`. Por esa razón, no se puede declarar persistencia operativa validada en los módulos que dependen de FastAPI.

El sistema presenta una separación clara entre:

- un espacio de demostración local, especialmente EBAR SUR 2 y el consolidado;
- un flujo de proyectos/versiones que requiere backend;
- módulos de datos persistidos que requieren backend;
- controles visibles pero todavía deshabilitados, como Equipos y Reportes.

---

# Clasificación por módulo

## 1. Empresas — Funciona parcialmente

### Funciona

- El Tablero Central está disponible.
- El panel **Administración inicial** está visible.
- Existe el formulario **Crear empresa**.
- El código del cliente llama al endpoint de creación de empresas.
- La empresa se usa en selectores posteriores.

### No validado

- Guardado real en base de datos.
- Recarga posterior desde backend.
- Manejo real de conflictos.

### Motivo de clasificación

La interfaz y la operación están implementadas, pero el backend rechazó la conexión durante la prueba.

---

## 2. Usuarios — Funciona parcialmente

### Funciona

- Existe **Crear usuario de directorio**.
- Existen campos de nombre, correo y motivo.
- Existe **Asociar usuario a empresa**.
- Existen roles Administrador, Editor y Lector.
- El sistema advierte que la identidad aún no se autentica.

### No validado

- Creación real del usuario.
- Persistencia de membresía.
- Consulta posterior de usuarios y membresías.

### Motivo de clasificación

El flujo visual y las llamadas están presentes, pero no hubo conexión con el backend.

---

## 3. Proyectos — Funciona parcialmente

### Funciona

- Existe el bloque **Crear proyecto persistente**.
- La empresa es requerida para crear el proyecto.
- Se muestran proyectos persistidos cuando hay datos disponibles.
- La tarjeta demo EBAR SUR 2 es visible.

### No validado

- Alta de un proyecto nuevo.
- Persistencia después de recargar.
- Consulta actualizada de proyectos.

### Motivo de clasificación

La pantalla está disponible y el cliente tiene integración de API, pero el endpoint de proyectos no fue accesible.

---

## 4. Versiones — Funciona parcialmente

### Funciona

- Se muestra un selector de versión al seleccionar un proyecto.
- Existe **Nueva versión**.
- Existe motivo opcional.
- Existen comparación y auditoría.
- Existe **Entrar a Gestionar**.

### No validado

- Creación de una versión.
- Copia o independencia respecto de la versión anterior.
- Comparación real.
- Auditoría persistida.

### Motivo de clasificación

La experiencia está implementada en la interfaz y en el cliente API, pero la consulta de versiones falló por backend inaccesible.

---

## 5. WBS — Funciona parcialmente

### Funciona

- El botón **Estructura WBS** existe.
- Se deshabilita correctamente si no hay proyecto/versión seleccionados.
- Existe editor de capítulos y partidas.
- Se observan operaciones de alta, edición y eliminación.
- Los campos de capítulo y partida están definidos.
- El sistema indica que los cambios pertenecen a una versión concreta.

### No validado

- Carga de la estructura WBS.
- Alta, edición o eliminación persistente.
- Aislamiento real entre versiones.

### Motivo de clasificación

La pantalla y las mutaciones están presentes, pero la llamada WBS devolvió `ERR_CONNECTION_REFUSED`.

---

## 6. Mano de Obra — Funciona parcialmente

### Funciona

- El demo EBAR SUR 2 es accesible.
- Se muestran actividades precargadas.
- Existen Memoria y Flujo Semanal, Cronograma de Obra y Planilla y Nómina.
- Existen edición de actividades, parámetros FSR y descarga Excel.
- El cliente distingue modo demo de contexto persistido.

### No validado

- Guardado de Mano de Obra en una versión.
- Recuperación posterior desde base de datos.
- Control de revisión y conflicto de concurrencia.

### Motivo de clasificación

El modo demo es funcional localmente, pero el modo persistido requiere backend y no pudo probarse.

---

## 7. APU — Funciona parcialmente

### Funciona

- La opción **Estructura de Costos / APU** está disponible.
- La pantalla se integra con Mano de Obra.
- El cliente contiene operaciones para crear APU maestro, crear versiones y asociarlas a partidas.
- Hay validaciones de materiales, proveedores, unidades y actores en el backend.

### No validado

- Carga real de APU.
- Creación de APU maestro.
- Creación de versión APU.
- Asociación persistente a una partida.
- Consulta posterior de usos.

### Motivo de clasificación

Hay integración definida en el cliente y backend, pero no se pudo ejecutar contra el backend activo.

---

## 8. Materiales — Funciona parcialmente

### Funciona

- Existe acceso a **Base de Datos Maestra / Catálogo**.
- Existe **Materiales y costos**.
- El cliente consulta categorías, materiales, proveedores y cotizaciones.
- Existen operaciones de creación de categorías, materiales, proveedores y cotizaciones.
- Hay consulta de precios vigentes por moneda y fecha.
- El flujo se integra con APU.

### No validado

- Carga de catálogos.
- Alta real de registros.
- Inmutabilidad práctica de cotizaciones.
- Consulta de precio vigente.
- Asociación con APU.

### Motivo de clasificación

La interfaz intentó consultar categorías, materiales y proveedores, pero recibió conexión rechazada del backend.

---

# Funcionalidades no operativas o no accesibles

## Herramientas y Equipos — No accesible

El control aparece en la navegación con estado **Próximamente** y está deshabilitado. No existe una ruta de usuario ejecutable desde la interfaz actual.

## Reportes — No accesible

El control aparece en la navegación con estado **Próximamente** y está deshabilitado. No existe una ruta de generación de reportes ejecutable desde la interfaz actual.

## Configurar Agente IA — No accesible

Se muestra como acceso informativo con mensaje de disponibilidad posterior. No es una función operativa del recorrido actual.

## Autenticación real — No funciona como seguridad

La pantalla de acceso acepta credenciales fijas de demostración. El propio sistema indica que la sesión no es seguridad real. Los usuarios y membresías son registros de directorio, no una barrera de autorización efectiva.

---

# Estado del entorno durante esta revisión

## Web

**Disponible:** `http://127.0.0.1:3000/` cargó y permitió ver la interfaz de COS.

## Backend

**No accesible:** las solicitudes a `http://127.0.0.1:8080/api/v1` devolvieron `net::ERR_CONNECTION_REFUSED`.

## Persistencia

**No verificada en esta sesión.** La presencia de formularios, endpoints o registros mostrados previamente no equivale a confirmar una escritura actual en base de datos.

## Demostraciones

**Disponibles visualmente:** EBAR SUR 2 y el consolidado de demostración. Deben mantenerse identificados como demo y no como fuente persistida de un proyecto real.

---

# Criterio para actualizar este estado

Un módulo puede pasar de **Funciona parcialmente** a **Funciona** solo cuando se completa el siguiente ciclo:

1. Abrir la ruta exacta.
2. Ingresar datos válidos.
3. Presionar el botón de guardado.
4. Obtener confirmación sin error.
5. Recargar o salir y volver a entrar.
6. Leer nuevamente el dato desde la interfaz.
7. Confirmar que el dato pertenece al proyecto y versión correctos.
8. Capturar evidencia antes y después.

Si la pantalla está visible pero no existe una acción ejecutable, debe clasificarse como **No accesible**. Si existe pantalla y conexión prevista, pero la operación no puede comprobarse por el entorno, debe permanecer como **Funciona parcialmente** hasta completar la prueba.

