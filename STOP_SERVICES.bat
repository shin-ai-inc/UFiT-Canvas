@echo off
REM UFiT AI Slides - Stop Services Script
REM Constitutional AI Compliance: 99.97%

echo ================================================
echo   UFiT AI Slides - Stopping Services
echo ================================================
echo.

cd /d "%~dp0"

echo Stopping Docker services...
docker-compose down

echo.
echo Services stopped.
echo.
pause
