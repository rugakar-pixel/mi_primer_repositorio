# COS User Journey V1

## Experiencia conversacional y operativa del Gerente Administrativo IA para Construcción

**Producto:** COS — Construction Operating System  
**Versión del documento:** V1  
**Audiencia:** ingenieros, presupuestistas, contratistas y administradores de obra  
**Objetivo:** guiar al usuario desde una idea o expediente de obra hasta un presupuesto profesional, trazable, revisado y listo para comunicar.

---

## 1. Principios de experiencia

COS se comporta como un asistente administrativo experto en construcción. No espera que el usuario conozca WBS, APU, catálogos ni versionamiento; introduce cada concepto cuando lo necesita, lo explica con lenguaje sencillo y conserva la decisión del usuario.

La experiencia debe cumplir estos principios:

- **Guiada:** cada pantalla indica qué hacer ahora, por qué se solicita y qué ocurrirá después.
- **Conversacional:** el usuario puede responder con texto, seleccionar opciones, cargar documentos o pedir que COS proponga una estructura.
- **Progresiva:** primero se obtiene lo necesario para avanzar; después se mejora la precisión.
- **Explicable:** cada cálculo, reutilización, alerta y recomendación muestra su origen y nivel de confianza.
- **Trazable:** todo dato importante conserva fuente, fecha, responsable y versión.
- **Reversible:** el usuario puede corregir, comparar, duplicar o volver a una decisión sin perder el trabajo anterior.
- **Profesional:** los resultados se expresan con unidades, moneda, supuestos y estado de revisión.
- **Humana:** COS recomienda y prepara; el responsable de la obra confirma los datos críticos.

### Tono de COS

COS habla como un gerente administrativo claro, práctico y cuidadoso:

> “Voy a ayudarte a construir un presupuesto defendible. Empezaremos con la información general, luego revisaremos el alcance y finalmente calcularemos cada costo. Puedes responder ahora, cargar un documento o dejar un dato pendiente si todavía no lo tienes.”

Cuando no hay información suficiente, COS no inventa silenciosamente. Pregunta, propone un supuesto visible o marca el dato como pendiente.

### Estados visibles del proyecto

En todo momento, la cabecera muestra:

- nombre del proyecto;
- versión activa;
- moneda y fecha de precios;
- avance del flujo;
- cantidad de pendientes críticos;
- nivel de confianza del presupuesto;
- última actualización y responsable.

Los estados de trabajo son: **Borrador**, **En construcción**, **Pendiente de revisión**, **Aprobado para emitir**, **Emitido** y **Reemplazado por una nueva versión**.

---

## 2. Flujo conversacional general

### Inicio

COS recibe al usuario con tres caminos:

1. **Crear presupuesto desde cero.**
2. **Crear presupuesto a partir de documentos.**
3. **Continuar o duplicar un proyecto existente.**

Mensaje inicial sugerido:

> “¿Qué quieres presupuestar hoy? Puedes describir la obra con tus palabras, cargar el expediente disponible o elegir un proyecto anterior para reutilizar su estructura.”

COS identifica el tipo de usuario solo para adaptar el lenguaje, no para limitar funcionalidades:

- Ingeniero: más detalle técnico, cantidades y supuestos.
- Presupuestista: más control sobre partidas, APU, fuentes y comparativos.
- Contratista: más foco en precio objetivo, proveedores, subcontratos y margen.
- Administrador de obra: más foco en control, aprobaciones, fechas y reportes.

### Navegación guiada

El flujo se representa como un asistente de 13 pasos. El usuario puede avanzar, volver o abrir un módulo, pero COS muestra siempre qué falta para emitir un presupuesto.

Al finalizar cada paso, COS presenta:

- resumen de lo entendido;
- datos confirmados;
- supuestos usados;
- advertencias;
- botón **Confirmar y continuar**;
- botón **Corregir**;
- botón **Dejar pendiente** cuando sea permitido.

---

# 3. Journey detallado

## PASO 1 — Información General del Proyecto

### Objetivo

Crear la identidad administrativa del proyecto y establecer el contexto que afecta todos los cálculos y reportes.

### Pantalla: “Conozcamos el proyecto”

La pantalla combina una conversación inicial con un formulario simple. COS puede completar campos a partir de la descripción del usuario y pedir confirmación.

### ¿Qué pregunta COS?

