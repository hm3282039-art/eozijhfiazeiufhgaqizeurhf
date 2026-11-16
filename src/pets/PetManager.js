import * as THREE from 'three';
import { GAME_CONFIG } from '../config/gameConfig.js';
import { PET_SPECIES } from '../config/petSpecies.js';
import { getRarity } from '../config/rarityConfig.js';
import { EVENTS } from '../core/EventBus.js';
import { PetAnimator } from './animation/PetAnimator.js';
import { DEFAULT_PET_ANIMATION, PET_ANIMATION_STYLES } from './animation/petAnimationStyles.js';
import { CombatFormation } from './CombatFormation.js';
import { Pet } from './Pet.js';
import { PetFormation } from './PetFormation.js';
import { PetMovement } from './PetMovement.js';

const COMBAT = GAME_CONFIG.combat;

/**
 * L'équipe de pets du joueur : création / suppression, formation, déplacement, animation…
 * …et mode « combat » : quand un Breakable est ciblé, les pets l'entourent en cercle
 * et le frappent à intervalles réguliers (voir `setTarget`).
 */
export class PetManager {
  #events;
  #collision;
  #formation = new PetFormation();
  #combatFormation = new CombatFormation();
  /** @type {{ pet: Pet, movement: PetMovement, animator: PetAnimator, attackCooldown: number }[]} */
  #members = [];
  #animationStyle = DEFAULT_PET_ANIMATION;
  #createdCount = 0;
  #target = null;
  /** Compteur de frames pour le throttle des étiquettes (une image sur deux). */
  #labelFrame = 0;
  #damageBoostEnabled = false;
  #sizeMultiplier = 1;
  /** @type {number | null} surcharge de la taille d'équipe (Gamepass +15 Pets Équipés) */
  #maxCountOverride = null;
  /** Ensemble des pets découverts (clés `species:rarity:variant`). */
  #collection = new Set();

  /**
   * Appelé à chaque coup porté par un pet : `(pet, breakable) => void`.
   * Assigné par le jeu (qui relie les pets au système de Breakables).
   * @type {((pet: Pet, breakable: object) => void) | null}
   */
  onPetHit = null;

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

  /** Tous les pets découverts (clés `species:rarity:variant`). */
  get collection() {
    return this.#collection;
  }

  /** Un pet est-il découvert ? @param {string} speciesId @param {string} rarityId @param {string} [variant] */
  isDiscovered(speciesId, rarityId, variant = 'normal') {
    return this.#collection.has(`${speciesId}:${rarityId}:${variant}`);
  }

  /** Nombre de pets découverts. */
  get discoveredCount() {
    return this.#collection.size;
  }

  /** Un pet (espèce + rareté) est-il actuellement équipé ? */
  isEquipped(speciesId, rarityId) {
    return this.#members.some((m) => !m.pet.isTest && m.pet.species.id === speciesId && m.pet.rarity.id === rarityId);
  }

  get maxCount() {
    // Surcharge possible via le Gamepass « +15 Pets Équipés ».
    return this.#maxCountOverride ?? GAME_CONFIG.pets.maxOwned;
  }

  /** Ajoute des slots d'équipe (ex. Gamepass +15 Pets Équipés). @param {number} value */
  setMaxCountDelta(value) {
    this.#maxCountOverride = Math.max(GAME_CONFIG.pets.maxOwned, (this.#maxCountOverride ?? GAME_CONFIG.pets.maxOwned) + value);
  }

  get isFull() {
    return this.count >= this.maxCount;
  }

  get animationStyle() {
    return this.#animationStyle;
  }

  /** Le Breakable actuellement attaqué par l'équipe (`null` = formation derrière le joueur). */
  get target() {
    return this.#target;
  }

  /** Multiplicateur global de dégâts (panneau Admin : boost ×10). */
  get damageBoost() {
    return this.#damageBoostEnabled ? 10 : 1;
  }

  /** État booléen du boost (OFF / ×10). */
  get damageBoostEnabled() {
    return this.#damageBoostEnabled;
  }

  /** Multiplicateur global de taille des pets (panneau Admin : curseur 0,5–3). */
  get sizeMultiplier() {
    return this.#sizeMultiplier;
  }

