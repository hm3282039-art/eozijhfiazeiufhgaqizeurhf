import * as THREE from 'three';
import { BREAKABLE_SPAWNS, COMBAT } from '../../../config/breakableConfig.js';
import { GAME_CONFIG } from '../../../config/gameConfig.js';
import { Breakable } from './Breakable.js';

const CONFETTI_COLORS = ['#ffc93c', '#ff5a7a', '#4fc3ff', '#7edb3c', '#ffffff', '#b48bff'];

/**
 * Gère tous les Breakables de la carte : création, raycast (survol / clic),
 * dégâts, chiffres flottants, destruction (confettis + butin) et réapparition.
 *
 * Les effets (chiffres de dégâts, confettis, aimant à butin) sont délégués aux
 * systèmes fournis par le jeu via `fx` : `{ floatingText, loot }`.
 */
export class BreakableManager {
  #scene;
  #fx;
  /** @type {Breakable[]} */
  #breakables = [];
  #hovered = null;
  #raycaster = new THREE.Raycaster();
  #pointer = new THREE.Vector2();
  #scratch = new THREE.Vector3();

  /**
   * @param {THREE.Scene} scene
   * @param {{ floatingText: import('../../../ui/components/FloatingText.js').FloatingText, loot: import('../../../combat/LootMagnet.js').LootMagnet }} fx
   */
  constructor(scene, fx) {
    this.#scene = scene;
    this.#fx = fx;
  }

  /** Tous les Breakables (vivants et en réapparition). */
  get breakables() {
    return this.#breakables;
  }

  /** Le Breakable actuellement survolé par la souris (`null` si aucun). */
  get hovered() {
    return this.#hovered;
  }

  /** Appelé quand un Breakable est détruit (le jeu peut alors rappeler les pets). */
  onBreakableDestroyed = null;

  /** Crée les Breakables du plan de la carte (Zone 1 + Zone 2). */
  spawnAll() {
    for (const spawn of BREAKABLE_SPAWNS) this.addBreakable(spawn.type, spawn.x, spawn.z, spawn.y ?? 0);
  }

  /**
   * Ajoute un Breakable à la carte (plan initial, ou panneau Admin).
   * @param {string} typeId clé de `BREAKABLE_TYPES`
   * @param {number} x
   * @param {number} z
   * @param {number} [y] hauteur de la base (ex : posé sur un socle)
   * @returns {Breakable}
   */
  addBreakable(typeId, x, z, y = 0) {
    const breakable = new Breakable(typeId, x, z, y);
    this.#breakables.push(breakable);
    this.#scene.add(breakable.object3D);
    return breakable;
  }

  /**
   * Met à jour le survol à partir de la position de la souris (coordonnées écran).
   * @param {number} clientX
   * @param {number} clientY
   * @param {THREE.Camera} camera
   * @returns {Breakable | null} le Breakable survolé
   */
  updateHover(clientX, clientY, camera) {
    const hit = this.pick(clientX, clientY, camera);
    if (hit !== this.#hovered) {
      this.#hovered?.setHovered(false);
      this.#hovered = hit;
      this.#hovered?.setHovered(true);
    }
    return hit;
  }

  /**
   * Cherche le Breakable visé par la souris.
   * @returns {Breakable | null}
   */
  pick(clientX, clientY, camera) {
    this.#pointer.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    this.#raycaster.setFromCamera(this.#pointer, camera);
    this.#raycaster.far = 120;

    const roots = this.#breakables.filter((b) => b.alive).map((b) => b.object3D);
    if (roots.length === 0) return null;
    const hits = this.#raycaster.intersectObjects(roots, true);
    for (const hit of hits) {
      let node = hit.object;
      while (node) {
        if (node.userData.breakable) return node.userData.breakable;
        node = node.parent;
      }
    }
    return null;
  }

  /**
   * Un pet frappe un Breakable : dégâts (avec critique possible), chiffre flottant,
   * et destruction si les PV tombent à zéro.
   * @param {import('../../../pets/Pet.js').Pet} pet
   * @param {Breakable} breakable
   * @param {number} damage dégâts de base du coup (avant critique)
   */
  hit(breakable, damage) {
    if (!breakable.alive) return;
    const crit = Math.random() < COMBAT.critChance;
    const dealt = breakable.damage(crit ? damage * COMBAT.critMultiplier : damage);
    if (crit) breakable.damageCrit = true;

    if (breakable.hp <= 0) this.#destroy(breakable);
  }

  /** Explose tous les Breakables vivants (panneau Admin : « Nuke Map »). */
  nuke() {
    for (const breakable of [...this.#breakables]) {
      if (breakable.alive) this.#destroy(breakable);
    }
  }

  /**
   * @param {number} dt
   * @param {number} time
   */
  update(dt, time) {
    for (const breakable of this.#breakables) {
      breakable.update(dt);

      // Chiffre de dégâts : un seul nombre par fenêtre de 0,5 s (somme des coups).
      if (breakable.damageBuffer > 0 && breakable.damageWindowElapsed >= COMBAT.hitInterval) {
        this.#scratch.set(breakable.position.x, breakable.height + 0.6, breakable.position.z);
        this.#fx.floatingText.showDamage(this.#scratch, breakable.damageBuffer, breakable.damageCrit);
        breakable.damageBuffer = 0;
        breakable.damageCrit = false;
        breakable.resetDamageWindow();
      }
    }
  }

  /** Destruction : confettis + gerbe de butin qui vole vers le joueur. */
  #destroy(breakable) {
    breakable.destroy();
    if (this.#hovered === breakable) {
      breakable.setHovered(false);
      this.#hovered = null;
    }
    this.#fx.loot.explodeConfetti(breakable.position, CONFETTI_COLORS);
    this.#fx.loot.burstLoot(breakable.position, breakable.type.loot);
    this.onBreakableDestroyed?.(breakable);
  }
}
