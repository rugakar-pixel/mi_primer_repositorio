export interface ConfiguracionLaboral {
  salarioMinimoMensual: number; // C$ 13,848.23
  diasMesComercial: number;     // 26
  horasJornadaDiaria: number;   // 8
  horasSemanaMax: number;       // 48
  diasSemanaLaboral: number;    // 6
  factorOficial: number;        // 1.50 (50% prima técnica)
  pctAguinaldo: number;         // 0.0833 (8.33%)
  pctVacaciones: number;        // 0.0833 (8.33%)
  pctInssPatronal: number;      // 0.2250 (22.50%)
  pctInatec: number;            // 0.0200 (2.00%)
  pctIndemnizacion: number;     // 0.0416 (4.16%)
  pctInssLaboral: number;       // 0.0700 (7.00%)
}

export interface ColaboradorNomina {
  codigo: string;
  rol: string;
  diasLaborados: number;
  salarioDiario: number;
  salarioBruto: number;
  inssLaboral: number;
  irRetenido: number;
  totalDeducciones: number;
  salarioNeto: number;
  inssPatronal: number;
  inatec: number;
  costoTotalPatronal: number;
}

export interface Actividad {
  id: string;
  item: number;
  descripcion: string;
  unidadMedida: string;
  cantidad: number;
  rendimientoBaseOficial: number;
  cantOficiales: number;
  cantAyudantes: number;
  ratioAyudantes?: number; // Proporción técnica de ayudantes por cada oficial (e.g. 1.0 ó 2.0)
}

export interface DetalleCronogramaActividad {
  actividad: Actividad;
  rendimientoTotal: number;
  diasRequeridos: number;
  costoDiario: number;
  costoUnitario: number;
  costoTotal: number;
  diaInicio: number;
  diaFin: number;
  pagosSemanales: number[];
}

export interface CronogramaCalculado {
  totalDias: number;
  numSemanas: number;
  matriz: DetalleCronogramaActividad[];
  totalesPorSemana: number[];
  costoTotalProyecto: number;
  costoRealDiarioOficial: number;
  costoRealDiarioAyudante: number;
  salarioDiarioAyudante: number;
  salarioDiarioOficial: number;
  fsrMultiplicador: number;
}
