import { button, el } from '../dom.js';
import { createIcon } from '../icons.js';

/**
 * Fenêtre modale générique (panneaux Pets, Boutique, Téléportation).
 * Se ferme avec le bouton en forme de croix, la touche Échap ou un clic à l'extérieur.
 */
export class Modal {
  #onClose = null;

  /**
   * @param {{ title: string, emoji?: string, variant?: string }} options
   *   `variant` : couleur de l'en-tête (`pets`, `shop`, `teleport`)
   */
  constructor({ title, emoji = '', variant = 'default' }) {
    this.body = el('div', { class: 'modal__body' });
    this.subtitle = el('span', { class: 'modal__subtitle' });

    this.dialog = el(
      'section',
      { class: `modal modal--${variant}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title, tabindex: '-1' },
      [
        el('header', { class: 'modal__header' }, [
          el('h2', { class: 'modal__title' }, [
            emoji && el('span', { class: 'modal__emoji', text: emoji, 'aria-hidden': 'true' }),
            el('span', { text: title }),
            this.subtitle,
          ]),
          button({ class: 'modal__close', 'aria-label': 'Fermer', title: 'Fermer (Échap)', onClick: () => this.close() }, [
            createIcon('close', 'modal__close-icon'),
          ]),
        ]),
        this.body,
      ],
    );

    this.element = el('div', { class: 'modal-backdrop', hidden: true }, [this.dialog]);

    // Clic sur le fond assombri (mais pas sur la fenêtre elle-même).
    this.element.addEventListener('pointerdown', (event) => {
      if (event.target === this.element) this.close();
    });
    this.dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        this.close();
      }
    });
  }

  get isOpen() {
    return !this.element.hidden;
  }

  /** @param {{ onClose?: () => void }} [options] */
  open({ onClose = null } = {}) {
    if (this.isOpen) return;
    this.#onClose = onClose;
    this.element.hidden = false;
    this.dialog.focus({ preventScroll: true });
  }

  close() {
    if (!this.isOpen) return;
    // Masquer la fenêtre rend automatiquement le focus clavier au jeu.
    this.element.hidden = true;
    const onClose = this.#onClose;
    this.#onClose = null;
    onClose?.();
  }

  toggle(options) {
    if (this.isOpen) this.close();
    else this.open(options);
  }
}
