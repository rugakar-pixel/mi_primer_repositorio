import { ConfiguracionLaboral, Actividad, CronogramaCalculado, DetalleCronogramaActividad, ColaboradorNomina } from '../types/budget';

export const CONFIG_NICARAGUA_2026_DEFAULT: ConfiguracionLaboral = {
  salarioMinimoMensual: 13848.23,
  diasMesComercial: 26,
  horasJornadaDiaria: 8,
  horasSemanaMax: 48,
  diasSemanaLaboral: 6,
  factorOficial: 1.50,
  pctAguinaldo: 0.0833,
  pctVacaciones: 0.0833,
  pctInssPatronal: 0.2250,
  pctInatec: 0.0200,
  pctIndemnizacion: 0.0416,
  pctInssLaboral: 0.0700,
};

export const ITEMS_EBAR_SUR_2_DEFAULT: Actividad[] = [
  {
    id: 'item-1',
    item: 1,
    descripcion: 'Construccion de escalera Metálica de acceso a cárcamo con acero corrugado 3/4"',
    unidadMedida: 'ML',
    cantidad: 2.00,
    rendimientoBaseOficial: 1.80,
    cantOficiales: 1,
    cantAyudantes: 1,
    ratioAyudantes: 1.0,
  },
  {
    id: 'item-2',
    item: 2,
    descripcion: 'Construccion de barandal Metálico sobre muro de cárcamo tubo 1 1/2"',
    unidadMedida: 'ML',
    cantidad: 9.15,
    rendimientoBaseOficial: 3.50,
    cantOficiales: 1,
    cantAyudantes: 1,
    ratioAyudantes: 1.0,
  },
  {
    id: 'item-3',
    item: 3,
    descripcion: 'Elaboracion y colado de concreto estructural resistencia 280 kg/cm²',
    unidadMedida: 'M³',
    cantidad: 1.35,
    rendimientoBaseOficial: 1.20,
    cantOficiales: 1,
    cantAyudantes: 2, // Optimización concreto (ratio 2.0)
    ratioAyudantes: 2.0,
  },
  {
    id: 'item-4',
    item: 4,
    descripcion: 'Alistar, cortar, armar y colocar acero de refuerzo principal # 3',
    unidadMedida: 'KG',
    cantidad: 171.35,
    rendimientoBaseOficial: 90.0,
    cantOficiales: 1,
    cantAyudantes: 1,
    ratioAyudantes: 1.0,
  },
  {
    id: 'item-5',
    item: 5,
    descripcion: 'Construcción de Andén de concreto simple de 2,500 psi espesor 3"',
    unidadMedida: 'M²',
    cantidad: 20.40,
    rendimientoBaseOficial: 14.0,
    cantOficiales: 1,
    cantAyudantes: 2, // Optimización concreto (ratio 2.0)
    ratioAyudantes: 2.0,
  },
  {
    id: 'item-6',
    item: 6,
    descripcion: "Cerco de malla ciclón de 8' con tubo de HG de 1 1/2\"",
    unidadMedida: 'ml',
    cantidad: 12.00,
    rendimientoBaseOficial: 7.00,
    cantOficiales: 1,
    cantAyudantes: 1,
    ratioAyudantes: 1.0,
  },
  {
    id: 'item-7',
    item: 7,
    descripcion: 'Concreto ciclópeo con 60% piedra bolón',
    unidadMedida: 'M³',
    cantidad: 4.80,
    rendimientoBaseOficial: 2.50,
    cantOficiales: 1,
    cantAyudantes: 2, // Optimización concreto (ratio 2.0)
    ratioAyudantes: 2.0,
  },
  {
    id: 'item-8',
    item: 8,
    descripcion: 'Estructura metalica de Caja metalica 6"x4"x5/16"',
    unidadMedida: 'm2',
    cantidad: 12.60,
    rendimientoBaseOficial: 4.50,
    cantOficiales: 1,
    cantAyudantes: 1,
    ratioAyudantes: 1.0,
  },
];

export function calcularFSRMultiplicador(config: ConfiguracionLaboral): number {
  return (
    1.0 +
    config.pctAguinaldo +
    config.pctVacaciones +
    config.pctInssPatronal +
    config.pctInatec +
    config.pctIndemnizacion
  );
}

