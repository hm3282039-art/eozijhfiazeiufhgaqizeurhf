/**
 * Mesures des pets procéduraux. Repère local du pet : origine au sol, sous le
 * centre du corps · avant = +Z · haut = +Y.
 *
 * CHAQUE espèce définit ses propres proportions (`body` dans son builder) :
 * `bodyLayout(body)` calcule la géométrie du corps + le layout du visage.
 * Le corps par défaut (`DEFAULT_BODY`) est le « guimauve carrée » partagé.
 */

/** Corps par défaut : RoundedBoxGeometry(1.2, 1.1, 1.2, 6, 0.28). */
export const DEFAULT_BODY = Object.freeze({ width: 1.2, height: 1.1, depth: 1.2, segments: 6, radius: 0.28 });

/** Espace sous le corps, occupé par les petites pattes. */
export const GROUND_CLEARANCE = 0.14;

/**
 * Décrit un corps : dimensions + layout calculé.
 * @param {Partial<{ width: number, height: number, depth: number, segments: number, radius: number }>} [spec]
 */
export function bodyLayout(spec = DEFAULT_BODY) {
  const body = { ...DEFAULT_BODY, ...spec };
  const halfWidth = body.width / 2;
  const halfDepth = body.depth / 2;
  const centerY = GROUND_CLEARANCE + body.height / 2;
  const topY = GROUND_CLEARANCE + body.height;

  // Dimensions réelles de la face avant (plate + moitié des arrondis).
  const arc = (Math.PI * body.radius) / 2;
  const faceSurface = Object.freeze({
    width: body.width - 2 * body.radius + arc,
    height: body.height - 2 * body.radius + arc,
  });

  return {
    body,
    width: body.width,
    height: body.height,
    depth: body.depth,
    segments: body.segments,
    radius: body.radius,
    halfWidth,
    halfDepth,
    centerY,
    topY,
    faceSurface,
  };
}

/** Layout du corps par défaut (conservé pour les imports existants). */
const defaultLayout = bodyLayout(DEFAULT_BODY);

export const BODY = DEFAULT_BODY;
export const BODY_CENTER_Y = defaultLayout.centerY;
export const BODY_TOP_Y = defaultLayout.topY;
export const BODY_HALF_WIDTH = defaultLayout.halfWidth;
export const BODY_HALF_DEPTH = defaultLayout.halfDepth;
export const FACE_SURFACE = defaultLayout.faceSurface;
