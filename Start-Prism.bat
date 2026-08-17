@echo off
title PRISM - Deal Distribution Engine
cd /d "%~dp0"

echo ========================================================
echo               PRISM DEAL STUDIO & ENGINE
echo ========================================================
echo.
echo [1/3] Initializing local SQLite database & environment...

:: Check if server is already running on port 3000 or 3001
netstat -ano | findstr ":3000" >nul
if %errorlevel% equ 0 (
    echo [2/3] PRISM is already running on port 3000!
    echo [3/3] Opening your browser...
    start http://localhost:3000
    exit /b 0
)

netstat -ano | findstr ":3001" >nul
if %errorlevel% equ 0 (
    echo [2/3] PRISM is already running on port 3001!
    echo [3/3] Opening your browser...
    start http://localhost:3001
    exit /b 0
)

echo [2/3] Starting PRISM Next.js server locally...
start /min cmd.exe /c "npm.cmd run dev"

echo [3/3] Waiting for server to initialize...
timeout /t 4 /nobreak >nul

echo.
echo Launching PRISM in your default browser...
start http://localhost:3000

echo.
echo PRISM is running locally on http://localhost:3000
echo You can minimize this window.
exit /b 0
