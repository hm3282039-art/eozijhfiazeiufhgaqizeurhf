import { catSpecies } from './cat.js';
import { dogSpecies } from './dog.js';
import { dragonSpecies } from './dragon.js';

/**
 * @typedef {{ body: string, secondary: string, accent: string, cheek: string, ink: string }} PetPalette
 *
 * @typedef {object} FacePainter
 * @property {{ highlightLift?: number }} [eyes] réglages des yeux communs
 * @property {(ctx: CanvasRenderingContext2D, palette: PetPalette, state: { closed: boolean }) => void} [paintBackground]
 *   dessiné sous les yeux et les joues (museau, ventre…)
 * @property {(ctx: CanvasRenderingContext2D, palette: PetPalette, state: { closed: boolean }) => void} paintFeatures
 *   dessiné par-dessus (bouche, truffe, moustaches, sourcils…)
 *
 * @typedef {object} PartPose
 * @property {number} dt     durée de l'image (s)
 * @property {number} time   temps propre au pet (s) — décalé d'un pet à l'autre
 * @property {number} move   0 = au repos → 1 = en déplacement
 * @property {number} hop    0 = au sol → 1 = sommet du saut
 *
 * @typedef {object} SpeciesBuilder
 * @property {FacePainter} face
 * @property {(palette: PetPalette) => { objects: import('three').Object3D[], animate: (pose: PartPose) => void }} buildParts
 *   sculpte les accessoires 3D propres à l'espèce et fournit leur animation
 */

/**
 * Registre des espèces procédurales.
 * Pour ajouter une espèce : créer `species/<nom>.js` (+ son visage dans `faces/`),
 * l'enregistrer ici, puis la déclarer dans `config/petSpecies.js`.
 *
 * @type {Record<string, SpeciesBuilder>}
 */
export const SPECIES_BUILDERS = Object.freeze({
  cat: catSpecies,
  dog: dogSpecies,
  dragon: dragonSpecies,
});
