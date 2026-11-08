# CONSTITUCIÓN DEL PROYECTO

## Identidad Oficial del Producto

**Nombre:** COS  
**Nombre expandido:** Construction Operating System  
**Descriptor:** Gerente Administrativo IA para Construcción.  
**Aprobado:** 2026-11-06.

---

## Misión

Construir una plataforma capaz de analizar información técnica y administrativa de proyectos de construcción para generar:

- Presupuestos.
- APU.
- Análisis de costos.
- Flujo financiero.
- Reportes técnicos.
- Reportes ejecutivos.
- Recomendaciones administrativas.

La IA es un consumidor de información y un generador de recomendaciones.

La IA NO es la fuente de verdad.

---

# PRINCIPIO 1

ESCALAR SIN DESTRUIR

Regla obligatoria:

- No reemplazar módulos funcionales.
- No rehacer sistemas existentes.
- No eliminar APIs existentes.
- No cambiar contratos existentes sin justificación.

Siempre:

- Extender.
- Adaptar.
- Evolucionar.

Nunca:

- Reescribir completamente.

---

# PRINCIPIO 2

COMPATIBILIDAD HACIA ATRÁS

Toda mejora debe:

- Mantener APIs existentes.
- Mantener exportaciones existentes.
- Mantener cálculos existentes.
- Mantener integraciones existentes.

La compatibilidad es prioritaria sobre la velocidad.

---

# PRINCIPIO 3

VERSIONAMIENTO OBLIGATORIO

Todo dato crítico debe estar asociado a:

Empresa
→ Proyecto
→ VersionProyecto

No crear información huérfana.

No almacenar información fuera de la estructura de versiones.

---

# PRINCIPIO 4

AUDITORÍA OBLIGATORIA

Todo cambio relevante debe registrar:

- Quién
- Cuándo
- Qué
- Por qué

No diseñar nuevas funcionalidades sin considerar trazabilidad.

---

# PRINCIPIO 5

PRESUPUESTO MAESTRO

El Presupuesto Maestro es la fuente única de verdad.

Todos los módulos financian al Presupuesto Maestro.

Jerarquía:

VersionProyecto
└── PresupuestoMaestro
    ├── ManoObra
    ├── Materiales
    ├── Equipos
    ├── Subcontratos
    └── OtrosCostos

El Consolidado es una vista del Presupuesto Maestro.

No diseñar consolidaciones paralelas.

---

# PRINCIPIO 6

NO DUPLICAR DATOS

Si existe una entidad:

- reutilizarla
- ampliarla
- relacionarla

Evitar:

- duplicados
- copias innecesarias
- cálculos repetidos

---

# PRINCIPIO 7

CATÁLOGOS SON FUENTE DE REFERENCIA

No convertir automáticamente:

- MaestroPartidas
- Materiales
- Proveedores
- Precios Históricos

en datos operativos.

Los catálogos son referencia.

Los presupuestos almacenan snapshots.

---

# PRINCIPIO 8

IA FUTURA

Toda nueva entidad debe responder:

¿Cómo será utilizada por el futuro Gerente Administrativo IA?

Si la respuesta es desconocida:

documentar la entidad antes de implementarla.

---

# PRINCIPIO 9

DOCUMENTAR ANTES DE CODIFICAR

Para cualquier fase nueva:

1. Arquitectura.
2. Modelo de datos.
3. Flujo funcional.
4. Impacto.
5. Riesgos.
6. Implementación.

No comenzar código de producción antes del diseño.

---

# PRINCIPIO 10

EVIDENCIA OBLIGATORIA

Toda tarea finalizada debe entregar:

- Archivos modificados.
- Migraciones.
- APIs.
- Pruebas.
- Evidencias.

No asumir éxito sin validación.

---
# PRINCIPIO 11

CONOCIMIENTO COMO ACTIVO

COS no solamente calcula.

COS aprende.

Los siguientes elementos se consideran activos estratégicos:

- APU
- Partidas
- Materiales
- Cotizaciones
- Proveedores
- Presupuestos
- Reportes
- Hallazgos

Nunca sobrescribir información histórica.

Toda mejora deberá generar:

- nueva versión
- nueva revisión
- nueva evidencia

Los activos históricos deben permanecer consultables.
---
# PRINCIPIO 12

SNAPSHOTS OBLIGATORIOS

Todo presupuesto aprobado debe poder reconstruirse.

Por lo tanto:

Los presupuestos NO dependen directamente
del estado actual de:

- materiales
- proveedores
- precios
- APU

El presupuesto almacenará snapshots.

Un cambio futuro en un catálogo NO debe modificar:

- presupuestos históricos
- reportes históricos
- versiones históricas
---
# PRINCIPIO 13

WBS COMO ESTRUCTURA OFICIAL

Toda información presupuestaria debe pertenecer a una WBS.

Jerarquía oficial:

Empresa
→ Proyecto
→ VersionProyecto
→ Capítulo
→ Partida
→ APU
→ Recursos

No crear costos sin contexto WBS.

No crear APU huérfanos.
----
# PRINCIPIO 14

PRESUPUESTO MAESTRO

El Presupuesto Maestro es el núcleo financiero de COS.

No es un reporte.

No es un consolidado.

No es una exportación.

Es la fuente única de verdad financiera.

Todo cálculo debe originarse en:

VersionProyecto
→ PresupuestoMaestro

El Consolidado es únicamente una vista del Presupuesto Maestro.
---
# PRINCIPIO 15

DOCUMENTACIÓN COMO CÓDIGO

Toda decisión importante debe quedar documentada.

Antes de desarrollar una nueva fase:

- Arquitectura
- Modelo de datos
- Pruebas
- Riesgos
- Decisiones

deben existir en docs/.

No iniciar desarrollos importantes sin documentación.
---
# PRINCIPIO 16

COS NO GENERA DATOS SIN EVIDENCIA

El futuro Gerente Administrativo IA:

NO inventa.

NO asume.

NO rellena datos faltantes.

Siempre debe:

- citar fuentes
- indicar supuestos
- registrar evidencia

Las recomendaciones deben diferenciar:

Hechos

Estimaciones

Inferencias

Opiniones
---
# PRINCIPIO 17

PRUEBAS DE NEGOCIO OBLIGATORIAS

No se considera completada una fase porque compile.

No se considera completada una fase porque existan tablas.

Toda fase deberá demostrar:

- flujo funcional
- caso real
- persistencia
- versionamiento
- auditoría

cuando aplique.

La evidencia funcional tiene prioridad sobre la evidencia técnica.
---# PRINCIPIO 18

COS PRIMERO
IA DESPUÉS

La IA nunca será construida antes que:

- Datos
- Versiones
- Auditoría
- Presupuesto Maestro

La IA debe apoyarse en datos confiables.

La IA no sustituye la arquitectura.
---

# OBJETIVO FINAL

El éxito del proyecto se alcanza cuando un usuario puede cargar:

- Planos.
- PDF.
- Excel.
- Especificaciones.
- Contratos.
- Catálogos.

y el sistema genera automáticamente:

- WBS.
- Partidas.
- APU.
- Presupuesto.
- Flujo financiero.
- Informe técnico.
- Informe ejecutivo.
- Excel.
- Word.
- PDF.

manteniendo trazabilidad y auditoría completas.
----

Versión de Constitución:

2.0

Última actualización:

2026-11-07

Estado:

Vigente