export function calcularSalarios(config: ConfiguracionLaboral) {
  const salarioDiarioAyudante = config.salarioMinimoMensual / config.diasMesComercial;
  const salarioDiarioOficial = salarioDiarioAyudante * config.factorOficial;
  const fsrMultiplicador = calcularFSRMultiplicador(config);

  const costoRealDiarioAyudante = salarioDiarioAyudante * fsrMultiplicador;
  const costoRealDiarioOficial = salarioDiarioOficial * fsrMultiplicador;

  return {
    salarioDiarioAyudante,
    salarioDiarioOficial,
    fsrMultiplicador,
    costoRealDiarioAyudante,
    costoRealDiarioOficial,
  };
}

export function calcularCronogramaCompleto(
  actividades: Actividad[],
  config: ConfiguracionLaboral
): CronogramaCalculado {
  const salarios = calcularSalarios(config);
  const diasSemana = config.diasSemanaLaboral;

  let timelineDia = 0;
  const itemsCalculados: Array<{
    actividad: Actividad;
    rendimientoTotal: number;
    diasRequeridos: number;
    costoDiario: number;
    costoUnitario: number;
    costoTotal: number;
    diaInicio: number;
    diaFin: number;
  }> = [];

  for (const act of actividades) {
    const rendimientoTotal = act.rendimientoBaseOficial * act.cantOficiales;
    const diasRequeridos = rendimientoTotal > 0 ? act.cantidad / rendimientoTotal : 0;
    
    // Costo diario de cuadrilla
    const costoDiario =
      act.cantOficiales * salarios.costoRealDiarioOficial +
      act.cantAyudantes * salarios.costoRealDiarioAyudante;

    // Costo unitario
    const costoUnitario = rendimientoTotal > 0 ? costoDiario / rendimientoTotal : 0;
    const costoTotal = act.cantidad * costoUnitario;

    const diaInicio = timelineDia;
    const diaFin = diaInicio + diasRequeridos;
    timelineDia = diaFin;

    itemsCalculados.push({
      actividad: act,
      rendimientoTotal,
      diasRequeridos,
      costoDiario,
      costoUnitario,
      costoTotal,
      diaInicio,
      diaFin,
    });
  }

  const totalDias = timelineDia;
  const numSemanas = Math.max(
    3,
    Math.floor(totalDias / diasSemana) + (totalDias % diasSemana > 0.0001 ? 1 : 0)
  );

  const matriz: DetalleCronogramaActividad[] = [];
  const totalesPorSemana: number[] = new Array(numSemanas).fill(0);

  for (const item of itemsCalculados) {
    const pagosSemanales: number[] = new Array(numSemanas).fill(0);
    const dIni = item.diaInicio;
    const dFin = item.diaFin;
    const costoDia = item.costoDiario;

    for (let w = 0; w < numSemanas; w++) {
      const wIni = w * diasSemana;
      const wFin = (w + 1) * diasSemana;
      const diasEnSemana = Math.max(0, Math.min(dFin, wFin) - Math.max(dIni, wIni));
      const monto = diasEnSemana * costoDia;
      pagosSemanales[w] = monto;
      totalesPorSemana[w] += monto;
    }

    matriz.push({
      ...item,
      pagosSemanales,
    });
  }

  const costoTotalProyecto = totalesPorSemana.reduce((acc, curr) => acc + curr, 0);

  return {
    totalDias,
    numSemanas,
    matriz,
    totalesPorSemana,
    costoTotalProyecto,
    ...salarios,
  };
}

export function calcularIrMensual(salarioBrutoMensual: number, pctInssLaboral: number = 0.07): number {
  const inssLaboral = salarioBrutoMensual * pctInssLaboral;
  const baseGravableMensual = Math.max(0, salarioBrutoMensual - inssLaboral);
  const baseAnual = baseGravableMensual * 12;

  let impuestoAnual = 0;
  if (baseAnual <= 100000) {
    impuestoAnual = 0;
  } else if (baseAnual <= 200000) {
    impuestoAnual = (baseAnual - 100000) * 0.15;
  } else if (baseAnual <= 350000) {
    impuestoAnual = 15000 + (baseAnual - 200000) * 0.20;
  } else if (baseAnual <= 500000) {
    impuestoAnual = 45000 + (baseAnual - 350000) * 0.25;
  } else {
    impuestoAnual = 82500 + (baseAnual - 500000) * 0.30;
  }

  return Math.max(0, impuestoAnual / 12);
}

