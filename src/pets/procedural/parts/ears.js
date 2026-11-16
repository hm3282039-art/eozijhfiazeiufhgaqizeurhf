import { capsuleGeometry, softConeGeometry } from '../../../graphics/geometries.js';
import { glossyMaterial } from '../../../graphics/materials.js';
import { BODY_HALF_WIDTH, BODY_TOP_Y } from '../petAnatomy.js';
import { partMesh, pivot } from './partUtils.js';

/**
 * Oreilles de chat : deux cônes adoucis posés sur le dessus de la tête,
 * avec un intérieur rose visible de face.
 * @returns {{ object3D: THREE.Group, ears: THREE.Group[] }} `ears` : pivots [gauche, droite] (à la base)
 */
export function createCatEars(palette) {
  const group = pivot('Ears');
  const outerGeometry = softConeGeometry(0.25, 0.44, 0.075);
  const innerGeometry = softConeGeometry(0.155, 0.29, 0.05);
  const outerMaterial = glossyMaterial(palette.body);
  const innerMaterial = glossyMaterial(palette.accent);

  const ears = [-1, 1].map((side) => {
    const ear = pivot(side < 0 ? 'EarLeft' : 'EarRight', side * 0.35, BODY_TOP_Y - 0.085, 0.05);
    ear.rotation.z = -side * 0.24; // légèrement écartées
    ear.userData.restZ = ear.rotation.z;

    const outer = partMesh(outerGeometry, outerMaterial, 'EarOuter');
    outer.scale.z = 0.62;
    ear.add(outer);

    const inner = partMesh(innerGeometry, innerMaterial, 'EarInner');
    inner.scale.z = 0.5;
    inner.position.set(0, 0.035, 0.088);
    inner.castShadow = false;
    ear.add(inner);

    group.add(ear);
    return ear;
  });

  return { object3D: group, ears };
}

/**
 * Oreilles de chien : deux grandes oreilles tombantes accrochées en haut des côtés.
 * @returns {{ object3D: THREE.Group, ears: THREE.Group[] }} `ears` : pivots [gauche, droite] (à l'attache)
 */
export function createDogEars(palette) {
  const group = pivot('Ears');
  const geometry = capsuleGeometry(0.19, 0.3, 16);
  const material = glossyMaterial(palette.accent);

  const ears = [-1, 1].map((side) => {
    const ear = pivot(side < 0 ? 'EarLeft' : 'EarRight', side * (BODY_HALF_WIDTH + 0.015), BODY_TOP_Y - 0.17, 0.1);
    ear.rotation.z = side * 0.13; // le bas de l'oreille s'écarte un peu du corps
    ear.userData.restZ = ear.rotation.z;
    ear.userData.side = side;

    const flap = partMesh(geometry, material, 'EarFlap');
    flap.scale.set(0.52, 1, 1);
    flap.position.y = -0.27;
    ear.add(flap);

    group.add(ear);
    return ear;
  });

  return { object3D: group, ears };
}
