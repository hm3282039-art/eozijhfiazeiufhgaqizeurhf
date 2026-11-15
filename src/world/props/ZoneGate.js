import * as THREE from 'three';
import { PALETTE } from '../../config/palette.js';
import { createCanvas, canvasToTexture, drawOutlinedText, fontStyle, roundRectPath } from '../../graphics/canvas.js';
import { createToyMaterial, toyMaterial } from '../../graphics/materials.js';
import { roundedBoxGeometry, sphereGeometry } from '../../graphics/geometries.js';
import { createLaserWall } from './LaserWall.js';

const SIGN_WIDTH = 8.4;
const SIGN_HEIGHT = 3.1;

/** Pièce d'or dessinée sur le panneau. */
function drawCoin(ctx, x, y, radius) {
  ctx.fillStyle = '#b8780a';
  ctx.beginPath();
  ctx.arc(x, y + radius * 0.1, radius, 0, Math.PI * 2);
  ctx.fill();

  const gradient = ctx.createLinearGradient(x, y - radius, x, y + radius);
  gradient.addColorStop(0, '#ffe96b');
  gradient.addColorStop(1, '#ffb81f');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#e39a12';
  ctx.lineWidth = radius * 0.16;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.68, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.beginPath();
  ctx.ellipse(x - radius * 0.32, y - radius * 0.42, radius * 0.26, radius * 0.14, -0.6, 0, Math.PI * 2);
  ctx.fill();
}

/** Panneau « ZONE 2 — 1,000 Coins ». */
function createSignTexture(label, price) {
  const width = 1024;
  const height = Math.round((width * SIGN_HEIGHT) / SIGN_WIDTH);
  const { canvas, ctx } = createCanvas(width, height);

  // Fond bleu nuit + cadre doré.
  ctx.fillStyle = PALETTE.gate.pillarCap;
  roundRectPath(ctx, 0, 0, width, height, 54);
  ctx.fill();
  const background = ctx.createLinearGradient(0, 0, 0, height);
  background.addColorStop(0, '#3b4380');
  background.addColorStop(1, PALETTE.gate.sign);
  ctx.fillStyle = background;
  roundRectPath(ctx, 18, 18, width - 36, height - 36, 40);
  ctx.fill();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Titre
  ctx.font = fontStyle(700, 172);
  drawOutlinedText(ctx, label, width / 2, height * 0.34, { fill: '#ffffff', stroke: '#141834', lineWidth: 22 });

  // Prix : pièce + texte, centrés ensemble.
  const priceText = `${price.toLocaleString('en-US')} Coins`;
  ctx.font = fontStyle(700, 104);
  const coinRadius = 52;
  const gap = 26;
  const textWidth = ctx.measureText(priceText).width;
  const totalWidth = coinRadius * 2 + gap + textWidth;
  const startX = (width - totalWidth) / 2;
  const rowY = height * 0.74;

  drawCoin(ctx, startX + coinRadius, rowY, coinRadius);
  ctx.textAlign = 'left';
  drawOutlinedText(ctx, priceText, startX + coinRadius * 2 + gap, rowY + 4, {
    fill: '#ffd94d',
    stroke: '#141834',
    lineWidth: 18,
  });

  return canvasToTexture(canvas);
}

