import { sharkFace } from '../faces/sharkFace.js';
import { createSharkFin, createSharkJaw, createSharkPectoralFins } from '../parts/fins.js';
import { createAxolotlTail } from '../parts/tails.js';
import { softCylinderGeometry } from '../../../graphics/geometries.js';
import { glossyMaterial } from '../../../graphics/materials.js';
import { partMesh, pivot } from '../parts/partUtils.js';
import { bodyLayout } from '../petAnatomy.js';

/**
 * « Shark » : corps fuselé aérodynamique — grand aileron dorsal triangulaire, deux
 * nageoires pectorales sur les côtés, queue verticale à l'arrière, mâchoire blanche dentée.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const sharkSpecies = {
  name: 'Shark',
  body: { width: 0.95, height: 0.75, depth: 1.5, segments: 6, radius: 0.24 },
  face: sharkFace,

  buildParts(palette, body) {
    const layout = bodyLayout(body);
    const fin = createSharkFin(palette, body);
    const pectorals = createSharkPectoralFins(palette, body);
    const jaw = createSharkJaw(palette, body);
    // Queue verticale (double nageoire caudale) à l'arrière.
    const tail = createAxolotlTail(palette, body);
    tail.object3D.rotation.y = Math.PI / 2;

    // Corps fuselé : la silhouette vient du corps étiré + un ventre plus clair.
    const belly = partMesh(
      softCylinderGeometry(0.3, 0.24, 0.9, 20),
      glossyMaterial('#e8eef6', { roughness: 0.4 }),
      'Belly',
    );
    belly.rotation.x = Math.PI / 2;
    belly.position.set(0, layout.centerY - 0.06, -layout.halfDepth * 0.1);
    belly.scale.set(1.1, 1, 1);
    belly.castShadow = false;

    return {
      objects: [fin.object3D, pectorals.object3D, jaw.object3D, tail.object3D, belly],

      animate({ time, move, hop }) {
        fin.object3D.rotation.x = -0.18 + Math.sin(time * 2.4) * 0.05;
        pectorals.fins.forEach((finGroup, index) => {
          finGroup.rotation.y = Math.sin(time * 2.2 + index * 1.4) * 0.2;
        });
        // Nage : queue qui ondule plus fort en déplacement.
        tail.object3D.rotation.z = Math.sin(time * 5 * (0.5 + move)) * 0.35;
        tail.object3D.rotation.x = Math.sin(time * 3.2) * 0.07 + hop * 0.1 * move;
      },
    };
  },
};
