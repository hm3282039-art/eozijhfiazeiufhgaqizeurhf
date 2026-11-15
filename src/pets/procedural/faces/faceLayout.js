import { FACE_SURFACE } from '../petAnatomy.js';

/**
 * Plan du visage, en « unités de dessin » : le canvas mesure toujours 1000 unités de large,
 * quelle que soit sa résolution réelle (le contexte 2D est mis à l'échelle avant de dessiner).
 *
 * La partie PLATE de la face avant du corps correspond à x ∈ [204, 796] et y ∈ [204, 704] ;
 * au-delà, la texture s'enroule sur les bords arrondis de la guimauve.
 */
export const FACE = Object.freeze({
  width: 1000,
  height: (1000 * FACE_SURFACE.height) / FACE_SURFACE.width,
  centerX: 500,

  eyeY: 392,
  eyeOffsetX: 172,
  eyeRadiusX: 68,
  eyeRadiusY: 104,

  cheekY: 546,
  cheekOffsetX: 306,

  mouthY: 566,
});

/** Les deux côtés du visage : −1 = gauche de l'image, +1 = droite. */
export const SIDES = Object.freeze([-1, 1]);

export function fillEllipse(ctx, x, y, radiusX, radiusY, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
  ctx.fill();
}

export function strokeLine(ctx, x0, y0, x1, y1) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

/** Prépare un trait « feutre » arrondi. */
export function setStroke(ctx, color, lineWidth) {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}
