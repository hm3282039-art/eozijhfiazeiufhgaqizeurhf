import * as THREE from 'three';
import { toyMaterial } from '../../graphics/materials.js';
import { sphereGeometry, torusGeometry } from '../../graphics/geometries.js';

const BAND_COLORS = ['#ff4b5c', '#ff9838', '#ffe04a', '#5ee06c', '#4cb9ff', '#a67bff'];
const OUTER_RADIUS = 5.7;
const BAND_SPACING = 0.46;
const TUBE_RADIUS = 0.27;

/** Petit nuage blanc qui cache le pied de l'arc-en-ciel. */
function createCloudFoot() {
  const foot = new THREE.Group();
  const geometry = sphereGeometry(1, 20, 14);
  const material = toyMaterial('#ffffff', { roughness: 0.9, emissive: '#ffffff', emissiveIntensity: 0.18 });

  const puffs = [
    [0, 0.72, 0, 1.2],
    [-0.95, 0.55, 0.25, 0.85],
    [0.95, 0.55, -0.2, 0.88],
    [0.25, 0.6, 0.85, 0.75],
    [-0.3, 0.62, -0.8, 0.78],
    [0.1, 1.35, 0.05, 0.8],
  ];
  for (const [x, y, z, size] of puffs) {
    const puff = new THREE.Mesh(geometry, material);
    puff.position.set(x, y, z);
    puff.scale.set(size, size * 0.86, size);
    puff.castShadow = true;
    puff.receiveShadow = true;
    foot.add(puff);
  }
  return foot;
}

/**
 * Arche du spawn : un arc-en-ciel « jouet » posé sur deux nuages, à cheval sur le chemin.
 * L'arche est construite dans le plan XY : on la traverse en marchant le long de Z.
 */
export function createRainbowArch() {
  const group = new THREE.Group();
  group.name = 'RainbowArch';

  BAND_COLORS.forEach((color, index) => {
    const radius = OUTER_RADIUS - index * BAND_SPACING;
    const band = new THREE.Mesh(
      torusGeometry(radius, TUBE_RADIUS, Math.PI, 56, 12),
      toyMaterial(color, { roughness: 0.45 }),
    );
    band.castShadow = true;
    band.receiveShadow = true;
    group.add(band);
  });

  const innerRadius = OUTER_RADIUS - (BAND_COLORS.length - 1) * BAND_SPACING;
  const footX = (OUTER_RADIUS + innerRadius) / 2;
  const colliders = [];

  for (const side of [-1, 1]) {
    const foot = createCloudFoot();
    foot.position.x = side * footX;
    foot.scale.setScalar(1.25);
    group.add(foot);
    colliders.push({ type: 'circle', x: side * footX, z: 0, radius: 1.55 });
  }

  return { object3D: group, colliders };
}
