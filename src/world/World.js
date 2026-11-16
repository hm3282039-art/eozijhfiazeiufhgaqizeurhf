import { WORLD, getWalkableBounds } from '../config/worldConfig.js';
import { CollisionWorld } from './physics/CollisionWorld.js';
import { createSky } from './environment/Sky.js';
import { Lighting } from './environment/Lighting.js';
import { createOcean } from './environment/Ocean.js';
import { createClouds } from './environment/Clouds.js';
import { createSparkles } from './environment/Sparkles.js';
import { createIsland } from './terrain/Island.js';
import { createStoneBorder } from './terrain/StoneBorder.js';
import { createCobblePath } from './terrain/CobblePath.js';
import { createForest } from './props/Tree.js';
import { createBushes } from './props/Bush.js';
import { createRocks } from './props/Rocks.js';
import { createFlowers } from './props/Flowers.js';
import { createFountain } from './props/Fountain.js';
import { createRainbowArch } from './props/RainbowArch.js';
import { createEggPedestal } from './props/EggPedestal.js';
import { createZoneGate } from './props/ZoneGate.js';
import { createZone2 } from './zone2/createZone2.js';
import { createZone3 } from './zone3/createZone3.js';
import { BUSHES, ROCKS, TREES, isDecorationBlocked } from './layout/hubLayout.js';

/**
 * Le monde du jeu : Zone 1 (Hub de départ) + Zone 2 (forêt de cerisiers & or).
 *
 * Chaque élément du décor est une « entité » toute simple :
 *   { object3D, update?(dt, time, focus), colliders? }
 * Le monde se contente de les assembler, de les animer et d'enregistrer leurs collisions.
 */
export class World {
  #scene;
  #updatables = [];
  #sky;
  #lighting;

  /** La porte de la Zone 2 (mur laser, cadenas…). */
  gate;
  /** La porte de la Zone 3 (mur laser, cadenas…). */
  gate2;

  /** Facteur de particules global (1 = tout, <1 = réduit pour la performance). */
  particleFactor = 1;

  /** L'éclairage (pour appliquer la qualité). */
  get lighting() {
    return this.#lighting;
  }

  /** @param {import('three').Scene} scene */
  constructor(scene) {
    this.#scene = scene;
    this.collision = new CollisionWorld(getWalkableBounds());

    // ── Environnement ──────────────────────────────────────────────────────
    this.#sky = createSky(scene);
    this.#add(this.#sky);
    this.#lighting = new Lighting();
    this.#add(this.#lighting);
    this.#add(createOcean());
    this.#add(createClouds());
    this.#add(createSparkles());

    // ── Zone 1 : terrain ───────────────────────────────────────────────────
    this.#add(createIsland());
    this.#add(
      createStoneBorder(WORLD.island, {
        gateGap: { center: WORLD.gate.x, halfWidth: WORLD.gate.halfOpening + WORLD.gate.pillarSize + 0.15 },
      }),
    );
    this.#add(createCobblePath());

    // ── Zone 1 : végétation ─────────────────────────────────────────────────
    this.#add(createForest(TREES));
    this.#add(createBushes(BUSHES));
    this.#add(createRocks(ROCKS));
    this.#add(createFlowers({ bounds: getWalkableBounds(0.6), isBlocked: isDecorationBlocked }));

    // ── Zone 1 : points d'intérêt ────────────────────────────────────────────
    this.#add(createFountain({ radius: WORLD.fountain.radius }), WORLD.fountain);
    this.#add(createRainbowArch(), WORLD.arch);
    this.#add(createEggPedestal({ radius: WORLD.eggPedestal.radius }), WORLD.eggPedestal);
    this.gate = createZoneGate(WORLD.gate);
    this.#add(this.gate, WORLD.gate);

    // Porte Zone 2 → Zone 3.
    this.gate2 = createZoneGate(WORLD.gate2);
    this.#add(this.gate2, WORLD.gate2);

    // ── Zone 2 : île au nord ─────────────────────────────────────────────────
    this.#add(createZone2());

    // ── Zone 3 : île au nord de la Zone 2 (Mines de Cristal & Or) ─────────
    this.#add(createZone3());

    // ── Jonction Zone 1 / Zone 2 : la bordure de pierres de la Zone 1 ────────
    // Ses pierres sont visuelles ; ces deux colliders invisibles empêchent de
    // contourner la porte (le passage ne se fait que par l'ouverture, bloquée
    // par le mur laser tant que la Zone 2 n'est pas débloquée).
    const borderZ = WORLD.island.minZ + 0.7;
    const gapHalf = WORLD.gate.halfOpening + WORLD.gate.pillarSize + 0.15;
    const bounds = getWalkableBounds();
    this.collision.add({ type: 'box', minX: bounds.minX, maxX: WORLD.gate.x - gapHalf, minZ: borderZ - 0.6, maxZ: borderZ + 0.6 });
    this.collision.add({ type: 'box', minX: WORLD.gate.x + gapHalf, maxX: bounds.maxX, minZ: borderZ - 0.6, maxZ: borderZ + 0.6 });

    // Jonction Zone 2 / Zone 3 : colliders de la porte Zone 3.
    const borderZ2 = WORLD.zone2.island.minZ + 0.7;
    const gapHalf2 = WORLD.gate2.halfOpening + WORLD.gate2.pillarSize + 0.15;
    const bounds2 = getWalkableBounds();
    this.collision.add({ type: 'box', minX: bounds2.minX, maxX: WORLD.gate2.x - gapHalf2, minZ: borderZ2 - 0.6, maxZ: borderZ2 + 0.6 });
    this.collision.add({ type: 'box', minX: WORLD.gate2.x + gapHalf2, maxX: bounds2.maxX, minZ: borderZ2 - 0.6, maxZ: borderZ2 + 0.6 });
  }

  /**
   * Anime le décor.
   * @param {number} dt
   * @param {number} time temps de jeu écoulé (s)
   * @param {import('three').Vector3} focus position du joueur (les ombres le suivent)
   */
  update(dt, time, focus) {
    for (const entity of this.#updatables) entity.update(dt, time, focus);
  }

  /** Applique un préréglage de qualité à l'éclairage (ombres + résolution). */
  setQuality(preset) {
    this.#lighting.setQuality(preset);
  }

  /** Bascule l'ambiance du monde : 'day' (jour) ou 'sunset' (coucher de soleil doré). */
  setMood(mood) {
    this.#sky.setMood(mood);
    this.#lighting.setMood(mood);
  }

  /**
   * Ajoute une entité à la scène.
   * @param {{ object3D: import('three').Object3D, update?: Function, colliders?: object[] }} entity
   * @param {{ x: number, z: number } | null} at position sur l'île (les colliders locaux sont décalés d'autant)
   */
  #add(entity, at = null) {
    const offsetX = at?.x ?? 0;
    const offsetZ = at?.z ?? 0;
    if (at) entity.object3D.position.set(offsetX, 0, offsetZ);

    this.#scene.add(entity.object3D);
    if (entity.update) this.#updatables.push(entity);

    for (const collider of entity.colliders ?? []) {
      if (collider.type === 'circle') {
        this.collision.add({ ...collider, x: collider.x + offsetX, z: collider.z + offsetZ });
      } else {
        this.collision.add({
          ...collider,
          minX: collider.minX + offsetX,
          maxX: collider.maxX + offsetX,
          minZ: collider.minZ + offsetZ,
          maxZ: collider.maxZ + offsetZ,
        });
      }
    }
  }
}
