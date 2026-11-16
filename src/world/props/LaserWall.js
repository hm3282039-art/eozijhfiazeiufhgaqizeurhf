import * as THREE from 'three';
import { PALETTE } from '../../config/palette.js';
import { createCanvas } from '../../graphics/canvas.js';
import { glowMaterial } from '../../graphics/materials.js';
import { cylinderGeometry, sphereGeometry } from '../../graphics/geometries.js';

const BEAM_COUNT = 5;

/** Lignes horizontales lumineuses, répétées verticalement puis animées par défilement. */
function createScanlineTexture() {
  const width = 32;
  const height = 256;
  const { canvas, ctx } = createCanvas(width, height);
  ctx.clearRect(0, 0, width, height);

  const bands = [
    { y: 18, thickness: 26, alpha: 0.85 },
    { y: 92, thickness: 8, alpha: 0.4 },
    { y: 146, thickness: 16, alpha: 0.6 },
    { y: 214, thickness: 6, alpha: 0.35 },
  ];
  for (const band of bands) {
    const gradient = ctx.createLinearGradient(0, band.y, 0, band.y + band.thickness);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    gradient.addColorStop(0.5, `rgba(255, 255, 255, ${band.alpha})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, band.y, width, band.thickness);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Cadenas blanc dessiné sur canvas, affiché au centre du mur. */
function createPadlockTexture() {
  const size = 256;
  const { canvas, ctx } = createCanvas(size, size);
  const c = size / 2;

  const glow = ctx.createRadialGradient(c, c, 10, c, c, c);
  glow.addColorStop(0, 'rgba(255, 120, 160, 0.7)');
  glow.addColorStop(1, 'rgba(255, 120, 160, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  // Anse
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(c - 38, c - 4);
  ctx.lineTo(c - 38, c - 40);
  ctx.arc(c, c - 40, 38, Math.PI, 0);
  ctx.lineTo(c + 38, c - 4);
  ctx.stroke();

  // Corps
  ctx.fillStyle = '#ffffff';
  const bodyW = 132;
  const bodyH = 100;
  const x = c - bodyW / 2;
  const y = c - 8;
  const r = 22;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + bodyW, y, x + bodyW, y + bodyH, r);
  ctx.arcTo(x + bodyW, y + bodyH, x, y + bodyH, r);
  ctx.arcTo(x, y + bodyH, x, y, r);
  ctx.arcTo(x, y, x + bodyW, y, r);
  ctx.closePath();
  ctx.fill();

  // Serrure
  ctx.fillStyle = PALETTE.gate.laser;
  ctx.beginPath();
  ctx.arc(c, y + 40, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(c - 6, y + 44, 12, 30);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Mur laser semi-transparent qui bloque le passage vers la zone suivante.
 * Construit dans le plan XY, centré en X, posé sur le sol (y = 0 → height).
 *
 * @param {{ width: number, height: number }} options
 */
export function createLaserWall({ width, height }) {
  const group = new THREE.Group();
  group.name = 'LaserWall';

  const planeGeometry = new THREE.PlaneGeometry(width, height);

  // 1. Voile coloré translucide.
  const veil = new THREE.Mesh(
    planeGeometry,
    new THREE.MeshBasicMaterial({
      color: PALETTE.gate.laser,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    }),
  );
  veil.position.y = height / 2;
  veil.renderOrder = 2;
  group.add(veil);

  // 2. Lignes de balayage qui montent.
  const scanTexture = createScanlineTexture();
  scanTexture.repeat.set(1, height / 3.2);
  const scanlines = new THREE.Mesh(
    planeGeometry,
    glowMaterial(PALETTE.gate.laserGlow, { map: scanTexture, opacity: 0.75, side: THREE.DoubleSide }),
  );
  scanlines.position.y = height / 2;
  scanlines.renderOrder = 3;
  group.add(scanlines);

  // 3. Rayons horizontaux + émetteurs sur les piliers.
  const beamGeometry = cylinderGeometry(0.055, 0.055, 1, 8);
  const beamMaterial = new THREE.MeshBasicMaterial({ color: '#ffd3e0', toneMapped: false, fog: false });
  const emitterMaterial = new THREE.MeshBasicMaterial({ color: '#ff5b88', toneMapped: false, fog: false });
  const emitterGeometry = sphereGeometry(1, 12, 8);

  const beams = [];
  for (let i = 0; i < BEAM_COUNT; i++) {
    const y = ((i + 0.5) / BEAM_COUNT) * height;

    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.rotation.z = Math.PI / 2;
    beam.scale.set(1, width, 1);
    beam.position.y = y;
    group.add(beam);
    beams.push(beam);

    for (const side of [-1, 1]) {
      const emitter = new THREE.Mesh(emitterGeometry, emitterMaterial);
      emitter.scale.setScalar(0.17);
      emitter.position.set((side * width) / 2, y, 0);
      group.add(emitter);
    }
  }

  // 4. Cadenas flottant.
  const padlock = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: createPadlockTexture(),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      fog: false,
    }),
  );
  padlock.scale.setScalar(2.3);
  padlock.position.set(0, height * 0.5, 0);
  padlock.renderOrder = 4;
  group.add(padlock);

  /** 1 = mur actif, 0 = éteint (déverrouillé). */
  let power = 1;
  let unlocking = false;

  const update = (dt, time) => {
    // Extinction progressive après le déverrouillage.
    if (unlocking) power = Math.max(0, power - dt * 1.4);
    group.visible = power > 0.01;

    scanTexture.offset.y = -time * 0.35;
    veil.material.opacity = (0.27 + Math.sin(time * 2.4) * 0.06) * power;
    scanlines.material.opacity = (0.65 + Math.sin(time * 3.1 + 1) * 0.15) * power;

    beams.forEach((beam, index) => {
      const flicker = 1 + Math.sin(time * 9 + index * 1.7) * 0.18;
      beam.scale.x = flicker * power;
      beam.scale.z = flicker * power;
    });

    padlock.position.y = height * 0.5 + Math.sin(time * 1.8) * 0.14;
    const pulse = 2.3 + Math.sin(time * 3.6) * 0.1;
    padlock.scale.setScalar(pulse * Math.max(power, 0.001));
    padlock.material.opacity = power;
  };

  update(0, 0);
  return {
    object3D: group,
    update,
    /** Le cadenas (cible de clic pour déverrouiller). */
    padlock,
    /** Éteint le mur (porte déverrouillée). */
    unlock() {
      unlocking = true;
    },
    get unlocked() {
      return power === 0;
    },
  };
}
