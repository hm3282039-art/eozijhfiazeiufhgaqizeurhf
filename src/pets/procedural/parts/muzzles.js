import * as THREE from 'three';
import {
  capsuleGeometry,
  cylinderGeometry,
  sphereGeometry,
  softConeGeometry,
  softCylinderGeometry,
  torusGeometry,
} from '../../../graphics/geometries.js';
import { goldMaterial, glossyMaterial } from '../../../graphics/materials.js';
import { bodyLayout, DEFAULT_BODY } from '../petAnatomy.js';
import { partMesh, pivot } from './partUtils.js';

const UP = new THREE.Vector3(0, 1, 0);

/**
 * Museau proéminent du chien / corgi : nez noir brillant en relief + langue rose qui pend.
 * @returns {{ object3D: THREE.Group, wag: THREE.Group }} `wag` : pivot de la langue (qui remue)
 */
export function createDogMuzzle(palette, body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('Muzzle', 0, layout.centerY - 0.04, layout.halfDepth + 0.16);

  const muzzle = partMesh(
    capsuleGeometry(0.24, 0.26, 18),
    glossyMaterial(palette.body),
    'Muzzle',
  );
  muzzle.rotation.x = Math.PI / 2;
  muzzle.scale.set(1.2, 0.95, 1);
  group.add(muzzle);

  // Truffe noire brillante, en relief sur le front du museau.
  const nose = partMesh(sphereGeometry(1, 16, 12), glossyMaterial('#1c1c22', { roughness: 0.18 }), 'Nose');
  nose.scale.set(0.11, 0.13, 0.09);
  nose.position.set(0, 0.12, 0.16);
  group.add(nose);

  // Langue rose 3D qui pend d'un côté.
  const wag = pivot('Tongue');
  const tongue = partMesh(capsuleGeometry(0.09, 0.32, 12), glossyMaterial('#ff6fa3', { roughness: 0.4 }), 'Tongue');
  tongue.rotation.x = Math.PI / 2 + 0.5;
  tongue.position.y = -0.05;
  tongue.castShadow = false;
  wag.add(tongue);
  wag.position.set(0.1, -0.14, 0.24);
  group.add(wag);

  return { object3D: group, wag };
}

/**
 * Museau avancé du dragon : nez étiré avec deux narines sombres et deux crocs blancs.
 * @returns {{ object3D: THREE.Group }}
 */
export function createDragonMuzzle(palette, body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('Muzzle', 0, layout.centerY - 0.02, layout.halfDepth + 0.14);

  const muzzle = partMesh(
    softCylinderGeometry(0.26, 0.2, 0.42, 22),
    glossyMaterial(palette.body),
    'Muzzle',
  );
  muzzle.rotation.x = Math.PI / 2;
  muzzle.scale.set(1.15, 0.9, 1);
  group.add(muzzle);

  // Narines sombres en relief.
  const nostrilGeometry = sphereGeometry(1, 10, 8);
  const nostrilMat = glossyMaterial('#1c1c22', { roughness: 0.2 });
  for (const side of [-1, 1]) {
    const nostril = partMesh(nostrilGeometry, nostrilMat, 'Nostril');
    nostril.scale.setScalar(0.05);
    nostril.position.set(side * 0.09, 0.08, 0.2);
    nostril.castShadow = false;
    group.add(nostril);
  }

  // Crocs blancs qui dépassent.
  const toothGeometry = softConeGeometry(0.04, 0.1, 0.015, 5);
  const toothMat = glossyMaterial('#ffffff', { roughness: 0.2 });
  for (const side of [-1, 1]) {
    const tooth = partMesh(toothGeometry, toothMat, 'DragonTooth');
    tooth.position.set(side * 0.085, -0.2, 0.12);
    tooth.rotation.x = 0.55;
    tooth.castShadow = false;
    group.add(tooth);
  }

  return { object3D: group };
}

/**
 * Museau blanc bombé du panda / de l'ours : rond et très proéminent.
 * @returns {{ object3D: THREE.Group }}
 */
export function createBearMuzzle(palette, body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('Muzzle', 0, layout.centerY - 0.06, layout.halfDepth + 0.2);

  const muzzle = partMesh(sphereGeometry(1, 20, 16), glossyMaterial('#f7f3e8', { roughness: 0.35 }), 'Muzzle');
  muzzle.scale.set(0.55, 0.4, 0.62);
  group.add(muzzle);

  // Narines sombres.
  const nostrilGeometry = sphereGeometry(1, 8, 8);
  const nostrilMat = glossyMaterial('#1c1c22', { roughness: 0.2 });
  for (const side of [-1, 1]) {
    const nostril = partMesh(nostrilGeometry, nostrilMat, 'Nostril');
    nostril.scale.setScalar(0.055);
    nostril.position.set(side * 0.11, 0.1, 0.48);
    nostril.castShadow = false;
    group.add(nostril);
  }

  // Petits crocs blancs.
  const toothGeometry = softConeGeometry(0.035, 0.09, 0.015, 5);
  const toothMat = glossyMaterial('#ffffff', { roughness: 0.2 });
  for (const side of [-1, 1]) {
    const tooth = partMesh(toothGeometry, toothMat, 'BearTooth');
    tooth.position.set(side * 0.07, -0.1, 0.38);
    tooth.rotation.x = 0.6;
    tooth.castShadow = false;
    group.add(tooth);
  }

  return { object3D: group };
}

