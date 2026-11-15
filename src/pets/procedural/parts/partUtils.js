import * as THREE from 'three';

/** Crée un morceau de pet (mesh qui projette une ombre). */
export function partMesh(geometry, material, name = '') {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = true;
  return mesh;
}

/** Groupe vide servant de pivot d'animation. */
export function pivot(name, x = 0, y = 0, z = 0) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(x, y, z);
  return group;
}
