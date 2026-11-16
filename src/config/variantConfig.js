/**
 * Variantes visuelles des pets (style PS99).
 *
 * Chaque variante change l'apparence du pet ET ses dégâts :
 *   normal  : l'apparence habituelle (dégâts ×1)
 *   golden  : entièrement doré et brillant, avec des étincelles jaunes (dégâts ×3)
 *   rainbow : la couleur cycle en continu sur le spectre arc-en-ciel (dégâts ×5)
 *   huge    : 2,5× plus gros, couronne dorée sur la tête (dégâts ×2)
 *
 * @typedef {'normal' | 'golden' | 'rainbow' | 'huge'} PetVariantId
 */
export const PET_VARIANTS_VISUAL = Object.freeze({
  normal: { id: 'normal', label: 'Normal', damageMultiplier: 1, scale: 1 },
  golden: { id: 'golden', label: 'Doré', damageMultiplier: 3, scale: 1 },
  rainbow: { id: 'rainbow', label: 'Arc-en-ciel', damageMultiplier: 5, scale: 1 },
  huge: { id: 'huge', label: 'HUGE', damageMultiplier: 2, scale: 2.5 },
});

/** @param {string | undefined} id @returns {import('./variantConfig.js').PetVariantId} */
export function normalizeVariant(id) {
  return id && PET_VARIANTS_VISUAL[id] ? id : 'normal';
}
