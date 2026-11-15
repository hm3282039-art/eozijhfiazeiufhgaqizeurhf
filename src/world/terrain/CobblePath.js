import * as THREE from 'three';
import { PALETTE } from '../../config/palette.js';
import { WORLD } from '../../config/worldConfig.js';
import { toyMaterial } from '../../graphics/materials.js';
import { roundedBoxGeometry } from '../../graphics/geometries.js';
import { createRng } from '../../utils/random.js';

/** Le dessus des pavés affleure presque la pelouse : on marche dessus sans « marche ». */
const STONE_TOP = 0.05;
const STONE_THICKNESS = 0.12;
const BASE_THICKNESS = 0.04;
const GAP = 0.13;

/** Pavés rectangulaires du chemin, posés en quinconce (comme un mur de briques vu de dessus). */
function layPathStones(rng, stones) {
  const { halfWidth, startZ, endZ } = WORLD.path;
  const { plaza } = WORLD;
  const rowDepth = 1.02;
  const stoneWidth = 1.36;

  let row = 0;
  for (let z = startZ + 2.5; z > endZ + rowDepth * 0.5; z -= rowDepth, row++) {
    const shift = row % 2 === 0 ? 0 : stoneWidth / 2;
    for (let left = -halfWidth - shift; left < halfWidth; left += stoneWidth) {
      // Les pavés de bord sont coupés pour garder un chemin bien droit.
      const x0 = Math.max(left, -halfWidth);
      const x1 = Math.min(left + stoneWidth, halfWidth);
      const width = x1 - x0 - GAP;
      if (width < 0.4) continue;

      const x = (x0 + x1) / 2;
      if (Math.hypot(x - plaza.x, z - plaza.z) < plaza.radius + 0.35) continue;

      stones.push({ x, z, yaw: rng.range(-0.025, 0.025), width, depth: rowDepth - GAP });
    }
  }
}

/** Pavés de la place du spawn, disposés en anneaux concentriques autour de la fontaine. */
function layPlazaStones(rng, stones) {
  const { plaza, fountain } = WORLD;
  const ringDepth = 1.04;

  let ring = 0;
  for (let radius = fountain.radius + 0.75; radius <= plaza.radius - 0.4; radius += ringDepth, ring++) {
    const count = Math.round((Math.PI * 2 * radius) / 1.45);
    const arc = (Math.PI * 2 * radius) / count;
    const phase = ring % 2 === 0 ? 0 : Math.PI / count;

    for (let i = 0; i < count; i++) {
      const angle = phase + (i / count) * Math.PI * 2;
      stones.push({
        x: plaza.x + Math.cos(angle) * radius,
        z: plaza.z + Math.sin(angle) * radius,
        yaw: Math.PI / 2 - angle + rng.range(-0.02, 0.02),
        width: arc - GAP,
        depth: ringDepth - GAP,
      });
    }
  }
}

/** Chemin central en pavés jaunes/beiges + place ronde du spawn. */
export function createCobblePath() {
  const { path, plaza } = WORLD;
  const rng = createRng(555);
  const group = new THREE.Group();
  group.name = 'CobblePath';

  // Lit de sable sous les pavés (visible dans les joints).
  const baseMaterial = toyMaterial(PALETTE.path.base, { roughness: 0.95 });
  const stripLength = path.startZ + 3 - path.endZ;
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(path.halfWidth * 2 + 0.5, BASE_THICKNESS, stripLength),
    baseMaterial,
  );
  strip.position.set(0, 0, path.endZ + stripLength / 2);
  strip.receiveShadow = true;

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(plaza.radius + 0.28, plaza.radius + 0.28, BASE_THICKNESS, 72),
    baseMaterial,
  );
  disc.position.set(plaza.x, 0, plaza.z);
  disc.receiveShadow = true;
  group.add(strip, disc);

  const stones = [];
  layPathStones(rng, stones);
  layPlazaStones(rng, stones);

  // Pavés plats vus de dessus : un arrondi minimal suffit (≈ 400 pavés → géométrie légère).
  const mesh = new THREE.InstancedMesh(
    roundedBoxGeometry(1, 1, 1, 0.2, 1),
    toyMaterial('#ffffff', { roughness: 0.78 }),
    stones.length,
  );
  mesh.name = 'Cobblestones';

  const tones = PALETTE.path.stones.map((hex) => new THREE.Color(hex));
  const dummy = new THREE.Object3D();
  stones.forEach((stone, index) => {
    dummy.position.set(stone.x, STONE_TOP - STONE_THICKNESS / 2 + rng.range(-0.008, 0.008), stone.z);
    dummy.rotation.set(0, stone.yaw, 0);
    dummy.scale.set(stone.width, STONE_THICKNESS, stone.depth);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
    mesh.setColorAt(index, rng.pick(tones));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.receiveShadow = true;
  group.add(mesh);

  return { object3D: group };
}
