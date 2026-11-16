#!/bin/bash
echo ""
echo "  Pet World 3D — lancement..."
echo "  Ouverture du jeu : http://localhost:8000"
echo "  (Pour arreter : fermez cette fenetre)"
echo ""
open "http://localhost:8000"
python3 -m http.server 8000
