import * as THREE from 'three';
import {
  capsuleGeometry,
  softConeGeometry,
  sphereGeometry,
  taperedTubeGeometry,
} from '../../../graphics/geometries.js';
import { glossyMaterial } from '../../../graphics/materials.js';
import { BODY_HALF_DEPTH } from '../petAnatomy.js';
import { partMesh, pivot } from './partUtils.js';

const UP = new THREE.Vector3(0, 1, 0);

/** Les tubes de queue sont identiques pour tous les pets d'une espèce : créés une seule fois. */
const tubeCache = new Map();

function getTailTube(key, points, options) {
  if (!tubeCache.has(key)) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    tubeCache.set(key, {
      geometry: taperedTubeGeometry(curve, options),
      end: curve.getPointAt(1),
      endTangent: curve.getTangentAt(1),
    });
  }
  return tubeCache.get(key);
}

/**
 * Longue queue de chat dressée en « S », terminée par un pompon clair.
 * @returns {{ object3D: THREE.Group }} le groupe pivote à la base de la queue
 */
export function createCatTail(palette) {
  const tube = getTailTube(
    'cat',
    [
      [0, 0.02, 0.1],
      [0, 0, -0.2],
      [0, 0.2, -0.43],
      [0, 0.52, -0.48],
      [0, 0.8, -0.37],
      [0, 0.98, -0.45],
    ],
    { radiusStart: 0.105, radiusEnd: 0.085, tubularSegments: 30, radialSegments: 12 },
  );

  const root = pivot('Tail', 0, 0.48, -BODY_HALF_DEPTH + 0.06);
  root.add(partMesh(tube.geometry, glossyMaterial(palette.body), 'TailTube'));

  const tip = partMesh(sphereGeometry(1, 16, 12), glossyMaterial(palette.secondary), 'TailTip');
  tip.scale.setScalar(0.13);
  tip.position.copy(tube.end);
  root.add(tip);

  return { object3D: root };
}

/**
 * Petite queue de chien dressée, faite pour remuer.
 * @returns {{ object3D: THREE.Group, wag: THREE.Group }} `wag` : pivot à faire osciller (rotation Z)
 */
export function createDogTail(palette) {
  const root = pivot('Tail', 0, 0.8, -BODY_HALF_DEPTH + 0.06);
  root.rotation.x = -0.8; // penchée vers l'arrière

  const wag = pivot('TailWag');
  root.add(wag);

  const tail = partMesh(capsuleGeometry(0.095, 0.3), glossyMaterial(palette.body), 'TailBase');
  tail.position.y = 0.2;
  wag.add(tail);

  const tip = partMesh(sphereGeometry(1, 16, 12), glossyMaterial(palette.secondary), 'TailTip');
  tip.scale.setScalar(0.118);
  tip.position.y = 0.43;
  wag.add(tip);

  return { object3D: root, wag };
}

/**
 * Queue de dragon épaisse qui s'affine, terminée par une pointe dorée.
 * @returns {{ object3D: THREE.Group }}
 */
export function createDragonTail(palette) {
  const tube = getTailTube(
    'dragon',
    [
      [0, 0.04, 0.12],
      [0, -0.03, -0.26],
      [0, 0.03, -0.56],
      [0, 0.26, -0.78],
      [0, 0.54, -0.76],
    ],
    { radiusStart: 0.21, radiusEnd: 0.075, tubularSegments: 26, radialSegments: 14 },
  );

  const root = pivot('Tail', 0, 0.42, -BODY_HALF_DEPTH + 0.1);
  root.add(partMesh(tube.geometry, glossyMaterial(palette.body), 'TailTube'));

  const spade = partMesh(
    softConeGeometry(0.16, 0.3, 0.04),
    glossyMaterial(palette.accent, { roughness: 0.35 }),
    'TailSpade',
  );
  spade.position.copy(tube.end).addScaledVector(tube.endTangent, -0.05);
  spade.quaternion.setFromUnitVectors(UP, tube.endTangent);
  root.add(spade);

  return { object3D: root };
}

/**
 * Queue de lapin : petit pompon rond et doux, posé sur le derrière.
 * @returns {{ object3D: THREE.Group }}
 */
export function createBunnyTail(palette) {
  const root = pivot('Tail', 0, 0.42, -BODY_HALF_DEPTH + 0.05);
  const pompon = partMesh(sphereGeometry(1, 18, 14), glossyMaterial(palette.secondary), 'TailPompon');
  pompon.scale.setScalar(0.2);
  pompon.position.y = 0.18;
  root.add(pompon);
  return { object3D: root };
}

/**
 * Queue de renard : longue et touffue, blanche à l'extrémité, qui pend et balance.
 * @returns {{ object3D: THREE.Group, wag: THREE.Group }} `wag` : pivot à faire osciller
 */
export function createFoxTail(palette) {
  const tube = getTailTube(
    'fox',
    [
      [0, 0.05, 0.1],
      [0, 0, -0.3],
      [0, -0.12, -0.55],
      [0, -0.3, -0.72],
    ],
    { radiusStart: 0.14, radiusEnd: 0.11, tubularSegments: 22, radialSegments: 12 },
  );

  const root = pivot('Tail', 0, 0.5, -BODY_HALF_DEPTH + 0.06);
  root.rotation.x = -0.5;

  const wag = pivot('TailWag');
  root.add(wag);
  wag.add(partMesh(tube.geometry, glossyMaterial(palette.body), 'TailTube'));

  const tip = partMesh(sphereGeometry(1, 16, 12), glossyMaterial(palette.secondary), 'TailTip');
  tip.scale.setScalar(0.15);
  tip.position.copy(tube.end);
  wag.add(tip);

  return { object3D: root, wag };
}

/**
 * Queue d'axolotl : nageoire arrière douce, qui ondule doucement.
 * @returns {{ object3D: THREE.Group }}
 */
export function createAxolotlTail(palette) {
  const tube = getTailTube(
    'axolotl',
    [
      [0, 0.02, 0.08],
      [0, -0.06, -0.2],
      [0, -0.2, -0.4],
      [0, -0.32, -0.55],
    ],
    { radiusStart: 0.13, radiusEnd: 0.18, tubularSegments: 20, radialSegments: 12 },
  );

  const root = pivot('Tail', 0, 0.4, -BODY_HALF_DEPTH + 0.05);
  const fin = partMesh(
    tube.geometry,
    glossyMaterial(palette.accent, { roughness: 0.5, transparent: true, opacity: 0.92 }),
    'TailFin',
  );
  fin.castShadow = false;
  root.add(fin);
  return { object3D: root };
}
