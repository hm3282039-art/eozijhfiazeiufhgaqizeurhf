import { createCanvas, canvasToTexture } from '../graphics/canvas.js';

/**
 * Visage souriant de l'avatar (style « smiley » Roblox), dessiné sur canvas.
 * Appliqué uniquement sur la face avant de la tête.
 */
export function createPlayerFaceTexture(skinColor) {
  const width = 512;
  const height = 470;
  const { canvas, ctx } = createCanvas(width, height);
  const cx = width / 2;

  ctx.fillStyle = skinColor;
  ctx.fillRect(0, 0, width, height);

  // Joues
  ctx.fillStyle = 'rgba(255, 120, 130, 0.38)';
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + side * 150, 292, 40, 26, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Yeux
  for (const side of [-1, 1]) {
    const ex = cx + side * 88;
    const ey = 212;
    ctx.fillStyle = '#1f2238';
    ctx.beginPath();
    ctx.ellipse(ex, ey, 27, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ex - 8, ey - 15, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ex + 9, ey + 13, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Sourire
  ctx.strokeStyle = '#1f2238';
  ctx.lineWidth = 13;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, 268, 62, Math.PI * 0.2, Math.PI * 0.8);
  ctx.stroke();

  return canvasToTexture(canvas);
}

/** Devant du t-shirt : une empreinte de patte colorée. */
export function createShirtTexture(shirtColor, emblemColor) {
  const width = 512;
  const height = 512;
  const { canvas, ctx } = createCanvas(width, height);
  const cx = width / 2;
  const cy = height * 0.5;

  ctx.fillStyle = shirtColor;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = emblemColor;

  // Coussinet principal
  ctx.beginPath();
  ctx.ellipse(cx, cy + 40, 68, 56, 0, 0, Math.PI * 2);
  ctx.fill();

  // Quatre doigts
  const toes = [
    [-84, -18, -0.5],
    [-32, -62, -0.15],
    [32, -62, 0.15],
    [84, -18, 0.5],
  ];
  for (const [dx, dy, rotation] of toes) {
    ctx.beginPath();
    ctx.ellipse(cx + dx, cy + dy, 25, 33, rotation, 0, Math.PI * 2);
    ctx.fill();
  }

  return canvasToTexture(canvas);
}
