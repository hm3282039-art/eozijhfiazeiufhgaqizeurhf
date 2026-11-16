#!/bin/bash
echo ""
echo "  Pet World 3D — lancement..."
echo "  Ouverture du jeu : http://localhost:8000"
echo "  (Pour arreter : fermez cette fenetre)"
echo ""
xdg-open "http://localhost:8000" 2>/dev/null || echo "  Ouvrez http://localhost:8000 dans votre navigateur"
python3 -m http.server 8000
