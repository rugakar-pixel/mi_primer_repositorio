# Fase 2C — Prueba funcional de extremo a extremo

## Datos de la prueba

La prueba se ejecutó en una base SQLite temporal, aislada de la base del
proyecto. Los registros fueron creados mediante la interfaz/API y persistidos
en esa base:

- Empresa: Constructora QA Fase 2C
- Proyecto: **Tanque Elevado**
- Versión de proyecto: **V1**
- Capítulo: **Cimentaciones**
- Partida: **01.01 · Concreto 3000 PSI**, unidad M3
- Material: **Cemento GU**, unidad SACO
- Proveedores: A, B y C
- Cotizaciones vigentes iniciales: A = **12.00**, B = **11.00**, C = **13.00**
  NIO/SACO

## Ejecución y evidencia visual

1. Se creó categoría, material, proveedores y cotizaciones desde el módulo
   **Materiales reales y cotizaciones**. La interfaz confirmó cada alta como
   persistida y auditada.
2. La tabla de precios vigentes mostró los tres proveedores ordenados por
   precio; **Proveedor B, NIO 11.00/SACO** apareció como menor precio vigente.
   El historial mostró todas las cotizaciones registradas.
3. Se seleccionó la partida 01.01 y la cotización de Proveedor B. Con cantidad
   de material 1 SACO por M3, se creó una versión APU y se asoció a la partida.
4. El backend calculó y persistió costo unitario **NIO 11.00/M3**. La tarjeta
   visual mostró el encadenamiento:

   **Tanque Elevado · V1 · 01.01 · APU V1**  
   **Material: Cemento GU · Proveedor: Proveedor B · Precio: C$11.00/SACO ·
   Cotización #5 · origen y fecha**  
   **Costo unitario APU: C$11.00**

5. Se registró otra cotización de Proveedor B por **NIO 9.50/SACO**. La lista
   pasó a mostrar 9.50 como menor precio vigente, y el historial aumentó sin
   sobrescribir filas previas.
6. La tarjeta de trazabilidad del proyecto continuó mostrando la cotización #5
   y costo unitario **C$11.00**, aunque el catálogo ya presenta 9.50. Esto
   demuestra el snapshot inmutable de la selección histórica.

La interfaz del mismo flujo fue comprobada en las secciones Materiales y costos
y Estructura de Costos / APU. La tarjeta de uso muestra proyecto, versión,
partida, capítulo, versión APU, material, proveedor, precio, cotización, origen
y fecha.

## Nota sobre fechas de prueba

La primera ejecución visual reveló que el control `datetime-local` usaba una
fecha UTC como hora local y generaba cotizaciones futuras. Se corrigió el
formateo local antes de repetir la prueba. Los registros de prueba futuros no
se editaron ni borraron: quedaron conservados en el historial y no fueron
considerados vigentes en la fecha de consulta. Las pruebas automatizadas parten
de una base aislada nueva y validan exactamente tres cotizaciones iniciales.

## Resultado

**Flujo funcional visual y persistido en SQLite temporal: correcto.**  
La validación equivalente sobre PostgreSQL queda pendiente de aplicar y probar
la migración 006 en un entorno autorizado.
