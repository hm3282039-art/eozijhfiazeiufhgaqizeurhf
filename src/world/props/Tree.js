import * as THREE from 'three';
import { PALETTE } from '../../config/palette.js';
import { toyMaterial } from '../../graphics/materials.js';
import { cylinderGeometry, roundedBoxGeometry, sphereGeometry } from '../../graphics/geometries.js';
import { mergeStaticMeshes } from '../../graphics/mergeMeshes.js';
import { createRng } from '../../utils/random.js';

const TRUNK_HEIGHT = 2.7;

function createTrunk(rng) {
  const trunk = new THREE.Mesh(
    cylinderGeometry(0.3, 0.46, TRUNK_HEIGHT, 14),
    toyMaterial(rng.chance(0.5) ? PALETTE.wood.trunk : PALETTE.wood.trunkDark, { roughness: 0.85 }),
  );
  trunk.position.y = TRUNK_HEIGHT / 2;
  trunk.castShadow = false;
  trunk.receiveShadow = true;
  return trunk;
}

function addBlob(parent, geometry, material, position, scale, rotationY = 0) {
  const blob = new THREE.Mesh(geometry, material);
  blob.position.set(...position);
  blob.scale.set(...scale);
  blob.rotation.y = rotationY;
  blob.castShadow = false;
  blob.receiveShadow = true;
  parent.add(blob);
  return blob;
}

/** Feuillage « boules » : une grosse sphère entourée de sphères plus petites. */
function buildRoundFoliage(foliage, shades, rng) {
  const geometry = sphereGeometry(1, 22, 16);
  const [main, light, dark] = shades.map((hex) => toyMaterial(hex, { roughness: 0.8 }));

  addBlob(foliage, geometry, main, [0, 1.25, 0], [1.75, 1.55, 1.75]);
  addBlob(foliage, geometry, light, [0.15, 2.45, -0.1], [1.15, 1.05, 1.15]);

  const count = 4;
  const startAngle = rng.range(0, Math.PI * 2);
  for (let i = 0; i < count; i++) {
    const angle = startAngle + (i / count) * Math.PI * 2 + rng.range(-0.25, 0.25);
    const size = rng.range(0.95, 1.25);
    addBlob(
      foliage,
      geometry,
      i % 2 === 0 ? dark : main,
      [Math.cos(angle) * 1.25, rng.range(0.55, 1.15), Math.sin(angle) * 1.25],
      [size, size * 0.92, size],
    );
  }
}

/** Feuillage « cubes » : trois cubes très arrondis empilés, du plus grand au plus petit. */
function buildCubeFoliage(foliage, shades, rng) {
  const geometry = roundedBoxGeometry(1, 1, 1, 0.26, 4);
  const [main, light, dark] = shades.map((hex) => toyMaterial(hex, { roughness: 0.8 }));

  addBlob(foliage, geometry, dark, [0, 0.75, 0], [3.1, 1.75, 3.1], rng.range(-0.2, 0.2));
  addBlob(foliage, geometry, main, [0, 1.95, 0], [2.35, 1.5, 2.35], rng.range(0.25, 0.6));
  addBlob(foliage, geometry, light, [0, 3.0, 0], [1.55, 1.25, 1.55], rng.range(-0.5, -0.15));
}

/**
 * Crée un arbre style PS99 : tronc cylindrique marron + feuillage en sphères ou en cubes arrondis.
 * @param {{ shape?: 'round' | 'cube', color?: keyof PALETTE['foliage'], scale?: number, seed?: number }} options
 */
export function createTree({ shape = 'round', color = 'green', scale = 1, seed = 1 } = {}) {
  const rng = createRng(seed);
  const tree = new THREE.Group();
  tree.name = `Tree(${shape}, ${color})`;

  tree.add(createTrunk(rng));

  // Le feuillage pivote autour du haut du tronc : c'est lui qui se balance dans le vent.
  const blobs = new THREE.Group();
  blobs.name = 'Foliage';
  blobs.position.y = TRUNK_HEIGHT - 0.25;
  const shades = PALETTE.foliage[color] ?? PALETTE.foliage.green;
  if (shape === 'cube') buildCubeFoliage(blobs, shades, rng);
  else buildRoundFoliage(blobs, shades, rng);

  // Les boules d'un même arbre bougent d'un bloc : on les fusionne par teinte.
  const foliage = mergeStaticMeshes(blobs);
  tree.add(foliage);

  tree.scale.setScalar(scale);
  tree.rotation.y = rng.range(0, Math.PI * 2);

  return { object3D: tree, foliage, swayPhase: rng.range(0, Math.PI * 2), swaySpeed: rng.range(0.75, 1.15) };
}

/**
 * Plante tous les arbres décrits dans le plan du hub et anime leur balancement.
 * @param {Array<{ x: number, z: number, shape?: string, color?: string, scale?: number }>} layout
 */
export function createForest(layout) {
  const group = new THREE.Group();
  group.name = 'Forest';
  const colliders = [];

  const trees = layout.map((spec, index) => {
    const tree = createTree({ ...spec, seed: 1000 + index * 17 });
    tree.object3D.position.set(spec.x, 0, spec.z);
    group.add(tree.object3D);
    colliders.push({ type: 'circle', x: spec.x, z: spec.z, radius: 0.62 * (spec.scale ?? 1) });
    return tree;
  });

  return {
    object3D: group,
    colliders,
    update(_dt, time) {
      for (const tree of trees) {
        const t = time * tree.swaySpeed + tree.swayPhase;
        tree.foliage.rotation.z = Math.sin(t) * 0.03;
        tree.foliage.rotation.x = Math.cos(t * 0.8) * 0.024;
      }
    },
  };
}
