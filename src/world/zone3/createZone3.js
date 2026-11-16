import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PALETTE } from '../../config/palette.js';
import { WORLD } from '../../config/worldConfig.js';
import { createToyMaterial, goldMaterial, glowMaterial } from '../../graphics/materials.js';
import { createGrassTexture } from '../terrain/grassTexture.js';
import { createCliffBody, createCliffRocks } from '../terrain/Island.js';
import { createStoneBorder } from '../terrain/StoneBorder.js';
import { createRocks } from '../props/Rocks.js';

/**
 * Plan de décoration de la Zone 3 : « Mines de Cristal & Or ».
 * Sol sombre / violet, arches de pierre, cristaux géants cyan/magenta,
 * rails et piliers d'or. Toutes les coordonnées sont absolues.
 */

/** Cristaux géants (position + taille + couleur). */
const CRYSTALS = [
  { x: -12, z: -112, height: 7, color: 'cyan', scale: 1.2 },
  { x: 14, z: -116, height: 8, color: 'magenta', scale: 1.3 },
  { x: -8, z: -130, height: 6, color: 'cyan', scale: 1.0 },
  { x: 10, z: -134, height: 9, color: 'violet', scale: 1.4 },
  { x: -16, z: -140, height: 7, color: 'magenta', scale: 1.1 },
  { x: 18, z: -126, height: 6, color: 'cyan', scale: 0.9 },
];

/** Piliers d'or et arches de pierre. */
const GOLD_PILLARS = [
  { x: -22, z: -110 },
  { x: 22, z: -110 },
  { x: -22, z: -136 },
  { x: 22, z: -136 },
];

/** Rochers sombres (colliders + visuel). */
const DARK_ROCKS = [
  { x: -14, z: -120, scale: 1.1 },
  { x: 16, z: -124, scale: 0.95 },
  { x: -6, z: -140, scale: 1.0 },
  { x: 8, z: -118, scale: 1.2 },
];

/** Dalle de sol sombre / violet (même construction que les autres zones). */
function createCrystalFloor(width, length) {
  const geometry = new RoundedBoxGeometry(width, 1.4, length, 4, 0.5);
  const top = createToyMaterial({ map: createGrassTexture(width, length, PALETTE.grassCrystal), roughness: 0.9 });
  const side = createToyMaterial({ color: PALETTE.grassCrystal.side, roughness: 0.9 });
  const floor = new THREE.Mesh(geometry, [side, side, top, side, side, side]);
  floor.name = 'Zone3Floor';
  floor.position.y = -0.73;
  floor.receiveShadow = true;
  return floor;
}

/** Cristal géant : géométrie conique irrégulière + éclat. */
function createCrystal(def) {
  const group = new THREE.Group();
  group.name = 'Crystal';
  group.position.set(def.x, 0, def.z);

  const color = PALETTE.crystalMine[def.color] ?? PALETTE.crystalMine.cyan;
  const colorDark = PALETTE.crystalMine[`${def.color}Dark`] ?? PALETTE.crystalMine.cyanDark;
  const height = def.height;

  // Cristal principal : cône allongé, segments irréguliers.
  const crystal = new THREE.Mesh(
    new THREE.ConeGeometry(1.1 * def.scale, height, 7, 1),
    createToyMaterial({
      color,
      roughness: 0.2,
      metalness: 0.3,
      emissive: color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.92,
    }),
  );
  crystal.position.y = height / 2;
  crystal.castShadow = false;
  group.add(crystal);

  // Pic secondaire (inclinaison).
  const secondary = new THREE.Mesh(
    new THREE.ConeGeometry(0.6 * def.scale, height * 0.6, 6, 1),
    createToyMaterial({
      color: colorDark,
      roughness: 0.25,
      emissive: colorDark,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9,
    }),
  );
  secondary.position.set(0.5 * def.scale, height * 0.35, 0.3 * def.scale);
  secondary.rotation.set(0.3, 0.5, 0.2);
  secondary.castShadow = false;
  group.add(secondary);

  // Halo lumineux au pied du cristal.
  const glowGeometry = new THREE.PlaneGeometry(1, 1);
  glowGeometry.rotateX(-Math.PI / 2);
  const glow = new THREE.Mesh(glowGeometry, glowMaterial(color, { opacity: 0.5 }));
  glow.position.y = 0.05;
  glow.scale.set(def.scale * 2.2, 1, def.scale * 2.2);
  group.add(glow);

  // Éclat orbital (sprites).
  const sparkleCount = 4;
  for (let i = 0; i < sparkleCount; i++) {
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
    );
    sprite.userData = { angle: (i / sparkleCount) * Math.PI * 2, radius: def.scale * 1.5, speed: 0.3 + i * 0.05, height: height * 0.5 };
    sprite.scale.setScalar(0.5);
    group.add(sprite);
  }

  const update = (_dt, time) => {
    for (const child of group.children) {
      if (child.isSprite) {
        const data = child.userData;
        const angle = data.angle + time * data.speed;
        child.position.set(Math.cos(angle) * data.radius, data.height + Math.sin(time * 1.5) * 0.3, Math.sin(angle) * data.radius);
        child.material.opacity = 0.4 + 0.4 * Math.abs(Math.sin(time * 2 + data.angle));
      }
    }
    // Pulsation du halo.
    const pulse = 0.9 + Math.sin(time * 1.8) * 0.1;
    glow.scale.set(def.scale * 2.2 * pulse, 1, def.scale * 2.2 * pulse);
  };

  return { object3D: group, update };
}