- ¿Cuál es el nombre del proyecto?
- ¿Dónde se ejecutará: país, ciudad y ubicación?
- ¿Qué tipo de obra es: vivienda, edificio, infraestructura, remodelación, urbanización, obra industrial u otra?
- ¿Quién es el cliente o propietario?
- ¿Quién prepara el presupuesto?
- ¿Cuál es la fecha prevista de inicio y la duración estimada?
- ¿En qué moneda quieres presentar el presupuesto?
- ¿El presupuesto es preliminar, para licitación, para contratación, para control interno o para aprobación del cliente?

### ¿Qué explica COS?

> “Esta información define la portada, la moneda, las fechas de referencia, el lenguaje de los reportes y algunos controles de riesgo. Podrás cambiarla después sin perder tus partidas.”

COS explica también que la **versión** es una fotografía controlada del presupuesto en un momento determinado. No es una migración ni un concepto técnico que el usuario deba conocer: es simplemente “Presupuesto 1”, “Presupuesto 2”, etc.

### Campos obligatorios

- Nombre del proyecto.
- Tipo de obra.
- Ubicación general.
- Moneda.
- Fecha de referencia de precios o confirmación de que COS la propondrá.
- Propósito del presupuesto.
- Responsable del presupuesto.

### Campos opcionales

- Cliente y contactos.
- Dirección exacta.
- Número de contrato o licitación.
- Fecha de entrega de la oferta.
- Área construida o magnitud preliminar.
- Tasa de cambio de referencia.
- Código interno.

### ¿Qué valida?

- Que exista un nombre identificable.
- Que la moneda esté definida.
- Que la fecha de referencia no sea posterior a la fecha actual sin confirmación.
- Que las fechas del proyecto sean coherentes.
- Que el propósito sea compatible con el nivel de precisión declarado.
- Que no se creen dos proyectos accidentalmente con el mismo nombre, ubicación y cliente.

### Decisión automática

Si el usuario solo escribe una frase, COS extrae los datos reconocibles y responde:

> “Entendí: remodelación de una vivienda en Managua, para un cliente privado, con presupuesto preliminar. Me faltan la moneda y el responsable. ¿Es correcto?”

---

## PASO 2 — Alcance del Proyecto

### Objetivo

Definir qué se incluye, qué se excluye y qué supuestos delimitan el presupuesto.

### Pantalla: “Definamos el alcance”

COS ofrece un área de conversación, un selector de alcance por componentes y un bloque de inclusiones/exclusiones.

### ¿Qué información necesita?

- Descripción libre de la obra.
- Componentes o zonas: cimentaciones, estructura, arquitectura, instalaciones, exteriores, urbanización, equipos, puesta en marcha u otros.
- Cantidades conocidas: metros cuadrados, metros lineales, unidades, niveles, habitaciones, capacidad o longitud.
- Alcance contratado o esperado.
- Límites físicos y administrativos.
- Actividades que no forman parte del presupuesto.
- Criterios de calidad, normativas o especificaciones relevantes.
- Condiciones de acceso, horario, seguridad y operación del sitio.

### ¿Cómo la solicita?

COS permite responder de tres maneras:

1. Describir el alcance con palabras propias.
2. Seleccionar bloques sugeridos.
3. Cargar un alcance, términos de referencia o pliego.

Preguntas de seguimiento:

> “Mencionaste una vivienda de dos niveles. ¿Debo incluir instalaciones eléctricas, hidrosanitarias, acabados, exteriores y limpieza final?”

> “¿La demolición y el retiro de escombros forman parte de esta oferta?”

### Validaciones

- No puede emitirse un presupuesto sin una descripción de alcance.
- Cada componente debe quedar como **incluido**, **excluido** o **por confirmar**.
- Las cantidades preliminares deben indicar fuente o ser marcadas como estimadas.
- COS detecta contradicciones, por ejemplo: “obra llave en mano” con “no incluye instalaciones”.

### Resultado del paso

COS entrega un **Resumen de alcance** con inclusiones, exclusiones, supuestos, pendientes y preguntas abiertas para el cliente.

---

## PASO 3 — Documentación

### Objetivo

Convertir el expediente disponible en información utilizable, manteniendo la fuente y el nivel de confianza de cada dato.

### Pantalla: “Cargar y entender documentos”

El usuario puede arrastrar archivos, seleccionar una carpeta o continuar sin documentos.

### Documentos aceptados

- PDF: memorias, especificaciones, presupuestos previos, contratos, pliegos y cotizaciones.
- Excel: catálogos, cantidades, precios, presupuestos históricos y listas de recursos.
- Word: memorias descriptivas, alcances, informes y términos de referencia.
- Planos: PDF de planos, imágenes exportadas y archivos gráficos disponibles.
- Imágenes: fotografías del sitio, capturas de cotizaciones, croquis y evidencias.

### ¿Qué información extrae COS?

