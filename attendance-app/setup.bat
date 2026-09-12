@echo off
setlocal enabledelayedexpansion
title Attendance App - Setup
color 0A

echo ============================================================
echo   Attendance Management Web App - Windows Setup
echo ============================================================
echo.

REM ---------- 1. Check Node.js ----------
where node >nul 2>nul
if errorlevel 1 (
    echo [X] Node.js not found.
    echo     Install from https://nodejs.org/  ^(LTS, 18+^)
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js !NODE_VERSION!

where npm >nul 2>nul
if errorlevel 1 (
    echo [X] npm not found. Reinstall Node.js.
    pause
    exit /b 1
)
echo [OK] npm found
echo.

REM ---------- 2. Check Python 3.11 ----------
set PYTHON_CMD=
py -3.11 --version >nul 2>nul
if not errorlevel 1 (
    set PYTHON_CMD=py -3.11
    goto :python_ok
)
python --version 2>nul | findstr /C:"3.11" >nul
if not errorlevel 1 (
    set PYTHON_CMD=python
    goto :python_ok
)

echo [X] Python 3.11 not found.
echo.
echo     Download Python 3.11.10:
echo     https://www.python.org/downloads/release/python-31110/
echo.
echo     IMPORTANT: during install, tick "Add Python to PATH"
echo.
pause
exit /b 1

:python_ok
echo [OK] Python: !PYTHON_CMD!
echo.

REM ---------- 3. npm install ----------
echo [1/5] Installing Node dependencies...
call npm install
if errorlevel 1 (
    echo [X] npm install failed.
    pause
    exit /b 1
)
echo.

REM ---------- 4. .env ----------
echo [2/5] Preparing .env...
if exist .env (
    echo      .env already exists - leaving it untouched.
) else (
    if exist .env.example (
        copy .env.example .env >nul
        echo      Created .env from .env.example
        echo      ^>^> Edit .env later to set ADMIN_PASSWORD and SESSION_SECRET
    ) else (
        echo [X] Neither .env nor .env.example found.
        pause
        exit /b 1
    )
)
echo.

REM ---------- 5. Prisma ----------
echo [3/5] Setting up database...
call npm run db:push
if errorlevel 1 ( echo [X] db:push failed. & pause & exit /b 1 )
call npm run db:generate
if errorlevel 1 ( echo [X] db:generate failed. & pause & exit /b 1 )
call npm run db:seed
if errorlevel 1 ( echo [!] db:seed failed - continuing anyway. )
echo.

REM ---------- 6. Python venv ----------
echo [4/5] Creating Python virtual environment...
cd python-service
if exist venv (
    echo      venv already exists - skipping creation.
) else (
    !PYTHON_CMD! -m venv venv
    if errorlevel 1 (
        echo [X] venv creation failed.
        cd ..
        pause
        exit /b 1
    )
)

call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [X] Failed to activate venv.
    cd ..
    pause
    exit /b 1
)
echo.

REM ---------- 7. Python deps ----------
echo [5/5] Installing Python dependencies...
echo      dlib compiles from source - this can take 5-15 minutes.
echo.
pip install --upgrade pip wheel
pip install -r requirements.txt
if errorlevel 1 (
    echo.
    echo [X] Python dependency install failed.
    echo     If dlib failed, install CMake + VS Build Tools first:
    echo     https://cmake.org/download/
    cd ..
    pause
    exit /b 1
)
echo.

echo Verifying Python installation...
python -c "import dlib, face_recognition_models, face_recognition, cv2, fastapi; print('[OK] All Python packages importable')"
if errorlevel 1 (
    echo [X] Verification failed - one or more packages are missing.
    cd ..
    pause
    exit /b 1
)

cd ..
echo.
echo ============================================================
echo   SETUP COMPLETE
echo ============================================================
echo.
echo Next steps:
echo   1. Edit .env  - set ADMIN_PASSWORD and SESSION_SECRET
echo   2. Run  start.bat  to launch the app
echo.
pause
endlocal