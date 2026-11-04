import React, { useState } from 'react';
import { Actividad, ConfiguracionLaboral } from './types/budget';
import {
  CONFIG_NICARAGUA_2026_DEFAULT,
  ITEMS_EBAR_SUR_2_DEFAULT,
  calcularCronogramaCompleto,
} from './utils/calculator';

import { BudgetSummaryCards } from './components/BudgetSummaryCards';
import { PresupuestoMOTable } from './components/PresupuestoMOTable';
import { MemoriaFlujoTable } from './components/MemoriaFlujoTable';
import { CronogramaGraficoTable } from './components/CronogramaGraficoTable';
import { PlanillaNominaTable } from './components/PlanillaNominaTable';
import { ActivityModal } from './components/ActivityModal';
import { ConfigModal } from './components/ConfigModal';

import {
  FileSpreadsheet,
  Sliders,
  RotateCcw,
  Building2,
  HardHat,
  CalendarDays,
  BarChart3,
  Users,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';

interface PresupuestoMoModuleProps {
  mode?: 'module' | 'consolidated';
}

export function PresupuestoMoModule({ mode = 'module' }: PresupuestoMoModuleProps) {
  const [config, setConfig] = useState<ConfiguracionLaboral>(CONFIG_NICARAGUA_2026_DEFAULT);
  const [actividades, setActividades] = useState<Actividad[]>(ITEMS_EBAR_SUR_2_DEFAULT);
  const [nombreProyecto, setNombreProyecto] = useState('EBAR SUR 2');

  const [activeTab, setActiveTab] = useState<'memoria' | 'cronograma' | 'nomina'>('memoria');
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [actividadEditar, setActividadEditar] = useState<Actividad | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Recalcular dinámicamente todo el modelo
  const cronograma = calcularCronogramaCompleto(actividades, config);

  // Manipulación Dinámica de Actividades (Requisito 2)
  const handleSaveActivity = (data: Partial<Actividad>) => {
    if (data.id) {
      // Modificar existente
      setActividades((prev) =>
        prev.map((act) => (act.id === data.id ? ({ ...act, ...data } as Actividad) : act))
      );
    } else {
      // Agregar nueva actividad
      const newActividad: Actividad = {
        id: `item-${Date.now()}`,
        item: data.item || actividades.length + 1,
        descripcion: data.descripcion || 'Nueva Partida',
        unidadMedida: data.unidadMedida || 'ML',
        cantidad: data.cantidad || 1,
        rendimientoBaseOficial: data.rendimientoBaseOficial || 1,
        cantOficiales: data.cantOficiales || 1,
        cantAyudantes: data.cantAyudantes || 1,
      };
      setActividades((prev) => [...prev, newActividad]);
    }
  };

  const handleModifyPersonal = (itemNum: number, cantOficiales: number, cantAyudantes?: number) => {
    setActividades((prev) =>
      prev.map((act) => {
        if (act.item !== itemNum) return act;
        const ratio = act.ratioAyudantes ?? (act.cantOficiales > 0 ? act.cantAyudantes / act.cantOficiales : 1.0);
        const newAyu = cantAyudantes !== undefined ? cantAyudantes : Math.max(0, Math.round(cantOficiales * ratio));
        return {
          ...act,
          cantOficiales,
          cantAyudantes: newAyu,
          ratioAyudantes: cantAyudantes !== undefined && cantOficiales > 0 ? cantAyudantes / cantOficiales : ratio,
        };
      })
    );
  };

  const handleUpdateRendimientoBase = (itemNum: number, nuevoRendimiento: number) => {
    if (nuevoRendimiento <= 0) return;
    setActividades((prev) =>
      prev.map((act) =>
        act.item === itemNum ? { ...act, rendimientoBaseOficial: nuevoRendimiento } : act
      )
    );
  };

  const handleDeleteActivity = (itemNum: number) => {
    if (window.confirm(`¿Estás seguro de eliminar el Ítem #${itemNum}?`)) {
      setActividades((prev) => prev.filter((act) => act.item !== itemNum));
    }
  };

  const handleOpenEdit = (act: Actividad) => {
    setActividadEditar(act);
    setIsActivityModalOpen(true);
  };

  const handleOpenNew = () => {
    setActividadEditar(null);
    setIsActivityModalOpen(true);
  };

  const handleResetEbarSur2 = () => {
    if (window.confirm('¿Restablecer las 8 actividades base del proyecto "EBAR SUR 2" con optimización de concreto?')) {
      setActividades(ITEMS_EBAR_SUR_2_DEFAULT);
      setConfig(CONFIG_NICARAGUA_2026_DEFAULT);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const { exportarExcelPresupuesto } = await import('./utils/excelExporter');
      await exportarExcelPresupuesto(actividades, config, nombreProyecto);
    } catch (err) {
      console.error('Error exportando Excel:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const siguienteItem = actividades.length > 0 ? Math.max(...actividades.map((a) => a.item)) + 1 : 1;
  const actionButtons = (
    <>
      <button
        onClick={() => setIsConfigModalOpen(true)}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
        title="Ajustar parámetros legales y laborales"
      >
        <Sliders className="w-3.5 h-3.5 text-emerald-400" />
        <span>Parámetros FSR</span>
      </button>

      <button
        onClick={handleResetEbarSur2}
        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
        title="Restablecer el presupuesto a sus valores iniciales"
      >
        <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
        <span>Restablecer Presupuesto</span>
      </button>

      <button
        onClick={handleExportExcel}
        disabled={isExporting}
        className="px-4 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white flex items-center gap-2 shadow-md shadow-emerald-950/50 transition-all cursor-pointer disabled:opacity-50"
      >
        <FileSpreadsheet className="h-4 w-4 text-emerald-200" />
        <span>{isExporting ? 'Generando...' : 'Descargar Excel (.xlsx)'}</span>
      </button>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Banner / Navigation */}
      {mode === 'module' && <header className="border-b border-slate-800 bg-slate-900/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-900/30">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Módulo de Mano de Obra
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  Nicaragua 2026
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Normativa MITRAB / INSS 2026 • FSR 1.4532 • Programación Fin-Inicio • Exportación ExcelJS
              </p>
            </div>
          </div>

        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center space-x-1 border-t border-slate-800/80 pt-1">
          <button
            onClick={() => setActiveTab('memoria')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'memoria'
                ? 'border-indigo-500 text-indigo-400 bg-slate-800/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Memoria y Flujo Semanal</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 font-mono">
              Fin-Inicio (6 d)
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cronograma')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'cronograma'
                ? 'border-cyan-500 text-cyan-300 bg-slate-800/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Cronograma de Obra</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 font-mono">
              Gantt
            </span>
          </button>

          <button
            onClick={() => setActiveTab('nomina')}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'nomina'
                ? 'border-emerald-500 text-emerald-300 bg-slate-800/50 rounded-t-lg'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Planilla y Nómina</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 font-mono">
              INSS/IR
            </span>
          </button>

        </div>
      </header>}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {mode === 'consolidated' && (
          <div className="flex flex-wrap items-center justify-end gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
            {actionButtons}
          </div>
        )}

        {/* Project Header Bar */}
        {mode === 'module' && <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Proyecto Activo:</span>
              <input
                type="text"
                value={nombreProyecto}
                onChange={(e) => setNombreProyecto(e.target.value)}
                className="bg-slate-800/90 border border-slate-700 rounded px-2.5 py-1 text-sm font-bold text-white focus:outline-none focus:border-blue-500 font-mono"
              />
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                8 Partidas Pre-cargadas
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Optimización de Cuadrillas: <strong>1 Oficial + 2 Ayudantes</strong> en actividades de concreto (Ítems 3, 5 y 7).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenNew}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Agregar Actividad</span>
            </button>
          </div>
        </div>}

        {/* Metric Summary Cards */}
        {mode === 'module' && <BudgetSummaryCards cronograma={cronograma} />}

        {/* Tab Views */}
        {mode === 'consolidated' && (
          <PresupuestoMOTable
            cronograma={cronograma}
            onEditActivity={handleOpenEdit}
            onDeleteActivity={handleDeleteActivity}
            onAddActivity={handleOpenNew}
            nombreProyecto={nombreProyecto}
            presentation={mode === 'consolidated' ? 'consolidated' : 'module'}
          />
        )}

        {mode === 'module' && activeTab === 'memoria' && (
          <MemoriaFlujoTable
            cronograma={cronograma}
            onModifyPersonal={handleModifyPersonal}
            onEditActivity={handleOpenEdit}
            onUpdateRendimientoBase={handleUpdateRendimientoBase}
          />
        )}

        {mode === 'module' && activeTab === 'cronograma' && (
          <CronogramaGraficoTable cronograma={cronograma} />
        )}

        {mode === 'module' && activeTab === 'nomina' && (
          <PlanillaNominaTable
            actividades={actividades}
            config={config}
            nombreProyecto={nombreProyecto}
          />
        )}

      </main>

      {/* Modals */}
      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        onSave={handleSaveActivity}
        actividadEditar={actividadEditar}
        siguienteItem={siguienteItem}
      />

      <ConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={config}
        onSaveConfig={setConfig}
        onResetDefault={() => setConfig(CONFIG_NICARAGUA_2026_DEFAULT)}
      />

      {/* Footer */}
      {mode === 'module' && <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-400">
        <p>
          Ingeniería de Costos y Presupuestos de Construcción • Normativa Laboral República de Nicaragua (MITRAB / INSS 2026)
        </p>
        <p className="text-slate-400 text-[11px] mt-0.5">
          Factor Salario Real: 1.4532 (Aguinaldo 8.33%, Vacaciones 8.33%, INSS 22.50%, INATEC 2.00%, Antigüedad 4.16%) • Semanas de 6 días
        </p>
      </footer>}
    </div>
  );
}
