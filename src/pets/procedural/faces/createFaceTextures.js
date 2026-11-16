import { GAME_CONFIG } from '../../../config/gameConfig.js';
import { canvasToTexture, createCanvas } from '../../../graphics/canvas.js';
import { paintCheeks, paintEyes } from './commonFeatures.js';
import { FACE } from './faceLayout.js';
import { bodyLayout, DEFAULT_BODY } from '../petAnatomy.js';

/** Deux pets identiques (même espèce, même palette, même corps) partagent leurs textures. */
const cache = new Map();

/**
 * Dessine un visage complet sur un canvas haute résolution, en « contain » :
 * le dessin (conçu pour le corps par défaut) remplit le canvas sans déformation,
 * et les marges restantes sont de la couleur du corps (invisibles).
 *
 * Ordre des calques : fond uni → fond d'espèce (museau, ventre) → joues → yeux → traits d'espèce.
 *
 * @param {HTMLCanvasElement} canvas
 * @param {import('../species/index.js').FacePainter} painter
 * @param {import('../species/index.js').PetPalette} palette
 * @param {{ body?: object, closed?: boolean }} options
 */
function paintOnCanvas(canvas, painter, palette, { body = DEFAULT_BODY, closed = false } = {}) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Échelle « contain » : le dessin (1000 × FACE.height) remplit le canvas sans déformer.
  const scale = Math.min(width / FACE.width, height / FACE.height);
  const offsetX = (width - FACE.width * scale) / 2;
  const offsetY = (height - FACE.height * scale) / 2;

  // Fond : exactement la couleur du corps (jonction invisible avec les autres faces).
  ctx.fillStyle = palette.body;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(offsetX, offsetY);
  ctx.scale(scale, scale);

  painter.paintBackground?.(ctx, palette, { closed });
  paintCheeks(ctx, palette.cheek);
  paintEyes(ctx, { ink: palette.ink, closed, ...painter.eyes });
  painter.paintFeatures(ctx, palette, { closed });

  ctx.restore();
}

/**
 * Dessine une texture de visage NON mise en cache (pour les pets « Rainbow », dont la
 * couleur change en continu : la texture est REPEINTE sur le même canvas, jamais
 * recréée — aucune création de CanvasTexture dans la boucle de rendu).
 * @param {import('../species/index.js').FacePainter} painter
 * @param {import('../species/index.js').PetPalette} palette
 * @param {{ width?: number, closed?: boolean, body?: object }} [options]
 */
export function paintFaceTexture(painter, palette, { width = GAME_CONFIG.pets.faceTextureWidth, closed = false, body = DEFAULT_BODY } = {}) {
  const surface = bodyLayout(body).faceSurface;
  const { canvas } = createCanvas(width, Math.round((width * surface.height) / surface.width));
  paintOnCanvas(canvas, painter, palette, { body, closed });
  return canvasToTexture(canvas, { anisotropy: 8 });
}

/**
 * Repeint une texture de visage existante (canvas déjà alloué) : aucune création
 * de CanvasTexture. Appelé par le pet « Rainbow » pour changer de teinte.
 * @param {THREE.CanvasTexture} texture
 * @param {import('../species/index.js').FacePainter} painter
 * @param {import('../species/index.js').PetPalette} palette
 * @param {{ body?: object, closed?: boolean }} [options]
 */
export function repaintFaceTexture(texture, painter, palette, { body = DEFAULT_BODY, closed = false } = {}) {
  const canvas = texture.image;
  if (!canvas) return;
  paintOnCanvas(canvas, painter, palette, { body, closed });
  texture.needsUpdate = true;
}

/**
 * Crée (ou réutilise) les textures de visage d'un pet.
 *
 * @param {string} key identifiant de l'espèce (pour le cache)
 * @param {import('../species/index.js').FacePainter} painter
 * @param {import('../species/index.js').PetPalette} palette
 * @param {object} [body] dimensions du corps (aspect du visage)
 * @returns {{ open: THREE.CanvasTexture, closed: THREE.CanvasTexture }} yeux ouverts / yeux fermés
 */
export function createFaceTextures(key, painter, palette, body = DEFAULT_BODY) {
  const bodyKey = body === DEFAULT_BODY ? '' : `|${body.width}x${body.height}x${body.depth}`;
  const cacheKey = `${key}|${bodyKey}|${JSON.stringify(palette)}`;
  let textures = cache.get(cacheKey);
  if (!textures) {
    const width = GAME_CONFIG.pets.faceTextureWidth;
    const surface = bodyLayout(body).faceSurface;
    const { canvas: openCanvas } = createCanvas(width, Math.round((width * surface.height) / surface.width));
    paintOnCanvas(openCanvas, painter, palette, { body, closed: false });
    const open = canvasToTexture(openCanvas, { anisotropy: 8 });

    // Yeux fermés (clignement) : résolution réduite.
    const closedWidth = Math.round(width / 2);
    const { canvas: closedCanvas } = createCanvas(closedWidth, Math.round((closedWidth * surface.height) / surface.width));
    paintOnCanvas(closedCanvas, painter, palette, { body, closed: true });
    const closed = canvasToTexture(closedCanvas, { anisotropy: 8 });

    textures = { open, closed };
    cache.set(cacheKey, textures);
  }
  return textures;
}
