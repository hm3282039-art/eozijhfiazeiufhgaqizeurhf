import { FACE, SIDES, setStroke, strokeLine } from './faceLayout.js';

/**
 * Visage de l'axolotl : tête lisse, petit sourire tranquille, nez discret.
 * @type {import('../species/index.js').FacePainter}
 */
export const axolotlFace = {
  paintFeatures(ctx, palette) {
    const cx = FACE.centerX;
    const y = FACE.mouthY;

    // Nez discret rose
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.ellipse(cx, y - 56, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Petit sourire
    setStroke(ctx, palette.ink, 12);
    ctx.beginPath();
    ctx.arc(cx - 26, y - 12, 26, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 26, y - 12, 26, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
    strokeLine(ctx, cx, y - 44, cx, y - 12);
  },
};
