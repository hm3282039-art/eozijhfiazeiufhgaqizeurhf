#!/bin/bash
node serveur.cjs 2>/dev/null || python3 -m http.server 8000
