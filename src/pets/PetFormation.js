import { GAME_CONFIG } from '../config/gameConfig.js';
import { angleDelta, clamp, dampFactor } from '../utils/math.js';

const CONFIG = GAME_CONFIG.pets.formation;

/**
 * Formation des pets derrière le joueur — grille dynamique façon PS99.
 *
 * Les pets sont rangés en lignes bien alignées, centrées derrière le joueur :
 *   3 pets → 1 rangée de 3 · 5 pets → 3 + 2 · 8 pets → 4 + 4 · 12 pets → 4 + 4 + 4
 *
 * La formation possède son propre cap, qui rejoint en douceur celui du joueur pendant
 * qu'il se déplace : quand il fait demi-tour, la rangée pivote autour de lui au lieu de
 * se téléporter de l'autre côté.
 */
export class PetFormation {
  /** Cap de la formation (radians, 0 = vers +Z). Les pets se placent à l'opposé. */
  heading = 0;

  /** @type {{ x: number, z: number }[]} */
  #slots = [];

  /**
   * Répartit `count` pets en rangées équilibrées.
   * @returns {number[]} nombre de pets dans chaque rangée (de la plus proche à la plus éloignée)
   */
  static layoutRows(count) {
    if (count <= 0) return [];
    const rowCount = Math.ceil(count / CONFIG.maxColumns);
    const perRow = Math.ceil(count / rowCount);
    const rows = [];
    for (let remaining = count; remaining > 0; remaining -= perRow) {
      rows.push(Math.min(perRow, remaining));
    }
    return rows;
  }

  /** Aligne immédiatement la formation sur un cap (lancement, téléportation). */
  reset(heading) {
    this.heading = heading;
  }

  /**
   * Met à jour le cap puis calcule l'emplacement de chaque pet.
   *
   * @param {number} dt
   * @param {{ position: { x: number, z: number }, yaw: number, speed: number }} player
   * @param {number} count nombre de pets
   * @returns {{ x: number, z: number }[]} emplacements (tableau réutilisé d'une image à l'autre)
   */
  update(dt, player, count) {
    // Le cap ne suit le joueur que lorsqu'il avance réellement, et pivote à vitesse
    // plafonnée : pendant un demi-tour, la rangée contourne le joueur sans « fouetter ».
    const moveFactor = clamp(player.speed / GAME_CONFIG.player.walkSpeed, 0, 1);
    const turn = angleDelta(this.heading, player.yaw) * dampFactor(CONFIG.turnSharpness * moveFactor, dt);
    const maxTurn = CONFIG.maxTurnRate * dt;
    this.heading += clamp(turn, -maxTurn, maxTurn);

    const forwardX = Math.sin(this.heading);
    const forwardZ = Math.cos(this.heading);
    // Droite du joueur lorsqu'il regarde dans la direction du cap.
    const rightX = -forwardZ;
    const rightZ = forwardX;

    const slots = this.#slots;
    while (slots.length < count) slots.push({ x: 0, z: 0 });
    slots.length = count;

    let index = 0;
    PetFormation.layoutRows(count).forEach((columns, row) => {
      const back = CONFIG.followDistance + row * CONFIG.rowSpacing;
      for (let column = 0; column < columns; column++) {
        // De gauche à droite, vu de derrière le joueur.
        const side = (column - (columns - 1) / 2) * CONFIG.columnSpacing;
        const slot = slots[index++];
        slot.x = player.position.x - forwardX * back + rightX * side;
        slot.z = player.position.z - forwardZ * back + rightZ * side;
      }
    });

    return slots;
  }
}
