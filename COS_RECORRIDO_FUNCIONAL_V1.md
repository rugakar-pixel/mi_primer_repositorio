# COS — Recorrido Funcional V1

## Guía de validación manual como usuario final

**Sistema revisado:** COS — Construction Operating System  
**URL web observada:** `http://127.0.0.1:3000/`  
**Backend esperado por la interfaz:** `http://127.0.0.1:8080/api/v1`  
**Fecha de revisión:** 8 de noviembre de 2026  
**Alcance:** módulos Empresas, Usuarios, Proyectos, Versiones, WBS, Mano de Obra, APU y Materiales.

---

## 1. Resultado de la revisión inicial

La interfaz web de COS está disponible y muestra:

- pantalla de acceso de demostración;
- Tablero Central;
- administración inicial de empresas, usuarios, membresías y proyectos;
- proyectos persistidos y sus versiones;
- proyecto de demostración EBAR SUR 2;
- módulos de Consolidado, Estructura WBS, Mano de Obra, APU, Materiales y costos, y Presupuesto Maestro;
- acceso al Catálogo Maestro;
- controles de Herramientas y Equipos y Reportes marcados como “Próximamente”.

Durante la validación, la interfaz intentó consultar el backend y recibió `net::ERR_CONNECTION_REFUSED` para solicitudes como empresas, materiales, proyectos, versiones, WBS y presupuesto maestro. Por lo tanto, este documento distingue cuidadosamente entre:

- **Visible:** el control o pantalla aparece en la interfaz.
- **Conectado:** el código tiene una llamada al backend para esa acción.
- **Persistencia implementada:** existe una operación de lectura/escritura en el backend.
- **Validado en ejecución:** la operación respondió correctamente durante este recorrido.

No se considera validada ninguna persistencia que no haya podido confirmarse leyendo nuevamente el dato después de guardarlo.

---

## 2. Acceso general

### Ruta exacta

Abrir `http://127.0.0.1:3000/`.

### Datos de acceso observados

- Usuario: `Usuario`
- Contraseña: `Contraseña`

El acceso es de demostración. El propio sistema indica que no es una barrera real de seguridad. No debe confundirse con autenticación real.

### Pasos

1. Abrir la URL web.
2. Escribir `Usuario` en el campo **Usuario**.
3. Escribir `Contraseña` en **Contraseña**.
4. Presionar **Ingresar**.
5. Verificar que aparezca el **Tablero Central**.

### Éxito

Se muestra el encabezado COS, el usuario `Usuario`, la sección **Portafolio de obras**, el **Tablero Central** y los accesos de administración.

### Fallo

- Se muestra “El usuario o la contraseña no coinciden” con datos incorrectos.
- La pantalla no cambia al tablero con las credenciales de demostración.
- El tablero aparece, pero muestra un error de conexión al intentar cargar datos.

---

# MÓDULO 1 — EMPRESAS

## Objetivo

Crear y consultar empresas del directorio administrativo de COS. Una empresa es el contexto al que se asociarán usuarios y proyectos.

## Cómo acceder

`http://127.0.0.1:3000/` → **Ingresar** → **Tablero Central** → abrir **Administración inicial · empresas, usuarios y proyectos**.

## Botón que se debe presionar

**Crear empresa**.

## Pantalla que debería aparecer

Dentro del panel de administración inicial debe aparecer el bloque **Crear empresa** con:

- campo **Nombre de la empresa**;
- campo **Motivo (opcional)**;
- botón **Crear empresa**.

También debe existir un selector de empresa para las operaciones posteriores.

## Datos que se deben ingresar

### Campos obligatorios

- Nombre de la empresa.

### Campos opcionales

- Motivo de creación.

### Ejemplo

- Nombre: `Constructora QA COS`
- Motivo: `Validación funcional de alta de empresa`

## Pasos numerados

1. Iniciar sesión.
2. Abrir el panel **Administración inicial**.
3. Escribir `Constructora QA COS` en **Nombre de la empresa**.
4. Escribir el motivo opcional.
5. Presionar **Crear empresa**.
6. Esperar el mensaje de confirmación.
7. Revisar el selector de empresa y comprobar que la empresa aparezca.
8. Recargar el tablero.
9. Volver a abrir el selector y buscar la empresa creada.

