@echo off
echo ===================================================
echo   Vedyam Website Startup Script
echo ===================================================

echo Starting Vedyam Backend (API + Main Website) on port 8000...
start "Vedyam Backend" cmd /k "cd backend && python app.py"

echo Starting Vedyam Simulator Frontend on port 5173...
start "Vedyam Simulator Frontend" cmd /k "cd simulator-frontend && npm install && npm run dev"

echo.
echo The Main Website is running!
echo - Access it here: http://127.0.0.1:8000
echo - Simulator / Learning mode will be available at http://localhost:5173
echo.
pause
