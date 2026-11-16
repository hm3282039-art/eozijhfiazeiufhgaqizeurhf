import * as THREE from 'three';
import { PALETTE } from '../../config/palette.js';
import { toyMaterial } from '../../graphics/materials.js';
import { roundedBoxGeometry } from '../../graphics/geometries.js';
import { createRng } from '../../utils/random.js';

/** Un rocher = un gros galet arrondi + un ou deux petits galets collés contre lui. */
function createRock(rng) {
  const rock = new THREE.Group();
  rock.name = 'Rock';
  const geometry = roundedBoxGeometry(1, 1, 1, 0.3, 4);
  const tones = [PALETTE.stone.base, PALETTE.stone.light, PALETTE.stone.dark];

  const addStone = (x, z, size) => {
    const stone = new THREE.Mesh(geometry, toyMaterial(rng.pick(tones), { roughness: 0.82 }));
    stone.scale.set(size * rng.range(1.15, 1.5), size * rng.range(0.75, 1.0), size * rng.range(1.0, 1.3));
    stone.position.set(x, stone.scale.y * 0.36, z);
    stone.rotation.set(rng.range(-0.1, 0.1), rng.range(0, Math.PI), rng.range(-0.1, 0.1));
    stone.castShadow = false;
    stone.receiveShadow = true;
    rock.add(stone);
  };

  addStone(0, 0, 1.25);
  addStone(rng.range(0.85, 1.05), rng.range(-0.4, 0.4), 0.7);
  if (rng.chance(0.6)) addStone(rng.range(-0.95, -0.75), rng.range(0.2, 0.7), 0.52);
  return rock;
}

/**
 * @param {Array<{ x: number, z: number, scale?: number }>} layout
 */
export function createRocks(layout) {
  const group = new THREE.Group();
  group.name = 'Rocks';
  const colliders = [];

  layout.forEach((spec, index) => {
    const rng = createRng(600 + index * 7);
    const scale = spec.scale ?? 1;
    const rock = createRock(rng);
    rock.position.set(spec.x, 0, spec.z);
    rock.rotation.y = rng.range(0, Math.PI * 2);
    rock.scale.setScalar(scale);
    group.add(rock);
    colliders.push({ type: 'circle', x: spec.x, z: spec.z, radius: 1.0 * scale });
  });

  return { object3D: group, colliders };
}
