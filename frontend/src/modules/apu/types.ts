export type TipoComponenteAPU = 'Material' | 'Mano de Obra' | 'Equipo/Maquinaria';

export interface LineaAPU {
  id: number;
  tipo: TipoComponenteAPU;
  descripcion: string;
  unidad: string;
  cantidad: number;
  costo_unitario: number;
  rendimiento: number | null;
  costo_parcial: number;
}

export interface PartidaAPU {
  id: number;
  capitulo_id: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  rendimiento: number | null;
  mano_obra: number;
  materiales: number;
  equipos: number;
  costo_total: number;
  analisis_unitarios: LineaAPU[];
}

export interface LineaAPUCreate {
  tipo: TipoComponenteAPU;
  descripcion: string;
  unidad: string;
  cantidad: number;
  costo_unitario: number;
  rendimiento?: number | null;
}

export interface PartidaAPUCreate {
  capitulo_id: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad?: number;
  rendimiento?: number | null;
  analisis_unitarios?: LineaAPUCreate[];
}
