@echo off
cd /d "%~dp0"

echo Starting Face Recognition Service...
start "Face Recognition Service" cmd /k "cd /d %~dp0python-service && call .venv\Scripts\activate && uvicorn main:app --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Attendance Web App...
start "Attendance Web App" cmd /k "cd /d %~dp0 && npm run dev"

timeout /t 3 /nobreak >nul

start http://localhost:3000