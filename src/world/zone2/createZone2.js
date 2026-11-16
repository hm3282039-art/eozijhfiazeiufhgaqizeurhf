import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PALETTE } from '../../config/palette.js';
import { WORLD } from '../../config/worldConfig.js';
import { createToyMaterial } from '../../graphics/materials.js';
import { createGrassTexture } from '../terrain/grassTexture.js';
import { createCliffBody, createCliffRocks } from '../terrain/Island.js';
import { createStoneBorder } from '../terrain/StoneBorder.js';
import { createForest } from '../props/Tree.js';
import { createBushes } from '../props/Bush.js';
import { createRocks } from '../props/Rocks.js';
import { createFlowers } from '../props/Flowers.js';

/**
 * Plan de décoration de la Zone 2 : « Forêt de Cerisiers & Or ».
 * Herbe vert émeraude, grands sakuras roses, buissons dorés et le socle du Coffre Boss.
 * Toutes les coordonnées sont absolues (comme dans `hubLayout.js`).
 */
const SAKURA_TREES = [
  { x: -14, z: -52, shape: 'round', color: 'pink', scale: 1.5 },
  { x: 15, z: -50, shape: 'round', color: 'pink', scale: 1.4 },
  { x: -22, z: -62, shape: 'round', color: 'pink', scale: 1.6 },
  { x: 22, z: -66, shape: 'round', color: 'pink', scale: 1.5 },
  { x: -10, z: -78, shape: 'round', color: 'pink', scale: 1.7 },
  { x: 12, z: -84, shape: 'round', color: 'pink', scale: 1.6 },
  { x: -24, z: -88, shape: 'round', color: 'pink', scale: 1.4 },
  { x: 24, z: -90, shape: 'round', color: 'pink', scale: 1.5 },
  { x: -6, z: -58, shape: 'cube', color: 'pink', scale: 1.2 },
  { x: 7, z: -72, shape: 'cube', color: 'pink', scale: 1.25 },
  { x: -18, z: -46, shape: 'round', color: 'pink', scale: 1.2 },
  { x: 18, z: -44, shape: 'round', color: 'pink', scale: 1.2 },
];

const GOLD_BUSHES = [
  { x: -5, z: -52, color: 'green', scale: 1.1, berries: '#ffd94a' },
  { x: 6, z: -58, color: 'lime', scale: 1.0, berries: '#ffd94a' },
  { x: -13, z: -66, color: 'green', scale: 1.15, berries: '#ffffff' },
  { x: 14, z: -74, color: 'teal', scale: 1.0, berries: '#ffd94a' },
  { x: -4, z: -84, color: 'green', scale: 1.1, berries: '#ff5a7a' },
  { x: 8, z: -90, color: 'lime', scale: 1.05, berries: '#ffd94a' },
];

const GOLD_ROCKS = [
  { x: -20, z: -56, scale: 1.0 },
  { x: 20, z: -60, scale: 0.9 },
  { x: -16, z: -76, scale: 1.1 },
  { x: 16, z: -82, scale: 0.95 },
];

/** Zones où l'on ne sème pas de fleurs en Zone 2 : socle du boss, arbres, rochers, entrée. */
function isZone2Blocked(x, z) {
  const { bossChest, entrance } = WORLD.zone2;
  if (Math.hypot(x - bossChest.x, z - bossChest.z) < 5) return true;
  if (Math.hypot(x - entrance.x, z - entrance.z) < 4) return true;
  for (const tree of SAKURA_TREES) {
    if (Math.hypot(x - tree.x, z - tree.z) < 1.6) return true;
  }
  for (const rock of GOLD_ROCKS) {
    if (Math.hypot(x - rock.x, z - rock.z) < 2.2) return true;
  }
  return false;
}

/** Dalle de pelouse émeraude (même construction que celle de la Zone 1). */
function createEmeraldLawn(width, length) {
  const geometry = new RoundedBoxGeometry(width, 1.4, length, 4, 0.5);
  const top = createToyMaterial({ map: createGrassTexture(width, length, PALETTE.grassEmerald), roughness: 0.88 });
  const side = createToyMaterial({ color: PALETTE.grassEmerald.side, roughness: 0.88 });
  const lawn = new THREE.Mesh(geometry, [side, side, top, side, side, side]);
  lawn.name = 'Zone2Lawn';
  lawn.position.y = -0.73; // 3 cm sous la pelouse de la Zone 1 (la dalle passe en dessous)
  lawn.receiveShadow = true;
  return lawn;
}

/** Portail **torii** stylisé (symbole de la Forêt Sakura) : piliers + traverses. */
function createTorii(x, z, scale = 1) {
  const group = new THREE.Group();
  const red = createToyMaterial({ color: '#e23b3b', roughness: 0.35 });
  const dark = createToyMaterial({ color: '#7a1818', roughness: 0.4 });

  const pillarGeo = new RoundedBoxGeometry(0.5, 5.4, 0.5, 4, 0.15);
  const pillarL = new THREE.Mesh(pillarGeo, red);
  pillarL.position.set(-2.3, 2.7, 0);
  pillarL.castShadow = false;
  const pillarR = new THREE.Mesh(pillarGeo, red);
  pillarR.position.set(2.3, 2.7, 0);
  pillarR.castShadow = false;

  // Kasagi : traverse supérieure (large, décalée vers l'avant).
  const topGeo = new RoundedBoxGeometry(6.0, 0.45, 0.6, 4, 0.12);
  const top = new THREE.Mesh(topGeo, dark);
  top.position.set(0, 5.3, 0.15);
  top.castShadow = false;

  // Nuki : traverse inférieure.
  const midGeo = new RoundedBoxGeometry(5.1, 0.4, 0.5, 4, 0.12);
  const mid = new THREE.Mesh(midGeo, red);
  mid.position.set(0, 3.3, 0);
  mid.castShadow = false;

  group.add(pillarL, pillarR, top, mid);
  group.position.set(x, 0, z);
  group.scale.setScalar(scale);
  group.name = 'Torii';
  return group;
}

