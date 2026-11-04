import React, { useState } from 'react';
import { Actividad, ConfiguracionLaboral } from '../types/budget';
import { generarPlanillaNomina, calcularSalarios } from '../utils/calculator';
import { Users, Code2, ShieldCheck, DollarSign, Wallet, Building } from 'lucide-react';

interface Props {
  actividades: Actividad[];
  config: ConfiguracionLaboral;
  nombreProyecto: string;
}

export const PlanillaNominaTable: React.FC<Props> = ({ actividades, config, nombreProyecto }) => {
  const [showFormulas, setShowFormulas] = useState(false);
  const salarios = calcularSalarios(config);
  const colaboradores = generarPlanillaNomina(actividades, config);

  // Totales consolidados
  const totalDias = colaboradores.reduce((acc, c) => acc + c.diasLaborados, 0);
  const totalSalarioBruto = colaboradores.reduce((acc, c) => acc + c.salarioBruto, 0);
  const totalInssLaboral = colaboradores.reduce((acc, c) => acc + c.inssLaboral, 0);
  const totalIrRetenido = colaboradores.reduce((acc, c) => acc + c.irRetenido, 0);
  const totalDeducciones = colaboradores.reduce((acc, c) => acc + c.totalDeducciones, 0);
  const totalSalarioNeto = colaboradores.reduce((acc, c) => acc + c.salarioNeto, 0);
  const totalInssPatronal = colaboradores.reduce((acc, c) => acc + c.inssPatronal, 0);
  const totalInatec = colaboradores.reduce((acc, c) => acc + c.inatec, 0);
  const totalCostoPatronal = colaboradores.reduce((acc, c) => acc + c.costoTotalPatronal, 0);

  const formatMoneda = (val: number) =>
    `C$ ${val.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
      {/* Header Bar */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white tracking-wide">
              Planilla y Nómina (Consolidada por Colaborador)
            </h2>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-900/60 text-emerald-300 rounded border border-emerald-700/50">
              Excel Sheet: Planilla y Nómina Real
            </span>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-950 text-indigo-300 rounded border border-indigo-700/50 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              MITRAB / INSS / DGI Ley 822
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Desagregación individual de cuadrillas por partida, retención de IR con tabla progresiva mensualizada y cargas patronales.
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

      {/* Summary KPI Cards Ribbon */}
      <div className="bg-slate-950/70 p-3 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Colaboradores</span>
          </div>
          <div className="text-sm font-bold text-white mt-1 font-mono">
            {colaboradores.length} posiciones
          </div>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            <span>Salario Bruto Total</span>
          </div>
          <div className="text-sm font-bold text-amber-300 mt-1 font-mono">
            {formatMoneda(totalSalarioBruto)}
          </div>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Wallet className="w-3.5 h-3.5 text-rose-400" />
            <span>Total Deducciones</span>
          </div>
          <div className="text-sm font-bold text-rose-300 mt-1 font-mono">
            {formatMoneda(totalDeducciones)}
          </div>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Neto a Recibir</span>
          </div>
          <div className="text-sm font-bold text-emerald-300 mt-1 font-mono">
            {formatMoneda(totalSalarioNeto)}
          </div>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Building className="w-3.5 h-3.5 text-indigo-400" />
            <span>Costo Patronal</span>
          </div>
          <div className="text-sm font-bold text-indigo-300 mt-1 font-mono">
            {formatMoneda(totalCostoPatronal)}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-[#1F497D] text-white uppercase text-[11px] tracking-wider border-b border-slate-800">
              <th className="py-2.5 px-3 text-center font-bold border-r border-blue-900/60 w-24">Código</th>
              <th className="py-2.5 px-3 text-left font-bold border-r border-blue-900/60 min-w-[280px]">Rol / Tarea Asignada</th>
              <th className="py-2.5 px-3 text-right font-bold border-r border-blue-900/60 w-24">Días Lab.</th>
              <th className="py-2.5 px-3 text-right font-bold border-r border-blue-900/60 w-28">Salario Diario</th>
              <th className="py-2.5 px-3 text-right font-bold border-r border-blue-900/60 w-28 bg-[#173860]">Salario Bruto</th>
              <th className="py-2.5 px-3 text-right font-bold border-r border-blue-900/60 w-24 bg-[#1B3F6E]">INSS Lab (7%)</th>
              <th className="py-2.5 px-3 text-right font-bold border-r border-blue-900/60 w-24 bg-[#1B3F6E]">IR Retenido</th>
              <th className="py-2.5 px-3 text-right font-bold border-r border-blue-900/60 w-28 bg-[#173860]">Total Deduc.</th>
              <th className="py-2.5 px-3 text-right font-bold border-r border-blue-900/60 w-28 bg-[#134e4a]">Neto a Recibir</th>
              <th className="py-2.5 px-3 text-right font-bold border-r border-blue-900/60 w-28 bg-[#1e293b]">INSS Pat (22.5%)</th>
              <th className="py-2.5 px-3 text-right font-bold border-r border-blue-900/60 w-24 bg-[#1e293b]">INATEC (2%)</th>
              <th className="py-2.5 px-3 text-right font-bold w-32 bg-[#1B3F6E]">Costo Patronal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {colaboradores.map((col, idx) => {
              const excelRow = idx + 6;
              const isEven = idx % 2 === 0;

              return (
                <tr key={idx} className={`hover:bg-slate-800/40 transition-colors ${isEven ? 'bg-slate-900/40' : ''}`}>
                  {/* Código */}
                  <td className="py-2 px-3 text-center text-slate-300 font-bold border-r border-slate-800 bg-slate-900/70">
                    {col.codigo}
                  </td>

                  {/* Rol / Tarea */}
                  <td className="py-2 px-3 text-left text-slate-200 font-sans border-r border-slate-800 text-[11px]">
                    {col.rol}
                  </td>

                  {/* Días Laborados */}
                  <td className="py-2 px-3 text-right text-amber-300 font-medium border-r border-slate-800">
                    {col.diasLaborados.toFixed(2)}
                  </td>

                  {/* Salario Diario */}
                  <td className="py-2 px-3 text-right text-slate-300 border-r border-slate-800">
                    {formatMoneda(col.salarioDiario)}
                  </td>

                  {/* Salario Bruto */}
                  <td className="py-2 px-3 text-right text-amber-400 font-bold border-r border-slate-800 bg-slate-900/30">
                    {showFormulas ? (
                      <span className="text-[10px] text-blue-400 bg-blue-950/60 px-1 py-0.5 rounded border border-blue-800/60">
                        {`=C${excelRow}*D${excelRow}`}
                      </span>
                    ) : (
                      formatMoneda(col.salarioBruto)
                    )}
                  </td>

                  {/* INSS Laboral (7%) */}
                  <td className="py-2 px-3 text-right text-rose-300 border-r border-slate-800">
                    {showFormulas ? (
                      <span className="text-[10px] text-blue-400 bg-blue-950/60 px-1 py-0.5 rounded border border-blue-800/60">
                        {`=E${excelRow}*0.07`}
                      </span>
                    ) : (
                      formatMoneda(col.inssLaboral)
                    )}
                  </td>

                  {/* IR Retenido */}
                  <td className="py-2 px-3 text-right text-rose-300 border-r border-slate-800">
                    {formatMoneda(col.irRetenido)}
                  </td>

                  {/* Total Deducciones */}
                  <td className="py-2 px-3 text-right text-rose-400 font-bold border-r border-slate-800 bg-slate-900/30">
                    {showFormulas ? (
                      <span className="text-[10px] text-blue-400 bg-blue-950/60 px-1 py-0.5 rounded border border-blue-800/60">
                        {`=F${excelRow}+G${excelRow}`}
                      </span>
                    ) : (
                      formatMoneda(col.totalDeducciones)
                    )}
                  </td>

                  {/* Salario Neto */}
                  <td className="py-2 px-3 text-right text-emerald-300 font-bold border-r border-slate-800 bg-emerald-950/20">
                    {showFormulas ? (
                      <span className="text-[10px] text-blue-400 bg-blue-950/60 px-1 py-0.5 rounded border border-blue-800/60">
                        {`=E${excelRow}-H${excelRow}`}
                      </span>
                    ) : (
                      formatMoneda(col.salarioNeto)
                    )}
                  </td>

                  {/* INSS Patronal (22.5%) */}
                  <td className="py-2 px-3 text-right text-indigo-300 border-r border-slate-800">
                    {showFormulas ? (
                      <span className="text-[10px] text-blue-400 bg-blue-950/60 px-1 py-0.5 rounded border border-blue-800/60">
                        {`=E${excelRow}*0.225`}
                      </span>
                    ) : (
                      formatMoneda(col.inssPatronal)
                    )}
                  </td>

                  {/* INATEC (2%) */}
                  <td className="py-2 px-3 text-right text-indigo-300 border-r border-slate-800">
                    {showFormulas ? (
                      <span className="text-[10px] text-blue-400 bg-blue-950/60 px-1 py-0.5 rounded border border-blue-800/60">
                        {`=E${excelRow}*0.02`}
                      </span>
                    ) : (
                      formatMoneda(col.inatec)
                    )}
                  </td>

                  {/* Costo Total Patronal */}
                  <td className="py-2 px-3 text-right text-indigo-400 font-bold bg-slate-900/40">
                    {showFormulas ? (
                      <span className="text-[10px] text-blue-400 bg-blue-950/60 px-1 py-0.5 rounded border border-blue-800/60">
                        {`=E${excelRow}*${salarios.fsrMultiplicador.toFixed(4)}`}
                      </span>
                    ) : (
                      formatMoneda(col.costoTotalPatronal)
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-950 text-slate-300 font-bold border-t-2 border-slate-700">
              <td colSpan={2} className="py-3 px-3 text-right uppercase tracking-wider text-slate-400 text-xs">
                TOTALES GENERALES:
              </td>
              <td className="py-3 px-3 text-right text-amber-300 font-mono border-r border-slate-800">
                {showFormulas ? `=SUM(C6:C${colaboradores.length + 5})` : totalDias.toFixed(2)}
              </td>
              <td className="py-3 px-3 text-center text-slate-500 font-mono border-r border-slate-800">
                -
              </td>
              <td className="py-3 px-3 text-right text-amber-400 font-mono border-r border-slate-800">
                {showFormulas ? `=SUM(E6:E${colaboradores.length + 5})` : formatMoneda(totalSalarioBruto)}
              </td>
              <td className="py-3 px-3 text-right text-rose-300 font-mono border-r border-slate-800">
                {showFormulas ? `=SUM(F6:F${colaboradores.length + 5})` : formatMoneda(totalInssLaboral)}
              </td>
              <td className="py-3 px-3 text-right text-rose-300 font-mono border-r border-slate-800">
                {showFormulas ? `=SUM(G6:G${colaboradores.length + 5})` : formatMoneda(totalIrRetenido)}
              </td>
              <td className="py-3 px-3 text-right text-rose-400 font-mono border-r border-slate-800">
                {showFormulas ? `=SUM(H6:H${colaboradores.length + 5})` : formatMoneda(totalDeducciones)}
              </td>
              <td className="py-3 px-3 text-right text-emerald-400 font-mono border-r border-slate-800 bg-emerald-950/20">
                {showFormulas ? `=SUM(I6:I${colaboradores.length + 5})` : formatMoneda(totalSalarioNeto)}
              </td>
              <td className="py-3 px-3 text-right text-indigo-300 font-mono border-r border-slate-800">
                {showFormulas ? `=SUM(J6:J${colaboradores.length + 5})` : formatMoneda(totalInssPatronal)}
              </td>
              <td className="py-3 px-3 text-right text-indigo-300 font-mono border-r border-slate-800">
                {showFormulas ? `=SUM(K6:K${colaboradores.length + 5})` : formatMoneda(totalInatec)}
              </td>
              <td className="py-3 px-3 text-right text-indigo-400 font-mono">
                {showFormulas ? `=SUM(L6:L${colaboradores.length + 5})` : formatMoneda(totalCostoPatronal)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Note Callout */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div>
          <span className="text-emerald-400 font-semibold">Base Legal y Fiscal:</span> Retenciones calculadas bajo la Ley 822 de Concertación Tributaria (DGI) y Ley de Seguridad Social (INSS).
        </div>
        <div className="text-slate-500 font-mono">
          Hoja 4 de 4 en Presupuesto_MO_EBAR_SUR_2.xlsx
        </div>
      </div>
    </div>
  );
};
