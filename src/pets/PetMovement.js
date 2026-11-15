import { GAME_CONFIG } from '../config/gameConfig.js';
import { damp, dampAngle, dampFactor } from '../utils/math.js';

const CONFIG = GAME_CONFIG.pets;
const PET_RADIUS = CONFIG.radius;

/**
 * Déplacement d'un pet : il rejoint son emplacement dans la formation par interpolation
 * douce (`lerp`), contourne les obstacles et se tourne dans le sens de sa marche.
 *
 * Une image se déroule en deux temps (voir `PetManager.update`) :
 *   advance() → [les pets s'écartent les uns des autres] → finish()
 */
export class PetMovement {
  #pet;
  #collision;
  #previousX = 0;
  #previousZ = 0;

  /**
   * @param {import('./Pet.js').Pet} pet
   * @param {import('../world/physics/CollisionWorld.js').CollisionWorld} collision
   */
  constructor(pet, collision) {
    this.#pet = pet;
    this.#collision = collision;
  }

  /** Place le pet instantanément (lancement, téléportation). */
  snapTo(x, z, yaw) {
    const pet = this.#pet;
    pet.position.set(x, 0, z);
    this.#collision.resolve(pet.position, PET_RADIUS);
    pet.yaw = yaw;
    pet.speed = 0;
    pet.object3D.rotation.y = yaw;
  }

  /**
   * Phase 1 — avance vers l'emplacement visé dans la formation.
   * @param {number} dt
   * @param {{ x: number, z: number }} slot
   */
  advance(dt, slot) {
    const position = this.#pet.position;
    this.#previousX = position.x;
    this.#previousZ = position.z;

    // Interpolation fluide vers l'emplacement (indépendante du framerate)…
    const t = dampFactor(CONFIG.followSharpness, dt);
    let stepX = (slot.x - position.x) * t;
    let stepZ = (slot.z - position.z) * t;

    // … à vitesse plafonnée : un pet très en retard (demi-tour du joueur, nouvelle
    // place dans la formation) court pour revenir, mais ne « glisse » jamais d'un coup.
    const stepLength = Math.hypot(stepX, stepZ);
    const maxStep = CONFIG.maxSpeed * dt;
    if (stepLength > maxStep) {
      stepX *= maxStep / stepLength;
      stepZ *= maxStep / stepLength;
    }

    position.x += stepX;
    position.z += stepZ;
    this.#collision.resolve(position, PET_RADIUS);
  }

  /**
   * Phase 2 — une fois toutes les corrections appliquées (obstacles, autres pets),
   * mesure le déplacement réel de l'image pour en déduire la vitesse et l'orientation.
   * @param {number} dt
   * @param {number} idleYaw orientation à prendre une fois arrêté (celle du joueur)
   */
  finish(dt, idleYaw) {
    const pet = this.#pet;
    const position = pet.position;
    this.#collision.resolve(position, PET_RADIUS);

    // Vitesse réellement parcourue : c'est elle qui déclenche l'animation de saut.
    let velocityX = 0;
    let velocityZ = 0;
    if (dt > 1e-5) {
      velocityX = (position.x - this.#previousX) / dt;
      velocityZ = (position.z - this.#previousZ) / dt;
    }
    pet.speed = damp(pet.speed, Math.hypot(velocityX, velocityZ), 18, dt);

    // En marche : face à la direction du déplacement. À l'arrêt : comme le joueur.
    const isMoving = pet.speed > CONFIG.moveThreshold;
    const targetYaw = isMoving ? Math.atan2(velocityX, velocityZ) : idleYaw;
    pet.yaw = dampAngle(pet.yaw, targetYaw, isMoving ? CONFIG.turnSharpness : CONFIG.turnSharpness * 0.5, dt);
    pet.object3D.rotation.y = pet.yaw;
  }
}
