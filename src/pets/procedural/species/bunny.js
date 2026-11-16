import { bunnyFace } from '../faces/bunnyFace.js';
import { createBunnyEars } from '../parts/ears.js';
import { createBunnyTail } from '../parts/tails.js';
import { createBunnyMuzzle } from '../parts/muzzles.js';
import { softCylinderGeometry, sphereGeometry } from '../../../graphics/geometries.js';
import { glossyMaterial } from '../../../graphics/materials.js';
import { partMesh, pivot } from '../parts/partUtils.js';
import { bodyLayout } from '../petAnatomy.js';

/**
 * « Bunny » : corps vertical et rebondi (1.0 × 1.25 × 1.0) — deux grosses joues rondes,
 * ventre blanc bombé, deux IMMENSES oreilles (l'une pliée vers l'avant), petites dents
 * blanches en 3D, gros pompon rond.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const bunnySpecies = {
  name: 'Bunny',
  body: { width: 1.0, height: 1.25, depth: 1.0, segments: 6, radius: 0.3 },
  face: bunnyFace,

  buildParts(palette, body) {
    const layout = bodyLayout(body);
    const ears = createBunnyEars(palette, body);
    const tail = createBunnyTail(palette, body);
    const muzzle = createBunnyMuzzle(palette, body);

    // Deux grosses joues rondes en 3D sur les côtés du visage.
    const cheeks = pivot('Cheeks');
    for (const side of [-1, 1]) {
      const cheek = partMesh(sphereGeometry(1, 18, 14), glossyMaterial('#f7f3e8', { roughness: 0.4 }), 'Cheek');
      cheek.scale.set(0.24, 0.26, 0.22);
      cheek.position.set(side * (layout.halfWidth + 0.02), layout.centerY + 0.12, layout.halfDepth - 0.02);
      cheek.castShadow = false;
      cheeks.add(cheek);
    }

    // Ventre blanc bombé sur le devant.
    const belly = partMesh(softCylinderGeometry(0.36, 0.42, 0.5, 24), glossyMaterial('#f7f3e8', { roughness: 0.45 }), 'Belly');
    belly.rotation.x = Math.PI / 2;
    belly.position.set(0, layout.centerY - 0.05, layout.halfDepth + 0.14);
    belly.castShadow = false;

    return {
      objects: [ears.object3D, tail.object3D, muzzle.object3D, cheeks, belly],

      animate({ time, move, hop }) {
        // Les oreilles se penchent : l'oreille gauche est pliée vers l'avant.
        for (const [index, ear] of ears.ears.entries()) {
          const twitch = Math.max(0, Math.sin(time * 1.4 + index * 2)) ** 8;
          const fold = index === 0 ? 0.5 : 0; // une oreille pliée vers l'avant
          ear.rotation.z = Math.sin(time * 0.9) * 0.08 + hop * 0.25 * move + fold;
          ear.rotation.x = twitch * 0.08 - hop * 0.15 * move;
        }

        // Pompon qui remue.
        tail.object3D.rotation.z = Math.sin(time * 2.4) * 0.18;
      },
    };
  },
};
