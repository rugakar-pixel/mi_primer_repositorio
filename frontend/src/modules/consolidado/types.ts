import type { Project } from '../materiales-costos/types';
import type { DetalleCronogramaActividad } from '../presupuesto-mo/types/budget';

export type BudgetOrigin =
  | 'MANO_OBRA'
  | 'MATERIAL'
  | 'EQUIPO'
  | 'SUBCONTRATO'
  | 'OTRO';

export interface ConsolidatedItem {
  id: string;
  origen: BudgetOrigin;
  categoria: string;
  descripcion: string;
  unidadMedida: string;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
  referencias: string[];
}

export interface ConsolidationSummary {
  moneda: 'NIO';
  tasaCambio: number;
  manoObra: number;
  materiales: number;
  equipos: number;
  subcontratos: number;
  otros: number;
  totalGeneral: number;
}

export interface ConsolidationResponse {
  items: ConsolidatedItem[];
  resumen: ConsolidationSummary;
}

export interface ConsolidationSources {
  manoObra: DetalleCronogramaActividad[];
  proyectoMateriales: Project;
  subcontratos?: Array<{
    id: string;
    categoria: string;
    descripcion: string;
    unidadMedida: string;
    cantidad: number;
    costoUnitario: number;
    moneda: 'NIO' | 'USD';
    referencia?: string;
  }>;
}