export function calcularIrRetenidoPorDias(
  salarioDiario: number,
  diasLaborados: number,
  diasMesComercial: number = 26,
  pctInssLaboral: number = 0.07
): number {
  const salarioMensualProyectado = salarioDiario * diasMesComercial;
  const irMensual = calcularIrMensual(salarioMensualProyectado, pctInssLaboral);
  const irDiario = irMensual / diasMesComercial;
  return Number((irDiario * diasLaborados).toFixed(2));
}

export function generarPlanillaNomina(
  actividades: Actividad[],
  config: ConfiguracionLaboral
): ColaboradorNomina[] {
  const salarios = calcularSalarios(config);
  const crono = calcularCronogramaCompleto(actividades, config);
  const colaboradores: ColaboradorNomina[] = [];
  let contador = 1;

  for (const det of crono.matriz) {
    const act = det.actividad;
    const dias = det.diasRequeridos;

    // Oficiales
    for (let ofi = 1; ofi <= act.cantOficiales; ofi++) {
      const codigo = `COL-${String(contador).padStart(3, '0')}`;
      const rol = `Oficial ${ofi} (${act.descripcion})`;
      const salDiario = salarios.salarioDiarioOficial;
      const salBruto = Number((dias * salDiario).toFixed(2));
      const inssLab = Number((salBruto * config.pctInssLaboral).toFixed(2));
      const irRet = calcularIrRetenidoPorDias(salDiario, dias, config.diasMesComercial, config.pctInssLaboral);
      const totalDed = Number((inssLab + irRet).toFixed(2));
      const salNeto = Number((salBruto - totalDed).toFixed(2));
      const inssPat = Number((salBruto * config.pctInssPatronal).toFixed(2));
      const inatec = Number((salBruto * config.pctInatec).toFixed(2));
      // Costo Total Patronal con FSR (incluye Aguinaldo, Vacaciones, INSS Patronal, INATEC e Indemnización)
      const costoPat = Number((salBruto * salarios.fsrMultiplicador).toFixed(2));

      colaboradores.push({
        codigo,
        rol,
        diasLaborados: dias,
        salarioDiario: salDiario,
        salarioBruto: salBruto,
        inssLaboral: inssLab,
        irRetenido: irRet,
        totalDeducciones: totalDed,
        salarioNeto: salNeto,
        inssPatronal: inssPat,
        inatec,
        costoTotalPatronal: costoPat,
      });
      contador++;
    }

    // Ayudantes
    for (let ayu = 1; ayu <= act.cantAyudantes; ayu++) {
      const codigo = `COL-${String(contador).padStart(3, '0')}`;
      const rol = `Ayudante ${ayu} (${act.descripcion})`;
      const salDiario = salarios.salarioDiarioAyudante;
      const salBruto = Number((dias * salDiario).toFixed(2));
      const inssLab = Number((salBruto * config.pctInssLaboral).toFixed(2));
      const irRet = calcularIrRetenidoPorDias(salDiario, dias, config.diasMesComercial, config.pctInssLaboral);
      const totalDed = Number((inssLab + irRet).toFixed(2));
      const salNeto = Number((salBruto - totalDed).toFixed(2));
      const inssPat = Number((salBruto * config.pctInssPatronal).toFixed(2));
      const inatec = Number((salBruto * config.pctInatec).toFixed(2));
      // Costo Total Patronal con FSR (incluye Aguinaldo, Vacaciones, INSS Patronal, INATEC e Indemnización)
      const costoPat = Number((salBruto * salarios.fsrMultiplicador).toFixed(2));

      colaboradores.push({
        codigo,
        rol,
        diasLaborados: dias,
        salarioDiario: salDiario,
        salarioBruto: salBruto,
        inssLaboral: inssLab,
        irRetenido: irRet,
        totalDeducciones: totalDed,
        salarioNeto: salNeto,
        inssPatronal: inssPat,
        inatec,
        costoTotalPatronal: costoPat,
      });
      contador++;
    }
  }

  return colaboradores;
}
