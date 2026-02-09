@echo off
echo Starting Partners Synergy Engine...

:: Start Backend
start "Partners Backend (Synergy Engine)" cmd /k "cd backend && python main.py"

:: Start Frontend
start "Partners Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Partners is launching!
echo.
echo Backend API running at: http://localhost:8000
echo Frontend accessible at: http://localhost:5173
echo.
echo (Note: Frontend port might verify based on Vite config, check the frontend terminal)
echo ===================================================
pause
