/**
 * Catalogue des ŒUFS (structuré, tableaux propres).
 *
 * Trois œufs 3D placés sur des piédestaux au Spawn (Zone 1) — et aussi
 * vendables dans la Boutique. Chaque œuf définit :
 *   `pool`        espèces qu'il peut faire éclore
 *   `rarityRange` ordres de rareté min/max (voir `rarityConfig.js`)
 *   `hugeChance`  probabilité de faire éclore un HUGE (rareté spéciale)
 *
 * La « Boutique Exclusive » présente un Œuf Exclusif Cosmique et des Gamepasses.
 */

/** @typedef {object} HatchEgg
 * @property {string} id
 * @property {string} name
 * @property {string} description
 * @property {[string, string]} colors    dégradé CSS (fond → point)
 * @property {{ currency: string, amount: number }} price
 * @property {string[]} pool               espèces possibles
 * @property {[number, number]} rarityRange  ordre min / max de rareté
 * @property {number} hugeChance           probabilité d'un HUGE
 * @property {number} emoji
 */

/** Les 3 œufs du Spawn (Zone 1). */
export const HATCH_EGGS = Object.freeze([
  {
    id: 'spotted-egg',
    name: 'Œuf Tacheté',
    description: 'Blanc à pois bleus : un compagnon basique à rare.',
    colors: ['#ffffff', '#5aa9ff'],
    emoji: '🥚',
    price: { currency: 'coins', amount: 100 },
    pool: ['dog', 'cat', 'bunny', 'bear'],
    rarityRange: [1, 2], // Basic → Rare
    hugeChance: 0,
  },
  {
    id: 'forest-egg',
    name: 'Œuf Forêt',
    description: 'Vert et bois : un pet rare à legendary… avec 0,5 % de HUGE !',
    colors: ['#7a5a32', '#43c97a'],
    emoji: '🌲',
    price: { currency: 'coins', amount: 750 },
    pool: ['panda', 'axolotl', 'fox'],
    rarityRange: [2, 4], // Rare → Legendary
    hugeChance: 0.005,
  },
  {
    id: 'draconic-egg',
    name: 'Œuf Draconique',
    description: 'Rouge et or : un pet epic à mythical… avec 1 % de HUGE !',
    colors: ['#ff5a3a', '#ffc93c'],
    emoji: '🐉',
    price: { currency: 'coins', amount: 3500 },
    pool: ['dragon', 'shark', 'griffin'],
    rarityRange: [3, 5], // Epic → Mythical
    hugeChance: 0.01,
  },
]);

/** Œuf Exclusif Cosmique de la Boutique Exclusive (hautes rarités). */
export const COSMIC_EGG = Object.freeze({
  id: 'cosmic-egg',
  name: 'Œuf Exclusif Cosmique',
  description: 'Un cosmos d’étoiles : épique à secret, avec 2 % de HUGE !',
  colors: ['#3a2a6b', '#b48bff'],
  emoji: '🌌',
  price: { currency: 'diamonds', amount: 250 },
  pool: ['dragon', 'griffin', 'shark', 'axolotl', 'panda'],
  rarityRange: [3, 10], // Epic → Secret
  hugeChance: 0.02,
});

/** Tous les œufs vendus (les 3 du spawn + le cosmique). */
export const SHOP_EGGS = Object.freeze([...HATCH_EGGS, COSMIC_EGG]);

/**
 * Gamepasses de la Boutique Exclusive (activables).
 * `effect` est la clé lue par le jeu pour appliquer l'avantage.
 */
export const GAMEPASSES = Object.freeze([
  {
    id: 'vip',
    name: 'VIP',
    emoji: '👑',
    description: 'Privilèges d’or : bonus de pièces à chaque éclosion + aura royale.',
    color: '#ffd23f',
    price: { currency: 'diamonds', amount: 500 },
    effect: 'vip',
  },
  {
    id: 'auto-hatch',
    name: 'Auto-Hatch',
    emoji: '🥚',
    description: 'Les œufs du spawn éclosent instantanément, sans attendre.',
    color: '#7c4dff',
    price: { currency: 'diamonds', amount: 400 },
    effect: 'auto-hatch',
  },
  {
    id: 'super-magnet',
    name: 'Super Aimant',
    emoji: '🧲',
    description: 'Le butin est aspiré de bien plus loin.',
    color: '#27d3ee',
    price: { currency: 'diamonds', amount: 300 },
    effect: 'super-magnet',
  },
  {
    id: 'extra-pets',
    name: '+15 Pets Équipés',
    emoji: '🐾',
    description: 'Taille d’équipe augmentée de 15 pets.',
    color: '#43d17f',
    price: { currency: 'diamonds', amount: 600 },
    effect: 'extra-pets',
  },
  {
    id: 'ultra-chance',
    name: 'Ultra Chance',
    emoji: '🍀',
    description: 'Chances de rareté et de HUGE doublées à l’éclosion.',
    color: '#ff5a7a',
    price: { currency: 'diamonds', amount: 450 },
    effect: 'ultra-chance',
  },
]);
