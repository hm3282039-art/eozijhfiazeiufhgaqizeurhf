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
  }

  /**
   * @param {number} _dt
   * @param {number} _time
   * @param {THREE.Vector3} focus position du joueur
   */
  update(_dt, _time, focus) {
    if (focus) this.#follow(focus);
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
