/**
 * Variantes visuelles des pets — modificateurs SÉPARÉS qui s'appliquent
 * SUR n'importe quelle rareté (voir `rarityConfig.js`).
 *
 *   normal  : apparence habituelle (dégâts ×1)
 *   golden  : entièrement doré et brillant, avec des étincelles jaunes (dégâts ×3)
 *   rainbow : la couleur cycle en continu sur le spectre arc-en-ciel (dégâts ×5)
 *   shiny   : pelage très luisant avec un éclat métallique (dégâts ×1.5)
 *
 * HUGE / TITANIC / GARGANTUAN ne sont PAS des variantes : ce sont des
 * RARETÉS spéciales (taille + aura), qui se combinent avec ces variantes.
 *
 * @typedef {'normal' | 'golden' | 'rainbow' | 'shiny'} PetVariantId
 */
export const PET_VARIANTS_VISUAL = Object.freeze({
  normal: { id: 'normal', label: 'Normal', damageMultiplier: 1, scale: 1, sheen: 0 },
  golden: { id: 'golden', label: 'Doré', damageMultiplier: 3, scale: 1, sheen: 0.6 },
  rainbow: { id: 'rainbow', label: 'Arc-en-ciel', damageMultiplier: 5, scale: 1, sheen: 0.35 },
  shiny: { id: 'shiny', label: 'Shiny', damageMultiplier: 1.5, scale: 1, sheen: 1 },
});

/** @param {string | undefined} id @returns {import('./variantConfig.js').PetVariantId} */
export function normalizeVariant(id) {
  return id && PET_VARIANTS_VISUAL[id] ? id : 'normal';
}

/** @param {string} id @returns {import('./variantConfig.js').PetVariantId} */
export function getVariant(id) {
  return PET_VARIANTS_VISUAL[normalizeVariant(id)];
}
