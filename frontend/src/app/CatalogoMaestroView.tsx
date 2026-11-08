import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Database, RefreshCw, Search } from 'lucide-react';

interface CatalogoItem {
  id: number;
  codigo: string;
  descripcion: string;
  unidad: string;
  costo_unitario: number;
  categoria: string;
}

interface CatalogoResponse {
  items: CatalogoItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  categorias: string[];
}

interface CatalogoMaestroViewProps {
  onBack: () => void;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const currencyFormatter = new Intl.NumberFormat('es-NI', {
  style: 'currency',
  currency: 'NIO',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export function CatalogoMaestroView({ onBack }: CatalogoMaestroViewProps) {
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState('');
  const [page, setPage] = useState(1);
  const [retry, setRetry] = useState(0);
  const [result, setResult] = useState<CatalogoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchText.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchText]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (categoria) params.set('categoria', categoria);

    setLoading(true);
    setError('');

    fetch(`${API_BASE_URL}/api/v1/catalogo?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const detail = await response.text();
          throw new Error(detail || `Error HTTP ${response.status}`);
        }
        return response.json() as Promise<CatalogoResponse>;
      })
      .then((data) => {
        setResult(data);
        setError('');
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return;
        setError('No se pudo consultar el catálogo. Verifica que el backend y PostgreSQL estén activos.');
        setResult(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [categoria, page, retry, search]);

  const totalPages = result?.total_pages ?? 0;
  const displayedPage = totalPages === 0 ? 1 : page;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBack}
            title="Volver al Tablero Central"
            aria-label="Volver al Tablero Central"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/10 text-blue-300 sm:flex">
              <Database className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-blue-300">COS — Construction Operating System</p>
              <p className="text-[10px] leading-tight text-slate-400">Gerente Administrativo IA para Construcción</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-300">Referencia histórica</p>
              <h1 className="truncate text-lg font-bold text-white sm:text-xl">Visor del Catálogo Maestro</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-slate-400">Partidas históricas de costos de construcción</p>
            <p className="mt-1 text-xs text-slate-500">
              {result ? `${result.total.toLocaleString('es-NI')} resultados` : 'Catálogo PostgreSQL'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRetry((value) => value + 1)}
            disabled={loading}
            title="Actualizar resultados"
            aria-label="Actualizar resultados"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-wait disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <section aria-label="Filtros del catálogo" className="mb-4 grid gap-3 sm:grid-cols-[minmax(16rem,1fr)_15rem]">
          <label className="relative block">
            <span className="sr-only">Buscar por código, descripción o unidad</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Buscar código, descripción o unidad"
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 pl-10 pr-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>
          <label className="block">
            <span className="sr-only">Filtrar por categoría</span>
            <select
              value={categoria}
              onChange={(event) => {
                setCategoria(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 text-sm text-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Todas las categorías</option>
              {(result?.categorias ?? []).map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
        </section>

        <section aria-label="Partidas del catálogo" className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-900 text-xs uppercase text-slate-400">
                <tr>
                  <th scope="col" className="w-36 px-4 py-3 font-semibold">Código</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Descripción</th>
                  <th scope="col" className="w-28 px-4 py-3 font-semibold">Unidad</th>
                  <th scope="col" className="w-44 px-4 py-3 text-right font-semibold">Costo Unitario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-400">Consultando catálogo…</td></tr>
                )}
                {!loading && error && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-rose-300">{error}</td></tr>
                )}
                {!loading && !error && result?.items.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-slate-400">No hay partidas que coincidan con los filtros.</td></tr>
                )}
                {!loading && !error && result?.items.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-slate-800/50">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-blue-300">{item.codigo}</td>
                    <td className="min-w-96 px-4 py-3 leading-5 text-slate-200">{item.descripcion}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-400">{item.unidad}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono tabular-nums text-slate-100">
                      {currencyFormatter.format(item.costo_unitario)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 px-4 py-3">
            <p className="text-xs text-slate-500">
              {result ? `Página ${displayedPage} de ${Math.max(totalPages, 1)}` : 'Esperando datos'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={loading || page <= 1}
                className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-700 px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => current + 1)}
                disabled={loading || !result || page >= totalPages}
                className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-700 px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
