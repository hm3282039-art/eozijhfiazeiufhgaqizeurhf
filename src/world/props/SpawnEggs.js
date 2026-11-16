import * as THREE from 'three';
import { HATCH_EGGS } from '../../config/eggCatalog.js';
import { PET_SPECIES } from '../../config/petSpecies.js';
import { CLASSIC_RARITIES, RARITIES } from '../../config/rarityConfig.js';
import { WORLD } from '../../config/worldConfig.js';
import { createCanvas, canvasToTexture } from '../../graphics/canvas.js';
import { createToyMaterial, glowMaterial } from '../../graphics/materials.js';
import { eggGeometry, softCylinderGeometry } from '../../graphics/geometries.js';
import { PALETTE } from '../../config/palette.js';
import { createRng } from '../../utils/random.js';

const EGG_RADIUS = 0.62;
const EGG_HEIGHT = 1.45;
const EGG_REST_Y = 1.95;

/**
 * Génère la texture d'un œuf selon ses couleurs (fond → point) : un dégradé
 * avec des pois de la couleur secondaire, uniforme sur la couture verticale.
 * @param {string[]} colors [fond, point]
 * @param {string} id identifiant (seed du RNG)
 */
function createEggTexture(colors, id) {
  const width = 512;
  const height = 512;
  const { canvas, ctx } = createCanvas(width, height);
  const rng = createRng(id);

  // Dégradé vertical fond → point.
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Couronne plus claire au sommet (reflet).
  const top = ctx.createRadialGradient(width / 2, height * 0.22, 0, width / 2, height * 0.22, height * 0.5);
  top.addColorStop(0, 'rgba(255,255,255,0.45)');
  top.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, width, height);

  // Petits pois répartis (répétés à ±width pour la couture).
  const spotCount = 14;
  for (let i = 0; i < spotCount; i++) {
    const spot = {
      x: rng.range(20, width - 20),
      y: rng.range(height * 0.15, height * 0.85),
      r: rng.range(14, 30),
    };
    for (const dx of [-width, 0, width]) {
      ctx.fillStyle = colors[1];
      ctx.beginPath();
      ctx.ellipse(spot.x + dx, spot.y, spot.r * 1.3, spot.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.ellipse(spot.x + dx - spot.r * 0.3, spot.y - spot.r * 0.3, spot.r * 0.35, spot.r * 0.22, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = canvasToTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/** Socle rond pour l'œuf (mini version du piédestal décoratif). */
function createPedestal(radius) {
  const pedestal = new THREE.Group();
  const tiers = [
    { radius, height: 0.42, y: 0, material: PALETTE.stone.base },
    { radius: radius * 0.74, height: 0.38, y: 0.42, material: PALETTE.stone.light },
    { radius: radius * 0.52, height: 0.34, y: 0.8, material: PALETTE.gold },
  ];
  for (const tier of tiers) {
    const mesh = new THREE.Mesh(
      softCylinderGeometry(tier.radius, tier.height, 0.1, 40),
      createToyMaterial({ color: tier.material, roughness: 0.72 }),
    );
    mesh.position.y = tier.y;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    pedestal.add(mesh);
  }
  return pedestal;
}

/**
 * Crée un œuf 3D complet (socle + coquille) pour le spawn.
 * @param {object} eggDef définition dans `config/eggCatalog.js`
 * @param {{ x: number, z: number }} position
 * @returns {{ object3D: THREE.Group, egg: THREE.Mesh, def: object, position: object, update: Function }}
 */
function createSpawnEgg(eggDef, position) {
  const group = new THREE.Group();
  group.name = `SpawnEgg(${eggDef.id})`;
  group.position.set(position.x, 0, position.z);

  group.add(createPedestal(1.5));

  const texture = createEggTexture(eggDef.colors, eggDef.id);
  const egg = new THREE.Mesh(
    eggGeometry(EGG_RADIUS, EGG_HEIGHT),
    createToyMaterial({ map: texture, roughness: 0.32, emissive: '#000000', emissiveIntensity: 0 }),
  );
  egg.name = 'SpawnEggShell';
  egg.position.y = EGG_REST_Y;
  egg.castShadow = false;
  group.add(egg);

  // Halo doux sous l'œuf.
  const glowGeometry = new THREE.PlaneGeometry(1, 1);
  glowGeometry.rotateX(-Math.PI / 2);
  const glow = new THREE.Mesh(
    glowGeometry,
    glowMaterial(eggDef.colors[1], { opacity: 0.55 }),
  );
  glow.position.y = 1.25;
  glow.scale.set(1.8, 1, 1.8);
  group.add(glow);

  const update = (dt, time) => {
    const bob = Math.sin(time * 1.6) * 0.12;
    egg.position.y = EGG_REST_Y + bob;
    egg.rotation.y = time * 0.4;
    const pulse = 0.85 + Math.sin(time * 2.4) * 0.15;
    glow.scale.set(1.8 * pulse, 1, 1.8 * pulse);
  };
  update(0, 0);

  return { object3D: group, egg, def: eggDef, position, update };
}

/**
 * Gestionnaire des 3 œufs 3D du spawn (Zone 1).
 *  - positionne chaque œuf sur son piédestal ;
 *  - expose `nearest(position)` : l'œuf le plus proche (si dans la portée) ;
 *  - expose `hatch(egg)` : déclenche l'éclosion (le jeu joue l'animation).
 *
 * @param {THREE.Scene} scene
 */
export class SpawnEggs {
  #eggs = [];
  #scene;

  constructor(scene) {
    this.#scene = scene;
    for (let i = 0; i < HATCH_EGGS.length; i++) {
      const egg = createSpawnEgg(HATCH_EGGS[i], WORLD.eggPedestals[i]);
      this.#eggs.push(egg);
      this.#scene.add(egg.object3D);
    }
  }

  /** Tous les œufs (pour l'iteration). */
  get eggs() {
    return this.#eggs;
  }

  /** Anime les œufs. @param {number} dt @param {number} time */
  update(dt, time) {
    for (const egg of this.#eggs) egg.update(dt, time);
  }

  /**
   * L'œuf le plus proche du joueur, s'il est dans la portée de proximité.
   * @param {THREE.Vector3} playerPosition
   * @param {number} maxDistance
   * @returns {object | null}
   */
  nearest(playerPosition, maxDistance) {
    let best = null;
    let bestDist = maxDistance;
    for (const egg of this.#eggs) {
      const dx = egg.position.x - playerPosition.x;
      const dz = egg.position.z - playerPosition.z;
      const dist = Math.hypot(dx, dz);
      if (dist < bestDist) {
        bestDist = dist;
        best = egg;
      }
    }
    return best;
  }

  /** Colliders des piédestaux (empêche de marcher dans les œufs). */
  get colliders() {
    return this.#eggs.map((egg) => ({ type: 'circle', x: egg.position.x, z: egg.position.z, radius: 1.6 }));
  }

  /**
   * Calcule les chances d'éclosion d'un œuf (espèce + rareté) pour l'affichage
   * de la bulle de proximité. Les chances sont dérivées du catalogue.
   * @param {object} eggDef
   * @returns {{ entries: { species: object, rarity: object, chance: number }[], hugeChance: number }}
   */
  static rollPreview(eggDef) {
    const [minOrder, maxOrder] = eggDef.rarityRange;
    const eligible = CLASSIC_RARITIES.filter((r) => r.order >= minOrder && r.order <= maxOrder);
    // Poids inverse de l'ordre (comme dans `Shop.rollEgg`).
    const weighted = eligible.map((r) => [r, Math.max(1, maxOrder - r.order + 1)]);
    const totalWeight = weighted.reduce((sum, [, w]) => sum + w, 0);

    const entries = [];
    for (const speciesId of eggDef.pool) {
      const species = PET_SPECIES[speciesId];
      if (!species) continue;
      for (const [rarity, weight] of weighted) {
        const chance = (weight / totalWeight) * (1 / eggDef.pool.length);
        entries.push({ species, rarity, chance });
      }
    }
    return { entries, hugeChance: eggDef.hugeChance };
  }
}