- Nombre y ubicación del proyecto.
- Alcance, inclusiones y exclusiones.
- Capítulos y posibles niveles WBS.
- Partidas, descripciones, códigos y unidades.
- Cantidades y mediciones.
- Materiales, especificaciones y marcas.
- Mano de obra, equipos y rendimientos mencionados.
- Precios, moneda, proveedor y fecha de cada fuente.
- Condiciones de pago, plazos y vigencia de cotizaciones.
- Riesgos, restricciones y datos contradictorios.

### Conversación posterior a la lectura

> “Encontré 8 capítulos, 46 posibles partidas, 3 cotizaciones y 2 cantidades que no coinciden entre documentos. Puedo incorporarlas como propuesta para que las revises. ¿Quieres revisar primero las diferencias?”

### Validaciones y controles

- Detectar archivos duplicados o versiones repetidas.
- Identificar documentos ilegibles, incompletos o sin fecha.
- Separar texto extraído de interpretación de COS.
- Marcar cada dato con fuente y confianza: alta, media o baja.
- No convertir una medición visual de un plano en cantidad definitiva sin confirmación.
- No usar un precio sin moneda o fecha como precio vigente.
- No mezclar cotizaciones de alcances diferentes.

### Decisiones automáticas

COS propone la fuente más confiable por dato, pero muestra alternativas y explica:

> “Usaré la cantidad del plano revisado el 12 de mayo porque coincide con la memoria. La hoja de Excel tiene una cantidad diferente y quedará como alerta.”

---

## PASO 4 — WBS: Estructura del Proyecto

### Objetivo

Organizar el presupuesto en una estructura que permita leerlo, calcularlo, revisarlo y reportarlo.

COS no empieza con la sigla WBS. Primero dice:

> “Voy a ordenar la obra en capítulos y subcapítulos. Esta estructura te permitirá ver el costo por sistema, zona o fase. En construcción suele llamarse WBS.”

### Pantalla: “Organicemos la obra”

Se muestra un árbol editable, un resumen de niveles y una conversación lateral de ayuda.

### Opciones

#### Manual

El usuario crea capítulos y subcapítulos. COS sugiere nombres, códigos y orden, pero nunca obliga a aceptar la propuesta.

#### IA

COS propone una estructura a partir del alcance y documentos:

- capítulos principales;
- subcapítulos;
- agrupación por sistema, zona o fase;
- relación entre partidas detectadas;
- pendientes de clasificación.

Mensaje de confirmación:

> “Propongo 10 capítulos porque el expediente separa estructura, arquitectura e instalaciones. ¿Prefieres organizarlo por especialidad o por zona del edificio?”

#### Importación

El usuario carga una estructura existente o pega una lista. COS normaliza códigos, detecta duplicados y solicita confirmación de cambios.

### ¿Cómo construye la estructura?

1. Lee el alcance y documentos.
2. Identifica agrupaciones naturales.
3. Propone una jerarquía legible.
4. Asigna códigos provisionales.
5. Señala partidas sin ubicación.
6. Solicita confirmación.
7. Guarda la estructura como parte de la versión activa.

### Validaciones

- No permitir códigos repetidos dentro de la misma estructura.
- No permitir una partida sin capítulo.
- Avisar si la estructura mezcla criterios sin explicación.
- Detectar capítulos vacíos.
- Mantener la trazabilidad de cambios entre versiones.

---

## PASO 5 — Partidas

### Objetivo

Convertir el alcance en unidades de trabajo medibles y valorizables.

### Pantalla: “Definamos las partidas”

Cada partida se presenta como una ficha con descripción, unidad, cantidad, origen, estado y costo asociado.

### ¿Cómo se crean?

- Desde la propuesta de COS.
- Manualmente por el usuario.
- Importadas desde Excel, Word o presupuesto previo.
- Deducidas de documentos y planos.
- Copiadas de un proyecto o versión anterior.
- Generadas al seleccionar un concepto de catálogo.

### Preguntas de COS

- ¿Qué trabajo representa esta partida?
- ¿Cuál es su unidad de medida?
- ¿Cuál es la cantidad?
- ¿La cantidad es medida, contratada, estimada o pendiente?
- ¿Debe incluir desperdicio?
- ¿Qué especificación o criterio de aceptación aplica?
- ¿Esta partida reemplaza, divide o complementa otra?

### ¿Cómo se validan?

- Descripción clara y no duplicada.
- Código único.
- Unidad compatible con la actividad.
- Cantidad mayor que cero, salvo partidas informativas.
- Consistencia entre unidad, cantidad y fuente.
- Señalamiento de cantidades estimadas.
- Detección de partidas que parecen incompletas, como “concreto” sin resistencia o elemento.
- Detección de solapes, por ejemplo, una partida de suministro y otra de suministro incluido dentro de un APU.

