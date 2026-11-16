import { button, el } from '../dom.js';

/**
 * Bouton « [⛶ Plein Écran] » (en haut à droite). Bascule le plein écran via
 * `document.documentElement.requestFullscreen()` / `document.exitFullscreen()`.
 * Réactif aux changements de plein écran (appels initiés par le navigateur).
 */
export class FullscreenButton {
  #button;
  #onChange;

  /** @param {{ onChange?: (isFullscreen: boolean) => void }} options */
  constructor({ onChange } = {}) {
    this.#onChange = onChange;
    this.#button = button(
      {
        class: 'fullscreen-button',
        title: 'Basculer le plein écran (F)',
        onClick: () => this.toggle(),
      },
      [
        el('span', { class: 'fullscreen-button__icon', text: '⛶', 'aria-hidden': 'true' }),
        el('span', { class: 'fullscreen-button__label', text: 'Plein Écran' }),
      ],
    );

    // Réactivité aux changements de plein écran initiés par le navigateur (F11, ESC).
    document.addEventListener('fullscreenchange', () => {
      this.#sync();
      this.#onChange?.(this.isFullscreen);
    });
    this.#sync();
  }

  get element() {
    return this.#button;
  }

  get isFullscreen() {
    return Boolean(document.fullscreenElement);
  }

  /** Bascule le plein écran. @returns {Promise<boolean>} le nouvel état */
  async toggle() {
    try {
      if (this.isFullscreen) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch (error) {
      // Le plein écran peut être refusé (sandbox, iframe) : on ne casse rien.
      console.warn('[Fullscreen] Bascule refusée :', error?.message ?? error);
    }
    return this.isFullscreen;
  }

  #sync() {
    const active = this.isFullscreen;
    this.#button.classList.toggle('is-active', active);
    this.#button.setAttribute('aria-pressed', String(active));
    const label = this.#button.querySelector('.fullscreen-button__label');
    if (label) label.textContent = active ? 'Quitter' : 'Plein Écran';
  }
}
