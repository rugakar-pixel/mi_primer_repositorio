import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Download, Pencil, Plus, Trash2 } from 'lucide-react';
import { getDemoProject } from '../materiales-costos/api';
import type { Project } from '../materiales-costos/types';
import type {
  Actividad,
  ConfiguracionLaboral,
  CronogramaCalculado,
} from '../presupuesto-mo/types/budget';
import { budgetConsolidationService } from './BudgetConsolidationService';
import type { BudgetOrigin, ConsolidatedItem, ConsolidationResponse } from './types';

interface ConsolidatedProjectViewProps {
  actividades: Actividad[];
  config: ConfiguracionLaboral;
  cronograma: CronogramaCalculado;
  nombreProyecto: string;
  onAddActivity: () => void;
  onTotalChange: (total: number) => void;
  onDeleteActivity: (item: number) => void;
  onEditActivity: (actividad: Actividad) => void;
}

const filters: Array<{ value: BudgetOrigin | 'TODOS'; label: string }> = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'MANO_OBRA', label: 'Mano de Obra' },
  { value: 'MATERIAL', label: 'Materiales' },
  { value: 'EQUIPO', label: 'Equipos' },
  { value: 'SUBCONTRATO', label: 'Subcontratos' },
  { value: 'OTRO', label: 'Otros' },
];

const originLabels: Record<BudgetOrigin, string> = {
  MANO_OBRA: 'Mano de Obra',
  MATERIAL: 'Material',
  EQUIPO: 'Equipo',
  SUBCONTRATO: 'Subcontrato',
  OTRO: 'Otro',
};

function currency(value: number): string {
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'NIO',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function ConsolidatedProjectView({
  actividades,
  config,
  cronograma,
  nombreProyecto,
  onAddActivity,
  onTotalChange,
  onDeleteActivity,
  onEditActivity,
}: ConsolidatedProjectViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [result, setResult] = useState<ConsolidationResponse | null>(null);
  const [filter, setFilter] = useState<BudgetOrigin | 'TODOS'>('TODOS');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let active = true;
    getDemoProject()
      .then((demo) => {
        if (active) setProject(demo);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'No se pudo cargar el presupuesto de materiales.');
          setBusy(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!project) return;
    const controller = new AbortController();
    setBusy(true);
    setError(null);
    budgetConsolidationService
      .consolidate({ manoObra: cronograma.matriz, proyectoMateriales: project }, controller.signal)
      .then((consolidated) => {
        setResult(consolidated);
        onTotalChange(consolidated.resumen.totalGeneral);
      })
      .catch((cause: unknown) => {
        if (cause instanceof Error && cause.name === 'AbortError') return;
        setError(cause instanceof Error ? cause.message : 'No se pudo consolidar el presupuesto.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [cronograma, onTotalChange, project]);

  const visibleItems = useMemo(
    () => result?.items.filter((item) => filter === 'TODOS' || item.origen === filter) ?? [],
    [filter, result],
  );
  const laborActivities = useMemo(
    () => new Map(actividades.map((activity) => [activity.id, activity])),
    [actividades],
  );

  async function exportWorkbook(): Promise<void> {
    if (!result) return;
    try {
      const { exportarExcelPresupuesto } = await import('../presupuesto-mo/utils/excelExporter');
      await exportarExcelPresupuesto(actividades, config, nombreProyecto, result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo generar el archivo Excel.');
    }
  }

  const cards = result
    ? [
        ['Total Mano de Obra', result.resumen.manoObra],
        ['Total Materiales', result.resumen.materiales],
        ['Total Equipos', result.resumen.equipos],
        ['Total Subcontratos', result.resumen.subcontratos],
        ['Total Otros', result.resumen.otros],
        ['TOTAL GENERAL', result.resumen.totalGeneral],
      ] as const
    : [];

  function renderActions(item: ConsolidatedItem): ReactNode {
    if (item.origen !== 'MANO_OBRA') {
      return <span className="text-xs text-slate-500">Gestionar en su módulo</span>;
    }
    const activity = item.referencias.length
      ? [...laborActivities.values()].find((candidate) =>
          item.referencias.includes(`Ítem ${candidate.item}: ${candidate.descripcion}`),
        )
      : undefined;
    if (!activity) return <span className="text-xs text-slate-500">Sin acción</span>;
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => onEditActivity(activity)}
          aria-label={`Editar ${activity.descripcion}`}
          className="rounded p-1.5 text-blue-300 hover:bg-slate-700"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteActivity(activity.item)}
          aria-label={`Eliminar ${activity.descripcion}`}
          className="rounded p-1.5 text-rose-300 hover:bg-slate-700"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Presupuesto consolidado · {nombreProyecto}</h2>
          <p className="mt-1 text-sm text-slate-400">
            Una sola vista de los costos disponibles. Moneda: córdobas (NIO). Materiales de demostración
            convertidos con tasa referencial de {project?.meta.tasaCambioNIO ?? '—'} NIO/USD.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAddActivity}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-3 text-sm text-slate-200 hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" /> Agregar Mano de Obra
          </button>
          <button
            type="button"
            onClick={exportWorkbook}
            disabled={!result || busy}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-3 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Exportar Excel
          </button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}

      <section aria-label="Resumen ejecutivo" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(([label, total]) => (
          <article
            key={label}
            className={`rounded-xl border p-4 ${label === 'TOTAL GENERAL' ? 'border-blue-500/40 bg-blue-950/40' : 'border-slate-800 bg-slate-900'}`}
          >
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-2 text-lg font-bold text-white">{currency(total)}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
          <div>
            <h3 className="font-semibold text-white">Detalle consolidado</h3>
            <p className="mt-1 text-xs text-slate-400">
              {busy ? 'Actualizando desde los módulos...' : `${visibleItems.length} líneas · importes en NIO`}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Filtrar
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value as BudgetOrigin | 'TODOS')}
              className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3"
            >
              {filters.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-slate-950 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-3 py-3">Item</th>
                <th className="px-3 py-3">Origen</th>
                <th className="px-3 py-3">Descripción</th>
                <th className="px-3 py-3">U/M</th>
                <th className="px-3 py-3 text-right">Cantidad</th>
                <th className="px-3 py-3 text-right">Costo unitario</th>
                <th className="px-3 py-3 text-right">Costo total</th>
                <th className="px-3 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {visibleItems.map((item, index) => (
                <tr key={item.id} className="text-slate-300">
                  <td className="px-3 py-3 font-mono text-xs">{index + 1}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs">{originLabels[item.origen]}</span>
                  </td>
                  <td className="px-3 py-3 text-white">
                    {item.descripcion}
                    <span className="mt-1 block text-xs text-slate-500">{item.categoria}</span>
                  </td>
                  <td className="px-3 py-3">{item.unidadMedida}</td>
                  <td className="px-3 py-3 text-right">{item.cantidad.toLocaleString('es-NI')}</td>
                  <td className="px-3 py-3 text-right">{currency(item.costoUnitario)}</td>
                  <td className="px-3 py-3 text-right font-semibold text-white">{currency(item.costoTotal)}</td>
                  <td className="px-3 py-3 text-right">{renderActions(item)}</td>
                </tr>
              ))}
              {visibleItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                    {busy ? 'Cargando datos...' : 'No hay partidas para este filtro.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
          Subcontratos aparece en cero porque todavía no existe un módulo ni datos de ese origen. Herramientas,
          transporte e indirectos se muestran como “Otros”. La cotización de renta no se incluye en el total.
        </p>
      </section>
    </section>
  );
}
