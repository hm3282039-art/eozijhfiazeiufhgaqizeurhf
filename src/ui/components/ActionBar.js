import { button, el, restartAnimation } from '../dom.js';

/**
 * Barre d'actions (en bas de l'écran) : gros boutons colorés façon PS99.
 *   Pets 🐾 (3/3) · Boutique 🛒 · Téléportation 🚀
 */
export class ActionBar {
  #petsCount;
  #petsButton;

  /**
   * @param {{ onPets: () => void, onShop: () => void, onTeleport: () => void }} handlers
   */
  constructor({ onPets, onShop, onTeleport }) {
    this.#petsCount = el('span', { class: 'action-btn__count', text: '(0/0)' });

    this.#petsButton = this.#createButton('pets', 'Pets', '🐾', onPets, this.#petsCount);

    this.element = el('nav', { class: 'action-bar', 'aria-label': 'Actions' }, [
      this.#petsButton,
      this.#createButton('shop', 'Boutique', '🛒', onShop),
      this.#createButton('teleport', 'Téléportation', '🚀', onTeleport),
    ]);
  }

  /** Met à jour le compteur « (équipés/possédés) » du bouton Pets. */
  setPetCount(equipped, owned) {
    const text = `(${equipped}/${owned})`;
    if (this.#petsCount.textContent === text) return;
    this.#petsCount.textContent = text;
    restartAnimation(this.#petsButton, 'is-bumping');
  }

  #createButton(variant, label, emoji, onClick, extra = null) {
    return button({ class: `action-btn action-btn--${variant}`, onClick }, [
      el('span', { class: 'action-btn__label', text: label }),
      el('span', { class: 'action-btn__emoji', text: emoji, 'aria-hidden': 'true' }),
      extra,
    ]);
  }
}
