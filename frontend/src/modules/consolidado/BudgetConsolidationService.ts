import type { ConsolidationResponse, ConsolidationSources } from './types';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080'
).replace(/\/$/, '');

export class BudgetConsolidationService {
  async consolidate(
    sources: ConsolidationSources,
    signal?: AbortSignal,
  ): Promise<ConsolidationResponse> {
    const manoObra = sources.manoObra.map(({ actividad, costoUnitario }) => ({
      id: actividad.id,
      categoria: 'actividad',
      descripcion: actividad.descripcion,
      unidadMedida: actividad.unidadMedida,
      cantidad: actividad.cantidad,
      costoUnitario,
      moneda: 'NIO',
      referencia: `Ítem ${actividad.item}: ${actividad.descripcion}`,
    }));

    const response = await fetch(`${API_BASE_URL}/api/consolidado`, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        manoObra,
        proyectoMateriales: sources.proyectoMateriales,
        subcontratos: sources.subcontratos ?? [],
      }),
    });

    if (!response.ok) {
      let detail = `Error HTTP ${response.status}`;
      try {
        const body = await response.json() as { detail?: string };
        detail = body.detail ?? detail;
      } catch {
        // Keep the HTTP status when the server does not return a JSON error.
      }
      throw new Error(detail);
    }

    return response.json() as Promise<ConsolidationResponse>;
  }
}

export const budgetConsolidationService = new BudgetConsolidationService();