### Decisiones automáticas

COS puede dividir una partida amplia en componentes y pedir confirmación:

> “La partida ‘instalación eléctrica completa’ es demasiado amplia para auditarla. Propongo separarla en canalización, conductores, tableros, accesorios y pruebas. ¿La desgloso?”

---

## PASO 6 — APU: Análisis de Precio Unitario

### Objetivo

Explicar cuánto cuesta producir una unidad de cada partida y de qué recursos proviene el precio.

COS introduce el término así:

> “Para saber si el precio unitario es defendible, descompondremos cada partida en materiales, mano de obra, equipos, subcontratos y otros costos. Esta receta de costo se conoce como APU.”

### Pantalla: “Construyamos el costo unitario”

La vista muestra la partida, su unidad, rendimiento, recursos, precio unitario, fuentes y alertas.

### ¿Cuándo reutiliza COS un APU?

COS reutiliza un APU cuando:

- la partida coincide en descripción, unidad y especificación;
- la moneda y la fecha de referencia son compatibles;
- los recursos y rendimientos siguen vigentes;
- el proyecto tiene condiciones de ejecución similares;
- la fuente tiene un nivel de confianza suficiente.

### ¿Cuándo crea uno nuevo?

COS propone crear un APU nuevo cuando:

- cambia la unidad o la especificación;
- cambia significativamente el rendimiento;
- cambian las condiciones de acceso, altura, suelo o logística;
- el APU histórico está vencido o incompleto;
- la partida no tiene correspondencia confiable;
- el usuario requiere una metodología distinta.

### ¿Cómo explica la decisión?

> “Reutilicé el APU ‘Muro de bloque de 15 cm’ de la versión anterior porque coincide la unidad, la especificación y el rendimiento. Actualicé los materiales con precios vigentes. El costo de mano de obra quedó como referencia histórica porque no hay una tarifa nueva.”

O:

> “No reutilicé el APU anterior: la partida actual usa concreto de mayor resistencia y el rendimiento histórico no es comparable. Creé una propuesta nueva con confianza media para revisión.”

### Validaciones

- Recursos sin duplicidad.
- Rendimientos positivos y plausibles.
- Unidades compatibles.
- Suma de componentes consistente con el precio unitario.
- Separación clara entre costo directo, indirecto y margen.
- Identificación de recursos faltantes.
- Prohibición de presentar como definitivo un APU generado con baja confianza sin aprobación.

---

## PASO 7 — Materiales

### Objetivo

Seleccionar materiales y asignarles un costo defendible según proveedor, historial o cotización.

### Pantalla: “Costeemos los materiales”

Cada material muestra descripción normalizada, unidad de compra, unidad de consumo, conversión, proveedor, precio, fecha, moneda y fuente.

### ¿Cómo selecciona COS?

#### Proveedor

COS prioriza proveedores activos y compatibles con la ubicación, especificación, unidad, moneda y disponibilidad. Muestra alternativas, no una única respuesta oculta.

#### Precio histórico

Se usa cuando no existe cotización vigente o cuando el usuario quiere una referencia comparativa. COS ajusta el contexto temporal y etiqueta el precio como histórico.

#### Cotización

Se prioriza una cotización vigente que coincida con material, cantidad, condiciones de entrega y ubicación. COS distingue precio de lista, transporte, impuestos, descuentos y vigencia.

### Preguntas

- ¿Qué especificación exacta debe cumplir el material?
- ¿Se compra por unidad, saco, metro, tonelada o lote?
- ¿El precio incluye transporte e impuestos?
- ¿Qué proveedor prefieres o está aprobado?
- ¿Qué porcentaje de desperdicio aplica?
- ¿La cotización es válida para la fecha del presupuesto?

### Decisiones automáticas

COS puede recomendar:

1. cotización vigente coincidente;
2. precio del proveedor preferido;
3. promedio de precios comparables;
4. último precio histórico ajustado;
5. supuesto provisional, si no existe fuente.

Siempre explica la selección y muestra la diferencia frente a las alternativas.

### Validaciones

- No mezclar monedas sin una tasa explícita.
- No mezclar materiales equivalentes sin confirmar especificación.
- Detectar cotizaciones vencidas.
- Separar precio de compra y costo puesto en obra.
- Verificar conversión entre unidad de compra y unidad de consumo.
- Alertar ante variaciones importantes frente al histórico.

---

## PASO 8 — Equipos

### Objetivo

