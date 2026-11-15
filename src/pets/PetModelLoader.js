import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneWithSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * Chargement des modèles Blender (.glb / .gltf) pour les pets.
 * Chaque fichier n'est téléchargé qu'une fois ; chaque pet en reçoit un clone indépendant.
 */
const loader = new GLTFLoader();

/** @type {Map<string, Promise<import('three/addons/loaders/GLTFLoader.js').GLTF>>} */
const cache = new Map();

function loadGltf(url) {
  if (!cache.has(url)) {
    const promise = loader.loadAsync(url);
    // Un échec ne doit pas rester en cache : on pourra réessayer (fichier ajouté entre-temps).
    promise.catch(() => cache.delete(url));
    cache.set(url, promise);
  }
  return cache.get(url);
}

/** Choisit le clip à jouer en boucle : « Idle » s'il existe, sinon le premier. */
function pickClip(animations) {
  return animations.find((clip) => /idle/i.test(clip.name)) ?? animations[0] ?? null;
}

/**
 * Charge un modèle et le prépare pour servir de pet :
 * recentré, posé au sol, mis à l'échelle, ombres activées, animation éventuelle lancée.
 *
 * @param {string} url ex : 'assets/models/cat.glb'
 * @param {{ rotationY?: number, targetSize?: number }} [options]
 *   `rotationY` : à ajuster si le modèle ne regarde pas vers +Z une fois exporté
 * @returns {Promise<import('./Pet.js').PetVisual>} rejette si le fichier est introuvable ou invalide
 */
export async function loadPetModel(url, { rotationY = 0, targetSize = GAME_CONFIG.pets.modelTargetSize } = {}) {
  const gltf = await loadGltf(url);
  const model = cloneWithSkeleton(gltf.scene);

  model.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  // Normalisation : plus grande dimension = targetSize, centré en X/Z, pieds à y = 0.
  model.rotation.y += rotationY;
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  if (box.isEmpty()) throw new Error(`Le modèle « ${url} » ne contient aucune géométrie.`);

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = targetSize / Math.max(size.x, size.y, size.z);

  const root = new THREE.Group();
  root.name = `ModelPet(${url})`;
  model.position.sub(new THREE.Vector3(center.x, box.min.y, center.z));
  root.add(model);
  root.scale.setScalar(scale);

  // Animation embarquée dans le fichier (optionnelle).
  const clip = pickClip(gltf.animations);
  const mixer = clip ? new THREE.AnimationMixer(model) : null;
  mixer?.clipAction(clip).play();

  return {
    kind: 'model',
    object3D: root,
    height: size.y * scale,
    update: ({ dt }) => mixer?.update(dt),
    dispose() {
      mixer?.stopAllAction();
      // Les géométries et matériaux appartiennent au fichier en cache : on ne les libère pas.
    },
  };
}
