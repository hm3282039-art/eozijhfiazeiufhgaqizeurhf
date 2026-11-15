import { PET_VARIANTS } from '../config/petSpecies.js';
import { SHOP_EGGS } from '../config/shopCatalog.js';

/**
 * Résultat d'un achat.
 * @typedef {{ ok: true, pet: import('../pets/Pet.js').Pet }
 *         | { ok: false, reason: 'unknown-egg' | 'team-full' | 'not-enough', missing?: number, currency?: string }} PurchaseResult
 */

/**
 * La boutique : vend des œufs contre des pièces ou des diamants et fait éclore un pet.
 */
export class Shop {
  #wallet;
  #pets;
  #getHatchPoint;

  /**
   * @param {{
   *   wallet: import('./Wallet.js').Wallet,
   *   pets: import('../pets/PetManager.js').PetManager,
   *   getHatchPoint: () => { x: number, z: number },  où le pet apparaît (position du joueur)
   * }} dependencies
   */
  constructor({ wallet, pets, getHatchPoint }) {
    this.#wallet = wallet;
    this.#pets = pets;
    this.#getHatchPoint = getHatchPoint;
  }

  get eggs() {
    return SHOP_EGGS;
  }

  /** Le joueur peut-il payer cet œuf ? */
  canAfford(egg) {
    return this.#wallet.canAfford(egg.price.currency, egg.price.amount);
  }

  /**
   * Achète un œuf et fait éclore un pet tiré au hasard dans sa liste.
   * @param {string} eggId
   * @returns {Promise<PurchaseResult>}
   */
  async buyEgg(eggId) {
    const egg = SHOP_EGGS.find((candidate) => candidate.id === eggId);
    if (!egg) return { ok: false, reason: 'unknown-egg' };
    if (this.#pets.isFull) return { ok: false, reason: 'team-full' };

    const { currency, amount } = egg.price;
    if (!this.#wallet.spend(currency, amount)) {
      return { ok: false, reason: 'not-enough', currency, missing: amount - this.#wallet.getBalance(currency) };
    }

    const variantId = egg.pool[Math.floor(Math.random() * egg.pool.length)];
    const variant = PET_VARIANTS.find((candidate) => candidate.id === variantId);
    const pet = await this.#pets.addPet(
      { species: variant.species, name: variant.name, palette: variant.palette },
      { at: this.#getHatchPoint() },
    );
    return { ok: true, pet };
  }
}
