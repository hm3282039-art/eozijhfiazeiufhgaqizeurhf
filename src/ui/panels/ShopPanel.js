import { CURRENCIES } from '../../economy/Wallet.js';
import { formatNumber } from '../../utils/format.js';
import { Modal } from '../components/Modal.js';
import { button, el } from '../dom.js';
import { createIcon } from '../icons.js';
import { GAMEPASSES } from '../../config/eggCatalog.js';

const ICON_BY_CURRENCY = { coins: 'coin', diamonds: 'diamond' };

/**
 * Panneau « Boutique Exclusive » : achat d'œufs (coins / diamants) + activation de
 * gamepasses premium. Style PS99 : fond sombre, œufs colorés, boutons clairs.
 */
export class ShopPanel extends Modal {
  #shop;
  #onBuy;
  #onActivate;
  #hasGamepass;
  /** @type {{ egg: object, buyButton: HTMLButtonElement, status: HTMLElement }[]} */
  #eggRows = [];
  /** @type {{ pass: object, buyButton: HTMLButtonElement, status: HTMLElement }[]} */
  #passRows = [];

  /**
   * @param {{
   *   shop: import('../../economy/Shop.js').Shop,
   *   onBuy: (egg: object) => void,
   *   onActivate: (gamepass: object) => void,
   *   hasGamepass: (id: string) => boolean,
   * }} options
   */
  constructor({ shop, onBuy, onActivate, hasGamepass }) {
    super({ title: 'Boutique Exclusive', emoji: '🛒', variant: 'shop' });
    this.#shop = shop;
    this.#onBuy = onBuy;
    this.#onActivate = onActivate;
    this.#hasGamepass = hasGamepass;

    this.body.append(
      this.#section('🥚 Œufs', this.#eggSection()),
      this.#section('🎫 Gamepasses', this.#passSection()),
    );
  }

  open(options) {
    this.refresh();
    super.open(options);
  }

  /** Met à jour l'état des boutons d'achat selon le solde du joueur. */
  refresh() {
    for (const { egg, buyButton, status } of this.#eggRows) {
      const affordable = this.#shop.canAfford(egg);
      buyButton.disabled = !affordable;
      status.textContent = affordable ? '' : `Pas assez de ${CURRENCIES[egg.price.currency].shortLabel}`;
    }
    for (const { pass, buyButton, status } of this.#passRows) {
      const owned = this.#hasGamepass(pass.id);
      const affordable = this.#shop.canAfford(pass);
      buyButton.disabled = owned || !affordable;
      status.textContent = owned ? '✅ Activé' : affordable ? '' : `Pas assez de ${CURRENCIES[pass.price.currency].shortLabel}`;
    }
  }

  #section(title, content) {
    return el('section', { class: 'shop-section' }, [
      el('h3', { class: 'shop-section__title', text: title }),
      content,
    ]);
  }

  #eggSection() {
    const list = el('ul', { class: 'shop-list' }, this.#shop.eggs.map((egg) => this.#createEggRow(egg)));
    return list;
  }

  #passSection() {
    const list = el('ul', { class: 'shop-list shop-list--passes' }, GAMEPASSES.map((pass) => this.#createPassRow(pass)));
    return list;
  }

  #createEggRow(egg) {
    const status = el('span', { class: 'shop-item__status' });
    const buyButton = button({ class: 'price-btn', onClick: () => this.#onBuy(egg) }, [
      createIcon(ICON_BY_CURRENCY[egg.price.currency], 'price-btn__icon'),
      el('span', { text: formatNumber(egg.price.amount) }),
    ]);
    this.#eggRows.push({ egg, buyButton, status });

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

  #createPassRow(pass) {
    const status = el('span', { class: 'shop-item__status' });
    const buyButton = button({ class: 'price-btn', onClick: () => this.#onActivate(pass) }, [
      createIcon(ICON_BY_CURRENCY[pass.price.currency], 'price-btn__icon'),
      el('span', { text: formatNumber(pass.price.amount) }),
    ]);
    this.#passRows.push({ pass, buyButton, status });

    return el('li', { class: 'shop-item shop-item--pass' }, [
      el('div', {
        class: 'shop-item__pass',
        'aria-hidden': 'true',
        style: { background: `linear-gradient(160deg, ${pass.color}, rgba(0,0,0,0.35))` },
        text: pass.emoji,
      }),
      el('div', { class: 'shop-item__info' }, [
        el('span', { class: 'shop-item__name', text: pass.name }),
        el('span', { class: 'shop-item__description', text: pass.description }),
        status,
      ]),
      buyButton,
    ]);
  }
}
