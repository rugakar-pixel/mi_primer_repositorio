import { HardHat, Package, Wrench } from 'lucide-react';
import type { Actividad, CronogramaCalculado } from '../presupuesto-mo/types/budget';

interface EstructuraCostosViewProps {
  actividades: Actividad[];
  cronograma: CronogramaCalculado;
}

const moneda = (valor: number) =>
  `C$ ${valor.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function EstructuraCostosView({ actividades, cronograma }: EstructuraCostosViewProps) {
  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">Análisis de Precios Unitarios</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Estructura de Costos</h2>
        <p className="mt-2 text-sm text-slate-400">
          Mano de Obra usa los cálculos vigentes. Materiales y Equipos se muestran en un módulo de ejemplo independiente y todavía no se suman a estas actividades.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-200"><HardHat className="h-4 w-4" /> Mano de Obra</div>
          <p className="mt-3 text-2xl font-bold text-white">{moneda(cronograma.costoTotalProyecto)}</p>
          <p className="mt-1 text-xs text-slate-400">Costo calculado para las actividades actuales</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300"><Package className="h-4 w-4" /> Materiales</div>
          <p className="mt-3 text-2xl font-bold text-white">{moneda(0)}</p>
          <p className="mt-1 text-xs text-amber-300">Aún no vinculado a este APU</p>
        </article>
        <article className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-300"><Wrench className="h-4 w-4" /> Maquinaria y Equipos</div>
          <p className="mt-3 text-2xl font-bold text-white">{moneda(0)}</p>
          <p className="mt-1 text-xs text-amber-300">Aún no vinculado a este APU</p>
        </article>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 px-5 py-4">
          <h3 className="font-semibold text-white">Detalle de Mano de Obra</h3>
          <p className="mt-1 text-xs text-slate-400">Datos heredados en tiempo real del módulo de MO</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-wide text-slate-400">
              <tr><th className="px-5 py-3">Código</th><th className="px-5 py-3">Descripción</th><th className="px-5 py-3">Unidad</th><th className="px-5 py-3 text-right">Rendimiento</th><th className="px-5 py-3 text-right">MO unitario</th><th className="px-5 py-3 text-right">MO total</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {cronograma.matriz.map((detalle) => (
                <tr key={detalle.actividad.id} className="text-slate-300">
                  <td className="px-5 py-3 font-mono text-xs text-blue-300">{detalle.actividad.item}</td>
                  <td className="px-5 py-3 text-white">{detalle.actividad.descripcion}</td>
                  <td className="px-5 py-3">{detalle.actividad.unidadMedida}</td>
                  <td className="px-5 py-3 text-right">{detalle.rendimientoTotal.toLocaleString('es-NI')}</td>
                  <td className="px-5 py-3 text-right">{moneda(detalle.costoUnitario)}</td>
                  <td className="px-5 py-3 text-right font-medium text-white">{moneda(detalle.costoTotal)}</td>
                </tr>
              ))}
              {actividades.length === 0 && <tr><td className="px-5 py-8 text-center text-slate-400" colSpan={6}>No hay actividades de Mano de Obra.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
