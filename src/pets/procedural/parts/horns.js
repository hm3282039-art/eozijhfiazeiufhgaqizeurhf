import { softConeGeometry } from '../../../graphics/geometries.js';
import { toyMaterial } from '../../../graphics/materials.js';
import { BODY_TOP_Y } from '../petAnatomy.js';
import { partMesh, pivot } from './partUtils.js';

/** Matériau « or poli » des cornes et des piques. */
function goldMaterial(color) {
  return toyMaterial(color, { roughness: 0.32, emissive: '#7a4a00', emissiveIntensity: 0.35 });
}

/**
 * Deux petites cornes dorées sur la tête, inclinées vers l'extérieur et vers l'arrière.
 * @returns {{ object3D: THREE.Group }}
 */
export function createDragonHorns(palette) {
  const group = pivot('Horns');
  const geometry = softConeGeometry(0.125, 0.4, 0.04);
  const material = goldMaterial(palette.accent);

  for (const side of [-1, 1]) {
    const horn = partMesh(geometry, material, side < 0 ? 'HornLeft' : 'HornRight');
    horn.position.set(side * 0.31, BODY_TOP_Y - 0.075, 0.14);
    horn.rotation.set(-0.3, 0, -side * 0.42);
    group.add(horn);
  }
  return { object3D: group };
}

/**
 * Crête : petites piques dorées alignées sur le dessus, du milieu de la tête vers le dos.
 * @returns {{ object3D: THREE.Group }}
 */
export function createDragonSpikes(palette) {
  const group = pivot('Spikes');
  const material = goldMaterial(palette.accent);

  const spikes = [
    { z: -0.1, y: BODY_TOP_Y - 0.035, size: 1, tilt: -0.2 },
    { z: -0.34, y: BODY_TOP_Y - 0.06, size: 0.82, tilt: -0.5 },
  ];
  for (const { z, y, size, tilt } of spikes) {
    const spike = partMesh(softConeGeometry(0.1, 0.21, 0.035), material, 'Spike');
    spike.position.set(0, y, z);
    spike.rotation.x = tilt;
    spike.scale.set(size * 0.7, size, size);
    group.add(spike);
  }
  return { object3D: group };
}
