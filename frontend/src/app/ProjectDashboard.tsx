import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Building2,
  Database,
  FolderKanban,
  LogOut,
  Plus,
  RadioTower,
} from 'lucide-react';
import {
  Company,
  AuditEvent,
  LaborComparison,
  Membership,
  PersistentProject,
  PlatformUser,
  ProjectVersion,
  platformApi,
} from '../modules/plataforma/api';

interface ProjectDashboardProps {
  username: string;
  consolidatedTotal: number | null;
  onOpenProject: (project?: {
    projectId: number;
    versionId: number;
    projectName: string;
    versionNumber: number;
    actorUserId?: number;
  }) => void;
  onOpenCatalog: () => void;
  onLogout: () => void;
}

export function ProjectDashboard({
  username,
  consolidatedTotal,
  onOpenProject,
  onOpenCatalog,
  onLogout,
}: ProjectDashboardProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [projects, setProjects] = useState<PersistentProject[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState('');
  const [selectedProject, setSelectedProject] = useState<PersistentProject | null>(null);
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [selectedLaborTotal, setSelectedLaborTotal] = useState<number | null>(null);
  const [comparison, setComparison] = useState<LaborComparison | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoaded, setAuditLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyReason, setCompanyReason] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userReason, setUserReason] = useState('');
  const [membershipUserId, setMembershipUserId] = useState('');
  const [membershipRole, setMembershipRole] = useState<Membership['rol']>('Editor');
  const [membershipReason, setMembershipReason] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectReason, setProjectReason] = useState('');
  const [versionReason, setVersionReason] = useState('');
  const setupPanel = useRef<HTMLDetailsElement>(null);
  const projectSelectionRequest = useRef(0);

  const reload = useCallback(async () => {
    setError('');
    try {
      const [nextCompanies, nextUsers, nextProjects] = await Promise.all([
        platformApi.companies(),
        platformApi.users(),
        platformApi.projects(),
      ]);
      setCompanies(nextCompanies);
      setUsers(nextUsers);
      setProjects(nextProjects);
      setCurrentUserId((current) =>
        current && nextUsers.some((user) => String(user.id) === current)
          ? current
          : nextUsers[0] ? String(nextUsers[0].id) : '',
      );
      setActiveCompanyId((current) =>
        current && nextCompanies.some((company) => String(company.id) === current)
          ? current
          : nextCompanies[0] ? String(nextCompanies[0].id) : '',
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudieron cargar los datos persistidos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!activeCompanyId) {
      setMemberships([]);
      return;
    }
    let active = true;
    platformApi.memberships(Number(activeCompanyId))
      .then((items) => {
        if (active) setMemberships(items);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudieron consultar las membresías.');
      });
    return () => {
      active = false;
    };
  }, [activeCompanyId]);

  useEffect(() => {
    if (!selectedProject || !selectedVersionId) {
      setSelectedLaborTotal(null);
      return;
    }
    let active = true;
    platformApi.labor(selectedProject.id, Number(selectedVersionId))
      .then((snapshot) => {
        if (active) setSelectedLaborTotal(snapshot.guardado ? snapshot.total_mo : 0);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudo consultar el total de Mano de Obra.');
      });
    return () => {
      active = false;
    };
  }, [selectedProject, selectedVersionId]);

  const runFormAction = async (action: () => Promise<void>) => {
    setWorking(true);
    setError('');
    setFeedback('');
    try {
      await action();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'La operación no pudo completarse.');
    } finally {
      setWorking(false);
    }
  };

  const handleCreateCompany = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runFormAction(async () => {
      const company = await platformApi.createCompany({
        nombre: companyName,
        creado_por_id: currentUserId ? Number(currentUserId) : undefined,
        motivo: companyReason.trim() || 'Alta de empresa desde el tablero',
      });
      setCompanyName('');
      setCompanyReason('');
      setActiveCompanyId(String(company.id));
      setFeedback('Empresa creada y persistida.');
      await reload();
    });
  };

  const handleCreateUser = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runFormAction(async () => {
      const user = await platformApi.createUser({
        nombre: userName,
        correo: userEmail,
        creado_por_id: currentUserId ? Number(currentUserId) : undefined,
        motivo: userReason.trim() || 'Alta de usuario de directorio',
      });
      setUserName('');
      setUserEmail('');
      setUserReason('');
      setMembershipUserId(String(user.id));
      setCurrentUserId(String(user.id));
      setFeedback('Usuario creado. Asígnalo a una empresa para habilitarlo en el proyecto.');
      await reload();
    });
  };

  const handleCreateMembership = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeCompanyId || !membershipUserId) return;
    void runFormAction(async () => {
      await platformApi.createMembership(Number(activeCompanyId), {
        usuario_id: Number(membershipUserId),
        rol: membershipRole,
        creado_por_id: currentUserId ? Number(currentUserId) : undefined,
        motivo: membershipReason.trim() || 'Asociación de usuario a empresa desde el tablero',
      });
      setMembershipReason('');
      setFeedback('Membresía asociada a la empresa.');
      setMemberships(await platformApi.memberships(Number(activeCompanyId)));
    });
  };

  const handleCreateProject = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeCompanyId) return;
    void runFormAction(async () => {
      const project = await platformApi.createProject({
        empresa_id: Number(activeCompanyId),
        nombre: projectName,
        ubicacion: projectLocation || undefined,
        creado_por_id: currentUserId ? Number(currentUserId) : undefined,
        motivo: projectReason.trim() || 'Creación de proyecto desde el tablero',
      });
      setProjectName('');
      setProjectLocation('');
      setProjectReason('');
      setFeedback('Proyecto creado. Crea su Versión 1 para iniciar el presupuesto.');
      await reload();
      await selectProject(project);
    });
  };

  const selectProject = async (project: PersistentProject) => {
    const requestId = ++projectSelectionRequest.current;
    setError('');
    setFeedback('');
    setSelectedProject(project);
    setVersions([]);
    setComparison(null);
    setAuditEvents([]);
    setAuditLoaded(false);
    setSelectedVersionId('');
    try {
      const projectVersions = await platformApi.versions(project.id);
      if (requestId !== projectSelectionRequest.current) return;
      setVersions(projectVersions);
      if (projectVersions.length > 0) {
        setSelectedVersionId(String(projectVersions[projectVersions.length - 1].id));
      }
    } catch (reason) {
      if (requestId !== projectSelectionRequest.current) return;
      setError(reason instanceof Error ? reason.message : 'No se pudieron consultar las versiones.');
    }
  };

  const handleCreateVersion = () => {
    if (!selectedProject) return;
    const sourceId = selectedVersionId ? Number(selectedVersionId) : undefined;
    void runFormAction(async () => {
      const newVersion = await platformApi.createVersion(selectedProject.id, {
        version_origen_id: sourceId,
        motivo: versionReason.trim() || (sourceId ? 'Nueva revisión de proyecto' : 'Versión inicial'),
        creado_por_id: currentUserId ? Number(currentUserId) : undefined,
      });
      setVersionReason('');
      setVersions(await platformApi.versions(selectedProject.id));
      setSelectedVersionId(String(newVersion.id));
      setComparison(null);
      setFeedback(`Versión ${newVersion.numero} creada${sourceId ? ' a partir de la versión anterior' : ''}.`);
    });
  };

  const handleCompare = () => {
    if (!selectedProject || !selectedVersionId) return;
    const target = versions.find((version) => version.id === Number(selectedVersionId));
    const source = target?.version_anterior_id
      ? versions.find((version) => version.id === target.version_anterior_id)
      : versions.find((version) => version.numero === (target?.numero ?? 0) - 1);
    if (!source || !target) {
      setError('Selecciona una versión que tenga una versión anterior para comparar.');
      return;
    }
    void runFormAction(async () => {
      setComparison(await platformApi.comparison(selectedProject.id, source.id, target.id));
    });
  };

  const handleShowAudit = () => {
    if (!selectedProject) return;
    void runFormAction(async () => {
      setAuditEvents(await platformApi.audit(selectedProject.id));
      setAuditLoaded(true);
    });
  };

  const openSelectedProject = () => {
    if (!selectedProject || !selectedVersionId) return;
    const version = versions.find((item) => item.id === Number(selectedVersionId));
    if (version) {
      onOpenProject({
        projectId: selectedProject.id,
        versionId: version.id,
        projectName: selectedProject.nombre,
        versionNumber: version.numero,
        actorUserId: currentUserId ? Number(currentUserId) : undefined,
      });
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">COS</p>
              <p className="text-[10px] leading-tight text-slate-300">Construction Operating System</p>
              <p className="text-[10px] leading-tight text-slate-400">Gerente Administrativo IA para Construcción</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:inline">{username}</span>
            <button type="button" onClick={onLogout} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-3 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-300">
            <FolderKanban className="h-4 w-4" />
            Portafolio de obras
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Tablero Central</h1>
          <p className="mt-2 text-sm text-slate-400">Crea la empresa y el proyecto, administra sus versiones y continúa con la obra.</p>
        </div>

        {(error || feedback) && (
          <div role={error ? 'alert' : 'status'} className={`mb-5 rounded-lg border px-4 py-3 text-sm ${error ? 'border-rose-500/30 bg-rose-950/40 text-rose-200' : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200'}`}>
            {error || feedback}
          </div>
        )}

        <details ref={setupPanel} className="mb-8 rounded-xl border border-slate-800 bg-slate-900/60">
          <summary className="cursor-pointer px-5 py-4 text-sm font-semibold text-slate-200">
            Administración inicial · empresas, usuarios y proyectos
          </summary>
          <div className="grid gap-6 border-t border-slate-800 p-5 lg:grid-cols-2">
            <label className="space-y-2 text-sm text-slate-300 lg:col-span-2">
              <span>Usuario registrado como actor (la identidad aún no se autentica)</span>
              <select value={currentUserId} onChange={(event) => setCurrentUserId(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white">
                <option value="">Sin usuario identificado</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.nombre} · {user.correo}</option>)}
              </select>
            </label>
            <form onSubmit={handleCreateCompany} className="space-y-3">
              <h2 className="text-sm font-semibold text-white">Crear empresa</h2>
              <input required maxLength={200} value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="Nombre de la empresa" className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              <input maxLength={1000} value={companyReason} onChange={(event) => setCompanyReason(event.target.value)} placeholder="Motivo (opcional)" className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              <button disabled={working} className="min-h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Crear empresa</button>
            </form>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <h2 className="text-sm font-semibold text-white">Crear usuario de directorio</h2>
              <input required maxLength={200} value={userName} onChange={(event) => setUserName(event.target.value)} placeholder="Nombre" className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              <input required type="email" maxLength={254} value={userEmail} onChange={(event) => setUserEmail(event.target.value)} placeholder="correo@empresa.com" className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              <input maxLength={1000} value={userReason} onChange={(event) => setUserReason(event.target.value)} placeholder="Motivo (opcional)" className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              <button disabled={working} className="min-h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Crear usuario</button>
            </form>

            <form onSubmit={handleCreateMembership} className="space-y-3">
              <h2 className="text-sm font-semibold text-white">Asociar usuario a empresa</h2>
              <select required value={activeCompanyId} onChange={(event) => setActiveCompanyId(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white">
                <option value="">Selecciona una empresa</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.nombre}</option>)}
              </select>
              <select required value={membershipUserId} onChange={(event) => setMembershipUserId(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white">
                <option value="">Selecciona un usuario</option>
                {users.map((user) => <option key={user.id} value={user.id}>{user.nombre} · {user.correo}</option>)}
              </select>
              <input maxLength={1000} value={membershipReason} onChange={(event) => setMembershipReason(event.target.value)} placeholder="Motivo de la asociación (opcional)" className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              <div className="flex gap-3">
                <select value={membershipRole} onChange={(event) => setMembershipRole(event.target.value as Membership['rol'])} className="min-h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white">
                  <option>Administrador</option><option>Editor</option><option>Lector</option>
                </select>
                <button disabled={working || !activeCompanyId || !membershipUserId} className="min-h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Asociar</button>
              </div>
              {memberships.length > 0 && <p className="text-xs text-slate-400">{memberships.length} usuario(s) asociado(s) a esta empresa.</p>}
            </form>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <h2 className="text-sm font-semibold text-white">Crear proyecto persistente</h2>
              <select required value={activeCompanyId} onChange={(event) => setActiveCompanyId(event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white">
                <option value="">Selecciona una empresa</option>
                {companies.map((company) => <option key={company.id} value={company.id}>{company.nombre}</option>)}
              </select>
              <input required maxLength={200} value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Nombre del proyecto" className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              <input maxLength={250} value={projectLocation} onChange={(event) => setProjectLocation(event.target.value)} placeholder="Ubicación (opcional)" className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              <input maxLength={1000} value={projectReason} onChange={(event) => setProjectReason(event.target.value)} placeholder="Motivo de creación (opcional)" className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
              <button disabled={working || !activeCompanyId} className="min-h-10 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-50">Crear proyecto</button>
            </form>
          </div>
          <p className="border-t border-amber-500/20 bg-amber-950/20 px-5 py-3 text-xs text-amber-200">
            Fase 1 no incluye inicio de sesión ni autorización real. Los usuarios son registros de directorio y las membresías no protegen aún la API.
          </p>
        </details>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.9fr)]">
          <section aria-labelledby="active-projects-title">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="active-projects-title" className="text-base font-semibold text-white">Proyectos persistidos</h2>
              <span className="text-xs text-slate-500">{loading ? 'Cargando...' : `${projects.length} proyecto(s)`}</span>
            </div>

            <div className="space-y-4">
              {projects.map((project) => {
                const isSelected = selectedProject?.id === project.id;
                const selectedVersion = versions.find((version) => version.id === Number(selectedVersionId));
                return (
                  <article key={project.id} className={`rounded-lg border p-5 shadow-lg sm:p-6 ${isSelected ? 'border-blue-500/40 bg-slate-900/90' : 'border-slate-800 bg-slate-900/60'}`}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <button type="button" onClick={() => void selectProject(project)} className="flex items-start gap-3 text-left">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-300"><RadioTower className="h-5 w-5" /></span>
                        <span>
                          <span className="block text-lg font-semibold text-white">{project.nombre}</span>
                          <span className="mt-1 block text-sm text-slate-400">{project.ubicacion || 'Ubicación no especificada'} · {project.estado}</span>
                        </span>
                      </button>
                      {isSelected && selectedVersion?.tiene_mano_obra && (
                        <div className="min-w-40 sm:text-right">
                          <p className="text-xs text-slate-500">Mano de Obra guardada</p>
                          <p className="mt-1 font-mono text-lg font-semibold text-white">
                            {selectedLaborTotal === null
                              ? 'Consultando…'
                              : new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(selectedLaborTotal)}
                          </p>
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <div className="mt-5 space-y-3 border-t border-slate-800 pt-4">
                        <div className="flex flex-wrap gap-3">
                          <select value={selectedVersionId} onChange={(event) => { setSelectedVersionId(event.target.value); setComparison(null); }} className="min-h-10 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white">
                            <option value="">Selecciona una versión</option>
                            {versions.map((version) => <option key={version.id} value={version.id}>Versión {version.numero} · {version.estado}{version.tiene_mano_obra ? ' · MO guardada' : ''}</option>)}
                          </select>
                          <button type="button" onClick={handleCreateVersion} disabled={working} className="min-h-10 rounded-lg border border-slate-700 px-3 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50">
                            <Plus className="mr-1 inline h-4 w-4" /> Nueva versión
                          </button>
                        </div>
                        <input value={versionReason} onChange={(event) => setVersionReason(event.target.value)} placeholder="Motivo de la nueva versión (opcional)" className="min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white" />
                        <div className="flex flex-wrap justify-between gap-3">
                          <button type="button" onClick={handleCompare} disabled={working || !selectedVersion?.version_anterior_id} className="min-h-10 rounded-lg border border-slate-700 px-3 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40">Comparar con versión anterior</button>
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={handleShowAudit} disabled={working} className="min-h-10 rounded-lg border border-slate-700 px-3 text-sm text-slate-300 hover:bg-slate-800 disabled:opacity-40">Ver auditoría</button>
                            <button type="button" onClick={openSelectedProject} disabled={!selectedVersionId} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-40">
                              Entrar a Gestionar <ArrowRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {comparison && (
                          <div className="rounded-lg border border-indigo-500/20 bg-indigo-950/30 p-4 text-sm">
                            <p className="font-semibold text-indigo-200">Versión {versions.find((item) => item.id === comparison.version_origen_id)?.numero} → {versions.find((item) => item.id === comparison.version_destino_id)?.numero}</p>
                            <p className="mt-1 text-slate-300">MO: {comparison.total_origen.toFixed(2)} → {comparison.total_destino.toFixed(2)} NIO ({comparison.diferencia_total >= 0 ? '+' : ''}{comparison.diferencia_total.toFixed(2)}).</p>
                            <p className="mt-1 text-xs text-slate-400">{comparison.agregadas.length} agregada(s), {comparison.eliminadas.length} eliminada(s), {comparison.modificadas.length} modificada(s){comparison.configuracion_modificada ? ' y cambió la configuración laboral' : ''}.</p>
                            {comparison.configuracion_modificada && (
                              <pre className="mt-2 overflow-auto text-[11px] text-slate-400">
                                {JSON.stringify(comparison.configuracion_cambios, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                        {auditLoaded && (
                          <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                            <p className="text-sm font-semibold text-slate-200">Eventos recientes</p>
                            {auditEvents.length === 0 && <p className="text-xs text-slate-400">Este proyecto aún no tiene eventos de auditoría.</p>}
                            {auditEvents.slice(0, 10).map((event) => (
                              <details key={event.id} className="border-t border-slate-800 pt-2 text-xs">
                                <summary className="cursor-pointer text-slate-300">
                                  {new Date(event.creado_en).toLocaleString('es-NI')} · {event.accion} {event.entidad_tipo} #{event.entidad_id}
                                  {event.actor_usuario_id ? ` · usuario ${users.find((user) => user.id === event.actor_usuario_id)?.nombre ?? event.actor_usuario_id}` : ' · actor no autenticado'}
                                </summary>
                                <p className="mt-1 text-slate-400">{event.motivo || 'Sin motivo indicado'} · origen: {event.origen}</p>
                                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-[11px] text-slate-400">
                                  {JSON.stringify({ anterior: event.valores_anteriores, nuevo: event.valores_nuevos }, null, 2)}
                                </pre>
                              </details>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}

              {!loading && projects.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-700 p-6 text-sm text-slate-400">
                  Aún no hay proyectos persistidos. Crea una empresa y un proyecto en el panel de administración inicial.
                </div>
              )}
              <article className="rounded-lg border border-slate-800 bg-slate-900/50 p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-white">EBAR SUR 2 · espacio de demostración</h3>
                    <p className="mt-1 text-sm text-slate-400">Conserva el módulo existente y sus actividades de ejemplo; no es una versión persistida.</p>
                    <p className="mt-2 text-sm font-mono text-slate-200">
                      Consolidado de demostración: {consolidatedTotal === null ? 'calculando…' : new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO' }).format(consolidatedTotal)}
                    </p>
                  </div>
                  <button type="button" onClick={() => onOpenProject()} className="min-h-10 rounded-lg border border-slate-700 px-3 text-sm text-slate-200 hover:bg-slate-800">Abrir demo</button>
                </div>
              </article>
            </div>
          </section>

          <aside aria-labelledby="quick-actions-title">
            <div className="mb-4">
              <h2 id="quick-actions-title" className="text-base font-semibold text-white">Accesos rápidos</h2>
              <p className="mt-1 text-xs text-slate-500">Herramientas del espacio de trabajo</p>
            </div>
            <div className="divide-y divide-slate-800 border-y border-slate-800">
              <button type="button" onClick={() => { if (setupPanel.current) setupPanel.current.open = true; }} className="group flex w-full items-center gap-3 py-4 text-left hover:bg-slate-900/70">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-blue-300"><Plus className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-200">Crear Nuevo Proyecto</span><span className="mt-1 block text-xs text-slate-500">Iniciar una nueva obra y su presupuesto.</span></span>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-blue-300" />
              </button>
              <button type="button" onClick={onOpenCatalog} className="group flex w-full items-center gap-3 py-4 text-left hover:bg-slate-900/70">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-blue-300"><Database className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-200">Base de Datos Maestra / Catálogo</span><span className="mt-1 block text-xs text-slate-500">Consultar partidas y referencias de costos.</span></span>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-blue-300" />
              </button>
              <div className="flex items-center gap-3 py-4 text-slate-500">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 bg-slate-900"><Bot className="h-5 w-5" /></span>
                <span><span className="block text-sm font-semibold">Configurar Agente IA</span><span className="mt-1 block text-xs">Disponible en una fase posterior.</span></span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
