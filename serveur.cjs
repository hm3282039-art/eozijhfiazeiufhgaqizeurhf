#!/usr/bin/env node
/**
 * Serveur HTTP statique pour Pet World 3D — Node.js, SANS aucune dépendance
 * (pas de `npm install`). Sers le dossier courant sur http://localhost:8000.
 *
 * Lance avec : node serveur.js
 * (lancé automatiquement par lancer.bat / lancer.command / lancer.sh).
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
};

const server = http.createServer((req, res) => {
  try {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/') url = '/index.html';
    const filePath = path.join(__dirname, path.normalize(url));
    // Empêche la traversée de fichiers.
    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403);
      res.end('403');
      return;
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('404 — fichier non trouve');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  } catch (e) {
    res.writeHead(500);
    res.end('500');
  }
});

server.listen(PORT, () => {
  console.log(`Pet World 3D — http://localhost:${PORT}`);
  console.log('Ferme cette fenetre pour arreter le jeu.');
});
