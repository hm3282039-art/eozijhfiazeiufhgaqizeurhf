/**
 * Les « Breakables » : objets à casser (coffres, tas de pièces, cristaux) qui donnent
 * du butin. Les pets les attaquent quand le joueur clique dessus.
 *
 * Les types définissent le rendu (via `Breakable.js`) + les stats DE BASE.
 * Le plan de spawn (`BREAKABLE_SPAWNS`) peut surcharger hp / loot / zone pour
 * équilibrer la difficulté et les gains selon la zone :
 *   Zone 1 : 50–150 PV → 15–50 pièces
 *   Zone 2 : 400–1200 PV → 150–500 pièces
 *   Zone 3 : 3000–8000 PV → 1200–4000 pièces + diamants
 *
 * @typedef {object} BreakableType
 * @property {string} id
 * @property {string} name        nom affiché dans la barre de vie
 * @property {number} hp          points de vie (base)
 * @property {{ coins?: number, diamonds?: number }} loot   butin (base)
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
 * Emplacements des Breakables sur la carte, par zone.
 * Chaque spawn peut surcharger `hp` / `loot` pour l'équilibrage.
 * Le Coffre Boss n'est PAS placé en Zone 2 : il reste disponible via
 * `spawnBossChest()` (Admin Panel) et la fonction est conservée.
 */
export const BREAKABLE_SPAWNS = Object.freeze([
  // ── Zone 1 : faciles à casser (50–150 PV → 15–50 pièces) ────────────────
  { type: 'coinPile', x: 10, z: 6, zone: 1, hp: 50, loot: { coins: 25 } },
  { type: 'coinPile', x: -12, z: -2, zone: 1, hp: 50, loot: { coins: 30 } },
  { type: 'coinPile', x: 14, z: -20, zone: 1, hp: 60, loot: { coins: 35 } },
  { type: 'chest', x: -8, z: -14, zone: 1, hp: 120, loot: { coins: 40 } },
  { type: 'chest', x: 12, z: 24, zone: 1, hp: 150, loot: { coins: 50 } },
  { type: 'crystal', x: -18, z: 12, zone: 1, hp: 150, loot: { diamonds: 8 } },
  { type: 'crystal', x: 18, z: -8, zone: 1, hp: 150, loot: { diamonds: 10 } },

  // ── Zone 2 : plus durs (400–1200 PV → 150–500 pièces) ───────────────────
  { type: 'coinPile', x: -12, z: -55, zone: 2, hp: 400, loot: { coins: 150 } },
  { type: 'coinPile', x: 12, z: -62, zone: 2, hp: 450, loot: { coins: 180 } },
  { type: 'chest', x: -8, z: -70, zone: 2, hp: 900, loot: { coins: 400 } },
  { type: 'chest', x: 10, z: -78, zone: 2, hp: 1200, loot: { coins: 500 } },
  { type: 'crystal', x: 14, z: -55, zone: 2, hp: 800, loot: { diamonds: 20 } },
  { type: 'crystal', x: -16, z: -82, zone: 2, hp: 1000, loot: { diamonds: 25 } },

  // ── Zone 3 : très résistants (3000–8000 PV → 1200–4000 pièces + diamants) ─
  { type: 'coinPile', x: -10, z: -118, zone: 3, hp: 3000, loot: { coins: 1200 } },
  { type: 'coinPile', x: 12, z: -128, zone: 3, hp: 3500, loot: { coins: 1600 } },
  { type: 'chest', x: -16, z: -138, zone: 3, hp: 6000, loot: { coins: 2800, diamonds: 30 } },
  { type: 'chest', x: 16, z: -144, zone: 3, hp: 8000, loot: { coins: 4000, diamonds: 45 } },
  { type: 'crystal', x: -6, z: -140, zone: 3, hp: 5000, loot: { diamonds: 60 } },
  { type: 'crystal', x: 8, z: -116, zone: 3, hp: 5500, loot: { diamonds: 70 } },
]);
