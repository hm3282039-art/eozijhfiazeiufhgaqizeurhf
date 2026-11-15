/** Durée maximale d'un pas de simulation (évite les « téléportations » après un onglet inactif). */
const MAX_DELTA = 1 / 20;

/**
 * Boucle de jeu basée sur requestAnimationFrame.
 * Appelle `onFrame(dt)` à chaque image, avec `dt` en secondes (borné à MAX_DELTA).
 */
export class GameLoop {
  #onFrame;
  #frameId = null;
  #lastTime = 0;

  /** @param {(dt: number) => void} onFrame */
  constructor(onFrame) {
    this.#onFrame = onFrame;
  }

  get isRunning() {
    return this.#frameId !== null;
  }

  start() {
    if (this.isRunning) return;
    this.#lastTime = performance.now();
    this.#frameId = requestAnimationFrame(this.#tick);
  }

  stop() {
    if (!this.isRunning) return;
    cancelAnimationFrame(this.#frameId);
    this.#frameId = null;
  }

  #tick = (now) => {
    const dt = Math.min(Math.max(now - this.#lastTime, 0) / 1000, MAX_DELTA);
    this.#lastTime = now;
    this.#frameId = requestAnimationFrame(this.#tick);

    try {
      this.#onFrame(dt);
    } catch (error) {
      // Une erreur dans une image ne doit pas inonder la console 60 fois par seconde.
      this.stop();
      throw error;
    }
  };
}
