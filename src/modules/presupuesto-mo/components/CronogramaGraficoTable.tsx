import React, { useState } from 'react';
import { CronogramaCalculado } from '../types/budget';
import { BarChart3, Code2, Clock, CheckCircle2 } from 'lucide-react';

interface Props {
  cronograma: CronogramaCalculado;
}

export const CronogramaGraficoTable: React.FC<Props> = ({ cronograma }) => {
  const [showFormulas, setShowFormulas] = useState(false);
  const numSemanas = cronograma.numSemanas;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      {/* Header Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              Cronograma de Obra (Diagrama de Gantt Fin-Inicio)
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-900/60 text-blue-300 rounded border border-blue-700/50">
              Excel Sheet: Cronograma Gráfico
            </span>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-950 text-indigo-300 rounded border border-indigo-700/50 flex items-center gap-1">
              <Clock className="w-3 h-3 text-indigo-400" />
              Semanas de 6 Días Laborables
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Secuencia estricta Fin-Inicio basada en acumulación de duraciones. Celdas activas resaltadas en azul claro corporativo (#D9E1F2).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFormulas(!showFormulas)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
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

      {/* Info Ribbon */}
      <div className="bg-slate-950/70 p-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 text-slate-300">
          <BarChart3 className="w-4 h-4 text-blue-400" />
          <span>
            Duración total del proyecto: <strong className="text-emerald-400 font-mono">{cronograma.totalDias.toFixed(2)} días</strong> (~{numSemanas} semanas de desembolso)
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#D9E1F2] border border-blue-400 inline-block"></span>
            <span className="text-slate-300">Semana con actividad activa (Fondo #D9E1F2)</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700 inline-block"></span>
            <span>Sin ejecución</span>
          </span>
        </div>
      </div>

      {/* Gantt Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#1F497D] text-white uppercase text-[11px] tracking-wider border-b border-slate-800">
              <th className="py-2.5 px-3 text-center font-bold border-r border-blue-900/60 w-16">ITEM</th>
              <th className="py-2.5 px-4 text-left font-bold border-r border-blue-900/60 min-w-[280px]">DESCRIPCIÓN</th>
              <th className="py-2.5 px-3 text-center font-bold border-r border-blue-900/60 w-32 bg-[#173860]">
                DÍAS REQUERIDOS
              </th>
              {Array.from({ length: numSemanas }, (_, i) => (
                <th
                  key={i}
                  className="py-2.5 px-2 text-center font-bold border-r border-blue-900/60 min-w-[100px] w-28 bg-[#1B3F6E]"
                >
                  SEMANA {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {cronograma.matriz.map((det, index) => {
              const act = det.actividad;
              const excelRowMemoria = index + 6;
              const formulaDias = `='Memoria y Flujo Semanal'!I${excelRowMemoria}`;

              return (
                <tr key={act.id} className="hover:bg-slate-800/40 transition-colors">
                  {/* ITEM */}
                  <td className="py-2.5 px-3 text-center font-bold text-slate-300 bg-slate-900/70 border-r border-slate-800">
                    {act.item}
                  </td>

                  {/* DESCRIPCIÓN */}
                  <td className="py-2.5 px-4 text-left text-slate-200 font-sans font-medium border-r border-slate-800">
                    {act.descripcion}
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Día {det.diaInicio.toFixed(2)} al {det.diaFin.toFixed(2)} ({det.diasRequeridos.toFixed(2)} d)
                    </div>
                  </td>

                  {/* DÍAS REQUERIDOS (Fórmula vinculada) */}
                  <td className="py-2.5 px-3 text-center text-amber-300 font-bold bg-slate-900/50 border-r border-slate-800">
                    {showFormulas ? (
                      <span className="text-[10px] text-blue-400 font-mono px-1 py-0.5 rounded bg-blue-950/60 border border-blue-800/60">
                        {formulaDias}
                      </span>
                    ) : (
                      det.diasRequeridos.toFixed(2)
                    )}
                  </td>

                  {/* Dynamic Week Columns (Diagrama de Gantt) */}
                  {Array.from({ length: numSemanas }, (_, wIndex) => {
                    const wIni = wIndex * 6;
                    const wFin = (wIndex + 1) * 6;
                    const overlap = Math.max(0, Math.min(det.diaFin, wFin) - Math.max(det.diaInicio, wIni));
                    const isActiva = overlap > 0.0001;

                    return (
                      <td
                        key={wIndex}
                        className={`py-2.5 px-2 text-center text-xs border-r border-slate-800 transition-colors ${
                          isActiva
                            ? 'bg-[#D9E1F2] text-[#1F497D] font-black font-sans shadow-inner'
                            : 'bg-slate-950/40 text-slate-700'
                        }`}
                      >
                        {isActiva ? (
                          <div className="flex flex-col items-center justify-center">
                            <span className="text-[11px] font-black tracking-wider text-[#1F497D]">ACTIVA</span>
                            <span className="text-[9px] font-normal text-blue-900/70 font-mono">
                              ({overlap.toFixed(1)} d)
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-800 select-none">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-950 text-slate-300 font-bold border-t-2 border-slate-700">
              <td colSpan={2} className="py-3 px-4 text-right uppercase tracking-wider text-slate-400 text-xs">
                TOTAL DÍAS CALENDARIO Y COBERTURA SEMANAL
              </td>
              <td className="py-3 px-3 text-center text-emerald-400 font-mono text-sm bg-slate-900 border-r border-slate-800">
                {showFormulas ? '=SUM(C5:C12)' : cronograma.totalDias.toFixed(2)}
              </td>
              {Array.from({ length: numSemanas }, (_, wIndex) => {
                const totalDiasSemana = cronograma.matriz.reduce((acc, d) => {
                  const wIni = wIndex * 6;
                  const wFin = (wIndex + 1) * 6;
                  const overlap = Math.max(0, Math.min(d.diaFin, wFin) - Math.max(d.diaInicio, wIni));
                  return acc + overlap;
                }, 0);

                return (
                  <td
                    key={wIndex}
                    className="py-3 px-2 text-center text-slate-300 border-r border-slate-800 text-[11px]"
                  >
                    <div className="font-mono text-blue-400 font-bold">{totalDiasSemana.toFixed(1)} d</div>
                    <div className="text-[9px] text-slate-500 font-sans">
                      {cronograma.totalesPorSemana[wIndex] > 0 ? (
                        <span className="text-emerald-400/90 flex items-center justify-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> En obra
                        </span>
                      ) : (
                        '-'
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Note Callout */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div>
          <span className="text-blue-400 font-semibold">Nota de Planificación Gantt:</span> La barra se extiende horizontalmente a lo largo de las semanas requeridas de forma secuencial. Las columnas de semanas tienen un ancho estandarizado de 12 puntos en el archivo Excel generado por ExcelJS.
        </div>
        <div className="text-slate-500 font-mono">
          Hoja 3 de 3 en Presupuesto_MO_EBAR_SUR_2.xlsx
        </div>
      </div>
    </div>
  );
};
