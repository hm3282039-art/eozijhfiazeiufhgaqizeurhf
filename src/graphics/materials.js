import * as THREE from 'three';

/**
 * Matériaux « jouet » : plastique mat légèrement satiné, sans métal.
 * C'est ce rendu doux (façon Blender / Roblox) qui donne le style PS99.
 */
const TOY_DEFAULTS = { roughness: 0.62, metalness: 0 };
/** Rendu « plastique brillant » façon PS99 : reflets nets, couleurs vibrantes. */
const GLOSSY_DEFAULTS = { roughness: 0.25, metalness: 0.1 };

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

/**
 * Matériau « Toy Glossy » PARTAGÉ : plastique brillant (roughness 0.25, metalness 0.1).
 * Utilisé pour les pets, les pièces et les coffres — le rendu vibrant de PS99.
 */
export function glossyMaterial(color, options = {}) {
  const key = `glossy|${color}|${JSON.stringify(options)}`;
  let material = cache.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({ color, ...GLOSSY_DEFAULTS, ...options });
    cache.set(key, material);
  }
  return material;
}

/** Or brillant PARTAGÉ (clearcoat) : pièces, coffres, couronnes, pets dorés. */
export function goldMaterial(options = {}) {
  const key = `gold|${JSON.stringify(options)}`;
  let material = cache.get(key);
  if (!material) {
    material = new THREE.MeshPhysicalMaterial({
      color: '#ffc93c',
      metalness: 0.55,
      roughness: 0.24,
      clearcoat: 0.85,
      clearcoatRoughness: 0.22,
      emissive: '#6a4200',
      emissiveIntensity: 0.22,
      ...options,
    });
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
