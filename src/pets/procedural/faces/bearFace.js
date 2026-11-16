import { FACE, fillEllipse, setStroke, strokeLine } from './faceLayout.js';

/**
 * Visage de l'ours : gros museau rond clair, nez noir et bouche en « U ».
 * @type {import('../species/index.js').FacePainter}
 */
export const bearFace = {
  /** Museau rond, dépassant sous les yeux. */
  paintBackground(ctx, palette) {
    ctx.fillStyle = palette.secondary;
    fillEllipse(ctx, FACE.centerX, FACE.mouthY + 34, 200, 150);
  },

  paintFeatures(ctx, palette) {
    const cx = FACE.centerX;
    const y = FACE.mouthY + 18;

    // Nez noir
    ctx.fillStyle = palette.ink;
    ctx.beginPath();
    ctx.ellipse(cx, y - 46, 42, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    fillEllipse(ctx, cx - 14, y - 56, 12, 6, -0.4);

    // Bouche en « U »
    setStroke(ctx, palette.ink, 13);
    ctx.beginPath();
    ctx.arc(cx, y + 6, 46, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
    strokeLine(ctx, cx, y - 40, cx, y + 6);
  },
};
