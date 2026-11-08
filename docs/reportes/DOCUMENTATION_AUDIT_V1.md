# Auditoría documental COS — V1

**Fecha:** 2026-11-07  
**Alcance:** documentación del repositorio; no se modificaron código, backend ni frontend.  
**Resultado:** **AUDITORÍA NO APROBADA**

## 1. Resumen ejecutivo

La documentación contiene 30 archivos documentales en la línea base: 29 Markdown y 1 TXT. Hay 17 archivos bajo `docs/`, 12 Markdown fuera de `docs/` y un archivo técnico TXT en `backend/`.

Se corrigieron 23 enlaces Markdown locales que quedaron rotos después de la reorganización manual. La verificación posterior encontró 26 enlaces locales y 0 enlaces locales rotos.

La auditoría no se aprueba todavía porque persisten documentos fuera de `docs/`, cuatro documentos sin referencias entrantes claras, categorías previstas que aún no existen y referencias en texto plano que no permiten navegación. La corrección de enlaces quedó aprobada técnicamente; la arquitectura documental completa, no.

## 2. Inventario completo

### Arquitectura

- [docs/arquitectura/ARQUITECTURA_DATOS_V1.md](../arquitectura/ARQUITECTURA_DATOS_V1.md) — arquitectura de datos maestra.
- [docs/arquitectura/DOCUMENTACION_TECNICA.md](../arquitectura/DOCUMENTACION_TECNICA.md) — documentación técnica y funcional.

### Fases actualmente bajo `docs/`

- [docs/fases/FASE1_RESULTADO_FINAL.md](../fases/FASE1_RESULTADO_FINAL.md) — resultado de Fase 1.
- [docs/fases/FASE2A_DISENO_WBS.md](../fases/FASE2A_DISENO_WBS.md) — diseño WBS de Fase 2A.
- [docs/fases/FASE2A_RESULTADO_FINAL.md](../fases/FASE2A_RESULTADO_FINAL.md) — resultado de Fase 2A.

### Gestión

- [docs/gestion/MARCA_OFICIAL_V1.md](../gestion/MARCA_OFICIAL_V1.md) — marca oficial.
- [docs/gestion/PROJECT_STATUS.md](../gestion/PROJECT_STATUS.md) — estado del proyecto.
- [docs/gestion/RENAME_IMPACT_ANALYSIS.md](../gestion/RENAME_IMPACT_ANALYSIS.md) — análisis histórico sustituido.
- [docs/gestion/RENOMBRE_PROPUESTA_FINAL.md](../gestion/RENOMBRE_PROPUESTA_FINAL.md) — propuesta histórica sustituida.

### Reportes

- [docs/reportes/REPORTE_ETAPA_1.md](./REPORTE_ETAPA_1.md)
- [docs/reportes/REPORTE_ETAPA_2.md](./REPORTE_ETAPA_2.md)
- [docs/reportes/REPORTE_ETAPA_3.md](./REPORTE_ETAPA_3.md)
- [docs/reportes/REPORTE_ETAPA_4.md](./REPORTE_ETAPA_4.md)
- [docs/reportes/REPORTE_ETAPA_5.md](./REPORTE_ETAPA_5.md)
- [docs/reportes/REPORTE_ETAPA_6.md](./REPORTE_ETAPA_6.md)
- [docs/reportes/REPORTE_ETAPA_7.md](./REPORTE_ETAPA_7.md)

### Fuera de `docs/`

- [README.md](../../README.md) — entrada principal del repositorio.
- [BRANDING_IMPLEMENTACION_V1.md](../gestion/BRANDING_IMPLEMENTACION_V1.md) — implementación de marca.
- [FASE1_IMPLEMENTACION_V1.md](../fases/FASE1_IMPLEMENTACION_V1.md) — plan de implementación de Fase 1.
- [FASE2B_DISENO_APU.md](../arquitectura/FASE2B_DISENO_APU.md) — diseño de APU.
- [FASE2B_RESULTADO_FINAL.md](../fases/FASE2B_RESULTADO_FINAL.md) — resultado de Fase 2B.
- [FASE2C_CERTIFICACION_POSTGRESQL.md](./FASE2C_CERTIFICACION_POSTGRESQL.md) — certificación de Fase 2C.
- [FASE2C_DISENO_MATERIALES.md](../arquitectura/FASE2C_DISENO_MATERIALES.md) — diseño de materiales.
- [FASE2C_RESULTADO_FINAL.md](../fases/FASE2C_RESULTADO_FINAL.md) — resultado de Fase 2C.
- [TEST_FUNCIONAL_FASE2C.md](./TEST_FUNCIONAL_FASE2C.md) — prueba funcional.
- [TEST_TECNICO_FASE2C.md](./TEST_TECNICO_FASE2C.md) — pruebas técnicas.
- [frontend/BITACORA.md](../bitacora/BITACORA.md) — bitácora del proyecto.
- [.github/copilot-instructions.md](../../.github/copilot-instructions.md) — constitución/instrucciones de gobierno del repositorio; su copia documental está en [AI_PROJECT_CONSTITUTION.md](../gestion/AI_PROJECT_CONSTITUTION.md).

