export type Currency = 'USD' | 'NIO';

export interface CostLine {
  nombre: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
}

export interface OtherCost {
  concepto: string;
  categoria: 'transporte' | 'otro';
  unidad: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Activity {
  id: string;
  item: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  medidas: {
    longitud?: number;
    ancho?: number;
    alto?: number;
    espesor?: number;
    diametro?: number;
    pesoPorMetro?: number;
    piezas?: number;
  };
  apu: {
    materiales: CostLine[];
    equipos: CostLine[];
    herramientas: CostLine[];
  };
  otrosCostos: OtherCost[];
}

export interface EquipmentBenchmark {
  id: string;
  equipo: string;
  categoria: string;
  costoDiarioMinUSD: number;
  costoDiarioMaxUSD: number;
  costoDiarioPromedioUSD: number;
  costoSemanalMinUSD: number;
  costoSemanalMaxUSD: number;
  costoSemanalPromedioUSD: number;
  costoMensualMinUSD: number;
  costoMensualMaxUSD: number;
  costoMensualPromedioUSD: number;
  unidadMedidaTarifa: string;
  observaciones: string;
}

export interface Project {
  meta: {
    nombre: string;
    moneda: Currency;
    tasaCambioNIO: number;
    aiu: {
      administracionPct: number;
      imprevistosPct: number;
      utilidadPct: number;
      ivaUtilidadPct: number;
    };
  };
  actividades: Activity[];
  tarifasEquipos: EquipmentBenchmark[];
}

export interface MaterialRow {
  nombre: string;
  categoria: string;
  unidad: string;
  cantidad_total: number;
  costo_unitario_estimado: number;
  costo_total_estimado: number;
  items_relacionados: number[];
}

export interface Calculation {
  moneda: 'USD';
  costo_materiales: number;
  costo_equipos: number;
  costo_herramientas: number;
  costo_transporte: number;
  otros_costos: number;
  costo_directo: number;
  administracion: number;
  imprevistos: number;
  utilidad: number;
  iva_utilidad: number;
  costo_indirecto_total: number;
  gran_total: number;
  materiales_consolidados: MaterialRow[];
}

export interface RentalQuote {
  equipo: string;
  modalidad: 'dia' | 'semana' | 'mes';
  total_usd: number;
  total_nio: number;
}