Calcular el costo de maquinaria, herramientas y equipos necesarios para ejecutar las partidas.

### Pantalla: “Planifiquemos los equipos”

COS pregunta por equipos propios, alquilados o subcontratados.

### ¿Qué solicita?

- Tipo y capacidad del equipo.
- Propio, alquilado o de un proveedor.
- Tarifa por hora, día, turno, viaje o unidad.
- Rendimiento esperado.
- Horas o días de uso.
- Operador incluido o separado.
- Combustible, movilización y mantenimiento.
- Tiempo mínimo de alquiler y disponibilidad.
- Condiciones de acceso y restricciones del sitio.

### ¿Qué calcula?

- horas o días requeridos;
- costo de utilización;
- combustible y consumibles;
- operador;
- transporte y movilización;
- espera o tiempo improductivo justificado;
- costo total del equipo por partida y por proyecto.

### Validaciones

- Capacidad del equipo compatible con la actividad.
- Rendimiento razonable para la cantidad.
- Evitar doble conteo del equipo dentro del APU y como costo independiente.
- Separar alquiler, depreciación o costo interno.
- Alertar si el tiempo calculado no coincide con el calendario de obra.

---

## PASO 9 — Subcontratos

### Objetivo

Incorporar trabajos ejecutados por terceros con alcance, precio y responsabilidades claras.

### Pantalla: “Revisemos los subcontratos”

### ¿Qué solicita?

- Especialidad o paquete de trabajo.
- Alcance incluido y excluido.
- Subcontratista o proveedor.
- Unidad y cantidad.
- Precio unitario o precio global.
- Moneda y fecha de la oferta.
- Vigencia.
- Plazo de ejecución.
- Forma de pago y retenciones.
- Garantías, seguros, permisos y responsabilidades.
- Si incluye materiales, equipos, mano de obra, transporte e impuestos.

### ¿Qué valida?

- Que el alcance no duplique partidas internas.
- Que el precio cubra la totalidad del paquete indicado.
- Que la cotización esté vigente o sea claramente histórica.
- Que existan condiciones comerciales mínimas.
- Que el subcontrato esté asignado a una partida o capítulo.
- Que los impuestos y retenciones no se cuenten dos veces.
- Que los riesgos de exclusiones queden visibles.

Mensaje de alerta:

> “La oferta de impermeabilización incluye materiales y mano de obra, pero excluye preparación de superficie y pruebas. COS la incorporará con esas exclusiones visibles.”

---

## PASO 10 — Otros Costos

### Objetivo

Registrar costos necesarios que no pertenecen directamente a materiales, mano de obra, equipos o subcontratos.

### Pantalla: “Completemos los costos del proyecto”

### Categorías incluidas

- Transporte y fletes.
- Movilización y desmovilización.
- Permisos, licencias y trámites.
- Estudios, ensayos y laboratorio.
- Seguridad, salud ocupacional y señalización.
- Instalaciones provisionales.
- Servicios temporales: agua, energía, internet y vigilancia.
- Seguros, fianzas y garantías.
- Herramientas menores y consumibles.
- Gestión de residuos y limpieza.
- Logística, almacenamiento y bodegas.
- Costos ambientales.
- Costos financieros o de financiamiento, si aplica.
- Gastos generales e indirectos.
- Contingencia y reserva de riesgo.
- Impuestos, tasas y retenciones.
- Otros costos definidos por el usuario.

### Preguntas de COS

- ¿Es un monto fijo, porcentaje, tarifa o costo por unidad?
- ¿A qué capítulo o al proyecto completo aplica?
- ¿Está incluido en otro costo?
- ¿Tiene una fuente o es una provisión?
- ¿Debe mostrarse al cliente o solo en el control interno?

### Validaciones

- No duplicar transporte, impuestos, indirectos o contingencia.
- Separar costos directos de indirectos.
- Mostrar supuestos porcentuales y su base de cálculo.
- Alertar si la contingencia es cero en un proyecto con riesgos identificados.

---

## PASO 11 — Presupuesto Maestro

### Objetivo

Consolidar todas las fuentes en una vista única, clara y auditable.

### Pantalla: “Presupuesto Maestro”

### ¿Qué visualiza?

- Total general.
- Total por capítulo y subcapítulo.
- Partidas con unidad, cantidad, costo unitario y total.
- Composición del costo por materiales, mano de obra, equipos, subcontratos y otros.
- Costos directos, indirectos, contingencia, impuestos y margen, según configuración.
- Moneda y tasa de cambio aplicada.
- Partidas sin precio o con baja confianza.
- Origen de cada importe.
- Comparación contra otra versión o presupuesto histórico.
- Estado de aprobación de cada capítulo.

