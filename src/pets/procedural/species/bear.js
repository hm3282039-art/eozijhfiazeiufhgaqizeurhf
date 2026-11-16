import { bearFace } from '../faces/bearFace.js';
import { createBearEars } from '../parts/ears.js';
import { createDogTail } from '../parts/tails.js';
import { createBearMuzzle } from '../parts/muzzles.js';
import { sphereGeometry } from '../../../graphics/geometries.js';
import { glossyMaterial } from '../../../graphics/materials.js';
import { partMesh, pivot } from '../parts/partUtils.js';
import { bodyLayout } from '../petAnatomy.js';

/**
 * « Brown Bear » : corps très large et massif (1.4 × 1.15 × 1.2) — gros museau blanc/beige
 * en relief, grosses oreilles rondes sur les coins de la tête, grosses pattes épaisses.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const bearSpecies = {
  name: 'Bear',
  body: { width: 1.4, height: 1.15, depth: 1.2, segments: 6, radius: 0.3 },
  face: bearFace,

  buildParts(palette, body) {
    const layout = bodyLayout(body);
    const ears = createBearEars(palette, body);
    const tail = createDogTail(palette, body);
    const muzzle = createBearMuzzle(palette, body);

    // Grosses pattes épaisses (plus larges que les pattes standard).
    const paws = pivot('BigPaws');
    const pawGeometry = sphereGeometry(1, 18, 14);
    const pawMaterial = glossyMaterial(palette.body, { roughness: 0.5 });
    for (const [x, z] of [[-0.5, 0.42], [0.5, 0.42], [-0.52, -0.36], [0.52, -0.36]]) {
      const paw = partMesh(pawGeometry, pawMaterial, 'BigPaw');
      paw.scale.set(0.34, 0.22, 0.36);
      paw.position.set(x, 0.11, z);
      paws.add(paw);
    }

    return {
      objects: [ears.object3D, tail.object3D, muzzle.object3D, paws],

      animate({ time, move, hop }) {
        tail.wag.rotation.z = Math.sin(time * 8) * 0.4;
        for (const ear of ears.ears) {
          ear.rotation.z = Math.sin(time * 1.2 + ear.position.x * 5) * 0.06 + hop * 0.12 * move;
        }
      },
    };
  },
};
