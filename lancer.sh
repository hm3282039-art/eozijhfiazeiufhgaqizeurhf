#!/bin/bash
echo ""
echo "  Pet World 3D — lancement..."
echo "  Le jeu s'ouvrira automatiquement dans le navigateur..."
echo "  (Pour arreter : fermez cette fenetre)"
echo ""

# Ouvre le navigateur ~2s apres le lancement (le serveur a le temps de se preparer).
( sleep 2; xdg-open "http://localhost:8000" 2>/dev/null ) &

python3 -m http.server 8000 2>/dev/null
node serveur.cjs
