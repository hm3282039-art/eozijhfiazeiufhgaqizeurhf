import { button, el } from '../dom.js';

/** Bouton « 🛠️ Admin Panel » (en haut à droite, sous la boîte d'aide). */
export class AdminButton {
  /** @param {{ onOpen: () => void }} handlers */
  constructor({ onOpen }) {
    this.element = button({ class: 'admin-button', title: 'Ouvrir le panneau Admin (F2)', onClick: onOpen }, [
      el('span', { class: 'admin-button__emoji', text: '🛠️', 'aria-hidden': 'true' }),
      el('span', { text: 'Admin Panel' }),
    ]);
  }
}
