import { el } from '../dom.js';

const MAX_VISIBLE = 3;
const DEFAULT_DURATION = 2600;
const EXIT_DURATION = 250;

/**
 * Notifications éphémères (« toasts ») affichées en haut de l'écran.
 */
export class ToastManager {
  /** Dernier affichage de chaque message « anti-répétition ». @type {Map<string, number>} */
  #lastShown = new Map();

  constructor() {
    this.element = el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
  }

  /**
   * @param {string} message
   * @param {{
   *   variant?: 'info' | 'success' | 'warning',
   *   icon?: string,
   *   duration?: number,
   *   key?: string,       identifiant anti-répétition
   *   cooldown?: number,  délai minimal (ms) entre deux toasts de même `key`
   * }} [options]
   */
  show(message, { variant = 'info', icon = '', duration = DEFAULT_DURATION, key = null, cooldown = 0 } = {}) {
    if (key) {
      const now = performance.now();
      if (now - (this.#lastShown.get(key) ?? -Infinity) < cooldown) return;
      this.#lastShown.set(key, now);
    }

    const toast = el('div', { class: `toast toast--${variant}` }, [
      icon && el('span', { class: 'toast__icon', text: icon, 'aria-hidden': 'true' }),
      el('span', { class: 'toast__message', text: message }),
    ]);
    this.element.append(toast);

    // Jamais plus de MAX_VISIBLE toasts : les plus anciens partent en premier.
    const visible = [...this.element.children].filter((child) => !child.classList.contains('is-leaving'));
    visible.slice(0, Math.max(0, visible.length - MAX_VISIBLE)).forEach((old) => this.#dismiss(old));

    setTimeout(() => this.#dismiss(toast), duration);
  }

  #dismiss(toast) {
    if (!toast.isConnected || toast.classList.contains('is-leaving')) return;
    toast.classList.add('is-leaving');
    setTimeout(() => toast.remove(), EXIT_DURATION);
  }
}
