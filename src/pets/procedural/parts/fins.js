import * as THREE from 'three';
import { softConeGeometry, sphereGeometry, softCylinderGeometry } from '../../../graphics/geometries.js';
import { glossyMaterial } from '../../../graphics/materials.js';
import { bodyLayout, DEFAULT_BODY } from '../petAnatomy.js';
import { partMesh, pivot } from './partUtils.js';

/**
 * Nageoire dorsale du requin : une grande aile dressée sur le dos.
 * @returns {{ object3D: THREE.Group }}
 */
export function createSharkFin(palette, body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('DorsalFin');
  const material = glossyMaterial(palette.body, { roughness: 0.45 });

  const fin = partMesh(softConeGeometry(0.5, 0.95, 0.12, 6), material, 'DorsalFin');
  fin.scale.set(1, 1, 0.18);
  fin.rotation.x = -0.18;
  fin.position.set(0, layout.topY - 0.1, -layout.halfDepth + 0.15);
  group.add(fin);

  return { object3D: group };
}

/**
 * Nageoires pectorales du requin : deux ailes latérales en avant des nageoires.
 * @returns {{ object3D: THREE.Group, fins: THREE.Group[] }}
 */
export function createSharkPectoralFins(palette, body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('PectoralFins');
  const material = glossyMaterial(palette.body, { roughness: 0.5 });

  const fins = [-1, 1].map((side) => {
    const fin = pivot(side < 0 ? 'PectoralLeft' : 'PectoralRight');
    const mesh = partMesh(softConeGeometry(0.34, 0.55, 0.1, 6), material, 'PectoralFin');
    mesh.scale.set(1, 1, 0.22);
    mesh.rotation.set(0.2, side * 0.5, side * 0.35);
    mesh.position.set(side * (layout.halfWidth + 0.12), layout.centerY - 0.12, layout.halfDepth * 0.55);
    fin.add(mesh);
    group.add(fin);
    return fin;
  });

  return { object3D: group, fins };
}

/**
 * Mâchoire blanche dentée du requin : bloc blanc en avant du museau + dents.
 * @returns {{ object3D: THREE.Group }}
 */
export function createSharkJaw(palette, body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('SharkJaw', 0, layout.centerY - 0.18, layout.halfDepth + 0.02);

  // Bloc de mâchoire blanc.
  const jaw = partMesh(
    softCylinderGeometry(0.34, 0.26, 0.34, 20),
    glossyMaterial('#f2f4fa', { roughness: 0.3 }),
    'SharkJaw',
  );
  jaw.rotation.x = Math.PI / 2;
  jaw.scale.set(1, 0.8, 1.1);
  group.add(jaw);

  // Dents blanches pointues sur le bord avant.
  const toothGeometry = softConeGeometry(0.05, 0.13, 0.02, 5);
  const toothMat = glossyMaterial('#ffffff', { roughness: 0.2 });
  for (let i = -2; i <= 2; i++) {
    const tooth = partMesh(toothGeometry, toothMat, 'SharkTooth');
    tooth.position.set(i * 0.11, -0.1, 0.22);
    tooth.rotation.x = -0.5;
    group.add(tooth);
  }

  return { object3D: group };
}

/**
 * Branchies roses de l'axolotl : trois grandes franges en éventail de chaque côté.
 * @returns {{ object3D: THREE.Group, gillGroups: THREE.Group[] }}
 */
export function createAxolotlGills(palette, body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('Gills');
  const material = glossyMaterial(palette.accent, { roughness: 0.55, emissive: palette.accent, emissiveIntensity: 0.3 });

  const gillGroups = [-1, 1].map((side) => {
    const gillGroup = pivot(side < 0 ? 'GillsLeft' : 'GillsRight', side * (layout.halfWidth + 0.1), layout.centerY + 0.1, 0.05);
    // 3 branches en éventail, plus grandes.
    for (let i = 0; i < 3; i++) {
      const gill = partMesh(sphereGeometry(1, 12, 8), material, 'Gill');
      gill.scale.set(0.09, 0.22, 0.1);
      gill.position.set(0, -i * 0.14, i * 0.02);
      gill.rotation.z = (i - 1) * 0.28;
      gill.castShadow = false;
      gillGroup.add(gill);
    }
    group.add(gillGroup);
    return gillGroup;
  });

  return { object3D: group, gillGroups };
}
