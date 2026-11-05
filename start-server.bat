@echo off
title Queens Game Server
cd /d "%~dp0"
echo ==================================================
echo    Queens Game Local Server
echo    URL: http://localhost:8080
echo ==================================================
echo.
echo Opening browser...
start http://localhost:8080
echo Starting server...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8080
pause
