import { sphereGeometry } from '../../../graphics/geometries.js';
import { glossyMaterial } from '../../../graphics/materials.js';
import { bodyLayout, DEFAULT_BODY } from '../petAnatomy.js';
import { partMesh, pivot } from './partUtils.js';

/**
 * Quatre petites pattes arrondies qui dépassent sous le corps.
 * Les positions sont calculées à partir des proportions du corps.
 * @param {string} color
 * @param {object} [body] dimensions du corps
 */
export function createPaws(color, body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('Paws');
  const geometry = sphereGeometry(1, 18, 12);
  const material = glossyMaterial(color);

  // Rapport d'aspect du corps pour positionner les pattes aux coins.
  const sx = layout.width / DEFAULT_BODY.width;
  const sz = layout.depth / DEFAULT_BODY.depth;

  const positions = [
    { name: 'PawFrontLeft', x: -0.34, z: 0.37 },
    { name: 'PawFrontRight', x: 0.34, z: 0.37 },
    { name: 'PawBackLeft', x: -0.35, z: -0.34 },
    { name: 'PawBackRight', x: 0.35, z: -0.34 },
  ];

  const paws = positions.map(({ name, x, z }) => {
    const paw = partMesh(geometry, material, name);
    paw.scale.set(0.21 * Math.max(sx, 0.8), 0.155, 0.235 * Math.max(sz, 0.8));
    paw.position.set(x * sx, 0.155, z * sz);
    group.add(paw);
    return paw;
  });

  return { object3D: group, paws };
}
