@echo off
cd /d "%~dp0"

echo Installing Node dependencies...
npm install

echo Setting up database...
npm run db:push
npm run db:generate

echo Setting up Python face service...
cd python-service

if not exist .venv (
    python -m venv .venv
)

call .venv\Scripts\activate
python -m pip install -r requirements.txt

echo.
echo Setup completed successfully.
pause