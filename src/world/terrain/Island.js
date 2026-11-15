import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PALETTE } from '../../config/palette.js';
import { WORLD } from '../../config/worldConfig.js';
import { createToyMaterial, toyMaterial } from '../../graphics/materials.js';
import { roundedBoxGeometry } from '../../graphics/geometries.js';
import { createRng } from '../../utils/random.js';
import { createGrassTexture } from './grassTexture.js';

const SLAB_THICKNESS = 1.4;
/** La falaise dépasse de la pelouse et forme un rebord sur lequel reposent les pierres de bordure. */
const LEDGE = 1.3;
const LEDGE_DROP = 0.45;

/** Dalle de pelouse : herbe texturée sur le dessus, vert uni sur la tranche. */
function createLawn(width, length) {
  const geometry = new RoundedBoxGeometry(width, SLAB_THICKNESS, length, 4, 0.5);
  const top = createToyMaterial({ map: createGrassTexture(width, length), roughness: 0.88 });
  const side = toyMaterial(PALETTE.grass.side, { roughness: 0.88 });

  // Groupes de RoundedBoxGeometry : +X, −X, +Y (dessus), −Y, +Z, −Z.
  const lawn = new THREE.Mesh(geometry, [side, side, top, side, side, side]);
  lawn.name = 'Lawn';
  lawn.position.y = -SLAB_THICKNESS / 2;
  lawn.receiveShadow = true;
  return lawn;
}

/** Gros bloc de roche arrondi qui porte la pelouse et plonge dans l'eau. */
function createCliffBody(width, length, height) {
  const geometry = new RoundedBoxGeometry(width + LEDGE * 2, height, length + LEDGE * 2, 5, 2.4);
  const body = new THREE.Mesh(geometry, toyMaterial(PALETTE.stone.cliff, { roughness: 0.92 }));
  body.name = 'CliffBody';
  body.position.y = -LEDGE_DROP - height / 2;
  body.receiveShadow = true;
  return body;
}

/** Rochers arrondis accrochés aux flancs de la falaise, pour casser la silhouette du bloc. */
function createCliffRocks(width, length, height) {
  const rng = createRng(404);
  const tones = [PALETTE.stone.base, PALETTE.stone.dark, PALETTE.stone.cliff, PALETTE.stone.light]
    .map((hex) => new THREE.Color(hex));

  const halfW = width / 2 + LEDGE;
  const halfL = length / 2 + LEDGE;
  const placements = [];

  const addSide = (sideLength, toPosition, rotationY) => {
    for (let offset = -sideLength / 2 + 3; offset < sideLength / 2 - 2; offset += rng.range(5.5, 8.5)) {
      for (const level of [0.3, 0.72]) {
        if (rng.chance(0.14)) continue;
        placements.push({
          position: toPosition(offset + rng.range(-1, 1), rng.range(-0.5, 0.9)),
          y: -LEDGE_DROP - height * level + rng.range(-0.9, 0.9),
          rotationY: rotationY + rng.range(-0.22, 0.22),
          scale: [rng.range(4.5, 8), rng.range(3, 5), rng.range(3.4, 5.2)],
        });
      }
    }
  };

  addSide(length + 4, (o, out) => [halfW + out, o], Math.PI / 2); // est
  addSide(length + 4, (o, out) => [-halfW - out, o], Math.PI / 2); // ouest
  addSide(width + 4, (o, out) => [o, halfL + out], 0); // sud
  addSide(width + 4, (o, out) => [o, -halfL - out], 0); // nord

  const rocks = new THREE.InstancedMesh(
    roundedBoxGeometry(1, 1, 1, 0.26, 2),
    toyMaterial('#ffffff', { roughness: 0.92 }),
    placements.length,
  );
  rocks.name = 'CliffRocks';

  const dummy = new THREE.Object3D();
  placements.forEach((placement, index) => {
    dummy.position.set(placement.position[0], placement.y, placement.position[1]);
    dummy.rotation.set(rng.range(-0.08, 0.08), placement.rotationY, rng.range(-0.08, 0.08));
    dummy.scale.set(...placement.scale);
    dummy.updateMatrix();
    rocks.setMatrixAt(index, dummy.matrix);
    rocks.setColorAt(index, rng.pick(tones));
  });
  rocks.instanceMatrix.needsUpdate = true;
  if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
  rocks.receiveShadow = true;
  return rocks;
}

/** L'île du Hub : pelouse rectangulaire posée sur une falaise de pierre grise arrondie. */
export function createIsland() {
  const { minX, maxX, minZ, maxZ, cliffHeight } = WORLD.island;
  const width = maxX - minX;
  const length = maxZ - minZ;
  const bodyHeight = cliffHeight + 5;

  const group = new THREE.Group();
  group.name = 'Island';
  group.position.set((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
  group.add(
    createLawn(width, length),
    createCliffBody(width, length, bodyHeight),
    createCliffRocks(width, length, bodyHeight),
  );

  return { object3D: group };
}
