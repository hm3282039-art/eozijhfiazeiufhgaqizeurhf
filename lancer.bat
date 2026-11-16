@echo off
node serveur.cjs 2>nul || (
    python -m http.server 8000
    python3 -m http.server 8000
)
pause
