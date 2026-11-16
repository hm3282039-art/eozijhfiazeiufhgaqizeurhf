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
