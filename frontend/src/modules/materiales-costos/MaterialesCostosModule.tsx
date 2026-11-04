import { useEffect, useMemo, useState } from 'react';
import { calculateProject, getDemoProject, quoteEquipmentRental } from './api';
import type { Calculation, Currency, Project, RentalQuote } from './types';

interface MaterialesCostosModuleProps {
  onBackToDashboard: () => void;
}

function formatCurrency(value: number, currency: Currency, exchangeRate: number): string {
  const amount = currency === 'NIO' ? value * exchangeRate : value;
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function MaterialesCostosModule({
  onBackToDashboard,
}: MaterialesCostosModuleProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [calculation, setCalculation] = useState<Calculation | null>(null);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [equipmentId, setEquipmentId] = useState('');
  const [modality, setModality] = useState<RentalQuote['modalidad']>('dia');
  const [periods, setPeriods] = useState(1);
  const [units, setUnits] = useState(1);
  const [quote, setQuote] = useState<RentalQuote | null>(null);

  const exchangeRate = project?.meta.tasaCambioNIO ?? 36.8;
  const currentEquipment = useMemo(
    () => project?.tarifasEquipos.find((item) => item.id === equipmentId),
    [project, equipmentId],
  );

  useEffect(() => {
    let active = true;
    setBusy(true);
    setError(null);
    getDemoProject()
      .then(async (demo) => {
        if (!active) return;
        setProject(demo);
        setEquipmentId(demo.tarifasEquipos[0]?.id ?? '');
        setCurrency(demo.meta.moneda);
        const result = await calculateProject(demo);
        if (active) setCalculation(result);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'No se pudo cargar el módulo.');
        }
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function recalculate(): Promise<void> {
    if (!project) return;
    setError(null);
    setBusy(true);
    try {
      setCalculation(await calculateProject(project));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo calcular el presupuesto.');
    } finally {
      setBusy(false);
    }
  }

  async function calculateRental(): Promise<void> {
    if (!equipmentId) return;
    setError(null);
    try {
      setQuote(await quoteEquipmentRental(
        equipmentId,
        modality,
        periods,
        units,
        exchangeRate,
      ));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo calcular la renta.');
    }
  }

  if (busy && !calculation) {
    return <p className="py-12 text-center text-slate-400">Cargando el módulo de costos...</p>;
  }
  if (!project || !calculation) {
    return (
      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
        <p className="text-rose-300" role="alert">
          {error ?? 'No se pudo cargar el proyecto de ejemplo.'}
        </p>
        <button
          type="button"
          onClick={onBackToDashboard}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Volver al tablero
        </button>
      </section>
    );
  }

  const total = (value: number) => formatCurrency(value, currency, exchangeRate);
  const metrics: Array<[string, number]> = [
    ['Materiales', calculation.costo_materiales],
    ['Equipos', calculation.costo_equipos],
    ['Herramientas', calculation.costo_herramientas],
    ['Transporte', calculation.costo_transporte],
    ['Otros costos', calculation.otros_costos],
    ['Costos indirectos', calculation.costo_indirecto_total],
    ['Total de referencia', calculation.gran_total],
  ];

  const minimumRate = modality === 'dia'
    ? currentEquipment?.costoDiarioMinUSD
    : modality === 'semana'
      ? currentEquipment?.costoSemanalMinUSD
      : currentEquipment?.costoMensualMinUSD;
  const maximumRate = modality === 'dia'
    ? currentEquipment?.costoDiarioMaxUSD
    : modality === 'semana'
      ? currentEquipment?.costoSemanalMaxUSD
      : currentEquipment?.costoMensualMaxUSD;

  return (
    <main className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
            Módulo de demostración · costos sin Mano de Obra
          </p>
          <h2 className="mt-1 text-xl font-bold text-white">{project.meta.nombre}</h2>
          <p className="mt-1 text-sm text-slate-400">
            Materiales, equipos, herramientas, transporte y costos indirectos.
            Los precios de este ejemplo son referenciales y están en USD.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Moneda de visualización
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value === 'NIO' ? 'NIO' : 'USD')}
              className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-white"
            >
              <option value="USD">USD</option>
              <option value="NIO">NIO</option>
            </select>
          </label>
          <button
            type="button"
            onClick={onBackToDashboard}
            className="min-h-10 rounded-lg border border-slate-700 px-3 text-sm text-slate-300 hover:bg-slate-800"
          >
            Volver al tablero
          </button>
        </div>
      </header>

      {error && <p className="rounded-lg border border-rose-900 bg-rose-950/50 p-3 text-sm text-rose-200" role="alert">{error}</p>}

      <section aria-label="Resumen de costos" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, amount]) => (
          <article key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-2 text-lg font-bold text-white">{total(amount)}</p>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-5">
          <div>
            <h3 className="font-semibold text-white">Materiales consolidados</h3>
            <p className="mt-1 text-xs text-slate-400">
              Cantidades agrupadas por material y unidad a partir de las actividades del ejemplo.
            </p>
          </div>
          <button
            type="button"
            onClick={recalculate}
            disabled={busy}
            className="min-h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {busy ? 'Calculando...' : 'Recalcular'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-950 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Material</th>
                <th className="px-4 py-3">Familia</th>
                <th className="px-4 py-3">Unidad</th>
                <th className="px-4 py-3 text-right">Cantidad</th>
                <th className="px-4 py-3 text-right">Precio unitario</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {calculation.materiales_consolidados.map((material) => (
                <tr key={`${material.nombre}:${material.unidad}`} className="text-slate-300">
                  <td className="px-4 py-3">{material.nombre}</td>
                  <td className="px-4 py-3">{material.categoria}</td>
                  <td className="px-4 py-3">{material.unidad}</td>
                  <td className="px-4 py-3 text-right">{material.cantidad_total.toLocaleString('es-NI')}</td>
                  <td className="px-4 py-3 text-right">{total(material.costo_unitario_estimado)}</td>
                  <td className="px-4 py-3 text-right font-medium text-white">{total(material.costo_total_estimado)}</td>
                </tr>
              ))}
              {calculation.materiales_consolidados.length === 0 && (
                <tr><td className="px-4 py-8 text-center text-slate-400" colSpan={6}>No hay materiales en el proyecto.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
        <div>
          <h3 className="font-semibold text-white">Simulador de renta de equipos</h3>
          <p className="mt-1 text-sm text-slate-400">
            La cotización es referencial y no se suma automáticamente al presupuesto.
          </p>
        </div>
        <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="grid gap-1 text-xs text-slate-400">
            Equipo
            <select
              value={equipmentId}
              onChange={(event) => setEquipmentId(event.target.value)}
              className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            >
              {project.tarifasEquipos.map((item) => (
                <option key={item.id} value={item.id}>{item.equipo}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs text-slate-400">
            Tarifa
            <select
              value={modality}
              onChange={(event) => {
                const value = event.target.value;
                if (value === 'dia' || value === 'semana' || value === 'mes') setModality(value);
              }}
              className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            >
              <option value="dia">Diaria</option>
              <option value="semana">Semanal</option>
              <option value="mes">Mensual</option>
            </select>
          </label>
          <label className="grid gap-1 text-xs text-slate-400">
            Períodos
            <input
              min="0.01"
              step="0.5"
              type="number"
              value={periods}
              onChange={(event) => setPeriods(Number(event.target.value))}
              className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </label>
          <label className="grid gap-1 text-xs text-slate-400">
            Unidades de equipo
            <input
              min="0.01"
              step="1"
              type="number"
              value={units}
              onChange={(event) => setUnits(Number(event.target.value))}
              className="min-h-10 rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white"
            />
          </label>
          <button
            type="button"
            onClick={calculateRental}
            disabled={!currentEquipment}
            className="min-h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Cotizar
          </button>
        </div>
        {currentEquipment && minimumRate !== undefined && maximumRate !== undefined && (
          <p className="text-sm text-slate-300">
            Rango {modality}: {total(minimumRate)} – {total(maximumRate)}
          </p>
        )}
        {quote && (
          <p className="rounded-lg border border-emerald-900 bg-emerald-950/40 p-3 text-sm font-medium text-emerald-200">
            {quote.equipo}: {formatCurrency(quote.total_usd, 'USD', exchangeRate)}
            {' · '}
            {formatCurrency(quote.total_nio, 'NIO', exchangeRate)}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-300">
        <h3 className="mb-2 font-semibold text-white">Composición de costos directos</h3>
        <p>
          Materiales {total(calculation.costo_materiales)} · Equipos {total(calculation.costo_equipos)}
          {' · '}Herramientas {total(calculation.costo_herramientas)} · Transporte {total(calculation.costo_transporte)}
          {' · '}Otros {total(calculation.otros_costos)}
        </p>
        <p className="mt-2">
          Administración {total(calculation.administracion)} · Imprevistos {total(calculation.imprevistos)}
          {' · '}Utilidad {total(calculation.utilidad)} · IVA sobre utilidad {total(calculation.iva_utilidad)}
        </p>
      </section>
    </main>
  );
}
