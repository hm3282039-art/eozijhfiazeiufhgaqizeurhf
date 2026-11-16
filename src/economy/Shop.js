import { SHOP_EGGS } from '../config/eggCatalog.js';
import { PET_SPECIES } from '../config/petSpecies.js';
import { RARITIES, CLASSIC_RARITIES } from '../config/rarityConfig.js';

/**
 * Résultat d'un achat.
 * @typedef {{ ok: true, pet: import('../pets/Pet.js').Pet }} PurchaseResult
 *         | { ok: false, reason: 'unknown-egg' | 'team-full' | 'not-enough', missing?: number, currency?: string }
 */

/**
 * La boutique : vend des œufs contre des pièces ou des diamants et fait éclore un pet.
 *
 * Le tirage respecte le catalogue (`config/eggCatalog.js`) :
 *   - l'espèce est tirée au hasard dans `pool` (essentiellement uniforme) ;
 *   - la rareté est tirée parmi les raretés classiques comprises dans `rarityRange`
 *     (les chances sont pondérées pour que les hauts niveaux soient plus rares) ;
 *   - une chance `hugeChance` fait éclore un HUGE (rareté spéciale).
 */
export class Shop {
  #wallet;
  #pets;
  #getHatchPoint;
  #flags;

  /**
   * @param {{
   *   wallet: import('./Wallet.js').Wallet,
   *   pets: import('../pets/PetManager.js').PetManager,
   *   getHatchPoint: () => { x: number, z: number },  où le pet apparaît (position du joueur)
   *   flags?: { ultraChance?: boolean | (() => boolean) },  active/désactive les bonus de chance
   * }} dependencies
   */
  constructor({ wallet, pets, getHatchPoint, flags = {} }) {
    this.#wallet = wallet;
    this.#pets = pets;
    this.#getHatchPoint = getHatchPoint;
    this.#flags = flags;
  }

  get eggs() {
    return SHOP_EGGS;
  }

  /** Le joueur peut-il payer cet œuf ? */
  canAfford(egg) {
    return this.#wallet.canAfford(egg.price.currency, egg.price.amount);
  }

  /** Lit un flag (accepte une valeur booléenne ou une fonction booléenne). */
  #flag(key) {
    const value = this.#flags[key];
    return typeof value === 'function' ? value() : !!value;
  }

  /** Tirage de la rareté d'un œuf (poids décroissant vers le haut de l'échelle). */
  #rollRarity(egg) {
    const [minOrder, maxOrder] = egg.rarityRange;
    const eligible = CLASSIC_RARITIES.filter((r) => r.order >= minOrder && r.order <= maxOrder);
    // Poids : inversement de l'ordre (plus rare = plus petit poids).
    const entries = eligible.map((r) => [r, Math.max(1, maxOrder - r.order + 1)]);
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = Math.random() * total;
    for (const [rarity, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return rarity;
    }
    return eligible[eligible.length - 1];
  }

  /** Tirage complet d'un œuf : espèce + rareté (+ HUGE). */
  rollEgg(egg) {
    // Bonus « Ultra Chance » (Gamepass) : double la chance de HUGE.
    const hugeChance = egg.hugeChance * (this.#flag('ultraChance') ? 2 : 1);
    const isHuge = Math.random() < hugeChance;

    const speciesId = egg.pool[Math.floor(Math.random() * egg.pool.length)];
    if (!PET_SPECIES[speciesId]) throw new Error(`Espèce d'œuf inconnue : « ${speciesId} »`);

    const rarity = isHuge ? RARITIES.huge : this.#rollRarity(egg);

    return { species: speciesId, rarity, huge: isHuge };
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

    const { species, rarity } = this.rollEgg(egg);
    const pet = await this.#pets.addPet({ species, rarity }, { at: this.#getHatchPoint() });
    return { ok: true, pet };
  }
}
