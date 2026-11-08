import type { Calculation, Project, RentalQuote } from './types';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
).replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string } | null;
    throw new Error(body?.detail ?? `Error HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getDemoProject(): Promise<Project> {
  return request<Project>('/api/v1/materiales-costos/demo');
}

export function calculateProject(project: Project): Promise<Calculation> {
  return request<Calculation>('/api/v1/materiales-costos/calcular', {
    method: 'POST',
    body: JSON.stringify(project),
  });
}

export function quoteEquipmentRental(
  equipmentId: string,
  modalidad: RentalQuote['modalidad'],
  periodos: number,
  unidades: number,
  tasaCambioNIO: number,
): Promise<RentalQuote> {
  return request<RentalQuote>('/api/v1/materiales-costos/renta', {
    method: 'POST',
    body: JSON.stringify({
      equipoId: equipmentId,
      modalidad,
      periodos,
      unidades,
      tasaCambioNio: tasaCambioNIO,
    }),
  });
}
