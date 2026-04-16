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
  echo [ERROR] .venv introuvable.
  echo [INFO] Le backend doit utiliser .venv avec scikit-learn 1.6.1 pour rester compatible avec les modeles entraines.
  echo Attendu: ..\..\.venv\Scripts\python.exe
  pause
  exit /b 1
)
pause
