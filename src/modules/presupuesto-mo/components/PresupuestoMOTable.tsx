import React, { useState } from 'react';
import { CronogramaCalculado, Actividad } from '../types/budget';
import { Code2, Edit2, Trash2, Plus, Info } from 'lucide-react';

interface Props {
  cronograma: CronogramaCalculado;
  onEditActivity: (actividad: Actividad) => void;
  onDeleteActivity: (item: number) => void;
  onAddActivity: () => void;
  nombreProyecto: string;
  presentation?: 'module' | 'consolidated';
}

export const PresupuestoMOTable: React.FC<Props> = ({
  cronograma,
  onEditActivity,
  onDeleteActivity,
  onAddActivity,
  nombreProyecto,
  presentation = 'module',
}) => {
  const [showFormulas, setShowFormulas] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      {/* Table Header Controls */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              {presentation === 'consolidated'
                ? 'Presupuesto consolidado del proyecto'
                : 'PESTAÑA 1: Presupuesto MO (Formato Ejecutivo Original)'}
            </h2>
            {presentation === 'module' && (
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-900/60 text-blue-300 rounded border border-blue-700/50">
                Excel Sheet: Presupuesto MO
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {presentation === 'consolidated'
              ? 'Partidas alimentadas directamente por el Módulo de Mano de Obra. Los demás módulos se integrarán aquí cuando estén desarrollados.'
              : 'Estructura idéntica a la matriz del cliente con columnas: ITEM, DESCRIPCION, U/M, CANTIDAD, COSTO UNITARIO, COSTO TOTAL.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
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

          <button
            onClick={onAddActivity}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva Actividad
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-[#1F497D] text-white text-xs uppercase font-semibold tracking-wider">
              <th className="py-3 px-3 text-center border-r border-blue-800/60 w-16">ITEM</th>
              <th className="py-3 px-4 border-r border-blue-800/60">DESCRIPCION</th>
              <th className="py-3 px-3 text-center border-r border-blue-800/60 w-20">U/M</th>
              <th className="py-3 px-4 text-right border-r border-blue-800/60 w-32">CANTIDAD</th>
              <th className="py-3 px-4 text-right border-r border-blue-800/60 w-36">COSTO UNITARIO</th>
              <th className="py-3 px-4 text-right border-r border-blue-800/60 w-40">COSTO TOTAL</th>
              <th className="py-3 px-2 text-center w-20">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono text-xs">
            {cronograma.matriz.map((item, idx) => {
              const act = item.actividad;
              const excelRowIndex = 5 + idx; // In Excel, starts at row 5
              const isEven = idx % 2 === 1;

              return (
                <tr
                  key={act.id || act.item}
                  className={`hover:bg-blue-950/30 transition-colors ${
                    isEven ? 'bg-slate-900/60' : 'bg-slate-900/20'
                  }`}
                >
                  <td className="py-2.5 px-3 text-center text-slate-300 font-bold border-r border-slate-800">
                    {act.item}
                  </td>
                  <td className="py-2.5 px-4 text-slate-200 font-sans text-xs border-r border-slate-800">
                    {act.descripcion}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-400 font-semibold border-r border-slate-800">
                    {act.unidadMedida}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-200 border-r border-slate-800">
                    {act.cantidad.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-4 text-right text-slate-200 border-r border-slate-800">
                    {showFormulas ? (
                      <span className="text-blue-300 font-mono text-[10px] bg-blue-950/60 px-1 py-0.5 rounded border border-blue-700/60">
                        ='Memoria y Flujo Semanal'!J{excelRowIndex + 1}/H{excelRowIndex + 1}
                      </span>
                    ) : (
                      `C$ ${item.costoUnitario.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-right text-white font-bold border-r border-slate-800 bg-slate-950/40">
                    {showFormulas ? (
                      <span className="text-amber-400 font-mono text-[11px] bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-800/50">
                        =D{excelRowIndex}*E{excelRowIndex}
                      </span>
                    ) : (
                      `C$ ${item.costoTotal.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <div className="flex items-center justify-center gap-1 font-sans">
                      <button
                        onClick={() => onEditActivity(act)}
                        title="Modificar Actividad / Cuadrilla"
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteActivity(act.item)}
                        title="Borrar Actividad"
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Total Row */}
            <tr className="bg-[#1F497D]/30 border-t-2 border-b-4 border-double border-blue-500 font-bold">
              <td
                colSpan={5}
                className="py-3 px-4 text-right text-white uppercase tracking-wider font-sans text-xs border-r border-slate-800"
              >
                TOTAL MANO DE OBRA GENERAL (C$):
              </td>
              <td className="py-3 px-4 text-right text-emerald-400 text-sm font-mono border-r border-slate-800 bg-[#1F497D]/50">
                {showFormulas ? (
                  <span className="text-amber-300 font-mono text-[11px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600">
                    =SUM(F5:F{4 + cronograma.matriz.length})
                  </span>
                ) : (
                  `C$ ${cronograma.costoTotalProyecto.toLocaleString('es-NI', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                )}
              </td>
              <td className="py-3 px-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Field Note Section matching exact requirement */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800">
        <div className="flex items-start gap-2.5 text-xs text-amber-300/90 italic font-sans bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold not-italic uppercase tracking-wider text-[11px] text-amber-400 block mb-0.5">
              Nota técnica en hoja de presupuesto Excel (2 filas bajo el total):
            </span>
            <p className="font-serif italic text-slate-200">
              "nota: poner a dispocision maquina para excavar y manipular materiales pesados."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
