# Bitácora del proyecto

## Importante: inicio manual de la aplicación

La aplicación se inicia como proyecto web con Node.js y Vite; no se ejecuta
directamente desde un archivo Python. Para iniciarla manualmente, abre una
terminal en la carpeta del proyecto y ejecuta:

```powershell
npm.cmd run dev
```

Después, abre en el navegador la dirección local que muestra Vite (por ejemplo,
`http://localhost:3000`). Mantén la terminal abierta mientras uses la aplicación
y presiona `Ctrl+C` para detener el servidor. Como alternativa, haz doble clic en
`run-dev.bat` desde el Explorador de archivos; el archivo cambia a la carpeta
del proyecto e inicia el servidor.

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
| Media | Revisar en el futuro la separación entre el presupuesto Consolidado y las vistas del Módulo de Mano de Obra. | Asegurar que el consolidado reciba correctamente los resultados de todos los módulos sin duplicar la vista de presupuesto dentro del módulo. | Pendiente para una revisión futura solicitada por el usuario. |
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

## Validaciones

- `npm run lint`: correcto.
- `npm run build`: correcto; quedan avisos de tamaño del módulo Excel y de uso de `__dirname` en Vite.
- `npm run clean`: correcto.
- La aplicación respondió en `http://127.0.0.1:3000` y se verificó que aparecen cuatro pestañas.
- Las cuatro vistas del Módulo de Mano de Obra se abrieron; parámetros y formulario de actividad abrieron y cerraron sin guardar cambios.
- El usuario confirmó que la descarga del Excel funciona correctamente; la apertura del archivo aún no se ha confirmado.
- Tras agregar el Consolidado, se comprobó que las partidas y el total coinciden con la vista de presupuesto del Módulo de Mano de Obra.
