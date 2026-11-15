import { CURRENCIES } from '../../economy/Wallet.js';
import { formatNumber } from '../../utils/format.js';
import { Modal } from '../components/Modal.js';
import { button, el } from '../dom.js';
import { createIcon } from '../icons.js';

const ICON_BY_CURRENCY = { coins: 'coin', diamonds: 'diamond' };

/**
 * Panneau « Boutique » : achat d'œufs contre des pièces ou des diamants.
 */
export class ShopPanel extends Modal {
  #shop;
  #onBuy;
  /** @type {{ egg: object, buyButton: HTMLButtonElement, status: HTMLElement }[]} */
  #rows = [];

  /**
   * @param {{
   *   shop: import('../../economy/Shop.js').Shop,
   *   onBuy: (egg: object) => void,
   * }} options
   */
  constructor({ shop, onBuy }) {
    super({ title: 'Boutique', emoji: '🛒', variant: 'shop' });
    this.#shop = shop;
    this.#onBuy = onBuy;

    const list = el('ul', { class: 'shop-list' }, shop.eggs.map((egg) => this.#createRow(egg)));
    this.body.append(
      list,
      el('p', {
        class: 'modal__hint',
        text: 'Les pièces et les diamants se gagneront dans les prochaines zones. Reviens vite !',
      }),
    );
  }

  open(options) {
    this.refresh();
    super.open(options);
  }

  /** Met à jour l'état des boutons d'achat selon le solde du joueur. */
  refresh() {
    for (const { egg, buyButton, status } of this.#rows) {
      const affordable = this.#shop.canAfford(egg);
      buyButton.disabled = !affordable;
      status.textContent = affordable ? '' : `Pas assez de ${CURRENCIES[egg.price.currency].shortLabel}`;
    }
  }

  #createRow(egg) {
    const status = el('span', { class: 'shop-item__status' });
    const buyButton = button({ class: 'price-btn', onClick: () => this.#onBuy(egg) }, [
      createIcon(ICON_BY_CURRENCY[egg.price.currency], 'price-btn__icon'),
      el('span', { text: formatNumber(egg.price.amount) }),
    ]);
    this.#rows.push({ egg, buyButton, status });

    return el('li', { class: 'shop-item' }, [
      el('div', {
        class: 'shop-item__egg',
        'aria-hidden': 'true',
        style: { background: `linear-gradient(160deg, ${egg.colors[0]}, ${egg.colors[1]})` },
      }),
      el('div', { class: 'shop-item__info' }, [
        el('span', { class: 'shop-item__name', text: egg.name }),
        el('span', { class: 'shop-item__description', text: egg.description }),
        status,
      ]),
      buyButton,
    ]);
  }
}
