import { GAME_CONFIG } from '../config/gameConfig.js';
import { EVENTS } from '../core/EventBus.js';

/** Les monnaies du jeu. */
export const CURRENCIES = Object.freeze({
  coins: { id: 'coins', label: 'Pièces Jaunes', shortLabel: 'pièces' },
  diamonds: { id: 'diamonds', label: 'Diamants Bleus', shortLabel: 'diamants' },
});

/**
 * Porte-monnaie du joueur (pièces jaunes + diamants bleus).
 * Chaque changement émet `EVENTS.WALLET_CHANGED` : l'interface se met à jour toute seule.
 */
export class Wallet {
  #events;
  #balances;

  /** @param {import('../core/EventBus.js').EventBus} events */
  constructor(events) {
    this.#events = events;
    this.#balances = {
      coins: GAME_CONFIG.wallet.startCoins,
      diamonds: GAME_CONFIG.wallet.startDiamonds,
    };
  }

  get coins() {
    return this.#balances.coins;
  }

  get diamonds() {
    return this.#balances.diamonds;
  }

  /** @param {keyof typeof CURRENCIES} currency */
  getBalance(currency) {
    this.#assertCurrency(currency);
    return this.#balances[currency];
  }

  canAfford(currency, amount) {
    return this.getBalance(currency) >= amount;
  }

  /** Ajoute un montant (positif) à une monnaie. */
  add(currency, amount) {
    this.#assertCurrency(currency);
    if (!Number.isFinite(amount) || amount <= 0) return;
    this.#balances[currency] += Math.floor(amount);
    this.#emit(currency);
  }

  /**
   * Dépense un montant si le solde le permet.
   * @returns {boolean} `true` si le paiement a eu lieu
   */
  /** Définit directement le solde d'une monnaie (panneau Admin). */
  set(currency, amount) {
    this.#assertCurrency(currency);
    this.#balances[currency] = Math.max(0, Math.floor(amount));
    this.#emit(currency);
  }

  /** Remet les deux monnaies à zéro (panneau Admin). */
  reset() {
    this.#balances.coins = 0;
    this.#balances.diamonds = 0;
    this.#emit('coins');
    this.#emit('diamonds');
  }

  /**
   * Dépense un montant si le solde le permet.
   * @returns {boolean} `true` si le paiement a eu lieu
   */
  spend(currency, amount) {
    if (!this.canAfford(currency, amount)) return false;
    this.#balances[currency] -= amount;
    this.#emit(currency);
    return true;
  }

  #assertCurrency(currency) {
    if (!(currency in this.#balances)) throw new Error(`Monnaie inconnue : « ${currency} »`);
  }

  #emit(currency) {
    this.#events.emit(EVENTS.WALLET_CHANGED, {
      currency,
      balance: this.#balances[currency],
      coins: this.coins,
      diamonds: this.diamonds,
    });
  }
}
