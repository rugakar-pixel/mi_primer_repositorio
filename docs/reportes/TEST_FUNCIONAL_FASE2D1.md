# Fase 2D.1 — Test Funcional

**Estado:** APROBADO  
**Fecha:** 2026-11-08  
**Ambiente:** frontend Vite local + backend FastAPI local + SQLite temporal

## 1. Caso funcional

| Elemento | Valor |
|---|---|
| Proyecto | Tanque Elevado |
| Versión | V1 |
| Capítulo | Cimentaciones |
| Partidas | Excavación, Concreto, Acero |
| Moneda | NIO |

## 2. Recorrido visual ejecutado

1. Se inició sesión en el acceso de demostración.
2. Se abrió el proyecto **Tanque Elevado** desde el Tablero Central.
3. Se seleccionó la **Versión 1**.
4. Se abrió la pantalla **Presupuesto Maestro**.
5. Se verificó el Capítulo **Cimentaciones**.
6. Se verificaron las tres Partidas y sus costos unitarios.
7. Se verificó el total del Capítulo.
8. Se verificó el Total General.
9. Se ejecutó **Calcular y guardar**.
10. Se comprobó que la revisión aumentó y el importe se conservó.

## 3. Resultado observado

```text
Capítulo: Cimentaciones

Excavación: 10 × C$100.00 = C$1,000.00
Concreto:    20 × C$200.00 = C$4,000.00
Acero:       30 ×  C$50.00 = C$1,500.00

Total Capítulo: C$6,500.00
Total General:  C$6,500.00
```

La pantalla mostró además el origen `Costo persistido`, la cantidad, unidad, costo unitario e importe de cada Partida.

## 4. Criterio de aprobación visual

El criterio se cumple porque el usuario puede observar en una sola pantalla el recorrido:

```text
Proyecto → Versión → Capítulo → Partida → Costo → Total Capítulo → Total Proyecto
```

La acción de guardado mostró confirmación y elevó la revisión persistida de 7 a 8.

## 5. Resultado funcional

**APROBADO.** El Presupuesto Maestro mínimo opera de extremo a extremo para una versión del proyecto y conserva los totales al recargar la información.

