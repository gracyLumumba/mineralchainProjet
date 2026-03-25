@echo off
chcp 65001 >nul
cd /d backend-minier
call .venv\Scripts\activate
python app.py
pause
