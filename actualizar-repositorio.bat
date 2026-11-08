@echo off
setlocal

cd /d "%~dp0"

echo Actualizando el repositorio...
git pull --ff-only

if errorlevel 1 (
    echo.
    echo No se pudo actualizar automaticamente.
    echo Revisa si hay cambios locales o si necesitas resolver una divergencia.
    pause
    exit /b 1
)

echo.
echo Repositorio actualizado correctamente.
pause
