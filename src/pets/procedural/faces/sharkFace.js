import { FACE, SIDES, setStroke, strokeLine } from './faceLayout.js';

/**
 * Visage du requin : grande bouche garnie de dents, narines, regard fier.
 * @type {import('../species/index.js').FacePainter}
 */
export const sharkFace = {
  /** Les reflets sont abaissés pour rester visibles sous un « sourcil » fier. */
  eyes: { highlightLift: 0.12 },

  paintFeatures(ctx, palette) {
    const cx = FACE.centerX;
    const y = FACE.mouthY + 6;
    const mouthHalf = 150;
    const mouthDip = 52;

    // Narines
    ctx.fillStyle = palette.ink;
    for (const side of SIDES) {
      ctx.beginPath();
      ctx.ellipse(cx + side * 44, y - 44, 9, 5, side * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dents : rangée de triangles blancs le long de la bouche
    ctx.fillStyle = '#ffffff';
    setStroke(ctx, palette.ink, 6);
    const teeth = 7;
    for (let i = 0; i < teeth; i++) {
      const t = i / (teeth - 1);
      const x = cx - mouthHalf + t * mouthHalf * 2;
      // Courbe de la bouche au point x.
      const tt = (x - (cx - mouthHalf)) / (mouthHalf * 2);
      const top = y + 2 * tt * (1 - tt) * mouthDip - 6;
      const size = 12 + Math.sin(t * Math.PI) * 6;
      ctx.beginPath();
      ctx.moveTo(x - size, top);
      ctx.lineTo(x + size, top);
      ctx.lineTo(x, top + size * 2.4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Bouche
    setStroke(ctx, palette.ink, 15);
    ctx.beginPath();
    ctx.moveTo(cx - mouthHalf, y);
    ctx.quadraticCurveTo(cx, y + mouthDip, cx + mouthHalf, y);
    ctx.stroke();
  },
};
