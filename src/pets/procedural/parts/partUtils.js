import * as THREE from 'three';

/**
 * Crée un morceau de pet.
 * Optimisation FPS : les pets ne projettent PAS d'ombre (seuls le joueur et les
 * coffres castShadow) ; `receiveShadow` reste activé pour le rendu.
 */
export function partMesh(geometry, material, name = '') {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

/** Groupe vide servant de pivot d'animation. */
export function pivot(name, x = 0, y = 0, z = 0) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, y, z);
  return group;
}
