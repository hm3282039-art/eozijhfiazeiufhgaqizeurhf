import { CURRENCIES } from '../../economy/Wallet.js';
import { formatCompact, formatNumber } from '../../utils/format.js';
import { el, restartAnimation } from '../dom.js';
import { createIcon } from '../icons.js';

const ICON_BY_CURRENCY = { coins: 'coin', diamonds: 'diamond' };

/**
 * Compteurs de monnaie (à gauche de l'écran) : Pièces Jaunes et Diamants Bleus.
 */
export class CurrencyBar {
  /** @type {Record<string, { root: HTMLElement, value: HTMLElement }>} */
  #counters = {};

  constructor() {
    this.element = el('div', { class: 'currency-bar', role: 'status', 'aria-label': 'Monnaies' });

    for (const currency of Object.values(CURRENCIES)) {
      const value = el('span', { class: 'currency__value', text: '0' });
      const root = el('div', { class: `currency currency--${currency.id}` }, [
        createIcon(ICON_BY_CURRENCY[currency.id], 'currency__icon'),
        el('div', { class: 'currency__text' }, [
          el('span', { class: 'currency__label', text: currency.label }),
          value,
        ]),
      ]);
      this.#counters[currency.id] = { root, value };
      this.element.append(root);
    }
  }

  /**
   * @param {'coins' | 'diamonds'} currency
   * @param {number} amount
   * @param {{ animate?: boolean }} [options]
   */
  setValue(currency, amount, { animate = true } = {}) {
    const counter = this.#counters[currency];
    if (!counter) return;
    counter.value.textContent = formatCompact(amount);
    counter.root.title = `${CURRENCIES[currency].label} : ${formatNumber(amount)}`;
    if (animate) restartAnimation(counter.root, 'is-bumping');
  }
}
