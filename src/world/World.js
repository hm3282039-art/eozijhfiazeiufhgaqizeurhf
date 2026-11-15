import { WORLD, getWalkableBounds } from '../config/worldConfig.js';
import { CollisionWorld } from './physics/CollisionWorld.js';
import { createSky } from './environment/Sky.js';
import { Lighting } from './environment/Lighting.js';
import { createOcean } from './environment/Ocean.js';
import { createClouds } from './environment/Clouds.js';
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
import { BUSHES, ROCKS, TREES, isDecorationBlocked } from './layout/hubLayout.js';

/**
 * Le monde de la Zone 1 (Hub de départ).
 *
 * Chaque élément du décor est une « entité » toute simple :
 *   { object3D, update?(dt, time, focus), colliders? }
 * Le monde se contente de les assembler, de les animer et d'enregistrer leurs collisions.
 */
export class World {
  #scene;
  #updatables = [];

  /** @param {import('three').Scene} scene */
  constructor(scene) {
    this.#scene = scene;
    this.collision = new CollisionWorld(getWalkableBounds());

    // ── Environnement ──────────────────────────────────────────────────────
    this.#add(createSky(scene));
    this.#add(new Lighting());
    this.#add(createOcean());
    this.#add(createClouds());

    // ── Terrain ────────────────────────────────────────────────────────────
    this.#add(createIsland());
    this.#add(createStoneBorder());
    this.#add(createCobblePath());

    // ── Végétation ─────────────────────────────────────────────────────────
    this.#add(createForest(TREES));
    this.#add(createBushes(BUSHES));
    this.#add(createRocks(ROCKS));
    this.#add(createFlowers({ bounds: getWalkableBounds(0.6), isBlocked: isDecorationBlocked }));

    // ── Points d'intérêt ───────────────────────────────────────────────────
    this.#add(createFountain({ radius: WORLD.fountain.radius }), WORLD.fountain);
    this.#add(createRainbowArch(), WORLD.arch);
    this.#add(createEggPedestal({ radius: WORLD.eggPedestal.radius }), WORLD.eggPedestal);
    this.#add(createZoneGate(WORLD.gate), WORLD.gate);
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
