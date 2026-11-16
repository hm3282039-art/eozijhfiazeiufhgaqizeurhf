import * as THREE from 'three';
import { PALETTE } from '../../config/palette.js';
import { WORLD } from '../../config/worldConfig.js';
import { toyMaterial } from '../../graphics/materials.js';
import { roundedBoxGeometry } from '../../graphics/geometries.js';
import { createRng } from '../../utils/random.js';

/** Distance entre le bord de la pelouse et l'axe de la rangée de pierres. */
const INSET = 0.7;
/** Les pierres s'enfoncent dans le rebord de la falaise. */
const SINK = 0.55;

/**
 * Bordure d'île : une rangée de grosses pierres grises arrondies, de tailles variées,
 * avec quelques pierres plus petites posées par-dessus.
 *
 * @param {{ minX: number, maxX: number, minZ: number, maxZ: number }} bounds limites de la pelouse
 * @param {{
 *   gateGap?: { center: number, halfWidth: number } | null,   ouverture sur le côté nord (la porte)
 *   edges?: ('north' | 'south' | 'west' | 'east')[],          côtés à border (défaut : les 4)
 *   seed?: number,
 * }} [options]
 */
export function createStoneBorder(bounds = WORLD.island, { gateGap = null, edges = ['north', 'south', 'west', 'east'], seed = 1337 } = {}) {
  const { minX, maxX, minZ, maxZ } = bounds;
  const rng = createRng(seed);
  const stones = [];

  /**
   * Remplit un segment [from, to] avec des pierres de longueur aléatoire.
   * @param {(along: number, across: number) => [number, number]} toWorld (position le long du segment, décalage latéral) → [x, z]
   */
  const addRow = (from, to, toWorld, rotationY) => {
    let cursor = from;
    while (cursor < to - 0.4) {
      const remaining = to - cursor;
      let length = rng.range(2.3, 3.6);
      if (remaining - length < 1.4) length = remaining;

      const height = rng.range(1.55, 2.35);
      const depth = rng.range(2.05, 2.55);
      const [x, z] = toWorld(cursor + length / 2, rng.range(-0.12, 0.12));
      const yaw = rotationY + rng.range(-0.05, 0.05);

      stones.push({ x, y: height / 2 - SINK, z, yaw, scale: [length + 0.3, height, depth] });

      // Petite pierre posée sur la grosse, de temps en temps.
      if (rng.chance(0.3) && length > 2.4) {
        const [tx, tz] = toWorld(cursor + length / 2 + rng.range(-0.5, 0.5), rng.range(-0.25, 0.25));
        stones.push({
          x: tx,
          y: height - SINK + 0.22,
          z: tz,
          yaw: rotationY + rng.range(-0.3, 0.3),
          scale: [length * rng.range(0.45, 0.62), rng.range(0.8, 1.1), depth * rng.range(0.55, 0.75)],
        });
      }
      cursor += length;
    }
  };

  const north = minZ + INSET;
  const south = maxZ - INSET;
  const west = minX + INSET;
  const east = maxX - INSET;

  if (edges.includes('north')) {
    if (gateGap) {
      addRow(minX - 0.4, gateGap.center - gateGap.halfWidth, (along, across) => [along, north + across], 0);
      addRow(gateGap.center + gateGap.halfWidth, maxX + 0.4, (along, across) => [along, north + across], 0);
    } else {
      addRow(minX - 0.4, maxX + 0.4, (along, across) => [along, north + across], 0);
    }
  }
  if (edges.includes('south')) addRow(minX - 0.4, maxX + 0.4, (along, across) => [along, south + across], 0);
  if (edges.includes('west')) addRow(minZ + 1.6, maxZ - 1.6, (along, across) => [west + across, along], Math.PI / 2);
  if (edges.includes('east')) addRow(minZ + 1.6, maxZ - 1.6, (along, across) => [east + across, along], Math.PI / 2);

  const mesh = new THREE.InstancedMesh(
    roundedBoxGeometry(1, 1, 1, 0.24, 2),
    toyMaterial('#ffffff', { roughness: 0.82 }),
    stones.length,
  );
  mesh.name = 'StoneBorder';

  const tones = [PALETTE.stone.base, PALETTE.stone.base, PALETTE.stone.light, PALETTE.stone.dark]
    .map((hex) => new THREE.Color(hex));
  const dummy = new THREE.Object3D();

  stones.forEach((stone, index) => {
    dummy.position.set(stone.x, stone.y, stone.z);
    dummy.rotation.set(rng.range(-0.035, 0.035), stone.yaw, rng.range(-0.035, 0.035));
    dummy.scale.set(...stone.scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    mesh.setColorAt(index, rng.pick(tones));
  });

  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;

  return { object3D: mesh };
}