/**
 * Museau blanc du lapin : court et arrondi, avec deux petites dents blanches.
 * @returns {{ object3D: THREE.Group }}
 */
export function createBunnyMuzzle(palette, body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('Muzzle', 0, layout.centerY + 0.02, layout.halfDepth + 0.18);

  const muzzle = partMesh(
    softCylinderGeometry(0.2, 0.16, 0.3, 18),
    glossyMaterial('#f7f3e8', { roughness: 0.35 }),
    'Muzzle',
  );
  muzzle.rotation.x = Math.PI / 2;
  muzzle.scale.set(1.1, 0.9, 1);
  group.add(muzzle);

  // Deux petites dents blanches pointues.
  const toothGeometry = softConeGeometry(0.03, 0.09, 0.015, 5);
  const toothMat = glossyMaterial('#ffffff', { roughness: 0.2 });
  for (const side of [-1, 1]) {
    const tooth = partMesh(toothGeometry, toothMat, 'BunnyTooth');
    tooth.position.set(side * 0.06, -0.16, 0.14);
    tooth.rotation.x = 0.7;
    tooth.castShadow = false;
    group.add(tooth);
  }

  return { object3D: group };
}

/**
 * Deux PATROUILLES d'or (épaulières) + deux ARCOURTS d'or en dessous : armures dorées
 * des pets GÉANTS (HUGE / TITANIC / GARGANTUAN).
 * @returns {{ object3D: THREE.Group }}
 */
export function createGoldenShoulders(body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('GoldenShoulders');
  const shoulderMaterial = goldMaterial();
  const torusMaterial = goldMaterial();

  for (const side of [-1, 1]) {
    // Épaule : grande coque dorée.
    const shoulder = partMesh(sphereGeometry(1, 18, 14), shoulderMaterial, 'Shoulder');
    shoulder.scale.set(0.42, 0.3, 0.38);
    shoulder.position.set(side * (layout.halfWidth + 0.08), layout.centerY + 0.22, -layout.halfDepth * 0.1);
    group.add(shoulder);

    // Épaulette : anneau doré autour de l'épaule.
    const pauldron = partMesh(torusGeometry(0.26, 0.075, Math.PI * 2, 24, 10), torusMaterial, 'Pauldron');
    pauldron.rotation.x = Math.PI / 2;
    pauldron.position.set(side * (layout.halfWidth + 0.08), layout.centerY + 0.08, -layout.halfDepth * 0.1);
    group.add(pauldron);
  }

  return { object3D: group };
}

/**
 * Halo cosmique flottant au-dessus de la tête (alternative à la couronne royale).
 * @returns {{ object3D: THREE.Group, halo: THREE.Mesh }}
 */
export function createHalo(body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('Halo', 0, layout.topY + 0.55, 0);
  const halo = partMesh(
    torusGeometry(0.5, 0.09, Math.PI * 2, 36, 10),
    goldMaterial(),
    'Halo',
  );
  halo.rotation.x = Math.PI / 2.4;
  group.add(halo);
  return { object3D: group, halo };
}

/**
 * Cercle d'aura lumineuse qui tourne sous les pieds, posé au sol.
 * @returns {{ object3D: THREE.Group, ring: THREE.Mesh }}
 */
export function createAuraRing(body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('AuraRing', 0, 0.02, 0);
  const ring = partMesh(
    torusGeometry(Math.max(layout.width, layout.depth) * 0.95, 0.07, Math.PI * 2, 44, 10),
    goldMaterial(),
    'AuraRing',
  );
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return { object3D: group, ring };
}

/**
 * Griffes du requin : un bloc de dents blanches pointues autour du bord avant.
 * (Voir `createSharkJaw` dans fins.js — ici version « sur le bout du museau ».)
 */
export function createSharkMuzzle() {
  const group = pivot('SharkMuzzle');
  const jaw = partMesh(cylinderGeometry(0.3, 0.22, 0.2, 20), glossyMaterial('#f2f4fa', { roughness: 0.3 }), 'SharkJaw');
  jaw.rotation.x = Math.PI / 2;
  group.add(jaw);
  return { object3D: group };
}
