import * as THREE from 'three';
import { PALETTE } from '../../config/palette.js';
import { createCanvas, canvasToTexture } from '../../graphics/canvas.js';
import { createToyMaterial, glowMaterial, toyMaterial } from '../../graphics/materials.js';
import { eggGeometry, softCylinderGeometry } from '../../graphics/geometries.js';
import { createRng } from '../../utils/random.js';

const EGG_RADIUS = 1.35;
const EGG_HEIGHT = 3.5;
const EGG_REST_Y = 3.85;
const SPARKLE_COUNT = 7;

/** Coquille crème à gros pois pastel (la texture s'enroule autour de l'œuf). */
function createEggTexture() {
  const width = 1024;
  const height = 512;
  const { canvas, ctx } = createCanvas(width, height);
  const rng = createRng(4242);

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#fffdf2');
  gradient.addColorStop(1, '#ffe9c7');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const spotColors = ['#ff8fc1', '#6fcbff', '#ffd24d', '#8ce99a', '#b79bff'];
  const spots = [];
  let attempts = 0;
  while (spots.length < 26 && attempts++ < 600) {
    const spot = {
      x: rng.range(0, width),
      y: rng.range(height * 0.14, height * 0.86),
      r: rng.range(26, 58),
      color: rng.pick(spotColors),
    };
    const overlaps = spots.some((other) => {
      const dx = Math.min(Math.abs(spot.x - other.x), width - Math.abs(spot.x - other.x));
      return Math.hypot(dx, spot.y - other.y) < spot.r + other.r + 16;
    });
    if (!overlaps) spots.push(spot);
  }

  for (const spot of spots) {
    // Dessiné aussi à ±width pour que le motif se raccorde sur la couture verticale.
    for (const dx of [-width, 0, width]) {
      ctx.fillStyle = spot.color;
      ctx.beginPath();
      ctx.ellipse(spot.x + dx, spot.y, spot.r * 1.25, spot.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(spot.x + dx - spot.r * 0.35, spot.y - spot.r * 0.35, spot.r * 0.38, spot.r * 0.26, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = canvasToTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

/** Étoile à quatre branches utilisée pour les étincelles. */
function createSparkleTexture() {
  const size = 128;
  const { canvas, ctx } = createCanvas(size, size);
  const c = size / 2;

  const glow = ctx.createRadialGradient(c, c, 0, c, c, c);
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  glow.addColorStop(0.3, 'rgba(255, 244, 190, 0.35)');
  glow.addColorStop(1, 'rgba(255, 244, 190, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const radius = i % 2 === 0 ? c * 0.95 : c * 0.16;
    ctx.lineTo(c + Math.cos(angle) * radius, c + Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function createGlowTexture() {
  const size = 128;
  const { canvas, ctx } = createCanvas(size, size);
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(0.45, 'rgba(255, 240, 170, 0.4)');
  gradient.addColorStop(1, 'rgba(255, 240, 170, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/** Socle à trois marches rondes. */
function createPedestal(radius) {
  const pedestal = new THREE.Group();
  const tiers = [
    { radius, height: 0.5, y: 0, material: toyMaterial(PALETTE.stone.base, { roughness: 0.78 }) },
    { radius: radius * 0.78, height: 0.48, y: 0.5, material: toyMaterial(PALETTE.stone.light, { roughness: 0.75 }) },
    {
      radius: radius * 0.56,
      height: 0.42,
      y: 0.98,
      material: toyMaterial(PALETTE.gold, { roughness: 0.38, emissive: '#7a4a00', emissiveIntensity: 0.3 }),
    },
    { radius: radius * 0.4, height: 0.34, y: 1.4, material: toyMaterial('#8a63ff', { roughness: 0.5 }) },
  ];

  for (const tier of tiers) {
    const mesh = new THREE.Mesh(softCylinderGeometry(tier.radius, tier.height, 0.13, 44), tier.material);
    mesh.position.y = tier.y;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    pedestal.add(mesh);
  }
  return pedestal;
}

/**
 * Piédestal décoratif : un œuf géant à pois qui flotte, tourne et scintille au-dessus de son socle.
 * @param {{ radius?: number }} [options]
 */
export function createEggPedestal({ radius = 3.5 } = {}) {
  const group = new THREE.Group();
  group.name = 'EggPedestal';
  group.add(createPedestal(radius));

  const egg = new THREE.Mesh(
    eggGeometry(EGG_RADIUS, EGG_HEIGHT),
    createToyMaterial({ map: createEggTexture(), roughness: 0.34 }),
  );
  egg.name = 'GiantEgg';
  egg.position.y = EGG_REST_Y;
  egg.castShadow = false;
  group.add(egg);

  // Halo doux posé sur le coussin, sous l'œuf.
  const glowGeometry = new THREE.PlaneGeometry(1, 1);
  glowGeometry.rotateX(-Math.PI / 2);
  const glow = new THREE.Mesh(glowGeometry, glowMaterial('#fff1b0', { map: createGlowTexture(), opacity: 0.8 }));
  glow.position.y = 1.78;
  glow.scale.set(3.4, 1, 3.4);
  group.add(glow);

  // Étincelles en orbite.
  const sparkleTexture = createSparkleTexture();
  const rng = createRng(31);
  const sparkles = Array.from({ length: SPARKLE_COUNT }, (_, index) => {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: sparkleTexture,
        color: index % 2 === 0 ? '#fff6c4' : '#ffffff',
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
    );
    sprite.userData = {
      angle: (index / SPARKLE_COUNT) * Math.PI * 2,
      radius: rng.range(1.75, 2.4),
      height: rng.range(-1.3, 1.5),
      speed: rng.range(0.45, 0.85),
      size: rng.range(0.42, 0.72),
      twinkle: rng.range(0, Math.PI * 2),
    };
    group.add(sprite);
    return sprite;
  });

  const update = (_dt, time) => {
    const bob = Math.sin(time * 1.4) * 0.16;
    egg.position.y = EGG_REST_Y + bob;
    egg.rotation.y = time * 0.5;
    egg.rotation.z = Math.sin(time * 0.9) * 0.05;

    const pulse = 0.85 + Math.sin(time * 2.2) * 0.15;
    glow.scale.set(3.4 * pulse, 1, 3.4 * pulse);
    glow.material.opacity = 0.6 + Math.sin(time * 2.2) * 0.2;

    for (const sprite of sparkles) {
      const data = sprite.userData;
      const angle = data.angle + time * data.speed;
      sprite.position.set(
        Math.cos(angle) * data.radius,
        EGG_REST_Y + data.height + Math.sin(time * 1.1 + data.twinkle) * 0.25,
        Math.sin(angle) * data.radius,
      );
      const twinkle = 0.55 + 0.45 * Math.sin(time * 4.2 + data.twinkle);
      sprite.scale.setScalar(data.size * twinkle);
      sprite.material.rotation = time * 0.8 + data.twinkle;
    }
  };

  update(0, 0);

  return {
    object3D: group,
    update,
    colliders: [{ type: 'circle', x: 0, z: 0, radius: radius + 0.1 }],
  };
}
