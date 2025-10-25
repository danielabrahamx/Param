@echo off
REM Start all services for Paramify platform
REM Run this after rebooting to start everything

echo Starting Paramify Platform...
echo.

REM Start Hardhat node in a new window
echo [1/3] Starting Hardhat node at localhost:8545...
start "Hardhat Node" cmd /k "cd /d c:\Users\danie\Param\contracts && npx hardhat node"

REM Wait for Hardhat to start
timeout /t 3 /nobreak

REM Start backend services in a new window
echo [2/3] Starting backend services (Docker)...
start "Backend Services" cmd /k "cd /d c:\Users\danie\Param\backend && docker compose up -d"

REM Wait for backend to start
timeout /t 5 /nobreak

REM Start frontend in a new window
echo [3/3] Starting frontend at localhost:5177...
start "Frontend" cmd /k "cd /d c:\Users\danie\Param\frontend && npm run dev"

echo.
echo ================================================
echo Paramify Platform Starting!
echo ================================================
echo Hardhat Node:     http://localhost:8545
echo Backend API:      http://localhost:3000
echo Frontend:         http://localhost:5177
echo ================================================
echo.
pause
