import * as THREE from 'three';
import { softConeGeometry, sphereGeometry } from '../../../graphics/geometries.js';
import { glossyMaterial } from '../../../graphics/materials.js';
import { BODY_CENTER_Y, BODY_HALF_DEPTH, BODY_TOP_Y } from '../petAnatomy.js';
import { partMesh, pivot } from './partUtils.js';

/**
 * Nageoire dorsale du requin : une grande aile dressée sur le dos.
 * @returns {{ object3D: THREE.Group }}
 */
export function createSharkFin(palette) {
  const group = pivot('DorsalFin');
  const material = glossyMaterial(palette.body, { roughness: 0.45 });

  const fin = partMesh(softConeGeometry(0.5, 0.95, 0.12, 6), material, 'DorsalFin');
  fin.scale.set(1, 1, 0.18);
  fin.rotation.x = -0.18;
  fin.position.set(0, BODY_TOP_Y - 0.1, -BODY_HALF_DEPTH + 0.15);
  group.add(fin);

  return { object3D: group };
}

/**
 * Branchies roses de l'axolotl : trois petites franges sur chaque côté de la tête.
 * @returns {{ object3D: THREE.Group }}
 */
export function createAxolotlGills(palette) {
  const group = pivot('Gills');
  const material = glossyMaterial(palette.accent, { roughness: 0.55, emissive: palette.accent, emissiveIntensity: 0.25 });

  for (const side of [-1, 1]) {
    const gillGroup = pivot(side < 0 ? 'GillsLeft' : 'GillsRight', side * 0.6, BODY_CENTER_Y + 0.12, 0.1);
    for (let i = 0; i < 3; i++) {
      const gill = partMesh(sphereGeometry(1, 12, 8), material, 'Gill');
      gill.scale.set(0.07, 0.16, 0.1);
      gill.position.set(0, -i * 0.12, -i * 0.02);
      gill.castShadow = false;
      gillGroup.add(gill);
    }
    group.add(gillGroup);
  }

  return { object3D: group };
}
