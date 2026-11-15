/**
 * Mesures communes à tous les pets procéduraux.
 * Repère local du pet : origine au sol, sous le centre du corps · avant = +Z · haut = +Y.
 */

/** Le corps « guimauve carrée » : RoundedBoxGeometry(1.2, 1.1, 1.2, 6, 0.28). */
export const BODY = Object.freeze({ width: 1.2, height: 1.1, depth: 1.2, segments: 6, radius: 0.28 });

/** Espace sous le corps, occupé par les petites pattes. */
export const GROUND_CLEARANCE = 0.14;

export const BODY_CENTER_Y = GROUND_CLEARANCE + BODY.height / 2;
export const BODY_TOP_Y = GROUND_CLEARANCE + BODY.height;
export const BODY_HALF_WIDTH = BODY.width / 2;
export const BODY_HALF_DEPTH = BODY.depth / 2;

/**
 * Dimensions réelles (mesurées le long de la surface) de la face avant du corps.
 * RoundedBoxGeometry étale les UV de 0 à 1 sur la partie plate + la moitié de chaque arrondi :
 * on dessine donc le visage sur un canvas de mêmes proportions pour que rien ne soit déformé.
 */
const ARC = (Math.PI * BODY.radius) / 2;
export const FACE_SURFACE = Object.freeze({
  width: BODY.width - 2 * BODY.radius + ARC,
  height: BODY.height - 2 * BODY.radius + ARC,
});
