import { useState } from 'react';
import { CalendarDays, ClipboardList, FileBarChart2, HardHat, Layers3, LayoutDashboard, LogOut, Package, TableProperties } from 'lucide-react';
import { PresupuestoMoModule } from '../modules/presupuesto-mo/PresupuestoMoModule';
import { MaterialesCostosModule } from '../modules/materiales-costos/MaterialesCostosModule';
import { AccessScreen } from './AccessScreen';
import { CatalogoMaestroView } from './CatalogoMaestroView';
import { ProjectDashboard } from './ProjectDashboard';

const modules = [
  { id: 'labor', label: 'Mano de Obra', icon: HardHat, available: true },
  { id: 'apu', label: 'Estructura de Costos / APU', icon: ClipboardList, available: true },
  { id: 'materials', label: 'Materiales y costos', icon: Package, available: true },
  { id: 'equipment', label: 'Herramientas y Equipos', icon: Layers3, available: false },
  { id: 'reports', label: 'Reportes', icon: FileBarChart2, available: false },
] as const;

type WorkspaceSection = 'consolidated' | 'labor' | 'apu' | 'materials' | 'equipment' | 'reports';
type WorkspaceScreen = 'dashboard' | 'module' | 'catalog';

export default function App() {
  const [user, setUser] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');
  const [activeSection, setActiveSection] = useState<WorkspaceSection>('consolidated');
  const [screen, setScreen] = useState<WorkspaceScreen>('dashboard');
  const [consolidatedTotal, setConsolidatedTotal] = useState<number | null>(null);

  const handleLogin = (username: string, password: string) => {
    if (username.trim() !== 'Usuario' || password !== 'Contraseña') {
      setLoginError('El usuario o la contraseña no coinciden.');
      return;
    }

    setLoginError('');
    setActiveSection('consolidated');
    setScreen('dashboard');
    setUser(username.trim());
  };

  if (!user) {
    return <AccessScreen onLogin={handleLogin} error={loginError} />;
  }

  return (
    <>
      <div className={screen === 'dashboard' ? 'block' : 'hidden'}>
        <ProjectDashboard
          username={user}
          consolidatedTotal={consolidatedTotal}
          onOpenProject={() => {
            setActiveSection('consolidated');
            setScreen('module');
          }}
          onOpenCatalog={() => setScreen('catalog')}
          onLogout={() => setUser(null)}
        />
      </div>

      {screen === 'catalog' && <CatalogoMaestroView onBack={() => setScreen('dashboard')} />}

      <div className={screen === 'module' ? 'min-h-screen bg-slate-950 text-slate-100 lg:flex' : 'hidden'}>
      <aside className="border-b border-slate-800 bg-slate-900 lg:flex lg:min-h-screen lg:w-64 lg:shrink-0 lg:flex-col lg:border-b-0 lg:border-r">
        <button
          type="button"
          onClick={() => setScreen('dashboard')}
          title="Volver al Tablero Central"
          className="flex w-full items-center gap-3 border-b border-slate-800 px-5 py-5 text-left transition-colors hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Motor de Presupuesto</p>
            <p className="text-xs text-slate-400">Gestión de proyectos</p>
          </div>
        </button>

        <nav aria-label="Navegación del proyecto" className="p-4">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Presupuesto general
          </p>
          <button
            type="button"
            onClick={() => setActiveSection('consolidated')}
            aria-current={activeSection === 'consolidated' ? 'page' : undefined}
            className={`mb-5 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              activeSection === 'consolidated'
                ? 'bg-blue-600/15 font-semibold text-blue-300 ring-1 ring-inset ring-blue-500/30'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <TableProperties className="h-4 w-4 shrink-0" />
            <span>Consolidado</span>
          </button>

          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Módulos del proyecto
          </p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {modules.map(({ id, label, icon: Icon, available }) => (
              <button
                key={id}
                type="button"
                disabled={!available}
                onClick={() => available && setActiveSection(id)}
                aria-current={activeSection === id ? 'page' : undefined}
                title={available ? label : 'Módulo en preparación'}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                activeSection === id
                  ? 'bg-blue-600/15 font-semibold text-blue-300 ring-1 ring-inset ring-blue-500/30'
                  : available
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'cursor-not-allowed text-slate-500'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
                {!available && (
                  <span className="ml-auto hidden text-[10px] text-slate-600 lg:inline">Próximamente</span>
                )}
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-auto flex items-center justify-between border-t border-slate-800 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] text-slate-500">Sesión de diseño</p>
            <p className="truncate text-sm font-medium text-slate-200">{user}</p>
          </div>
          <button
            type="button"
            onClick={() => setUser(null)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Salir
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="border-b border-slate-800 bg-slate-900/50 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CalendarDays className="h-4 w-4 text-blue-400" />
            {activeSection === 'consolidated'
              ? 'Presupuesto del proyecto'
              : activeSection === 'apu'
                ? 'Análisis de Precios Unitarios'
                : activeSection === 'materials'
                  ? 'Costos de obra'
                  : 'Módulo 1'}
          </div>
          <h1 className="mt-1 text-xl font-bold text-white">
            {activeSection === 'consolidated'
              ? 'Consolidado del proyecto'
              : activeSection === 'apu'
                ? 'Estructura de Costos / APU'
                : activeSection === 'materials'
                  ? 'Materiales y costos de obra'
                  : 'Módulo de Mano de Obra'}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            {activeSection === 'apu'
              ? 'Consulta el costo de Mano de Obra de las actividades actuales y el espacio reservado para Materiales y Maquinaria/Equipos.'
              : activeSection === 'consolidated'
                ? 'Consulta el presupuesto consolidado de Mano de Obra y los costos disponibles de materiales, equipos y otros.'
                : activeSection === 'materials'
                  ? 'Consulta el ejemplo integrado de materiales, renta de equipos, herramientas y costos indirectos.'
                  : 'Gestiona las partidas, el flujo semanal, el cronograma y la planilla de mano de obra.'}
          </p>
        </div>
        <div className={`${activeSection === 'materials' ? 'hidden' : 'block'} px-3 py-5 sm:px-6 lg:px-8`}>
          <PresupuestoMoModule
            mode={activeSection === 'apu' ? 'apu' : activeSection === 'consolidated' ? 'consolidated' : 'module'}
            onConsolidatedTotalChange={setConsolidatedTotal}
          />
        </div>
        {activeSection === 'materials' && (
          <div className="px-3 py-5 sm:px-6 lg:px-8">
          <MaterialesCostosModule onBackToDashboard={() => setScreen('dashboard')} />
          </div>
        )}
      </main>
      </div>
    </>
  );
}
