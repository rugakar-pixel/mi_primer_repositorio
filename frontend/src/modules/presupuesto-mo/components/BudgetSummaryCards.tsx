import React from 'react';
import { CronogramaCalculado } from '../types/budget';
import { DollarSign, Clock, Calendar, ShieldCheck, Users, Briefcase } from 'lucide-react';

interface Props {
  cronograma: CronogramaCalculado;
}

export const BudgetSummaryCards: React.FC<Props> = ({ cronograma }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total MO */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-blue-500/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Presupuesto Total MO
          </span>
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
          C$ {cronograma.costoTotalProyecto.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <p className="mt-1 text-xs text-slate-400 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
          Fórmula ejecutiva <code className="text-blue-300 font-mono text-[11px]">=SUM()</code>
        </p>
      </div>

      {/* Duración en Días */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-amber-500/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Duración de Ejecución
          </span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
          {cronograma.totalDias.toFixed(2)} <span className="text-sm font-normal text-slate-400">días</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Encadenamiento Fin-Inicio (consecutivo)
        </p>
      </div>

      {/* Semanas Calendario */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-indigo-500/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Semanas de Desembolso
          </span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-white font-mono">
          {cronograma.numSemanas} <span className="text-sm font-normal text-slate-400">semanas</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Semanas comerciales de 6 días laborables
        </p>
      </div>

      {/* FSR Nicaragua */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm hover:border-emerald-500/50 transition-all">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Factor Salario Real (FSR)
          </span>
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-bold tracking-tight text-emerald-400 font-mono">
          {cronograma.fsrMultiplicador.toFixed(4)} <span className="text-xs text-slate-400">(+45.32%)</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          MITRAB/INSS 2026 (Prestaciones y Aportes)
        </p>
      </div>
    </div>
  );
};
