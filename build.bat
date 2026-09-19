@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
title AuraBeats Builder

:: ─────────────────────────────────────────────────────────────
::  AuraBeats · Smart Build Script
::  https://aurabeats.jakariatanjim.workers.dev
:: ─────────────────────────────────────────────────────────────

set "START_TIME=%time%"
set "ERRORS=0"
set "LINE=────────────────────────────────────────────────────"

echo.
echo   ╔══════════════════════════════════════════════════╗
echo   ║          AuraBeats · Build Pipeline              ║
echo   ║          Pure Open Sound Engine                  ║
echo   ╚══════════════════════════════════════════════════╝
echo.

:: ── Step 0: Check Node.js ────────────────────────────────────
echo   [0/4] Checking environment...

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   ✖  Node.js not found. Install from https://nodejs.org
    echo.
    goto :fail
)

for /f "tokens=*" %%v in ('node -v 2^>nul') do set "NODE_VER=%%v"
echo         Node.js  %NODE_VER%

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo   ✖  npm not found. Reinstall Node.js.
    echo.
    goto :fail
)

for /f "tokens=*" %%v in ('npm -v 2^>nul') do set "NPM_VER=%%v"
echo         npm      v%NPM_VER%
echo         %LINE%

:: ── Step 1: Install ──────────────────────────────────────────
echo.
echo   [1/4] Installing dependencies...
echo.

call npm install --loglevel=error
if %errorlevel% neq 0 (
    echo.
    echo   ✖  npm install failed.
    set /a ERRORS+=1
    goto :fail
)
echo.
echo         ✔  Dependencies installed
echo         %LINE%

:: ── Step 2: Type check ───────────────────────────────────────
echo.
echo   [2/4] Type-checking with TypeScript...
echo.

call npx tsc --noEmit
if %errorlevel% neq 0 (
    echo.
    echo   ⚠  TypeScript found issues (build will continue)
    set /a ERRORS+=1
) else (
    echo         ✔  Zero type errors
)
echo         %LINE%

:: ── Step 3: Build ────────────────────────────────────────────
echo.
echo   [3/4] Building production bundle...
echo.

call npm run build
if %errorlevel% neq 0 (
    echo.
    echo   ✖  Vite build failed.
    set /a ERRORS+=1
    goto :fail
)
echo.
echo         ✔  Production bundle ready
echo         %LINE%

:: ── Step 4: Summary ──────────────────────────────────────────
echo.
echo   [4/4] Build summary
echo.

if exist "dist\index.html" (
    for %%A in ("dist\index.html") do (
        set "SIZE=%%~zA"
        set /a KB=!SIZE!/1024
        echo         Output   dist\index.html ^(!KB! KB^)
    )
) else (
    echo         ⚠  dist\index.html not found
    set /a ERRORS+=1
)

set "END_TIME=%time%"
echo         Errors   %ERRORS%
echo.

if %ERRORS% equ 0 (
    echo   ╔══════════════════════════════════════════════════╗
    echo   ║   ✔  BUILD SUCCESSFUL                           ║
    echo   ║                                                  ║
    echo   ║   Preview:  npm run preview                      ║
    echo   ║   Deploy:   upload dist/ to Cloudflare Pages     ║
    echo   ╚══════════════════════════════════════════════════╝
) else (
    echo   ╔══════════════════════════════════════════════════╗
    echo   ║   ⚠  BUILD COMPLETED WITH WARNINGS              ║
    echo   ╚══════════════════════════════════════════════════╝
)

echo.
pause
exit /b 0

:fail
echo.
echo   ╔══════════════════════════════════════════════════╗
echo   ║   ✖  BUILD FAILED                               ║
echo   ║                                                  ║
echo   ║   Check the errors above and try again.          ║
echo   ╚══════════════════════════════════════════════════╝
echo.
pause
exit /b 1
