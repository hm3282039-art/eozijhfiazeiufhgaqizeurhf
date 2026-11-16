import { GAME_CONFIG } from '../config/gameConfig.js';

/**
 * Formation de combat : quand le joueur clique sur un Breakable, les pets quittent
 * la formation derrière le joueur et entourent la cible en cercle pour la frapper.
 *
 * Les emplacements sont répartis uniformément autour du Breakable, à une distance
 * égale à son rayon + un petit écart. Un léger décalage par pet évite qu'ils se
 * marchent dessus pendant qu'ils courent vers leur place.
 */
export class CombatFormation {
  /** @type {{ x: number, z: number }[]} */
  #slots = [];

  /**
   * Calcule l'emplacement de chaque pet autour de la cible.
   * @param {{ position: { x: number, z: number }, radius: number }} target le Breakable attaqué
   * @param {number} count nombre de pets
   * @returns {{ x: number, z: number }[]} emplacements (tableau réutilisé d'une image à l'autre)
   */
  update(target, count) {
    const slots = this.#slots;
    while (slots.length < count) slots.push({ x: 0, z: 0 });
    slots.length = count;

    const distance = target.radius + GAME_CONFIG.combat.circleGap;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (i % 2) * 0.12;
      slots[i].x = target.position.x + Math.cos(angle) * distance;
      slots[i].z = target.position.z + Math.sin(angle) * distance;
    }
    return slots;
  }
}
