import React from 'react';
import { ConfiguracionLaboral } from '../types/budget';
import { calcularSalarios } from '../utils/calculator';
import { X, Sliders, ShieldCheck, DollarSign, RotateCcw } from 'lucide-react';
import { CONFIG_NICARAGUA_2026_DEFAULT } from '../utils/calculator';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: ConfiguracionLaboral;
  onSaveConfig: (newConfig: ConfiguracionLaboral) => void;
  onResetDefault: () => void;
}

export const ConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onResetDefault,
}) => {
  if (!isOpen) return null;

  const salarios = calcularSalarios(config);

  const handleChange = (key: keyof ConfiguracionLaboral, val: number) => {
    onSaveConfig({
      ...config,
      [key]: val,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Parámetros Legales y Salario Real (Nicaragua 2026)
              </h3>
              <p className="text-xs text-slate-400">
                Regulaciones MITRAB / INSS / INATEC para el Sector Construcción
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Tarjetas de Costos Reales Diarios Calculados */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Ayudante de Construcción
              </span>
              <div className="mt-1 text-lg font-bold text-white font-mono">
                C$ {salarios.salarioDiarioAyudante.toFixed(2)}
                <span className="text-xs text-slate-400 font-normal"> /día base</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-emerald-400 font-mono">
                C$ {salarios.costoRealDiarioAyudante.toFixed(2)}
                <span className="text-[11px] text-slate-400 font-normal"> /día con FSR</span>
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Oficial Especialista (+50%)
              </span>
              <div className="mt-1 text-lg font-bold text-white font-mono">
                C$ {salarios.salarioDiarioOficial.toFixed(2)}
                <span className="text-xs text-slate-400 font-normal"> /día base</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-blue-400 font-mono">
                C$ {salarios.costoRealDiarioOficial.toFixed(2)}
                <span className="text-[11px] text-slate-400 font-normal"> /día con FSR</span>
              </div>
            </div>
          </div>

          {/* Salario Base y Parámetros */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              1. Base Salarial y Jornada
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Salario Mensual Mínimo (C$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.salarioMinimoMensual}
                  onChange={(e) => handleChange('salarioMinimoMensual', Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Días Mes Comercial</label>
                <input
                  type="number"
                  value={config.diasMesComercial}
                  onChange={(e) => handleChange('diasMesComercial', Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Diferencial Oficial (Factor)</label>
                <input
                  type="number"
                  step="0.05"
                  value={config.factorOficial}
                  onChange={(e) => handleChange('factorOficial', Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm"
                />
              </div>
            </div>
          </div>

          {/* Desglose Prestaciones de Ley FSR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                2. Factor de Salario Real (FSR): Prestaciones y Cargas Sociales
              </h4>
              <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-700/50">
                FSR: {salarios.fsrMultiplicador.toFixed(4)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">Aguinaldo (1/12)</label>
                <div className="flex items-center gap-1 font-mono text-xs text-white">
                  <span>{(config.pctAguinaldo * 100).toFixed(2)}%</span>
                </div>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">Vacaciones (15 d/semestre)</label>
                <div className="flex items-center gap-1 font-mono text-xs text-white">
                  <span>{(config.pctVacaciones * 100).toFixed(2)}%</span>
                </div>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">INSS Patronal</label>
                <div className="flex items-center gap-1 font-mono text-xs text-white">
                  <span>{(config.pctInssPatronal * 100).toFixed(2)}%</span>
                </div>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">INATEC Técnico</label>
                <div className="flex items-center gap-1 font-mono text-xs text-white">
                  <span>{(config.pctInatec * 100).toFixed(2)}%</span>
                </div>
              </div>
              <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1">Indemnización Antigüedad</label>
                <div className="flex items-center gap-1 font-mono text-xs text-white">
                  <span>{(config.pctIndemnizacion * 100).toFixed(2)}%</span>
                </div>
              </div>
              <div className="bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-800/40">
                <label className="block text-[11px] text-emerald-400 font-semibold mb-1">Recargo Total Prestaciones</label>
                <div className="font-mono text-xs text-emerald-300 font-bold">
                  {((salarios.fsrMultiplicador - 1) * 100).toFixed(2)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={onResetDefault}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-700/60 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer Parámetros Oficiales 2026
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Cerrar y Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
