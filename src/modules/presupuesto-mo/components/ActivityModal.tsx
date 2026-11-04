import React, { useState, useEffect } from 'react';
import { Actividad } from '../types/budget';
import { X, Check, Calculator } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (actividad: Partial<Actividad>) => void;
  actividadEditar?: Actividad | null;
  siguienteItem: number;
}

export const ActivityModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  actividadEditar,
  siguienteItem,
}) => {
  const [item, setItem] = useState(siguienteItem);
  const [descripcion, setDescripcion] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('ML');
  const [cantidad, setCantidad] = useState<number>(10);
  const [rendimientoBaseOficial, setRendimientoBaseOficial] = useState<number>(2.5);
  const [cantOficiales, setCantOficiales] = useState<number>(1);
  const [cantAyudantes, setCantAyudantes] = useState<number>(1);

  useEffect(() => {
    if (actividadEditar) {
      setItem(actividadEditar.item);
      setDescripcion(actividadEditar.descripcion);
      setUnidadMedida(actividadEditar.unidadMedida);
      setCantidad(actividadEditar.cantidad);
      setRendimientoBaseOficial(actividadEditar.rendimientoBaseOficial);
      setCantOficiales(actividadEditar.cantOficiales);
      setCantAyudantes(actividadEditar.cantAyudantes);
    } else {
      setItem(siguienteItem);
      setDescripcion('');
      setUnidadMedida('M³');
      setCantidad(10);
      setRendimientoBaseOficial(2.0);
      setCantOficiales(1);
      setCantAyudantes(1);
    }
  }, [actividadEditar, siguienteItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) return;

    onSave({
      id: actividadEditar?.id,
      item: Number(item),
      descripcion: descripcion.trim(),
      unidadMedida: unidadMedida.trim().toUpperCase(),
      cantidad: Number(cantidad) > 0 ? Number(cantidad) : 1,
      rendimientoBaseOficial: Number(rendimientoBaseOficial) > 0 ? Number(rendimientoBaseOficial) : 1,
      cantOficiales: Math.max(1, Number(cantOficiales)),
      cantAyudantes: Math.max(0, Number(cantAyudantes)),
    });
    onClose();
  };

  const rendTotal = rendimientoBaseOficial * cantOficiales;
  const diasEstimados = rendTotal > 0 ? cantidad / rendTotal : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-white">
              {actividadEditar ? `Modificar Ítem #${item}` : 'Agregar Nueva Actividad de Obra'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Ítem No.</label>
              <input
                type="number"
                value={item}
                onChange={(e) => setItem(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div className="col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Unidad de Medida (U/M)</label>
              <input
                type="text"
                value={unidadMedida}
                onChange={(e) => setUnidadMedida(e.target.value)}
                placeholder="ML, M³, M², KG, GLB"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-blue-500 focus:outline-none uppercase"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción de la Actividad</label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Construcción de zapata de concreto reforzado..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Cantidad de Obra</label>
              <input
                type="number"
                step="0.01"
                value={cantidad}
                onChange={(e) => setCantidad(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Rendimiento Base Oficial / día</label>
              <input
                type="number"
                step="0.01"
                value={rendimientoBaseOficial}
                onChange={(e) => setRendimientoBaseOficial(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Configuración de Cuadrilla */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <span className="text-xs font-semibold text-blue-400 block">
              Composición de la Cuadrilla Asignada
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">No. Oficiales Especialistas</label>
                <input
                  type="number"
                  min="1"
                  value={cantOficiales}
                  onChange={(e) => setCantOficiales(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">No. Ayudantes de Construcción</label>
                <input
                  type="number"
                  min="0"
                  value={cantAyudantes}
                  onChange={(e) => setCantAyudantes(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white font-mono text-sm focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-mono text-slate-400">
              <span>Rendimiento Total: <strong className="text-white">{rendTotal.toFixed(2)}</strong> {unidadMedida}/d</span>
              <span>Duración estimada: <strong className="text-amber-400">{diasEstimados.toFixed(2)}</strong> días</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Guardar Actividad
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
