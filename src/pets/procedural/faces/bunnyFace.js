import { FACE, SIDES, setStroke, strokeLine } from './faceLayout.js';

/**
 * Visage du lapin : gros nez rose, petite bouche, deux dents blanches devant
 * et des moustaches.
 * @type {import('../species/index.js').FacePainter}
 */
export const bunnyFace = {
  paintFeatures(ctx, palette) {
    const cx = FACE.centerX;
    const y = FACE.mouthY;

    // Moustaches
    setStroke(ctx, palette.ink, 9);
    for (const side of SIDES) {
      const x = cx + side * 232;
      strokeLine(ctx, x, y - 30, x + side * 120, y - 60);
      strokeLine(ctx, x + side * 8, y - 6, x + side * 140, y - 4);
      strokeLine(ctx, x, y + 22, x + side * 120, y + 52);
    }

    // Nez rose
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.ellipse(cx, y - 52, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Deux petites dents blanches devant
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = palette.ink;
    ctx.lineWidth = 5;
    for (const side of SIDES) {
      ctx.beginPath();
      ctx.moveTo(cx + side * 16 - 8, y - 18);
      ctx.lineTo(cx + side * 16 + 8, y - 18);
      ctx.lineTo(cx + side * 16, y - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Bouche en « Y » sous le nez
    setStroke(ctx, palette.ink, 12);
    strokeLine(ctx, cx, y - 36, cx, y - 16);
    ctx.beginPath();
    ctx.arc(cx - 20, y - 16, 20, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + 20, y - 16, 20, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  },
};