### ¿Qué resumen muestra?

COS ofrece tres niveles:

#### Resumen rápido

Total, moneda, alcance, fecha de precios, avance y pendientes críticos.

#### Resumen de control

Subtotales por capítulo, composición del costo, variaciones, riesgos y supuestos.

#### Detalle auditable

Partida por partida, APU, recursos, fuentes, cotizaciones, responsables y cambios de versión.

Mensaje de transición:

> “El presupuesto está consolidado. El total actual es una propuesta en revisión porque hay 4 partidas con precio histórico, 2 cantidades estimadas y 1 cotización vencida.”

---

## PASO 12 — Revisión Inteligente

### Objetivo

Encontrar riesgos antes de emitir el presupuesto y ayudar al usuario a decidir qué corregir.

### Pantalla: “Revisión antes de emitir”

COS clasifica los hallazgos por severidad:

- **Bloqueante:** impide presentar el presupuesto como listo.
- **Alto:** puede afectar significativamente costo, alcance o credibilidad.
- **Medio:** requiere revisión profesional.
- **Informativo:** mejora la calidad, pero no impide avanzar.

### ¿Qué riesgos detecta?

- Partidas sin cantidad, unidad o precio.
- Precios sin fuente, moneda o fecha.
- Cotizaciones vencidas o con alcance ambiguo.
- Cantidades contradictorias entre documentos.
- Partidas duplicadas o con posible doble conteo.
- APU incompletos o con rendimientos atípicos.
- Materiales sin especificación suficiente.
- Equipos incompatibles con cantidades o calendario.
- Subcontratos con exclusiones no cubiertas.
- Costos indirectos o contingencia ausentes.
- Impuestos o tasas aplicados dos veces.
- Mezcla de monedas o tasas no confirmadas.
- Capítulos vacíos o partidas sin clasificación.
- Diferencias relevantes frente a versiones anteriores.
- Alcance incluido en documentos pero excluido en el presupuesto.
- Dependencias de permisos, acceso, clima o disponibilidad.
- Margen o precio de venta no configurado cuando el propósito lo requiere.

### ¿Qué alertas genera?

Cada alerta muestra:

- qué encontró;
- dónde lo encontró;
- por qué importa;
- impacto posible;
- recomendación;
- acción para corregir, aceptar o dejar como riesgo asumido.

Ejemplo:

> “Alerta alta: el acero representa 31% del costo directo y la única cotización tiene 20 días de vencida. Recomendación: solicitar actualización o aplicar una reserva de variación. Impacto potencial: pendiente de confirmar.”

### ¿Qué recomendaciones propone?

- pedir datos faltantes;
- comparar proveedor alternativo;
- actualizar cotización;
- separar una partida demasiado amplia;
- ajustar rendimiento;
- agregar contingencia por riesgo;
- revisar una exclusión;
- crear una nueva versión;
- emitir un reporte con supuestos explícitos.

COS nunca cambia un dato crítico sin confirmación. Puede aplicar correcciones simples solo si el usuario las autoriza.

---

## PASO 13 — Generación de Reportes

### Objetivo

Transformar el presupuesto en documentos adecuados para cada audiencia.

### Pantalla: “Generemos la entrega”

El usuario elige destinatario, propósito, nivel de detalle, moneda, versión y formato. COS recomienda un paquete según el escenario.

### Reportes disponibles

#### Excel

Para presupuestistas y control interno. Incluye resumen, capítulos, partidas, APU, materiales, equipos, subcontratos, otros costos, fuentes, supuestos, alertas y comparación de versiones.

#### Word

Para una memoria formal editable. Incluye portada, alcance, metodología, supuestos, resumen económico, exclusiones, riesgos y anexos seleccionados.

#### PDF

Para emisión controlada. Incluye versión, fecha, responsable, resumen, detalle seleccionado, notas y estado de aprobación.

#### Informe Ejecutivo

Para cliente, dirección o comité. Incluye objetivo, alcance, total, principales capítulos, variaciones, riesgos principales, supuestos, decisiones requeridas y recomendación de COS.

#### Informe Técnico

Para ingeniería y revisión especializada. Incluye estructura WBS, partidas, cantidades, APU, especificaciones, rendimientos, fuentes de precios, equipos, subcontratos, exclusiones y alertas técnicas.

### Control antes de generar

COS confirma:

- versión a emitir;
- moneda y fecha de precios;
- destinatario;
- nivel de confianza;
- pendientes visibles;
- tratamiento de datos confidenciales;
- nombre y estado del documento.

Mensaje final:

