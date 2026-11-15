import { FACE, fillEllipse, setStroke, strokeLine } from './faceLayout.js';

const TONGUE = '#ff7da2';
const TONGUE_SHADE = '#e85f8b';

/** Rayon de chacune des deux « babines » du sourire. */
const LIP_RADIUS = 42;

/**
 * Visage du chien : museau clair, grosse truffe, sourire et petite langue rose qui dépasse.
 * @type {import('../species/index.js').FacePainter}
 */
export const dogFace = {
  /** Dessiné AVANT les yeux : le museau passe sous le bas des yeux. */
  paintBackground(ctx, palette) {
    ctx.fillStyle = palette.secondary;
    fillEllipse(ctx, FACE.centerX, FACE.mouthY + 26, 182, 136);
  },

  paintFeatures(ctx, palette) {
    const cx = FACE.centerX;
    const lipY = FACE.mouthY - 12;
    const R = LIP_RADIUS;

    // ── Langue : visible uniquement SOUS la ligne des babines ────────────────
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - 2 * R, lipY);
    ctx.arc(cx - R, lipY, R, Math.PI, 0, true); // demi-cercle du bas (babine gauche)
    ctx.arc(cx + R, lipY, R, Math.PI, 0, true); // demi-cercle du bas (babine droite)
    ctx.lineTo(cx + 2 * R, lipY + 220);
    ctx.lineTo(cx - 2 * R, lipY + 220);
    ctx.closePath();
    ctx.clip();

    const half = 36;
    const bottom = lipY + R + 62;
    ctx.beginPath();
    ctx.moveTo(cx - half, lipY);
    ctx.lineTo(cx - half, bottom - half);
    ctx.arc(cx, bottom - half, half, Math.PI, 0, true);
    ctx.lineTo(cx + half, lipY);
    ctx.closePath();
    ctx.fillStyle = TONGUE;
    ctx.fill();
    setStroke(ctx, TONGUE_SHADE, 7);
    ctx.stroke();
    strokeLine(ctx, cx, lipY + R + 2, cx, bottom - 26);
    ctx.restore();

    // ── Sourire : deux babines qui se rejoignent sous la truffe ──────────────
    setStroke(ctx, palette.ink, 13);
    ctx.beginPath();
    ctx.arc(cx - R, lipY, R, 0, Math.PI * 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + R, lipY, R, Math.PI * 0.1, Math.PI);
    ctx.stroke();
    strokeLine(ctx, cx, lipY - 22, cx, lipY);

    // ── Truffe brillante ─────────────────────────────────────────────────────
    ctx.fillStyle = palette.ink;
    fillEllipse(ctx, cx, lipY - 42, 50, 34);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    fillEllipse(ctx, cx - 17, lipY - 53, 16, 8, -0.3);
  },
};
