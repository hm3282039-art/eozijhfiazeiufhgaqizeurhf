#!/bin/bash
echo ""
echo "  Pet World 3D — lancement..."
echo "  Ouverture du jeu : http://localhost:8000"
echo "  (Pour arreter : fermez cette fenetre)"
echo ""
open "http://localhost:8000"

# python3 est pre-installe sur macOS : priorite, puis node (serveur.cjs portable).
python3 -m http.server 8000 2>/dev/null
node serveur.cjs
