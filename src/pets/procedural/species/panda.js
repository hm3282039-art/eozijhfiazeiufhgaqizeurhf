import { pandaFace } from '../faces/pandaFace.js';
import { createBearEars } from '../parts/ears.js';
import { createDogTail } from '../parts/tails.js';

/**
 * « Panda » : comme l'ours, mais avec des taches autour des yeux.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const pandaSpecies = {
  face: pandaFace,

  buildParts(palette) {
    const ears = createBearEars(palette);
    const tail = createDogTail(palette);

    return {
      objects: [ears.object3D, tail.object3D],

      animate({ time, move, hop }) {
        tail.wag.rotation.z = Math.sin(time * 7) * 0.36;
        for (const ear of ears.ears) {
          ear.rotation.z = Math.sin(time * 1.3 + ear.position.x * 5) * 0.05 + hop * 0.1 * move;
        }
      },
    };
  },
};
