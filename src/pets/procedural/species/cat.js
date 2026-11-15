import { catFace } from '../faces/catFace.js';
import { createCatEars } from '../parts/ears.js';
import { createCatTail } from '../parts/tails.js';

/**
 * « Starter Cat » : oreilles pointues, longue queue, moustaches et bouche en « W ».
 * @type {import('./index.js').SpeciesBuilder}
 */
export const catSpecies = {
  face: catFace,

  buildParts(palette) {
    const ears = createCatEars(palette);
    const tail = createCatTail(palette);

    return {
      objects: [ears.object3D, tail.object3D],

      animate({ time, move, hop }) {
        // La queue ondule lentement et « traîne » un peu pendant les sauts.
        tail.object3D.rotation.z = Math.sin(time * 2.3) * 0.2;
        tail.object3D.rotation.x = Math.sin(time * 1.6) * 0.07 - hop * 0.28 * move;

        // Petits frémissements d'oreilles, de temps en temps.
        ears.ears.forEach((ear, index) => {
          const twitch = Math.max(0, Math.sin(time * 1.1 + index * 2.4)) ** 14;
          ear.rotation.z = ear.userData.restZ * (1 + twitch * 1.1 + hop * 0.5 * move);
        });
      },
    };
  },
};
