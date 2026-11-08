const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');

export interface Company {
  id: number;
  nombre: string;
  razon_social: string | null;
  identificacion_fiscal: string | null;
  pais: string;
  moneda_base: string;
  estado: string;
}

export interface PlatformUser {
  id: number;
  nombre: string;
  correo: string;
  estado: string;
}

export interface Membership {
  id: number;
  empresa_id: number;
  usuario_id: number;
  rol: 'Administrador' | 'Editor' | 'Lector';
  estado: string;
  usuario: PlatformUser;
}

export interface PersistentProject {
  id: number;
  empresa_id: number | null;
  nombre: string;
  ubicacion: string | null;
  estado: string;
  fecha_creacion: string;
}

export interface ProjectVersion {
  id: number;
  proyecto_id: number;
  numero: number;
  estado: string;
  motivo: string;
  version_anterior_id: number | null;
  creado_por_id: number | null;
  creado_en: string;
  tiene_mano_obra: boolean;
}

export interface LaborConfiguration {
  salario_minimo_mensual: number;
  dias_mes_comercial: number;
  horas_jornada_diaria: number;
  horas_semana_max: number;
  dias_semana_laboral: number;
  factor_oficial: number;
  pct_aguinaldo: number;
  pct_vacaciones: number;
  pct_inss_patronal: number;
  pct_inatec: number;
  pct_indemnizacion: number;
  pct_inss_laboral: number;
}

export interface LaborActivity {
  id: string;
  item: number;
  descripcion: string;
  unidad_medida: string;
  cantidad: number;
  rendimiento_base_oficial: number;
  cant_oficiales: number;
  cant_ayudantes: number;
  ratio_ayudantes?: number;
}

export interface LaborSnapshot {
  version_proyecto_id: number;
  guardado: boolean;
  revision: number | null;
  configuracion: LaborConfiguration;
  actividades: LaborActivity[];
  total_mo: number;
  algoritmo_version: string | null;
  actualizado_en: string | null;
}

export interface LaborComparison {
  version_origen_id: number;
  version_destino_id: number;
  total_origen: number;
  total_destino: number;
  diferencia_total: number;
  configuracion_modificada: boolean;
  configuracion_cambios: Record<string, { anterior: string | number | null; nuevo: string | number | null }>;
  agregadas: LaborActivity[];
  eliminadas: LaborActivity[];
  modificadas: Array<{
    id: string;
    cambios: Record<string, { anterior: string | number | null; nuevo: string | number | null }>;
  }>;
}

export interface WbsPartida {
  id: number;
  capitulo_id: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  rendimiento: number | null;
}

export interface WbsCapitulo {
  id: number;
  proyecto_id: number;
  version_proyecto_id: number;
  codigo: string;
  nombre: string;
  partidas: WbsPartida[];
}

export interface WbsStructure {
  empresa_id: number | null;
  proyecto_id: number;
  version_proyecto_id: number;
  numero_version: number;
  capitulos: WbsCapitulo[];
}

export interface AuditEvent {
  id: number;
  actor_usuario_id: number | null;
  actor_tipo: string;
  empresa_id: number | null;
  proyecto_id: number | null;
  version_proyecto_id: number | null;
  accion: string;
  entidad_tipo: string;
  entidad_id: string;
  motivo: string | null;
  origen: string;
  valores_anteriores: Record<string, unknown> | null;
  valores_nuevos: Record<string, unknown> | null;
  creado_en: string;
}

