import * as THREE from 'three';
import { createCanvas, drawOutlinedText, roundRectPath, fontStyle } from '../graphics/canvas.js';
import { clamp } from '../utils/math.js';
import { getRarity } from '../config/rarityConfig.js';

const CANVAS_WIDTH = 512;
const CANVAS_HEIGHT = 128;
/** Hauteur de l'étiquette dans le monde (unités). */
const WORLD_HEIGHT = 0.46;
const WORLD_WIDTH = (WORLD_HEIGHT * CANVAS_WIDTH) / CANVAS_HEIGHT;
/** Espace entre le sommet du pet et son étiquette. */
const MARGIN_ABOVE_PET = 0.2;
/**
 * En deçà de cette distance caméra ↔ étiquette, l'étiquette cesse de grossir à l'écran :
 * le texte reste discret quand on zoome sur ses pets.
 */
const FULL_SIZE_DISTANCE = 13;
const MIN_SCALE = 0.3;

/**
 * Étiquette flottante affichée au-dessus d'un pet : son nom en texte « cartoon »
 * (blanc, contour foncé), toujours tourné vers la caméra.
 */
export class PetLabel {
  #texture;

  /**
   * @param {string} text
   * @param {{ rarity?: string }} [opts] `rarity` : rareté PS99 (affichée sous le nom)
   */
  constructor(text, { rarity = 'basic' } = {}) {
    const { canvas, ctx } = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const rarityDef = getRarity(rarity);
    const showRarity = rarity !== 'basic';

    // Réduit la police si le nom est trop long pour tenir dans l'étiquette.
    let fontSize = showRarity ? 62 : 74;
    ctx.font = fontStyle(700, fontSize);
    const maxWidth = CANVAS_WIDTH - 44;
    const measured = ctx.measureText(text).width;
    if (measured > maxWidth) {
      fontSize = Math.floor((fontSize * maxWidth) / measured);
      ctx.font = fontStyle(700, fontSize);
    }

    drawOutlinedText(ctx, text, CANVAS_WIDTH / 2, showRarity ? CANVAS_HEIGHT / 2 - 26 : CANVAS_HEIGHT / 2 + 2, {
      fill: '#ffffff',
      stroke: '#1d2140',
      lineWidth: 16,
    });

    // Étiquette de rareté : chip coloré avec le nom de la rareté.
    if (showRarity) {
      const chipText = rarityDef.short ?? rarityDef.label;
      ctx.font = fontStyle(700, 40);
      const chipW = Math.min(CANVAS_WIDTH - 44, Math.max(160, ctx.measureText(chipText).width + 56));
      const chipH = 56;
      roundRectPath(ctx, (CANVAS_WIDTH - chipW) / 2, CANVAS_HEIGHT / 2 + 44, chipW, chipH, 28);
      ctx.fillStyle = rarityDef.color;
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.stroke();
      ctx.fillStyle = '#1d2140';
      ctx.fillText(chipText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 44 + chipH / 2);
    }

    this.#texture = new THREE.CanvasTexture(canvas);
    this.#texture.colorSpace = THREE.SRGBColorSpace;

    /** Sprite ancré par le bas : sa position est le point juste au-dessus de la tête du pet. */
    this.sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: this.#texture, transparent: true, depthWrite: false, toneMapped: false }),
    );
    this.sprite.name = 'PetLabel';
    this.sprite.center.set(0.5, 0);
    this.sprite.scale.set(WORLD_WIDTH, WORLD_HEIGHT, 1);
    this.sprite.renderOrder = 5;
  }

  /**
   * Place l'étiquette au-dessus du pet.
   * @param {number} petTop hauteur du sommet du pet (au-dessus du sol)
   */
  setHeight(petTop) {
    this.sprite.position.y = petTop + MARGIN_ABOVE_PET;
  }

  /**
   * Adapte la taille de l'étiquette à la distance de la caméra : taille « monde » de loin,
   * taille constante à l'écran de près.
   *
   * @param {THREE.Vector3} cameraPosition
   * @param {THREE.Vector3} petPosition position au sol du pet
   */
  fitToCamera(cameraPosition, petPosition) {
    const distance = Math.hypot(
      cameraPosition.x - petPosition.x,
      cameraPosition.y - this.sprite.position.y,
      cameraPosition.z - petPosition.z,
    );
    const scale = clamp(distance / FULL_SIZE_DISTANCE, MIN_SCALE, 1);
    this.sprite.scale.set(WORLD_WIDTH * scale, WORLD_HEIGHT * scale, 1);
  }

  dispose() {
    this.sprite.removeFromParent();
    this.#texture.dispose();
    this.sprite.material.dispose();
  }
}
