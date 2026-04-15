@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ==========================================
echo   MineralChain Backend ^(PostgreSQL^)
echo ==========================================

if exist "..\..\.venv\Scripts\python.exe" (
  echo [OK] Environnement detecte: .venv
  ..\..\.venv\Scripts\python.exe app.py
) else (
  if exist "..\..\.venv-1\Scripts\python.exe" (
    echo [WARN] .venv absent, utilisation de .venv-1
    ..\..\.venv-1\Scripts\python.exe app.py
  ) else (
    echo [ERROR] Aucun environnement Python trouve.
    echo Attendu: ..\..\.venv\Scripts\python.exe
    pause
    exit /b 1
  )
)
pause
