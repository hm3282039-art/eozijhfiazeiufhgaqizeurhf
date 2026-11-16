@echo off
chcp 65001 >nul
title Pet World 3D

echo.
echo   Pet World 3D — lancement...
echo   Ouverture du jeu : http://localhost:8000
echo   (Pour arreter : fermez cette fenetre)
echo.

start "" "http://localhost:8000"
python -m http.server 8000 2>nul || python3 -m http.server 8000
