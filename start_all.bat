@echo off
echo ===================================================
echo   Vedyam Monorepo Startup Script
echo ===================================================

echo Starting Vedyam Website Backend on port 8000...
start "Website Backend" cmd /k "cd website\backend && python server.py"

echo Starting Simulator Backend...
start "Simulator Backend" cmd /k "cd backend && python backend.py"

echo Starting Simulator Frontend on port 5173...
start "Simulator Frontend" cmd /k "cd simulator-frontend && npm run dev"

echo.
echo All services have been launched in separate windows!
echo - Website: http://127.0.0.1:8000
echo - Simulator: http://localhost:5173
echo.
pause
