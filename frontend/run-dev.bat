@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: Node.js no esta instalado o no esta disponible en PATH.
    echo Instala Node.js LTS desde https://nodejs.org/ y vuelve a intentarlo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo Instalando dependencias del proyecto...
    call npm.cmd install
    if errorlevel 1 (
        echo ERROR: No se pudieron instalar las dependencias.
        pause
        exit /b 1
    )
)

echo Iniciando la aplicacion. Mantén esta ventana abierta mientras la uses.
call npm.cmd run dev
if errorlevel 1 (
    echo ERROR: No se pudo iniciar la aplicacion.
    pause
    exit /b 1
)
