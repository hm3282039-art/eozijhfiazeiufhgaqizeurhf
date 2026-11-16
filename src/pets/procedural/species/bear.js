import { bearFace } from '../faces/bearFace.js';
import { createBearEars } from '../parts/ears.js';
import { createDogTail } from '../parts/tails.js';

/**
 * « Brown Bear » : oreilles rondes sur les coins de la tête, gros museau rond,
 * queue courte qui remue.
 * @type {import('./index.js').SpeciesBuilder}
 */
export const bearSpecies = {
  face: bearFace,

  buildParts(palette) {
    const ears = createBearEars(palette);
    const tail = createDogTail(palette);

    return {
      objects: [ears.object3D, tail.object3D],

      animate({ time, move, hop }) {
        tail.wag.rotation.z = Math.sin(time * 8) * 0.4;
        for (const ear of ears.ears) {
          ear.rotation.z = Math.sin(time * 1.2 + ear.position.x * 5) * 0.06 + hop * 0.12 * move;
        }
      },
    };
  },
};
