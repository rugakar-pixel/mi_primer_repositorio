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