## Cómo verificar persistencia

La prueba de persistencia requiere que:

1. El botón termine sin alerta de error.
2. Se muestre el mensaje **Empresa creada y persistida**.
3. La empresa aparezca en el selector después de `reload`.
4. La empresa continúe apareciendo después de recargar la página completa.

Durante esta revisión no se pudo confirmar el paso 2 porque el backend en el puerto 8080 rechazó las solicitudes.

## Errores esperados

- Nombre vacío: el navegador debe impedir el envío por ser obligatorio.
- Nombre duplicado o conflicto de restricción: respuesta de conflicto del backend.
- Backend detenido: “No fue posible conectar con el backend. Verifica que FastAPI esté iniciado.”
- Usuario actor no válido, si se selecciona uno inexistente o inactivo.

## Evidencia que se debe tomar

- Captura del formulario antes de enviar.
- Captura del mensaje de éxito.
- Captura del selector mostrando `Constructora QA COS`.
- Captura después de recargar donde la empresa siga visible.
- Si falla, captura del mensaje y de la consola/red con la URL solicitada y código HTTP.

## Qué constituye éxito

La empresa se crea sin error, aparece en los selectores y permanece visible tras recargar.

## Qué constituye fallo

El botón no responde, la empresa desaparece tras recargar, se muestra éxito sin que el registro aparezca o la pantalla queda bloqueada por una solicitud al backend.

---

# MÓDULO 2 — USUARIOS

## Objetivo

Crear usuarios del directorio y asociarlos posteriormente a una empresa. El sistema actual no autentica realmente a estos usuarios.

## Cómo acceder

`http://127.0.0.1:3000/` → **Ingresar** → **Tablero Central** → **Administración inicial**.

## Botones que se deben presionar

- **Crear usuario** para crear el registro.
- **Asociar** para vincularlo a una empresa.

## Pantalla que debería aparecer

El panel debe mostrar:

### Crear usuario de directorio

- **Nombre**;
- **correo@empresa.com**;
- **Motivo (opcional)**;
- **Crear usuario**.

### Asociar usuario a empresa

- selector de empresa;
- selector de usuario;
- motivo opcional;
- rol: Administrador, Editor o Lector;
- botón **Asociar**.

## Datos que se deben ingresar

### Campos obligatorios para crear

- Nombre.
- Correo.

### Campos obligatorios para asociar

- Empresa.
- Usuario.
- Rol.

### Ejemplo

- Nombre: `Ana QA`
- Correo: `ana.qa@constructora.test`
- Motivo: `Usuario de prueba funcional`
- Empresa: `Constructora QA COS`
- Rol: `Editor`

## Pasos numerados

1. Abrir **Administración inicial**.
2. Escribir `Ana QA` en **Nombre**.
3. Escribir `ana.qa@constructora.test` en el campo de correo.
4. Presionar **Crear usuario**.
5. Confirmar que aparezca el mensaje **Usuario creado**.
6. Seleccionar la empresa en el bloque **Asociar usuario a empresa**.
7. Seleccionar `Ana QA`.
8. Seleccionar el rol `Editor`.
9. Presionar **Asociar**.
10. Confirmar que el bloque indique la cantidad de usuarios asociados.
11. Recargar y repetir la consulta.

## Cómo verificar persistencia

- El usuario debe quedar disponible en el selector de usuarios.
- La membresía debe reaparecer al seleccionar la empresa.
- El conteo de usuarios asociados debe conservarse tras recargar.
- No basta con que el formulario se limpie.

La revisión actual no pudo confirmar estos pasos porque las llamadas a `/api/v1/usuarios` y `/api/v1/empresas/{id}/membresias` no alcanzaron el backend.

## Errores esperados

- Nombre o correo vacío.
- Correo duplicado o formato rechazado por validación.
- Empresa o usuario no seleccionado: **Asociar** debe permanecer deshabilitado.
- Usuario inexistente o inactivo.
- Conflicto por membresía ya existente.
- Backend no accesible.