### TXT y documentación técnica complementaria

- [backend/requirements.txt](../../backend/requirements.txt) — dependencias técnicas; no es documentación operativa y no se propone moverlo.

## 3. Validación de enlaces

### Enlaces corregidos

Se corrigieron 23 ocurrencias de enlaces rotos:

- `docs/arquitectura/DOCUMENTACION_TECNICA.md`: 10 ocurrencias hacia la raíz, `frontend/` y `backend/`; se cambiaron a rutas `../../...`.
- `docs/gestion/PROJECT_STATUS.md`: `DOCUMENTACION_TECNICA.md` pasó a `../arquitectura/DOCUMENTACION_TECNICA.md`.
- `docs/gestion/RENAME_IMPACT_ANALYSIS.md`: `BRANDING_IMPLEMENTACION_V1.md` pasó a `../../BRANDING_IMPLEMENTACION_V1.md`.
- `docs/gestion/RENOMBRE_PROPUESTA_FINAL.md`: `BRANDING_IMPLEMENTACION_V1.md` pasó a `../../BRANDING_IMPLEMENTACION_V1.md`.
- `FASE1_IMPLEMENTACION_V1.md`: siete reportes pasaron a `./docs/reportes/...` y el resultado pasó a `./docs/fases/...`.
- `README.md`: los dos enlaces de Fase 2A pasaron a `./docs/fases/...`.

### Evidencia posterior

- Enlaces Markdown locales detectados en la línea base auditada: **26** (el presente informe añade sus propios enlaces de navegación).
- Enlaces Markdown locales rotos: **0**.
- Enlaces externos o anclas Markdown detectados: **0**.
- No se detectaron referencias Markdown con destino inexistente después de la corrección.

## 4. Enlaces y referencias pendientes

- Existen referencias en texto plano o código inline, por ejemplo nombres de documentos dentro de listas y narrativas. No son enlaces navegables y no se transformaron automáticamente porque requieren decisión editorial.
- [docs/arquitectura/DOCUMENTACION_TECNICA.md](../arquitectura/DOCUMENTACION_TECNICA.md) contiene un árbol de carpetas y referencias históricas que todavía muestran documentos en ubicaciones antiguas; deben actualizarse manualmente como contenido editorial.
- Varias referencias a `FASE2B_*`, `FASE2C_*`, `TEST_*` y `BRANDING_IMPLEMENTACION_V1.md` siguen siendo texto plano desde documentos históricos.
- No se encontraron enlaces a anclas internas (`#seccion`) que pudieran validarse automáticamente.

## 5. Archivos huérfanos

Se consideran huérfanos en la línea base los Markdown sin referencia entrante clara desde otro documento:

- [docs/ANEXO_FASE2D_DEFINICIONES_NEGOCIO_V1.md](../anexos/ANEXO_FASE2D_DEFINICIONES_NEGOCIO_V1.md) — anexo de definiciones de negocio sin índice ni vínculo entrante.
- [FASE2B_DISENO_APU.md](../arquitectura/FASE2B_DISENO_APU.md) — diseño de Fase 2B sin vínculo entrante.
- [FASE2B_RESULTADO_FINAL.md](../fases/FASE2B_RESULTADO_FINAL.md) — resultado de Fase 2B sin vínculo entrante.
- [FASE2C_CERTIFICACION_POSTGRESQL.md](./FASE2C_CERTIFICACION_POSTGRESQL.md) — certificación sin vínculo entrante.

La condición de huérfano es documental, no implica que el archivo carezca de valor técnico.

## 6. Archivos fuera de `docs/` y ubicación recomendada

