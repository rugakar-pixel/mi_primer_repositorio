import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, PackagePlus, ReceiptText, RefreshCw } from 'lucide-react';
import {
  ApuUsage,
  CatalogMaterial,
  MaterialCategory,
  MaterialProvider,
  MaterialQuote,
  WbsStructure,
  platformApi,
} from '../plataforma/api';

interface MaterialesAPUWorkflowProps {
  projectId: number;
  projectName: string;
  versionId: number;
  versionNumber: number;
  actorUserId?: number;
}

interface MaterialUsageSnapshot {
  material: string;
  proveedor: string;
  precio: number;
  moneda: string;
  unidad: string;
  cotizacionId: number;
  fechaVigencia: string;
  origen: string;
  referencia: string | null;
}

const inputClass =
  'min-h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-white';
const buttonClass =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50';

function money(value: number, currency: string): string {
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function localDateTimeValue(): string {
  const localDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function materialSnapshots(usage: ApuUsage): MaterialUsageSnapshot[] {
  if (!Array.isArray(usage.snapshot.detalle)) return [];
  return usage.snapshot.detalle.flatMap((line): MaterialUsageSnapshot[] => {
    const snapshot = objectRecord(objectRecord(line)?.snapshot_material);
    if (
      !snapshot
      || typeof snapshot.descripcion !== 'string'
      || typeof snapshot.proveedor_nombre !== 'string'
      || typeof snapshot.precio_unitario !== 'string'
      || typeof snapshot.moneda !== 'string'
      || typeof snapshot.unidad_precio !== 'string'
      || typeof snapshot.material_precio_id !== 'number'
      || typeof snapshot.fecha_vigencia !== 'string'
      || typeof snapshot.origen !== 'string'
    ) {
      return [];
    }
    return [{
      material: snapshot.descripcion,
      proveedor: snapshot.proveedor_nombre,
      precio: Number(snapshot.precio_unitario),
      moneda: snapshot.moneda,
      unidad: snapshot.unidad_precio,
      cotizacionId: snapshot.material_precio_id,
      fechaVigencia: snapshot.fecha_vigencia,
      origen: snapshot.origen,
      referencia: typeof snapshot.referencia_cotizacion === 'string'
        ? snapshot.referencia_cotizacion
        : null,
    }];
  });
}

export function MaterialesAPUWorkflow({
  projectId,
  projectName,
  versionId,
  versionNumber,
  actorUserId,
}: MaterialesAPUWorkflowProps) {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [materials, setMaterials] = useState<CatalogMaterial[]>([]);
  const [providers, setProviders] = useState<MaterialProvider[]>([]);
  const [structure, setStructure] = useState<WbsStructure | null>(null);
  const [quotes, setQuotes] = useState<MaterialQuote[]>([]);
  const [currentPrices, setCurrentPrices] = useState<MaterialQuote[]>([]);
  const [usages, setUsages] = useState<ApuUsage[]>([]);
  const [materialId, setMaterialId] = useState('');
  const [partId, setPartId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [quoteId, setQuoteId] = useState('');
  const [currency, setCurrency] = useState('NIO');
  const [quantity, setQuantity] = useState('1');
  const [persistedUnitCost, setPersistedUnitCost] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadCatalog = useCallback(async () => {
    const [categoryList, materialList, providerList, wbs] = await Promise.all([
      platformApi.materialCategories(),
      platformApi.materials(),
      platformApi.materialProviders(),
      platformApi.wbs(projectId, versionId),
    ]);
    setCategories(categoryList);
    setMaterials(materialList);
    setProviders(providerList);
    setStructure(wbs);
    setMaterialId((current) => current || String(materialList[0]?.id ?? ''));
    setPartId((current) => current || String(wbs.capitulos[0]?.partidas[0]?.id ?? ''));
  }, [projectId, versionId]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    Promise.all([
      platformApi.materialCategories(),
      platformApi.materials(),
      platformApi.materialProviders(),
      platformApi.wbs(projectId, versionId),
    ])
      .then(([categoryList, materialList, providerList, wbs]) => {
        if (!active) return;
        setCategories(categoryList);
        setMaterials(materialList);
        setProviders(providerList);
        setStructure(wbs);
        setMaterialId(String(materialList[0]?.id ?? ''));
        setPartId(String(wbs.capitulos[0]?.partidas[0]?.id ?? ''));
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el catálogo real.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, versionId]);

  const selectedMaterial = useMemo(
    () => materials.find((material) => String(material.id) === materialId),
    [materials, materialId],
  );
  const selectedQuote = useMemo(
    () => currentPrices.find((quote) => String(quote.id) === quoteId),
    [currentPrices, quoteId],
  );
  const parts = useMemo(
    () => structure?.capitulos.flatMap((chapter) =>
      chapter.partidas.map((part) => ({
        ...part,
        chapterCode: chapter.codigo,
        chapterName: chapter.nombre,
      })),
    ) ?? [],
    [structure],
  );
  const selectedPart = parts.find((part) => String(part.id) === partId);
  const selectedProvider = providers.find((provider) => String(provider.id) === providerId);
  const computedCost = selectedQuote ? Number(quantity || 0) * selectedQuote.costo_unitario : 0;

  useEffect(() => {
    setPersistedUnitCost(null);
  }, [materialId, partId, quantity, quoteId]);

  const refreshPrices = useCallback(async (id: number, selectedCurrency: string) => {
    const [history, current] = await Promise.all([
      platformApi.materialQuotes(id),
      platformApi.currentMaterialPrices(id, selectedCurrency),
    ]);
    setQuotes(history);
    setCurrentPrices(current);
    setQuoteId(String(current[0]?.id ?? ''));
    setProviderId(String(current[0]?.proveedor_id ?? ''));
  }, []);

  useEffect(() => {
    if (!selectedMaterial) {
      setQuotes([]);
      setCurrentPrices([]);
      setQuoteId('');
      setProviderId('');
      return;
    }
    let active = true;
    refreshPrices(selectedMaterial.id, currency).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'No se pudieron consultar las cotizaciones.');
    });
    return () => {
      active = false;
    };
  }, [selectedMaterial, currency, refreshPrices]);

  useEffect(() => {
    if (!selectedPart) {
      setUsages([]);
      return;
    }
    let active = true;
    platformApi.partApuUsages(projectId, versionId, selectedPart.id)
      .then((result) => {
        if (active) setUsages(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar la trazabilidad APU.');
      });
    return () => {
      active = false;
    };
  }, [projectId, versionId, selectedPart]);

  async function mutate(action: () => Promise<void>, successMessage: string): Promise<void> {
    setWorking(true);
    setError('');
    setFeedback('');
    try {
      await action();
      setFeedback(successMessage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la información.');
    } finally {
      setWorking(false);
    }
  }

  async function createCategory(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!actorUserId) {
      setError('Selecciona un usuario autenticado antes de registrar datos auditables.');
      return;
    }
    await mutate(async () => {
      const category = await platformApi.createMaterialCategory({
        codigo: String(data.get('codigo')),
        nombre: String(data.get('nombre')),
        creado_por_id: actorUserId,
        motivo: 'Alta de categoría operativa de materiales',
      });
      setCategories((current) => [...current, category]);
      form.reset();
    }, 'Categoría persistida y auditada.');
  }

  async function createMaterial(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!actorUserId) {
      setError('Selecciona un usuario autenticado antes de registrar datos auditables.');
      return;
    }
    await mutate(async () => {
      const material = await platformApi.createMaterial({
        codigo: String(data.get('codigo')),
        descripcion: String(data.get('descripcion')),
        unidad: String(data.get('unidad')),
        categoria_id: Number(data.get('categoria_id')),
        creado_por_id: actorUserId,
        motivo: 'Alta de material operativo',
      });
      setMaterials((current) => [...current, material]);
      setMaterialId(String(material.id));
      form.reset();
    }, 'Material persistido y auditado.');
  }

  async function createProvider(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!actorUserId) {
      setError('Selecciona un usuario autenticado antes de registrar datos auditables.');
      return;
    }
    await mutate(async () => {
      const provider = await platformApi.createMaterialProvider({
        nombre: String(data.get('nombre')),
        creado_por_id: actorUserId,
        motivo: 'Alta de proveedor operativo',
      });
      setProviders((current) => [...current, provider]);
      form.reset();
    }, 'Proveedor persistido y auditado.');
  }

  async function createQuote(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!selectedMaterial || !actorUserId) {
      setError('Selecciona un material y un usuario autenticado para registrar la cotización.');
      return;
    }
    const effectiveDate = String(data.get('fecha_vigencia'));
    await mutate(async () => {
      await platformApi.createMaterialQuote(selectedMaterial.id, {
        proveedor_id: Number(data.get('proveedor_id')),
        costo_unitario: Number(data.get('costo_unitario')),
        moneda: String(data.get('moneda')),
        unidad_precio: selectedMaterial.unidad,
        fecha_vigencia: new Date(effectiveDate).toISOString(),
        origen: String(data.get('origen')),
        referencia_cotizacion: String(data.get('referencia_cotizacion')) || undefined,
        creado_por_id: actorUserId,
        motivo: 'Registro de cotización recibida del proveedor',
      });
      await refreshPrices(selectedMaterial.id, currency);
      form.reset();
    }, 'Cotización registrada como nuevo dato histórico.');
  }

  async function applyQuoteToPart(): Promise<void> {
    if (!selectedMaterial || !selectedQuote || !selectedPart || !actorUserId) {
      setError('Completa la selección de partida, material, cotización y usuario.');
      return;
    }
    await mutate(async () => {
      const master = await platformApi.createApuMaster({
        nombre: `APU ${selectedPart.descripcion}`,
        descripcion: `Análisis unitario de ${selectedPart.descripcion}`,
        unidad: selectedPart.unidad,
        creado_por_id: actorUserId,
        motivo: 'Crear APU con cotización vigente de material',
      });
      const version = await platformApi.createApuVersion(master.id, {
        detalle: [{
          concepto: selectedMaterial.descripcion,
          unidad: selectedMaterial.unidad,
          cantidad: Number(quantity),
          material_id: selectedMaterial.id,
          proveedor_id: selectedQuote.proveedor_id,
          material_precio_id: selectedQuote.id,
        }],
        motivo: 'Versionar selección de precio para esta partida',
        creado_por_id: actorUserId,
      });
      const usage = await platformApi.associateApu(
        projectId,
        versionId,
        selectedPart.id,
        {
          version_apu_id: version.id,
          motivo: 'Aplicar APU y congelar snapshot de precio en la versión del proyecto',
          creado_por_id: actorUserId,
        },
      );
      setUsages((current) => [...current, usage]);
      setPersistedUnitCost(Number(usage.snapshot.costo_unitario));
    }, 'APU guardado: material, proveedor, precio y snapshot asociados a la partida.');
  }

  if (loading) {
    return <p className="py-12 text-center text-slate-400">Cargando materiales y WBS persistidos...</p>;
  }

  return (
    <section className="mx-auto max-w-7xl space-y-5">
      <header className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">
          Motor de Materiales Reales · Proyecto · Versión {versionNumber}
        </p>
        <h2 className="mt-1 text-xl font-bold text-white">{projectName}</h2>
        <p className="mt-2 text-sm text-slate-400">
          Catálogo, cotizaciones históricas inmutables y snapshots versionados dentro del APU de la partida.
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

      {!actorUserId && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-950/30 p-3 text-sm text-amber-200">
          No hay un usuario autenticado asociado a esta sesión. Las altas y asociaciones quedan deshabilitadas para no crear auditoría sin actor.
        </p>
      )}

      <section className="grid gap-4 xl:grid-cols-3">
        <form
          onSubmit={(event) => void createCategory(event)}
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
        >
          <h3 className="font-semibold text-white">Categoría operativa</h3>
          <input required name="codigo" maxLength={50} placeholder="Código" className={inputClass} />
          <input required name="nombre" maxLength={120} placeholder="Nombre" className={inputClass} />
          <button disabled={working || !actorUserId} className={buttonClass}>Crear categoría</button>
        </form>

        <form
          onSubmit={(event) => void createMaterial(event)}
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
        >
          <h3 className="font-semibold text-white">Material</h3>
          <input required name="codigo" maxLength={50} placeholder="Código" className={inputClass} />
          <input required name="descripcion" maxLength={500} placeholder="Descripción (ej. Cemento GU)" className={inputClass} />
          <div className="grid grid-cols-2 gap-2">
            <input required name="unidad" maxLength={30} placeholder="Unidad (SACO)" className={inputClass} />
            <select required name="categoria_id" className={inputClass} defaultValue="">
              <option value="" disabled>Seleccionar categoría</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
            </select>
          </div>
          <button disabled={working || !actorUserId || categories.length === 0} className={buttonClass}>
            <PackagePlus className="h-4 w-4" /> Crear material
          </button>
        </form>

        <form
          onSubmit={(event) => void createProvider(event)}
          className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
        >
          <h3 className="font-semibold text-white">Proveedor</h3>
          <input required name="nombre" maxLength={200} placeholder="Nombre del proveedor" className={inputClass} />
          <p className="text-xs text-slate-400">Se puede agregar el RUC en la administración del catálogo.</p>
          <button disabled={working || !actorUserId} className={buttonClass}>Crear proveedor</button>
        </form>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-white">Cotizar y seleccionar precio vigente</h3>
              <p className="mt-1 text-xs text-slate-400">Cada cotización se agrega al historial y nunca sobrescribe otra.</p>
            </div>
            <label className="text-xs text-slate-400">
              Moneda
              <select value={currency} onChange={(event) => setCurrency(event.target.value)} className={`${inputClass} mt-1`}>
                <option value="NIO">NIO</option>
                <option value="USD">USD</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1 text-xs text-slate-400">
            Material persistido
            <select value={materialId} onChange={(event) => setMaterialId(event.target.value)} className={inputClass}>
              <option value="">Seleccionar material</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>{material.codigo} · {material.descripcion}</option>
              ))}
            </select>
          </label>

          {selectedMaterial && (
            <form
              onSubmit={(event) => void createQuote(event)}
              className="grid gap-3 rounded-lg border border-slate-800 bg-slate-950/60 p-4 sm:grid-cols-2"
            >
              <label className="space-y-1 text-xs text-slate-400">
                Proveedor
                <select required name="proveedor_id" className={inputClass} defaultValue="">
                  <option value="" disabled>Seleccionar proveedor</option>
                  {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.nombre}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs text-slate-400">
                Precio por {selectedMaterial.unidad}
                <input required name="costo_unitario" type="number" min="0" step="0.0001" className={inputClass} />
              </label>
              <label className="space-y-1 text-xs text-slate-400">
                Vigente desde
                <input
                  required
                  name="fecha_vigencia"
                  type="datetime-local"
                  defaultValue={localDateTimeValue()}
                  className={inputClass}
                />
              </label>
              <label className="space-y-1 text-xs text-slate-400">
                Origen
                <input required name="origen" maxLength={100} defaultValue="cotización de proveedor" className={inputClass} />
              </label>
              <label className="space-y-1 text-xs text-slate-400 sm:col-span-2">
                Referencia de cotización
                <input name="referencia_cotizacion" maxLength={200} placeholder="Folio o referencia documental" className={inputClass} />
              </label>
              <input type="hidden" name="moneda" value={currency} />
              <button disabled={working || !actorUserId || providers.length === 0} className={buttonClass}>
                <ReceiptText className="h-4 w-4" /> Registrar cotización
              </button>
            </form>
          )}

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="bg-slate-950 text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-3 py-2">Proveedor</th>
                  <th className="px-3 py-2 text-right">Vigente</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Origen / cotización</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {currentPrices.map((quote, index) => (
                  <tr key={quote.id} className={quote.id === Number(quoteId) ? 'bg-blue-950/30 text-white' : 'text-slate-300'}>
                    <td className="px-3 py-3">
                      <label className="flex cursor-pointer items-center gap-2">
                        <input
                          type="radio"
                          name="selectedQuote"
                          checked={quote.id === Number(quoteId)}
                          onChange={() => {
                            setQuoteId(String(quote.id));
                            setProviderId(String(quote.proveedor_id));
                          }}
                        />
                        {quote.proveedor_nombre}
                        {index === 0 && <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">MENOR VIGENTE</span>}
                      </label>
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">
                      {money(quote.costo_unitario, quote.moneda)} / {quote.unidad_precio}
                    </td>
                    <td className="px-3 py-3">{new Date(quote.fecha_vigencia).toLocaleDateString('es-NI')}</td>
                    <td className="px-3 py-3">{quote.origen}{quote.referencia_cotizacion ? ` · ${quote.referencia_cotizacion}` : ''}</td>
                  </tr>
                ))}
                {currentPrices.length === 0 && (
                  <tr><td className="px-3 py-6 text-center text-slate-400" colSpan={4}>No hay precios vigentes para este material y moneda.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <details className="rounded-lg border border-slate-800 p-3">
            <summary className="cursor-pointer text-sm font-medium text-slate-300">
              Historial completo ({quotes.length}) · no sobrescrito
            </summary>
            <div className="mt-3 space-y-2">
              {quotes.map((quote) => (
                <p key={quote.id} className="flex flex-wrap justify-between gap-2 text-xs text-slate-400">
                  <span>#{quote.id} · {quote.proveedor_nombre} · {quote.origen}</span>
                  <span>{money(quote.costo_unitario, quote.moneda)} / {quote.unidad_precio} · {new Date(quote.fecha_vigencia).toLocaleString('es-NI')}</span>
                </p>
              ))}
              {quotes.length === 0 && <p className="text-xs text-slate-500">Aún no hay cotizaciones registradas.</p>}
            </div>
          </details>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">Integración obligatoria APU</p>
            <h3 className="mt-1 font-semibold text-white">Aplicar a partida de esta versión</h3>
          </div>
          <label className="block space-y-1 text-xs text-slate-400">
            Partida · capítulo
            <select value={partId} onChange={(event) => setPartId(event.target.value)} className={inputClass}>
              <option value="">Seleccionar partida</option>
              {parts.map((part) => (
                <option key={part.id} value={part.id}>{part.codigo} · {part.descripcion} · {part.chapterName}</option>
              ))}
            </select>
          </label>
          <label className="block space-y-1 text-xs text-slate-400">
            Cantidad de material por unidad de partida
            <input
              type="number"
              min="0.0001"
              step="0.0001"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className={inputClass}
            />
          </label>
          <div className="rounded-lg border border-blue-500/20 bg-blue-950/20 p-4">
            <p className="text-xs text-blue-200">
              {persistedUnitCost === null ? 'Costo unitario estimado' : 'Costo unitario persistido por el backend'}
            </p>
            <p className="mt-1 text-2xl font-bold text-white">
              {selectedQuote
                ? money(persistedUnitCost ?? computedCost, selectedQuote.moneda)
                : '—'}
              {selectedQuote && <span className="ml-2 text-sm font-normal text-slate-400">por {selectedPart?.unidad ?? 'unidad de partida'}</span>}
            </p>
            {selectedMaterial && selectedQuote && (
              <p className="mt-2 text-xs text-slate-300">
                {selectedMaterial.descripcion} · {selectedQuote.proveedor_nombre} · cotización #{selectedQuote.id}
              </p>
            )}
          </div>
          <button
            type="button"
            disabled={working || !actorUserId || !selectedPart || !selectedMaterial || !selectedQuote || Number(quantity) <= 0}
            onClick={() => void applyQuoteToPart()}
            className={`${buttonClass} w-full`}
          >
            <CheckCircle2 className="h-4 w-4" /> Versionar APU y asociar a partida
          </button>

          <div className="border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Trazabilidad guardada</h4>
              <button
                type="button"
                title="Actualizar catálogo"
                onClick={() => void loadCatalog().catch((cause: unknown) => setError(
                  cause instanceof Error ? cause.message : 'No se pudo actualizar el catálogo.',
                ))}
                className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            {usages.length ? (
              <div className="mt-3 space-y-3">
                {usages.slice().reverse().map((usage) => {
                  const savedMaterials = materialSnapshots(usage);
                  const usageCurrency = savedMaterials[0]?.moneda ?? currency;
                  return (
                    <article key={usage.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-sm font-medium text-white">
                        {usage.proyecto_nombre} · V{usage.version_proyecto_numero} · {usage.partida_codigo} · APU V{usage.version_apu_numero}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {usage.apu_nombre} · Costo unitario {money(Number(usage.snapshot.costo_unitario), usageCurrency)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">Capítulo {usage.capitulo_codigo} · Uso #{usage.id}</p>
                      {savedMaterials.map((snapshot) => (
                        <p
                          key={`${snapshot.cotizacionId}-${snapshot.material}`}
                          className="mt-2 border-t border-slate-800 pt-2 text-xs text-emerald-200"
                        >
                          Material: {snapshot.material} · Proveedor: {snapshot.proveedor} ·
                          {' '}Precio: {money(snapshot.precio, snapshot.moneda)} / {snapshot.unidad} ·
                          {' '}Cotización #{snapshot.cotizacionId} · {snapshot.origen}
                          {snapshot.referencia ? ` · ${snapshot.referencia}` : ''}
                          {' '}· Vigente desde {new Date(snapshot.fechaVigencia).toLocaleDateString('es-NI')}
                        </p>
                      ))}
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-500">Selecciona una partida para consultar sus usos APU registrados.</p>
            )}
          </div>
        </div>
      </section>

      <p className="text-xs text-slate-500">
        El snapshot de cada uso conserva el proveedor, la cotización, el origen, la fecha y el precio elegidos; nuevas cotizaciones no alteran versiones anteriores.
      </p>
      {selectedProvider && <span className="sr-only">Proveedor seleccionado: {selectedProvider.nombre}</span>}
    </section>
  );
}
