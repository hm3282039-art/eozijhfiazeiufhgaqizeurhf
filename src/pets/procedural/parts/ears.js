import { capsuleGeometry, softConeGeometry, sphereGeometry } from '../../../graphics/geometries.js';
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

/**
 * Oreilles de lapin : deux très longues oreilles verticales arrondies.
 * @returns {{ object3D: THREE.Group, ears: THREE.Group[] }} `ears` : pivots [gauche, droite] (à la base)
 */
export function createBunnyEars(palette) {
  const group = pivot('Ears');
  const outerGeometry = capsuleGeometry(0.13, 0.62, 14);
  const innerGeometry = capsuleGeometry(0.075, 0.5, 12);
  const outerMaterial = glossyMaterial(palette.body);
  const innerMaterial = glossyMaterial(palette.accent);

  const ears = [-1, 1].map((side) => {
    const ear = pivot(side < 0 ? 'EarLeft' : 'EarRight', side * 0.24, BODY_TOP_Y - 0.12, 0);
    ear.userData.restZ = 0;

    const outer = partMesh(outerGeometry, outerMaterial, 'EarOuter');
    ear.add(outer);

    const inner = partMesh(innerGeometry, innerMaterial, 'EarInner');
    inner.position.y = -0.02;
    inner.castShadow = false;
    ear.add(inner);

    group.add(ear);
    return ear;
  });

  return { object3D: group, ears };
}

/**
 * Oreilles de ours : deux petites oreilles rondes sur les coins de la tête.
 * @returns {{ object3D: THREE.Group, ears: THREE.Group[] }} `ears` : pivots [gauche, droite]
 */
export function createBearEars(palette) {
  const group = pivot('Ears');
  const outerGeometry = sphereGeometry(1, 18, 14);
  const innerGeometry = sphereGeometry(1, 14, 10);
  const outerMaterial = glossyMaterial(palette.body);
  const innerMaterial = glossyMaterial(palette.accent);

  const ears = [-1, 1].map((side) => {
    const ear = pivot(side < 0 ? 'EarLeft' : 'EarRight', side * (BODY_HALF_WIDTH - 0.02), BODY_TOP_Y - 0.02, 0);
    ear.userData.restZ = 0;

    const outer = partMesh(outerGeometry, outerMaterial, 'EarOuter');
    outer.scale.set(0.34, 0.34, 0.28);
    ear.add(outer);

    const inner = partMesh(innerGeometry, innerMaterial, 'EarInner');
    inner.scale.setScalar(0.18);
    inner.position.z = 0.06;
    inner.castShadow = false;
    ear.add(inner);

    group.add(ear);
    return ear;
  });

  return { object3D: group, ears };
}

/**
 * Oreilles de renard : pointues et dressées, un peu plus grandes que celles du chat,
 * avec un pan incliné vers l'extérieur.
 * @returns {{ object3D: THREE.Group, ears: THREE.Group[] }} `ears` : pivots [gauche, droite]
 */
export function createFoxEars(palette) {
  const group = pivot('Ears');
  const outerGeometry = softConeGeometry(0.27, 0.5, 0.08);
  const innerGeometry = softConeGeometry(0.16, 0.36, 0.05);
  const outerMaterial = glossyMaterial(palette.body);
  const innerMaterial = glossyMaterial(palette.accent);

  const ears = [-1, 1].map((side) => {
    const ear = pivot(side < 0 ? 'EarLeft' : 'EarRight', side * 0.32, BODY_TOP_Y - 0.1, 0.03);
    ear.rotation.z = -side * 0.3; // pointues, légèrement écartées
    ear.userData.restZ = ear.rotation.z;

    const outer = partMesh(outerGeometry, outerMaterial, 'EarOuter');
    outer.scale.z = 0.6;
    ear.add(outer);

    const inner = partMesh(innerGeometry, innerMaterial, 'EarInner');
    inner.scale.z = 0.5;
    inner.position.set(0, 0.04, 0.09);
    inner.castShadow = false;
    ear.add(inner);

    group.add(ear);
    return ear;
  });

  return { object3D: group, ears };
}
