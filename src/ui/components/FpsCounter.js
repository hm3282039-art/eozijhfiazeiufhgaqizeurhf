import { el } from '../dom.js';

/**
 * Compteur de FPS (en haut à gauche). Met à jour la valeur affichée à intervalle
 * régulier sans surcharger le rendu (rafraîchissement limité).
 */
export class FpsCounter {
  #value = 0;
  #frames = 0;
  #last = 0;
  #element;

  constructor() {
    this.#element = el('div', { class: 'fps-counter', title: 'Images par seconde' }, [
      el('span', { class: 'fps-counter__icon', text: '🎮', 'aria-hidden': 'true' }),
      el('span', { class: 'fps-counter__value', text: '— FPS' }),
    ]);
  }

  get element() {
    return this.#element;
  }

  /** Appelé à chaque image : compte les frames et rafraîchit environ 4×/s. */
  tick(now) {
    this.#frames++;
    if (this.#last === 0) {
      this.#last = now;
      return;
    }
    const elapsed = now - this.#last;
    if (elapsed < 250) return; // ~4 rafraîchissements/s

    this.#value = Math.round((this.#frames * 1000) / elapsed);
    this.#frames = 0;
    this.#last = now;

    const valueEl = this.#element.querySelector('.fps-counter__value');
    if (valueEl) {
      valueEl.textContent = `${this.#value} FPS`;
      this.#element.classList.toggle('is-low', this.#value < 30);
      this.#element.classList.toggle('is-mid', this.#value >= 30 && this.#value < 55);
    }
  }
}
