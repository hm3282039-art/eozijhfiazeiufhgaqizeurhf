/**
 * Raretés OFFICIELLES de Pet Simulator 99 (PS99) + les trois raretés spéciales.
 *
 * L'échelle exacte PS99 avec leurs vraies couleurs et puissances :
 *   1 Basic · 2 Rare · 3 Epic · 4 Legendary · 5 Mythical · 6 Exotic ·
 *   7 Divine · 8 Superior · 9 Celestial · 10 Secret
 *   + spéciales : HUGE (2,5×) · TITANIC (4,5×) · GARGANTUAN (7×)
 *
 * `power` est le multiplicateur de dégâts lié à la rareté. `scale` (spéciales)
 * définit la taille du pet. `glow` est la couleur de l'aura / de l'éclat.
 *
 * Les VARIANTES (Normal, Doré, Arc-en-ciel, Shiny) restent des modificateurs
 * séparés qui s'appliquent SUR n'importe quelle rareté (voir `variantConfig.js`).
 */

/** @typedef {{ id: string, name: string, color: string, power: number, order: number, glow: string, scale?: number, aura?: boolean }} Rarity */

export const RARITIES = Object.freeze({
  basic: {
    id: 'basic',
    name: 'Basic',
    label: 'Basic',
    color: '#c3c9d6',
    power: 1,
    order: 1,
    glow: '#9aa3b5',
  },
  rare: {
    id: 'rare',
    name: 'Rare',
    label: 'Rare',
    color: '#43d17f',
    power: 1.5,
    order: 2,
    glow: '#2aa866',
  },
  epic: {
    id: 'epic',
    name: 'Epic',
    label: 'Epic',
    color: '#4f8dff',
    power: 2,
    order: 3,
    glow: '#3563d8',
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary',
    label: 'Legendary',
    color: '#ff9a2e',
    power: 3,
    order: 4,
    glow: '#e0790a',
    aura: true,
  },
  mythical: {
    id: 'mythical',
    name: 'Mythical',
    label: 'Mythical',
    color: '#ff5a7a',
    power: 4,
    order: 5,
    glow: '#e0345a',
    aura: true,
  },
  exotic: {
    id: 'exotic',
    name: 'Exotic',
    label: 'Exotic',
    color: '#a45cff',
    power: 5,
    order: 6,
    glow: '#8839e0',
    aura: true,
  },
  divine: {
    id: 'divine',
    name: 'Divine',
    label: 'Divine',
    color: '#ffe23a',
    power: 6,
    order: 7,
    glow: '#ffd200',
    emissive: true,
    aura: true,
  },
  superior: {
    id: 'superior',
    name: 'Superior',
    label: 'Superior',
    color: '#27d3ee',
    power: 7,
    order: 8,
    glow: '#0fb8d8',
    emissive: true,
    aura: true,
  },
  celestial: {
    id: 'celestial',
    name: 'Celestial',
    label: 'Celestial',
    color: '#7db4ff',
    power: 8,
    order: 9,
    glow: '#5a86f0',
    emissive: true,
    stellaire: true,
    aura: true,
  },
  secret: {
    id: 'secret',
    name: 'Secret',
    label: 'Secret',
    color: '#20242e',
    power: 9,
    order: 10,
    glow: '#ff2ee0',
    emissive: true,
    neon: true,
    aura: true,
  },

  // ── Raretés spéciales (taille + aura brillante) ─────────────────────────────
  huge: {
    id: 'huge',
    name: 'HUGE',
    label: 'HUGE',
    color: '#ffb43a',
    power: 2,
    order: 11,
    glow: '#ff9a1f',
    scale: 2.5,
    emissive: true,
    aura: true,
    special: true,
  },
  titanic: {
    id: 'titanic',
    name: 'TITANIC',
    label: 'TITANIC',
    color: '#ff7a3a',
    power: 3,
    order: 12,
    glow: '#ff5a1f',
    scale: 4.5,
    emissive: true,
    aura: true,
    special: true,
  },
  gargantuan: {
    id: 'gargantuan',
    name: 'GARGANTUAN',
    label: 'GARGANTUAN',
    color: '#ff4a6a',
    power: 4,
    order: 13,
    glow: '#ff2e5a',
    scale: 7,
    emissive: true,
    aura: true,
    special: true,
  },
});

/** Liste triée des raretés (Basic → GARGANTUAN), pour l'index de collection. */
export const RARITY_ORDER = Object.freeze(
  Object.values(RARITIES).sort((a, b) => a.order - b.order),
);

/** Les 10 raretés « classiques » (sans les spéciales HUGE / TITANIC / GARGANTUAN). */
export const CLASSIC_RARITIES = Object.freeze(RARITY_ORDER.filter((r) => !r.special));

/** Les trois raretés spéciales (HUGE / TITANIC / GARGANTUAN). */
export const SPECIAL_RARITIES = Object.freeze(RARITY_ORDER.filter((r) => r.special));

/** @param {string | undefined} id @returns {import('./rarityConfig.js').Rarity} */
export function normalizeRarity(id) {
  return id && RARITIES[id] ? id : 'basic';
}

/** Récupère une rareté par son identifiant (défaut : Basic). */
export function getRarity(id) {
  return RARITIES[normalizeRarity(id)];
}

/** Multiplicateur de dégâts d'une rareté. */
export function rarityPower(id) {
  return getRarity(id).power;
}
