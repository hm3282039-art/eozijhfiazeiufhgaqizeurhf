import * as THREE from 'three';

/**
 * Matériaux « jouet » : plastique mat légèrement satiné, sans métal.
 * C'est ce rendu doux (façon Blender / Roblox) qui donne le style PS99.
 */
const TOY_DEFAULTS = { roughness: 0.62, metalness: 0 };

const cache = new Map();

/**
 * Matériau jouet PARTAGÉ (mis en cache par couleur + options).
 * Ne jamais modifier le matériau retourné : il est utilisé par plusieurs objets.
 */
export function toyMaterial(color, options = {}) {
  const key = `${color}|${JSON.stringify(options)}`;
  let material = cache.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, ...TOY_DEFAULTS, ...options });
    cache.set(key, material);
  }
  return material;
}

/** Matériau jouet UNIQUE (non partagé) : pour les textures ou les propriétés animées. */
export function createToyMaterial(parameters = {}) {
  return new THREE.MeshStandardMaterial({ ...TOY_DEFAULTS, ...parameters });
}

/** Matériau « lumineux » non éclairé (lasers, halos, étincelles). */
export function glowMaterial(color, options = {}) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    fog: false,
    ...options,
  });
}
