import { useState } from 'react';
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

interface ProjectDashboardProps {
  username: string;
  consolidatedTotal: number | null;
  onOpenProject: () => void;
  onOpenCatalog: () => void;
  onLogout: () => void;
}

const quickActions = [
  {
    id: 'create',
    title: 'Crear Nuevo Proyecto',
    description: 'Iniciar una nueva obra y su presupuesto.',
    icon: Plus,
    message: 'La creación de proyectos estará disponible en una siguiente fase.',
  },
  {
    id: 'catalog',
    title: 'Base de Datos Maestra / Catálogo',
    description: 'Consultar partidas y referencias de costos.',
    icon: Database,
    message: 'El catálogo maestro estará disponible en una siguiente fase.',
  },
  {
    id: 'agent',
    title: 'Configurar Agente IA',
    description: 'Preparar el asistente presupuestista.',
    icon: Bot,
    message: 'La configuración del agente estará disponible en una siguiente fase.',
  },
];

export function ProjectDashboard({
  username,
  consolidatedTotal,
  onOpenProject,
  onOpenCatalog,
  onLogout,
}: ProjectDashboardProps) {
  const [feedback, setFeedback] = useState('');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Motor de Presupuesto</p>
              <p className="text-xs text-slate-400">Gestión de proyectos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 sm:inline">{username}</span>
            <button
              type="button"
              onClick={onLogout}
              className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-3 text-sm text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
            >
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
          <p className="mt-2 text-sm text-slate-400">Selecciona un proyecto para continuar con su gestión.</p>
        </div>

        {feedback && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 flex items-start gap-3 rounded-lg border border-blue-500/30 bg-blue-950/40 px-4 py-3 text-sm text-blue-200"
          >
            <RadioTower className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />
            {feedback}
          </div>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.9fr)]">
          <section aria-labelledby="active-projects-title">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="active-projects-title" className="text-base font-semibold text-white">Proyectos Activos</h2>
              <span className="text-xs text-slate-500">2 proyectos</span>
            </div>

            <div className="space-y-4">
              <article className="rounded-lg border border-blue-500/30 bg-slate-900/80 p-5 shadow-lg shadow-blue-950/10 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-300">
                      <RadioTower className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">EBAR SUR 2</h3>
                        <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                          En gestión
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">Estación de bombeo · Nicaragua</p>
                    </div>
                  </div>
                  <div className="min-w-40 sm:text-right">
                    <p className="text-xs text-slate-500">Total del presupuesto consolidado</p>
                    <p className="mt-1 font-mono text-lg font-semibold text-white">
                      {consolidatedTotal === null
                        ? 'Calculando...'
                        : new Intl.NumberFormat('es-NI', {
                            style: 'currency',
                            currency: 'NIO',
                          }).format(consolidatedTotal)}
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
                  <p className="text-xs text-slate-500">Presupuesto vigente del proyecto</p>
                  <button
                    type="button"
                    onClick={onOpenProject}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    Entrar a Gestionar
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </article>

              <article className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-300">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-white">Edificio Terrazas Central</h3>
                        <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                          En preparación
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-400">Proyecto de ejemplo · Presupuesto pendiente</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedback('Edificio Terrazas Central aún no tiene un presupuesto vinculado.')}
                    className="min-h-10 rounded-lg border border-slate-700 px-3 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
                  >
                    Ver ficha
                  </button>
                </div>
              </article>
            </div>
          </section>

          <aside aria-labelledby="quick-actions-title">
            <div className="mb-4">
              <h2 id="quick-actions-title" className="text-base font-semibold text-white">Accesos Rápidos y Configuración</h2>
              <p className="mt-1 text-xs text-slate-500">Herramientas del espacio de trabajo</p>
            </div>
            <div className="divide-y divide-slate-800 border-y border-slate-800">
              {quickActions.map(({ id, title, description, icon: Icon, message }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => (id === 'catalog' ? onOpenCatalog() : setFeedback(message))}
                  className="group flex w-full items-center gap-3 py-4 text-left transition-colors hover:bg-slate-900/70"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-blue-300 transition-colors group-hover:border-blue-500/40 group-hover:bg-blue-500/10">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-slate-200">{title}</span>
                    <span className="mt-1 block text-xs text-slate-500">{description}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition-colors group-hover:text-blue-300" />
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}