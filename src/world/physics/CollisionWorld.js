import { clamp } from '../../utils/math.js';

/**
 * Collisions 2D (vue de dessus) très légères, suffisantes pour un hub plat :
 *  - un rectangle marchable (les bords de l'île) ;
 *  - des obstacles ronds (arbres, fontaine, socle de l'œuf…) ;
 *  - des obstacles rectangulaires alignés sur les axes (piliers, mur laser).
 *
 * @typedef {{ type: 'circle', x: number, z: number, radius: number, tag?: string }} CircleCollider
 * @typedef {{ type: 'box', minX: number, maxX: number, minZ: number, maxZ: number, tag?: string }} BoxCollider
 */
export class CollisionWorld {
  /** @type {CircleCollider[]} */
  #circles = [];
  /** @type {BoxCollider[]} */
  #boxes = [];

  /** @param {{ minX: number, maxX: number, minZ: number, maxZ: number }} bounds */
  constructor(bounds) {
    this.bounds = bounds;
  }

  /** Tous les colliders (cercles + rectangles) — utile pour le débogage. */
  get colliders() {
    return [...this.#circles, ...this.#boxes];
  }

  /** Retire tous les colliders portant cette étiquette (ex : le mur laser une fois la porte ouverte). */
  removeByTag(tag) {
    this.#circles = this.#circles.filter((collider) => collider.tag !== tag);
    this.#boxes = this.#boxes.filter((collider) => collider.tag !== tag);
  }

  /** @param {CircleCollider | BoxCollider} collider */
  add(collider) {
    if (collider.type === 'circle') this.#circles.push(collider);
    else if (collider.type === 'box') this.#boxes.push(collider);
    else throw new Error(`Type de collider inconnu : ${collider.type}`);
  }

  /**
   * Repousse un disque (le joueur) hors des obstacles et le garde sur l'île.
   * @param {{ x: number, z: number }} position modifiée sur place
   * @param {number} radius rayon du disque
   * @returns {string | null} l'étiquette (`tag`) du dernier obstacle touché
   */
  resolve(position, radius) {
    let touched = null;

    // Deux passes : sortir d'un obstacle peut faire entrer dans son voisin.
    for (let pass = 0; pass < 2; pass++) {
      for (const circle of this.#circles) {
        const dx = position.x - circle.x;
        const dz = position.z - circle.z;
        const minDistance = circle.radius + radius;
        const distanceSq = dx * dx + dz * dz;
        if (distanceSq >= minDistance * minDistance) continue;

        const distance = Math.sqrt(distanceSq);
        if (distance < 1e-5) {
          position.x = circle.x + minDistance;
        } else {
          const push = minDistance / distance;
          position.x = circle.x + dx * push;
          position.z = circle.z + dz * push;
        }
        touched = circle.tag ?? touched;
      }

      for (const box of this.#boxes) {
        const nearestX = clamp(position.x, box.minX, box.maxX);
        const nearestZ = clamp(position.z, box.minZ, box.maxZ);
        const dx = position.x - nearestX;
        const dz = position.z - nearestZ;
        const distanceSq = dx * dx + dz * dz;
        if (distanceSq >= radius * radius) continue;

        if (distanceSq > 1e-10) {
          // Centre à l'extérieur de la boîte : on repousse depuis le point le plus proche.
          const distance = Math.sqrt(distanceSq);
          position.x = nearestX + (dx / distance) * radius;
          position.z = nearestZ + (dz / distance) * radius;
        } else {
          // Centre à l'intérieur : on sort par le côté le plus proche.
          const exits = [
            { axis: 'x', value: box.minX - radius, depth: position.x - box.minX },
            { axis: 'x', value: box.maxX + radius, depth: box.maxX - position.x },
            { axis: 'z', value: box.minZ - radius, depth: position.z - box.minZ },
            { axis: 'z', value: box.maxZ + radius, depth: box.maxZ - position.z },
          ];
          const exit = exits.reduce((best, candidate) => (candidate.depth < best.depth ? candidate : best));
          position[exit.axis] = exit.value;
        }
        touched = box.tag ?? touched;
      }
    }

    this.clampToBounds(position, radius * 0.2);
    return touched;
  }

  /** Garde un point à l'intérieur du rectangle marchable. */
  clampToBounds(position, margin = 0) {
    const { minX, maxX, minZ, maxZ } = this.bounds;
    position.x = clamp(position.x, minX + margin, maxX - margin);
    position.z = clamp(position.z, minZ + margin, maxZ - margin);
    return position;
  }
}
