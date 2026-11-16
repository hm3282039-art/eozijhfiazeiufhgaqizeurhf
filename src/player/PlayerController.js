import { GAME_CONFIG } from '../config/gameConfig.js';
import { damp, dampAngle } from '../utils/math.js';

const CONFIG = GAME_CONFIG.player;

/**
 * Déplacement du joueur façon Roblox :
 *  - direction relative à la caméra (ZQSD / WASD / flèches) ;
 *  - rotation progressive vers la direction du mouvement ;
 *  - saut avec gravité (+ « coyote time » et mémoire de la touche pour un saut qui répond toujours).
 */
export class PlayerController {
  #player;
  #input;
  #collision;
  #move = { x: 0, y: 0 };
  #coyoteTimer = 0;
  #jumpBufferTimer = 0;

  /**
   * @param {import('./Player.js').Player} player
   * @param {import('../core/InputManager.js').InputManager} input
   * @param {import('../world/physics/CollisionWorld.js').CollisionWorld} collision
   */
  constructor(player, input, collision) {
    this.#player = player;
    this.#input = input;
    this.#collision = collision;
  }

  /**
   * @param {number} dt
   * @param {{ x: number, z: number }} cameraForward direction horizontale (normalisée) dans laquelle regarde la caméra
   * @returns {{ jumped: boolean, landed: boolean, landingSpeed: number, touched: string | null }}
   */
  update(dt, cameraForward) {
    const player = this.#player;
    const { position, velocity } = player;
    const result = { jumped: false, landed: false, landingSpeed: 0, touched: null };

    // ── Direction voulue, dans le repère de la caméra ────────────────────────
    const move = this.#input.getMoveVector(this.#move);
    const rightX = -cameraForward.z;
    const rightZ = cameraForward.x;
    const dirX = cameraForward.x * move.y + rightX * move.x;
    const dirZ = cameraForward.z * move.y + rightZ * move.x;
    const hasInput = move.x !== 0 || move.y !== 0;

    // ── Vitesse horizontale (accélération douce, plus « flottante » en l'air) ─
    const maxSpeed = CONFIG.walkSpeed * (player.speedMultiplier ?? 1);
    const acceleration = player.isGrounded ? CONFIG.groundAcceleration : CONFIG.airAcceleration;
    velocity.x = damp(velocity.x, dirX * maxSpeed, acceleration, dt);
    velocity.z = damp(velocity.z, dirZ * maxSpeed, acceleration, dt);

    // ── Rotation progressive vers la direction du mouvement ──────────────────
    if (hasInput) {
      player.yaw = dampAngle(player.yaw, Math.atan2(dirX, dirZ), CONFIG.turnSharpness, dt);
    }

    // ── Saut ─────────────────────────────────────────────────────────────────
    this.#coyoteTimer = player.isGrounded ? CONFIG.coyoteTime : this.#coyoteTimer - dt;
    // Maintenir Espace enchaîne les sauts, comme dans Roblox.
    const wantsJump = this.#input.isDown('jump') || this.#input.wasPressed('jump');
    this.#jumpBufferTimer = wantsJump ? CONFIG.jumpBufferTime : this.#jumpBufferTimer - dt;

    if (this.#jumpBufferTimer > 0 && this.#coyoteTimer > 0) {
      velocity.y = CONFIG.jumpSpeed;
      player.isGrounded = false;
      this.#coyoteTimer = 0;
      this.#jumpBufferTimer = 0;
      result.jumped = true;
    }

    // ── Gravité + intégration ────────────────────────────────────────────────
    if (!player.isGrounded) velocity.y -= CONFIG.gravity * dt;

    position.x += velocity.x * dt;
    position.z += velocity.z * dt;
    player.altitude += velocity.y * dt;

    if (player.altitude <= 0) {
      if (!player.isGrounded) {
        result.landed = true;
        result.landingSpeed = -velocity.y;
      }
      player.altitude = 0;
      velocity.y = 0;
      player.isGrounded = true;
    }

    // ── Collisions (obstacles + bords de l'île) ──────────────────────────────
    const beforeX = position.x;
    const beforeZ = position.z;
    result.touched = this.#collision.resolve(position, CONFIG.radius);

    // Si un obstacle nous a repoussés, on annule la vitesse dans cette direction
    // pour que le personnage glisse le long de l'obstacle au lieu de « pousser » dedans.
    const pushX = position.x - beforeX;
    const pushZ = position.z - beforeZ;
    const pushLength = Math.hypot(pushX, pushZ);
    if (pushLength > 1e-6) {
      const nx = pushX / pushLength;
      const nz = pushZ / pushLength;
      const into = velocity.x * nx + velocity.z * nz;
      if (into < 0) {
        velocity.x -= nx * into;
        velocity.z -= nz * into;
      }
    }

    return result;
  }
}
