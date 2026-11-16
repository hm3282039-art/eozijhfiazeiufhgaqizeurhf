import { sphereGeometry } from '../../../graphics/geometries.js';
import { glossyMaterial } from '../../../graphics/materials.js';
import { partMesh, pivot } from './partUtils.js';

const PAW_POSITIONS = [
  { name: 'PawFrontLeft', x: -0.34, z: 0.37 },
  { name: 'PawFrontRight', x: 0.34, z: 0.37 },
  { name: 'PawBackLeft', x: -0.35, z: -0.34 },
  { name: 'PawBackRight', x: 0.35, z: -0.34 },
];

/**
 * Quatre petites pattes arrondies qui dépassent sous le corps.
 * @param {string} color
 */
export function createPaws(color) {
  const group = pivot('Paws');
  const geometry = sphereGeometry(1, 18, 12);
  const material = glossyMaterial(color);

  const paws = PAW_POSITIONS.map(({ name, x, z }) => {
    const paw = partMesh(geometry, material, name);
    paw.scale.set(0.21, 0.155, 0.235);
    paw.position.set(x, 0.155, z);
    group.add(paw);
    return paw;
  });

  return { object3D: group, paws };
}
