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
