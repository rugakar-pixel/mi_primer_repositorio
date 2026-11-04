# Motor de Presupuesto MO y Flujo de Caja

Aplicación web para presupuesto de mano de obra, cronograma, planilla y exportación a Excel.
El Motor de Presupuesto se organiza como el primer módulo de una aplicación que podrá crecer.

## Estructura principal

- `src/main.tsx`: punto de arranque de la aplicación.
- `src/app/`: estructura general de la aplicación y estilos globales.
- `src/app/AccessScreen.tsx`: pantalla de acceso de demostración.
- `src/modules/presupuesto-mo/`: Módulo 1, con sus pantallas, componentes, cálculos, tipos y exportación Excel.
- `examples/`: libro Excel de referencia; no es necesario para iniciar la aplicación.
- `BITACORA.md`: registro de decisiones, cambios y tareas pendientes.
- `package.json` y `package-lock.json`: dependencias y comandos del proyecto.
- `vite.config.ts` y `tsconfig.json`: configuración de desarrollo y TypeScript.

## Requisitos

- Node.js LTS
- npm

## Desarrollo local

```powershell
npm install
npm run dev
```

Abre la URL local que muestra Vite en la terminal.

## Validación

```powershell
npm run lint
npm run build
```

La aplicación no requiere Python ni una clave de Gemini para ejecutarse.
Después del acceso de demostración, la vista inicial es `Consolidado`; por ahora
presenta las partidas calculadas por el Módulo de Mano de Obra.