/** Pilier d'or (colonne décorative). */
function createGoldPillar(x, z) {
  const group = new THREE.Group();
  group.name = 'GoldPillar';
  group.position.set(x, 0, z);

  const pillar = new THREE.Mesh(
    new RoundedBoxGeometry(0.9, 5, 0.9, 4, 0.15),
    goldMaterial({ roughness: 0.35, emissive: '#7a4a00', emissiveIntensity: 0.3 }),
  );
  pillar.position.y = 2.5;
  pillar.castShadow = false;
  pillar.receiveShadow = true;
  group.add(pillar);

  const cap = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.9, 0.4, 16),
    createToyMaterial({ color: PALETTE.gold, roughness: 0.3, emissive: '#7a4a00', emissiveIntensity: 0.4 }),
  );
  cap.position.y = 5.2;
  cap.castShadow = false;
  group.add(cap);

  return group;
}

/** Arche de pierre (passage décoratif). */
function createStoneArch(x, z, span) {
  const group = new THREE.Group();
  group.name = 'StoneArch';
  group.position.set(x, 0, z);

  const pillarGeo = new RoundedBoxGeometry(0.7, 4.5, 0.7, 4, 0.12);
  const stoneMat = createToyMaterial({ color: PALETTE.stone.dark, roughness: 0.85 });

  const left = new THREE.Mesh(pillarGeo, stoneMat);
  left.position.set(-span / 2, 2.25, 0);
  left.castShadow = false;
  left.receiveShadow = true;
  group.add(left);

  const right = new THREE.Mesh(pillarGeo, stoneMat);
  right.position.set(span / 2, 2.25, 0);
  right.castShadow = false;
  right.receiveShadow = true;
  group.add(right);

  // Sommet de l'arche (demi-cylindre).
  const top = new THREE.Mesh(
    new THREE.CylinderGeometry(span / 2, span / 2, 0.7, 24, 1, false, 0, Math.PI),
    stoneMat,
  );
  top.rotation.z = Math.PI / 2;
  top.rotation.y = Math.PI / 2;
  top.position.set(0, 4.5, 0);
  top.castShadow = false;
  group.add(top);

  return group;
}

/**
 * La Zone 3 : « Mines de Cristal & Or », île au nord de la Zone 2.
 * @returns {{ object3D: THREE.Group, colliders: object[], update: Function }}
 */
export function createZone3() {
  const { island } = WORLD.zone3;
  const width = island.maxX - island.minX;
  const length = island.maxZ - island.minZ;
  const centerX = (island.minX + island.maxX) / 2;
  const centerZ = (island.minZ + island.maxZ) / 2;

  const group = new THREE.Group();
  group.name = 'Zone3';

  // Terrain : sol sombre / violet + falaise.
  const floor = createCrystalFloor(width, length);
  floor.position.x = centerX;
  floor.position.z = centerZ;
  const cliff = createCliffBody(width, length, 14);
  cliff.position.set(centerX, 0, centerZ);
  const cliffRocks = createCliffRocks(width, length, 14);
  cliffRocks.position.set(centerX, 0, centerZ);
  group.add(floor, cliff, cliffRocks);

  // Bordure de pierres (sans côté sud, comme la Zone 2).
  const border = createStoneBorder(island, { edges: ['west', 'east', 'north'], seed: 9090 });
  group.add(border.object3D);

  // Cristaux géants.
  const crystals = CRYSTALS.map(createCrystal);
  for (const crystal of crystals) group.add(crystal.object3D);

  // Piliers d'or + arches.
  for (const pillar of GOLD_PILLARS) group.add(createGoldPillar(pillar.x, pillar.z));
  group.add(createStoneArch(0, -120, 6));
  group.add(createStoneArch(-10, -136, 5));
  group.add(createStoneArch(10, -136, 5));

  // Rochers sombres (colliders).
  const rocks = createRocks(DARK_ROCKS);
  group.add(rocks.object3D);

  // Fusion des mises à jour des cristaux.
  const updaters = crystals.map((c) => c.update).filter(Boolean);

  return {
    object3D: group,
    colliders: [...rocks.colliders],
    update: (dt, time) => {
      for (const update of updaters) update(dt, time);
    },
  };
}