/** Pont rouge (hashi) menant au torii : plancher + garde-corps. */
function createBridge(x, z, width = 2.6, length = 7) {
  const group = new THREE.Group();
  const wood = createToyMaterial({ color: '#8a3b2e', roughness: 0.6 });
  const red = createToyMaterial({ color: '#e23b3b', roughness: 0.4 });

  const deck = new THREE.Mesh(new RoundedBoxGeometry(width, 0.3, length, 4, 0.1), wood);
  deck.position.y = 0.9;
  deck.castShadow = false;
  deck.receiveShadow = true;
  group.add(deck);

  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(
      new RoundedBoxGeometry(0.12, 0.9, length, 3, 0.05),
      red,
    );
    rail.position.set(side * (width / 2 - 0.08), 1.5, 0);
    rail.castShadow = false;
    group.add(rail);
  }

  group.position.set(x, 0, z);
  group.name = 'Bridge';
  return group;
}

/** Pluie de **pétales roses** tombants (points animés, recréation zéro en boucle). */
function createPetalShower(bounds) {
  const count = 110;
  const rand = (min, max) => min + Math.random() * (max - min);
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const drift = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = rand(bounds.minX, bounds.maxX);
    positions[i * 3 + 1] = rand(2, 13);
    positions[i * 3 + 2] = rand(bounds.minZ, bounds.maxZ);
    speeds[i] = rand(0.7, 1.8);
    drift[i] = rand(-0.4, 0.4);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: '#ffb3d9',
    size: 0.24,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.castShadow = false;
  points.name = 'PetalShower';

  const update = (dt) => {
    const pos = geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= speeds[i] * dt;
      pos[i * 3] += drift[i] * dt + Math.sin((pos[i * 3 + 1] + i) * 0.5) * 0.2 * dt;
      if (pos[i * 3 + 1] < 0.2) {
        pos[i * 3 + 1] = 13;
        pos[i * 3] = rand(bounds.minX, bounds.maxX);
        pos[i * 3 + 2] = rand(bounds.minZ, bounds.maxZ);
      }
    }
    geometry.attributes.position.needsUpdate = true;
  };

  return { object3D: points, update };
}

/**
 * La Zone 2 : île au nord de la Zone 1, reliée par la porte.
 * Sa dalle passe sous la pelouse de la Zone 1 (aucune couture), et sa bordure
 * de pierres ne couvre que les côtés ouest / est / nord.
 */
export function createZone2() {
  const { island } = WORLD.zone2;
  const width = island.maxX - island.minX;
  const length = island.maxZ - island.minZ;
  const centerX = (island.minX + island.maxX) / 2;
  const centerZ = (island.minZ + island.maxZ) / 2;

  const group = new THREE.Group();
  group.name = 'Zone2';

  // Terrain : pelouse émeraude + falaise (centrés sur l'île).
  const lawn = createEmeraldLawn(width, length);
  lawn.position.x = centerX;
  lawn.position.z = centerZ;
  const cliff = createCliffBody(width, length, 14);
  cliff.position.set(centerX, 0, centerZ);
  const cliffRocks = createCliffRocks(width, length, 14);
  cliffRocks.position.set(centerX, 0, centerZ);
  group.add(lawn, cliff, cliffRocks);

  // Bordure de pierres (coordonnées absolues, sans côté sud).
  const border = createStoneBorder(island, { edges: ['west', 'east', 'north'], seed: 4242 });
  group.add(border.object3D);

  // Végétation sakura + buissons dorés + rochers + fleurs.
  const forest = createForest(SAKURA_TREES);
  group.add(forest.object3D);

  const bushes = createBushes(GOLD_BUSHES);
  group.add(bushes.object3D);

  const rocks = createRocks(GOLD_ROCKS);
  group.add(rocks.object3D);

  const flowers = createFlowers({
    bounds: { minX: island.minX + 2, maxX: island.maxX - 2, minZ: island.minZ + 2, maxZ: island.maxZ - 2 },
    isBlocked: isZone2Blocked,
    clusterCount: 30,
  });
  group.add(flowers.object3D);

  // Portail **torii** + pont rouge à l'entrée, pluie de pétales (éléments symboliques).
  const entrance = WORLD.zone2.entrance;
  const torii = createTorii(entrance.x, entrance.z + 3, 1.1);
  group.add(torii);
  const bridge = createBridge(entrance.x, entrance.z + 9, 2.6, 6);
  group.add(bridge);
  const petals = createPetalShower({
    minX: island.minX + 2,
    maxX: island.maxX - 2,
    minZ: island.minZ + 2,
    maxZ: island.maxZ - 2,
  });
  group.add(petals.object3D);

  return {
    object3D: group,
    colliders: [...forest.colliders, ...rocks.colliders],
    update: (dt) => {
      forest.update?.(dt);
      petals.update(dt);
    },
  };
}
