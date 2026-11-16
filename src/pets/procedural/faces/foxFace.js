import { FACE, SIDES, fillEllipse, setStroke, strokeLine } from './faceLayout.js';

/**
 * Visage du renard : museau blanc à l'extrémité, nez noir, moustaches et petit « sourire ».
 * @type {import('../species/index.js').FacePainter}
 */
export const foxFace = {
  /** Extrémité blanche du museau (sous les yeux). */
  paintBackground(ctx, palette) {
    ctx.fillStyle = palette.secondary;
    ctx.beginPath();
    ctx.moveTo(FACE.centerX - 190, FACE.mouthY - 60);
    ctx.quadraticCurveTo(FACE.centerX, FACE.mouthY + 130, FACE.centerX + 190, FACE.mouthY - 60);
    ctx.quadraticCurveTo(FACE.centerX + 120, FACE.mouthY - 30, FACE.centerX, FACE.mouthY - 30);
    ctx.quadraticCurveTo(FACE.centerX - 120, FACE.mouthY - 30, FACE.centerX - 190, FACE.mouthY - 60);
    ctx.closePath();
    ctx.fill();
  },

  paintFeatures(ctx, palette) {
    const cx = FACE.centerX;
    const y = FACE.mouthY;

    // Moustaches
    setStroke(ctx, palette.ink, 9);
    for (const side of SIDES) {
      const x = cx + side * 226;
      strokeLine(ctx, x, y - 32, x + side * 120, y - 62);
      strokeLine(ctx, x + side * 8, y - 6, x + side * 138, y - 6);
    }

    // Nez noir
    ctx.fillStyle = palette.ink;
    ctx.beginPath();
    ctx.ellipse(cx, y - 50, 30, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    fillEllipse(ctx, cx - 10, y - 58, 8, 4, -0.4);

    // Petit sourire
    setStroke(ctx, palette.ink, 12);
    ctx.beginPath();
    ctx.arc(cx - 22, y - 14, 24, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 22, y - 14, 24, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  },
};
