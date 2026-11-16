import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneWithSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { goldMaterial } from '../graphics/materials.js';
import { SparkleCloud } from '../graphics/SparkleCloud.js';
import { createCrown } from './procedural/parts/crown.js';
import { PET_VARIANTS_VISUAL } from '../config/variantConfig.js';

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
 * @param {{ rotationY?: number, targetSize?: number, variant?: string }} [options]
 *   `rotationY` : à ajuster si le modèle ne regarde pas vers +Z une fois exporté
 *   `variant`   : 'normal' | 'golden' | 'rainbow' | 'huge' (voir `config/variantConfig.js`)
 * @returns {Promise<import('./Pet.js').PetVisual>} rejette si le fichier est introuvable ou invalide
 */
export async function loadPetModel(url, { rotationY = 0, targetSize = GAME_CONFIG.pets.modelTargetSize, variant = 'normal' } = {}) {
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

  // ── Variantes ──────────────────────────────────────────────────────────────
  const isGolden = variant === 'golden';
  const isRainbow = variant === 'rainbow';
  const isHuge = variant === 'huge';
  let sparkles = null;
  /** @type {{ material: THREE.Material, hue: number, saturation: number, lightness: number }[]} */
  const rainbowMaterials = [];

  if (isGolden) {
    // Entièrement doré (les matériaux du fichier sont partagés : on les remplace, sans les modifier).
    model.traverse((node) => {
      if (node.isMesh) node.material = goldMaterial();
    });
    sparkles = new SparkleCloud({ count: 16, radius: 0.85, height: 2.4, size: 0.2, colors: ['#ffd94d', '#fff3b0', '#ffb81f'] });
    sparkles.object3D.position.y = 0.2;
    root.add(sparkles.object3D);
  }

  if (isRainbow) {
    // Matériaux clonés pour pouvoir cycler les couleurs sans toucher les autres clones du modèle.
    const color = new THREE.Color();
    model.traverse((node) => {
      if (!node.isMesh) return;
      node.material = Array.isArray(node.material) ? node.material.map((m) => m.clone()) : node.material.clone();
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        if (!material.color) continue;
        color.set(material.color);
        const hsl = {};
        color.getHSL(hsl);
        rainbowMaterials.push({ material, hue: hsl.h, saturation: hsl.s, lightness: hsl.l });
      }
    });
  }

  if (isHuge) {
    const crown = createCrown().object3D;
    crown.position.y = size.y; // sommet du modèle normalisé (avant le ×2,5)
    crown.scale.setScalar(1.4);
    root.add(crown);
    root.scale.multiplyScalar(PET_VARIANTS_VISUAL.huge.scale);
  }

  // Animation embarquée dans le fichier (optionnelle).
  const clip = pickClip(gltf.animations);
  const mixer = clip ? new THREE.AnimationMixer(model) : null;
  mixer?.clipAction(clip).play();

  return {
    kind: 'model',
    object3D: root,
    height: size.y * scale * (isHuge ? PET_VARIANTS_VISUAL.huge.scale : 1),
    update: ({ dt }) => mixer?.update(dt),
    updateVariant(dt, time) {
      if (sparkles) sparkles.update(dt, time);
      if (isRainbow) {
        const hue = (time * 0.22) % 1;
        for (const entry of rainbowMaterials) {
          entry.material.color.setHSL((hue + entry.hue) % 1, entry.saturation, entry.lightness);
        }
      }
    },
    dispose() {
      mixer?.stopAllAction();
      for (const entry of rainbowMaterials) entry.material.dispose();
      sparkles?.dispose();
      // Les géométries et matériaux d'origine appartiennent au fichier en cache : on ne les libère pas.
    },
  };
}
