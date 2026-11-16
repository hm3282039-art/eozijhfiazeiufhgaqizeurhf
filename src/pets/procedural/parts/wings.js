import * as THREE from 'three';
import { capsuleGeometry } from '../../../graphics/geometries.js';
import { glossyMaterial } from '../../../graphics/materials.js';
import { bodyLayout, DEFAULT_BODY } from '../petAnatomy.js';
import { partMesh, pivot } from './partUtils.js';

/** Position de l'extrémité de l'aile dans son plan (X = envergure, Y = hauteur). */
const TIP = { x: 1.05, y: 0.62 };
const THICKNESS = 0.06;

let membraneGeometry = null;

/** Membrane d'aile de dragon : bord supérieur tendu, bord inférieur festonné, arêtes adoucies. */
function getMembraneGeometry() {
  if (membraneGeometry) return membraneGeometry;

  const shape = new THREE.Shape();
  shape.moveTo(0, -0.16);
  shape.lineTo(0, 0.12);
  shape.quadraticCurveTo(0.42, 0.62, TIP.x, TIP.y); // bord d'attaque
  shape.quadraticCurveTo(0.78, 0.34, 0.74, -0.02); // 1er feston
  shape.quadraticCurveTo(0.5, 0.06, 0.38, -0.24); // 2e feston
  shape.quadraticCurveTo(0.2, -0.06, 0, -0.16); // 3e feston

  membraneGeometry = new THREE.ExtrudeGeometry(shape, {
    depth: THICKNESS,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 3,
    curveSegments: 12,
  });
  membraneGeometry.translate(0, 0, -THICKNESS / 2);
  return membraneGeometry;
}

/**
 * Deux GRANDES ailes de dragon déployées sur les côtés.
 * Chaque aile : membrane + os articulés le long du bord d'attaque, qui battent vraiment.
 *
 * @returns {{ object3D: THREE.Group, wings: THREE.Group[] }}
 *   `wings` : pivots d'épaule — faire varier `rotation.z` pour battre des ailes
 */
export function createDragonWings(palette, body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('Wings');
  const membraneMaterial = glossyMaterial(palette.secondary, { roughness: 0.55, emissive: palette.accent, emissiveIntensity: 0.12 });
  const boneMaterial = glossyMaterial(palette.body);

  const boneLength = Math.hypot(TIP.x, TIP.y - 0.06);
  const boneAngle = Math.atan2(TIP.y - 0.06, TIP.x);

  const wings = [-1, 1].map((side) => {
    const mirror = pivot(side < 0 ? 'WingLeft' : 'WingRight');
    mirror.scale.x = side;

    // Épaule : en haut du dos, l'aile part vers l'extérieur et un peu vers l'arrière.
    const shoulder = pivot('WingShoulder', 0.3, layout.topY - 0.05, -layout.halfDepth + 0.03);
    shoulder.rotation.y = 0.5;
    mirror.add(shoulder);

    shoulder.add(partMesh(getMembraneGeometry(), membraneMaterial, 'WingMembrane'));

    // Os de l'aile le long du bord d'attaque (articulé au pivot pour battre).
    const bone = partMesh(capsuleGeometry(0.06, boneLength - 0.1), boneMaterial, 'WingBone');
    bone.position.set(TIP.x / 2, (TIP.y + 0.06) / 2 + 0.02, 0);
    bone.rotation.z = boneAngle - Math.PI / 2;
    shoulder.add(bone);

    // Second os (ménisque) pour l'articulation du bord.
    const bone2 = partMesh(capsuleGeometry(0.04, boneLength * 0.6), boneMaterial, 'WingBone2');
    bone2.position.set(TIP.x * 0.72, TIP.y * 0.55, 0);
    bone2.rotation.z = boneAngle - Math.PI / 2 - 0.3;
    shoulder.add(bone2);

    group.add(mirror);
    return shoulder;
  });

  return { object3D: group, wings };
}
