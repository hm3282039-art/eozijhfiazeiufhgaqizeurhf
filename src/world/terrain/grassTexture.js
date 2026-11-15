import { PALETTE } from '../../config/palette.js';
import { createCanvas, canvasToTexture, roundRectPath } from '../../graphics/canvas.js';
import { createRng } from '../../utils/random.js';

/** Taille (unités monde) couverte par une tuile de texture. */
export const GRASS_TILE_SIZE = 9;

/**
 * Pelouse « jouet » : damier très discret de dalles arrondies + petits brins clairs/foncés.
 * @param {number} width largeur de la pelouse (unités monde)
 * @param {number} length longueur de la pelouse (unités monde)
 */
export function createGrassTexture(width, length) {
  const size = 512;
  const half = size / 2;
  const { canvas, ctx } = createCanvas(size, size);
  const rng = createRng(11);

  ctx.fillStyle = PALETTE.grass.base;
  ctx.fillRect(0, 0, size, size);

  // Damier 2×2 de dalles légèrement plus claires.
  ctx.fillStyle = PALETTE.grass.light;
  const inset = 7;
  for (const [cx, cy] of [[0, 0], [half, half]]) {
    roundRectPath(ctx, cx + inset, cy + inset, half - inset * 2, half - inset * 2, 34);
    ctx.fill();
  }

  // Brins d'herbe : petites touches arrondies.
  ctx.lineCap = 'round';
  for (let i = 0; i < 150; i++) {
    const x = rng.range(8, size - 8);
    const y = rng.range(8, size - 8);
    const light = rng.chance(0.5);
    ctx.strokeStyle = light ? 'rgba(170, 255, 120, 0.5)' : 'rgba(40, 150, 30, 0.3)';
    ctx.lineWidth = rng.range(2.5, 4.5);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + rng.range(-2, 2), y - rng.range(4, 9));
    ctx.stroke();
  }

  return canvasToTexture(canvas, {
    repeat: [width / GRASS_TILE_SIZE, length / GRASS_TILE_SIZE],
    anisotropy: 8,
  });
}
