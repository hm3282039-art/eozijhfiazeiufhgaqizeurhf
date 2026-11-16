import { softConeGeometry } from '../../../graphics/geometries.js';
import { glossyMaterial } from '../../../graphics/materials.js';
import { bodyLayout, DEFAULT_BODY } from '../petAnatomy.js';
import { partMesh, pivot } from './partUtils.js';

/** Matériau « or poli » des cornes et des piques. */
function goldMaterial(color) {
  return glossyMaterial(color, { roughness: 0.32, emissive: '#7a4a00', emissiveIntensity: 0.35 });
}

/**
 * Deux GRANDES cornes dorées sur la tête, inclinées vers l'arrière et l'extérieur.
 * @returns {{ object3D: THREE.Group }}
 */
export function createDragonHorns(palette, body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('Horns');
  const geometry = softConeGeometry(0.16, 0.62, 0.05);
  const material = goldMaterial(palette.accent);

  for (const side of [-1, 1]) {
    const horn = partMesh(geometry, material, side < 0 ? 'HornLeft' : 'HornRight');
    horn.position.set(side * 0.34, layout.topY - 0.1, 0.1);
    // Inclinées vers l'arrière et légèrement courbées vers l'arrière.
    horn.rotation.set(-0.55, 0, -side * 0.5);
    group.add(horn);
  }
  return { object3D: group };
}

/**
 * Crête d'épines triangulaires le long du dos, de la nuque jusqu'à la queue.
 * @returns {{ object3D: THREE.Group, spikes: THREE.Mesh[] }}
 */
export function createDragonSpikes(palette, body = DEFAULT_BODY) {
  const layout = bodyLayout(body);
  const group = pivot('Spikes');
  const material = goldMaterial(palette.accent);

  // Piques sur le dessus du corps, de la tête vers l'arrière.
  const spikeDefs = [
    { z: -0.08, y: layout.topY - 0.03, size: 1.0, tilt: -0.25 },
    { z: -0.3, y: layout.topY - 0.05, size: 0.95, tilt: -0.5 },
    { z: -0.52, y: layout.topY - 0.07, size: 0.9, tilt: -0.7 },
    { z: -0.74, y: layout.topY - 0.08, size: 0.82, tilt: -0.9 },
  ];

  const spikes = spikeDefs.map(({ z, y, size, tilt }) => {
    const spike = partMesh(softConeGeometry(0.12, 0.3, 0.04), material, 'Spike');
    spike.position.set(0, y, z);
    spike.rotation.x = tilt;
    spike.scale.set(size * 0.7, size, size);
    group.add(spike);
    return spike;
  });

  return { object3D: group, spikes };
}
