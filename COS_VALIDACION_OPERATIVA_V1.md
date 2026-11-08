# COS — Validación Operativa V1

## Módulo validado: EMPRESA

**Fecha de validación:** 8 de noviembre de 2026  
**Aplicación:** COS — Construction Operating System  
**URL observada:** `http://127.0.0.1:3000/`

---

## 1. Cómo acceder

1. Abrir `http://127.0.0.1:3000/`.
2. En la pantalla de acceso ingresar:
   - Usuario: `Usuario`
   - Contraseña: `Contraseña`
3. Presionar **Ingresar**.
4. En el **Tablero Central**, abrir el panel:

   **Administración inicial · empresas, usuarios y proyectos**

5. Ubicar el bloque **Crear empresa**.

---

## 2. Qué botón presionar

En el bloque **Crear empresa**, presionar:

**Crear empresa**

---

## 3. Qué pantalla aparece

La aplicación muestra el **Tablero Central** y, dentro del panel de administración inicial, el formulario **Crear empresa**.

La pantalla observada contiene:

- **Nombre de la empresa**;
- **Motivo (opcional)**;
- botón **Crear empresa**.

El panel también muestra selectores de empresa para operaciones posteriores.

---

## 4. Qué campos llenar

### Campo obligatorio

- **Nombre de la empresa**.

### Campo opcional

- **Motivo**.

No se debe considerar creado un registro únicamente porque el formulario se limpie. La creación debe confirmarse con el mensaje de resultado y mediante una consulta posterior.

---

## 5. Ejemplo completo

Usar los siguientes datos de prueba:

- Nombre de la empresa: `Empresa QA COS 2026-11-08`
- Motivo: `Validación operativa del módulo Empresa`

Recorrido:

1. Escribir `Empresa QA COS 2026-11-08` en **Nombre de la empresa**.
2. Escribir `Validación operativa del módulo Empresa` en **Motivo**.
3. Presionar **Crear empresa**.
4. Esperar el resultado visible.
5. Buscar la empresa en el selector de empresa.
6. Recargar el tablero.
7. Buscar nuevamente la empresa.

Durante esta validación no fue posible completar el envío con confirmación de persistencia porque el backend no respondió.

---

## 6. Resultado esperado

El resultado esperado es:

- mensaje visible de empresa creada y persistida;
- formulario limpiado después de una respuesta exitosa;
- empresa nueva disponible en el selector de empresa;
- empresa disponible después de recargar la página;
- empresa lista para utilizarse en los siguientes procesos administrativos.

Si el sistema muestra un error de conexión, el resultado no debe considerarse exitoso.

---

## 7. Cómo comprobar persistencia

La persistencia debe comprobarse desde la aplicación, sin asumir que el mensaje de éxito es suficiente:

1. Crear la empresa con los datos del ejemplo.
2. Confirmar el mensaje de éxito.
3. Abrir el selector de empresa.
4. Verificar que aparezca `Empresa QA COS 2026-11-08`.
5. Recargar completamente `http://127.0.0.1:3000/`.
6. Iniciar sesión nuevamente si la sesión se perdió.
7. Abrir **Administración inicial**.
8. Verificar que la empresa siga apareciendo.

La persistencia queda **no comprobada** si el backend está detenido, si la lista no se actualiza o si solo se observa el formulario sin volver a leer el registro.

---

## 8. Problemas encontrados

### Problema 1 — Backend no accesible

Durante el uso real de la interfaz, las solicitudes de datos administrativos al backend en `http://127.0.0.1:8080/api/v1` devolvieron:

`net::ERR_CONNECTION_REFUSED`

La aplicación mostró el mensaje:

> “No fue posible conectar con el backend. Verifica que FastAPI esté iniciado.”

### Impacto

- No se pudo confirmar la creación real de una empresa.
- No se pudo confirmar la lectura posterior desde persistencia.
- No se pudo confirmar que el registro sobreviva a una recarga.

### Problema 2 — Acceso de demostración

La pantalla de acceso funciona como acceso de demostración. No debe interpretarse como autenticación o seguridad real de usuarios.

### Alcance de la evidencia

Sí se observó el panel **Crear empresa** y sus campos. No se obtuvo evidencia válida de una empresa nueva guardada en esta ejecución.

---

## 9. Evidencia

La evidencia que debe conservarse para cerrar la validación es:

1. Captura de la pantalla de acceso.
2. Captura del Tablero Central.
3. Captura del panel **Administración inicial** abierto.
4. Captura del formulario con los datos del ejemplo antes de enviarlo.
5. Captura del mensaje de creación exitosa, si aparece.
6. Captura del selector mostrando la empresa creada.
7. Captura después de recargar mostrando nuevamente la empresa.
8. Si falla, captura del mensaje de conexión y del momento en que no se pudo cargar la información.

En la ejecución observada se cuenta con evidencia de la pantalla y del error de conexión, pero no con evidencia de persistencia exitosa.

---

## 10. Estado final

# ⚠️ Parcial

### Justificación

- La pantalla del módulo Empresa es accesible.
- El formulario **Crear empresa** es visible.
- Los campos y el botón están disponibles.
- El backend no fue accesible durante la validación.
- La creación y la persistencia real no pudieron comprobarse.

El módulo no puede clasificarse como **✅ Funcional** hasta completar el ciclo crear → confirmar → recargar → volver a consultar. Tampoco se clasifica como **❌ No funcional** porque la pantalla y el flujo inicial sí están presentes; el bloqueo observado corresponde a la conexión del backend.

