import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Actividad, ConfiguracionLaboral } from '../types/budget';
import { calcularCronogramaCompleto, calcularSalarios, generarPlanillaNomina } from './calculator';

export async function exportarExcelPresupuesto(
  actividades: Actividad[],
  config: ConfiguracionLaboral,
  nombreProyecto: string = 'EBAR SUR 2'
) {
  const cronograma = calcularCronogramaCompleto(actividades, config);
  const salarios = calcularSalarios(config);
  const numSemanas = Math.max(3, cronograma.numSemanas);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Ingeniería y Costos de Construcción - Nicaragua 2026';
  workbook.created = new Date();

  // Corporate Colors
  const COLOR_PRIMARIO = 'FF1F497D';   // Navy
  const COLOR_HEADER_TEXT = 'FFFFFFFF';
  const COLOR_ZEBRA = 'FFF2F5F8';
  const COLOR_TOTAL = 'FFE9EDF4';
  const COLOR_BORDE = 'FF95B3D7';

  const borderThin: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: COLOR_BORDE } },
    bottom: { style: 'thin', color: { argb: COLOR_BORDE } },
    left: { style: 'thin', color: { argb: COLOR_BORDE } },
    right: { style: 'thin', color: { argb: COLOR_BORDE } },
  };

  const borderTotal: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FF1F497D' } },
    bottom: { style: 'double', color: { argb: 'FF1F497D' } },
    left: { style: 'thin', color: { argb: COLOR_BORDE } },
    right: { style: 'thin', color: { argb: COLOR_BORDE } },
  };

  const FORMATO_MONEDA = '"C$" #,##0.00';
  const FORMATO_NUMERICO = '#,##0.00';
  const FORMATO_ENTERO = '#,##0';

  // =========================================================================
  // HOJA 1: "Presupuesto MO"
  // =========================================================================
  const ws1 = workbook.addWorksheet('Presupuesto MO', {
    views: [{ showGridLines: true }],
  });

  // Título y Membrete
  ws1.mergeCells('A1:F1');
  const cellA1 = ws1.getCell('A1');
  cellA1.value = 'PRESUPUESTO EJECUTIVO DE MANO DE OBRA';
  cellA1.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1F497D' } };
  cellA1.alignment = { vertical: 'middle' };

  ws1.mergeCells('A2:F2');
  const cellA2 = ws1.getCell('A2');
  cellA2.value = `PROYECTO: ${nombreProyecto.toUpperCase()} | NORMATIVA MITRAB/INSS NICARAGUA 2026`;
  cellA2.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF595959' } };
  cellA2.alignment = { vertical: 'middle' };

  // Fila Encabezados
  const headersWs1 = ['ITEM', 'DESCRIPCION', 'U/M', 'CANTIDAD', 'COSTO UNITARIO', 'COSTO TOTAL'];
  const rowH1 = ws1.getRow(4);
  rowH1.height = 26;
  headersWs1.forEach((hText, idx) => {
    const c = rowH1.getCell(idx + 1);
    c.value = hText;
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLOR_HEADER_TEXT } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARIO } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = borderThin;
  });

  const startRowWs1 = 5;
  let currRow1 = startRowWs1;

  for (let idx = 0; idx < cronograma.matriz.length; idx++) {
    const item = cronograma.matriz[idx];
    const act = item.actividad;
    const row = ws1.getRow(currRow1);
    row.height = 20;
    const rowWs2 = 6 + idx; // Fila correspondiente en Hoja 2

    const cItem = row.getCell(1);
    cItem.value = act.item;
    cItem.alignment = { horizontal: 'center', vertical: 'middle' };

    const cDesc = row.getCell(2);
    cDesc.value = act.descripcion;
    cDesc.alignment = { horizontal: 'left', vertical: 'middle' };

    const cUm = row.getCell(3);
    cUm.value = act.unidadMedida;
    cUm.alignment = { horizontal: 'center', vertical: 'middle' };

    const cCant = row.getCell(4);
    cCant.value = act.cantidad;
    cCant.alignment = { horizontal: 'right', vertical: 'middle' };
    cCant.numFmt = FORMATO_NUMERICO;

    // REQUISITO 3: FÓRMULA NATIVA QUE APUNTA A 'Memoria y Flujo Semanal'
    // En ws2: Col J es COSTO DIARIO, Col H es REND TOTAL. CU = J / H
    const cCu = row.getCell(5);
    cCu.value = {
      formula: `'Memoria y Flujo Semanal'!J${rowWs2}/'Memoria y Flujo Semanal'!H${rowWs2}`,
      result: item.costoUnitario,
    };
    cCu.alignment = { horizontal: 'right', vertical: 'middle' };
    cCu.numFmt = FORMATO_MONEDA;

    // FÓRMULA NATIVA =CANTIDAD*COSTO_UNITARIO
    const cTot = row.getCell(6);
    cTot.value = { formula: `D${currRow1}*E${currRow1}`, result: act.cantidad * item.costoUnitario };
    cTot.alignment = { horizontal: 'right', vertical: 'middle' };
    cTot.numFmt = FORMATO_MONEDA;

    const isEven = currRow1 % 2 === 0;
    for (let col = 1; col <= 6; col++) {
      const cell = row.getCell(col);
      cell.font = { name: 'Calibri', size: 9 };
      cell.border = borderThin;
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ZEBRA } };
      }
    }

    currRow1++;
  }

  const endRowWs1 = currRow1 - 1;

  // Fila Total
  const rowTot1 = ws1.getRow(currRow1);
  rowTot1.height = 24;
  ws1.mergeCells(`A${currRow1}:E${currRow1}`);
  const lblTot = rowTot1.getCell(1);
  lblTot.value = 'TOTALES:';
  lblTot.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F497D' } };
  lblTot.alignment = { horizontal: 'right', vertical: 'middle' };

  for (let c = 1; c <= 5; c++) {
    const cell = rowTot1.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
    cell.border = borderTotal;
  }

  // FÓRMULA NATIVA =SUM(F5:F...)
  const cSum = rowTot1.getCell(6);
  cSum.value = { formula: `SUM(F${startRowWs1}:F${endRowWs1})`, result: cronograma.costoTotalProyecto };
  cSum.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F497D' } };
  cSum.alignment = { horizontal: 'right', vertical: 'middle' };
  cSum.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
  cSum.border = borderTotal;
  cSum.numFmt = FORMATO_MONEDA;

  // Nota de campo: 2 filas vacías después del total
  const notaRow1 = currRow1 + 3;
  ws1.mergeCells(`A${notaRow1}:F${notaRow1}`);
  const cNota = ws1.getCell(`A${notaRow1}`);
  cNota.value = 'nota: poner a dispocision maquina para excavar y manipular materiales pesados.';
  cNota.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF333333' } };
  cNota.alignment = { horizontal: 'left', vertical: 'middle' };

  ws1.columns = [
    { width: 8 },
    { width: 55 },
    { width: 10 },
    { width: 14 },
    { width: 18 },
    { width: 20 },
  ];

  // =========================================================================
  // HOJA 2: "Memoria y Flujo Semanal"
  // =========================================================================
  const ws2 = workbook.addWorksheet('Memoria y Flujo Semanal', {
    views: [{ showGridLines: true }],
  });

  // Título
  ws2.mergeCells('A1:N1');
  const cA1_2 = ws2.getCell('A1');
  cA1_2.value = 'MEMORIA TÉCNICA DE MANO DE OBRA Y FLUJO DE CAJA SEMANAL';
  cA1_2.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1F497D' } };
  cA1_2.alignment = { vertical: 'middle' };

  ws2.mergeCells('A2:N2');
  const cA2_2 = ws2.getCell('A2');
  cA2_2.value = `PROYECTO: ${nombreProyecto.toUpperCase()} | SUCESIÓN FIN-INICIO | SEMANAS DE 6 DÍAS LABORABLES | FSR = ${cronograma.fsrMultiplicador.toFixed(4)}`;
  cA2_2.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF595959' } };
  cA2_2.alignment = { vertical: 'middle' };

  // Encabezados
  const headersWs2Fixed = [
    'ITEM',
    'DESCRIPCIÓN',
    'U/M',
    'CANTIDAD',
    'REND BASE',
    'CANT OFI',
    'CANT AYU',
    'REND TOTAL',
    'DÍAS REQ',
    'COSTO DIARIO',
  ];
  const headersWs2Weeks = Array.from({ length: numSemanas }, (_, i) => `PAGO SEMANA ${i + 1}`);
  const allHeadersWs2 = [...headersWs2Fixed, ...headersWs2Weeks];

  const rowH2 = ws2.getRow(5);
  rowH2.height = 26;
  allHeadersWs2.forEach((hText, idx) => {
    const c = rowH2.getCell(idx + 1);
    c.value = hText;
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLOR_HEADER_TEXT } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARIO } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = borderThin;
  });

  const startRowWs2 = 6;
  let currRow2 = startRowWs2;

  for (let idx = 0; idx < cronograma.matriz.length; idx++) {
    const item = cronograma.matriz[idx];
    const act = item.actividad;
    const row = ws2.getRow(currRow2);
    row.height = 20;
    const rowWs1 = 5 + idx;

    row.getCell(1).value = act.item;
    row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    row.getCell(2).value = act.descripcion;
    row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };

    row.getCell(3).value = act.unidadMedida;
    row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };

    // Cantidad vinculada a la hoja principal
    const cCant = row.getCell(4);
    cCant.value = { formula: `'Presupuesto MO'!D${rowWs1}`, result: act.cantidad };
    cCant.alignment = { horizontal: 'right', vertical: 'middle' };
    cCant.numFmt = FORMATO_NUMERICO;

    const cRbase = row.getCell(5);
    cRbase.value = act.rendimientoBaseOficial;
    cRbase.alignment = { horizontal: 'right', vertical: 'middle' };
    cRbase.numFmt = FORMATO_NUMERICO;

    const cOfi = row.getCell(6);
    cOfi.value = act.cantOficiales;
    cOfi.alignment = { horizontal: 'center', vertical: 'middle' };
    cOfi.numFmt = FORMATO_ENTERO;

    const cAyu = row.getCell(7);
    cAyu.value = act.cantAyudantes;
    cAyu.alignment = { horizontal: 'center', vertical: 'middle' };
    cAyu.numFmt = FORMATO_ENTERO;

    // FÓRMULA NATIVA =E6*F6 (REND TOTAL = REND_BASE * CANT_OFI)
    const cRtot = row.getCell(8);
    cRtot.value = { formula: `E${currRow2}*F${currRow2}`, result: item.rendimientoTotal };
    cRtot.alignment = { horizontal: 'right', vertical: 'middle' };
    cRtot.numFmt = FORMATO_NUMERICO;

    // FÓRMULA NATIVA =D6/H6 (DÍAS REQ = CANTIDAD / REND_TOTAL)
    const cDias = row.getCell(9);
    cDias.value = { formula: `D${currRow2}/H${currRow2}`, result: item.diasRequeridos };
    cDias.alignment = { horizontal: 'right', vertical: 'middle' };
    cDias.numFmt = FORMATO_NUMERICO;

    // FÓRMULA COSTO DIARIO: =(F{row}*Tarifa_Ofi)+(G{row}*Tarifa_Ayu)
    const cCdia = row.getCell(10);
    cCdia.value = {
      formula: `(F${currRow2}*${salarios.costoRealDiarioOficial.toFixed(4)})+(G${currRow2}*${salarios.costoRealDiarioAyudante.toFixed(4)})`,
      result: item.costoDiario,
    };
    cCdia.alignment = { horizontal: 'right', vertical: 'middle' };
    cCdia.numFmt = FORMATO_MONEDA;

    // Semanas
    for (let w = 0; w < numSemanas; w++) {
      const cPago = row.getCell(11 + w);
      const val = item.pagosSemanales[w] || 0;
      cPago.value = val;
      cPago.alignment = { horizontal: 'right', vertical: 'middle' };
      cPago.numFmt = FORMATO_MONEDA;
    }

    const isEven = currRow2 % 2 === 0;
    for (let col = 1; col <= 10 + numSemanas; col++) {
      const cell = row.getCell(col);
      cell.font = { name: 'Calibri', size: 9 };
      cell.border = borderThin;
      if (isEven) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ZEBRA } };
      }
    }

    currRow2++;
  }

  const endRowWs2 = currRow2 - 1;

  // Fila Total Memoria
  const rowTot2 = ws2.getRow(currRow2);
  rowTot2.height = 24;
  ws2.mergeCells(`A${currRow2}:C${currRow2}`);
  const lblTot2 = rowTot2.getCell(1);
  lblTot2.value = 'TOTALES:';
  lblTot2.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F497D' } };
  lblTot2.alignment = { horizontal: 'right', vertical: 'middle' };

  for (let c = 1; c <= 3; c++) {
    const cell = rowTot2.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
    cell.border = borderTotal;
  }

  // Col 4: Suma Cantidades =SUM(D6:D...)
  const cSumCant = rowTot2.getCell(4);
  const totalCantidad = cronograma.matriz.reduce((acc, m) => acc + m.actividad.cantidad, 0);
  cSumCant.value = { formula: `SUM(D${startRowWs2}:D${endRowWs2})`, result: totalCantidad };
  cSumCant.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F497D' } };
  cSumCant.alignment = { horizontal: 'right', vertical: 'middle' };
  cSumCant.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
  cSumCant.border = borderTotal;
  cSumCant.numFmt = FORMATO_NUMERICO;

  // Cols 5 a 8 con guion
  for (let c = 5; c <= 8; c++) {
    const cellDash = rowTot2.getCell(c);
    cellDash.value = '-';
    cellDash.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F497D' } };
    cellDash.alignment = { horizontal: 'center', vertical: 'middle' };
    cellDash.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
    cellDash.border = borderTotal;
  }

  // FÓRMULA Días =SUM(I6:I...)
  const cSumDias = rowTot2.getCell(9);
  cSumDias.value = { formula: `SUM(I${startRowWs2}:I${endRowWs2})`, result: cronograma.totalDias };
  cSumDias.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F497D' } };
  cSumDias.alignment = { horizontal: 'right', vertical: 'middle' };
  cSumDias.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
  cSumDias.border = borderTotal;
  cSumDias.numFmt = FORMATO_NUMERICO;

  // Columna 10: Suma de Costos Diarios =SUM(J6:J...)
  const c10 = rowTot2.getCell(10);
  const totalCostoDiario = cronograma.matriz.reduce((acc, m) => acc + m.costoDiario, 0);
  c10.value = { formula: `SUM(J${startRowWs2}:J${endRowWs2})`, result: totalCostoDiario };
  c10.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F497D' } };
  c10.alignment = { horizontal: 'right', vertical: 'middle' };
  c10.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
  c10.border = borderTotal;
  c10.numFmt = FORMATO_MONEDA;

  // Semanas =SUM(K6:K...)
  for (let w = 0; w < numSemanas; w++) {
    const colNumber = 11 + w;
    const colLetter = String.fromCharCode(65 + colNumber - 1);
    const cellSem = rowTot2.getCell(colNumber);
    cellSem.value = {
      formula: `SUM(${colLetter}${startRowWs2}:${colLetter}${endRowWs2})`,
      result: cronograma.totalesPorSemana[w],
    };
    cellSem.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F497D' } };
    cellSem.alignment = { horizontal: 'right', vertical: 'middle' };
    cellSem.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
    cellSem.border = borderTotal;
    cellSem.numFmt = FORMATO_MONEDA;
  }

  const colWidths = [
    { width: 8 },
    { width: 50 },
    { width: 9 },
    { width: 12 },
    { width: 12 },
    { width: 10 },
    { width: 10 },
    { width: 13 },
    { width: 12 },
    { width: 15 },
  ];
  for (let w = 0; w < numSemanas; w++) {
    colWidths.push({ width: 16 });
  }
  ws2.columns = colWidths;

  // =========================================================================
  // HOJA 3: "Cronograma Gráfico" (Diagrama de Gantt Visual Fin-Inicio)
  // =========================================================================
  const ws3 = workbook.addWorksheet('Cronograma Gráfico', {
    views: [{ showGridLines: true }],
  });

  const COLOR_GANTT_BAR = 'FFD9E1F2'; // Azul claro suave corporativo
  const fillGanttBar: ExcelJS.Fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLOR_GANTT_BAR },
  };

  // Título
  ws3.mergeCells('A1:G1');
  const cA1_3 = ws3.getCell('A1');
  cA1_3.value = 'DIAGRAMA DE GANTT - CRONOGRAMA DE EJECUCIÓN (FIN-INICIO)';
  cA1_3.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1F497D' } };
  cA1_3.alignment = { vertical: 'middle' };

  ws3.mergeCells('A2:G2');
  const cA2_3 = ws3.getCell('A2');
  cA2_3.value = `PROYECTO: ${nombreProyecto.toUpperCase()} | SECUENCIA SECUENCIAL FIN-INICIO | JORNADAS DE 6 DÍAS LABORABLES`;
  cA2_3.font = { name: 'Calibri', size: 9.5, italic: true, color: { argb: 'FF595959' } };
  cA2_3.alignment = { vertical: 'middle' };

  // Fila Encabezados (Fila 4)
  const headersWs3Fixed = ['ITEM', 'DESCRIPCIÓN', 'DÍAS REQUERIDOS'];
  const headersWs3Weeks = Array.from({ length: numSemanas }, (_, i) => `SEMANA ${i + 1}`);
  const allHeadersWs3 = [...headersWs3Fixed, ...headersWs3Weeks];

  const rowH3 = ws3.getRow(4);
  rowH3.height = 26;
  allHeadersWs3.forEach((hText, idx) => {
    const c = rowH3.getCell(idx + 1);
    c.value = hText;
    c.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLOR_HEADER_TEXT } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARIO } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = borderThin;
  });

  const startRowWs3 = 5;
  let currRow3 = startRowWs3;

  for (let idx = 0; idx < cronograma.matriz.length; idx++) {
    const item = cronograma.matriz[idx];
    const act = item.actividad;
    const row = ws3.getRow(currRow3);
    row.height = 22;
    const rowWs2 = 6 + idx; // Fila en Memoria y Flujo Semanal

    // Col A: ITEM
    const cItem = row.getCell(1);
    cItem.value = act.item;
    cItem.alignment = { horizontal: 'center', vertical: 'middle' };

    // Col B: DESCRIPCIÓN
    const cDesc = row.getCell(2);
    cDesc.value = act.descripcion;
    cDesc.alignment = { horizontal: 'left', vertical: 'middle' };

    // Col C: DÍAS REQUERIDOS vinculados con fórmula
    const cDias = row.getCell(3);
    cDias.value = { formula: `'Memoria y Flujo Semanal'!I${rowWs2}`, result: item.diasRequeridos };
    cDias.alignment = { horizontal: 'right', vertical: 'middle' };
    cDias.numFmt = FORMATO_NUMERICO;

    for (let c = 1; c <= 3; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Calibri', size: 9 };
      cell.border = borderThin;
    }

    // Semanas activas Fin-Inicio
    const dIni = item.diaInicio;
    const dFin = item.diaFin;

    for (let w = 0; w < numSemanas; w++) {
      const wIni = w * config.diasSemanaLaboral;
      const wFin = (w + 1) * config.diasSemanaLaboral;
      const diasEnSem = Math.max(0, Math.min(dFin, wFin) - Math.max(dIni, wIni));

      const cellGantt = row.getCell(4 + w);
      cellGantt.border = borderThin;
      cellGantt.alignment = { horizontal: 'center', vertical: 'middle' };

      if (diasEnSem > 0.0001) {
        cellGantt.fill = fillGanttBar;
        cellGantt.value = 'ACTIVA';
        cellGantt.font = { name: 'Calibri', size: 8.5, bold: true, color: { argb: 'FF1F497D' } };
      } else {
        cellGantt.value = '-';
        cellGantt.font = { name: 'Calibri', size: 9, color: { argb: 'FF8C8C8C' } };
      }
    }

    currRow3++;
  }

  const endRowWs3 = currRow3 - 1;

  // Fila Total en Cronograma Gráfico
  const rowTot3 = ws3.getRow(currRow3);
  rowTot3.height = 24;
  ws3.mergeCells(`A${currRow3}:B${currRow3}`);
  const lblTot3 = rowTot3.getCell(1);
  lblTot3.value = 'TOTALES (DÍAS DE EJECUCIÓN):';
  lblTot3.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F497D' } };
  lblTot3.alignment = { horizontal: 'right', vertical: 'middle' };

  for (let c = 1; c <= 2; c++) {
    const cell = rowTot3.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
    cell.border = borderTotal;
  }

  // Col 3: Días Requeridos Totales formulado =SUM(C5:C...)
  const cSumDiasGantt = rowTot3.getCell(3);
  cSumDiasGantt.value = { formula: `SUM(C${startRowWs3}:C${endRowWs3})`, result: cronograma.totalDias };
  cSumDiasGantt.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F497D' } };
  cSumDiasGantt.alignment = { horizontal: 'right', vertical: 'middle' };
  cSumDiasGantt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
  cSumDiasGantt.border = borderTotal;
  cSumDiasGantt.numFmt = FORMATO_NUMERICO;

  // Semanas: total de días laborables activos en cada semana
  for (let w = 0; w < numSemanas; w++) {
    const wIni = w * config.diasSemanaLaboral;
    const wFin = (w + 1) * config.diasSemanaLaboral;
    const diasTotalesSemW = cronograma.matriz.reduce((acc, m) => {
      return acc + Math.max(0, Math.min(m.diaFin, wFin) - Math.max(m.diaInicio, wIni));
    }, 0);

    const cellSemGantt = rowTot3.getCell(4 + w);
    cellSemGantt.value = Number(diasTotalesSemW.toFixed(2));
    cellSemGantt.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1F497D' } };
    cellSemGantt.alignment = { horizontal: 'center', vertical: 'middle' };
    cellSemGantt.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
    cellSemGantt.border = borderTotal;
    cellSemGantt.numFmt = '0.00" d"';
  }

  // Ancho de columnas ws3: estándar angosto (width 12) para semanas
  const colWidthsWs3 = [
    { width: 8 },
    { width: 50 },
    { width: 16 },
  ];
  for (let w = 0; w < numSemanas; w++) {
    colWidthsWs3.push({ width: 12 });
  }
  ws3.columns = colWidthsWs3;

  // =========================================================================
  // HOJA 4: "Planilla y Nómina Real"
  // =========================================================================
  const ws4 = workbook.addWorksheet('Planilla y Nómina Real', {
    views: [{ showGridLines: true }],
  });

  const nomina = generarPlanillaNomina(actividades, config);

  // Título
  ws4.mergeCells('A1:L1');
  const cA1_4 = ws4.getCell('A1');
  cA1_4.value = 'PLANILLA Y NÓMINA REAL CONSOLIDADA DE MANO DE OBRA';
  cA1_4.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF1F497D' } };
  cA1_4.alignment = { vertical: 'middle' };

  ws4.mergeCells('A2:L2');
  const cA2_4 = ws4.getCell('A2');
  cA2_4.value = `PROYECTO: ${nombreProyecto.toUpperCase()} | NORMATIVA MITRAB / INSS / DGI (NICARAGUA 2026)`;
  cA2_4.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: 'FF595959' } };
  cA2_4.alignment = { vertical: 'middle' };

  ws4.mergeCells('A3:L3');
  const cA3_4 = ws4.getCell('A3');
  cA3_4.value = `Deducciones: INSS Laboral (7.0%), IR Retenido (Tabla Progresiva Ley 822) | Cargas Patronales y Provisiones de Ley: FSR = ${salarios.fsrMultiplicador.toFixed(4)} (INSS Patronal 22.5%, INATEC 2%, Aguinaldo 8.33%, Vacaciones 8.33%, Indemnización 4.16%)`;
  cA3_4.font = { name: 'Segoe UI', size: 8.5, color: { argb: 'FF404040' } };
  cA3_4.alignment = { vertical: 'middle' };

  // Fila Encabezados en Fila 5
  const headersWs4 = [
    'Código Colaborador',
    'Rol / Tarea Asignada',
    'Días Laborados',
    'Salario Diario (C$)',
    'Salario Bruto (C$)',
    'INSS Laboral (7%)',
    'IR Retenido (C$)',
    'Total Deducciones (C$)',
    'Salario Neto Recibir (C$)',
    'INSS Patronal (22.5%)',
    'INATEC (2%)',
    'Costo Total Patronal (C$)',
  ];

  const rowH4 = ws4.getRow(5);
  rowH4.height = 28;
  headersWs4.forEach((hText, idx) => {
    const c = rowH4.getCell(idx + 1);
    c.value = hText;
    c.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: COLOR_HEADER_TEXT } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_PRIMARIO } };
    c.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    c.border = borderThin;
  });

  const startRowWs4 = 6;
  let currRow4 = startRowWs4;

  for (let idx = 0; idx < nomina.length; idx++) {
    const colab = nomina[idx];
    const row = ws4.getRow(currRow4);
    row.height = 20;

    // Col 1: Código
    const cCod = row.getCell(1);
    cCod.value = colab.codigo;
    cCod.alignment = { horizontal: 'center', vertical: 'middle' };

    // Col 2: Rol
    const cRol = row.getCell(2);
    cRol.value = colab.rol;
    cRol.alignment = { horizontal: 'left', vertical: 'middle' };

    // Col 3: Días Laborados
    const cDias = row.getCell(3);
    cDias.value = colab.diasLaborados;
    cDias.alignment = { horizontal: 'right', vertical: 'middle' };
    cDias.numFmt = FORMATO_NUMERICO;

    // Col 4: Salario Diario
    const cSd = row.getCell(4);
    cSd.value = colab.salarioDiario;
    cSd.alignment = { horizontal: 'right', vertical: 'middle' };
    cSd.numFmt = '#,##0.00';

    // Col 5: Salario Bruto =C{r}*D{r}
    const cSb = row.getCell(5);
    cSb.value = { formula: `C${currRow4}*D${currRow4}`, result: colab.salarioBruto };
    cSb.alignment = { horizontal: 'right', vertical: 'middle' };
    cSb.numFmt = '#,##0.00';

    // Col 6: INSS Laboral =E{r}*0.07
    const cInssLab = row.getCell(6);
    cInssLab.value = { formula: `E${currRow4}*0.07`, result: colab.inssLaboral };
    cInssLab.alignment = { horizontal: 'right', vertical: 'middle' };
    cInssLab.numFmt = '#,##0.00';

    // Col 7: IR Retenido
    const cIr = row.getCell(7);
    cIr.value = colab.irRetenido;
    cIr.alignment = { horizontal: 'right', vertical: 'middle' };
    cIr.numFmt = '#,##0.00';

    // Col 8: Total Deducciones =F{r}+G{r}
    const cTotDed = row.getCell(8);
    cTotDed.value = { formula: `F${currRow4}+G${currRow4}`, result: colab.totalDeducciones };
    cTotDed.alignment = { horizontal: 'right', vertical: 'middle' };
    cTotDed.numFmt = '#,##0.00';

    // Col 9: Salario Neto =E{r}-H{r}
    const cNeto = row.getCell(9);
    cNeto.value = { formula: `E${currRow4}-H${currRow4}`, result: colab.salarioNeto };
    cNeto.alignment = { horizontal: 'right', vertical: 'middle' };
    cNeto.numFmt = '#,##0.00';

    // Col 10: INSS Patronal =E{r}*0.225
    const cInssPat = row.getCell(10);
    cInssPat.value = { formula: `E${currRow4}*0.225`, result: colab.inssPatronal };
    cInssPat.alignment = { horizontal: 'right', vertical: 'middle' };
    cInssPat.numFmt = '#,##0.00';

    // Col 11: INATEC =E{r}*0.02
    const cInatec = row.getCell(11);
    cInatec.value = { formula: `E${currRow4}*0.02`, result: colab.inatec };
    cInatec.alignment = { horizontal: 'right', vertical: 'middle' };
    cInatec.numFmt = '#,##0.00';

    // Col 12: Costo Total Patronal con FSR =E{r}*FSR
    const cCostoPat = row.getCell(12);
    cCostoPat.value = {
      formula: `E${currRow4}*${salarios.fsrMultiplicador.toFixed(4)}`,
      result: colab.costoTotalPatronal,
    };
    cCostoPat.alignment = { horizontal: 'right', vertical: 'middle' };
    cCostoPat.numFmt = '#,##0.00';

    for (let c = 1; c <= 12; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Segoe UI', size: 9.5 };
      cell.border = borderThin;
      if (currRow4 % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ZEBRA } };
      }
    }

    currRow4++;
  }

  const endRowWs4 = currRow4 - 1;

  // Fila TOTALES en Hoja 4
  const rowTot4 = ws4.getRow(currRow4);
  rowTot4.height = 24;
  ws4.mergeCells(`A${currRow4}:B${currRow4}`);
  const lblTot4 = rowTot4.getCell(1);
  lblTot4.value = 'TOTALES:';
  lblTot4.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1F497D' } };
  lblTot4.alignment = { horizontal: 'right', vertical: 'middle' };

  for (let c = 1; c <= 2; c++) {
    const cell = rowTot4.getCell(c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
    cell.border = borderTotal;
  }

  // Días laborados =SUM(C6:C...)
  const cTotDiasNom = rowTot4.getCell(3);
  const totalDiasNom = nomina.reduce((acc, c) => acc + c.diasLaborados, 0);
  cTotDiasNom.value = { formula: `SUM(C${startRowWs4}:C${endRowWs4})`, result: totalDiasNom };
  cTotDiasNom.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1F497D' } };
  cTotDiasNom.alignment = { horizontal: 'right', vertical: 'middle' };
  cTotDiasNom.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
  cTotDiasNom.border = borderTotal;
  cTotDiasNom.numFmt = FORMATO_NUMERICO;

  // Col 4: Guion
  const cDash4 = rowTot4.getCell(4);
  cDash4.value = '-';
  cDash4.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1F497D' } };
  cDash4.alignment = { horizontal: 'center', vertical: 'middle' };
  cDash4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
  cDash4.border = borderTotal;

  // Columnas 5 a 12 con =SUM(...)
  const colsSumNom: Array<[number, string, number]> = [
    [5, 'E', nomina.reduce((acc, c) => acc + c.salarioBruto, 0)],
    [6, 'F', nomina.reduce((acc, c) => acc + c.inssLaboral, 0)],
    [7, 'G', nomina.reduce((acc, c) => acc + c.irRetenido, 0)],
    [8, 'H', nomina.reduce((acc, c) => acc + c.totalDeducciones, 0)],
    [9, 'I', nomina.reduce((acc, c) => acc + c.salarioNeto, 0)],
    [10, 'J', nomina.reduce((acc, c) => acc + c.inssPatronal, 0)],
    [11, 'K', nomina.reduce((acc, c) => acc + c.inatec, 0)],
    [12, 'L', nomina.reduce((acc, c) => acc + c.costoTotalPatronal, 0)],
  ];

  for (const [colNum, colLet, sumResult] of colsSumNom) {
    const cSumNom = rowTot4.getCell(colNum);
    cSumNom.value = { formula: `SUM(${colLet}${startRowWs4}:${colLet}${endRowWs4})`, result: sumResult };
    cSumNom.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF1F497D' } };
    cSumNom.alignment = { horizontal: 'right', vertical: 'middle' };
    cSumNom.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_TOTAL } };
    cSumNom.border = borderTotal;
    cSumNom.numFmt = '#,##0.00';
  }

  ws4.columns = [
    { width: 18 },
    { width: 62 },
    { width: 16 },
    { width: 18 },
    { width: 18 },
    { width: 18 },
    { width: 16 },
    { width: 20 },
    { width: 22 },
    { width: 20 },
    { width: 16 },
    { width: 24 },
  ];

  // Descarga del buffer como archivo .xlsx
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, `Presupuesto_MO_${nombreProyecto.replace(/\s+/g, '_')}_Nicaragua_2026.xlsx`);
}