## Evidencia que se debe tomar

- Captura del usuario creado en el selector.
- Captura del rol y empresa seleccionados.
- Captura del mensaje de asociación.
- Captura posterior a recarga.
- Captura de la advertencia visible de que la identidad aún no se autentica.

## Qué constituye éxito

El usuario se crea, se puede seleccionar, se asocia a la empresa con un rol y la asociación permanece después de recargar.

## Qué constituye fallo

El usuario solo aparece en memoria, el botón **Asociar** se habilita sin datos completos, la membresía no reaparece o se presenta como seguridad real.

---

# MÓDULO 3 — PROYECTOS

## Objetivo

Crear un proyecto persistente ligado a una empresa para poder trabajar con versiones, WBS y presupuesto.

## Cómo acceder

`http://127.0.0.1:3000/` → **Ingresar** → **Tablero Central** → **Administración inicial** → bloque **Crear proyecto persistente**.

## Botón que se debe presionar

**Crear proyecto**.

## Pantalla que debería aparecer

El bloque contiene:

- selector **Empresa**;
- campo **Nombre del proyecto**;
- campo **Ubicación (opcional)**;
- campo **Motivo de creación (opcional)**;
- botón **Crear proyecto**.

## Datos que se deben ingresar

### Campos obligatorios

- Empresa.
- Nombre del proyecto.

### Campos opcionales

- Ubicación.
- Motivo de creación.

### Ejemplo

- Empresa: `Constructora QA COS`
- Nombre: `Casa QA Managua`
- Ubicación: `Managua, Nicaragua`
- Motivo: `Recorrido funcional V1`

## Pasos numerados

1. Seleccionar la empresa.
2. Escribir `Casa QA Managua`.
3. Escribir la ubicación.
4. Escribir el motivo.
5. Presionar **Crear proyecto**.
6. Revisar la sección **Proyectos persistidos**.
7. Seleccionar el proyecto creado.
8. Confirmar que se carguen sus versiones.

## Cómo verificar persistencia

1. El proyecto debe aparecer con nombre, ubicación y estado.
2. Al hacer clic sobre él, debe cargarse el selector de versiones.
3. Recargar el tablero.
4. El proyecto debe seguir en **Proyectos persistidos**.

La pantalla observada sí muestra el bloque y el proyecto existente `Tanque Elevado · Managua · Borrador`, pero no se pudo volver a consultar la lista porque `/api/v1/proyectos` y `/api/v1/proyectos/{id}/versiones` estaban inaccesibles.

## Errores esperados

- Empresa no seleccionada: botón deshabilitado.
- Nombre vacío.
- Empresa inexistente o inactiva.
- Conflicto o restricción de datos.
- Backend detenido.

## Evidencia que se debe tomar

- Captura del formulario completo.
- Captura del proyecto en **Proyectos persistidos**.
- Captura de la primera versión mostrada.
- Captura posterior a recargar.
- Captura de errores de conexión si el proyecto no carga.

## Qué constituye éxito

El proyecto aparece en la lista persistida, permite seleccionar una versión y permanece después de recargar.

## Qué constituye fallo

El proyecto se crea solo visualmente, no aparecen versiones, desaparece al recargar o no se puede seleccionar una empresa válida.

---

# MÓDULO 4 — VERSIONES

## Objetivo

Crear una fotografía de trabajo del proyecto y permitir comparar cambios sin alterar la versión anterior.

## Cómo acceder

`http://127.0.0.1:3000/` → **Ingresar** → **Tablero Central** → **Proyectos persistidos** → seleccionar un proyecto.

## Botones que se deben presionar

- **Nueva versión** para crear una versión.
- **Comparar con versión anterior** para comparar, cuando la versión seleccionada tenga una anterior.
- **Ver auditoría** para consultar eventos.
- **Entrar a Gestionar** para abrir la versión.

## Pantalla que debería aparecer

Al seleccionar un proyecto debe aparecer:

- selector de versión;
- botón **Nueva versión**;
- campo **Motivo de la nueva versión (opcional)**;
- botón de comparación;
- botón **Ver auditoría**;
- botón **Entrar a Gestionar**.

## Datos que se deben ingresar

### Obligatorio funcional

- Proyecto seleccionado.

### Opcional

- Motivo de la nueva versión.
- Versión de origen, si se desea copiar una versión anterior.

### Ejemplo

- Motivo: `Ajuste de cantidades después de revisar planos`

## Pasos numerados

1. Seleccionar `Tanque Elevado` o el proyecto creado.
2. Seleccionar una versión existente.
3. Escribir el motivo de prueba.
4. Presionar **Nueva versión**.
5. Revisar que aparezca `Versión 2` o el siguiente número disponible.
6. Seleccionar la nueva versión.
7. Presionar **Entrar a Gestionar**.
8. Volver al tablero.
9. Recargar.
10. Confirmar que la nueva versión permanezca.
11. Si existe una versión anterior, presionar **Comparar con versión anterior**.
12. Presionar **Ver auditoría** y revisar el evento de creación.

## Cómo verificar persistencia

- El número de versión debe aumentar.
- El estado y motivo deben aparecer en el selector.
- La versión anterior debe permanecer disponible.
- La auditoría debe registrar la creación.
- Al entrar a gestionar, el contexto debe mostrar proyecto y número de versión.

La revisión observó la versión `Versión 1 · Borrador` en pantalla, pero al seleccionar el proyecto el sistema falló al consultar versiones por backend inaccesible. No se validó la creación de una nueva versión.

## Errores esperados

- Sin proyecto o versión seleccionada: **Entrar a Gestionar** deshabilitado.
- Comparación deshabilitada para una versión sin anterior.
- Versión que no pertenece al proyecto.
- Conflicto de numeración.
- Backend detenido.

## Evidencia que se debe tomar

- Captura del selector con versiones.
- Captura del motivo y botón de creación.
- Captura de la versión nueva.
- Captura de comparación con diferencias.
- Captura del panel de auditoría.

## Qué constituye éxito

Una versión nueva se crea sin modificar la anterior, se puede seleccionar, gestionar, comparar y consultar en auditoría después de recargar.

## Qué constituye fallo

Se sobrescribe la versión previa, no se registra auditoría, la versión desaparece al recargar o el proyecto no puede cargar sus versiones.

---

# MÓDULO 5 — WBS

## Objetivo

Administrar capítulos y partidas de una versión concreta del proyecto. En la interfaz se presenta como **Estructura WBS** y **Capítulos y partidas**.

## Cómo acceder

`http://127.0.0.1:3000/` → **Ingresar** → seleccionar proyecto y versión → **Entrar a Gestionar** → **Estructura WBS**.

El botón **Estructura WBS** está deshabilitado si no existe un contexto de proyecto y versión seleccionado.

## Botones que se deben presionar

- **Agregar capítulo**.
- **Editar** capítulo.
- **Eliminar** capítulo.
- **Agregar partida**.
- botón de edición de partida.
- botón de eliminación de partida.
- **Guardar** en formularios de edición.

## Pantalla que debería aparecer

La pantalla muestra:

- encabezado `Estructura WBS · Versión N`;
- nombre del proyecto;
- formulario con **Código de capítulo**, **Nombre del capítulo** y **Agregar capítulo**;
- capítulos en tarjetas;
- columnas de código, descripción, unidad, cantidad, rendimiento y acciones;
- formulario de nueva partida al presionar **Agregar partida**.

## Datos que se deben ingresar

### Capítulo

- Código de capítulo.
- Nombre del capítulo.

### Partida

- Código.
- Descripción.
- Unidad.
- Cantidad.
- Rendimiento opcional.

### Ejemplo

Capítulo:

- Código: `01`
- Nombre: `Cimentaciones`

Partida:

- Código: `01.01`
- Descripción: `Excavación manual`
- Unidad: `M3`
- Cantidad: `10`
- Rendimiento: `0.25`

## Pasos numerados

