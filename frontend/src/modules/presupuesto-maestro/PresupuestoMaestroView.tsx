import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Calculator, RefreshCw, Save } from 'lucide-react';
import { PresupuestoMaestro, PresupuestoMaestroPartida, platformApi } from '../plataforma/api';

interface PresupuestoMaestroViewProps {
  projectId: number;
  projectName: string;
  versionId: number;
  versionNumber: number;
  actorUserId?: number;
}

const inputClass =
  'min-h-9 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 text-right text-sm text-white';

function money(value: number, currency: string) {
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

export function PresupuestoMaestroView({
  projectId,
  projectName,
  versionId,
  versionNumber,
  actorUserId,
}: PresupuestoMaestroViewProps) {
  const [budget, setBudget] = useState<PresupuestoMaestro | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [editingPartId, setEditingPartId] = useState<number | null>(null);
  const [editingCost, setEditingCost] = useState('');

  const loadBudget = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBudget(await platformApi.masterBudget(projectId, versionId));
    } catch (reason) {
      setBudget(null);
      setError(reason instanceof Error ? reason.message : 'No se pudo cargar el Presupuesto Maestro.');
    } finally {
      setLoading(false);
    }
  }, [projectId, versionId]);

  useEffect(() => {
    void loadBudget();
  }, [loadBudget]);

  const calculate = async () => {
    setWorking(true);
    setError('');
    setFeedback('');
    try {
      setBudget(await platformApi.calculateMasterBudget(projectId, versionId, {
        motivo: 'Cálculo operativo del Presupuesto Maestro',
        actualizado_por_id: actorUserId,
      }));
      setFeedback('Presupuesto Maestro calculado y guardado.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo calcular el presupuesto.');
    } finally {
      setWorking(false);
    }
  };

  const editPart = (part: PresupuestoMaestroPartida) => {
    setEditingPartId(part.partida_id);
    setEditingCost(String(part.costo_unitario));
  };

  const savePartCost = async (event: FormEvent<HTMLFormElement>, part: PresupuestoMaestroPartida) => {
    event.preventDefault();
    setWorking(true);
    setError('');
    setFeedback('');
    try {
      const updated = await platformApi.updatePartCost(
        projectId,
        versionId,
        part.capitulo_id,
        part.partida_id,
        {
          costo_unitario: Number(editingCost),
          motivo: 'Actualización de costo persistido de Partida',
          actualizado_por_id: actorUserId,
        },
      );
      setBudget(updated);
      setEditingPartId(null);
      setFeedback('Costo actualizado y totales recalculados.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo actualizar el costo.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
              Presupuesto Maestro · Versión {versionNumber}
            </p>
            <h2 className="mt-2 text-xl font-bold text-white">{projectName}</h2>
            <p className="mt-1 text-sm text-slate-400">
              Fuente financiera de esta versión: WBS, Partidas y costos persistidos.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => void loadBudget()} disabled={working} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-700 px-3 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-50">
              <RefreshCw className="h-4 w-4" /> Recargar
            </button>
            <button type="button" onClick={() => void calculate()} disabled={working} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
              <Calculator className="h-4 w-4" /> Calcular y guardar
            </button>
          </div>
        </div>
      </header>

      {(error || feedback) && (
        <div role={error ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${error ? 'border-rose-500/30 bg-rose-950/40 text-rose-200' : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200'}`}>
          {error || feedback}
        </div>
      )}

      {loading ? (
        <p className="rounded-lg border border-slate-800 p-6 text-sm text-slate-400">Cargando Presupuesto Maestro…</p>
      ) : !budget ? (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          Esta versión todavía no tiene un Presupuesto Maestro guardado. Calcula para crear el primer corte persistido.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-5">
              <p className="text-xs uppercase tracking-wider text-blue-300">Total General</p>
              <p className="mt-2 text-2xl font-bold text-white">{money(budget.total_general, budget.moneda)}</p>
              <p className="mt-1 text-xs text-slate-400">Revisión {budget.revision} · {budget.estado}</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-wider text-slate-400">Capítulos</p>
              <p className="mt-2 text-2xl font-bold text-white">{budget.capitulos.length}</p>
              <p className="mt-1 text-xs text-slate-500">Corte persistido de la versión</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
              <p className="text-xs uppercase tracking-wider text-slate-400">Última actualización</p>
              <p className="mt-2 text-sm font-semibold text-white">{new Date(budget.actualizado_en).toLocaleString('es-NI')}</p>
              <p className="mt-1 text-xs text-slate-500">{budget.algoritmo_version}</p>
            </div>
          </div>

          <div className="space-y-4">
            {budget.capitulos.map((chapter) => (
              <article key={chapter.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
                  <h3 className="font-semibold text-white"><span className="mr-2 font-mono text-blue-300">{chapter.codigo}</span>{chapter.nombre}</h3>
                  <p className="font-semibold text-emerald-300">{money(chapter.total, budget.moneda)}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-sm">
                    <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                      <tr><th className="px-4 py-3">Partida</th><th className="px-4 py-3">Unidad</th><th className="px-4 py-3 text-right">Cantidad</th><th className="px-4 py-3">Origen</th><th className="px-4 py-3 text-right">Costo unitario</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Acción</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {chapter.partidas.map((part) => (
                        <tr key={part.id} className="text-slate-300">
                          <td className="px-4 py-3"><span className="font-mono text-slate-200">{part.codigo}</span><span className="ml-2">{part.descripcion}</span></td>
                          <td className="px-4 py-3">{part.unidad}</td>
                          <td className="px-4 py-3 text-right tabular-nums">{part.cantidad}</td>
                          <td className="px-4 py-3 text-xs text-slate-400">{part.origen_costo === 'uso_apu' ? `APU v${part.version_apu_id ?? '—'}` : 'Costo persistido'}</td>
                          <td className="px-4 py-3 text-right tabular-nums">
                            {editingPartId === part.partida_id ? (
                              <form onSubmit={(event) => void savePartCost(event, part)} className="flex justify-end gap-2">
                                <input required min="0" step="0.0001" type="number" value={editingCost} onChange={(event) => setEditingCost(event.target.value)} className={`${inputClass} max-w-32`} aria-label={`Costo ${part.codigo}`} />
                                <button disabled={working} aria-label={`Guardar costo ${part.codigo}`} className="rounded-lg bg-blue-600 px-2 text-white disabled:opacity-50"><Save className="h-4 w-4" /></button>
                              </form>
                            ) : money(part.costo_unitario, budget.moneda)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold tabular-nums text-white">{money(part.total, budget.moneda)}</td>
                          <td className="px-4 py-3"><button type="button" onClick={() => editPart(part)} className="text-xs text-blue-300 hover:text-blue-200">Editar costo</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
