import * as THREE from 'three';
import { capsuleGeometry } from '../../../graphics/geometries.js';
import { glossyMaterial } from '../../../graphics/materials.js';
import { BODY_HALF_DEPTH } from '../petAnatomy.js';
import { partMesh, pivot } from './partUtils.js';

/** Position de l'extrémité de l'aile dans son plan (X = envergure, Y = hauteur). */
const TIP = { x: 0.7, y: 0.42 };
const THICKNESS = 0.05;

let membraneGeometry = null;

/** Membrane d'aile de chauve-souris : bord supérieur tendu, bord inférieur festonné, arêtes adoucies. */
function getMembraneGeometry() {
  if (membraneGeometry) return membraneGeometry;

  const shape = new THREE.Shape();
  shape.moveTo(0, -0.13);
  shape.lineTo(0, 0.1);
  shape.quadraticCurveTo(0.3, 0.44, TIP.x, TIP.y); // bord d'attaque
  shape.quadraticCurveTo(0.53, 0.24, 0.51, -0.01); // 1er feston
  shape.quadraticCurveTo(0.35, 0.05, 0.27, -0.17); // 2e feston
  shape.quadraticCurveTo(0.13, -0.04, 0, -0.13); // 3e feston

  membraneGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: THICKNESS,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.022,
    bevelSegments: 3,
    curveSegments: 10,
  });
  membraneGeometry.translate(0, 0, -THICKNESS / 2);
  return membraneGeometry;
}

/**
 * Deux petites ailes dorsales.
 * Chaque aile est construite côté droit ; la gauche est son miroir (échelle X négative).
 *
 * @returns {{ object3D: THREE.Group, wings: THREE.Group[] }}
 *   `wings` : pivots d'épaule — faire varier `rotation.z` pour battre des ailes
 */
export function createDragonWings(palette) {
  const group = pivot('Wings');
  const membraneMaterial = glossyMaterial(palette.secondary, { roughness: 0.55 });
  const boneMaterial = glossyMaterial(palette.body);

  const boneLength = Math.hypot(TIP.x, TIP.y - 0.06);
  const boneAngle = Math.atan2(TIP.y - 0.06, TIP.x);

  const wings = [-1, 1].map((side) => {
    const mirror = pivot(side < 0 ? 'WingLeft' : 'WingRight');
    mirror.scale.x = side;

    // Épaule : en haut du dos, l'aile part vers l'extérieur et un peu vers l'arrière.
    const shoulder = pivot('WingShoulder', 0.27, 0.93, -BODY_HALF_DEPTH + 0.03);
    shoulder.rotation.y = 0.5;
    mirror.add(shoulder);

    shoulder.add(partMesh(getMembraneGeometry(), membraneMaterial, 'WingMembrane'));

    // « Os » de l'aile le long du bord d'attaque.
    const bone = partMesh(capsuleGeometry(0.052, boneLength - 0.1), boneMaterial, 'WingBone');
    bone.position.set(TIP.x / 2, (TIP.y + 0.06) / 2 + 0.02, 0);
    bone.rotation.z = boneAngle - Math.PI / 2;
    shoulder.add(bone);

    group.add(mirror);
    return shoulder;
  });

  return { object3D: group, wings };
}