1. Abrir una versión persistida.
2. Presionar **Estructura WBS**.
3. Escribir `01` y `Cimentaciones`.
4. Presionar **Agregar capítulo**.
5. Esperar **Capítulo guardado en esta versión**.
6. En el capítulo nuevo, presionar **Agregar partida**.
7. Completar código, descripción, unidad y cantidad.
8. Opcionalmente completar rendimiento.
9. Presionar **Agregar**.
10. Revisar la fila creada.
11. Editar la partida y guardar un cambio controlado.
12. Recargar o salir y volver a entrar.
13. Confirmar que capítulo y partida sigan en la misma versión.

## Cómo verificar persistencia

- El capítulo aparece en el árbol de la versión.
- La partida aparece dentro del capítulo.
- La edición devuelve **Partida actualizada**.
- Al volver a cargar la estructura, los valores modificados permanecen.
- Crear o modificar otra versión no altera la versión anterior.

El código de la interfaz tiene operaciones de lectura, alta, edición y eliminación conectadas al backend WBS. En la prueba de ejecución, la carga de `/api/v1/proyectos/1/versiones/1/wbs` falló por conexión rechazada; por ello no se pudo confirmar el guardado real.

## Errores esperados

- Código o nombre de capítulo vacío.
- Código, descripción, unidad o cantidad de partida vacíos.
- Cantidad no numérica o inválida.
- Código duplicado o conflicto de restricción.
- Capítulo no perteneciente a la versión.
- Confirmación modal antes de eliminar capítulo o partida.
- Backend detenido.

## Evidencia que se debe tomar

- Captura del encabezado con proyecto y versión.
- Captura del capítulo creado.
- Captura de la partida creada.
- Captura del mensaje de guardado.
- Captura después de recargar.
- Captura de la confirmación antes de eliminar, si se prueba eliminación.

## Qué constituye éxito

La estructura y las partidas se crean, editan, eliminan con confirmación y permanecen ligadas a la versión correcta después de recargar.

## Qué constituye fallo

La estructura solo existe hasta cambiar de pantalla, se guarda en otra versión, se elimina sin confirmación, no se recarga o no hay respuesta del backend.

---

# MÓDULO 6 — MANO DE OBRA

## Objetivo

Calcular presupuesto laboral, flujo semanal, cronograma y planilla con parámetros laborales de Nicaragua 2026. También puede guardar una instantánea en una versión persistida.

## Cómo acceder

### Modo de demostración

`http://127.0.0.1:3000/` → **Ingresar** → **Tablero Central** → tarjeta **EBAR SUR 2 · espacio de demostración** → **Abrir demo**.

### Modo de proyecto persistido

`http://127.0.0.1:3000/` → **Ingresar** → seleccionar proyecto y versión → **Entrar a Gestionar** → **Mano de Obra**.

## Botones que se deben presionar

- **Agregar Actividad**.
- **Parámetros FSR**.
- **Restablecer Presupuesto**.
- **Guardar Mano de Obra** en contexto persistido.
- pestañas **Memoria y Flujo Semanal**, **Cronograma de Obra** y **Planilla y Nómina**.
- **Descargar Excel (.xlsx)**.

## Pantalla que debería aparecer

En modo demo se muestran 8 partidas precargadas de EBAR SUR 2, tarjetas de resumen, tabla de memoria, cronograma, nómina y controles locales.

En modo persistido aparece además:

- nombre del proyecto y número de versión;
- estado de recuperación;
- campo **Motivo del cambio (opcional)**;
- botón **Guardar Mano de Obra**.

## Datos que se deben ingresar

### Nueva actividad

El modal de actividad debe permitir revisar o completar los datos de la actividad, incluyendo descripción, unidad, cantidad, rendimiento base, oficiales y ayudantes.

### Parámetros FSR

El modal de configuración permite editar los parámetros laborales utilizados por el cálculo, entre ellos salario mínimo, días del mes, horas de jornada, horas máximas semanales, días laborales, factor de oficial y porcentajes laborales.

### Ejemplo

