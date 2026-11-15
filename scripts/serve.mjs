#!/usr/bin/env node
/**
 * Petit serveur statique de développement — zéro dépendance.
 *
 * Les modules ES (`<script type="module">`) ne se chargent pas en `file://`,
 * il faut donc servir le dossier du projet en HTTP :
 *
 *   npm start              → http://localhost:5173
 *   PORT=8080 npm start    → http://localhost:8080
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PORT = Number(process.env.PORT) || 5173;
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.bin': 'application/octet-stream',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-cache', ...headers });
  res.end(body);
}

/** Transforme l'URL demandée en chemin de fichier sûr (jamais hors du projet). */
async function resolveFile(requestUrl) {
  const { pathname } = new URL(requestUrl, 'http://localhost');
  const decoded = decodeURIComponent(pathname);

  // On ne sert ni les fichiers cachés (.git, .env…) ni les dépendances locales.
  const segments = decoded.split('/').filter(Boolean);
  if (segments.some((s) => s.startsWith('.') || s === 'node_modules')) return null;

  let filePath = resolve(join(ROOT, decoded));
  if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) return null;

  const info = await stat(filePath).catch(() => null);
  if (info?.isDirectory()) {
    filePath = join(filePath, 'index.html');
    return (await stat(filePath).catch(() => null))?.isFile() ? filePath : null;
  }
  return info?.isFile() ? filePath : null;
}

const server = createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    send(res, 405, 'Method Not Allowed', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  try {
    const filePath = await resolveFile(req.url ?? '/');
    if (!filePath) {
      send(res, 404, 'Not Found', { 'Content-Type': 'text/plain; charset=utf-8' });
      return;
    }
    const body = await readFile(filePath);
    const type = MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
    send(res, 200, req.method === 'HEAD' ? undefined : body, {
      'Content-Type': type,
      'Content-Length': body.length,
    });
  } catch (error) {
    console.error(error);
    send(res, 500, 'Internal Server Error', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  🐾  Pet World 3D — serveur de dev prêt`);
  console.log(`      → http://localhost:${PORT}\n`);
});
