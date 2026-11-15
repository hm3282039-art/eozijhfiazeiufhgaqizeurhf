import { FACE, SIDES, setStroke, strokeLine } from './faceLayout.js';

/**
 * Visage du chat : petite truffe rose, bouche en « W » et trois moustaches de chaque côté.
 * @type {import('../species/index.js').FacePainter}
 */
export const catFace = {
  paintFeatures(ctx, palette) {
    const cx = FACE.centerX;
    const y = FACE.mouthY;

    // Moustaches
    setStroke(ctx, palette.ink, 9);
    for (const side of SIDES) {
      const x = cx + side * 236;
      strokeLine(ctx, x, y - 36, x + side * 126, y - 74);
      strokeLine(ctx, x + side * 8, y - 6, x + side * 144, y - 8);
      strokeLine(ctx, x, y + 24, x + side * 126, y + 58);
    }

    // Truffe : triangle arrondi, pointe en bas
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.moveTo(cx - 28, y - 56);
    ctx.quadraticCurveTo(cx, y - 66, cx + 28, y - 56);
    ctx.quadraticCurveTo(cx + 20, y - 28, cx, y - 20);
    ctx.quadraticCurveTo(cx - 20, y - 28, cx - 28, y - 56);
    ctx.fill();

    // Bouche en « W » : deux demi-cercles qui se rejoignent sous la truffe
    const radius = 37;
    setStroke(ctx, palette.ink, 13);
    ctx.beginPath();
    ctx.arc(cx - radius, y - 16, radius, 0, Math.PI * 0.94);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + radius, y - 16, radius, Math.PI * 0.06, Math.PI);
    ctx.stroke();
  },
};