- Descripción: `Limpieza final de obra`
- Unidad: `M2`
- Cantidad: `240`
- Rendimiento base: `80`
- Oficiales: `1`
- Ayudantes: `1`

## Pasos numerados

1. Abrir **EBAR SUR 2 · espacio de demostración**.
2. Confirmar que aparecen las 8 actividades precargadas.
3. Revisar **Memoria y Flujo Semanal**.
4. Abrir **Cronograma de Obra**.
5. Abrir **Planilla y Nómina**.
6. Presionar **Agregar Actividad**.
7. Completar los datos de prueba y guardar el modal.
8. Confirmar que la actividad aparece y que los totales se recalculan.
9. Abrir **Parámetros FSR**, cambiar un valor y guardar.
10. Confirmar que los importes cambian.
11. Presionar **Descargar Excel (.xlsx)** y verificar que se genere el archivo.
12. Para persistencia, entrar a una versión real y presionar **Guardar Mano de Obra**.
13. Salir, volver a entrar a la misma versión y confirmar que aparece **Mano de Obra recuperada de la base de datos**.

## Cómo verificar persistencia

El modo demo es local y no debe considerarse persistente. El modo de versión usa una operación `PUT` de Mano de Obra y debe verificarse mediante salida y reingreso.

La interfaz diferencia entre:

- cambios pendientes de guardar;
- cambios persistidos;
- error al recuperar la Mano de Obra;
- revisión guardada.

Durante la revisión no se pudo probar el modo persistido porque el backend no respondió. La tarjeta demo sí aparece en el tablero y muestra un consolidado de demostración, pero eso no prueba persistencia.

## Errores esperados

- Actividad con datos inválidos.
- Rendimiento menor o igual a cero.
- Confirmación antes de eliminar una actividad.
- Cambios no guardados al cambiar de pantalla.
- Revisión esperada desactualizada o conflicto de concurrencia.
- Error de recuperación si el backend está detenido.

## Evidencia que se debe tomar

- Captura del demo con sus 8 partidas.
- Captura de cada pestaña.
- Captura de actividad agregada y total recalculado.
- Archivo Excel descargado.
- Captura de **Mano de Obra guardada en la Versión N**.
- Captura posterior al reingreso.

## Qué constituye éxito

El cálculo demo funciona localmente, el Excel se genera y, en una versión persistida, los cambios guardados se recuperan al volver a entrar.

## Qué constituye fallo

Tratar el demo como base persistente, perder cambios tras guardar, mostrar éxito sin recuperación posterior o bloquear el flujo con el backend inaccesible.

---

# MÓDULO 7 — APU

## Objetivo

Gestionar la estructura de costos y asociar un APU versionado a una partida de una versión del proyecto.

## Cómo acceder

`http://127.0.0.1:3000/` → **Ingresar** → seleccionar un proyecto y versión → **Entrar a Gestionar** → **Estructura de Costos / APU**.

El módulo también puede mostrar el componente **MaterialesAPUWorkflow** dentro de la pantalla APU cuando existe un contexto persistido.

## Botones que se deben presionar

La navegación lateral muestra **Estructura de Costos / APU**. Las acciones disponibles dependen de la carga de la estructura y del flujo de materiales. Deben comprobarse visualmente antes de ejecutar la prueba; no se debe asumir que existe un botón si la pantalla no lo muestra.

## Pantalla que debería aparecer

La cabecera del módulo indica **Análisis de Precios Unitarios** y describe la consulta de Mano de Obra y el vínculo de materiales con cotizaciones persistidas al APU de una partida versionada.

El APU está conectado conceptualmente a:

- actividades de Mano de Obra;
- partidas de la versión;
- materiales y cotizaciones;
- versiones de APU maestro;
- usos o asociaciones del APU.

## Datos que se deben ingresar

Si la pantalla ofrece creación de APU maestro, la prueba debe usar:

- nombre;
- descripción;
- unidad;
- motivo;
- usuario actor, cuando sea requerido.

Si ofrece una versión de APU, debe solicitar detalle de conceptos, unidad, cantidad, material, proveedor y precio de material.

### Ejemplo

