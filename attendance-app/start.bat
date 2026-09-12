@echo off
setlocal
title Attendance App - Launcher

echo ============================================================
echo   Attendance Management Web App - Starting
echo ============================================================
echo.

REM ---------- Sanity checks ----------
if not exist node_modules (
    echo [X] node_modules not found.
    echo     Run setup.bat first.
    pause
    exit /b 1
)

if not exist .next (
    echo [X] Production build not found.
    echo     Run setup.bat first.
    pause
    exit /b 1
)

if not exist python-service\venv (
    echo [X] python-service\venv not found.
    echo     Run setup.bat first.
    pause
    exit /b 1
)

if not exist .env (
    echo [X] .env not found.
    echo     Run setup.bat first, then edit .env.
    pause
    exit /b 1
)

REM ---------- 1. Python face service ----------
echo [1/2] Starting Python face service on port 8000...
start "Attendance - Face Service" cmd /k ^
    "cd /d "%~dp0python-service" && call venv\Scripts\activate.bat && uvicorn main:app --port 8000"

timeout /t 3 /nobreak >nul

REM ---------- 2. Next.js production app ----------
echo [2/2] Starting Next.js production app on port 3000...
start "Attendance - Web App" cmd /k ^
    "cd /d "%~dp0" && npm run start"

timeout /t 4 /nobreak >nul

echo.
echo ============================================================
echo   Both services launched in separate windows.
echo.
echo   Public page :  http://localhost:3000/attendance
echo   Admin login :  http://localhost:3000/login
echo   Face health :  http://127.0.0.1:8000/health
echo.
echo   Close the two spawned windows to stop the app.
echo ============================================================
echo.
echo Opening browser...
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000/attendance"

endlocal