  /**
   * Crée un pet et l'ajoute à l'équipe.
   *
   * @param {{
   *   species: keyof typeof PET_SPECIES,
   *   name?: string,
   *   palette?: object,
   *   modelUrl?: string | null,   remplace le `modelUrl` de l'espèce (un .glb, ou `null` pour forcer le procédural)
   *   variant?: string,           'normal' | 'golden' | 'rainbow' | 'shiny' (modificateur visuel + dégâts)
   *   rarity?: string,           une rareté PS99 (voir `config/rarityConfig.js`), défaut « basic »
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
    // Enregistre dans la collection (pour l'index / la collection).
    this.#collection.add(`${pet.species.id}:${pet.rarity.id}:${pet.variant}`);
    const member = {
      pet,
      movement: new PetMovement(pet, this.#collision),
      animator: new PetAnimator(pet, this.#createdCount++),
      attackCooldown: 0,
    };

    // Le pet rejoint tout de suite la formation (invisible tant qu'il n'est pas prêt).
    pet.object3D.visible = false;
    pet.object3D.scale.setScalar(this.#sizeMultiplier);
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

  /**
   * Équipe un pet à partir de sa collection (crée une instance et l'ajoute à l'équipe).
   * @param {string} speciesId
   * @param {string} rarityId
   * @param {string} [variant='normal']
   * @returns {Promise<Pet | null>}
   */
  async equip(speciesId, rarityId, variant = 'normal') {
    if (this.isFull) return null;
    const species = PET_SPECIES[speciesId];
    if (!species) throw new Error(`Espèce de pet inconnue : « ${speciesId} »`);
    const pet = await this.addPet({ species, rarity: rarityId, variant }, { at: this.#formation.heading ? null : null });
    return pet;
  }

  /**
   * Déséquipe un pet (retiré de l'équipe, conservé dans la collection).
   * @param {Pet} pet
   */
  unequip(pet) {
    if (!pet || pet.isTest) return;
    this.removePet(pet);
  }

  /**
   * Équipe les meilleurs pets de la collection (tri par puissance de rareté).
   * Remplace l'équipe actuelle.
   * @returns {Promise<Pet[]>} les pets équipés
   */
  async equipBest() {
    // Trie les découverts par puissance de rareté (décroissant), puis par variante.
    const entries = [...this.#collection].sort((a, b) => {
      const [sa, ra] = a.split(':');
      const [sb, rb] = b.split(':');
      const pa = getRarity(ra).power;
      const pb = getRarity(rb).power;
      if (pb !== pa) return pb - pa;
      return sb.localeCompare(sa);
    });

    // Déséquipe tout le monde (sauf les tests).
    for (const member of [...this.#members]) {
      if (!member.pet.isTest) this.removePet(member.pet);
    }

    // Équipe les meilleurs jusqu'à remplir l'équipe.
    const equipped = [];
    for (const key of entries) {
      if (this.isFull) break;
      const [speciesId, rarityId, variant] = key.split(':');
      const pet = await this.equip(speciesId, rarityId, variant);
      if (pet) equipped.push(pet);
    }
    return equipped;
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

  // ── Combat ─────────────────────────────────────────────────────────────────

  /**
   * Cible les pets sur un Breakable (ils quittent la formation et l'entourent),
   * ou annule la cible (`null` : retour à la formation derrière le joueur).
   * @param {{ alive: boolean } | null} breakable
   */
  setTarget(breakable) {
    this.#target = breakable && breakable.alive ? breakable : null;
    for (const member of this.#members) member.attackCooldown = 0;
  }

  /** Dégâts d'un coup de ce pet (base × variante × boost Admin). */
  petDamage(pet) {
    return COMBAT.baseDamage * pet.damageMultiplier * this.damageBoost;
  }

  /** Active / désactive le boost de dégâts ×10 (panneau Admin). @returns {boolean} le nouvel état */
  setDamageBoost(enabled) {
    this.#damageBoostEnabled = !!enabled;
    return this.#damageBoostEnabled;
  }

  /** Taille globale des pets (panneau Admin : curseur 0,5–3). */
  setSizeMultiplier(multiplier) {
    this.#sizeMultiplier = multiplier;
    for (const { pet } of this.#members) pet.object3D.scale.setScalar(multiplier);
  }

  /**
   * @param {number} dt
   * @param {number} time
   * @param {{ position: { x: number, z: number }, yaw: number, speed: number }} player
   */
  update(dt, time, player) {
    const members = this.#members;
    const target = this.#target && this.#target.alive ? this.#target : null;
    if (!target) this.#target = null;

    const slots = target
      ? this.#combatFormation.update(target, this.count)
      : this.#formation.update(dt, player, this.count);

    for (let i = 0; i < members.length; i++) members[i].movement.advance(dt, slots[i]);
    this.#separate();
    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const { movement, animator, pet } = member;
      // En combat, les pets regardent la cible une fois en place ; sinon, comme le joueur.
      const idleYaw = target
        ? Math.atan2(target.position.x - pet.position.x, target.position.z - pet.position.z)
        : player.yaw;
      movement.finish(dt, idleYaw);
      animator.update(dt, time, this.#animationStyle);
      pet.updateVariant(dt, time);
      if (target) this.#updateAttack(member, target, slots[i], dt);
    }
  }

  /** Un pet en position frappe sa cible toutes les `hitInterval` secondes. */
  #updateAttack(member, target, slot, dt) {
    member.attackCooldown -= dt;
    if (member.attackCooldown > 0) return;

    const pet = member.pet;
    const distance = Math.hypot(pet.position.x - slot.x, pet.position.z - slot.z);
    if (distance > COMBAT.attackRange) return;

    member.attackCooldown = COMBAT.hitInterval;
    member.animator.punch();
    this.onPetHit?.(pet, target);
  }

  /**
   * Garde les étiquettes des pets lisibles quel que soit le zoom.
   * À appeler une fois la caméra mise à jour.
   *
   * Optimisation FPS : mise à jour à une image sur deux, et uniquement pour les
   * objets proches (moins de 35 m de la caméra). Le calcul du zoom est léger, mais
   * il est inutile de le refaire chaque image pour tous les pets.
   *
   * @param {THREE.Camera} camera
   */
  updateLabels(camera) {
    // Une image sur deux : le compteur alterne à chaque appel.
    this.#labelFrame = (this.#labelFrame + 1) % 2;
    if (this.#labelFrame !== 0) return;

    const maxDistanceSq = 35 * 35;
    for (const { pet } of this.#members) {
      const dx = camera.position.x - pet.position.x;
      const dz = camera.position.z - pet.position.z;
      if (dx * dx + dz * dz > maxDistanceSq) continue;
      pet.label.fitToCamera(camera.position, pet.position);
    }
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
