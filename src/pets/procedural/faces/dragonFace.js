import { FACE, SIDES, fillEllipse, setStroke, strokeLine } from './faceLayout.js';

/**
 * Visage du dragon : ventre coloré, regard déterminé (sourcils inclinés qui coupent le haut
 * des yeux), narines et deux petits crocs blancs.
 * @type {import('../species/index.js').FacePainter}
 */
export const dragonFace = {
  /** Les reflets sont abaissés pour rester visibles sous les sourcils. */
  eyes: { highlightLift: 0.08 },

  /** Ventre : grande forme arrondie qui remonte depuis le bas du visage, avec deux plis. */
  paintBackground(ctx, palette) {
    const cx = FACE.centerX;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, FACE.height + 60, 300, 330, 0, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = palette.secondary;
    ctx.fillRect(0, 0, FACE.width, FACE.height + 2);

    setStroke(ctx, 'rgba(110, 30, 0, 0.17)', 11);
    for (const offset of [170, 88]) {
      const y = FACE.height - offset;
      ctx.beginPath();
      ctx.moveTo(cx - 330, y);
      ctx.quadraticCurveTo(cx, y + 36, cx + 330, y);
      ctx.stroke();
    }
    ctx.restore();
  },

  paintFeatures(ctx, palette, { closed }) {
    const cx = FACE.centerX;
    const y = FACE.mouthY;
    const { eyeY, eyeOffsetX, eyeRadiusY } = FACE;

    // ── Sourcils déterminés « \ / » ──────────────────────────────────────────
    for (const side of SIDES) {
      const eyeX = cx + side * eyeOffsetX;
      const outer = { x: eyeX + side * 102, y: eyeY - eyeRadiusY - 6 };
      const inner = { x: eyeX - side * 98, y: eyeY - eyeRadiusY * 0.1 };

      if (!closed) {
        // « Paupière » de la couleur du corps : masque l'œil au-dessus du sourcil.
        const ceiling = eyeY - eyeRadiusY - 30;
        ctx.fillStyle = palette.body;
        ctx.beginPath();
        ctx.moveTo(outer.x, outer.y);
        ctx.lineTo(inner.x, inner.y);
        ctx.lineTo(inner.x, ceiling);
        ctx.lineTo(outer.x, ceiling);
        ctx.closePath();
        ctx.fill();
      }

      setStroke(ctx, palette.ink, 22);
      strokeLine(ctx, outer.x, outer.y, inner.x, inner.y);
    }

    // ── Narines ──────────────────────────────────────────────────────────────
    ctx.fillStyle = palette.ink;
    fillEllipse(ctx, cx - 25, y - 50, 10, 6.5, 0.45);
    fillEllipse(ctx, cx + 25, y - 50, 10, 6.5, -0.45);

    // ── Crocs (dessinés avant la bouche : le trait recouvre leur base) ───────
    const mouthY = y - 8;
    const mouthHalf = 108;
    const mouthDip = 46;
    for (const side of SIDES) {
      const fangX = cx + side * 60;
      // Hauteur de la bouche à l'aplomb du croc (courbe quadratique).
      const t = 0.5 + (side * 60) / (mouthHalf * 2);
      const top = mouthY + 2 * t * (1 - t) * mouthDip - 2;

      ctx.beginPath();
      ctx.moveTo(fangX - 22, top);
      ctx.lineTo(fangX + 22, top);
      ctx.quadraticCurveTo(fangX + 9, top + 34, fangX, top + 52);
      ctx.quadraticCurveTo(fangX - 9, top + 34, fangX - 22, top);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      setStroke(ctx, palette.ink, 6);
      ctx.stroke();
    }

    // ── Bouche : sourire sûr de lui ──────────────────────────────────────────
    setStroke(ctx, palette.ink, 14);
    ctx.beginPath();
    ctx.moveTo(cx - mouthHalf, mouthY);
    ctx.quadraticCurveTo(cx, mouthY + mouthDip, cx + mouthHalf, mouthY);
    ctx.stroke();
  },
};
