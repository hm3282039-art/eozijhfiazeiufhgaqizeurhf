import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { clamp, damp } from '../utils/math.js';

const CONFIG = GAME_CONFIG.camera;

/**
 * Champ de vision vertical adapté à la forme de la fenêtre. Sur une fenêtre étroite ou en
 * portrait, on l'élargit pour conserver le champ horizontal : le joueur et ses pets restent
 * entièrement visibles au lieu d'être rognés sur les côtés.
 */
function fovForAspect(aspect) {
  if (aspect >= CONFIG.fovReferenceAspect) return CONFIG.fov;
  const halfHorizontal = Math.tan(THREE.MathUtils.degToRad(CONFIG.fov / 2)) * CONFIG.fovReferenceAspect;
  const fov = THREE.MathUtils.radToDeg(2 * Math.atan(halfHorizontal / aspect));
  return Math.min(fov, CONFIG.maxFov);
}

/**
 * Caméra 3ème personne façon Roblox, pilotée par OrbitControls :
 *  - clic (gauche ou droit) maintenu + glisser : tourner autour du joueur ;
 *  - molette : zoomer / dézoomer ;
 *  - la caméra suit le joueur en douceur.
 *
 * OrbitControls pilote une caméra « logique » (`#rig`). La caméra réellement utilisée
 * pour le rendu (`camera`) la recopie en lissant la distance, ce qui donne un zoom fluide
 * au lieu d'à-coups à chaque cran de molette.
 */
export class ThirdPersonCamera {
  #rig;
  #controls;
  #target = new THREE.Vector3();
  #distance = CONFIG.startDistance;
  #forward = { x: 0, z: -1 };
  #offset = new THREE.Vector3();
  #delta = new THREE.Vector3();

  /** @param {HTMLElement} domElement élément qui reçoit la souris (le canvas) */
  constructor(domElement) {
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(CONFIG.fov, aspect, CONFIG.near, CONFIG.far);
    this.camera.name = 'MainCamera';
    this.#rig = this.camera.clone();

    const controls = new OrbitControls(this.#rig, domElement);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = CONFIG.damping;
    controls.rotateSpeed = CONFIG.rotateSpeed;
    controls.zoomSpeed = CONFIG.zoomSpeed;
    controls.minDistance = CONFIG.minDistance;
    controls.maxDistance = CONFIG.maxDistance;
    controls.minPolarAngle = CONFIG.minPolar;
    controls.maxPolarAngle = CONFIG.maxPolar;
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.ROTATE,
    };
    controls.addEventListener('start', () => domElement.classList.add('is-dragging'));
    controls.addEventListener('end', () => domElement.classList.remove('is-dragging'));
    this.#controls = controls;
  }

  /**
   * Place immédiatement la caméra autour d'un point (spawn, téléportation).
   *
   * @param {THREE.Vector3} focus point visé
   * @param {{ azimuth?: number, polar?: number, distance?: number } | null} [view]
   *   angle de vue à adopter (voir `GAME_CONFIG.camera.start*`) ; `null` conserve l'angle actuel
   */
  snapTo(focus, view = null) {
    if (view) {
      const distance = clamp(view.distance ?? this.#distance, CONFIG.minDistance, CONFIG.maxDistance);
      const polar = clamp(view.polar ?? CONFIG.startPolar, CONFIG.minPolar, CONFIG.maxPolar);
      this.#offset.setFromSphericalCoords(distance, polar, view.azimuth ?? CONFIG.startAzimuth);
      this.#distance = distance;
    } else {
      this.#offset.copy(this.#rig.position).sub(this.#controls.target);
    }
    this.#target.copy(focus);
    this.#controls.target.copy(focus);
    this.#rig.position.copy(focus).add(this.#offset);
    this.#controls.update();
    this.#applyToRenderCamera();
  }

  /** Angle de vue du lancement. */
  static get startView() {
    return { azimuth: CONFIG.startAzimuth, polar: CONFIG.startPolar, distance: CONFIG.startDistance };
  }

  /**
   * @param {number} dt
   * @param {THREE.Vector3} focus point à viser (tête du joueur)
   */
  update(dt, focus) {
    // 1. Le point visé rejoint le joueur en douceur (plus mollement en vertical : sauts agréables).
    this.#target.x = damp(this.#target.x, focus.x, CONFIG.followSharpness, dt);
    this.#target.z = damp(this.#target.z, focus.z, CONFIG.followSharpness, dt);
    this.#target.y = damp(this.#target.y, focus.y, CONFIG.verticalSharpness, dt);

    // 2. On translate cible + caméra du même vecteur : l'angle de vue choisi est conservé.
    this.#delta.copy(this.#target).sub(this.#controls.target);
    this.#rig.position.add(this.#delta);
    this.#controls.target.copy(this.#target);
    this.#controls.update();

    // 3. Zoom lissé.
    const distance = this.#offset.copy(this.#rig.position).sub(this.#controls.target).length();
    this.#distance = damp(this.#distance, distance, CONFIG.zoomSharpness, dt);
    this.#applyToRenderCamera();
  }

  /** Direction horizontale (normalisée) dans laquelle regarde la caméra. */
  getForward() {
    const dx = this.#controls.target.x - this.#rig.position.x;
    const dz = this.#controls.target.z - this.#rig.position.z;
    const length = Math.hypot(dx, dz);
    if (length > 1e-4) {
      this.#forward.x = dx / length;
      this.#forward.z = dz / length;
    }
    return this.#forward;
  }

  resize(aspect) {
    const fov = fovForAspect(aspect);
    for (const camera of [this.camera, this.#rig]) {
      camera.aspect = aspect;
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }

  #applyToRenderCamera() {
    this.#offset.copy(this.#rig.position).sub(this.#controls.target);
    const length = this.#offset.length() || 1;
    this.camera.position
      .copy(this.#controls.target)
      .addScaledVector(this.#offset, this.#distance / length);
    this.camera.quaternion.copy(this.#rig.quaternion);
  }
}
