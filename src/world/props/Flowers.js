import * as THREE from 'three';
import { PALETTE } from '../../config/palette.js';
import { toyMaterial } from '../../graphics/materials.js';
import { cylinderGeometry, sphereGeometry } from '../../graphics/geometries.js';
import { createRng } from '../../utils/random.js';

const STEM_HEIGHT = 0.42;

/**
 * Petites fleurs colorées semées par touffes sur la pelouse.
 * Trois InstancedMesh (tiges, corolles, cœurs) : des centaines de fleurs pour 3 draw calls.
 *
 * @param {{
 *   bounds: { minX: number, maxX: number, minZ: number, maxZ: number },
 *   isBlocked: (x: number, z: number) => boolean,
 *   clusterCount?: number,
 * }} options
 */
export function createFlowers({ bounds, isBlocked, clusterCount = 46 }) {
  const rng = createRng(808);
  const flowers = [];

  for (let c = 0; c < clusterCount; c++) {
    const cx = rng.range(bounds.minX + 1, bounds.maxX - 1);
    const cz = rng.range(bounds.minZ + 1, bounds.maxZ - 1);
    if (isBlocked(cx, cz)) continue;

    const color = rng.pick(PALETTE.flowers);
    const amount = rng.int(3, 6);
    for (let i = 0; i < amount; i++) {
      const angle = rng.range(0, Math.PI * 2);
      const distance = rng.range(0.15, 1.25);
      const x = cx + Math.cos(angle) * distance;
      const z = cz + Math.sin(angle) * distance;
      if (isBlocked(x, z)) continue;
      flowers.push({ x, z, color, scale: rng.range(0.8, 1.25), lean: rng.range(-0.12, 0.12) });
    }
  }

  const group = new THREE.Group();
  group.name = 'Flowers';

  // Les fleurs sont minuscules à l'écran : géométries très légères.
  const stems = new THREE.InstancedMesh(
    cylinderGeometry(0.035, 0.045, STEM_HEIGHT, 5),
    toyMaterial('#3fae3a', { roughness: 0.8 }),
    flowers.length,
  );
  const heads = new THREE.InstancedMesh(
    sphereGeometry(1, 10, 6),
    toyMaterial('#ffffff', { roughness: 0.6 }),
    flowers.length,
  );
  const hearts = new THREE.InstancedMesh(
    sphereGeometry(1, 8, 5),
    toyMaterial('#ffc531', { roughness: 0.6 }),
    flowers.length,
  );

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();

  flowers.forEach((flower, index) => {
    const height = STEM_HEIGHT * flower.scale;

    dummy.position.set(flower.x, height / 2, flower.z);
    dummy.rotation.set(flower.lean, 0, flower.lean * 0.6);
    dummy.scale.set(1, flower.scale, 1);
    dummy.updateMatrix();
    stems.setMatrixAt(index, dummy.matrix);

    dummy.position.set(flower.x, height + 0.04, flower.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(0.19 * flower.scale, 0.085 * flower.scale, 0.19 * flower.scale);
    dummy.updateMatrix();
    heads.setMatrixAt(index, dummy.matrix);
    heads.setColorAt(index, color.set(flower.color));

    dummy.position.set(flower.x, height + 0.085, flower.z);
    dummy.scale.setScalar(0.085 * flower.scale);
    dummy.updateMatrix();
    hearts.setMatrixAt(index, dummy.matrix);
  });

  for (const mesh of [stems, heads, hearts]) {
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  return { object3D: group };
}
