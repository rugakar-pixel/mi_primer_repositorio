@echo off
title Servidor de Construccion - COS
echo ====================================================
echo   INICIANDO SISTEMA DE GESTION DE CONSTRUCCION (COS)
echo ====================================================

:: 1. Iniciar el Backend en una ventana nueva
echo Encendiendo el Cerebro (Backend FastAPI en Puerto 8000)...
start "COS - Backend FastAPI" cmd /k "cd backend && ..\.venv\Scripts\activate && set PYTHONPATH=. && uvicorn app.main:app --reload"

:: 2. Esperar 3 segundos a que el backend conecte a Postgres
timeout /t 3 /nobreak > nul

:: 3. Iniciar el Frontend en una ventana nueva
echo Encendiendo la Interfaz Grafica (Frontend React en Puerto 3000)...
start "COS - Frontend React" cmd /k "cd frontend && npm run dev"

echo ====================================================
echo   ¡TODO LISTO! Puedes ir a http://localhost:3000/
echo ====================================================
pause