function createPillar(size, height) {
  const pillar = new THREE.Group();
  const stone = toyMaterial(PALETTE.gate.pillar, { roughness: 0.75 });
  const dark = toyMaterial(PALETTE.stone.dark, { roughness: 0.8 });
  const gold = toyMaterial(PALETTE.gate.pillarCap, { roughness: 0.38, emissive: '#7a4a00', emissiveIntensity: 0.3 });

  const shaft = new THREE.Mesh(roundedBoxGeometry(size, height, size, 0.42, 4), stone);
  shaft.position.y = height / 2;

  const plinth = new THREE.Mesh(roundedBoxGeometry(size + 0.6, 1.1, size + 0.6, 0.32, 4), dark);
  plinth.position.y = 0.45;

  const band = new THREE.Mesh(roundedBoxGeometry(size + 0.28, 0.5, size + 0.28, 0.2, 3), gold);
  band.position.y = height * 0.62;

  const cap = new THREE.Mesh(roundedBoxGeometry(size + 0.7, 0.85, size + 0.7, 0.3, 4), gold);
  cap.position.y = height + 0.25;

  const orb = new THREE.Mesh(
    sphereGeometry(1, 20, 14),
    toyMaterial(PALETTE.gate.laser, { roughness: 0.25, emissive: PALETTE.gate.laser, emissiveIntensity: 0.9 }),
  );
  orb.scale.setScalar(0.62);
  orb.position.y = height + 1.15;

  for (const mesh of [shaft, plinth, band, cap, orb]) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    pillar.add(mesh);
  }
  return { pillar, orb };
}

/**
 * Porte de la Zone 2 : deux piliers, un linteau, un panneau de prix et un mur laser.
 * Construite dans le plan XY (on la franchirait en marchant le long de Z).
 *
 * @param {{ halfOpening: number, pillarSize: number, height: number, price: number, label: string }} config
 */
export function createZoneGate({ halfOpening, pillarSize, height, price, label }) {
  const group = new THREE.Group();
  group.name = 'ZoneGate';

  const pillarX = halfOpening + pillarSize / 2;
  const orbs = [];
  for (const side of [-1, 1]) {
    const { pillar, orb } = createPillar(pillarSize, height);
    pillar.position.x = side * pillarX;
    group.add(pillar);
    orbs.push(orb);
  }

  // Linteau
  const lintelHeight = 1.5;
  const lintelY = height - lintelHeight / 2 - 0.5;
  const lintel = new THREE.Mesh(
    roundedBoxGeometry(halfOpening * 2 + 0.6, lintelHeight, pillarSize * 0.8, 0.36, 4),
    toyMaterial(PALETTE.gate.pillar, { roughness: 0.75 }),
  );
  lintel.position.y = lintelY;
  lintel.castShadow = true;
  lintel.receiveShadow = true;
  group.add(lintel);

  // Panneau (tourné vers le spawn, côté +Z)
  const signY = lintelY + 0.55;
  const signZ = pillarSize * 0.4 + 0.32;
  const board = new THREE.Mesh(
    roundedBoxGeometry(SIGN_WIDTH + 0.3, SIGN_HEIGHT + 0.3, 0.5, 0.2, 3),
    toyMaterial(PALETTE.gate.pillarCap, { roughness: 0.4 }),
  );
  board.position.set(0, signY, signZ);
  board.castShadow = true;
  group.add(board);

  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(SIGN_WIDTH, SIGN_HEIGHT),
    createToyMaterial({ map: createSignTexture(label, price), roughness: 0.55 }),
  );
  face.position.set(0, signY, signZ + 0.262);
  group.add(face);

  // Mur laser
  const laserHeight = lintelY - lintelHeight / 2 + 0.1;
  const laser = createLaserWall({ width: halfOpening * 2, height: laserHeight });
  group.add(laser.object3D);

  const update = (dt, time) => {
    laser.update(dt, time);
    const pulse = 0.62 + Math.sin(time * 3) * 0.05;
    for (const orb of orbs) orb.scale.setScalar(pulse);
  };

  const pillarHalf = pillarSize / 2 + 0.3;
  const colliders = [
    { type: 'box', minX: -pillarX - pillarHalf, maxX: -pillarX + pillarHalf, minZ: -pillarHalf, maxZ: pillarHalf },
    { type: 'box', minX: pillarX - pillarHalf, maxX: pillarX + pillarHalf, minZ: -pillarHalf, maxZ: pillarHalf },
    { type: 'box', minX: -halfOpening, maxX: halfOpening, minZ: -0.3, maxZ: 0.3, tag: 'gate-laser' },
  ];

  return { object3D: group, update, colliders };
}
