@echo off
setlocal
title AuraBeats - Build Automation
echo ============================================
echo   AuraBeats :: Windows build automation
echo ============================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found on PATH. Install Node.js 18+ and retry.
  pause
  exit /b 1
)

echo [1/3] Installing dependencies...
call npm install
if errorlevel 1 (
  echo [ERROR] npm install failed.
  pause
  exit /b 1
)

echo.
echo [2/3] Type-checking sources...
call npx tsc --noEmit
if errorlevel 1 (
  echo [ERROR] TypeScript check failed.
  pause
  exit /b 1
)

echo.
echo [3/3] Building production bundle...
call npm run build
if errorlevel 1 (
  echo [ERROR] Build failed.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   SUCCESS  Output written to .\dist
echo   Preview locally with:  call npm run preview
echo ============================================
pause
endlocal
