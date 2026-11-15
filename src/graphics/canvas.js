import * as THREE from 'three';

/** Police « cartoon » utilisée dans l'UI et sur les textures dessinées (panneaux, étiquettes). */
export const FONT_FAMILY = '"Fredoka", "Baloo 2", "Nunito", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif';

let maxAnisotropy = 1;

/** Renseigné une fois par le jeu à partir des capacités de la carte graphique. */
export function setMaxAnisotropy(value) {
  maxAnisotropy = Math.max(1, value || 1);
}

export function createCanvas(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  const ctx = canvas.getContext('2d');
  return { canvas, ctx };
}

/**
 * Convertit un canvas 2D en texture three.js correctement configurée (sRGB, filtrage net).
 * @param {HTMLCanvasElement} canvas
 * @param {{ repeat?: [number, number], anisotropy?: number }} [options]
 */
export function canvasToTexture(canvas, { repeat = null, anisotropy = 8 } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(anisotropy, maxAnisotropy);
  if (repeat) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat[0], repeat[1]);
  }
  return texture;
}

/** Convertit `#rrggbb` en `rgba(r, g, b, alpha)` (pour les dégradés vers la transparence). */
export function hexToRgba(hex, alpha = 1) {
  const value = parseInt(hex.replace('#', ''), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

/** Raccourci pour `ctx.font`. */
export function fontStyle(weight, sizePx) {
  return `${weight} ${Math.round(sizePx)}px ${FONT_FAMILY}`;
}

/** Trace (sans remplir) un rectangle aux coins arrondis. */
export function roundRectPath(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Texte « cartoon » : remplissage clair + contour épais foncé. */
export function drawOutlinedText(ctx, text, x, y, { fill = '#ffffff', stroke = '#262b47', lineWidth = 8 } = {}) {
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}
