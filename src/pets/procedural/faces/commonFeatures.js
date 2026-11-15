import { hexToRgba } from '../../../graphics/canvas.js';
import { FACE, SIDES, fillEllipse, setStroke } from './faceLayout.js';

/**
 * Les yeux « kawaii » de PS99 : deux grands ovales noirs, chacun avec deux reflets blancs
 * (un gros en haut à gauche, un petit en bas à droite).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{
 *   ink: string,
 *   closed?: boolean,        paupières fermées (clignement)
 *   highlightLift?: number,  hauteur du gros reflet (fraction du rayon vertical de l'œil)
 * }} options
 */
export function paintEyes(ctx, { ink, closed = false, highlightLift = 0.4 }) {
  const { centerX, eyeY, eyeOffsetX, eyeRadiusX: rx, eyeRadiusY: ry } = FACE;

  for (const side of SIDES) {
    const x = centerX + side * eyeOffsetX;

    if (closed) {
      // Œil fermé : un simple arc « ‿ ».
      setStroke(ctx, ink, 20);
      ctx.beginPath();
      ctx.arc(x, eyeY - rx * 0.35, rx * 1.02, Math.PI * 0.12, Math.PI * 0.88);
      ctx.stroke();
      continue;
    }

    ctx.fillStyle = ink;
    fillEllipse(ctx, x, eyeY, rx, ry);

    ctx.fillStyle = '#ffffff';
    fillEllipse(ctx, x - rx * 0.27, eyeY - ry * highlightLift, rx * 0.44, rx * 0.44);
    fillEllipse(ctx, x + rx * 0.33, eyeY + ry * 0.4, rx * 0.2, rx * 0.2);
  }
}

/** Joues rose pastel, légèrement fondues sur les bords. */
export function paintCheeks(ctx, color) {
  const { centerX, cheekY, cheekOffsetX } = FACE;
  const radiusX = 62;
  const radiusY = 38;

  for (const side of SIDES) {
    ctx.save();
    ctx.translate(centerX + side * cheekOffsetX, cheekY);
    ctx.scale(1, radiusY / radiusX);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusX);
    gradient.addColorStop(0, hexToRgba(color, 0.85));
    gradient.addColorStop(0.65, hexToRgba(color, 0.8));
    gradient.addColorStop(1, hexToRgba(color, 0));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