- Nombre: `Concreto estructural 3000 PSI`
- Descripción: `Suministro y colocación de concreto estructural`
- Unidad: `M3`
- Concepto: `Concreto premezclado`
- Cantidad: `1`
- Motivo: `APU de prueba funcional`

## Pasos numerados

1. Abrir una versión persistida con WBS.
2. Entrar a **Estructura de Costos / APU**.
3. Confirmar que se carga la información de la versión y las actividades laborales.
4. Identificar una partida que pueda recibir un APU.
5. Si aparece la opción de crear APU maestro, completar nombre, descripción y unidad.
6. Crear una versión de APU con el detalle disponible.
7. Revisar el costo unitario calculado.
8. Asociar la versión APU a la partida indicando un motivo.
9. Volver a abrir la partida y consultar el uso del APU.
10. Recargar y confirmar que la asociación permanece.

## Cómo verificar persistencia

- La asociación debe aparecer ligada a proyecto, versión y partida.
- Debe conservar el snapshot del APU usado.
- Debe registrarse el motivo y actor, si se proporcionaron.
- Al consultar nuevamente la partida, debe aparecer el uso.

El código del cliente incluye llamadas a creación de APU maestro, versiones y asociación. Sin embargo, la prueba viva no pudo cargar el backend, por lo que no se debe reportar asociación validada.

## Errores esperados

- APU maestro inexistente o inactivo.
- Material, proveedor o precio no encontrados.
- Unidad de precio no coincidente con la unidad del material.
- Actor obligatorio cuando el APU contiene materiales.
- Partida inexistente o no perteneciente a la versión.
- Asociación duplicada o conflicto de estado.
- Backend detenido.

## Evidencia que se debe tomar

- Captura de la cabecera APU.
- Captura del APU maestro creado.
- Captura de su versión y costo unitario.
- Captura de la asociación a la partida.
- Captura de la consulta posterior de usos.
- Captura de la respuesta de error cuando se prueba una unidad incompatible.

## Qué constituye éxito

Se puede crear o consultar un APU, versionarlo, asociarlo a una partida y recuperar la asociación después de recargar.

## Qué constituye fallo

La pantalla aparece pero no carga datos, se permite una asociación inválida, el uso no queda ligado a la partida o desaparece tras recargar.

---

# MÓDULO 8 — MATERIALES

## Objetivo

Consultar el catálogo de materiales, proveedores y cotizaciones, y utilizar precios persistidos dentro del flujo APU.

## Cómo acceder

### Catálogo

`http://127.0.0.1:3000/` → **Ingresar** → **Tablero Central** → **Base de Datos Maestra / Catálogo**.

### Materiales y costos de un proyecto

`http://127.0.0.1:3000/` → **Ingresar** → seleccionar proyecto y versión → **Entrar a Gestionar** → **Materiales y costos**.

## Botones que se deben presionar

- **Base de Datos Maestra / Catálogo**.
- **Materiales y costos**.
- Las acciones de alta de categoría, material, proveedor o cotización solo deben usarse si aparecen habilitadas en la pantalla.

## Pantalla que debería aparecer

El catálogo debe permitir consultar categorías, materiales, proveedores y cotizaciones.

En el contexto de proyecto, la cabecera indica **Materiales reales y cotizaciones** y el texto explica que los materiales y cotizaciones persistidas se integran al APU de una partida versionada.

También existe un componente separado de **Materiales y costos** para datos de demostración, que no debe confundirse con el catálogo real.

## Datos que se deben ingresar

### Categoría

- Código.
- Nombre.
- Usuario creador y motivo, cuando el formulario los solicite.

### Material

- Código.
- Descripción.
- Unidad.
- Categoría.
- Usuario creador y motivo.

### Proveedor

- Nombre.
- Datos opcionales como RUC, teléfono o correo, si la pantalla los ofrece.
- Usuario creador y motivo.

### Cotización

- Material.
- Proveedor.
- Costo unitario.
- Moneda.
- Unidad de precio igual a la unidad del material.
- Fecha de vigencia.
- Origen.
- Referencia opcional.
- Usuario creador y motivo.

