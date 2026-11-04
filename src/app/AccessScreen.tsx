import { useState, type FormEvent } from 'react';
import { HardHat, LockKeyhole } from 'lucide-react';

interface AccessScreenProps {
  onLogin: (username: string, password: string) => void;
  error: string;
}

export function AccessScreen({ onLogin, error }: AccessScreenProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin(username, password);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-100">
      <section className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/30">
        <div className="border-b border-slate-800 px-8 py-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-950/50">
            <HardHat className="h-7 w-7" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-300">Gestión de proyectos</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Motor de Presupuesto</h1>
          <p className="mt-2 text-sm text-slate-400">Ingresa para acceder al espacio de trabajo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-7">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Usuario</span>
            <input
              autoComplete="username"
              required
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Usuario"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-300">Contraseña</span>
            <input
              autoComplete="current-password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Contraseña"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          {error && (
            <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            <LockKeyhole className="h-4 w-4" />
            Ingresar
          </button>
        </form>

        <div className="border-t border-slate-800 bg-slate-950/60 px-8 py-4 text-center text-xs text-slate-500">
          Prototipo de diseño · Acceso de demostración, no es seguridad real
        </div>
      </section>
    </main>
  );
}