export interface MaterialCategory {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface CatalogMaterial {
  id: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  categoria_id: number;
  categoria_nombre: string;
  activo: boolean;
}

export interface MaterialProvider {
  id: number;
  nombre: string;
  ruc: string | null;
  telefono: string | null;
  correo: string | null;
  activo: boolean;
}

export interface MaterialQuote {
  id: number;
  material_id: number;
  material_descripcion: string;
  proveedor_id: number;
  proveedor_nombre: string;
  costo_unitario: number;
  moneda: string;
  unidad_precio: string;
  fecha_vigencia: string;
  registrado_en: string;
  origen: string;
  referencia_cotizacion: string | null;
  observacion: string | null;
}

export interface ApuMaster {
  id: number;
  nombre: string;
  descripcion: string;
  unidad: string;
  estado: string;
  creado_por_id: number | null;
  creado_en: string;
  actualizado_en: string;
}

export interface ApuVersion {
  id: number;
  apu_maestro_id: number;
  numero: number;
  nombre: string;
  descripcion: string;
  unidad: string;
  costo_unitario: number;
  detalle: Array<Record<string, unknown>>;
  motivo: string;
  creado_por_id: number | null;
  creado_en: string;
}

export interface ApuUsage {
  id: number;
  apu_maestro_id: number;
  version_apu_id: number;
  version_proyecto_id: number;
  proyecto_id: number;
  proyecto_nombre: string;
  version_proyecto_numero: number;
  partida_id: number | null;
  partida_codigo: string;
  partida_descripcion: string;
  capitulo_codigo: string;
  version_apu_numero: number;
  apu_nombre: string;
  snapshot: Record<string, unknown>;
  motivo: string;
  creado_por_id: number | null;
  creado_en: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  } catch {
    throw new Error('No fue posible conectar con el backend. Verifica que FastAPI esté iniciado.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: unknown } | null;
    const detail = typeof body?.detail === 'string'
      ? body.detail
      : Array.isArray(body?.detail)
        ? body.detail.map((item) => typeof item === 'object' && item !== null && 'msg' in item ? String(item.msg) : String(item)).join('; ')
        : '';
    throw new Error(detail || `El backend respondió con HTTP ${response.status}.`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

export const platformApi = {
  companies: () => request<Company[]>('/empresas'),
  users: () => request<PlatformUser[]>('/usuarios'),
  projects: () => request<PersistentProject[]>('/proyectos'),
  memberships: (companyId: number) => request<Membership[]>(`/empresas/${companyId}/membresias`),
  versions: (projectId: number) => request<ProjectVersion[]>(`/proyectos/${projectId}/versiones`),
  labor: (projectId: number, versionId: number) =>
    request<LaborSnapshot>(`/proyectos/${projectId}/versiones/${versionId}/mano-obra`),
  wbs: (projectId: number, versionId: number) =>
    request<WbsStructure>(`/proyectos/${projectId}/versiones/${versionId}/wbs`),
  comparison: (projectId: number, sourceId: number, targetId: number) =>
    request<LaborComparison>(
      `/proyectos/${projectId}/mano-obra/comparar?desde=${sourceId}&hasta=${targetId}`,
    ),
  audit: (projectId: number) => request<AuditEvent[]>(`/proyectos/${projectId}/auditoria?limite=50`),
  materialCategories: () => request<MaterialCategory[]>('/materiales/categorias'),
  materials: () => request<CatalogMaterial[]>('/materiales'),
  materialProviders: () => request<MaterialProvider[]>('/materiales/proveedores'),
  materialQuotes: (materialId: number) =>
    request<MaterialQuote[]>(`/materiales/${materialId}/cotizaciones`),
  currentMaterialPrices: (materialId: number, currency: string) =>
    request<MaterialQuote[]>(
      `/materiales/${materialId}/precios-vigentes?moneda=${encodeURIComponent(currency)}`,
    ),
  partApuUsages: (projectId: number, versionId: number, partId: number) =>
    request<ApuUsage[]>(
      `/apu-maestro/proyectos/${projectId}/versiones/${versionId}/partidas/${partId}/usos`,
    ),
  createMaterialCategory: (body: {
    codigo: string;
    nombre: string;
    creado_por_id: number;
    motivo: string;
  }) => post<MaterialCategory>('/materiales/categorias', body),
  createMaterial: (body: {
    codigo: string;
    descripcion: string;
    unidad: string;
    categoria_id: number;
    creado_por_id: number;
    motivo: string;
  }) => post<CatalogMaterial>('/materiales', body),
  createMaterialProvider: (body: {
    nombre: string;
    creado_por_id: number;
    motivo: string;
  }) => post<MaterialProvider>('/materiales/proveedores', body),
  createMaterialQuote: (
    materialId: number,
    body: {
      proveedor_id: number;
      costo_unitario: number;
      moneda: string;
      unidad_precio: string;
      fecha_vigencia: string;
      origen: string;
      referencia_cotizacion?: string;
      creado_por_id: number;
      motivo: string;
    },
  ) => post<MaterialQuote>(`/materiales/${materialId}/cotizaciones`, body),
  createApuMaster: (body: {
    nombre: string;
    descripcion: string;
    unidad: string;
    creado_por_id: number;
    motivo: string;
  }) => post<ApuMaster>('/apu-maestro', body),
  createApuVersion: (
    masterId: number,
    body: {
      detalle: Array<{
        concepto: string;
        unidad: string;
        cantidad: number;
        material_id: number;
        proveedor_id: number;
        material_precio_id: number;
      }>;
      motivo: string;
      creado_por_id: number;
    },
  ) => post<ApuVersion>(`/apu-maestro/${masterId}/versiones`, body),
  associateApu: (
    projectId: number,
    versionId: number,
    partId: number,
    body: { version_apu_id: number; motivo: string; creado_por_id: number },
  ) =>
    post<ApuUsage>(
      `/apu-maestro/proyectos/${projectId}/versiones/${versionId}/partidas/${partId}/usos`,
      body,
    ),
  createCompany: (body: { nombre: string; creado_por_id?: number; motivo?: string }) =>
    post<Company>('/empresas', body),
  createUser: (body: { nombre: string; correo: string; creado_por_id?: number; motivo?: string }) =>
    post<PlatformUser>('/usuarios', body),
  createMembership: (companyId: number, body: {
    usuario_id: number;
    rol: Membership['rol'];
    creado_por_id?: number;
    motivo?: string;
  }) =>
    post<Membership>(`/empresas/${companyId}/membresias`, body),
  createProject: (body: {
    empresa_id: number;
    nombre: string;
    ubicacion?: string;
    creado_por_id?: number;
    motivo?: string;
  }) =>
    post<PersistentProject>('/proyectos', body),
  createVersion: (
    projectId: number,
    body: { version_origen_id?: number; motivo: string; creado_por_id?: number },
  ) => post<ProjectVersion>(`/proyectos/${projectId}/versiones`, body),
  createWbsChapter: (
    projectId: number,
    versionId: number,
    body: { codigo: string; nombre: string; creado_por_id?: number },
  ) =>
    post<WbsCapitulo>(
      `/proyectos/${projectId}/versiones/${versionId}/capitulos`,
      body,
    ),
  updateWbsChapter: (
    projectId: number,
    versionId: number,
    chapterId: number,
    body: { codigo?: string; nombre?: string; actualizado_por_id?: number },
  ) =>
    request<WbsCapitulo>(
      `/proyectos/${projectId}/versiones/${versionId}/capitulos/${chapterId}`,
      { method: 'PUT', body: JSON.stringify(body) },
    ),
  deleteWbsChapter: (projectId: number, versionId: number, chapterId: number) =>
    request<void>(`/proyectos/${projectId}/versiones/${versionId}/capitulos/${chapterId}`, {
      method: 'DELETE',
    }),
  createWbsPartida: (
    projectId: number,
    versionId: number,
    chapterId: number,
    body: {
      codigo: string;
      descripcion: string;
      unidad: string;
      cantidad: number;
      rendimiento?: number;
      creado_por_id?: number;
    },
  ) =>
    post<WbsPartida>(
      `/proyectos/${projectId}/versiones/${versionId}/capitulos/${chapterId}/partidas`,
      body,
    ),
  updateWbsPartida: (
    projectId: number,
    versionId: number,
    chapterId: number,
    partId: number,
    body: {
      codigo?: string;
      descripcion?: string;
      unidad?: string;
      cantidad?: number;
      rendimiento?: number | null;
      actualizado_por_id?: number;
    },
  ) =>
    request<WbsPartida>(
      `/proyectos/${projectId}/versiones/${versionId}/capitulos/${chapterId}/partidas/${partId}`,
      { method: 'PUT', body: JSON.stringify(body) },
    ),
  deleteWbsPartida: (
    projectId: number,
    versionId: number,
    chapterId: number,
    partId: number,
  ) =>
    request<void>(
      `/proyectos/${projectId}/versiones/${versionId}/capitulos/${chapterId}/partidas/${partId}`,
      { method: 'DELETE' },
    ),
  saveLabor: (
    projectId: number,
    versionId: number,
    body: {
      revision_esperada: number | null;
      motivo: string;
      actualizado_por_id?: number;
      configuracion: LaborConfiguration;
      actividades: LaborActivity[];
    },
  ) =>
    request<LaborSnapshot>(`/proyectos/${projectId}/versiones/${versionId}/mano-obra`, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),
};
