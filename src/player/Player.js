import * as THREE from 'three';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { BlobShadow } from '../graphics/BlobShadow.js';
import { clamp } from '../utils/math.js';
import { createPlayerModel } from './PlayerModel.js';
import { PlayerAnimator } from './PlayerAnimator.js';
import { PlayerController } from './PlayerController.js';
import { Hoverboard } from './Hoverboard.js';

/**
 * Le joueur : avatar stylisé (tête, torse, bras et jambes articulés), déplacement, saut et ombre.
 *
 * `object3D` reste toujours au niveau du sol ; la hauteur du saut est appliquée à l'avatar
 * (`altitude`), ce qui permet à l'ombre ronde de rester collée par terre.
 */
export class Player {
  /** Hauteur des pieds au-dessus du sol (0 = posé). */
  altitude = 0;
  /** Orientation autour de l'axe vertical (0 = regarde vers +Z). */
  yaw = 0;
  isGrounded = true;
  velocity = new THREE.Vector3();
  /** Multiplicateur de vitesse de déplacement (panneau Admin : curseur 1–3). */
  speedMultiplier = 1;
  /** Le hoverboard est-il activé (touche H) ? */
  hoverboardActive = false;
  /** Objet 3D du hoverboard (attaché sous l'avatar). */
  hoverboard = null;

  #model;
  #animator;
  #controller;
  #shadow;

  /**
   * @param {{
   *   input: import('../core/InputManager.js').InputManager,
   *   collision: import('../world/physics/CollisionWorld.js').CollisionWorld,
   * }} dependencies
   */
  constructor({ input, collision }) {
    this.object3D = new THREE.Group();
    this.object3D.name = 'Player';

    this.#model = createPlayerModel();
    this.object3D.add(this.#model.root);

    this.#shadow = new BlobShadow(0.95, 0.34);
    this.object3D.add(this.#shadow.mesh);

    // Hoverboard (planche volante, invisible au départ).
    this.hoverboard = new Hoverboard(this.object3D);

    this.#animator = new PlayerAnimator(this.#model);
    this.#controller = new PlayerController(this, input, collision);
  }

  /** Position au sol (x, z) — `y` vaut toujours 0, voir `altitude`. */
  get position() {
    return this.object3D.position;
  }

  /** Vitesse horizontale (unités/s). */
  get speed() {
    return Math.hypot(this.velocity.x, this.velocity.z);
  }

  /** Place instantanément le joueur (spawn, téléportation). */
  teleport(x, z, yaw = this.yaw) {
    this.position.set(x, 0, z);
    this.velocity.set(0, 0, 0);
    this.altitude = 0;
    this.isGrounded = true;
    this.yaw = yaw;
    this.#syncVisuals();
  }

  /**
   * @param {number} dt
   * @param {number} time
   * @param {{ x: number, z: number }} cameraForward direction horizontale de la caméra
   * @returns {{ touched: string | null }} ce que le joueur a heurté pendant cette image
   */
  update(dt, time, cameraForward) {
    const { jumped, landed, landingSpeed, touched } = this.#controller.update(dt, cameraForward);

    if (jumped) this.#animator.impulse(-2.6);
    if (landed) this.#animator.impulse(clamp(landingSpeed * 0.28, 1.5, 5));

    this.#animator.update(dt, {
      speed: this.speed,
      maxSpeed: GAME_CONFIG.player.walkSpeed * this.speedMultiplier,
      grounded: this.isGrounded,
      verticalVelocity: this.velocity.y,
      time,
    });

    this.hoverboard?.update(dt, time);
    this.#syncVisuals();
    return { touched };
  }

  /**
   * Active / désactive le hoverboard : vitesse ×1,8 et flottaison au-dessus du sol.
   * @param {boolean} active
   */
  setHoverboard(active) {
    this.hoverboardActive = active;
    this.hoverboard?.setActive(active);
    if (active) {
      this.speedMultiplier = GAME_CONFIG.hoverboard.speedMultiplier;
      this.altitude = GAME_CONFIG.hoverboard.floatHeight;
      this.isGrounded = false;
    } else {
      // On laisse le curseur Admin s'appliquer : on ne force plus la vitesse.
      this.altitude = 0;
      this.isGrounded = true;
    }
    this.#syncVisuals();
  }

  #syncVisuals() {
    this.#model.root.position.y = this.altitude;
    this.#model.root.rotation.y = this.yaw;
    this.#shadow.setHeight(this.altitude);
  }
}
