import * as THREE from 'three';
import { sphereGeometry } from '../../graphics/geometries.js';
import { mergeStaticMeshes } from '../../graphics/mergeMeshes.js';
import { createRng } from '../../utils/random.js';

const CLOUD_COUNT = 13;
const WRAP_DISTANCE = 300;

/** Un nuage = quelques sphères blanches aplaties qui se chevauchent. */
function createCloud(rng, material) {
  const cloud = new THREE.Group();
  const geometry = sphereGeometry(1, 16, 12);
  const puffCount = rng.int(4, 6);

  for (let i = 0; i < puffCount; i++) {
    const puff = new THREE.Mesh(geometry, material);
    const t = puffCount === 1 ? 0 : i / (puffCount - 1) - 0.5;
    const size = rng.range(3.2, 5.4) * (1 - Math.abs(t) * 0.55);
    puff.position.set(t * 13 + rng.range(-0.8, 0.8), rng.range(-0.3, 1.3), rng.range(-2, 2));
    puff.scale.set(size * 1.25, size * 0.8, size);
    cloud.add(puff);
  }
  // Un seul maillage par nuage (il dérive d'un bloc).
  return mergeStaticMeshes(cloud);
}

/** Nuages « cartoon » qui dérivent doucement au-dessus de l'île. */
export function createClouds() {
  const rng = createRng(2024);
  const group = new THREE.Group();
  group.name = 'Clouds';

  const material = new THREE.MeshLambertMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.42,
  });

  const clouds = [];
  for (let i = 0; i < CLOUD_COUNT; i++) {
    const cloud = createCloud(rng, material);
    cloud.position.set(
      rng.range(-WRAP_DISTANCE, WRAP_DISTANCE),
      rng.range(38, 70),
      rng.range(-260, 110),
    );
    cloud.scale.setScalar(rng.range(1.2, 2.6));
    cloud.rotation.y = rng.range(-0.3, 0.3);
    group.add(cloud);
    clouds.push({ object: cloud, speed: rng.range(0.7, 1.9) });
  }

  return {
    object3D: group,
    update(dt) {
      for (const cloud of clouds) {
        cloud.object.position.x += cloud.speed * dt;
        if (cloud.object.position.x > WRAP_DISTANCE) cloud.object.position.x = -WRAP_DISTANCE;
      }
    },
  };
}
