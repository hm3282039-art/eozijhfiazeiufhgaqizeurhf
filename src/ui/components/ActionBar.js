import { button, el, restartAnimation } from '../dom.js';

/**
 * Barre d'actions (en bas de l'écran) : gros boutons colorés façon PS99.
 *   Pets 🐾 (3/3) · Boutique 🛒 · Téléportation 🚀 · Hoverboard 🛹 (H)
 */
export class ActionBar {
  #petsCount;
  #petsButton;
  #hoverboardButton;

  /**
   * @param {{ onPets: () => void, onShop: () => void, onTeleport: () => void, onHoverboard?: () => void }} handlers
   */
  constructor({ onPets, onShop, onTeleport, onHoverboard }) {
    this.#petsCount = el('span', { class: 'action-btn__count', text: '(0/0)' });

    this.#petsButton = this.#createButton('pets', 'Pets', '🐾', onPets, this.#petsCount);
    this.#hoverboardButton = this.#createButton('hoverboard', 'Hoverboard (H)', '🛹', onHoverboard ?? (() => {}));

    this.element = el('nav', { class: 'action-bar', 'aria-label': 'Actions' }, [
      this.#petsButton,
      this.#createButton('shop', 'Boutique', '🛒', onShop),
      this.#createButton('teleport', 'Téléportation', '🚀', onTeleport),
      this.#hoverboardButton,
    ]);
  }

  /** Met à jour le compteur « (équipés/possédés) » du bouton Pets. */
  setPetCount(equipped, owned) {
    const text = `(${equipped}/${owned})`;
    if (this.#petsCount.textContent === text) return;
    this.#petsCount.textContent = text;
    restartAnimation(this.#petsButton, 'is-bumping');
  }

  /** Met à jour l'état visuel du bouton Hoverboard (actif / inactif). */
  setHoverboardActive(active) {
    this.#hoverboardButton.classList.toggle('is-active', active);
    this.#hoverboardButton.setAttribute('aria-pressed', String(active));
  }

  #createButton(variant, label, emoji, onClick, extra = null) {
    return button({ class: `action-btn action-btn--${variant}`, onClick }, [
      el('span', { class: 'action-btn__label', text: label }),
      el('span', { class: 'action-btn__emoji', text: emoji, 'aria-hidden': 'true' }),
      extra,
    ]);
  }
}
