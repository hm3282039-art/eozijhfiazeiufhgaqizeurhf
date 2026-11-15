import * as THREE from 'three';
import { PALETTE } from '../../config/palette.js';
import { WORLD } from '../../config/worldConfig.js';
import { createCanvas, canvasToTexture } from '../../graphics/canvas.js';
import { createToyMaterial } from '../../graphics/materials.js';
import { createRng } from '../../utils/random.js';

const OCEAN_SIZE = 1800;
const TILE_SIZE = 46;

/** Texture répétable : fond turquoise + petites vaguelettes claires. */
function createWaveTexture() {
  const size = 512;
  const { canvas, ctx } = createCanvas(size, size);
  const rng = createRng(77);

  ctx.fillStyle = PALETTE.water.ocean;
  ctx.fillRect(0, 0, size, size);

  ctx.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const x = rng.range(0, size);
    const y = rng.range(0, size);
    const length = rng.range(26, 70);
    const bend = rng.range(5, 12);
    ctx.strokeStyle = `rgba(255, 255, 255, ${rng.range(0.16, 0.42).toFixed(2)})`;
    ctx.lineWidth = rng.range(3, 6);

    // Dessinée 9 fois (3×3) pour que la tuile se répète sans couture visible.
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) {
        ctx.beginPath();
        ctx.moveTo(x + dx - length / 2, y + dy);
        ctx.quadraticCurveTo(x + dx, y + dy - bend, x + dx + length / 2, y + dy);
        ctx.stroke();
      }
    }
  }

  const repeat = OCEAN_SIZE / TILE_SIZE;
  return canvasToTexture(canvas, { repeat: [repeat, repeat], anisotropy: 4 });
}

/** Mer turquoise autour de l'île, avec des vaguelettes qui dérivent lentement. */
export function createOcean() {
  const texture = createWaveTexture();
  const geometry = new THREE.PlaneGeometry(OCEAN_SIZE, OCEAN_SIZE);
  geometry.rotateX(-Math.PI / 2);

  const mesh = new THREE.Mesh(geometry, createToyMaterial({ map: texture, roughness: 0.3 }));
  mesh.name = 'Ocean';
  mesh.position.y = WORLD.waterLevel;
  mesh.receiveShadow = false;

  return {
    object3D: mesh,
    update(_dt, time) {
      texture.offset.set(time * 0.006, time * 0.0035);
    },
  };
}
