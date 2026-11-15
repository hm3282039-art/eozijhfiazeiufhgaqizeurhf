import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createToyMaterial, toyMaterial } from '../graphics/materials.js';
import { roundedBoxGeometry } from '../graphics/geometries.js';
import { createPlayerFaceTexture, createShirtTexture } from './playerTextures.js';

/** Couleurs de l'avatar par défaut. */
export const PLAYER_COLORS = Object.freeze({
  skin: '#ffd2a8',
  shirt: '#ffffff',
  emblem: '#ff9a3d',
  pants: '#3a6be0',
  shoes: '#ff4d5e',
  cap: '#ff4d5e',
  capBrim: '#ffffff',
  hair: '#6b4226',
});

/** Proportions (unités monde) — avatar « blocky arrondi » façon Roblox, tête un peu agrandie. */
const DIM = Object.freeze({
  hipY: 1.08,
  torso: { width: 1.08, height: 1.12, depth: 0.58 },
  head: { width: 0.86, height: 0.8, depth: 0.82 },
  shoulderY: 1.0, // au-dessus des hanches
  shoulderX: 0.77,
  legX: 0.27,
});

function mesh(geometry, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

/** Matériaux d'une RoundedBox dont seule la face avant (+Z, groupe n°4) porte une texture. */
function frontTextured(sideMaterial, frontMaterial) {
  return [sideMaterial, sideMaterial, sideMaterial, sideMaterial, frontMaterial, sideMaterial];
}

function createHead(colors) {
  const { width, height, depth } = DIM.head;
  const head = new THREE.Group();
  head.name = 'Head';

  const skin = toyMaterial(colors.skin);
  const face = createToyMaterial({ map: createPlayerFaceTexture(colors.skin) });
  head.add(mesh(new RoundedBoxGeometry(width, height, depth, 5, 0.27), frontTextured(skin, face), 0, height / 2, 0));

  // Cheveux qui dépassent sous la casquette, à l'arrière et sur les côtés.
  head.add(mesh(roundedBoxGeometry(width + 0.08, 0.5, 0.52, 0.16, 3), toyMaterial(colors.hair, { roughness: 0.8 }), 0, height * 0.6, -0.2));

  // Casquette : calotte + visière.
  const cap = toyMaterial(colors.cap, { roughness: 0.55 });
  head.add(mesh(roundedBoxGeometry(width + 0.1, 0.36, depth + 0.08, 0.17, 4), cap, 0, height - 0.06, 0));
  head.add(mesh(roundedBoxGeometry(0.7, 0.08, 0.46, 0.04, 2), toyMaterial(colors.capBrim, { roughness: 0.55 }), 0, height - 0.17, depth / 2 + 0.16));
  head.add(mesh(roundedBoxGeometry(0.16, 0.08, 0.16, 0.04, 2), toyMaterial(colors.capBrim), 0, height + 0.13, 0));

  return head;
}

function createArm(colors, side) {
  const arm = new THREE.Group();
  arm.name = side < 0 ? 'ArmLeft' : 'ArmRight';
  arm.add(mesh(roundedBoxGeometry(0.46, 0.44, 0.5, 0.14, 3), toyMaterial(colors.shirt), 0, -0.12, 0));
  arm.add(mesh(roundedBoxGeometry(0.4, 0.74, 0.43, 0.14, 3), toyMaterial(colors.skin), 0, -0.62, 0));
  return arm;
}

function createLeg(colors, side) {
  const leg = new THREE.Group();
  leg.name = side < 0 ? 'LegLeft' : 'LegRight';
  leg.add(mesh(roundedBoxGeometry(0.5, 0.86, 0.5, 0.14, 3), toyMaterial(colors.pants), 0, -0.4, 0));
  leg.add(mesh(roundedBoxGeometry(0.54, 0.34, 0.68, 0.13, 3), toyMaterial(colors.shoes, { roughness: 0.5 }), 0, -0.91, 0.07));
  return leg;
}

/**
 * Construit l'avatar du joueur et retourne ses articulations.
 *
 * Hiérarchie :
 *   root (pieds au sol, avant = +Z)
 *   └─ body (pivot aux hanches : rebond + inclinaison vers l'avant)
 *      ├─ torso
 *      ├─ head      (pivot au cou)
 *      ├─ armLeft / armRight   (pivots aux épaules)
 *      └─ legLeft / legRight   (pivots aux hanches)
 */
export function createPlayerModel(colors = PLAYER_COLORS) {
  const root = new THREE.Group();
  root.name = 'PlayerModel';

  const body = new THREE.Group();
  body.name = 'Body';
  body.position.y = DIM.hipY;
  root.add(body);

  // Torse (empreinte de patte sur le devant du t-shirt)
  const shirt = toyMaterial(colors.shirt);
  const shirtFront = createToyMaterial({ map: createShirtTexture(colors.shirt, colors.emblem) });
  const { width, height, depth } = DIM.torso;
  const torso = mesh(new RoundedBoxGeometry(width, height, depth, 4, 0.18), frontTextured(shirt, shirtFront), 0, height / 2 - 0.02, 0);
  torso.name = 'Torso';
  body.add(torso);

  const head = createHead(colors);
  head.position.y = height + 0.02;
  body.add(head);

  const armLeft = createArm(colors, -1);
  const armRight = createArm(colors, 1);
  armLeft.position.set(-DIM.shoulderX, DIM.shoulderY, 0);
  armRight.position.set(DIM.shoulderX, DIM.shoulderY, 0);
  body.add(armLeft, armRight);

  const legLeft = createLeg(colors, -1);
  const legRight = createLeg(colors, 1);
  legLeft.position.set(-DIM.legX, 0, 0);
  legRight.position.set(DIM.legX, 0, 0);
  body.add(legLeft, legRight);

  return {
    root,
    joints: { body, head, armLeft, armRight, legLeft, legRight },
    hipY: DIM.hipY,
  };
}
