import * as THREE from 'three';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { PET_SPECIES } from '../config/petSpecies.js';
import { EVENTS } from '../core/EventBus.js';
import { PetAnimator } from './animation/PetAnimator.js';
import { DEFAULT_PET_ANIMATION, PET_ANIMATION_STYLES } from './animation/petAnimationStyles.js';
import { Pet } from './Pet.js';
import { PetFormation } from './PetFormation.js';
import { PetMovement } from './PetMovement.js';

/**
 * L'équipe de pets du joueur : création / suppression, formation, déplacement et animation.
 */
export class PetManager {
  #events;
  #collision;
  #formation = new PetFormation();
  /** @type {{ pet: Pet, movement: PetMovement, animator: PetAnimator }[]} */
  #members = [];
  #animationStyle = DEFAULT_PET_ANIMATION;
  #createdCount = 0;

  /**
   * @param {{
   *   scene: THREE.Scene,
   *   collision: import('../world/physics/CollisionWorld.js').CollisionWorld,
   *   events: import('../core/EventBus.js').EventBus,
   * }} dependencies
   */
  constructor({ scene, collision, events }) {
    this.#events = events;
    this.#collision = collision;

    this.object3D = new THREE.Group();
    this.object3D.name = 'Pets';
    scene.add(this.object3D);
  }

  /** @returns {Pet[]} les pets équipés, dans l'ordre de la formation */
  get pets() {
    return this.#members.map((member) => member.pet);
  }

  get count() {
    return this.#members.length;
  }

  get maxCount() {
    return GAME_CONFIG.pets.maxOwned;
  }

  get isFull() {
    return this.count >= this.maxCount;
  }

  get animationStyle() {
    return this.#animationStyle;
  }

  /**
   * Crée un pet et l'ajoute à l'équipe.
   *
   * @param {{
   *   species: keyof typeof PET_SPECIES,
   *   name?: string,
   *   palette?: object,
   *   modelUrl?: string | null,   remplace le `modelUrl` de l'espèce (un .glb, ou `null` pour forcer le procédural)
   *   isTest?: boolean,
   * }} config
   * @param {{ at?: { x: number, z: number }, animate?: boolean }} [options]
   *   `at` : point d'apparition · `animate` : jouer l'animation « pop »
   * @returns {Promise<Pet | null>} `null` si l'équipe est complète
   */
  async addPet(config, { at = null, animate = true } = {}) {
    if (this.isFull) return null;

    const species = PET_SPECIES[config.species];
    if (!species) throw new Error(`Espèce de pet inconnue : « ${config.species} »`);

    const pet = new Pet({ ...config, species });
    const member = {
      pet,
      movement: new PetMovement(pet, this.#collision),
      animator: new PetAnimator(pet, this.#createdCount++),
    };

    // Le pet rejoint tout de suite la formation (invisible tant qu'il n'est pas prêt).
    pet.object3D.visible = false;
    if (at) member.movement.snapTo(at.x, at.z, this.#formation.heading);
    this.#members.push(member);
    this.object3D.add(pet.object3D);
    this.#emitChange();

    await pet.ready;
    if (!this.#members.includes(member)) return pet; // retiré pendant le chargement

    pet.object3D.visible = true;
    if (animate) member.animator.playSpawn();
    else member.animator.skipSpawn();
    this.#emitChange();
    return pet;
  }

  /** Retire un pet de l'équipe. */
  removePet(pet) {
    const index = this.#members.findIndex((member) => member.pet === pet);
    if (index === -1) return false;
    this.#members.splice(index, 1);
    pet.dispose();
    this.#emitChange();
    return true;
  }

  /** Retire le dernier pet de test ajouté. @returns {Pet | null} */
  removeLastTestPet() {
    const member = this.#members.findLast((candidate) => candidate.pet.isTest);
    if (!member) return null;
    this.removePet(member.pet);
    return member.pet;
  }

  /** Passe au style d'animation suivant. */
  cycleAnimationStyle() {
    const index = PET_ANIMATION_STYLES.indexOf(this.#animationStyle);
    this.#animationStyle = PET_ANIMATION_STYLES[(index + 1) % PET_ANIMATION_STYLES.length];
    this.#events.emit(EVENTS.PET_ANIMATION_CHANGED, this.#animationStyle);
    return this.#animationStyle;
  }

  /**
   * Place immédiatement tous les pets à leur emplacement (lancement, téléportation).
   * @param {{ position: { x: number, z: number }, yaw: number, speed: number }} player
   * @param {number} [heading] cap de la formation (par défaut : l'orientation du joueur)
   */
  snapToFormation(player, heading = player.yaw) {
    this.#formation.reset(heading);
    const slots = this.#formation.update(0, player, this.count);
    this.#members.forEach((member, index) => {
      member.movement.snapTo(slots[index].x, slots[index].z, player.yaw);
    });
  }

  /**
   * @param {number} dt
   * @param {number} time
   * @param {{ position: { x: number, z: number }, yaw: number, speed: number }} player
   */
  update(dt, time, player) {
    const members = this.#members;
    const slots = this.#formation.update(dt, player, this.count);

    for (let i = 0; i < members.length; i++) members[i].movement.advance(dt, slots[i]);
    this.#separate();
    for (const { movement, animator } of members) {
      movement.finish(dt, player.yaw);
      animator.update(dt, time, this.#animationStyle);
    }
  }

  /**
   * Garde les étiquettes des pets lisibles quel que soit le zoom.
   * À appeler une fois la caméra mise à jour.
   * @param {THREE.Camera} camera
   */
  updateLabels(camera) {
    for (const { pet } of this.#members) pet.label.fitToCamera(camera.position, pet.position);
  }

  /**
   * Écarte les pets qui se chevauchent (quand un obstacle les serre les uns contre
   * les autres, ou quand leurs trajectoires se croisent pendant un demi-tour).
   */
  #separate() {
    const members = this.#members;
    const minDistance = GAME_CONFIG.pets.radius * 2 + GAME_CONFIG.pets.separationGap;

    for (let i = 0; i < members.length; i++) {
      const a = members[i].pet.position;
      for (let j = i + 1; j < members.length; j++) {
        const b = members[j].pet.position;
        let dx = b.x - a.x;
        let dz = b.z - a.z;
        const distanceSq = dx * dx + dz * dz;
        if (distanceSq >= minDistance * minDistance) continue;

        const distance = Math.sqrt(distanceSq);
        if (distance < 1e-4) {
          // Exactement superposés : on choisit une direction propre à la paire.
          const angle = (i * 7 + j * 13) * 0.61;
          dx = Math.cos(angle);
          dz = Math.sin(angle);
        } else {
          dx /= distance;
          dz /= distance;
        }
        const push = (minDistance - distance) * 0.5;
        a.x -= dx * push;
        a.z -= dz * push;
        b.x += dx * push;
        b.z += dz * push;
      }
    }
  }

  #emitChange() {
    this.#events.emit(EVENTS.PETS_CHANGED, { pets: this.pets, count: this.count, max: this.maxCount });
  }
}
