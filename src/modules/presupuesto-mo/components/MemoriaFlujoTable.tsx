import React, { useState } from 'react';
import { CronogramaCalculado, Actividad } from '../types/budget';
import { Code2, Calendar, TrendingUp, SlidersHorizontal, ShieldCheck } from 'lucide-react';

interface Props {
  cronograma: CronogramaCalculado;
  onModifyPersonal: (item: number, cantOficiales: number, cantAyudantes?: number) => void;
  onEditActivity: (actividad: Actividad) => void;
  onUpdateRendimientoBase?: (item: number, nuevoRendimiento: number) => void;
}

export const MemoriaFlujoTable: React.FC<Props> = ({
  cronograma,
  onModifyPersonal,
  onEditActivity,
  onUpdateRendimientoBase,
}) => {
  const [showFormulas, setShowFormulas] = useState(false);
  const numSemanas = cronograma.numSemanas;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      {/* Header Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              Memoria y Flujo Semanal (Sucesión Fin-Inicio)
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-900/60 text-indigo-300 rounded border border-indigo-700/50">
              Excel Sheet: Memoria y Flujo Semanal
            </span>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-950 text-emerald-400 rounded border border-emerald-700/50 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Paradoja del Costo Resuelta
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cálculo de rendimiento conjunto, calibración dinámica en campo y distribución de raya semanal en jornadas de 6 días.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
              showFormulas
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            {showFormulas ? 'Ocultar Fórmulas Excel' : 'Ver Fórmulas Nativas Excel'}
          </button>
        </div>
      </div>

      {/* Flujo Summary Ribbon */}
      <div className="bg-slate-950/70 p-3 border-b border-slate-800/80 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>Distribución por Sábados de Raya:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {cronograma.totalesPorSemana.map((monto, idx) => (
            <div
              key={idx}
              className="px-3 py-1 rounded bg-slate-800/80 border border-slate-700 flex items-center gap-2 font-mono"
            >
              <span className="text-slate-400 font-sans text-[11px]">Semana {idx + 1}:</span>
              <span className="text-emerald-400 font-semibold">
                C$ {monto.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[#1F497D] text-white text-[11px] uppercase font-semibold tracking-wider">
              <th className="py-3 px-2 text-center border-r border-blue-800/60 w-12">ITEM</th>
              <th className="py-3 px-3 border-r border-blue-800/60 min-w-[240px]">DESCRIPCIÓN</th>
              <th className="py-3 px-2 text-center border-r border-blue-800/60 w-16">U/M</th>
              <th className="py-3 px-3 text-right border-r border-blue-800/60 w-24">CANTIDAD</th>
              <th className="py-3 px-3 text-right border-r border-blue-800/60 w-28 bg-blue-900/40">
                <div className="flex items-center justify-end gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-amber-300" />
                  <span>REND BASE</span>
                </div>
              </th>
              <th className="py-3 px-2 text-center border-r border-blue-800/60 w-28 bg-blue-900/80">CANT OFI</th>
              <th className="py-3 px-2 text-center border-r border-blue-800/60 w-28 bg-blue-900/80">CANT AYU</th>
              <th className="py-3 px-3 text-right border-r border-blue-800/60 w-28">REND TOTAL</th>
              <th className="py-3 px-3 text-right border-r border-blue-800/60 w-24">DÍAS REQ</th>
              <th className="py-3 px-3 text-right border-r border-blue-800/60 w-28">COSTO DIARIO</th>
              {Array.from({ length: numSemanas }, (_, w) => (
                <th
                  key={w}
                  className="py-3 px-3 text-right border-r border-blue-800/60 min-w-[125px] bg-[#1a3d69]"
                >
                  PAGO SEMANA {w + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono text-xs">
            {cronograma.matriz.map((item, idx) => {
              const act = item.actividad;
              const excelRowIndex = 6 + idx; // In Excel ws2, starts at row 6
              const isEven = idx % 2 === 1;
              const ratio = act.ratioAyudantes ?? (act.cantOficiales > 0 ? act.cantAyudantes / act.cantOficiales : 1.0);

              return (
                <tr
                  key={act.id || act.item}
                  className={`hover:bg-blue-950/30 transition-colors ${
                    isEven ? 'bg-slate-900/60' : 'bg-slate-900/20'
                  }`}
                >
                  <td className="py-2 px-2 text-center text-slate-300 font-bold border-r border-slate-800">
                    {act.item}
                  </td>
                  <td className="py-2 px-3 text-slate-200 font-sans text-xs border-r border-slate-800">
                    <div className="flex items-center justify-between gap-1">
                      <span>{act.descripcion}</span>
                      {ratio === 2.0 && (
                        <span className="px-1.5 py-0.2 text-[9px] font-sans font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
                          Ratio 2.0 Ayu/Ofi
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center text-slate-400 font-semibold border-r border-slate-800">
                    {act.unidadMedida}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-200 border-r border-slate-800">
                    {showFormulas ? (
                      <span className="text-slate-400 font-mono text-[10px]">
                        ='Presupuesto MO'!D{5 + idx}
                      </span>
                    ) : (
                      act.cantidad.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    )}
                  </td>

                  {/* RENDIMIENTO BASE DESAMARRADO Y CALIBRABLE */}
                  <td className="py-1 px-2 text-right text-slate-300 border-r border-slate-800 bg-slate-950/20">
                    {onUpdateRendimientoBase ? (
                      <input
                        type="number"
                        step="0.05"
                        min="0.1"
                        value={act.rendimientoBaseOficial}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val > 0) onUpdateRendimientoBase(act.item, val);
                        }}
                        className="w-18 bg-slate-800/80 border border-slate-700 hover:border-blue-500 focus:border-blue-500 rounded px-1.5 py-0.5 text-right text-white font-mono text-xs focus:outline-none"
                        title="Calibrar rendimiento base en campo"
                      />
                    ) : (
                      act.rendimientoBaseOficial.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    )}
                  </td>

                  {/* CANT OFICIALES (Acelera ejecución manteniendo costo total constante mediante ratio técnico) */}
                  <td className="py-2 px-1 text-center border-r border-slate-800 bg-slate-950/30">
                    <div className="flex items-center justify-center gap-1 font-sans">
                      <button
                        onClick={() => {
                          const newOfi = Math.max(1, act.cantOficiales - 1);
                          const newAyu = Math.round(newOfi * ratio);
                          onModifyPersonal(act.item, newOfi, newAyu);
                        }}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                        title="Reducir Oficiales (Preserva ratio de ayudantes)"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-blue-300 font-mono text-xs">
                        {act.cantOficiales}
                      </span>
                      <button
                        onClick={() => {
                          const newOfi = act.cantOficiales + 1;
                          const newAyu = Math.round(newOfi * ratio);
                          onModifyPersonal(act.item, newOfi, newAyu);
                        }}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                        title="Aumentar Oficiales (Acelera plazo sin alterar costo total)"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* CANT AYUDANTES con control interactivo */}
                  <td className="py-2 px-1 text-center border-r border-slate-800 bg-slate-950/30">
                    <div className="flex items-center justify-center gap-1 font-sans">
                      <button
                        onClick={() => onModifyPersonal(act.item, act.cantOficiales, Math.max(0, act.cantAyudantes - 1))}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                        title="Reducir Ayudantes de soporte"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-bold text-blue-300 font-mono text-xs">
                        {act.cantAyudantes}
                      </span>
                      <button
                        onClick={() => onModifyPersonal(act.item, act.cantOficiales, act.cantAyudantes + 1)}
                        className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center text-xs"
                        title="Aumentar Ayudantes de soporte"
                      >
                        +
                      </button>
                    </div>
                  </td>

                  {/* REND TOTAL (=E*F) */}
                  <td className="py-2 px-3 text-right text-slate-200 border-r border-slate-800">
                    {showFormulas ? (
                      <span className="text-amber-400 font-mono text-[10px] bg-amber-950/40 px-1 py-0.5 rounded">
                        =E{excelRowIndex}*F{excelRowIndex}
                      </span>
                    ) : (
                      item.rendimientoTotal.toFixed(2)
                    )}
                  </td>

                  {/* DÍAS REQUERIDOS (=D/H) */}
                  <td className="py-2 px-3 text-right text-amber-300 font-semibold border-r border-slate-800">
                    {showFormulas ? (
                      <span className="text-amber-400 font-mono text-[10px] bg-amber-950/40 px-1 py-0.5 rounded">
                        =D{excelRowIndex}/H{excelRowIndex}
                      </span>
                    ) : (
                      item.diasRequeridos.toFixed(2)
                    )}
                  </td>

                  {/* COSTO DIARIO */}
                  <td className="py-2 px-3 text-right text-slate-200 border-r border-slate-800">
                    {showFormulas ? (
                      <span className="text-slate-400 font-mono text-[9px]">
                        =(F{excelRowIndex}*{cronograma.costoRealDiarioOficial.toFixed(0)})+(G{excelRowIndex}*{cronograma.costoRealDiarioAyudante.toFixed(0)})
                      </span>
                    ) : (
                      `C$ ${item.costoDiario.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                  </td>

                  {/* FLUJOS SEMANALES */}
                  {Array.from({ length: numSemanas }, (_, w) => {
                    const monto = item.pagosSemanales[w] || 0;
                    return (
                      <td
                        key={w}
                        className={`py-2 px-3 text-right border-r border-slate-800 ${
                          monto > 0 ? 'text-white font-medium bg-blue-950/20' : 'text-slate-600'
                        }`}
                      >
                        {monto > 0 ? (
                          `C$ ${monto.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        ) : (
                          '-'
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* Total Row */}
            <tr className="bg-[#1F497D]/30 border-t-2 border-b-4 border-double border-blue-500 font-bold">
              <td
                colSpan={8}
                className="py-3 px-4 text-right text-white uppercase tracking-wider font-sans text-xs border-r border-slate-800"
              >
                TOTALES DEL PROYECTO / RAYA SEMANAL:
              </td>
              <td className="py-3 px-3 text-right text-amber-400 text-xs font-mono border-r border-slate-800 bg-[#1F497D]/40">
                {showFormulas ? (
                  <span className="text-amber-300 font-mono text-[10px] bg-amber-950/60 px-1 py-0.5 rounded">
                    =SUM(I6:I{5 + cronograma.matriz.length})
                  </span>
                ) : (
                  `${cronograma.totalDias.toFixed(2)} d`
                )}
              </td>
              <td className="py-3 px-3 border-r border-slate-800 bg-[#1F497D]/20"></td>
              {cronograma.totalesPorSemana.map((totSem, w) => {
                const colLetter = String.fromCharCode(75 + w); // Col K is 11
                const startRow = 6;
                const endRow = 5 + cronograma.matriz.length;

                return (
                  <td
                    key={w}
                    className="py-3 px-3 text-right text-emerald-400 text-xs font-mono border-r border-slate-800 bg-[#1F497D]/50"
                  >
                    {showFormulas ? (
                      <span className="text-amber-300 font-mono text-[10px] bg-amber-950/60 px-1 py-0.5 rounded">
                        =SUM({colLetter}{startRow}:{colLetter}{endRow})
                      </span>
                    ) : (
                      `C$ ${totSem.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Timeline Gantt Preview */}
      <div className="p-4 bg-slate-950 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Cronograma Gráfico Secuencial (Fin-Inicio)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            {cronograma.totalDias.toFixed(2)} días continuos acumulados
          </span>
        </div>

        <div className="space-y-2">
          {cronograma.matriz.map((item) => {
            const act = item.actividad;
            const leftPct = cronograma.totalDias > 0 ? (item.diaInicio / cronograma.totalDias) * 100 : 0;
            const widthPct = cronograma.totalDias > 0 ? (item.diasRequeridos / cronograma.totalDias) * 100 : 0;

            return (
              <div key={act.id || act.item} className="flex items-center gap-2 text-xs">
                <span className="w-8 font-mono text-slate-400 font-bold shrink-0 text-right">
                  #{act.item}
                </span>
                <div className="relative flex-1 h-6 bg-slate-800/60 rounded overflow-hidden border border-slate-700/60">
                  <div
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded flex items-center px-2 shadow-sm"
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.max(widthPct, 1.5)}%`,
                    }}
                  >
                    <span className="text-[10px] text-white font-mono font-medium truncate">
                      {item.diasRequeridos.toFixed(2)} d (Día {item.diaInicio.toFixed(1)} a {item.diaFin.toFixed(1)})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
