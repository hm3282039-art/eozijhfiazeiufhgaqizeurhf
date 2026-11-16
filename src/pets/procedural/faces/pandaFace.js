import { FACE, SIDES, fillEllipse, setStroke, strokeLine } from './faceLayout.js';

/**
 * Visage du panda : museau clair + taches noires autour des yeux.
 * @type {import('../species/index.js').FacePainter}
 */
export const pandaFace = {
  /** Taches noires autour des yeux (dessinées sous les yeux). */
  paintBackground(ctx, palette) {
    const { centerX, eyeY, eyeOffsetX } = FACE;
    ctx.fillStyle = palette.accent;
    for (const side of SIDES) {
      ctx.save();
      ctx.translate(centerX + side * eyeOffsetX, eyeY);
      ctx.rotate(side * 0.32);
      fillEllipse(ctx, 0, 0, 96, 62);
      ctx.restore();
    }

    // Museau clair
    ctx.fillStyle = palette.secondary;
    fillEllipse(ctx, FACE.centerX, FACE.mouthY + 34, 196, 144);
  },

  paintFeatures(ctx, palette) {
    const cx = FACE.centerX;
    const y = FACE.mouthY + 18;

    // Nez noir
    ctx.fillStyle = palette.ink;
    ctx.beginPath();
    ctx.ellipse(cx, y - 46, 38, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bouche en « U »
    setStroke(ctx, palette.ink, 13);
    ctx.beginPath();
    ctx.arc(cx, y + 6, 44, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
    strokeLine(ctx, cx, y - 40, cx, y + 6);
  },
};
