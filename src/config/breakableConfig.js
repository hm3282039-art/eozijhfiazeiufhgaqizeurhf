/**
 * Les « Breakables » : objets à casser (coffres, tas de pièces, cristaux) qui donnent
 * du butin. Les pets les attaquent quand le joueur clique dessus.
 *
 * @typedef {object} BreakableType
 * @property {string} id
 * @property {string} name        nom affiché dans la barre de vie
 * @property {number} hp          points de vie
 * @property {{ coins?: number, diamonds?: number }} loot   butin à la destruction
 * @property {number} radius      rayon (collision visuelle + cercle d'attaque des pets)
 * @property {number} height      hauteur (pour placer la barre de vie)
 * @property {number} respawnTime délai avant réapparition (s)
 */
export const BREAKABLE_TYPES = Object.freeze({
  coinPile: {
    id: 'coin-pile',
    name: 'Tas de Pièces',
    hp: 60,
    loot: { coins: 25 },
    radius: 1.15,
    height: 1.15,
    respawnTime: 5,
  },
  chest: {
    id: 'chest',
    name: 'Coffre en Bois & Or',
    hp: 250,
    loot: { coins: 120 },
    radius: 1.25,
    height: 1.7,
    respawnTime: 5,
  },
  crystal: {
    id: 'crystal',
    name: 'Cristal de Diamants',
    hp: 350,
    loot: { diamonds: 15 },
    radius: 1.15,
    height: 2.4,
    respawnTime: 5,
  },
  bossChest: {
    id: 'boss-chest',
    name: 'Coffre Boss Géant',
    hp: 2500,
    loot: { coins: 1500, diamonds: 50 },
    radius: 2.4,
    height: 3.8,
    respawnTime: 8,
  },
});

/** Réglages du combat des pets (voir aussi `GAME_CONFIG.combat`). */
export const COMBAT = Object.freeze({
  /** Dégâts de base d'un coup de pet normal (avant multiplicateurs). */
  baseDamage: 15,
  /** Intervalle entre deux coups d'un même pet (s). */
  hitInterval: 0.5,
  /** Probabilité d'un coup critique (dégâts ×2). */
  critChance: 0.1,
  critMultiplier: 2,
  /** Distance entre le centre du Breakable et le cercle d'attaque (en plus de son rayon). */
  circleGap: 1.5,
  /** Distance à laquelle un pet est considéré « en position » pour frapper. */
  attackRange: 0.85,
});

/**
 * Emplacements des Breakables sur la carte (Zone 1 + Zone 2).
 * `bossChest` est placé par `createZone2` (au fond de la Zone 2) ; les autres sont ici.
 */
export const BREAKABLE_SPAWNS = Object.freeze([
  // ── Zone 1 ────────────────────────────────────────────────────────────────
  { type: 'coinPile', x: 10, z: 6 },
  { type: 'coinPile', x: -12, z: -2 },
  { type: 'coinPile', x: 14, z: -20 },
  { type: 'chest', x: -8, z: -14 },
  { type: 'chest', x: 12, z: 24 },
  { type: 'crystal', x: -18, z: 12 },
  { type: 'crystal', x: 18, z: -8 },
  // ── Zone 2 ────────────────────────────────────────────────────────────────
  { type: 'coinPile', x: -12, z: -55 },
  { type: 'coinPile', x: 12, z: -62 },
  { type: 'chest', x: -8, z: -70 },
  { type: 'chest', x: 10, z: -78 },
  { type: 'crystal', x: 14, z: -55 },
  { type: 'crystal', x: -16, z: -82 },
  // Coffre Boss Géant, sur son socle doré au fond de la Zone 2.
  { type: 'bossChest', x: 0, z: -88, y: 0.3 },
]);