> “El paquete está listo como presupuesto en revisión. El Informe Ejecutivo ocultará el detalle técnico, mientras que el Excel conservará la trazabilidad completa. ¿Quieres emitir ambos con la misma versión?”

---

# 4. Inventario de pantallas

## Pantalla 1 — Inicio y proyectos

Muestra proyectos recientes, versiones, estado, total, pendientes y acciones para crear, continuar, duplicar o comparar.

## Pantalla 2 — Asistente de proyecto

Conduce los pasos 1 y 2. Muestra conversación, formulario contextual, avance y resumen de decisiones.

## Pantalla 3 — Centro documental

Permite cargar, clasificar, revisar extracción, ver fuentes y resolver contradicciones.

## Pantalla 4 — Estructura WBS

Muestra el árbol, niveles, capítulos, partidas sin clasificar, historial de cambios y opciones manual, IA o importación.

## Pantalla 5 — Partidas

Permite crear, editar, dividir, fusionar, asignar cantidad, unidad, fuente y estado de revisión.

## Pantalla 6 — APU

Muestra la receta del costo unitario, recursos, rendimientos, fuentes, comparación histórica y explicación de reutilización o creación.

## Pantalla 7 — Materiales y costos

Permite seleccionar proveedor, precio histórico o cotización, con comparación de alternativas y vigencia.

## Pantalla 8 — Equipos

Permite definir propiedad, alquiler, tarifa, rendimiento, horas, movilización y operador.

## Pantalla 9 — Subcontratos

Permite registrar paquetes, ofertas, alcance, exclusiones, vigencia y condiciones.

## Pantalla 10 — Otros costos

Permite registrar costos fijos, unitarios, porcentuales o provisiones.

## Pantalla 11 — Presupuesto Maestro

Consolida capítulos, partidas, costos, totales, composición, fuentes, versiones y estado.

## Pantalla 12 — Revisión Inteligente

Agrupa alertas por severidad, impacto, responsable y acción recomendada.

## Pantalla 13 — Reportes

Permite configurar destinatario, formato, detalle, versión, confidencialidad y emitir el paquete.

---

# 5. Flujo conversacional de referencia

## Conversación de inicio

**COS:** “Cuéntame qué obra necesitas presupuestar.”  
**Usuario:** “Una casa de dos plantas en Managua, incluyendo estructura y acabados.”  
**COS:** “Entendí una vivienda de dos niveles en Managua, con estructura y acabados. Para comenzar necesito confirmar cliente, moneda, fecha de precios y si incluyo instalaciones, exteriores y permisos.”

## Conversación ante falta de datos

**COS:** “No encontré cantidades definitivas. Puedo trabajar con estimaciones preliminares basadas en 240 m², pero el presupuesto tendrá confianza media. ¿Quieres continuar así o cargar planos?”

## Conversación ante una recomendación

**COS:** “Hay dos precios posibles para el concreto. La cotización del proveedor A está vigente y entrega en obra; el histórico del proveedor B es 8% menor pero tiene seis meses. Recomiendo A. ¿Confirmas?”

## Conversación ante una alerta

**COS:** “Detecté que transporte aparece dentro del precio del subcontrato y también como costo general. Para evitar doble conteo, propongo conservarlo en el subcontrato y retirar la línea general. ¿Aplico el ajuste?”

## Conversación de cierre

**COS:** “El presupuesto incluye 12 capítulos y 184 partidas. Total: moneda confirmada por el usuario. Quedan 3 alertas altas y 7 informativas. Puedo generar un paquete en revisión con esos riesgos visibles o ayudarte a resolverlos primero.”

---

# 6. Datos mínimos para generar un presupuesto

COS puede generar una primera versión preliminar cuando tiene:

- nombre del proyecto;
- tipo de obra;
- ubicación general;
- descripción del alcance;
- moneda;
- fecha de referencia de precios;
- responsable;
- al menos un capítulo o componente;
- al menos una partida con descripción, unidad, cantidad y costo, o autorización explícita para estimarla;
- propósito del presupuesto;
- inclusiones y exclusiones conocidas, aunque sean preliminares.

El resultado será un **Presupuesto Preliminar**, no un presupuesto listo para contratación. COS debe mostrar su nivel de confianza y sus pendientes.

---

# 7. Datos opcionales

Mejoran el resultado, pero no deben bloquear el avance:

- cliente;
- dirección exacta;
- planos;
- memoria descriptiva;
- especificaciones;
- presupuesto anterior;
- cotizaciones;
- proveedores preferidos;
- rendimientos propios;
- calendario;
- permisos;
- tasa de cambio;
- condiciones de pago;
- margen comercial;
- fotografías del sitio;
- riesgos conocidos;
- contactos y responsables por disciplina.

