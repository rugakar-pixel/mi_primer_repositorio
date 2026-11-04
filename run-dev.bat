@echo off
setlocal

if not exist "%~dp0backend\.venv\Scripts\activate.bat" (
    echo ERROR: No se encontro el entorno virtual del backend en backend\.venv.
    echo Crea o configura el entorno virtual antes de iniciar el proyecto.
    pause
    exit /b 1
)

if not exist "%~dp0frontend\package.json" (
    echo ERROR: No se encontro frontend\package.json.
    pause
    exit /b 1
)

start "Backend FastAPI - 8080" cmd /k "cd /d ""%~dp0backend"" && call ""%~dp0backend\.venv\Scripts\activate.bat"" && uvicorn app.main:app --reload --port 8080"
start "Frontend Vite" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo Backend y frontend iniciados en ventanas separadas.
echo API: http://127.0.0.1:8080
echo Frontend: http://localhost:3000
endlocal
