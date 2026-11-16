#!/usr/bin/env node
/**
 * Serveur HTTP statique pour Pet World 3D — Node.js, SANS npm install.
 *
 * - Cherche automatiquement un port libre (8000..8008) : evite EADDRINUSE.
 * - Ouvre automatiquement le navigateur sur le port choisi (apres avoir ecoute).
 * - Sers index.html + les modules ES + les ressources.
 *
 * Lance avec : node serveur.cjs
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const ROOT = __dirname;
const BASE_PORT = 8000;
const MAX_PORT = 8008;

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

/** Traitement d'une requete : sert le fichier demande. */
function serve(req, res) {
  try {
    let url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/') url = '/index.html';
    const filePath = path.join(ROOT, path.normalize(url));
    // Empeche la traversee de fichiers.
    if (!filePath.startsWith(ROOT)) {
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
}

/** Ouvre le navigateur sur l'URL (commande systeme selon la plateforme). */
function openBrowser(url) {
  try {
    const platform = process.platform;
    let cmd;
    if (platform === 'win32') cmd = `start "" "${url}"`;
    else if (platform === 'darwin') cmd = `open "${url}"`;
    else cmd = `xdg-open "${url}"`;
    exec(cmd, () => {}); // erreur ignoree (navigateur absent ne fait pas planter)
  } catch (e) {
    /* ignore */
  }
}

/** Essaie d'ecouter sur `port` ; si occupe, passe au port suivant. */
function tryListen(port) {
  if (port > MAX_PORT) {
    console.error(`Aucun port libre entre ${BASE_PORT} et ${MAX_PORT}.`);
    console.error("Fermez l'instance du jeu qui utilise un port, puis relancent.");
    process.exit(1);
  }

  const srv = http.createServer(serve);
  srv.once('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} occupe — essai du port suivant...`);
      tryListen(port + 1);
    } else {
      console.error('Erreur serveur :', err.message);
      process.exit(1);
    }
  });

  srv.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`Pet World 3D pret : ${url}`);
    console.log('Ferme cette fenetre pour arreter le jeu.');
    openBrowser(url);
  });
}

tryListen(BASE_PORT);
