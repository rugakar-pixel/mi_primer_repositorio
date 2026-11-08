import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';
import { WbsCapitulo, WbsPartida, WbsStructure, platformApi } from './api';

interface WbsEditorProps {
  projectId: number;
  projectName: string;
  versionId: number;
  versionNumber: number;
  actorUserId?: number;
}

const inputClass =
  'min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white';
const buttonClass =
  'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 text-sm text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-50';

export function WbsEditor({
  projectId,
  projectName,
  versionId,
  versionNumber,
  actorUserId,
}: WbsEditorProps) {
  const [structure, setStructure] = useState<WbsStructure | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [chapterCode, setChapterCode] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
  const [editingChapterCode, setEditingChapterCode] = useState('');
  const [editingChapterName, setEditingChapterName] = useState('');
  const [editingPartId, setEditingPartId] = useState<number | null>(null);
  const [editingPart, setEditingPart] = useState<WbsPartida | null>(null);
  const [newPartChapterId, setNewPartChapterId] = useState<number | null>(null);

  const loadStructure = useCallback(async () => {
    setStructure(await platformApi.wbs(projectId, versionId));
  }, [projectId, versionId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    platformApi.wbs(projectId, versionId)
      .then((result) => {
        if (active) setStructure(result);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudo cargar la estructura WBS.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, versionId]);

  const runMutation = async (
    action: () => Promise<unknown>,
    message: string,
    onSuccess?: () => void,
  ) => {
    setWorking(true);
    setError('');
    setFeedback('');
    try {
      await action();
      await loadStructure();
      setFeedback(message);
      onSuccess?.();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la estructura.');
    } finally {
      setWorking(false);
    }
  };

  const handleCreateChapter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void runMutation(
      async () => {
        await platformApi.createWbsChapter(projectId, versionId, {
          codigo: chapterCode,
          nombre: chapterName,
          creado_por_id: actorUserId,
        });
        setChapterCode('');
        setChapterName('');
      },
      'Capítulo guardado en esta versión.',
    );
  };

  const startChapterEdit = (chapter: WbsCapitulo) => {
    setEditingChapterId(chapter.id);
    setEditingChapterCode(chapter.codigo);
    setEditingChapterName(chapter.nombre);
  };

  const saveChapter = (event: FormEvent<HTMLFormElement>, chapterId: number) => {
    event.preventDefault();
    void runMutation(
      () => platformApi.updateWbsChapter(projectId, versionId, chapterId, {
        codigo: editingChapterCode,
        nombre: editingChapterName,
        actualizado_por_id: actorUserId,
      }),
      'Capítulo actualizado.',
      () => setEditingChapterId(null),
    );
  };

  const handleCreatePart = (
    event: FormEvent<HTMLFormElement>,
    chapterId: number,
    form: HTMLFormElement,
  ) => {
    event.preventDefault();
    const data = new FormData(form);
    void runMutation(
      () => platformApi.createWbsPartida(projectId, versionId, chapterId, {
        codigo: String(data.get('codigo') || ''),
        descripcion: String(data.get('descripcion') || ''),
        unidad: String(data.get('unidad') || ''),
        cantidad: Number(data.get('cantidad')),
        rendimiento: data.get('rendimiento') ? Number(data.get('rendimiento')) : undefined,
        creado_por_id: actorUserId,
      }),
      'Partida guardada en esta versión.',
      () => {
        form.reset();
        setNewPartChapterId(null);
      },
    );
  };

  const startPartEdit = (part: WbsPartida) => {
    setEditingPartId(part.id);
    setEditingPart({ ...part });
  };

  const savePart = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingPart) return;
    void runMutation(
      () => platformApi.updateWbsPartida(
        projectId,
        versionId,
        editingPart.capitulo_id,
        editingPart.id,
        {
          codigo: editingPart.codigo,
          descripcion: editingPart.descripcion,
          unidad: editingPart.unidad,
          cantidad: editingPart.cantidad,
          rendimiento: editingPart.rendimiento,
          actualizado_por_id: actorUserId,
        },
      ),
      'Partida actualizada.',
      () => {
        setEditingPartId(null);
        setEditingPart(null);
      },
    );
  };

  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
          Estructura WBS · Versión {versionNumber}
        </p>
        <h2 className="mt-2 text-xl font-bold text-white">{projectName}</h2>
        <p className="mt-1 text-sm text-slate-400">
          Define capítulos y partidas. Los cambios se guardan únicamente en esta versión.
        </p>
      </header>

      {(error || feedback) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`rounded-lg border px-4 py-3 text-sm ${
            error
              ? 'border-rose-500/30 bg-rose-950/40 text-rose-200'
              : 'border-emerald-500/30 bg-emerald-950/30 text-emerald-200'
          }`}
        >
          {error || feedback}
        </div>
      )}

      <form onSubmit={handleCreateChapter} className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5 sm:grid-cols-[1fr_2fr_auto]">
        <label className="space-y-1 text-xs text-slate-400">
          Código de capítulo
          <input required maxLength={30} value={chapterCode} onChange={(event) => setChapterCode(event.target.value)} className={inputClass} />
        </label>
        <label className="space-y-1 text-xs text-slate-400">
          Nombre del capítulo
          <input required maxLength={200} value={chapterName} onChange={(event) => setChapterName(event.target.value)} className={inputClass} />
        </label>
        <button disabled={working} className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
          <Plus className="h-4 w-4" /> Agregar capítulo
        </button>
      </form>

      {loading ? (
        <p className="rounded-lg border border-slate-800 p-6 text-sm text-slate-400">Cargando estructura…</p>
      ) : structure?.capitulos.length ? (
        <div className="space-y-4">
          {structure.capitulos.map((chapter) => (
            <article key={chapter.id} className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 p-4">
                {editingChapterId === chapter.id ? (
                  <form onSubmit={(event) => saveChapter(event, chapter.id)} className="grid flex-1 gap-2 sm:grid-cols-[1fr_2fr_auto_auto]">
                    <input required maxLength={30} aria-label="Código de capítulo" value={editingChapterCode} onChange={(event) => setEditingChapterCode(event.target.value)} className={inputClass} />
                    <input required maxLength={200} aria-label="Nombre del capítulo" value={editingChapterName} onChange={(event) => setEditingChapterName(event.target.value)} className={inputClass} />
                    <button disabled={working} aria-label="Guardar capítulo" className={buttonClass}><Save className="h-4 w-4" /></button>
                    <button type="button" aria-label="Cancelar edición" onClick={() => setEditingChapterId(null)} className={buttonClass}><X className="h-4 w-4" /></button>
                  </form>
                ) : (
                  <>
                    <h3 className="font-semibold text-white"><span className="mr-2 font-mono text-blue-300">{chapter.codigo}</span>{chapter.nombre}</h3>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => startChapterEdit(chapter)} className={buttonClass}><Pencil className="h-4 w-4" /> Editar</button>
                      <button
                        type="button"
                        disabled={working}
                        onClick={() => {
                          if (window.confirm(`¿Eliminar el capítulo ${chapter.codigo} y sus partidas de esta versión?`)) {
                            void runMutation(
                              () => platformApi.deleteWbsChapter(projectId, versionId, chapter.id),
                              'Capítulo eliminado.',
                            );
                          }
                        }}
                        className={`${buttonClass} text-rose-300 hover:bg-rose-950/40`}
                      >
                        <Trash2 className="h-4 w-4" /> Eliminar
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-sm">
                  <thead className="bg-slate-950/50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Descripción</th>
                      <th className="px-4 py-3">Unidad</th>
                      <th className="px-4 py-3 text-right">Cantidad</th>
                      <th className="px-4 py-3 text-right">Rendimiento</th>
                      <th className="px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {chapter.partidas.map((part) => (
                      <tr key={part.id} className="text-slate-300">
                        {editingPartId === part.id && editingPart ? (
                          <td colSpan={6} className="p-3">
                            <form onSubmit={savePart} className="grid gap-2 sm:grid-cols-6">
                              <input required maxLength={50} aria-label="Código de partida" value={editingPart.codigo} onChange={(event) => setEditingPart({ ...editingPart, codigo: event.target.value })} className={inputClass} />
                              <input required maxLength={500} aria-label="Descripción de partida" value={editingPart.descripcion} onChange={(event) => setEditingPart({ ...editingPart, descripcion: event.target.value })} className={`${inputClass} sm:col-span-2`} />
                              <input required maxLength={30} aria-label="Unidad de partida" value={editingPart.unidad} onChange={(event) => setEditingPart({ ...editingPart, unidad: event.target.value })} className={inputClass} />
                              <input required type="number" min="0" step="any" aria-label="Cantidad de partida" value={editingPart.cantidad} onChange={(event) => setEditingPart({ ...editingPart, cantidad: Number(event.target.value) })} className={inputClass} />
                              <div className="flex gap-2">
                                <button disabled={working} aria-label="Guardar partida" className={buttonClass}><Save className="h-4 w-4" /></button>
                                <button type="button" aria-label="Cancelar edición" onClick={() => { setEditingPartId(null); setEditingPart(null); }} className={buttonClass}><X className="h-4 w-4" /></button>
                              </div>
                              <label className="space-y-1 text-xs text-slate-500 sm:col-span-2">
                                Rendimiento (opcional)
                                <input type="number" min="0.0001" step="any" value={editingPart.rendimiento ?? ''} onChange={(event) => setEditingPart({ ...editingPart, rendimiento: event.target.value ? Number(event.target.value) : null })} className={inputClass} />
                              </label>
                            </form>
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-mono text-slate-200">{part.codigo}</td>
                            <td className="px-4 py-3">{part.descripcion}</td>
                            <td className="px-4 py-3">{part.unidad}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{part.cantidad}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{part.rendimiento ?? '—'}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button type="button" onClick={() => startPartEdit(part)} aria-label={`Editar ${part.codigo}`} className={buttonClass}><Pencil className="h-4 w-4" /></button>
                                <button
                                  type="button"
                                  disabled={working}
                                  onClick={() => {
                                    if (window.confirm(`¿Eliminar la partida ${part.codigo} de esta versión?`)) {
                                      void runMutation(
                                        () => platformApi.deleteWbsPartida(projectId, versionId, chapter.id, part.id),
                                        'Partida eliminada.',
                                      );
                                    }
                                  }}
                                  aria-label={`Eliminar ${part.codigo}`}
                                  className={`${buttonClass} text-rose-300 hover:bg-rose-950/40`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {chapter.partidas.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-5 text-sm text-slate-500">Sin partidas en este capítulo.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-slate-800 p-4">
                {newPartChapterId === chapter.id ? (
                  <form
                    onSubmit={(event) => handleCreatePart(event, chapter.id, event.currentTarget)}
                    className="grid gap-2 sm:grid-cols-6"
                  >
                    <input required name="codigo" maxLength={50} placeholder="Código" aria-label="Código de nueva partida" className={inputClass} />
                    <input required name="descripcion" maxLength={500} placeholder="Descripción" aria-label="Descripción de nueva partida" className={`${inputClass} sm:col-span-2`} />
                    <input required name="unidad" maxLength={30} placeholder="Unidad" aria-label="Unidad de nueva partida" className={inputClass} />
                    <input required name="cantidad" type="number" min="0" step="any" defaultValue="1" placeholder="Cantidad" aria-label="Cantidad de nueva partida" className={inputClass} />
                    <button disabled={working} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white disabled:opacity-50"><Plus className="h-4 w-4" /> Agregar</button>
                    <label className="space-y-1 text-xs text-slate-500 sm:col-span-2">
                      Rendimiento (opcional)
                      <input name="rendimiento" type="number" min="0.0001" step="any" className={inputClass} />
                    </label>
                    <button type="button" onClick={() => setNewPartChapterId(null)} className={buttonClass}>Cancelar</button>
                  </form>
                ) : (
                  <button type="button" onClick={() => setNewPartChapterId(chapter.id)} className={buttonClass}>
                    <Plus className="h-4 w-4" /> Agregar partida
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">
          Esta versión aún no tiene capítulos. Agrega el primero para comenzar la WBS.
        </div>
      )}
    </section>
  );
}
