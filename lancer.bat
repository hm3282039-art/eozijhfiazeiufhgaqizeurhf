@echo off
chcp 65001 >nul
title Pet World 3D

echo.
echo   Pet World 3D — lancement...
echo   Ouverture du jeu : http://localhost:8000
echo   (Pour arreter : fermez cette fenetre)
echo.

start "" "http://localhost:8000"

REM 1) Node.js : serveur portable inclus (serveur.cjs), sans npm install.
where node >nul 2>nul
if %errorlevel%==0 (
    node serveur.cjs
    goto :running
)

REM 2) Python (3 variantes).
python -m http.server 8000 2>nul && goto :running
python3 -m http.server 8000 2>nul && goto :running
py -m http.server 8000 2>nul && goto :running

REM Aucun serveur HTTP disponible.
echo.
echo   ERREUR : aucun serveur HTTP trouve.
echo   Installez Node.js ^(https://nodejs.org^) OU Python 3 ^(https://www.python.org/downloads/^),
echo   puis relancent ce lanceur.
pause
exit /b 1

:running
echo.
echo   Jeu pret sur http://localhost:8000 — fermez cette fenetre pour arreter.
pause
