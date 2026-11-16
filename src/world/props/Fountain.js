import * as THREE from 'three';
import { PALETTE } from '../../config/palette.js';
import { createToyMaterial, toyMaterial } from '../../graphics/materials.js';
import { softCylinderGeometry, sphereGeometry } from '../../graphics/geometries.js';
import { lerp } from '../../utils/math.js';

const POOL_WATER_Y = 0.62;
const BOWL_Y = 1.75;
const BOWL_WATER_Y = 2.2;
const SPOUT_TOP_Y = 3.15;

const STREAM_COUNT = 8;
const DROPS_PER_STREAM = 6;
const SPRAY_DROPS = 14;

/** Margelle du grand bassin (profil tourné autour de l'axe vertical). */
function createBasin(radius, stone) {
  const profile = [
    [radius + 0.14, 0],
    [radius + 0.14, 0.16],
    [radius + 0.02, 0.24],
    [radius, 0.62],
    [radius - 0.05, 0.78],
    [radius - 0.17, 0.87],
    [radius - 0.42, 0.87],
    [radius - 0.54, 0.78],
    [radius - 0.58, 0.6],
    [radius - 0.58, 0.2],
  ].map(([x, y]) => new THREE.Vector2(x, y));

  const basin = new THREE.Mesh(new THREE.LatheGeometry(profile, 56), stone);
  basin.castShadow = false;
  basin.receiveShadow = true;
  return basin;
}

/** Vasque supérieure, évasée comme une coupe. */
function createBowl(stone) {
  const profile = [
    [0.3, 0],
    [0.55, 0.1],
    [1.15, 0.32],
    [1.5, 0.55],
    [1.56, 0.66],
    [1.46, 0.7],
    [1.3, 0.56],
    [0.4, 0.4],
  ].map(([x, y]) => new THREE.Vector2(x, y));

  const bowl = new THREE.Mesh(new THREE.LatheGeometry(profile, 44), stone);
  bowl.position.y = BOWL_Y;
  bowl.castShadow = false;
  bowl.receiveShadow = true;
  return bowl;
}

function createWaterDisc(radius, y, material) {
  const geometry = new THREE.CircleGeometry(radius, 48);
  geometry.rotateX(-Math.PI / 2);
  const disc = new THREE.Mesh(geometry, material);
  disc.position.y = y;
  disc.receiveShadow = true;
  return disc;
}

/**
 * Fontaine de la place du spawn : grand bassin, vasque, jet central et filets d'eau animés.
 * @param {{ radius?: number }} [options]
 */
export function createFountain({ radius = 3.5 } = {}) {
  const group = new THREE.Group();
  group.name = 'Fountain';

  const stone = createToyMaterial({ color: PALETTE.stone.light, roughness: 0.7, side: THREE.DoubleSide });
  const trim = toyMaterial(PALETTE.gold, { roughness: 0.35, emissive: '#7a4a00', emissiveIntensity: 0.35 });
  const water = createToyMaterial({
    color: PALETTE.water.fountain,
    roughness: 0.12,
    transparent: true,
    opacity: 0.86,
    emissive: '#1d8fc4',
    emissiveIntensity: 0.3,
  });

  group.add(createBasin(radius, stone));
  group.add(createWaterDisc(radius - 0.5, POOL_WATER_Y, water));

  const column = new THREE.Mesh(softCylinderGeometry(0.62, BOWL_Y + 0.1, 0.14, 28), stone);
  column.castShadow = false;
  group.add(column);

  const columnRing = new THREE.Mesh(softCylinderGeometry(0.85, 0.3, 0.12, 28), trim);
  columnRing.position.y = 0.95;
  columnRing.castShadow = false;
  group.add(columnRing);

  group.add(createBowl(stone));
  group.add(createWaterDisc(1.34, BOWL_WATER_Y, water));

  const spout = new THREE.Mesh(softCylinderGeometry(0.26, SPOUT_TOP_Y - BOWL_Y - 0.3, 0.08, 20), stone);
  spout.position.y = BOWL_Y + 0.3;
  spout.castShadow = false;
  group.add(spout);

  const finial = new THREE.Mesh(sphereGeometry(1, 20, 14), trim);
  finial.scale.setScalar(0.3);
  finial.position.y = SPOUT_TOP_Y + 0.12;
  finial.castShadow = false;
  group.add(finial);

  // ── Ondes à la surface du grand bassin ────────────────────────────────────
  const rippleGeometry = new THREE.RingGeometry(0.93, 1, 56);
  rippleGeometry.rotateX(-Math.PI / 2);
  const ripples = [0, 1, 2].map((index) => {
    const ripple = new THREE.Mesh(
      rippleGeometry,
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }),
    );
    ripple.position.y = POOL_WATER_Y + 0.015;
    ripple.userData.phase = index / 3;
    group.add(ripple);
    return ripple;
  });

  // ── Gouttes : jet central + filets qui tombent de la vasque ────────────────
  const dropCount = STREAM_COUNT * DROPS_PER_STREAM + SPRAY_DROPS;
  const drops = new THREE.InstancedMesh(
    sphereGeometry(1, 10, 8),
    createToyMaterial({
      color: '#d9f7ff',
      roughness: 0.15,
      emissive: '#6fd6ff',
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.9,
    }),
    dropCount,
  );
  drops.name = 'FountainDrops';
  drops.frustumCulled = false;
  group.add(drops);

  const dummy = new THREE.Object3D();

  const update = (_dt, time) => {
    let index = 0;

    // Filets : de la lèvre de la vasque jusqu'au grand bassin.
    for (let s = 0; s < STREAM_COUNT; s++) {
      const angle = (s / STREAM_COUNT) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      for (let d = 0; d < DROPS_PER_STREAM; d++) {
        const t = (time * 0.85 + d / DROPS_PER_STREAM + s * 0.37) % 1;
        const r = lerp(1.5, 2.25, t);
        const y = lerp(BOWL_Y + 0.68, POOL_WATER_Y, t * t) + Math.sin(t * Math.PI) * 0.12;
        const size = 0.115 * (1 - t * 0.35);
        dummy.position.set(cos * r, y, sin * r);
        dummy.scale.set(size, size * 1.5, size);
        dummy.updateMatrix();
        drops.setMatrixAt(index++, dummy.matrix);
      }
    }

    // Jet central : monte du bec puis retombe en cloche dans la vasque.
    for (let d = 0; d < SPRAY_DROPS; d++) {
      const t = (time * 0.9 + d / SPRAY_DROPS) % 1;
      const angle = d * 2.399963; // angle d'or : répartition régulière autour du jet
      const r = 0.95 * t;
      const y = lerp(SPOUT_TOP_Y + 0.3, BOWL_WATER_Y, t) + Math.sin(t * Math.PI) * 1.15;
      const size = 0.1 * (1 - t * 0.3);
      dummy.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      drops.setMatrixAt(index++, dummy.matrix);
    }
    drops.instanceMatrix.needsUpdate = true;

    for (const ripple of ripples) {
      const t = (time * 0.32 + ripple.userData.phase) % 1;
      const scale = lerp(0.9, radius - 0.75, t);
      ripple.scale.set(scale, 1, scale);
      ripple.material.opacity = Math.sin(t * Math.PI) * 0.5;
    }
  };

  update(0, 0);

  return {
    object3D: group,
    update,
    colliders: [{ type: 'circle', x: 0, z: 0, radius: radius + 0.1 }],
  };
}