| Ubicación actual | Ubicación recomendada | Motivo |
|---|---|---|
| `README.md` | Mantener en raíz | Punto de entrada convencional del repositorio; enlazar al índice documental. |
| `BRANDING_IMPLEMENTACION_V1.md` | `docs/gestion/BRANDING_IMPLEMENTACION_V1.md` | Gestión de marca e implementación. |
| `FASE1_IMPLEMENTACION_V1.md` | `docs/fases/FASE1_IMPLEMENTACION_V1.md` | Plan de ejecución de una fase. |
| `FASE2B_DISENO_APU.md` | `docs/arquitectura/FASE2B_DISENO_APU.md` | Diseño arquitectónico y de modelo APU. |
| `FASE2B_RESULTADO_FINAL.md` | `docs/fases/FASE2B_RESULTADO_FINAL.md` | Resultado formal de una fase. |
| `FASE2C_CERTIFICACION_POSTGRESQL.md` | `docs/reportes/FASE2C_CERTIFICACION_POSTGRESQL.md` | Certificación y evidencia técnica. |
| `FASE2C_DISENO_MATERIALES.md` | `docs/arquitectura/FASE2C_DISENO_MATERIALES.md` | Diseño del motor y contratos. |
| `FASE2C_RESULTADO_FINAL.md` | `docs/fases/FASE2C_RESULTADO_FINAL.md` | Resultado formal de una fase. |
| `TEST_FUNCIONAL_FASE2C.md` | `docs/reportes/TEST_FUNCIONAL_FASE2C.md` | Evidencia de pruebas. |
| `TEST_TECNICO_FASE2C.md` | `docs/reportes/TEST_TECNICO_FASE2C.md` | Evidencia de pruebas. |
| `frontend/BITACORA.md` | `docs/bitacora/BITACORA.md` | Bitácora transversal del proyecto. |
| `.github/copilot-instructions.md` | Mantener en `.github/` | Archivo de instrucciones/configuración del repositorio. |

No se ejecutaron movimientos.

## 7. Estructura definitiva propuesta

```text
docs/
├── arquitectura/
├── fases/
├── reportes/
├── gestion/
├── decisiones/
├── anexos/
├── roadmap/
└── bitacora/
```

Asignación propuesta:

- `arquitectura/`: arquitectura de datos, documentación técnica, diseño APU y diseño de materiales.
- `fases/`: planes y resultados de Fase 1, 2A, 2B y 2C.
- `reportes/`: reportes de etapas, certificaciones y pruebas.
- `gestion/`: estado, marca y análisis de impacto/renombre.
- `decisiones/`: futuras actas y decisiones arquitectónicas explícitas; actualmente no hay una colección separada que requiera mover.
- `anexos/`: definiciones de negocio de Fase 2D.
- `roadmap/`: futuro roadmap versionado; actualmente no hay un archivo independiente.
- `bitacora/`: bitácora del proyecto.

## 8. Riesgos encontrados

1. La reorganización manual dejó rutas relativas inválidas; ya fueron corregidas.
2. La documentación está distribuida entre raíz, `docs/`, `frontend/` y `.github/`.
3. No existe todavía un índice documental canónico que conecte arquitectura, fases, reportes, marca y estado.
4. Hay cuatro documentos sin referencias entrantes, por lo que pueden quedar fuera del flujo de lectura.
5. Hay documentos históricos marcados como sustituidos que conviene conservar en una política explícita de archivo.
6. Algunos árboles de carpetas y referencias en texto plano pueden quedar obsoletos aunque los enlaces Markdown sean válidos.

## 9. Nivel de calidad documental

**Nivel: Medio-bajo / parcialmente conforme.**

La integridad de los enlaces Markdown quedó conforme, pero la estructura objetivo, la centralización bajo `docs/` y la navegación transversal todavía no están completas. El criterio de éxito exige poder llegar desde cualquier documento importante a Arquitectura, Fases, Reportes, Marca y Estado; esa navegación no está garantizada en la línea base actual.

## 10. Veredicto

**AUDITORÍA NO APROBADA.**

Evidencia favorable: 0 enlaces Markdown locales rotos después de la corrección.  
Evidencia bloqueante: 12 archivos Markdown fuera de `docs/`, 4 documentos huérfanos y ausencia de un índice/navegación transversal que cumpla el criterio de éxito completo.

Para una V2 se recomienda ejecutar los movimientos propuestos con revisión humana, crear `docs/decisiones/`, `docs/anexos/`, `docs/roadmap/` y `docs/bitacora/`, y añadir un índice canónico enlazado desde [README.md](../../README.md).
