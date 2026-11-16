import * as THREE from 'three';
import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * Crée le moteur de rendu WebGL :
 * antialiasing, ombres douces (PCFSoftShadowMap) et tone mapping ACES lumineux.
 */
export function createRenderer(canvas) {
  const { maxPixelRatio, toneMappingExposure } = GAME_CONFIG.renderer;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
  renderer.setSize(window.innerWidth, window.innerHeight, false);

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = toneMappingExposure;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  return renderer;
}

/**
 * Applique un préréglage de qualité au renderer (ombres + pixel ratio).
 *
 * Le mode « Performance FPS Max » utilise une ombre de moindre résolution et une
 * plage d'ombre réduite ; le mode « Qualité Ultra » maximise les deux. Le facteur
 * de particules est laissé au jeu (il modifie le nombre de particules actives).
 *
 * @param {THREE.WebGLRenderer} renderer
 * @param {{ shadowMapSize: number, shadowRange: number, shadows: boolean }} quality
 */
export function applyQuality(renderer, quality) {
  renderer.shadowMap.enabled = quality.shadows;
  if (quality.shadows) {
    renderer.shadowMap.needsUpdate = true;
  }
  // Le monde (éclairage) reconfigure la résolution d'ombre via `world.setQuality`.
  renderer.shadowMap.autoUpdate = true;
}
