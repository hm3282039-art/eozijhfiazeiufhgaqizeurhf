import { FACE, SIDES, fillEllipse, setStroke, strokeLine } from './faceLayout.js';

/**
 * Visage du griffon : bec fier, sourcils inclinés, regard perçant.
 * @type {import('../species/index.js').FacePainter}
 */
export const griffinFace = {
  eyes: { highlightLift: 0.1 },

  paintFeatures(ctx, palette) {
    const cx = FACE.centerX;
    const y = FACE.mouthY;
    const { eyeY, eyeOffsetX, eyeRadiusY } = FACE;

    // Sourcils « \ / »
    setStroke(ctx, palette.ink, 20);
    for (const side of SIDES) {
      const eyeX = cx + side * eyeOffsetX;
      strokeLine(ctx, eyeX + side * 100, eyeY - eyeRadiusY - 8, eyeX - side * 96, eyeY - eyeRadiusY * 0.2);
    }

    // Bec : base large jaune, pointe vers le bas
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.moveTo(cx - 70, y - 40);
    ctx.quadraticCurveTo(cx, y - 70, cx + 70, y - 40);
    ctx.quadraticCurveTo(cx + 40, y + 10, cx, y + 40);
    ctx.quadraticCurveTo(cx - 40, y + 10, cx - 70, y - 40);
    ctx.closePath();
    ctx.fill();
    setStroke(ctx, '#8a5a10', 7);
    ctx.stroke();

    // Ligne de la mâchoire du bec
    strokeLine(ctx, cx - 64, y - 34, cx + 64, y - 34);
  },
};
