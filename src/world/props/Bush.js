import * as THREE from 'three';
import { PALETTE } from '../../config/palette.js';
import { toyMaterial } from '../../graphics/materials.js';
import { sphereGeometry } from '../../graphics/geometries.js';
import { mergeStaticMeshes } from '../../graphics/mergeMeshes.js';
import { createRng } from '../../utils/random.js';

/**
 * Buisson : grappe de sphères vertes aplaties, parfois décorée de petites baies colorées.
 * @param {{ color?: keyof PALETTE['foliage'], scale?: number, berries?: string | null, seed?: number }} options
 */
export function createBush({ color = 'green', scale = 1, berries = null, seed = 1 } = {}) {
  const rng = createRng(seed);
  const bush = new THREE.Group();
  bush.name = 'Bush';

  const geometry = sphereGeometry(1, 18, 14);
  const shades = (PALETTE.foliage[color] ?? PALETTE.foliage.green).map((hex) => toyMaterial(hex, { roughness: 0.8 }));

  const puffCount = rng.int(3, 5);
  for (let i = 0; i < puffCount; i++) {
    const angle = (i / puffCount) * Math.PI * 2 + rng.range(-0.4, 0.4);
    const distance = i === 0 ? 0 : rng.range(0.55, 0.85);
    const size = i === 0 ? rng.range(0.85, 1.0) : rng.range(0.55, 0.78);
    const puff = new THREE.Mesh(geometry, shades[i % shades.length]);
    puff.position.set(Math.cos(angle) * distance, size * 0.62, Math.sin(angle) * distance);
    puff.scale.set(size, size * 0.82, size);
    puff.castShadow = false;
    puff.receiveShadow = true;
    bush.add(puff);
  }

  if (berries) {
    const berryGeometry = sphereGeometry(1, 10, 7);
    const berryMaterial = toyMaterial(berries, { roughness: 0.45 });
    for (let i = 0; i < 6; i++) {
      const angle = rng.range(0, Math.PI * 2);
      const berry = new THREE.Mesh(berryGeometry, berryMaterial);
      berry.position.set(Math.cos(angle) * rng.range(0.35, 0.9), rng.range(0.75, 1.25), Math.sin(angle) * rng.range(0.35, 0.9));
      berry.scale.setScalar(0.13);
      bush.add(berry);
    }
  }

  bush.scale.setScalar(scale);
  bush.rotation.y = rng.range(0, Math.PI * 2);
  return bush;
}

/**
 * @param {Array<{ x: number, z: number, color?: string, scale?: number, berries?: string }>} layout
 */
export function createBushes(layout) {
  const group = new THREE.Group();
  group.name = 'Bushes';
  layout.forEach((spec, index) => {
    const bush = createBush({ ...spec, seed: 300 + index * 13 });
    bush.position.set(spec.x, 0, spec.z);
    group.add(bush);
  });
  // Les buissons ne bougent pas : toutes leurs boules sont fusionnées par couleur.
  return { object3D: mergeStaticMeshes(group) };
}
