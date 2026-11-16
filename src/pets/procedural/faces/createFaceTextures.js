import { GAME_CONFIG } from '../../../config/gameConfig.js';
import { canvasToTexture, createCanvas } from '../../../graphics/canvas.js';
import { paintCheeks, paintEyes } from './commonFeatures.js';
import { FACE } from './faceLayout.js';

/** Deux pets identiques (même espèce, même palette) partagent leurs textures. */
const cache = new Map();

/**
 * Dessine un visage complet sur un canvas haute résolution.
 * Ordre des calques : fond uni → fond d'espèce (museau, ventre) → joues → yeux → traits d'espèce.
 */
function paintFace(painter, palette, { width, closed }) {
  const scale = width / FACE.width;
  const { canvas, ctx } = createCanvas(width, FACE.height * scale);
  ctx.scale(scale, scale);

  // Le fond a exactement la couleur du corps : la jonction avec les autres faces est invisible.
  ctx.fillStyle = palette.body;
  ctx.fillRect(0, 0, FACE.width, FACE.height + 2);

  painter.paintBackground?.(ctx, palette, { closed });
  paintCheeks(ctx, palette.cheek);
  paintEyes(ctx, { ink: palette.ink, closed, ...painter.eyes });
  painter.paintFeatures(ctx, palette, { closed });

  return canvasToTexture(canvas, { anisotropy: 8 });
}

/**
 * Dessine une texture de visage NON mise en cache (pour les pets « Rainbow », dont la
 * couleur change en continu : la texture est redessinée au fil des teintes).
 * @param {import('../species/index.js').FacePainter} painter
 * @param {import('../species/index.js').PetPalette} palette
 * @param {{ width?: number, closed?: boolean }} [options]
 */
export function paintFaceTexture(painter, palette, { width = GAME_CONFIG.pets.faceTextureWidth, closed = false } = {}) {
  return paintFace(painter, palette, { width, closed });
}

/**
 * Crée (ou réutilise) les textures de visage d'un pet.
 *
 * @param {string} key identifiant de l'espèce (pour le cache)
 * @param {import('../species/index.js').FacePainter} painter
 * @param {import('../species/index.js').PetPalette} palette
 * @returns {{ open: THREE.CanvasTexture, closed: THREE.CanvasTexture }} yeux ouverts / yeux fermés
 */
export function createFaceTextures(key, painter, palette) {
  const cacheKey = `${key}|${JSON.stringify(palette)}`;
  let textures = cache.get(cacheKey);
  if (!textures) {
    const width = GAME_CONFIG.pets.faceTextureWidth;
    textures = {
      open: paintFace(painter, palette, { width, closed: false }),
      // Affichée ~0,1 s pendant un clignement : une résolution réduite suffit.
      closed: paintFace(painter, palette, { width: width / 2, closed: true }),
    };
    cache.set(cacheKey, textures);
  }
  return textures;
}
