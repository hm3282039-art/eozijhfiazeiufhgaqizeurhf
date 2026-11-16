import * as THREE from 'three';
import { PALETTE } from '../../config/palette.js';
import { GAME_CONFIG } from '../../config/gameConfig.js';

/** Direction (normalisée) allant de la scène VERS le soleil. */
export const SUN_DIRECTION = new THREE.Vector3(0.52, 0.78, 0.34).normalize();

const SUN_DISTANCE = 90;

/**
 * Éclairage du monde :
 *  - HemisphereLight (blanc / vert clair) pour une ambiance douce et colorée ;
 *  - DirectionalLight chaude (soleil) qui projette les ombres ;
 *  - une lumière d'appoint bleutée, sans ombre, pour déboucher les faces à contre-jour.
 *
 * La zone d'ombre suit le joueur et se cale sur la grille de la shadow map
 * pour que les ombres ne « scintillent » pas quand il se déplace.
 */
export class Lighting {
  #snapQuaternion = new THREE.Quaternion();
  #snapInverse = new THREE.Quaternion();
  #texelSize;
  #scratch = new THREE.Vector3();
  #target;

  constructor() {
    const { shadowMapSize, shadowRange } = GAME_CONFIG.renderer;

    this.object3D = new THREE.Group();
    this.object3D.name = 'Lighting';

    this.hemisphere = new THREE.HemisphereLight(
      PALETTE.light.hemisphereSky,
      PALETTE.light.hemisphereGround,
      1.25,
    );

    this.sun = new THREE.DirectionalLight(PALETTE.light.sun, 2.3);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.045;

    const shadowCamera = this.sun.shadow.camera;
    shadowCamera.left = -shadowRange;
    shadowCamera.right = shadowRange;
    shadowCamera.top = shadowRange;
    shadowCamera.bottom = -shadowRange;
    shadowCamera.near = 1;
    shadowCamera.far = SUN_DISTANCE * 2;
    shadowCamera.updateProjectionMatrix();

    this.fill = new THREE.DirectionalLight(PALETTE.light.fill, 0.25);
    this.fill.position.set(-SUN_DIRECTION.x, 0.45, -SUN_DIRECTION.z).multiplyScalar(40);

    this.object3D.add(this.hemisphere, this.sun, this.sun.target, this.fill);

    // Repère de la lumière (pour le calage sur les texels de la shadow map).
    const lookAt = new THREE.Matrix4().lookAt(SUN_DIRECTION, new THREE.Vector3(), new THREE.Vector3(0, 1, 0));
    this.#snapQuaternion.setFromRotationMatrix(lookAt);
    this.#snapInverse.copy(this.#snapQuaternion).invert();
    this.#texelSize = (shadowRange * 2) / shadowMapSize;

    this.#follow(new THREE.Vector3());

    /** Ambiance visée et valeurs actuelles (glissement doux dans `update`). */
    this.#target = {
      sunColor: new THREE.Color(PALETTE.moods.day.sun),
      sunIntensity: PALETTE.moods.day.sunIntensity,
      hemisphereSky: new THREE.Color(PALETTE.moods.day.hemisphereSky),
      hemisphereGround: new THREE.Color(PALETTE.moods.day.hemisphereGround),
      hemisphereIntensity: PALETTE.moods.day.hemisphereIntensity,
      fillColor: new THREE.Color(PALETTE.moods.day.fill),
      fillIntensity: PALETTE.moods.day.fillIntensity,
    };
  }

  /** Bascule l'ambiance (jour / coucher de soleil doré). */
  setMood(mood) {
    const palette = PALETTE.moods[mood] ?? PALETTE.moods.day;
    this.#target.sunColor.set(palette.sun);
    this.#target.sunIntensity = palette.sunIntensity;
    this.#target.hemisphereSky.set(palette.hemisphereSky);
    this.#target.hemisphereGround.set(palette.hemisphereGround);
    this.#target.hemisphereIntensity = palette.hemisphereIntensity;
    this.#target.fillColor.set(palette.fill);
    this.#target.fillIntensity = palette.fillIntensity;
  }

  /**
   * Applique un préréglage de qualité à l'éclairage (ombres + résolution d'ombre).
   * Rappelle cette méthode au changement de qualité pour que l'ombre suive.
   * @param {{ shadowMapSize: number, shadowRange: number, shadows: boolean }} quality
   */
  setQuality(quality) {
    this.sun.castShadow = quality.shadows;
    this.sun.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
    const shadowCamera = this.sun.shadow.camera;
    shadowCamera.left = -quality.shadowRange;
    shadowCamera.right = quality.shadowRange;
    shadowCamera.top = quality.shadowRange;
    shadowCamera.bottom = -quality.shadowRange;
    shadowCamera.updateProjectionMatrix();
    // Récalcule la taille du texel pour que l'ombre reste « stable » au mouvement.
    this.#texelSize = (quality.shadowRange * 2) / quality.shadowMapSize;
    this.sun.shadow.map?.dispose?.();
    this.sun.shadow.map = null;
    this.sun.shadow.matrixWorldNeedsUpdate = true;
  }

  /**
   * @param {number} dt
   * @param {number} _time
   * @param {THREE.Vector3} focus position du joueur
   */
  update(dt, _time, focus) {
    if (focus) this.#follow(focus);

    // Glissement doux vers l'ambiance visée.
    const t = Math.min(1, dt * 1.6);
    this.sun.color.lerp(this.#target.sunColor, t);
    this.sun.intensity += (this.#target.sunIntensity - this.sun.intensity) * t;
    this.hemisphere.color.lerp(this.#target.hemisphereSky, t);
    this.hemisphere.groundColor.lerp(this.#target.hemisphereGround, t);
    this.hemisphere.intensity += (this.#target.hemisphereIntensity - this.hemisphere.intensity) * t;
    this.fill.color.lerp(this.#target.fillColor, t);
    this.fill.intensity += (this.#target.fillIntensity - this.fill.intensity) * t;
  }

  #follow(focus) {
    const point = this.#scratch.set(focus.x, 0, focus.z).applyQuaternion(this.#snapInverse);
    point.x = Math.round(point.x / this.#texelSize) * this.#texelSize;
    point.y = Math.round(point.y / this.#texelSize) * this.#texelSize;
    point.applyQuaternion(this.#snapQuaternion);

    this.sun.target.position.copy(point);
    this.sun.position.copy(point).addScaledVector(SUN_DIRECTION, SUN_DISTANCE);
  }
}
