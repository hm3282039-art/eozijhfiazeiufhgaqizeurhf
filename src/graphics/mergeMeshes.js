import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Fusionne les maillages STATIQUES d'un groupe : il n'en reste qu'un par matériau
 * (et par réglage d'ombre), au lieu d'un par objet. Un buisson de 5 boules ou une forêt
 * de buissons se dessine ainsi en quelques « draw calls » au lieu de plusieurs dizaines.
 *
 * Les transformations des enfants sont « cuites » dans la géométrie fusionnée ; le groupe
 * renvoyé reprend la position, la rotation et l'échelle du groupe d'origine, et peut donc
 * toujours être déplacé ou animé d'un bloc (nuage qui dérive, feuillage qui se balance…).
 *
 * @param {THREE.Object3D} root groupe dont les maillages ne bougent pas les uns par rapport aux autres
 * @returns {THREE.Group}
 */
export function mergeStaticMeshes(root) {
  root.updateMatrixWorld(true);
  const toRootSpace = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const matrix = new THREE.Matrix4();

  /** @type {Map<string, { material: THREE.Material, castShadow: boolean, receiveShadow: boolean, geometries: THREE.BufferGeometry[] }>} */
  const buckets = new Map();

  root.traverse((node) => {
    if (!node.isMesh) return;
    const key = `${node.material.uuid}|${node.castShadow}|${node.receiveShadow}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { material: node.material, castShadow: node.castShadow, receiveShadow: node.receiveShadow, geometries: [] };
      buckets.set(key, bucket);
    }
    matrix.multiplyMatrices(toRootSpace, node.matrixWorld);
    bucket.geometries.push(node.geometry.clone().applyMatrix4(matrix));
  });

  const merged = new THREE.Group();
  merged.name = root.name;
  merged.position.copy(root.position);
  merged.quaternion.copy(root.quaternion);
  merged.scale.copy(root.scale);

  for (const bucket of buckets.values()) {
    // `mergeGeometries` exige des géométries homogènes : toutes indexées, ou aucune.
    const allIndexed = bucket.geometries.every((geometry) => geometry.index !== null);
    const parts = allIndexed
      ? bucket.geometries
      : bucket.geometries.map((geometry) => (geometry.index ? geometry.toNonIndexed() : geometry));

    const mesh = new THREE.Mesh(mergeGeometries(parts, false), bucket.material);
    mesh.castShadow = bucket.castShadow;
    mesh.receiveShadow = bucket.receiveShadow;
    merged.add(mesh);

    for (const geometry of new Set([...bucket.geometries, ...parts])) geometry.dispose();
  }

  return merged;
}
