import { clamp, damp, lerp } from '../utils/math.js';

const SWING = 0.95;
const STRIDE_RATE = 1.5; // radians de cycle par unité parcourue

/**
 * Animation procédurale de l'avatar : marche (bras et jambes qui balancent en opposition),
 * repos (respiration), saut / chute, et petit « squash » à la réception.
 */
export class PlayerAnimator {
  #joints;
  #root;
  #hipY;
  #phase = 0;
  #moveBlend = 0;
  #airBlend = 0;
  #squash = 0;
  #squashVelocity = 0;

  /** @param {ReturnType<import('./PlayerModel.js').createPlayerModel>} model */
  constructor(model) {
    this.#joints = model.joints;
    this.#root = model.root;
    this.#hipY = model.hipY;
  }

  /** Impulsion de déformation : positive = écrasement (réception), négative = étirement (saut). */
  impulse(amount) {
    this.#squashVelocity += amount;
  }

  /**
   * @param {number} dt
   * @param {{ speed: number, maxSpeed: number, grounded: boolean, verticalVelocity: number, time: number }} state
   */
  update(dt, { speed, maxSpeed, grounded, verticalVelocity, time }) {
    const { body, head, armLeft, armRight, legLeft, legRight } = this.#joints;

    this.#moveBlend = damp(this.#moveBlend, clamp(speed / maxSpeed, 0, 1), 12, dt);
    this.#airBlend = damp(this.#airBlend, grounded ? 0 : 1, 16, dt);
    this.#phase += speed * STRIDE_RATE * dt;

    const move = this.#moveBlend;
    const air = this.#airBlend;
    const ground = 1 - air;
    const swing = Math.sin(this.#phase) * SWING * move * ground;
    const breath = Math.sin(time * 1.9);
    const rising = clamp(verticalVelocity / 12, -1, 1);

    // Jambes : balancement opposé au sol, pose « en ciseaux » en l'air.
    legLeft.rotation.x = swing + air * 0.55;
    legRight.rotation.x = -swing - air * 0.4;

    // Bras : opposés aux jambes au sol, levés pendant le saut.
    const armLift = air * lerp(2.1, 2.75, (rising + 1) / 2);
    armLeft.rotation.x = -swing * 0.9 - armLift + breath * 0.03 * (1 - move);
    armRight.rotation.x = swing * 0.9 - armLift - breath * 0.03 * (1 - move);
    const armSpread = 0.07 + breath * 0.015 + air * 0.35;
    armLeft.rotation.z = -armSpread;
    armRight.rotation.z = armSpread;

    // Corps : rebond à chaque pas + légère inclinaison vers l'avant en courant.
    const bounce = Math.abs(Math.sin(this.#phase)) * 0.09 * move * ground;
    body.position.y = this.#hipY + bounce + breath * 0.012 * (1 - move);
    body.rotation.x = 0.13 * move * ground - air * 0.08 * rising;
    body.rotation.z = Math.sin(this.#phase) * 0.035 * move * ground;

    // Tête : compense l'inclinaison et regarde doucement autour d'elle au repos.
    head.rotation.x = -0.07 * move + breath * 0.012;
    head.rotation.y = Math.sin(time * 0.55) * 0.12 * (1 - move);

    // Squash & stretch (ressort amorti).
    this.#squashVelocity += (-this.#squash * 260 - this.#squashVelocity * 22) * dt;
    this.#squash += this.#squashVelocity * dt;
    const squash = clamp(this.#squash, -0.25, 0.3);
    this.#root.scale.set(1 + squash * 0.5, 1 - squash, 1 + squash * 0.5);
  }
}
