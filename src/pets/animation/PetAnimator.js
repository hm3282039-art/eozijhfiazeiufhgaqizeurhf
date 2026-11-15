import { GAME_CONFIG } from '../../config/gameConfig.js';
import { clamp, damp, lerp, smoothstep } from '../../utils/math.js';
import { createMotionPose } from './petAnimationStyles.js';

const CONFIG = GAME_CONFIG.pets;

/**
 * Anime un pet (modèle .glb ou procédural) :
 *  - en déplacement : le style d'animation choisi (par défaut le « saut de pet » :
 *    `Math.abs(Math.sin(...))` sur Y + balancement gauche/droite en rotation Z) ;
 *  - à l'arrêt : le pet se pose et respire doucement (idle) ;
 *  - clignement des yeux, apparition « pop », et animation des accessoires (queue, ailes…).
 */
export class PetAnimator {
  #pet;
  #motion = createMotionPose();
  #partPose = { dt: 0, time: 0, move: 0, hop: 0 };
  #phase;
  #timeOffset;
  #moveBlend = 0;
  #spawnTime = 0;
  #blinkTimer;
  #eyesClosed = false;

  /**
   * @param {import('../Pet.js').Pet} pet
   * @param {number} index rang du pet : décale les cycles pour que les pets ne soient pas synchronisés
   */
  constructor(pet, index = 0) {
    this.#pet = pet;
    this.#phase = index * 0.9;
    this.#timeOffset = index * 1.37;
    this.#blinkTimer = 1 + ((index * 0.73) % 1) * 3;
  }

  /** Rejoue l'animation d'apparition (le pet grossit avec un petit rebond). */
  playSpawn() {
    this.#spawnTime = 0;
    this.#pet.visualRoot.scale.setScalar(0.001);
  }

  /** Affiche immédiatement le pet à sa taille normale (pets présents dès le lancement). */
  skipSpawn() {
    this.#spawnTime = Infinity;
  }

  /**
   * @param {number} dt
   * @param {number} time temps de jeu (s)
   * @param {import('./petAnimationStyles.js').PetAnimationStyle} style
   */
  update(dt, time, style) {
    const pet = this.#pet;
    const root = pet.visualRoot;
    const motion = this.#motion;
    const localTime = time + this.#timeOffset;

    // 0 = à l'arrêt → 1 = en déplacement (transition douce, sans à-coup).
    const moving = smoothstep(CONFIG.moveThreshold * 0.5, CONFIG.moveThreshold * 1.6, pet.speed);
    this.#moveBlend = damp(this.#moveBlend, moving, moving > this.#moveBlend ? 14 : 9, dt);
    const move = this.#moveBlend;

    // ── Déplacement : style choisi ──────────────────────────────────────────
    this.#phase += dt * style.frequency;
    style.pose(motion, this.#phase, localTime);

    // ── Repos : respiration ─────────────────────────────────────────────────
    const breath = Math.sin(localTime * CONFIG.idle.breathSpeed) * CONFIG.idle.breathAmount * (1 - move);

    const lift = motion.y * move;
    const stretch = motion.stretch * move + breath;
    const spawn = this.#updateSpawn(dt);

    root.position.y = lift;
    root.rotation.set(motion.tiltX * move, motion.spinY * move, motion.tiltZ * move);
    root.scale.set(
      (1 - stretch * 0.5) * spawn,
      (1 + stretch) * spawn,
      (1 - stretch * 0.5) * spawn,
    );

    pet.shadow.setHeight(lift);
    if (pet.visual) pet.label.setHeight(pet.visual.height * spawn + lift);

    // ── Accessoires + clignement ────────────────────────────────────────────
    const pose = this.#partPose;
    pose.dt = dt;
    pose.time = localTime;
    pose.move = move;
    pose.hop = motion.hop * move;
    pet.visual?.update(pose);
    this.#updateBlink(dt);
  }

  /** Apparition : 0 → 1 avec un léger dépassement (« pop »). */
  #updateSpawn(dt) {
    if (this.#spawnTime >= 0.5) return 1;
    this.#spawnTime += dt;
    const t = clamp(this.#spawnTime / 0.5, 0, 1);
    const overshoot = 1.9;
    const eased = 1 + (overshoot + 1) * (t - 1) ** 3 + overshoot * (t - 1) ** 2; // easeOutBack
    return Math.max(eased, 0.001);
  }

  #updateBlink(dt) {
    const visual = this.#pet.visual;
    if (!visual?.setEyesClosed) return;

    this.#blinkTimer -= dt;
    if (this.#blinkTimer > 0) return;

    this.#eyesClosed = !this.#eyesClosed;
    visual.setEyesClosed(this.#eyesClosed);
    this.#blinkTimer = this.#eyesClosed
      ? CONFIG.blink.duration
      : lerp(CONFIG.blink.minDelay, CONFIG.blink.maxDelay, Math.random());
  }
}