### Ejemplo

- Categoría: `CONC` — `Concreto`
- Material: `MAT-QA-001` — `Concreto premezclado 3000 PSI` — `M3`
- Proveedor: `Proveedor QA`
- Costo: `4250`
- Moneda: `NIO`
- Unidad de precio: `M3`
- Fecha de vigencia: `2026-11-08`
- Origen: `Cotización QA-001`

## Pasos numerados

1. Abrir el catálogo desde el Tablero Central.
2. Confirmar si categorías, materiales y proveedores cargan desde el backend.
3. Crear o seleccionar una categoría.
4. Crear o seleccionar un material.
5. Crear o seleccionar un proveedor.
6. Registrar una cotización con moneda, unidad y fecha.
7. Consultar las cotizaciones del material.
8. Consultar el precio vigente.
9. Abrir un proyecto y versión persistidos.
10. Entrar a **Materiales y costos**.
11. Seleccionar una partida y vincular el material o cotización cuando la pantalla lo permita.
12. Volver a consultar el material y la partida.

## Cómo verificar persistencia

- La categoría aparece en el listado.
- El material aparece bajo su categoría.
- El proveedor aparece en proveedores activos.
- La cotización reaparece al consultar el material.
- El precio vigente filtra por moneda y fecha.
- La cotización vinculada queda visible en el flujo APU.

La interfaz intentó consultar `/api/v1/materiales/categorias`, `/api/v1/materiales`, `/api/v1/materiales/proveedores` y WBS, pero recibió conexión rechazada. No se validó persistencia real durante esta revisión.

## Errores esperados

- Código o nombre duplicado.
- Categoría inexistente o inactiva.
- Proveedor inexistente o inactivo.
- Unidad de precio diferente a la unidad del material.
- Moneda inválida.
- Cotización sin fecha válida.
- Material sin cotización vigente.
- Precio consultado en una moneda sin cotizaciones.
- Backend detenido.

## Evidencia que se debe tomar

- Captura del catálogo cargado.
- Captura de material, proveedor y cotización creados.
- Captura de la consulta de precio vigente.
- Captura del vínculo al APU o partida.
- Captura de la validación de unidad incompatible.
- Captura después de recargar.

## Qué constituye éxito

El catálogo carga, permite consultar o crear los registros habilitados, devuelve precios vigentes coherentes y conserva los datos al recargar.

## Qué constituye fallo

Se muestra una lista demo como si fuera persistente, se mezclan monedas, se acepta una unidad incompatible, el precio vigente no respeta fecha o el backend no puede ser contactado.

---

# 3. Pantallas visibles que no pertenecen a los ocho módulos

## Consolidado

Está disponible desde la navegación del proyecto. En el demo combina Mano de Obra y costos disponibles de materiales, equipos y otros. No debe interpretarse automáticamente como un presupuesto persistido.

## Presupuesto Maestro

Está visible cuando existe un contexto persistido de proyecto y versión. Su función es calcular y persistir totales por partida, capítulo y proyecto. Durante la revisión, sus llamadas también fallaron por backend inaccesible.

## Herramientas y Equipos

Visible en la navegación, pero deshabilitado y marcado **Próximamente**.

## Reportes

Visible en la navegación, pero deshabilitado y marcado **Próximamente**.

## Configurar Agente IA

Visible en el Tablero Central, con mensaje de disponibilidad en una fase posterior. No es una función operativa actual.

---

# 4. Criterio común de ejecución de pruebas

Para cada módulo, el QA debe conservar:

1. Datos de entrada exactos.
2. Hora de ejecución.
3. URL o ruta de interfaz.
4. Captura antes y después.
5. Mensaje de éxito o error.
6. Resultado de recarga.
7. Si aplica, respuesta HTTP y endpoint.
8. Estado final: éxito, fallo o bloqueado por entorno.

No registrar como “guardado” un dato solo porque el formulario se limpió o porque apareció un toast. La evidencia mínima de persistencia es poder leer el dato nuevamente después de recargar o salir y volver a entrar.