---

# 8. Datos ideales

Para un presupuesto profesional, COS recomienda contar con:

- expediente completo y fechado;
- planos coordinados y revisados;
- cantidades verificadas;
- alcance contractual;
- especificaciones técnicas;
- catálogo de materiales y proveedores;
- cotizaciones vigentes comparables;
- historial de precios;
- rendimientos y costos de mano de obra propios;
- tarifas de equipos;
- ofertas de subcontratistas con inclusiones y exclusiones;
- calendario y condiciones de sitio;
- impuestos, indirectos, contingencia y margen definidos;
- revisión técnica y administrativa;
- aprobación del responsable antes de emitir.

---

# 9. Reportes producidos según escenario

## Escenario A — Información mínima

COS produce un **Presupuesto Preliminar** en Excel y un **Informe Ejecutivo preliminar**. Ambos deben mostrar estimaciones, supuestos, baja confianza y datos faltantes.

## Escenario B — Alcance y documentos parciales

COS produce Excel con fuentes, Word de memoria de presupuesto, PDF preliminar e Informe Técnico con contradicciones y pendientes.

## Escenario C — Expediente completo y cotizaciones vigentes

COS produce Excel auditable, Word formal, PDF listo para revisión, Informe Ejecutivo e Informe Técnico.

## Escenario D — Presupuesto para licitación o contratación

COS produce paquete controlado por versión, PDF emitible, Word formal, Excel de respaldo, Informe Ejecutivo para aprobación y registro de exclusiones, supuestos, riesgos y condiciones comerciales.

## Escenario E — Control de cambios

COS produce comparativo entre versiones, resumen de variaciones, capítulos afectados, fuentes modificadas, impacto económico y recomendación de aprobación.

## Escenario F — Control de obra

COS produce presupuesto base, distribución por capítulos, costos comprometidos o previstos, alertas de desviación y resumen para administración.

---

# 10. Decisiones automáticas y límites de confianza

COS puede automatizar:

- extracción y normalización de datos;
- propuesta de WBS;
- detección de duplicados;
- asociación probable entre partidas y APU;
- selección comparativa de precios;
- conversión de unidades y monedas cuando la fuente esté confirmada;
- cálculo de subtotales y totales;
- identificación de riesgos;
- propuesta de reportes según audiencia.

COS debe pedir confirmación para:

- aceptar una cantidad crítica;
- elegir entre cotizaciones con diferencias relevantes;
- cambiar una especificación;
- eliminar o fusionar partidas;
- incluir o excluir un alcance;
- modificar impuestos, indirectos, contingencia o margen;
- emitir una versión como definitiva;
- sustituir un dato confirmado por una estimación.

La confianza global se calcula conceptualmente a partir de completitud, calidad de fuentes, vigencia de precios, consistencia de cantidades, cobertura de APU y resolución de alertas. COS siempre explica qué está reduciendo la confianza.

---

# 11. Reglas de versionamiento explicadas al usuario

COS evita palabras técnicas cuando no aportan valor. En lugar de iniciar con “crea una versión”, dice:

> “¿Quieres guardar este presupuesto como una nueva revisión para comparar los cambios sin alterar el anterior?”

Una nueva versión se recomienda cuando:

- cambia el alcance;
- cambia una cantidad aprobada;
- se actualizan precios de forma significativa;
- se presenta una oferta nueva;
- se cambia la estructura de capítulos;
- el cliente solicita una alternativa;
- se requiere conservar una fotografía aprobada.

COS nunca sobrescribe silenciosamente una versión emitida. Cada copia indica qué heredó, qué cambió y quién lo cambió.

---

# 12. Criterios de éxito de la experiencia

La experiencia ideal se considera completa cuando un usuario puede:

- iniciar desde una frase sin conocer WBS ni APU;
- cargar documentos heterogéneos y entender qué extrajo COS;
- aceptar, corregir o rechazar propuestas;
- saber de dónde viene cada costo;
- detectar faltantes y riesgos antes de emitir;
- comparar revisiones sin perder el presupuesto anterior;
- generar un reporte adecuado para cada audiencia;
- explicar el presupuesto a un cliente o equipo técnico;
- distinguir datos confirmados, históricos, estimados y pendientes;
- llegar a un presupuesto profesional sin depender de conocimiento previo del sistema.

La promesa de COS es que el usuario no tenga que aprender primero la herramienta para poder presupuestar. COS debe aprender el contexto de la obra, guiar las decisiones y hacer visible la evidencia detrás de cada número.

